"use strict";

const capture = require("../lib/capture.cjs");

capture.hevc_hwencode("./dump/vid eo hevc.mp4", "nvidia", {
    framerate: 60,
    bits10: false,
    overwrite: true,
    audioInterface: "virtual-audio-capturer",
})
.then(console.log)
.catch(console.error);

/*capture.h264_hwencode("./dump/vid eo h264.mp4", "nvidia", {
    framerate: 30,
    bits10: true,
    overwrite: true,
    audioInterface: "virtual-audio-capturer",
})
.then(console.log)
.catch(console.error);*/
