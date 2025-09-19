import { Context } from "koa";
import authMiddleware from "../middlewares/auth-middleware";
import { askAI } from "../services/ai";

const Router = require("koa-router");
const koaBody = require("koa-bodyparser");

const suggestionRouter = new Router({
  prefix: "/api/suggestions",
});

suggestionRouter.post(
  "/ask",
  koaBody(),
  authMiddleware,
  async (ctx: Context) => {
    const { question } = ctx.request.body as { question: string };
    let result = await askAI(question);
    if (!result) {
      ctx.status = 503;
      ctx.body = {
        error: true,
        details: "Something went wrong with AI",
      };
      return;
    }
    ctx.status = 200;
    ctx.body = result;
  }
);

export default suggestionRouter;
