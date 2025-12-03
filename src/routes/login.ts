import { Context } from "koa";
import { createJWT, verifyJWT } from "../utils/jwt";

const Router = require("koa-router");
const koaBody = require("koa-bodyparser");

const JWT_COOKIE_NAME = "jwt";

const refreshLocks: Record<string, Promise<any> | null> = {};

async function doRefresh(ctx: Context, oldRefresh: string, userId: string) {
  const user = await ctx.db.getUserById(userId);

  if (!user) {
    ctx.status = 401;
    return { message: "User not found" };
  }

  if (!user.refreshTokens?.includes(oldRefresh)) {
    ctx.status = 401;
    return { message: "Invalid refresh token" };
  }

  // remove old token
  const refreshTokens = user.refreshTokens.filter(
    (t: string) => t !== oldRefresh
  );

  // create new refresh token
  const newRefresh = createJWT({ id: user.id }, { expiresIn: "7d" });
  refreshTokens.push(newRefresh);

  await ctx.db.updateUser(user.id, { refreshTokens });

  // create access token
  const accessToken = createJWT(
    { id: user.id, email: user.email, name: user.name },
    { expiresIn: "15m" }
  );

  // set cookies
  ctx.cookies.set("jwt", accessToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    maxAge: 15 * 60 * 1000,
  });

  ctx.cookies.set("refresh_token", newRefresh, {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return {
    message: "Refreshed",
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
    },
  };
}

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

    const user = authData.record;

    const refreshToken = createJWT(
      {
        id: user.id,
      },
      { expiresIn: "7d" }
    );

    await ctx.db.updateUser(user.id, {
      refreshTokens: [...(user.refreshTokens ?? []), refreshToken],
    });

    const accessToken = createJWT(
      {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      { expiresIn: "15m" }
    );

    ctx.cookies.set(JWT_COOKIE_NAME, accessToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      maxAge: 15 * 60 * 1000,
    });

    ctx.cookies.set("refresh_token", refreshToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    ctx.body = {
      message: "Login successful",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    };
  } catch (error) {
    ctx.status = 401;
    ctx.body = { message: "Invalid email or password" };
  }
});

loginRouter.get("/refresh", async (ctx: Context) => {
  const refreshToken = ctx.cookies.get("refresh_token");

  if (!refreshToken) {
    ctx.status = 401;
    ctx.body = { message: "Not authorized" };
    return;
  }

  let decoded;
  try {
    decoded = verifyJWT(refreshToken) as { id: string };
  } catch {
    ctx.status = 401;
    ctx.body = { message: "Invalid refresh token" };
    return;
  }

  const userId = decoded.id;

  // если refresh уже выполняется для этого юзера — ждём
  if (refreshLocks[userId]) {
    const result = await refreshLocks[userId];
    ctx.body = result;
    return;
  }

  // запускаем refresh
  refreshLocks[userId] = (async () => {
    try {
      return await doRefresh(ctx, refreshToken, userId);
    } finally {
      refreshLocks[userId] = null;
    }
  })();

  const result = await refreshLocks[userId];
  ctx.body = result;
});

// loginRouter.get("/refresh", async (ctx: Context) => {
//   const oldRefresh = ctx.cookies.get("refresh_token");

//   if (!oldRefresh) {
//     ctx.status = 401;
//     ctx.body = { message: "Not authorized" };
//     return;
//   }

//   // 1. Проверяем подпись refresh JWT
//   let decoded;
//   try {
//     decoded = verifyJWT(oldRefresh) as { id: string };
//   } catch {
//     ctx.status = 401;
//     ctx.body = { message: "Invalid refresh token" };
//     return;
//   }

//   const userId = decoded.id;

//   // 2. Ищем пользователя по id
//   const user = await ctx.db.getUserById(userId);

//   if (!user) {
//     ctx.status = 401;
//     ctx.body = { message: "User not found" };
//     return;
//   }

//   // 3. Проверяем, что refresh token существует в массиве
//   if (!user.refreshTokens?.includes(oldRefresh)) {
//     ctx.status = 401;
//     ctx.body = { message: "Invalid refresh token" };
//     return;
//   }

//   // 4. Удаляем старый refresh token
//   const refreshTokens = user.refreshTokens.filter(
//     (t: string) => t !== oldRefresh
//   );

//   // 5. Создаём новый refresh токен (JWT)
//   const newRefresh = createJWT({ id: user.id }, { expiresIn: "7d" });
//   refreshTokens.push(newRefresh);

//   // 6. Сохраняем в PB
//   await ctx.db.updateUser(user.id, {
//     refreshTokens,
//   });

//   // 7. Создаём новый access token
//   const accessToken = createJWT(
//     {
//       id: user.id,
//       email: user.email,
//       name: user.name,
//     },
//     { expiresIn: "15m" }
//   );

//   ctx.cookies.set("jwt", accessToken, {
//     httpOnly: true,
//     sameSite: "lax",
//     secure: false,
//     maxAge: 15 * 60 * 1000,
//   });

//   ctx.cookies.set("refresh_token", newRefresh, {
//     httpOnly: true,
//     sameSite: "lax",
//     secure: false,
//     maxAge: 7 * 24 * 60 * 60 * 1000,
//   });

//   ctx.body = {
//     message: "Refreshed",
//     user: {
//       id: user.id,
//       email: user.email,
//       name: user.name,
//     },
//   };
// });

loginRouter.get("/logout", async (ctx: Context) => {
  const refresh = ctx.cookies.get("refresh_token");

  if (refresh) {
    const decoded = verifyJWT(refresh) as { id: string };
    const user = await ctx.db.getUserById(decoded.id);

    if (user) {
      const newTokens = user.refreshTokens.filter((t: string) => t !== refresh);

      await ctx.db.updateUser(user.id, {
        refreshTokens: newTokens,
      });
    }
  }

  // очищаем куки
  ctx.cookies.set(JWT_COOKIE_NAME, null);
  ctx.cookies.set("refresh_token", null);

  ctx.body = { success: true };
});

module.exports = loginRouter;
