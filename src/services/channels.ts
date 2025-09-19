/* eslint-disable global-require */

import {
  Channel,
  ChannelDTO,
  ChannelsDTO,
  RequestContentDTO,
  RequestUpdateSettingsDTO,
  ResponseContentDTO,
} from "../models/channel";
import posterFetcher from "../lib/posterFetcher";
import {
  channelInfoMapper,
  channelsListInfoMapper,
} from "../adapters/channelInfoAdapter";
import {
  GrabberContentResponseDTO,
  GrabberFilesResponse,
} from "../models/grabber";

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

async function updateChannelSettings(
  channelId: string,
  params: any
): Promise<string | { error: boolean }> {
  try {
    await posterFetcher.patch<RequestUpdateSettingsDTO, boolean>(
      `/api/channels/info/${channelId}/`,
      {
        params,
      }
    );
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
    await posterFetcher.patch<RequestContentDTO, ResponseContentDTO>(
      `/api/channels/copy-content/${channelId}/${type}`,
      {
        channelId,
        type,
        content,
      }
    );
    return "Ok";
  } catch (e) {
    console.log(e);
    return {
      error: true,
    };
  }
}

async function getChannelGrabber(
  channelId: string
): Promise<GrabberFilesResponse | { error: boolean }> {
  try {
    let result = await posterFetcher.get<GrabberFilesResponse>(
      `/api/channels/grabbers/${channelId}`
    );
    return result.data;
  } catch (e) {
    console.log(e);
    return {
      error: true,
    };
  }
}

async function testChannelGrabber(
  channelId: string
): Promise<GrabberContentResponseDTO | { error: boolean }> {
  try {
    let result = await posterFetcher.post<unknown, GrabberContentResponseDTO>(
      `/api/channels/test-grab/${channelId}`,
      {}
    );
    console.log(result);
    return result.data;
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
  updateChannelSettings,
  getChannelGrabber,
  testChannelGrabber,
};
