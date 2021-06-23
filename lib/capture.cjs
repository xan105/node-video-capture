"use strict";

const path = require("path");
const resolution = require("win-screen-resolution");
const { exists, mkdir } = require("./fs.cjs");
const { hw_codec, ffmpeg, makeCommandLine } = require("./ffmpeg.cjs");

function h264_hwencode(filePath, vendor, option = {}) {
  const codec = "h264_" + getCodecFromVendorName(vendor);
  option.bits10 = false; //h264 is 8bits only (without extension)
  return hwencode(filePath, codec, option);
}

function hevc_hwencode(filePath, vendor, option = {}) {
  const codec = "hevc_" + getCodecFromVendorName(vendor);
  return hwencode(filePath, codec, option);
}

async function hwencode(filePath, codec, option = {}) {
  if (typeof filePath !== "string" || !filePath) throw "ERR_INVALID_ARG_TYPE";
  if(!hw_codec.includes(codec)) throw "ERR_UNKNOWN_CODEC";

  const currentRes = resolution.current();

  const options = {
    overwrite: option.overwrite || false,
    timeLength: option.timeLength || "00:00:20",
    framerate: option.framerate || 60, //HEVC can reach up to 100, 120 or 150
    probesize: option.probesize || 42, //1080p
    threadQueue: option.threadQueue || 512, //256 min under heavy load otherwise some frames would drop and freeze
    size: option.size || `${currentRes.width}x${currentRes.height}`,
    videoEncodingOptions: option.videoEncodingOptions || null,
    bits10: option.bits10 || false,
    mouse: option.mouse || false,
    audioInterface: option.audioInterface || null,
    audioDelay: option.audioDelay || 700, //Didn't find a better way to sync video/audio with virtual-audio-capturer. And believe me I tried -_-"
    audioEncodingOptions: option.audioEncodingOptions || "-b:a 160k",
  };

  const videoCodec = ["-c:v", codec];
  const audioCodec = ["-c:a", "aac"];

  let cmdline = makeCommandLine(options, videoCodec, audioCodec);

  const file = path.parse(filePath);
  
  if (!file.ext || file.ext === ".") filePath += ".mp4";
  else if (file.ext !== ".mp4") filePath = filePath.replace(file.ext, ".mp4");

  const target = file.dir;
  
  if (options.overwrite === false && (await exists(filePath)) === true) throw "ERR_VIDEO_ALREADY_EXISTS";
  if ((await exists(target)) === false) await mkdir(target);

  const resultPath = path.isAbsolute(filePath) ? filePath : path.resolve(filePath);
  cmdline.push(`"${resultPath}"`);
  
  await ffmpeg(cmdline);

  return resultPath;
}

function getCodecFromVendorName(vendor) {
  let codec;
  if (vendor === "nvidia") {
    codec = "nvenc";
  } else if (vendor === "amd") {
    codec = "amf";
  } else {
    throw "ERR_UNKNOWN_VENDOR";
  }
  return codec;
}

module.exports = { h264_hwencode, hevc_hwencode };