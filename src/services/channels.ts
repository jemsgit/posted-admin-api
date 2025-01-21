/* eslint-disable global-require */

import {
  Channel,
  ChannelDTO,
  ChannelsDTO,
  RequestContentDTO,
  ResponseContentDTO,
} from "../models/channel";
import posterFetcher from "../lib/posterFetcher";
import {
  channelInfoMapper,
  channelsListInfoMapper,
} from "../adapters/channelInfoAdapter";

async function getChannelInfoById(
  channelId: string
): Promise<Channel | { error: boolean }> {
  try {
    let res = await posterFetcher.get<ChannelDTO>(
      `/api/channels/info/${channelId}`
    );
    return channelInfoMapper(res.data);
  } catch (e) {
    return {
      error: true,
    };
  }
}

async function getChannelsList(): Promise<Channel[] | { error: boolean }> {
  try {
    let result = await posterFetcher.get<ChannelsDTO>("/api/channels/info");
    return channelsListInfoMapper(result.data);
  } catch (e) {
    console.log(e);
    return {
      error: true,
    };
  }
}

async function getChannelContentById(
  channelId: string,
  type: string
): Promise<ResponseContentDTO | { error: boolean }> {
  try {
    let result = await posterFetcher.get<ResponseContentDTO>(
      "/api/channels/content",
      {
        channelId,
        type,
      }
    );
    return result.data;
  } catch (e) {
    console.log(e);
    return {
      error: true,
    };
  }
}

async function updateChannelContentById(
  channelId: string,
  type: string,
  content: string
): Promise<string | { error: boolean }> {
  try {
    let result = await posterFetcher.patch<
      RequestContentDTO,
      ResponseContentDTO
    >("/api/channels/content", {
      channelId,
      type,
      content,
    });
    return "Ok";
  } catch (e) {
    console.log(e);
    return {
      error: true,
    };
  }
}

async function copyContentToChannel(
  channelId: string,
  type: string,
  content: string
): Promise<string | { error: boolean }> {
  try {
    let result = await posterFetcher.patch<
      RequestContentDTO,
      ResponseContentDTO
    >(`/api/channels/copy-content/${channelId}/${type}`, {
      channelId,
      type,
      content,
    });
    return "Ok";
  } catch (e) {
    console.log(e);
    return {
      error: true,
    };
  }
}

module.exports = {
  getChannelInfoById,
  getChannelsList,
  getChannelContentById,
  updateChannelContentById,
  copyContentToChannel,
};
