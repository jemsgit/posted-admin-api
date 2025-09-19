import { Prompt } from "../models/prompt";

const PocketBase = require("pocketbase/cjs");
const config = require("../config").default;

const usersCollection = "users";
const promptsCollection = "prompts";

class DataBase {
  pb: any;

  constructor() {
    this.pb = new PocketBase(config.pocketbaseUrl);
  }

  public async refreshAuth(token: string) {
    return this.pb.collection(usersCollection).authRefresh(token);
  }

  public async authUserWithPassword(username: string, password: string) {
    return this.pb
      .collection(usersCollection)
      .authWithPassword(username, password);
  }

  public async getAllPrompts() {
    const records: Prompt[] = await this.pb
      .collection(promptsCollection)
      .getFullList();
    return records.map((r) => ({ id: r.id, text: r.text }));
  }

  public async addPrompt(text: string) {
    const record = await this.pb.collection(promptsCollection).create({ text });
    return { id: record.id, text: record.text };
  }

  public async deletePrompt(id: string) {
    await this.pb.collection(promptsCollection).delete(id);
    return true;
  }
}

export default new DataBase();
