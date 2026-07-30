// src/actions/get/enemies.ts
// Leitura da colecao "enemies" — bestiário/adversários, só leitura no
// potter-pg (cadastro fica no console do Firebase por enquanto, ver doc
// de pages/adversarios). Sem filtro na query, mesmo padrão de
// actions/get/npcs.ts: busca tudo, quem consome filtra o que precisa
// client-side (ver getKnownAdversaries em pages/adversarios/functions.ts).

import { collection, getDocs } from "firebase/firestore";
import { db } from "@/services/firebase_settings";
import { COLLECTIONS } from "@/services/genene_settings";
import type { Enemy } from "@/utils/types";

export async function getEnemies(): Promise<Enemy[]> {
  const enemiesRef = collection(db, COLLECTIONS.ENEMIES);
  const snapshot = await getDocs(enemiesRef);

  return snapshot.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }) as Enemy)
    .sort((a, b) => (a.name || "").localeCompare(b.name || "", "pt-BR"));
}
