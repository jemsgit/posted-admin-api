var grabberConfig = {
  "@test": {
    modulePath: "customModules/test/test.js",

    // content: ["channels/test/test_public.txt", "channels/test/test__channel.txt"],
    // contentResult: "channels/test/test__listResult.txt",
    // pending: "channels/test/test__channel.txt",
    times: "0 45 01 * * 2",
    sourceId: "@test",
  },
  "@jw_video": {
    modulePath: "customModules/JWVideo/coubGraber.js",
    // content: ["channels/JWVideo/JWVideo_channel.txt"],
    // contentResult: "channels/JWVideo/JWVideo_listResult.txt",
    times: "0 30 11 * * 3",
    sourceId: "@jw_video",
  },
};

module.exports = grabberConfig;
