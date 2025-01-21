const Koa = require("koa");
const path = require("path");
const fs = require("fs");
const Router = require("koa-router");
const logger = require("koa-logger");
const cors = require("@koa/cors");
require("cross-fetch/polyfill");
const PocketBase = require("pocketbase/cjs");
const config = require("./config");

const loginRouter = require("./routes/login");
const channelsRouter = require("./routes/channels");

const pb = new PocketBase(config.default.pocketbaseUrl);

const app = new Koa();

app.context.pb = pb;
app.use(
  cors({
    exposeHeaders: "Cookie",
    credentials: true,
  })
);
app.use(logger()).use(loginRouter.routes()).use(channelsRouter.routes());

app.listen(process.env.PORT || 3001, () => {
  console.log("server started");
  console.log(process.env.PORT || 3001);
});
