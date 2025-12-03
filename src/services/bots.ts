import { Bot } from "../models/bot";

// Prompt interface: { id: string, text: string }
const db = require("../db/pbDb").default;

export async function getAllBots(): Promise<Bot[]> {
  return db.getAllBots();
}

export async function getBotById(id: string): Promise<Bot> {
  return db.getBotById(id);
}

export async function addBot(name: string, apiUrl: string, token: string) {
  return db.addBot(name, apiUrl, token);
}

export async function updateBot(
  id: string,
  data: Partial<{ name: string; apiUrl: string; token: string }>
) {
  return db.updateBot(id, data);
}

export async function deleteBot(id: string) {
  return db.deleteBot(id);
}
