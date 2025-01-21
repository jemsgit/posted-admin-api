const Router = require("koa-router");
const koaBody = require("koa-bodyparser");
const authMiddleware = require("../middlewares/auth-middleware");
const {
  getChannelInfoById,
  getChannelsList,
  getChannelContentById,
  updateChannelContentById,
  copyContentToChannel,
} = require("../services/channels");

const channelsRouter = new Router({
  prefix: "/api/channels",
});

channelsRouter.get("/info", koaBody(), authMiddleware, async (ctx) => {
  ctx.status = 200;
  ctx.body = await getChannelsList();
});

channelsRouter.get("/info/:channelId", koaBody(), async (ctx) => {
  const { channelId } = ctx.params;
  const channelData = await getChannelInfoById(channelId);

  if (!channelData) {
    ctx.status = 404;
    ctx.body = "Not found";
    return;
  }

  if (channelData.error) {
    ctx.status = 400;
    ctx.body = "Bad request";
    return;
  }

  ctx.status = 200;
  ctx.body = channelData;
});

channelsRouter.get("/content", koaBody(), async (ctx) => {
  const { channelId, type } = ctx.query;
  const channelData = await getChannelContentById(channelId, type);

  if (!channelData) {
    ctx.status = 404;
    ctx.body = "Not found";
    return;
  }

  if (channelData.error) {
    ctx.status = 400;
    ctx.body = "Bad request";
    return;
  }

  ctx.status = 200;
  ctx.body = channelData;
});

channelsRouter.patch(
  "/info/:channelId/update",
  koaBody(),
  authMiddleware,
  async (ctx) => {
    const { channelId } = ctx.request.params;
    const info = ctx.request.body;

    ctx.status = 200;
    ctx.body = "Not implemented";
  }
);

channelsRouter.patch(
  "/copy-content/:channelId/:type",
  koaBody(),
  authMiddleware,
  async (ctx) => {
    const { channelId, type } = ctx.request.params;
    const { content } = ctx.request.body;

    const res = copyContentToChannel(channelId, type, content);
    ctx.status = 200;
    ctx.body = "Ok";
  }
);

channelsRouter.get(
  "/api/channels/content",
  koaBody(),
  authMiddleware,
  async (ctx) => {
    const { channelId, type } = ctx.request.query;
    const result = await getChannelContentById(channelId, type);

    if (result) {
      ctx.status = 200;
      ctx.body = "Ok";
    } else {
      ctx.status = 400;
      ctx.body = "Fail";
    }
  }
);

channelsRouter.patch("/content", koaBody(), authMiddleware, async (ctx) => {
  const { channelId, type, content } = ctx.request.body;
  console.log(content);
  const result = updateChannelContentById(channelId, type, content);

  if (result) {
    ctx.status = 200;
    ctx.body = "Ok";
  } else {
    ctx.status = 400;
    ctx.body = "Fail";
  }
});

module.exports = channelsRouter;
