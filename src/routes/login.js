const Router = require("koa-router");
const koaBody = require("koa-bodyparser");

const JWT_COOKIE_NAME = "jwt";

const loginRouter = new Router({
  prefix: "/api/login",
});

loginRouter.post("/", koaBody(), async (ctx) => {
  const { login, password } = ctx.request.body;

  try {
    // Authenticate user using PocketBase
    const authData = await ctx.pb
      .collection("users")
      .authWithPassword(login, password);

    // Set the JWT token in an HttpOnly cookie
    ctx.cookies.set("JWT_COOKIE_NAME", authData.token, {
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
    ctx.status = 401;
    ctx.body = { message: "Invalid email or password", error: error.message };
  }
});

loginRouter.get("/logout", koaBody(), async (ctx) => {
  ctx.cookies.set(JWT_COOKIE_NAME, null, {
    httpOnly: true,
    secure: false,
    sameSite: true,
  });
  ctx.status = 200;
  ctx.body = true;
});

module.exports = loginRouter;
