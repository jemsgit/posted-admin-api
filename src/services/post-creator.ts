import { askGeminiAI } from "./ai";
import { getFullPageInfo } from "./content-graber";

export async function createPostFromUrl(
  url: string,
  prompt: string,
  systemContent?: string
) {
  try {
    const data = await getFullPageInfo(url);

    const pieces = [
      data.title ? `Title: ${data.title}` : null,
      data.description ? `Description: ${data.description}` : null,
      data.content ? `Content:\n${data.content}` : null,
    ]
      .filter(Boolean)
      .join("\n\n");

    const message = `${prompt}\n\n${pieces}`;

    const result = await askGeminiAI(
      message,
      systemContent ||
        "You are professional technical writer. You are preparing content for telegram channel. Your task is to create concise, engaging Telegram posts.Tone: clear, lively, without excessive emojis."
    );
    return result;
  } catch (e) {
    console.log("createPostFromUrl error", e);
    return undefined;
  }
}
