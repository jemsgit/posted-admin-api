/* eslint-disable no-unreachable */

async function authMiddleware(ctx, next) {
  if (process.env.NO_AUTH === "1") {
    ctx.state.user = { name: 123 };

    await next();
    return;
  }
  const token = ctx.cookies.get("jwt", { httpOnly: true });
  if (!token) {
    ctx.status = 401;
    ctx.body = { message: "Not authorized" };
    return;
  }

  try {
    const user = await ctx.db.refreshAuth(token);
    // Attach the user to the context
    ctx.state.user = user;

    await next();
  } catch (error) {
    ctx.status = 401;
    ctx.body = { message: "Invalid or expired token", error };
  }
}

module.exports = authMiddleware;
