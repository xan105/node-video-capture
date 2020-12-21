"use strict";

const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");
const resolution = require("win-screen-resolution");

async function h264_hwencode(filePath, vendor, option = {}) {

  if (typeof filePath !== "string" || !filePath) throw "ERR_INVALID_ARG_TYPE";

  const currentRes = resolution.current();

  const options = {
    overwrite: option.overwrite || false,
    timeLength: option.timeLength || "00:00:10",
    framerate: option.framerate || 60,
    probesize: option.probesize || 42, //1080p
    threadQueue: option.threadQueue || 64,
    size: option.size || `${currentRes.width}x${currentRes.height}`,
    videoEncodingOptions:
      option.videoEncodingOptions ||
      "-b:v 5000k -minrate:v 2500k -maxrate:v 8000k -bufsize:v 8000k -qp:v 19 -profile:v high -rc:v vbr -level:v 4.2 -r:v 60 -g:v 120 -bf:v 3", //Tested with GTX 1060
    yuv420: option.yuv420 != null ? option.yuv420 : true, //True: Encoding for 'dumb players' which only support the YUV planar color space with 4:2:0 chroma subsampling
    mouse: option.mouse || false,
    audioInterface: option.audioInterface || null,
    audioEncodingOptions: option.audioEncodingOptions || "-b:a 160k",
  };

  const videoCodec = ["-c:v", getCodecFromVendorName(vendor)];
  const audioCodec = ["-c:a", "aac"];
  
  let cmdline = makeCommandLine(options, videoCodec, audioCodec);

  const file = path.parse(filePath);
  if (!file.ext) filePath += ".mp4";
  else if (file.ext !== ".mp4") filePath.replace(file.ext, ".mp4");
  const resultPath = path.resolve(filePath);
  cmdline.push(`"${resultPath}"`);

  const target = file.dir;
  if (options.overwrite === false && (await exists(filePath)) === true)
    throw "ERR_VIDEO_ALREADY_EXISTS";
  if ((await exists(target)) === false) await mkdir(target);

  await ffmpeg(cmdline);

  return resultPath;
}

function ffmpeg(cmdline) {
  return new Promise((resolve, reject) => {
    const ffmpeg = spawn(path.join(__dirname, "dist/ffmpeg.exe"), cmdline, {
      stdio: ["pipe", "pipe", "pipe"],
      windowsHide: true,
      windowsVerbatimArguments: true,
    });

    let errorMessage = [];
    ffmpeg.stderr.on("data", (data) => {
      errorMessage.push(data);
    });

    ffmpeg.on("exit", (code) => {
      if (code == 0) {
        return resolve();
      } else {
        return reject(errorMessage.join(""));
      }
    });
  });
}

function makeCommandLine(options, videoCodec, audioCodec) {
  const videoInterface = [
    "-f",
    "gdigrab",
    "-t",
    options.timeLength,
    "-framerate",
    options.framerate,
    "-probesize",
    `${options.probesize}M`,
    "-draw_mouse",
    options.mouse ? "1" : "0",
    "-offset_x",
    "0",
    "-offset_y",
    "0",
    "-video_size",
    options.size,
    "-show_region",
    "0", //offset_x/y: Active display is always at 0,0
    "-thread_queue_size",
    options.threadQueue,
    "-i",
    "desktop",
  ];

  const audioInterface = [
    "-f",
    "dshow",
    "-thread_queue_size",
    options.threadQueue,
    "-i",
    `audio="${options.audioInterface}"`,
  ];

  let cmdline = ["-hide_banner"]; //Suppress ffmpeg printing copyright notice, build options and library versions

  //Input Interface
  cmdline = cmdline.concat(videoInterface);
  if (options.audioInterface) cmdline = cmdline.concat(audioInterface);

  //Codec
  cmdline = cmdline.concat(videoCodec);
  if (options.audioInterface) cmdline = cmdline.concat(audioCodec);

  //Output encoding
  cmdline = cmdline.concat(options.videoEncodingOptions.split(" "));
  if (options.audioInterface) cmdline = cmdline.concat(options.audioEncodingOptions.split(" "));

  //Misc
  if (options.yuv420) cmdline = cmdline.concat("-pix_fmt yuv420p".split(" "));
  if (options.audioInterface) cmdline.push("-shortest"); //stop audio with video length
  cmdline.push("-y"); //Overwrite target file if any

  return cmdline;
}

function exists(target) {
  return new Promise((resolve) => {
    fs.promises
      .access(target, fs.constants.F_OK)
      .then(() => resolve(true))
      .catch(() => resolve(false));
  });
}

function mkdir(target) {
  return new Promise((resolve, reject) => {
    fs.promises
      .mkdir(target, { recursive: true })
      .then(() => resolve())
      .catch((err) => reject(err));
  });
}

function getCodecFromVendorName(vendor){
	let codec;	
	if (vendor === "nvidia"){
		codec = "h264_nvenc";
	} else if (vendor === "amd"){
		codec = "h264_amf";
	} else {
		throw "ERR_UNKNOWN_VENDOR";
	}
	return codec;
}

module.exports = { h264_hwencode };
