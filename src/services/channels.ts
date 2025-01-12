/* eslint-disable global-require */

import { Channel, ChannelSettings, FileContentInfo } from "../models/channel";
import { GrabberSettings } from "../models/grabber";

/* eslint-disable import/no-dynamic-require */
const path = require("path");
const {
  getFileTopContent,
  updateFileTopContent,
} = require("../utils/file-utils");

const POSTER_FOLDER = "./poster";
const CHANNEL_SETTINGS_PATH = "./poster/settings/telegramchannels.js";
const GRABBER_SETTINGS_PATH = "./poster/settings/grabber.js";
const EDIT_LINES_COUNT = 300;
const draftContentPath = "./poster/channels/{channelId}/draft.txt";
const mainContentPath = "./poster/channels/{channelId}/main.txt";
const resultContentPath = "./poster/channels/{channelId}/result.txt";

async function getFilesInfo(fileList: string[]): Promise<FileContentInfo[]> {
  const promises: Promise<string>[] = [];
  fileList.forEach((val) => {
    const fielPath = path.resolve(process.env.PWD, val);
    const def: Promise<string> = getFileTopContent(
      fielPath,
      EDIT_LINES_COUNT
    ).catch(() => "");
    promises.push(def);
  });

  const contentData = await Promise.all(promises);

  const fileContentList: FileContentInfo[] = [];
  fileList.forEach((val, index) => {
    fileContentList.push({
      name: val,
      content: contentData[index],
    });
  });
  return fileContentList;
}

function getChannelFilesPath(channelId: string, hasDraft: boolean) {
  let fileList = [
    mainContentPath.replace("{channelId}", channelId),
    resultContentPath.replace("{channelId}", channelId),
  ];

  if (hasDraft) {
    fileList.push(draftContentPath.replace("{channelId}", channelId));
  }

  return fileList;
}

async function getChannelContentInfo(
  channelInfo: ChannelSettings,
  id: string
): Promise<FileContentInfo[]> {
  const fileList = getChannelFilesPath(id, channelInfo.hasDraft);
  const fileContentList: FileContentInfo[] = await getFilesInfo(fileList);
  return fileContentList;
}

async function getChannelInfoById(
  channelId: string
): Promise<Channel | undefined> {
  let modulePath = path.resolve(process.env.PWD, GRABBER_SETTINGS_PATH);
  const channelSettingsPath = path.resolve(
    process.env.PWD,
    CHANNEL_SETTINGS_PATH
  );
  const grabberSettings = require(modulePath) as Record<
    string,
    GrabberSettings
  >;
  const channels = require(channelSettingsPath) as Record<
    string,
    ChannelSettings
  >;
  const channelInfo = channels[channelId] as ChannelSettings;
  if (!channelInfo) {
    return;
  }
  const grabberInfo = grabberSettings[channelId];

  const { hasDraft, times, loadImage, type } = channelInfo;
  return {
    username: channelId,
    hasDraft,
    postingSettings: {
      type,
      times,
      loadImage,
    },
    graberSettings: grabberInfo
      ? {
          modulePath: grabberInfo.modulePath,
          times: grabberInfo.times,
        }
      : undefined,
  };
}

function getChannelsList(): Channel[] {
  let modulePath = path.resolve(process.env.PWD, GRABBER_SETTINGS_PATH);
  const channelSettingsPath = path.resolve(
    process.env.PWD,
    CHANNEL_SETTINGS_PATH
  );
  const grabberSettings = require(modulePath) as Record<
    string,
    GrabberSettings
  >;
  const channelsSettings = require(channelSettingsPath) as Record<
    string,
    ChannelSettings
  >;
  const result: Channel[] = [];
  Object.entries(channelsSettings).forEach(([key, value]) => {
    const grabberInfo = grabberSettings[key];
    result.push({
      username: key,
      hasDraft: value.hasDraft,
      postingSettings: {
        type: value.type,
        times: value.times,
        loadImage: value.loadImage,
      },
      graberSettings: grabberInfo
        ? {
            modulePath: grabberInfo.modulePath,
            times: grabberInfo.times,
          }
        : undefined,
    });
  });
  return result;
}

function checkChannelHasFile(id: string, filePath: string) {
  const modulePath = path.resolve(process.env.PWD, GRABBER_SETTINGS_PATH);
  const channelSettings = require(modulePath) as Record<string, Channel>;

  const currentChannelSettings = channelSettings[id];
  if (!currentChannelSettings) {
    return false;
  }
  const fileList = getChannelFilesPath(id, currentChannelSettings.hasDraft);
  return fileList.some((item) => item === filePath);
}

async function updateFileContent(filePath: string, content: string) {
  let result = true;
  try {
    const file = path.resolve(process.env.PWD, POSTER_FOLDER, filePath);
    await updateFileTopContent(file, content, EDIT_LINES_COUNT);
  } catch (e) {
    result = false;
  }

  return result;
}

module.exports = {
  getChannelInfoById,
  getChannelsList,
  checkChannelHasFile,
  updateFileContent,
};
