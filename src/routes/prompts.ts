import { Context } from "koa";
import { PromptDTO } from "../models/prompt";
import { ensurePbAdminAuth } from "../middlewares/pb-auth";

const Router = require("koa-router");
const koaBody = require("koa-bodyparser");
const authMiddleware = require("../middlewares/auth-middleware");
const {
  getAllPrompts,
  addPrompt,
  deletePrompt,
} = require("../services/prompts");

const promptsRouter = new Router({
  prefix: "/api/prompts",
});

interface BodyContext extends Context {
  request: Context["request"] & { body: PromptDTO };
}

// Get all prompts
promptsRouter.get(
  "/",
  koaBody(),
  authMiddleware,
  ensurePbAdminAuth,
  async (ctx: Context) => {
    ctx.status = 200;
    ctx.body = await getAllPrompts();
  }
);

promptsRouter.post(
  "/",
  koaBody(),
  authMiddleware,
  ensurePbAdminAuth,
  async (ctx: BodyContext) => {
    const { text, title } = ctx.request.body;
    if (!text) {
      ctx.status = 400;
      ctx.body = { error: "Text is required" };
      return;
    }
    const prompt = await addPrompt(text, title);
    ctx.status = 201;
    ctx.body = prompt;
  }
);

// Delete a prompt
promptsRouter.delete(
  "/:id",
  koaBody(),
  authMiddleware,
  ensurePbAdminAuth,
  async (ctx: Context) => {
    const { id } = ctx.params;
    await deletePrompt(id);
    ctx.status = 204;
  }
);

module.exports = promptsRouter;
