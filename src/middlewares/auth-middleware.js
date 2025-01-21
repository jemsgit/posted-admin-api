/* eslint-disable no-unreachable */

async function authMiddleware(ctx, next) {
  const token = ctx.cookies.get("jwt", { httpOnly: true });
  if (!token) {
    ctx.throw(401, "Not authorized");
  }

  try {
    // Use ctx.pb to validate the token
    const user = await ctx.pb.collection("users").authRefresh(token);

    // Attach the user to the context
    ctx.state.user = user;

    await next();
  } catch (error) {
    ctx.status = 401;
    ctx.body = { message: "Invalid or expired token" };
  }
}

module.exports = authMiddleware;
