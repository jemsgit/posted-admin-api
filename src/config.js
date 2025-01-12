const serviceHost = process.env.SERVICE_HOST || process.env.HOST || "localhost";
const secret = process.env.AUTH_SECRET || "secret";

const config = {
  serviceHost,
  auth: {
    secret,
    cookieOptions: {
      ttl: "5 d",
    },
  },
};
