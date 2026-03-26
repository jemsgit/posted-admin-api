import { parseJwt } from "../utils/jwt";

function isExpired(db: any) {
  const token = db.pb?.authStore?.token;
  console.log("token is expired");
  if (!token) return true;

  const payload = parseJwt(token);

  console.log(payload);

  if (!payload?.exp) return true;

  return Date.now() >= payload.exp * 1000;
}

export async function ensurePbAdminAuth(ctx: any, next: () => void) {
  if (isExpired(ctx.db)) {
    await ctx.db.pb.admins.authWithPassword(
      process.env.PB_ADMIN_EMAIL,
      process.env.PB_ADMIN_PASSWORD
    );
  }
  return next();
}
