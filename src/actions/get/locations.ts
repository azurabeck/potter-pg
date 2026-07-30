// src/actions/get/locations.ts
// Leitura da colecao "locations" — global, sem filtro na query, mesmo
// padrão de actions/get/npcs.ts e actions/get/enemies.ts: busca tudo,
// quem consome filtra o que precisa client-side (ver getKnownLocations
// em pages/locais/functions.ts).

import { collection, getDocs } from "firebase/firestore";
import { db } from "@/services/firebase_settings";
import { COLLECTIONS } from "@/services/genene_settings";
import type { Location } from "@/utils/types";

export async function getLocations(): Promise<Location[]> {
  const locationsRef = collection(db, COLLECTIONS.LOCATIONS);
  const snapshot = await getDocs(locationsRef);

  return snapshot.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }) as Location)
    .sort((a, b) => (a.name || "").localeCompare(b.name || "", "pt-BR"));
}
