import { Context } from "koa";
import authMiddleware from "../middlewares/auth-middleware";
import { askAI, askGeminiAI, askGeminiAIStream } from "../services/ai";
import { getArticleShortVersion } from "../services/short-article";

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
    const { question, systemContent } = ctx.request.body as {
      question: string;
      systemContent?: string;
    };
    let result = await askGeminiAI(question, systemContent);
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

suggestionRouter.post(
  "/ask-stream",
  koaBody(),
  authMiddleware,
  async (ctx: Context) => {
    const { question, systemContent } = ctx.request.body as {
      question: string;
      systemContent?: string;
    };

    ctx.res.setHeader("Content-Type", "text/plain; charset=utf-8");
    ctx.res.setHeader("Transfer-Encoding", "chunked");
    ctx.res.flushHeaders();

    await askGeminiAIStream(question, systemContent, (chunk) => {
      console.log("got chunk");
      ctx.res.write(chunk);
    });

    ctx.res.end();
  }
);

suggestionRouter.post(
  "/summarize",
  koaBody(),
  authMiddleware,
  async (ctx: Context) => {
    const { prompt, content } = ctx.request.body as {
      prompt: string;
      content: string;
    };
    const question = `${prompt}

${content}`;
    let result = await askGeminiAI(question);
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

suggestionRouter.post("/short-article", koaBody(), async (ctx: Context) => {
  const { url, title } = ctx.request.body as {
    url: string;
    title: string;
  };

  let result = await getArticleShortVersion(url, title);
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
});

export default suggestionRouter;
