type PostingType = "link" | "video";
type LoadImageConfig = boolean | "random";
export type ContentType = "draft" | "main" | "result";

export interface Channel {
  username: string;
  graberSettings?: {
    modulePath: string;
    times: string;
    hasDraft?: boolean;
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

interface ChannelInfoDTO {
  type: PostingType;
  times: string[];
  loadImage: LoadImageConfig;
  channelId: string;
}

interface GrabberInfoDTO {
  modulePath: string;
  times: string;
  sourceId: string;
  hasDraft?: boolean;
  channelId: string;
}

export interface ChannelsDTO {
  channels: Record<string, ChannelInfoDTO>;
  grabbers: Record<string, GrabberInfoDTO>;
}

export interface ChannelDTO {
  channel: ChannelInfoDTO;
  grabber?: GrabberInfoDTO;
}

export interface RequestContentDTO {
  channelId: string;
  type: string;
  content: string;
}

export interface ResponseContentDTO {
  channelId: string;
  type: string;
  content: string;
}
