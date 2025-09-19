import { Context } from "koa";

const Router = require("koa-router");
const koaBody = require("koa-bodyparser");

const JWT_COOKIE_NAME = "jwt";

const loginRouter = new Router({
  prefix: "/api/login",
});

loginRouter.post("/", koaBody(), async (ctx: Context) => {
  const { username, password } = ctx.request.body as {
    username: string;
    password: string;
  };

  try {
    const authData = await ctx.db.authUserWithPassword(username, password);

    // Set the JWT token in an HttpOnly cookie
    ctx.cookies.set(JWT_COOKIE_NAME, authData.token, {
      httpOnly: true,
      secure: false, // Set to true in production with HTTPS
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
    });

    ctx.body = {
      message: "Login successful",
      user: authData.user,
    };
  } catch (error) {
    console.log(error);
    ctx.status = 401;
    ctx.body = {
      message: "Invalid email or password",
      error: (error as { message: string }).message,
    };
  }
});

loginRouter.get("/refresh", koaBody(), async (ctx: Context) => {
  const token = ctx.cookies.get("jwt");
  if (!token) {
    ctx.status = 401;
    ctx.body = { message: "Not authorized" };
    return;
  }
  const user = await ctx.db.refreshAuth(token);
  console.log(user);

  // Set the JWT token in an HttpOnly cookie
  ctx.cookies.set(JWT_COOKIE_NAME, user.token, {
    httpOnly: true,
    secure: false, // Set to true in production with HTTPS
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
  });

  ctx.body = {
    message: "Login successful",
    user: user.user,
  };
});

loginRouter.get("/logout", koaBody(), async (ctx: Context) => {
  ctx.cookies.set(JWT_COOKIE_NAME, null, {
    httpOnly: true,
    secure: false,
    sameSite: true,
  });

  ctx.status = 200;
  ctx.body = true;
});

module.exports = loginRouter;
