import { Channel, ChannelDTO, ChannelsDTO } from "../models/channel";

export function channelInfoMapper(channelInfo: ChannelDTO) {
  const { channel, grabber } = channelInfo;
  const { times, loadImage, type, channelId, description } = channel;
  return {
    username: channelId,
    description,
    postingSettings: {
      type,
      times,
      loadImage,
    },
    graberSettings: grabber
      ? {
          modulePath: grabber.modulePath,
          times: grabber.times,
          hasDraft: grabber.hasDraft || false,
        }
      : undefined,
  };
}

export function channelsListInfoMapper(channelsInfo: ChannelsDTO) {
  const { channels, grabbers } = channelsInfo;
  let channelInfo: Channel[] = [];
  Object.keys(channels).forEach((key) => {
    const channel = channels[key];
    const grabber = grabbers[key];
    channelInfo.push(channelInfoMapper({ channel, grabber }));
  });

  return channelInfo;
}
