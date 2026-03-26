import { Context } from "koa";
import { randomUUID } from "crypto";
import db from "../db/pbDb";
import posterFetcher from "../lib/posterFetcher";

const Router = require("koa-router");
const koaBody = require("koa-bodyparser");
const authMiddleware = require("../middlewares/auth-middleware");

const rssRouter = new Router({ prefix: "/api/rss" });

rssRouter.post(
  "/parse",
  koaBody(),
  authMiddleware,
  async (ctx: Context) => {
    const { channelId } = ctx.request.body as { channelId?: string };

    if (!channelId) {
      ctx.status = 400;
      ctx.body = { error: "Missing required field: channelId" };
      return;
    }

    const latest = await db.getLatestRssJob(channelId);
    if (latest?.status === "processing") {
      ctx.status = 409;
      ctx.body = { error: "Задача уже выполняется", jobId: latest.jobId };
      return;
    }

    const jobId = randomUUID();
    const job = await db.createRssJob(jobId, channelId);

    // Fire-and-forget
    (async () => {
      try {
        await posterFetcher.post(`/api/rss/parse/${channelId}`, {});
        await db.updateRssJob(job.id, { status: "success" });
      } catch (e: any) {
        console.error("RSS pipeline error:", e);
        await db.updateRssJob(job.id, {
          status: "error",
          error: e?.message || String(e),
        });
      }
    })();

    ctx.status = 202;
    ctx.body = { jobId, status: "processing" };
  },
);

rssRouter.get(
  "/parse/status",
  authMiddleware,
  async (ctx: Context) => {
    const { channelId } = ctx.query as { channelId?: string };

    if (!channelId) {
      ctx.status = 400;
      ctx.body = { error: "Missing required query param: channelId" };
      return;
    }

    const job = await db.getLatestRssJob(channelId);
    if (!job) {
      ctx.status = 200;
      ctx.body = { status: null };
      return;
    }

    ctx.status = 200;
    ctx.body = {
      jobId: job.jobId,
      status: job.status,
      error: job.error || null,
      createdAt: job.created,
    };
  },
);

export default rssRouter;
