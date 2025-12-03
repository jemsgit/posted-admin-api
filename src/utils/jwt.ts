const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key";
const JWT_EXPIRES_IN = "7d";

export function createJWT(payload: object, expiresIn: { expiresIn: string }) {
  return jwt.sign(payload, JWT_SECRET, expiresIn);
}

export function verifyJWT(token: string) {
  return jwt.verify(token, JWT_SECRET);
}

export function parseJwt(token: string) {
  try {
    return JSON.parse(Buffer.from(token.split(".")[1], "base64").toString());
  } catch {
    return null;
  }
}
