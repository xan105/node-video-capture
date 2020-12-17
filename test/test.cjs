"use strict";

const vcapture = require("../lib/capture.cjs");

vcapture.h264_nvenc("./dump/video.mp4", { overwrite: true }).then(console.log).catch(console.error);
