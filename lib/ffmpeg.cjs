"use strict";

const path = require("path");
const { spawn } = require("child_process");

function getDefaultProfile(codec, bits10 = false){

  const profile = {
    h264_nvenc: "-b:v 6000k -minrate:v 3000k -maxrate:v 9000k -bufsize:v 9000k -profile:v high -rc:v vbr -level:v 4.2 -g:v 120 -bf:v 3 -qp:v 19", //Tested with GTX 1060 | Target quality is 15mb-ish for 20s clip
    h264_amf: "-b:v 6000k -minrate:v 3000k -maxrate:v 9000k -bufsize:v 9000k -profile:v high -rc:v cqp -level:v 4.2 -g:v 120 -bf:v 3", //Reported working with RX 580
    hevc_nvenc: "-b:v 6000k -minrate:v 3000k -maxrate:v 9000k -bufsize:v 9000k -rc:v vbr -level:v 4.1 -qp:v 19", //GTX 1060 wip
    hevc_amf: "-b:v 6000k -minrate:v 3000k -maxrate:v 9000k -bufsize:v 9000k -rc:v cqp -level:v 4.1" //Untested
  };
  
  if(!Object.keys(profile).includes(codec)) throw "ERR_NO_PROFILE_FOUND";
  let result = profile[codec];
  if (!result) throw "ERR_UNEXPECTED_INVALID_PROFILE";
  
  if(codec === "hevc_nvenc" || codec === "hevc_amf" ) {
    if(bits10 === true) {
      result = "-profile:v main10 " + result;
    } else {
      result = "-profile:v main " + result;
    }
  }
  
  return result;
}

function ffmpeg(cmdline) {
  return new Promise((resolve, reject) => {
    const binaryPath = path.join(__dirname, "dist/ffmpeg.exe");

    const ffmpeg = spawn(`"${binaryPath}"`, cmdline, {
      cwd: path.parse(binaryPath).dir,
      stdio: ["pipe", "pipe", "pipe"],
      windowsHide: true,
      windowsVerbatimArguments: true,
      shell: true,
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
  cmdline = cmdline.concat(options.videoEncodingOptions.split(" "), ["-r:v", options.framerate]);
  if (options.audioInterface) cmdline = cmdline.concat(options.audioEncodingOptions.split(" "));

  //Misc
  
  //Force encoding for 'dumb players' which only support the YUV planar color space with 4:2:0 chroma subsampling
  //NB: HEVC is already 4:2:0 chroma sampling (version 1 profile)
  if (options.bits10){
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

module.exports = { getDefaultProfile, ffmpeg, makeCommandLine };