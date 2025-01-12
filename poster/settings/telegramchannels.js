var channels = {
  "@test": {
    source: "channels/test/test_channel.txt",
    type: "links",
    times: ["11:30[1-5]", "16:50[4-6]", "18:30[0-6]"],
    loadImage: "random",
    hasDraft: true,
  },
  "@jw_video": {
    source: "channels/JWVideo/JWVideo_channel.txt",
    type: "video",
    times: ["12:45", "16:20", "18:00"],
    loadImage: false,
    hasDraft: false,
  },
};

module.exports = channels;
