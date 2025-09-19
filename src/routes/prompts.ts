import { Context } from "koa";

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

// Get all prompts
promptsRouter.get("/", koaBody(), authMiddleware, async (ctx: Context) => {
  ctx.status = 200;
  ctx.body = await getAllPrompts();
});

promptsRouter.post("/", koaBody(), authMiddleware, async (ctx: Context) => {
  const { text } = ctx.request.body as { text: string };
  if (!text) {
    ctx.status = 400;
    ctx.body = { error: "Text is required" };
    return;
  }
  const prompt = await addPrompt(text);
  ctx.status = 201;
  ctx.body = prompt;
});

// Delete a prompt
promptsRouter.delete(
  "/:id",
  koaBody(),
  authMiddleware,
  async (ctx: Context) => {
    const { id } = ctx.params;
    await deletePrompt(id);
    ctx.status = 204;
  }
);

module.exports = promptsRouter;
