import { Context } from "koa";
import authMiddleware from "../middlewares/auth-middleware";
import { askGeminiAI, askGeminiAIStream } from "../services/ai";
import { getArticleShortVersion } from "../services/short-article";
import { createPostFromUrl } from "../services/post-creator";

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
  const { url } = ctx.request.body as {
    url: string;
  };

  let result = await getArticleShortVersion(url);
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

suggestionRouter.post(
  "/create-post",
  koaBody(),
  authMiddleware,
  async (ctx: Context) => {
    const { url, prompt, systemContent } = ctx.request.body as {
      url: string;
      prompt: string;
      systemContent?: string;
    };

    if (!url || !prompt) {
      ctx.status = 400;
      ctx.body = { error: true, details: "Missing url or prompt" };
      return;
    }

    const result = await createPostFromUrl(url, prompt, systemContent);
    if (!result) {
      ctx.status = 503;
      ctx.body = { error: true, details: "Failed to create post" };
      return;
    }

    ctx.status = 200;
    ctx.body = result;
  }
);

export default suggestionRouter;
