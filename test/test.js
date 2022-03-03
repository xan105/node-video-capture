import { hwencode } from "../lib/index.js";

/*hwencode("./dump/vid eo h264.mp4", "h264_nvenc", {
    //framerate: 60,
    //bits10: true,
    overwrite: true,
    audioInterface: "virtual-audio-capturer",
})
.then(console.log)
.catch(console.error);*/

hwencode("./dump/vid eo h265.mp4", "hevc_nvenc", {
    framerate: 30,
    bits10: false,
    overwrite: true,
    audioInterface: "virtual-audio-capturer",
})
.then(console.log)
.catch(console.error);
