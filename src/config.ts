import dotenv from "dotenv";
dotenv.config();

interface Config {
  port: string;
  pocketbaseUrl: string;
  posterApiUrl: string;
  posterApiToken: string;
  auth: {
    cookieOptions: {
      ttl: string;
    };
  };
}

const port = process.env.PORT as string;
const pocketbaseUrl = process.env.POCKET_BASE_URL as string;
const posterApiUrl = process.env.POSTER_API_URL as string;
const posterApiToken = process.env.POSTER_API_TOKEN as string;

const config: Config = {
  port,
  pocketbaseUrl,
  posterApiUrl,
  posterApiToken,
  auth: {
    cookieOptions: {
      ttl: "5 d",
    },
  },
};

export default config;
