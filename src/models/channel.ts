type PostingType = "link" | "video";
type LoadImageConfig = boolean | "random";
export type ContentType = "draft" | "main" | "result";

export interface Channel {
  username: string;
  hasDraft: boolean;
  graberSettings?: {
    modulePath: string;
    times: string;
  };
  postingSettings: {
    type: PostingType;
    times: string[];
    loadImage: LoadImageConfig;
  };
}

export interface ChannelSettings {
  type: PostingType;
  times: string[];
  loadImage: boolean;
  hasDraft: boolean;
}

export interface FileContentInfo {
  name: string;
  content: string;
}
