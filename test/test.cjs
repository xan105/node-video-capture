"use strict";

const capture = require("../lib/capture.cjs");

capture
  .h264_hwencode("./dump/vid eo.mp4", "nvidia", { overwrite: true })
  .then(console.log)
  .catch(console.error);
