"use strict";

const vcapture = require("../lib/capture.cjs");

vcapture.h264_nvenc("./dump/vid eo.mp4", { overwrite: true }).then(console.log).catch(console.error);
