/* eslint-disable no-unreachable */

const jwtUtils = require("../utils/jwt");

const { verifyJWT } = jwtUtils;

async function authMiddleware(ctx, next) {
  if (process.env.NO_AUTH === "1") {
    ctx.state.user = { id: "dev", name: 123 };
    return next();
  }

  const token = ctx.cookies.get("jwt");

  if (!token) {
    ctx.status = 401;
    ctx.body = { message: "No token" };
    return;
  }

  try {
    const decodedUser = verifyJWT(token);
    ctx.state.user = decodedUser;
    return next();
  } catch (err) {
    console.log(err);
    ctx.status = 401;
    ctx.body = { message: "Invalid token" };
  }
}

module.exports = authMiddleware;
