const Router = require("koa-router");
const koaBody = require("koa-bodyparser");
const authMiddleware = require("../middlewares/auth-middleware");
const {
  getChannelInfoById,
  getChannelsList,
  checkChannelHasFile,
  updateFileContent,
} = require("../services/channels");

const channelsRouter = new Router({
  prefix: "/api/channels",
});

channelsRouter.get("/", koaBody(), authMiddleware, (ctx) => {
  ctx.status = 200;
  ctx.body = getChannelsList();
});

channelsRouter.get("/:channelId", koaBody(), async (ctx) => {
  const { channelId } = ctx.params;
  const channelData = await getChannelInfoById(channelId);

  if (!channelData) {
    ctx.status = 404;
    ctx.body = "Not found";
    return;
  }

  ctx.status = 200;
  ctx.body = channelData;
});

channelsRouter.patch(
  "/saveFile/:channelId",
  koaBody(),
  authMiddleware,
  async (ctx) => {
    const { channelId } = ctx.params;
    const { name, content } = ctx.request.body;

    if (!checkChannelHasFile(channelId, name)) {
      ctx.status = 400;
      return;
    }

    const result = await updateFileContent(name, content);

    if (result) {
      ctx.status = 200;
      ctx.body = "Ok";
    } else {
      ctx.status = 400;
      ctx.body = "Fail";
    }
  }
);

module.exports = channelsRouter;
