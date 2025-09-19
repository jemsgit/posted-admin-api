import db from "./db/pbDb";

const Koa = require("koa");
const logger = require("koa-logger");
const cors = require("@koa/cors");
require("cross-fetch/polyfill");

const loginRouter = require("./routes/login");
const channelsRouter = require("./routes/channels");
const promptsRouter = require("./routes/prompts");
const suggestionRouter = require("./routes/suggestion").default;
const utilsRouter = require("./routes/utils").default;

const app = new Koa();

app.context.db = db;
app.use(
  cors({
    exposeHeaders: "Cookie",
    credentials: true,
  })
);
app
  .use(logger())
  .use(loginRouter.routes())
  .use(channelsRouter.routes())
  .use(promptsRouter.routes())
  .use(suggestionRouter.routes())
  .use(utilsRouter.routes());

app.listen(process.env.PORT || 3001, () => {
  console.log("server started");
  console.log(process.env.PORT || 3001);
});
