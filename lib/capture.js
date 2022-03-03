/*
Copyright (c) Anthony Beaumont
This source code is licensed under the GNU LESSER GENERAL PUBLIC LICENSE Version 3
found in the LICENSE file in the root directory of this source tree.
*/

import { parse } from "node:path";
import { Failure } from "@xan105/error";
import { resolve } from "@xan105/fs/path";
import { exists, mkdir } from "@xan105/fs";
import { shouldStringNotEmpty } from "@xan105/is/assert";
import { current as resolution } from "win-screen-resolution";
import { isStringNotEmpty, isIntegerPositive, isIntegerPositiveOrZero } from "@xan105/is";
import { hw_codec, ffmpeg, makeCommandLine } from "./ffmpeg.js";

async function hwencode(filePath, codec, option = {}) {
  
  shouldStringNotEmpty(filePath);
  if(!hw_codec.includes(codec)) 
    throw new Failure("Unknown codec/encoder", { code: 1, info: {received: codec, accepted: hw_codec}});

  const { width, height } = resolution();

  const options = {
    overwrite: option.overwrite || false,
    timeLength: isStringNotEmpty(option.timeLength) ? option.timeLength : "00:00:20",
    framerate: isIntegerPositive(option.framerate) ? option.framerate : 60, //HEVC can reach up to 100, 120 or 150
    probesize: isIntegerPositive(option.probesize) ? option.probesize : 42, //1080p
    threadQueue: isIntegerPositive(option.threadQueue) ? option.threadQueue : 512, //256 min under heavy load otherwise some frames would drop and freeze
    size: isStringNotEmpty(option.size) ? option.size : `${width}x${height}`,
    videoEncodingOptions: isStringNotEmpty(option.videoEncodingOptions) ? option.videoEncodingOptions : null,
    bits10: option.bits10 || false,
    mouse: option.mouse || false,
    audioInterface: isStringNotEmpty(option.audioInterface) ? option.audioInterface : null,
    audioDelay: isIntegerPositiveOrZero(option.audioDelay) ? option.audioDelay : 900, //Didn't find a better way to sync video/audio with virtual-audio-capturer. And believe me I tried -_-"
    audioEncodingOptions: isStringNotEmpty(option.audioEncodingOptions) ? option.audioEncodingOptions : null,
    bitrate: {
      video: isIntegerPositive(option.bitrate?.video) ? option.bitrate.video : 6000,
      min: isIntegerPositive(option.bitrate?.min) ? option.bitrate.min : 3000,
      max: isIntegerPositive(option.bitrate?.max) ? option.bitrate.max : 9000,
      audio: isIntegerPositive(option.bitrate?.audio) ? option.bitrate.audio : 160
    }
  };

  let cmdline = makeCommandLine(options, codec);

  const file = parse(filePath);
  
  if (!file.ext || file.ext === ".") filePath += ".mp4";
  else if (file.ext !== ".mp4") filePath = filePath.replace(file.ext, ".mp4");

  const target = file.dir;
  
  if (options.overwrite === false && (await exists(filePath)) === true) 
    throw new Failure(`Target "${file.name}" already exists !`, "ERR_VIDEO_ALREADY_EXISTS");
  if ((await exists(target)) === false) await mkdir(target);

  const resultPath = resolve(filePath);
  cmdline.push(`"${resultPath}"`);
  
  await ffmpeg(cmdline);

  return resultPath;
}

export { hwencode };