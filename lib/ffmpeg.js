/*
Copyright (c) Anthony Beaumont
This source code is licensed under the GNU LESSER GENERAL PUBLIC LICENSE Version 3
found in the LICENSE file in the root directory of this source tree.
*/

import { spawn } from "node:child_process";
import { join, parse } from "node:path";
import { Failure } from "@xan105/error";
import { dirname } from "@xan105/fs/path";

const hw_codec = ["h264_nvenc","h264_amf","hevc_nvenc","hevc_amf"];

function getDefaultProfile(codec, bits10 = false){

  const profiles = {
    h264_nvenc: "-rc:v vbr -level:v 4.2 -g:v 120 -bf:v 3 -qp:v 19",
    h264_amf: "-rc:v cqp -level:v 4.2 -g:v 120 -bf:v 3",
    hevc_nvenc: "-rc:v vbr -level:v 4.1 -qp:v 19",
    hevc_amf: "-rc:v cqp -level:v 4.1"
  };
  const profile = profiles[codec];
  
  if(codec === "hevc_nvenc" || codec === "hevc_amf" ) {
    if(bits10 === true) {
      return "-profile:v main10 " + profile;
    } else {
      return "-profile:v main " + profile;
    }
  } else {
    return "-profile:v high " + profile;
  }
}

function ffmpeg(cmdline) {
  return new Promise((resolve, reject) => {
    const binaryPath = join(dirname(import.meta.url), "/dist/ffmpeg.exe");   

    const ffmpeg = spawn(`"${binaryPath}"`, cmdline, {
      cwd: parse(binaryPath).dir,
      stdio: ["pipe", "pipe", "pipe"],
      windowsHide: true,
      windowsVerbatimArguments: true,
      shell: true,
    });

    ffmpeg.once("error", (err) => {
      reject(err);
    });
    
    ffmpeg.once("spawn", () => {
      let errorMessage = [];
      ffmpeg.stderr.on("data", (data) => {
        errorMessage.push(data);
      });

      ffmpeg.once("exit", (code) => {
        if (code == 0) {
          resolve();
        } else {
          reject(new Failure(errorMessage.join(""), { 
            code: "ERR_FFMPEG", 
            info: { cmdline }
          }));
        }
      });
    });

  });
}

function makeCommandLine(options, codec) {
  
  const videoCodec = ["-c:v", codec];
  const audioCodec = ["-c:a", "aac"];
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
    "-offset_x", //offset_x/y: Active display is always at 0,0
    options.offset_x,
    "-offset_y",
    options.offset_y,
    "-video_size",
    options.size,
    "-show_region",
    "0",
    "-thread_queue_size",
    options.threadQueue,
    "-i",
    "desktop", //`title="blabla"` for specific window
  ];
  const audioInterface = [
    "-f",
    "dshow",
    "-t",
    options.timeLength,
    "-audio_buffer_size", // Reduce startup latency (https://trac.ffmpeg.org/wiki/DirectShow#BufferingLatency)
    "50", // msdn suggests 80ms
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
  
  //Video bitrate
  cmdline = cmdline.concat(["-b:v",`${options.bitrate.video}k`,
                            "-minrate:v",`${options.bitrate.min}k`,
                            "-maxrate:v",`${options.bitrate.max}k`,
                            "-bufsize:v",`${options.bitrate.max}k`]);
  
  const videoEncodingOptions = options.videoEncodingOptions || getDefaultProfile(codec, options.bits10);
  cmdline = cmdline.concat(videoEncodingOptions.split(" "), ["-r:v", options.framerate]);

  if (options.audioInterface) {
    cmdline = cmdline.concat(["-b:a", `${options.bitrate.audio}k`]);
    if (options.audioEncodingOptions) cmdline = cmdline.concat(options.audioEncodingOptions.split(" "));
  }

  //Misc
  
  //Force encoding for 'dumb players' which only support the YUV planar color space with 4:2:0 chroma subsampling
  //NB: HEVC is already 4:2:0 chroma sampling (version 1 profile)
  if (options.bits10 && (codec === "hevc_nvenc" || codec === "hevc_amf" )){
    cmdline = cmdline.concat(["-pix_fmt","yuv420p10le"]); //10bits
  } else {
    cmdline = cmdline.concat(["-pix_fmt","yuv420p"]); //8bits
  }
  
  if (options.audioInterface) 
  {
    if (options.audioDelay > 0) {
      cmdline = cmdline.concat(["-af", `"adelay=delays=${options.audioDelay}:all=1, aresample=async=1"`]); //Apply an audio filter to delay all audio channels for x ms, compensate audio drift (?)
    } else {
      cmdline = cmdline.concat(["-af", `"aresample=async=1"`]); //compensate audio drift (?)
    }
  }

  cmdline.push("-y"); //Overwrite target file if any

  return cmdline;
}

export { hw_codec, ffmpeg, makeCommandLine };
