"use strict";

const capture = require("../lib/capture.cjs");

capture
  .h264_hwencode("./dump/vid eo.mp4", "nvidia", {
    overwrite: true,
    audioInterface: "virtual-audio-capturer",
  })
  .then(console.log)
  .catch(console.error);
