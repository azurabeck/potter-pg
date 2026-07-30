// src/actions/get/table.ts
// Leitura da colecao "tables" — id do documento == hostUserId (ver
// actions/sets/table.ts e utils/types.ts, Table, pra como/onde ele é
// escrito).

import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/services/firebase_settings";
import { COLLECTIONS } from "@/services/genene_settings";
import type { Table } from "@/utils/types";

/**
 * Escuta em tempo real o documento da mesa — `null` enquanto ninguém
 * ainda ganhou nenhum ponto pra casa nela (o documento só é criado na
 * primeira escrita, ver `addHousePoints`). Devolve a função de
 * unsubscribe (chamar no cleanup do efeito).
 */
export function subscribeToTable(hostUserId: string, onChange: (table: Table | null) => void): () => void {
  return onSnapshot(
    doc(db, COLLECTIONS.TABLES, hostUserId),
    (snapshot) => {
      onChange(snapshot.exists() ? ({ id: snapshot.id, ...snapshot.data() } as Table) : null);
    },
    (error) => console.error("Erro ao escutar a mesa:", error)
  );
}
