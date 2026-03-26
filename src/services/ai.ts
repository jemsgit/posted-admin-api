import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Anthropic from "@anthropic-ai/sdk";
import { AIResponse } from "../models/ai";

export type AIServiceType = "gemini" | "openai" | "claudecode";

const DEFAULT_SYSTEM =
  "You are senior fullstack and mobile developer and content manager of telegram channels";

// ─── Clients ─────────────────────────────────────────────────────────────────

const geminiKey = process.env.OPENAI_KEY as string;
const genAI = new GoogleGenerativeAI(geminiKey);

const openaiClient = new OpenAI({
  apiKey: geminiKey,
});

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_KEY as string,
});

// ─── Per-provider implementations ────────────────────────────────────────────

async function askGemini(
  message: string,
  systemContent?: string,
): Promise<AIResponse | undefined> {
  try {
    const modelInstance = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
    });
    let result;
    if (systemContent) {
      result = await modelInstance.generateContent({
        contents: [
          { role: "model", parts: [{ text: systemContent }] },
          { role: "user", parts: [{ text: message }] },
        ],
      });
    } else {
      result = await modelInstance.generateContent({
        contents: [{ role: "user", parts: [{ text: message }] }],
      });
    }

    return {
      answer: result.response.text(),
      usage: result.response.usageMetadata?.totalTokenCount || 0,
    };
  } catch (e) {
    console.log(e);
    return undefined;
  }
}

async function askOpenAI(
  message: string,
  systemContent?: string,
  temperature?: number,
): Promise<AIResponse | undefined> {
  console.log(message);
  console.log(systemContent);
  try {
    let res;
    if (systemContent) {
      res = await openaiClient.chat.completions.create({
        model: "gpt-5.4-nano",
        temperature,
        messages: [
          { role: "system", content: systemContent },
          { role: "user", content: message },
        ],
      });
    } else {
      res = await openaiClient.chat.completions.create({
        model: "gpt-5.4-nano",
        temperature,
        messages: [{ role: "user", content: message }],
      });
    }
    return {
      answer: res.choices[0].message.content,
      usage: res.usage?.total_tokens,
    };
  } catch (e) {
    console.log(e);
    return undefined;
  }
}

async function askClaudeCode(
  message: string,
  systemContent?: string,
  temperature?: number,
): Promise<AIResponse | undefined> {
  try {
    let res;
    if (systemContent) {
      res = await anthropic.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 4096,
        system: systemContent,
        temperature,
        messages: [{ role: "user", content: message }],
      });
    } else {
      res = await anthropic.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 4096,
        temperature,
        messages: [{ role: "user", content: message }],
      });
    }
    const textBlock = res.content.find((b) => b.type === "text");
    return {
      answer: textBlock?.type === "text" ? textBlock.text : null,
      usage: res.usage.input_tokens + res.usage.output_tokens,
    };
  } catch (e) {
    console.log(e);
    return undefined;
  }
}

// ─── Unified entry point ──────────────────────────────────────────────────────

export async function ask(
  service: AIServiceType = "gemini",
  message: string,
  systemContent?: string,
  temperature = 0.5,
): Promise<AIResponse | undefined> {
  const system = systemContent;
  switch (service) {
    case "openai":
      return askOpenAI(message, system, temperature);
    case "claudecode":
      return askClaudeCode(message, system, temperature);
    case "gemini":
    default:
      return askGemini(message, system);
  }
}

// ─── Backward-compatible exports ─────────────────────────────────────────────

export async function askGeminiAI(
  message: string,
  systemContent?: string,
): Promise<AIResponse | undefined> {
  return ask("gemini", message, systemContent);
}

export async function askGeminiAIStream(
  message: string,
  systemContent?: string,
  onChunk?: (chunk: string) => void,
) {
  const modelInstance = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  const system =
    systemContent ||
    "You are senior fullstack and mobile developer and technical writer";
  const res = await modelInstance.generateContentStream({
    contents: [
      { role: "model", parts: [{ text: system }] },
      { role: "user", parts: [{ text: message }] },
    ],
  });

  let fullText = "";
  for await (const event of res.stream) {
    const chunk = event.text() || "";
    fullText += chunk;
    if (onChunk) onChunk(chunk);
  }
  return { answer: fullText };
}
