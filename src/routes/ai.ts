import { Context } from "koa";
import { randomUUID } from "crypto";
import {
  runArticlePipeline,
  readSummaryFile,
} from "../services/article-pipeline";
import db from "../db/pbDb";

const Router = require("koa-router");
const koaBody = require("koa-bodyparser");
const authMiddleware = require("../middlewares/auth-middleware");

const aiRouter = new Router({ prefix: "/api/ai" });

aiRouter.post(
  "/prepare-articles",
  koaBody(),
  authMiddleware,
  async (ctx: Context) => {
    const { channelId, articlesLimit, topCount } = ctx.request.body as {
      channelId?: string;
      articlesLimit?: number;
      topCount?: number;
    };

    if (!channelId) {
      ctx.status = 400;
      ctx.body = { error: "Missing required field: channelId" };
      return;
    }

    const latest = await db.getLatestJob(channelId);
    if (latest?.status === "processing") {
      ctx.status = 409;
      ctx.body = { error: "Задача уже выполняется", jobId: latest.jobId };
      return;
    }

    const jobId = randomUUID();
    const job = await db.createJob(jobId, channelId);

    // Fire-and-forget
    (async () => {
      try {
        console.log(channelId);
        await runArticlePipeline(channelId, articlesLimit, topCount);
        await db.updateJob(job.id, { status: "success" });
      } catch (e: any) {
        console.error("Article pipeline error:", e);
        await db.updateJob(job.id, {
          status: "error",
          error: e?.message || String(e),
        });
      }
    })();

    ctx.status = 202;
    ctx.body = { jobId, status: "processing" };
  },
);

aiRouter.get(
  "/prepare-articles/status",
  // authMiddleware,
  async (ctx: Context) => {
    const { channelId } = ctx.query as { channelId?: string };

    if (!channelId) {
      ctx.status = 400;
      ctx.body = { error: "Missing required query param: channelId" };
      return;
    }

    const job = await db.getLatestJob(channelId);
    if (!job) {
      ctx.status = 200;
      ctx.body = { status: null, summary: null };
      return;
    }

    const summary =
      job.status === "success" ? await readSummaryFile(channelId) : null;

    ctx.status = 200;
    ctx.body = {
      jobId: job.jobId,
      status: job.status,
      error: job.error || null,
      createdAt: job.created,
      summary,
    };
  },
);

export default aiRouter;
