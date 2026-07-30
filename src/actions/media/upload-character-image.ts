// src/actions/media/upload-character-image.ts
// Fala com a Cloud Function "uploadCharacterImage" (functions/src/index.ts)
// pra subir um arquivo escolhido pelo jogador (botão "Usar imagem existente"
// do wizard) pro Storage do projeto — mesma autenticação Bearer das outras
// actions de IA, mas essa não fala com nenhum provedor de IA.

import { auth } from "@/services/firebase_settings";

const UPLOAD_IMAGE_URL = import.meta.env.DEV
  ? "http://127.0.0.1:5001/potterpg/us-central1/uploadCharacterImage"
  : "https://us-central1-potterpg.cloudfunctions.net/uploadCharacterImage";

const ALLOWED_MIME_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];
const MAX_FILE_BYTES = 6 * 1024 * 1024;

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Não consegui ler o arquivo."));
    reader.readAsDataURL(file);
  });
}

export async function uploadCharacterImage(file: File): Promise<string> {
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new Error("Formato de imagem não suportado. Use PNG, JPEG, WEBP ou GIF.");
  }
  if (file.size > MAX_FILE_BYTES) {
    throw new Error("Imagem muito grande. Escolha um arquivo de até 6MB.");
  }

  const user = auth.currentUser;
  if (!user) throw new Error("Faça login pra enviar uma imagem.");

  const idToken = await user.getIdToken();
  const dataUrl = await readFileAsDataUrl(file);
  const imageBase64 = dataUrl.slice(dataUrl.indexOf(",") + 1);

  const response = await fetch(UPLOAD_IMAGE_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({ imageBase64, mimeType: file.type }),
  });

  const data = await response.json().catch(() => null);
  if (!response.ok || typeof data?.imageUrl !== "string") {
    throw new Error(data?.error ?? `Erro ${response.status} ao enviar a imagem.`);
  }

  return data.imageUrl;
}
