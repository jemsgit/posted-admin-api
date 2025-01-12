const Koa = require("koa");
const path = require("path");
const fs = require("fs");
const Router = require("koa-router");
const logger = require("koa-logger");
const PocketBase = require("pocketbase/cjs");

const pb = new PocketBase("http://127.0.0.1:8090");

const app = new Koa();

const loginRouter = require("./routes/login");
const channelsRouter = require("./routes/channels");

app.context.pb = pb;

app.use(logger()).use(loginRouter.routes()).use(channelsRouter.routes());

app.listen(process.env.PORT || 3000, () => {
  console.log("server started");
  console.log(process.env.DB_LOGIN);
  console.log(process.env.TEST_ENV);
});
