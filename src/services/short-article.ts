import GhostAdminAPI from "@tryghost/admin-api";
import FormData from "form-data";
import mime from "mime-types";
import MarkdownIt from "markdown-it";
import { AxiosResponse } from "axios";
import { URL } from "url";

import { getImage, getPage, parseArticle } from "./content-graber";
import { askGeminiAI } from "./ai";
import { ArticleData, Article } from "../models/ghost";

const api = new GhostAdminAPI({
  url: process.env.GHOST_URL as string,
  key: process.env.GHOST_ADMIN_KEY as string,
  version: "v5.0",
});

async function markdownToHtml(md: string) {
  const mdParser = new MarkdownIt();
  return mdParser.render(md);
}

async function uploadImage(imageResponse: AxiosResponse<any, any>) {
  const contentType = imageResponse.headers["content-type"] || "image/jpeg";
  const extension = mime.extension(contentType);
  const form = new FormData();

  form.append("file", imageResponse.data, {
    filename: `feature-image.${extension}`,
    contentType: contentType,
  });

  form.append("purpose", "image");

  try {
    // @ts-ignore
    let res = await api.images.upload(form);
    return res.url;
  } catch {
    return null;
  }
}

export async function addArticle({
  title,
  markdown,
  summary,
  slug,
  tags,
  feature_image,
}: ArticleData): Promise<Article> {
  const html = await markdownToHtml(markdown);

  const post = await (api.posts as any).add(
    {
      title,
      slug,
      html,
      custom_excerpt: summary,
      feature_image,
      status: "published",
      tags,
    },
    { source: "html" }
  );

  console.log(`✅ Added: ${post.url}`);

  return post;
}

export async function getArticleShortVersion(url: string, title: string) {
  const { selector, body } = await getPage(url);
  if (!body || !selector) return null;
  try {
    let article = await parseArticle(url, body);
    let image = await getImage(selector);
    let imageUrl = null;
    if (image) {
      imageUrl = await uploadImage(image.response);
    }

    let res = await askGeminiAI(
      "Summarize the article in 12-15 sentences in russian. If it needed you can add code samples and other markdown features. Result should be in markdown format for Ghost blog, add in the end link " +
        url +
        " with text 'Оригинал статьи: " +
        title +
        "'. Respond in following format: first string is title translated to russina, second string are tags for this article (2 or 3 in english), the rest is summarized article content:\n\n" +
        "Title: " +
        title +
        "\n\n" +
        "Article: " +
        article,
      "You are a helpful assistant and technical writer that summarizes articles into short concise summaries."
    );

    if (res?.answer) {
      const [translatedTitle, tags, ...content] = res.answer.split("\n");
      const text = content.join("\n");
      const urlObj = new URL(url);
      const pathname = urlObj.pathname.replace(/\/$/, "");
      const slug = pathname.split("/").pop() || "summarized-content";
      let data = await addArticle({
        title: translatedTitle,
        summary: `Выжимка статьи: ${title}`,
        markdown: text,
        feature_image: imageUrl,
        slug,
        tags: tags.split(",").map((tag) => tag.trim()),
      });
      return { url: data.url, html: data.html };
    }
    return null;
  } catch (e) {
    console.log(e);
    return null;
  }
}
