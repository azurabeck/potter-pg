// src/actions/ai/generate-character-image.ts
// Fala com a Cloud Function "generateCharacterImage" (functions/src/index.ts)
// — mesma ideia de autenticação de narrate.ts/sorting-narrate.ts (Bearer
// do ID token), mas sem streaming: a resposta é um JSON `{ imageDataUrl }`
// de uma vez só, já que geração de imagem não chega aos pedaços como texto.

import { auth } from "@/services/firebase_settings";

const GENERATE_IMAGE_URL = import.meta.env.DEV
  ? "http://127.0.0.1:5001/potterpg/us-central1/generateCharacterImage"
  : "https://us-central1-potterpg.cloudfunctions.net/generateCharacterImage";

export async function generateCharacterImage(prompt: string): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new Error("Faça login pra gerar a imagem do personagem.");

  const idToken = await user.getIdToken();

  const response = await fetch(GENERATE_IMAGE_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({ prompt }),
  });

  const data = await response.json().catch(() => null);
  if (!response.ok || typeof data?.imageDataUrl !== "string") {
    throw new Error(data?.error ?? `Erro ${response.status} ao gerar a imagem.`);
  }

  return data.imageDataUrl;
}
