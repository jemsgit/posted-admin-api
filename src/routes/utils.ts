import { Context } from "koa";
import koaBody from "koa-body";
import send from "koa-send";
import fs from "fs";
import path from "path";
import authMiddleware from "../middlewares/auth-middleware";
import axios from "axios";
import Router from "koa-router";
import * as cheerio from "cheerio";

import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";

const utilsRouter = new Router({
  prefix: "/api/utils",
});

utilsRouter.get("/image", authMiddleware, async (ctx: Context) => {
  let imageUrl = ctx.query.url as string;
  const sourceUrl = ctx.query.source as string;
  if (!imageUrl && !sourceUrl) {
    ctx.status = 400;
    ctx.body = { error: true, details: "Missing url/source query param" };
    return;
  }
  try {
    if (sourceUrl) {
      const { data: html } = await axios.get(sourceUrl, {
        headers: { "User-Agent": "Mozilla/5.0 ReaderBot" },
      });

      const $ = cheerio.load(html);
      imageUrl =
        imageUrl || $('meta[property="og:image"]').attr("content") || "";
    }
    if (imageUrl) {
      const response = await axios.get(imageUrl, { responseType: "stream" });
      ctx.set("Content-Type", response.headers["content-type"] || "image/jpeg");
      ctx.status = 200;
      ctx.body = response.data;
    }
  } catch (err) {
    ctx.status = 502;
    ctx.body = { error: true, details: "Failed to fetch image" };
  }
});

utilsRouter.post(
  "/images",
  koaBody({
    multipart: true,
    formidable: {
      maxFileSize: 50 * 1024 * 1024, // 50MB
      uploadDir: path.resolve(__dirname, "../../static"),
      keepExtensions: true,
    },
  }),
  authMiddleware,
  async (ctx: Context) => {
    const files = ctx.request.files;
    if (!files || !files.file) {
      ctx.status = 400;
      ctx.body = { message: "No file uploaded" };
      return;
    }
    const file = Array.isArray(files.file) ? files.file[0] : files.file;
    // Generate unique filename
    const ext = path.extname(file.originalFilename || "");
    const unique = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const newFilename = `${unique}${ext}`;
    const staticDir = path.resolve(__dirname, "../../static");
    const newPath = path.join(staticDir, newFilename);
    fs.renameSync(file.filepath, newPath);
    ctx.body = {
      filename: newFilename,
      url: `${newFilename}`,
      size: file.size,
      type: file.mimetype,
    };
  }
);

// Static file serving (no auth)
utilsRouter.get("/static/:filename", async (ctx: Context) => {
  try {
    await send(ctx, ctx.params.filename, {
      root: path.resolve(__dirname, "../../static"),
    });
  } catch (err) {
    ctx.status = 404;
    ctx.body = { message: "File not found" };
  }
});

// List all static files (no auth)
utilsRouter.get("/images", async (ctx: Context) => {
  const staticDir = path.resolve(__dirname, "../../static");
  try {
    const files = fs.readdirSync(staticDir);
    ctx.body = files.map((f: string) => ({ filename: f, url: `${f}` }));
  } catch (err) {
    ctx.status = 500;
    ctx.body = { message: "Error reading static files" };
  }
});

// Delete static file (auth required)
utilsRouter.delete("/images/:filename", authMiddleware, async (ctx) => {
  const staticDir = path.resolve(__dirname, "../../static");
  const filePath = path.join(staticDir, ctx.params.filename);
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      ctx.body = { message: "File deleted" };
    } else {
      ctx.status = 404;
      ctx.body = { message: "File not found" };
    }
  } catch (err) {
    ctx.status = 500;
    ctx.body = { message: "Error deleting file" };
  }
});

utilsRouter.get("/fetch-images", async (ctx) => {
  const { url } = ctx.query;

  if (!url || typeof url !== "string") {
    ctx.status = 400;
    ctx.body = { error: "Missing url parameter" };
    return;
  }

  try {
    const images: { url: string; base64: string | null }[] = [];

    // ✅ Special case: YouTube previews
    const ytMatch = url.match(
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_\-]{11})/
    );
    if (ytMatch) {
      const videoId = ytMatch[1];
      const ytBase = `https://img.youtube.com/vi/${videoId}`;
      const ytUrls = [
        `${ytBase}/maxresdefault.jpg`,
        `${ytBase}/maxres1.jpg`,
        `${ytBase}/maxres2.jpg`,
      ];

      for (const imgUrl of ytUrls) {
        try {
          const res = await axios.get(imgUrl, { responseType: "arraybuffer" });
          const base64 = Buffer.from(res.data).toString("base64");
          images.push({ url: imgUrl, base64 });
        } catch {
          images.push({ url: imgUrl, base64: null });
        }
      }

      let ytDescription = "";

      try {
        // ✅ Fetch HTML
        const ythtml = await axios.get(url, {
          headers: {
            "User-Agent": "Mozilla/5.0 (compatible; ImageFetcherBot/1.0)",
          },
          timeout: 1000,
        });
        const body = ythtml.data;

        // Use regex to extract the JSON substring
        const search = 'attributedDescription":{"content":"';
        const start = body.indexOf(search);
        if (start) {
          try {
            // Parse it safely into JSON
            let end = body.indexOf("commandRuns", start);
            ytDescription = body.slice(start + search.length, end);
            ytDescription = ytDescription
              .replace(/\u00A0/g, " ") // non-breaking spaces → normal
              .replace(/\\n/g, "\n") // tidy newlines
              .trim();
          } catch (err) {
            console.error("JSON parse failed:", err);
          }
        } else {
          console.error("Not found!");
        }
      } catch {
        console.log("error get description");
      }
      ctx.body = {
        images,
        article: "youtube video",
        description: ytDescription,
      };
      return;
    }

    // ✅ Fetch HTML
    const htmlResponse = await axios.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; ImageFetcherBot/1.0)",
      },
      timeout: 10000,
    });
    const body = htmlResponse.data;
    const $ = cheerio.load(body);

    // 1. Try og:image
    const ogImage = $("meta[property='og:image']").attr("content");
    const description = $("meta[property='og:description']").attr("content");
    if (ogImage) {
      try {
        const res = await axios.get(ogImage, { responseType: "arraybuffer" });
        const base64 = Buffer.from(res.data).toString("base64");
        images.push({ url: ogImage, base64 });
      } catch {
        images.push({ url: ogImage, base64: null });
      }
    }

    // 2. Fallback: grab a few <img> from main/article/content

    const selectors = ["main img", "article img", ".content img"];
    let found: string[] = [];
    selectors.forEach((sel) => {
      $(sel).each((_, el) => {
        const src = $(el).attr("src");
        if (src && found.length < 5) {
          found.push(new URL(src, url).href);
        }
      });
    });

    found = found.slice(0, 3);

    for (const imgUrl of found) {
      try {
        const res = await axios.get(imgUrl, { responseType: "arraybuffer" });
        const base64 = Buffer.from(res.data).toString("base64");
        images.push({ url: imgUrl, base64 });
      } catch {
        images.push({ url: imgUrl, base64: null });
      }
    }

    const dom = new JSDOM(body, { url });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();

    ctx.body = { images, article: article?.textContent, description };
  } catch (err) {
    console.error(err);
    ctx.status = 500;
    ctx.body = { error: "Failed to fetch images" };
  }
});

export default utilsRouter;
