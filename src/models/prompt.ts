export interface Prompt {
  id: string;
  text: string;
  title?: string;
}

export type PromptDTO = Exclude<Prompt, "id">;
