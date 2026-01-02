import Router from "koa-router";
import bodyParser from "koa-bodyparser";
import type { Context, DefaultState } from "koa";

import authMiddleware from "../middlewares/auth-middleware";
import { ensurePbAdminAuth } from "../middlewares/pb-auth";

import {
  getChannelInfoById,
  getChannelsList,
  getChannelContentById,
  updateChannelContentById,
  copyContentToChannel,
  updateChannelSettings,
  getChannelGrabber,
  testChannelGrabber,
  setChannelActiveStatus,
  forcePostForChannel,
} from "../services/channels";

/**
 * Можно позже расширить State / CustomContext
 */
type State = DefaultState;
type RouterContext = Context & {
  params: Record<string, string>;
};

const channelsRouter = new Router<State, RouterContext>({
  prefix: "/api/channels",
});

/* ============================
   GET /info
============================ */
channelsRouter.get(
  "/info",
  bodyParser(),
  authMiddleware,
  ensurePbAdminAuth,
  async (ctx) => {
    ctx.status = 200;
    ctx.body = await getChannelsList();
  }
);

/* ============================
   GET /info/:channelId
============================ */
channelsRouter.get(
  "/info/:channelId",
  bodyParser(),
  authMiddleware,
  ensurePbAdminAuth,
  async (ctx) => {
    const { channelId } = ctx.params;

    const channelData = await getChannelInfoById(channelId);

    if (!channelData) {
      ctx.status = 404;
      ctx.body = "Not found";
      return;
    }

    if ("error" in channelData) {
      ctx.status = 400;
      ctx.body = "Bad request";
      return;
    }

    ctx.status = 200;
    ctx.body = channelData;
  }
);

/* ============================
   GET /content
============================ */
channelsRouter.get(
  "/content",
  bodyParser(),
  authMiddleware,
  ensurePbAdminAuth,
  async (ctx) => {
    const { channelId, type } = ctx.query as {
      channelId?: string;
      type?: string;
    };

    if (!channelId || !type) {
      ctx.status = 400;
      ctx.body = "channelId or type was not provided";
      return;
    }

    const channelData = await getChannelContentById(channelId, type);

    if (!channelData) {
      ctx.status = 404;
      ctx.body = "Not found";
      return;
    }

    if ("error" in channelData) {
      ctx.status = 400;
      ctx.body = "Bad request";
      return;
    }

    ctx.status = 200;
    ctx.body = channelData;
  }
);

/* ============================
   PATCH /info/:channelId
============================ */
channelsRouter.patch(
  "/info/:channelId",
  bodyParser(),
  authMiddleware,
  ensurePbAdminAuth,
  async (ctx) => {
    const { channelId } = ctx.params;
    const { params } = ctx.request.body as {
      params?: Record<string, unknown>;
    };

    if (!params) {
      ctx.status = 400;
      ctx.body = "Bad request";
      return;
    }

    await updateChannelSettings(channelId, params);

    ctx.status = 200;
    ctx.body = "Ok";
  }
);

/* ============================
   PATCH /copy-content/:channelId/:type
============================ */
channelsRouter.patch(
  "/copy-content/:channelId/:type",
  bodyParser(),
  authMiddleware,
  ensurePbAdminAuth,
  async (ctx) => {
    const { channelId, type } = ctx.params;
    const { content } = ctx.request.body as {
      content: string;
    };

    await copyContentToChannel(channelId, type, content);

    ctx.status = 200;
    ctx.body = "Ok";
  }
);

/* ============================
   PATCH /content
============================ */
channelsRouter.patch(
  "/content",
  bodyParser(),
  authMiddleware,
  ensurePbAdminAuth,
  async (ctx) => {
    const { channelId, type, content } = ctx.request.body as {
      channelId: string;
      type: string;
      content: string;
    };

    const result = await updateChannelContentById(channelId, type, content);

    ctx.status = result ? 200 : 400;
    ctx.body = result ? "Ok" : "Fail";
  }
);

/* ============================
   GET /grabber/:channelId
============================ */
channelsRouter.get(
  "/grabber/:channelId",
  bodyParser(),
  authMiddleware,
  ensurePbAdminAuth,
  async (ctx) => {
    const { channelId } = ctx.params;

    const result = await getChannelGrabber(channelId);

    ctx.status = result ? 200 : 400;
    ctx.body = result ?? "Fail";
  }
);

/* ============================
   POST /test-grab/:channelId
============================ */
channelsRouter.post(
  "/test-grab/:channelId",
  bodyParser(),
  authMiddleware,
  ensurePbAdminAuth,
  async (ctx) => {
    const { channelId } = ctx.params;

    const result = await testChannelGrabber(channelId);

    ctx.status = result ? 200 : 400;
    ctx.body = result ?? "Fail";
  }
);

/* ============================
   POST /:channelId/set-active
============================ */
channelsRouter.post(
  "/:channelId/set-active",
  bodyParser(),
  authMiddleware,
  ensurePbAdminAuth,
  async (ctx) => {
    const { channelId, active } = ctx.body;

    const result = await setChannelActiveStatus(channelId, active);

    ctx.status = result ? 200 : 400;
    ctx.body = result ?? "Fail";
  }
);

/* ============================
   POST /:channelId/force-post
============================ */
channelsRouter.post(
  "/:channelId/force-post",
  bodyParser(),
  authMiddleware,
  ensurePbAdminAuth,
  async (ctx) => {
    const { channelId } = ctx.params;

    const result = await forcePostForChannel(channelId);

    ctx.status = result ? 200 : 400;
    ctx.body = result ?? "Fail";
  }
);

module.exports = channelsRouter;
