import axios from "axios";
import * as cheerio from "cheerio";
import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";

export async function getPage(
  url: string
): Promise<{ selector: cheerio.CheerioAPI | null; body?: string }> {
  try {
    const htmlResponse = await axios.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; ImageFetcherBot/1.0)",
      },
      timeout: 10000,
    });
    const body = htmlResponse.data;
    const selector = cheerio.load(body);
    return { selector, body };
  } catch (e) {
    console.log(e);
    return { selector: null };
  }
}

export async function getImage($: cheerio.CheerioAPI) {
  const image = $("meta[property='og:image']").attr("content");
  if (!image) return null;
  try {
    const response = await axios.get(image, { responseType: "arraybuffer" });
    return { response, url: image };
  } catch (e) {
    return null;
  }
}

export function getDescription($: cheerio.CheerioAPI) {
  return $("meta[property='og:description']").attr("content");
}

export async function parseArticle(url: string, body: string) {
  const dom = new JSDOM(body, { url });
  const reader = new Readability(dom.window.document);
  const article = reader.parse();
  return article?.textContent || null;
}

export async function getPageContent(url: string) {
  const { body } = await getPage(url);
  if (!body) return null;
  return parseArticle(url, body);
}
