import { Prompt } from "../models/prompt";

const PocketBase = require("pocketbase/cjs");
const config = require("../config").default;

const usersCollection = "users";
const promptsCollection = "prompts";
const botsCollection = "bots";

class DataBase {
  pb: any;
  pbAuth: any;

  constructor() {
    this.pb = new PocketBase(config.pocketbaseUrl);
    this.pbAuth = new PocketBase(config.pocketbaseUrl);
  }

  async init() {
    if (!this.pb) {
      throw "No PB";
    }
    await this.pb.admins.authWithPassword(
      process.env.PB_ADMIN_EMAIL,
      process.env.PB_ADMIN_PASSWORD,
      {
        autoRefreshThreshold: 30 * 60,
      }
    );
    console.log("inited");
  }

  public async updateUser(userId: string, data: unknown) {
    return await this.pb.collection(usersCollection).update(userId, data);
  }

  public async findUserByRefreshToken(refreshToken: string) {
    const users = await this.pb.collection(usersCollection).getList(1, 1, {
      filter: `refreshTokens~"${refreshToken}"`,
    });

    return users.items.length > 0 ? users.items[0] : null;
  }

  public async getUserById(id: string) {
    try {
      return await this.pb.collection("users").getOne(id);
    } catch {
      return null;
    }
  }

  public async refreshAuth(token: string) {
    return this.pb.collection(usersCollection).authRefresh(token);
  }

  public async authUserWithPassword(username: string, password: string) {
    return this.pbAuth
      .collection(usersCollection)
      .authWithPassword(username, password);
  }

  public async getAllPrompts() {
    const records: Prompt[] = await this.pb
      .collection(promptsCollection)
      .getFullList();
    return records.map((r) => ({ id: r.id, text: r.text, title: r.title }));
  }

  public async addPrompt(text: string, title?: string) {
    const record = await this.pb
      .collection(promptsCollection)
      .create({ text, title });
    return { id: record.id, text: record.text, title: record.title };
  }

  public async deletePrompt(id: string) {
    await this.pb.collection(promptsCollection).delete(id);
    return true;
  }

  async getAllBots() {
    const records = await this.pb.collection(botsCollection).getFullList();

    // Для каждого бота запрашиваем config
    const bots = await Promise.all(
      records.map(async (bot: any) => {
        // let config = null;
        // try {
        //   const res = await fetch(`${bot.apiUrl}/api/config`, {
        //     headers: { Authorization: `Bearer ${bot.token}` },
        //   });
        //   if (res.ok) config = await res.json();
        // } catch {
        //   // Игнорируем ошибки получения config
        // }
        return {
          id: bot.id,
          name: bot.name,
          apiUrl: bot.apiUrl,
          token: bot.token,
          createdAt: bot.created,
          updatedAt: bot.updated,
          config: null,
        };
      })
    );

    return bots;
  }

  async getBotById(id: string) {
    const bot = await this.pb.collection(botsCollection).getOne(id);
    let config = {};

    try {
      const res = await fetch(`${bot.apiUrl}/api/config`, {
        headers: { Authorization: `Bearer ${bot.token}` },
      });

      if (res.ok) config = await res.json();
    } catch (e) {
      console.log(e);
    }
    return {
      id: bot.id,
      name: bot.name,
      apiUrl: bot.apiUrl,
      token: bot.token,
      createdAt: bot.created,
      updatedAt: bot.updated,
      config,
    };
  }

  async addBot(name: string, apiUrl: string, token: string) {
    try {
      // Проверяем, что бот с таким именем уже существует
      const existing = await this.pb.collection(botsCollection).getList(1, 1, {
        filter: `name = "${name}"`,
      });

      if (existing.items.length > 0) {
        throw new Error("Bot with this name already exists");
      }

      // Создаём бота
      const record = await this.pb.collection(botsCollection).create({
        name,
        apiUrl,
        token,
      });

      return {
        id: record.id,
        name: record.name,
        apiUrl: record.apiUrl,
        token: record.token,
        createdAt: record.created,
        updatedAt: record.updated,
      };
    } catch (e) {
      console.log("Error creating bot:", e);
      return null;
    }
  }

  async updateBot(
    id: string,
    data: Partial<{ name: string; apiUrl: string; token: string }>
  ) {
    const record = await this.pb.collection(botsCollection).update(id, data);
    return {
      id: record.id,
      name: record.name,
      apiUrl: record.apiUrl,
      token: record.token,
      createdAt: record.created,
      updatedAt: record.updated,
    };
  }

  async deleteBot(id: string) {
    await this.pb.collection(botsCollection).delete(id);
    return true;
  }

  getTelegramChannels() {
    return this.pb
      .collection("channels")
      .getFullList({ filter: "platform='telegram'" });
  }
}

export default new DataBase();
