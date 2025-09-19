// Service for managing prompts in PocketBase

import { Prompt } from "../models/prompt";

// Prompt interface: { id: string, text: string }
const db = require("../db/pbDb").default;

async function getAllPrompts() {
  const records: Prompt[] = await db.getAllPrompts();
  return records.map((r) => ({ id: r.id, text: r.text }));
}

async function addPrompt(text: string) {
  const record = await db.addPrompt(text);
  return { id: record.id, text: record.text };
}

async function deletePrompt(id: string) {
  await db.deletePrompt(id);
  return true;
}

module.exports = {
  getAllPrompts,
  addPrompt,
  deletePrompt,
};
