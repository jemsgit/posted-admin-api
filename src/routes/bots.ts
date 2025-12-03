import Router from "koa-router";
import koaBody from "koa-bodyparser";
import authMiddleware from "../middlewares/auth-middleware";
import {
  getAllBots,
  getBotById,
  addBot,
  updateBot,
  deleteBot,
} from "../services/bots";
import { ensurePbAdminAuth } from "../middlewares/pb-auth";

type BotRequestBody = {
  name: string;
  apiUrl: string;
  token: string;
};

const botsRouter = new Router({ prefix: "/api/bots" });

botsRouter.get(
  "/",
  koaBody(),
  authMiddleware,
  ensurePbAdminAuth,
  async (ctx) => {
    ctx.status = 200;
    ctx.body = await getAllBots();
  }
);

botsRouter.get(
  "/:id",
  koaBody(),
  authMiddleware,
  ensurePbAdminAuth,
  async (ctx) => {
    const { id } = ctx.params;
    const bot = await getBotById(id);
    if (!bot) {
      ctx.status = 404;
      ctx.body = { error: "Bot not found" };
      return;
    }
    ctx.status = 200;
    ctx.body = bot;
  }
);

botsRouter.post(
  "/",
  koaBody(),
  authMiddleware,
  ensurePbAdminAuth,
  async (ctx) => {
    try {
      const { name, apiUrl, token } = ctx.request.body as BotRequestBody;
      if (!name || !apiUrl || !token) {
        ctx.status = 400;
        ctx.body = { error: "Name, apiUrl and token are required" };
        return;
      }
      const bot = await addBot(name, apiUrl, token);
      ctx.status = 201;
      ctx.body = bot;
    } catch (e) {
      console.log(e);
    }
  }
);

botsRouter.put(
  "/:id",
  koaBody(),
  authMiddleware,
  ensurePbAdminAuth,
  async (ctx) => {
    const { id } = ctx.params;
    const data = ctx.request.body as BotRequestBody;
    const updatedBot = await updateBot(id, data);
    ctx.status = updatedBot ? 200 : 404;
    ctx.body = updatedBot || { error: "Bot not found" };
  }
);

botsRouter.delete(
  "/:id",
  koaBody(),
  authMiddleware,
  ensurePbAdminAuth,
  async (ctx) => {
    const { id } = ctx.params;
    await deleteBot(id);
    ctx.status = 204;
  }
);

export default botsRouter;
