// Service for managing prompts in PocketBase

import { Prompt } from "../models/prompt";

// Prompt interface: { id: string, text: string }
const db = require("../db/pbDb").default;

async function getAllPrompts() {
  const records: Prompt[] = await db.getAllPrompts();
  return records.map((r) => ({ id: r.id, text: r.text, title: r.title }));
}

async function addPrompt(text: string, title?: string) {
  const record = await db.addPrompt(text, title);
  return { id: record.id, text: record.text, title: record.title };
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
