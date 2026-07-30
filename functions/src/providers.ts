// functions/src/providers.ts
// Chama o provedor de IA escolhido pelo usuario, server-to-server — sem
// CORS pra lidar (nao e mais uma chamada saindo de um navegador) e sem
// precisar do header "dangerous-direct-browser-access" da Anthropic, que
// so existe pra liberar chamada direta do navegador.
//
// Todos os provedores sao chamados em modo streaming (SSE) pra podermos
// repassar o texto pro client conforme ele vai sendo gerado, em vez de
// esperar a resposta inteira ficar pronta.

export type AiProvider = "anthropic" | "openai" | "gemini" | "grok";

export interface NarrateMessage {
  role: "user" | "assistant";
  content: string;
}

// Modelos padrao — ajuste aqui se o provedor descontinuar algum.
// Atualizado em 2026-07-20: gemini-2.0-flash foi desativado (1º/jun/2026),
// gpt-4o e claude-sonnet-4-5-20250929 seguiam ativos mas com aviso de
// substituicao — trocados pelos modelos correntes de cada provedor.
// "grok" adicionado depois, junto de streamGrok — nome de modelo tambem
// nao verificado contra a API de verdade (mesma ressalva do IMAGE_MODEL
// logo abaixo).
const DEFAULT_MODEL: Record<AiProvider, string> = {
  anthropic: "claude-sonnet-5",
  openai: "gpt-5.2-chat-latest",
  gemini: "gemini-3.5-flash",
  grok: "grok-4",
};

// Modelo de geracao de imagem do Gemini (retrato do personagem no wizard
// de criacao — ver generateCharacterImage em index.ts). Verificado contra
// GET /v1beta/models em 2026-07-30.
const IMAGE_MODEL = "gemini-3.1-flash-image";

// Gera uma imagem a partir de um prompt de texto e devolve como data URL
// (base64 inline) — sem upload pra Storage, o client guarda essa string
// direto no campo `image_url` da ficha. Usa a mesma API generateContent
// do texto, so que pedindo IMAGE em generationConfig.responseModalities;
// a imagem volta como um `inlineData` dentro dos parts da resposta, no
// lugar do texto de sempre.
export async function generateImage(apiKey: string, prompt: string): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${IMAGE_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { responseModalities: ["IMAGE"] },
    }),
  });

  if (!response.ok) throw new Error(await extractError(response));

  const data = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ inlineData?: { mimeType?: string; data?: string } }> } }>;
  };

  const imagePart = data.candidates?.[0]?.content?.parts?.find((part) => part.inlineData?.data);
  if (!imagePart?.inlineData?.data) throw new Error("A IA não devolveu nenhuma imagem.");

  const mimeType = imagePart.inlineData.mimeType ?? "image/png";
  return `data:${mimeType};base64,${imagePart.inlineData.data}`;
}

export async function streamProvider(
  provider: AiProvider,
  apiKey: string,
  systemPrompt: string,
  messages: NarrateMessage[],
  onDelta: (text: string) => void
): Promise<void> {
  switch (provider) {
    case "anthropic":
      return streamAnthropic(apiKey, systemPrompt, messages, onDelta);
    case "openai":
      return streamOpenAi(apiKey, systemPrompt, messages, onDelta);
    case "gemini":
      return streamGemini(apiKey, systemPrompt, messages, onDelta);
    case "grok":
      return streamGrok(apiKey, systemPrompt, messages, onDelta);
  }
}

async function streamAnthropic(
  apiKey: string,
  systemPrompt: string,
  messages: NarrateMessage[],
  onDelta: (text: string) => void
): Promise<void> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: DEFAULT_MODEL.anthropic,
      max_tokens: 1024,
      system: systemPrompt,
      stream: true,
      messages: messages.map((message) => ({ role: message.role, content: message.content })),
    }),
  });

  if (!response.ok) throw new Error(await extractError(response));

  await consumeSseLines(response, (data) => {
    const event = JSON.parse(data) as { type?: string; delta?: { type?: string; text?: string } };
    if (event.type === "content_block_delta" && event.delta?.type === "text_delta" && event.delta.text) {
      onDelta(event.delta.text);
    }
  });
}

async function streamOpenAi(
  apiKey: string,
  systemPrompt: string,
  messages: NarrateMessage[],
  onDelta: (text: string) => void
): Promise<void> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: DEFAULT_MODEL.openai,
      stream: true,
      messages: [
        { role: "system", content: systemPrompt },
        ...messages.map((message) => ({ role: message.role, content: message.content })),
      ],
    }),
  });

  if (!response.ok) throw new Error(await extractError(response));

  await consumeSseLines(response, (data) => {
    if (data === "[DONE]") return;
    const event = JSON.parse(data) as { choices?: Array<{ delta?: { content?: string } }> };
    const text = event.choices?.[0]?.delta?.content;
    if (text) onDelta(text);
  });
}

// API da xAI (Grok) e compativel com o formato de chat completions da
// OpenAI (mesmo shape de request/resposta/SSE) — so muda o host e o
// modelo, por isso e essencialmente uma copia de streamOpenAi.
async function streamGrok(
  apiKey: string,
  systemPrompt: string,
  messages: NarrateMessage[],
  onDelta: (text: string) => void
): Promise<void> {
  const response = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: DEFAULT_MODEL.grok,
      stream: true,
      messages: [
        { role: "system", content: systemPrompt },
        ...messages.map((message) => ({ role: message.role, content: message.content })),
      ],
    }),
  });

  if (!response.ok) throw new Error(await extractError(response));

  await consumeSseLines(response, (data) => {
    if (data === "[DONE]") return;
    const event = JSON.parse(data) as { choices?: Array<{ delta?: { content?: string } }> };
    const text = event.choices?.[0]?.delta?.content;
    if (text) onDelta(text);
  });
}

async function streamGemini(
  apiKey: string,
  systemPrompt: string,
  messages: NarrateMessage[],
  onDelta: (text: string) => void
): Promise<void> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${DEFAULT_MODEL.gemini}:streamGenerateContent?alt=sse&key=${encodeURIComponent(apiKey)}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemPrompt }] },
      // Gemini usa "model" em vez de "assistant" pro papel da IA.
      contents: messages.map((message) => ({
        role: message.role === "assistant" ? "model" : "user",
        parts: [{ text: message.content }],
      })),
    }),
  });

  if (!response.ok) throw new Error(await extractError(response));

  await consumeSseLines(response, (data) => {
    const event = JSON.parse(data) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const text = event.candidates?.[0]?.content?.parts?.[0]?.text;
    if (text) onDelta(text);
  });
}

// Le o corpo SSE de `response` linha a linha e chama `onData` com o
// conteudo de cada linha "data: ..." (os 3 provedores mandam um JSON por
// linha, sem eventos multi-linha, entao esse parser simples basta).
async function consumeSseLines(response: Response, onData: (data: string) => void): Promise<void> {
  const reader = response.body?.getReader();
  if (!reader) return;

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const data = trimmed.slice("data:".length).trim();
      if (data) onData(data);
    }
  }
}

async function extractError(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as { error?: { message?: string } };
    return data.error?.message ?? `Erro ${response.status} ao chamar a IA.`;
  } catch {
    return `Erro ${response.status} ao chamar a IA.`;
  }
}
