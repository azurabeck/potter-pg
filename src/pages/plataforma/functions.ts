export type Die = {
  sides: 4 | 6 | 8 | 10 | 12 | 20;
};

export type RolledDie = {
  sides: Die["sides"];
  result: number;
};

export type HistoryItem =
  | { id: string; type: "image"; user: string; imageUrl: string }
  | { id: string; type: "dice"; user: string; sides: Die["sides"]; result: number }
  | { id: string; type: "join"; user: string };

export type NarrationMessage = {
  id: string;
  user: string;
  text: string;
};

export type ScoreboardRow = {
  name: string;
  hp: string;
  status: string;
  tone: "warning" | "healthy" | "danger" | "down";
};

export const DICE: Die[] = [
  { sides: 4 },
  { sides: 6 },
  { sides: 8 },
  { sides: 10 },
  { sides: 12 },
  { sides: 20 },
];

export const TURN_ORDER = ["Tomas", "Alya", "Acromantula 1", "Owen"];

export const SCOREBOARD_ROWS: ScoreboardRow[] = [
  { name: "Tomas", hp: "90/100", status: "Petrificado (1 rodada restante)", tone: "warning" },
  { name: "Alya", hp: "100/100", status: "Saudável", tone: "healthy" },
  { name: "Acromantula", hp: "70/100", status: "Incendiando (4 de dano por rodada — 1/2)", tone: "danger" },
  { name: "Owen", hp: "0/100", status: "Desmaiado", tone: "down" },
];

export function randomDieResult(sides: Die["sides"]) {
  return Math.floor(Math.random() * sides) + 1;
}
