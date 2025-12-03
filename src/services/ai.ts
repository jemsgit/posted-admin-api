import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { AIResponse } from "../models/ai";

const model = "gemini-2.5-flash";
const key = process.env.OPENAI_KEY as string;
const client = new OpenAI({
  apiKey: key,
  baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
});

const genAI = new GoogleGenerativeAI(key);

export async function askGeminiAI(
  message: string,
  systemContent?: string
): Promise<AIResponse | undefined> {
  try {
    const modelInstance = genAI.getGenerativeModel({ model });
    systemContent =
      systemContent ||
      "You are senior fullstack and mobile developer and content manager of telegram channels";
    const req = systemContent
      ? {
          contents: [
            { role: "model", parts: [{ text: systemContent }] },
            { role: "user", parts: [{ text: message }] },
          ],
        }
      : { contents: [{ role: "user", parts: [{ text: message }] }] };
    const result = await modelInstance.generateContent(req);
    const answer = result.response.text();

    return {
      answer,
      usage: result.response.usageMetadata?.totalTokenCount || 0,
    };
  } catch (e) {
    console.log(e);
    return undefined;
  }
}

export async function askGeminiAIStream(
  message: string,
  systemContent?: string,
  onChunk?: (chunk: string) => void
) {
  const modelInstance = genAI.getGenerativeModel({ model });
  systemContent =
    systemContent ||
    "You are senior fullstack and mobile developer and content manager of telegram channels";
  const req = systemContent
    ? {
        contents: [
          { role: "model", parts: [{ text: systemContent }] },
          { role: "user", parts: [{ text: message }] },
        ],
      }
    : { contents: [{ role: "user", parts: [{ text: message }] }] };

  const res = await modelInstance.generateContentStream(req);

  let fullText = "";

  console.log(res);
  console.log(res.stream);

  for await (const event of res.stream) {
    const chunk = event.text() || "";
    fullText += chunk;
    if (onChunk) onChunk(chunk); // callback for streaming
  }

  return {
    answer: fullText,
  };
}

export async function askAI(
  message: string,
  systemContent?: string
): Promise<AIResponse | undefined> {
  try {
    systemContent =
      systemContent ||
      "You are senior fullstack and mobile developer and content manager of telegram channels";
    const res = await client.chat.completions.create({
      messages: [
        {
          role: "system",
          content: systemContent,
        },
        { role: "user", content: message },
      ],
      model,
    });

    return {
      answer: res.choices[0].message.content,
      usage: res.usage?.total_tokens,
    };
  } catch (e) {
    console.log(e);
    return undefined;
  }
}
