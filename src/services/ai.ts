import OpenAI from "openai";
import { AIResponse } from "../models/ai";

const model = "gpt-4o-mini";
const key = "";
const key2 = "";
const client = new OpenAI({
  apiKey: key, // This is the default and can be omitted
});

export async function askAI(message: string): Promise<AIResponse | undefined> {
  try {
    client;
    const res = await client.chat.completions.create({
      messages: [{ role: "user", content: message }],
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
