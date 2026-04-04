import { ask, AIServiceType } from "./ai";
import posterFetcher from "../lib/posterFetcher";
import { getChannelContentById, getChannelInfoById } from "./channels";
import { getFullPageInfo } from "./content-graber";
import { markupRules } from "../const/content";
import { AIRules } from "../models/channel";

const MIN_TITLE_LENGTH = 20;
const ARTICLES_LIMIT = 200;
const TOP_COUNT = 30;
const SCORE_BATCH_SIZE = 20;
const AI_DELAY_MS = 5000;
const CONTENT_CHAR_LIMIT = 4000;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

interface Article {
  url: string;
  text: string;
  image?: string;
  video?: string;
  original: string;
}

interface ScoredArticle extends Article {
  score: number;
}

interface EnrichedArticle extends ScoredArticle {
  pageTitle: string | null;
  description: string | null;
  content: string | null;
}

const service: AIServiceType = "openai";

function separateHashTags(messageParts: string[]) {
  const message: string[] = [];
  const tags: string[] = [];
  messageParts.forEach(function (word) {
    if (word.indexOf("##") === 0) {
      tags.push(word.slice(1));
    } else {
      message.push(word);
    }
  });
  return {
    tags,
    text: message,
  };
}

function separateImage(messageParts: string[]) {
  const imgRegexp = /(\[img-at\]\((http).*\))/g;
  const message: string[] = [];
  const images: string[] = [];
  messageParts.forEach(function (word) {
    if (word.match(imgRegexp)) {
      images.push(word);
    } else {
      message.push(word);
    }
  });
  let image;
  if (images[0]) {
    image = images[0].replace("[img-at](", "").replace(")", "");
  }

  return {
    imageUrl: image,
    text: message,
  };
}

function separateVideo(messageParts: string[]) {
  const imgRegexp = /(\[video-at\]\((http).*\))/g;
  const message: string[] = [];
  const videos: string[] = [];
  messageParts.forEach(function (word) {
    if (word.match(imgRegexp)) {
      videos.push(word);
    } else {
      message.push(word);
    }
  });
  let video;
  if (videos[0]) {
    video = videos[0].replace("[video-at](", "").replace(")", "");
  }

  return {
    videoUrl: video,
    text: message,
  };
}

function linkMessageParseTg(postData: string) {
  // http://www.test_link.com text [](http://attach_image_url) ##hashTag
  let dataList = postData.split(" ");
  let link = dataList.splice(0, 1)[0];
  let hashResult = separateHashTags(dataList);
  let imageResult = separateImage(hashResult.text);
  let videoResult = separateVideo(hashResult.text);
  const textSource =
    imageResult.text.length < videoResult.text.length
      ? imageResult
      : videoResult;
  let text = textSource.text.join(" ");
  return {
    text,
    url: link,
    image: imageResult.imageUrl,
    video: videoResult.videoUrl,
    original: postData,
  };
}

// ─── Fetch ───────────────────────────────────────────────────────────────────

async function fetchArticles(
  channelId: string,
  limit?: number,
  draftSource = true,
): Promise<Article[]> {
  let channelData = await getChannelContentById(
    channelId,
    draftSource ? "draft" : "main",
  );

  if ("error" in channelData) {
    throw Error("NO content");
  }
  let res: string[] = channelData.content.split("\n");
  res = res.slice(0, limit ?? ARTICLES_LIMIT);
  const articles = res.map((text) => {
    return linkMessageParseTg(text);
  });
  return articles;
}

// ─── Pre-filter ──────────────────────────────────────────────────────────────

function preFilter(articles: Article[]): Article[] {
  return articles
    .filter((a) => a.text.length >= MIN_TITLE_LENGTH)
    .filter((a) => !a.url.includes("youtube"));
}

// ─── AI scoring ──────────────────────────────────────────────────────────────

async function scoreBatch(
  batch: Article[],
  channelDescription: string,
  service: AIServiceType,
): Promise<ScoredArticle[]> {
  const list = batch.map((a, i) => `${i + 1}. [${a.url}] ${a.text}`).join("\n");

  const prompt = `You are a Telegram channel editor. Channel description: ${channelDescription}.
Rate the appeal of each article for the channel's audience from 1 to 10 by its title and description (if description provided)
Consider: topic relevance, clarity of the title, practical value.

Article list:
${list}

Answer ONLY with valid JSON-array without any explanation, with format:
[{"index": 1, "score": 8}, {"index": 2, "score": 5}, ...]`;

  const result = await ask(service, prompt);
  if (!result?.answer) return batch.map((a) => ({ ...a, score: 0 }));

  try {
    const jsonMatch = result.answer.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error("No JSON array found");
    const scores: { index: number; score: number }[] = JSON.parse(jsonMatch[0]);
    return batch.map((a, i) => {
      const found = scores.find((s) => s.index === i + 1);
      return { ...a, score: found?.score ?? 0 };
    });
  } catch (e) {
    console.error("Score parse error:", e);
    return batch.map((a) => ({ ...a, score: 0 }));
  }
}

async function scoreAllArticles(
  articles: Article[],
  channelDescription: string,
  service: AIServiceType,
): Promise<ScoredArticle[]> {
  const results: ScoredArticle[] = [];
  for (let i = 0; i < articles.length; i += SCORE_BATCH_SIZE) {
    if (i > 0) await sleep(AI_DELAY_MS);
    const batch = articles.slice(i, i + SCORE_BATCH_SIZE);
    const scored = await scoreBatch(batch, channelDescription, service);
    results.push(...scored);
  }
  return results;
}

async function enrichArticles(
  articles: ScoredArticle[],
): Promise<EnrichedArticle[]> {
  return Promise.all(
    articles.map(async (a) => {
      try {
        const info = await getFullPageInfo(a.url);
        return {
          ...a,
          pageTitle: info.title,
          description: info.description,
          content: info.content
            ? info.content.slice(0, CONTENT_CHAR_LIMIT)
            : null,
        };
      } catch {
        return { ...a, pageTitle: null, description: null, content: null };
      }
    }),
  );
}

// ─── Summary generation ──────────────────────────────────────────────────────

async function generateSummaryForArticle(
  a: EnrichedArticle,
  channelDescription: string,
  channelLang: string,
  postExtamples: string[],
  channelRules?: AIRules,
  service?: AIServiceType,
): Promise<string> {
  const parts = [`Title: "${a.pageTitle || a.text}"`];
  if (a.description) parts.push(`Description: "${a.description}"`);
  if (a.content) parts.push(`The rest data is content: ${a.content}`);
  const summaryRules =
    channelRules?.prompt ||
    `First sentence of the post should be transtalion of title to channel language. Post should be with custom markdown and follow this format (first word is link): "${a.url} *Title (1 sentence)*///n///nArticle summary (1-2 sentences, better short for best understanding)".`;
  const examples = postExtamples.length
    ? `Here are examples of results for writing style reference: "${(postExtamples || []).join(", ")}"`
    : "";

  const prompt = `You are a Telegram channel editor. Create post for telegram channel for given article data. Data includes title, description from meta tags and article content. Keep in mind channel description and make content according to this description: ${
    channelDescription
  }. Language for post should be ${
    channelLang || "russian"
  }. Url of resource is: ${a.url}}. ${summaryRules}. Markup rules are ${markupRules}. Requirements: write only the essence of the article, the description should be catchy, explain the essence. Do not mention the author, publication, or source. Do not use phrases like "the article says," "the author writes," etc. Present it as if it’s a summary for channel subscribers. ${examples}
${parts.join("\n")}`;

  const result = await ask(
    service,
    prompt,
    channelRules?.system,
    channelRules?.temperature,
  );
  const text = result?.answer?.trim();
  console.log("summary response: ", text);
  return text || a.text;
}

async function generateSummaries(
  articles: EnrichedArticle[],
  channelDescription: string,
  channelLang: string,
  postExtamples: string[],
  channelRules?: AIRules,
  service?: AIServiceType,
): Promise<{ url: string; summary: string }[]> {
  const results: { url: string; summary: string }[] = [];
  for (const [i, a] of articles.entries()) {
    if (i > 0) await sleep(AI_DELAY_MS);
    const summary = await generateSummaryForArticle(
      a,
      channelDescription,
      channelLang,
      postExtamples,
      channelRules,
      service,
    );
    const text = `${summary}${a.image ? ` [img-at](${a.image})` : ""}${a.video ? ` [video-at](${a.video})` : ""}`;
    results.push({ url: a.url, summary: text });
  }
  return results;
}

// ─── Write summary.txt ───────────────────────────────────────────────────────

// ─── Summary file via poster-bot API ─────────────────────────────────────────

async function writeSummaryFile(
  channelId: string,
  entries: { url: string; summary: string }[],
): Promise<void> {
  const content = entries.map((e) => `${e.summary}`).join("\n");
  await posterFetcher.put("/api/channels/content", {
    channelId,
    type: "summary",
    content,
  });
}

export async function readSummaryFile(
  channelId: string,
): Promise<string | null> {
  try {
    const res = await posterFetcher.get<{ content: string }>(
      "/api/channels/content",
      { channelId, type: "summary" },
    );
    return res.data.content ?? null;
  } catch {
    return null;
  }
}

// ─── Main pipeline ───────────────────────────────────────────────────────────

export async function runArticlePipeline(
  channelId: string,
  articlesLimit?: number,
  topCount?: number,
  draftSource = true,
): Promise<void> {
  const channelInfoResult = await getChannelInfoById(channelId);
  if ("error" in channelInfoResult) {
    throw new Error(`Failed to fetch channel info for '${channelId}'`);
  }
  const channelDescription = channelInfoResult.description ?? "";
  const channelLang = channelInfoResult.language ?? "russian";
  const summaryRules = channelInfoResult.summaryRules;

  const raw = await fetchArticles(channelId, articlesLimit, draftSource);
  const filtered = preFilter(raw);
  const scored = await scoreAllArticles(filtered, channelDescription, service);
  const top = scored
    .sort((a, b) => b.score - a.score)
    .slice(0, topCount ?? TOP_COUNT);
  const enriched = await enrichArticles(top);
  const summaries = await generateSummaries(
    enriched,
    channelDescription,
    channelLang,
    channelInfoResult.postExamples || [],
    summaryRules,
    service,
  );
  await writeSummaryFile(channelId, summaries);
}
