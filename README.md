About
=====

Record your screen using hardware accelerated encoder.<br/>
NVIDIA nvenc or AMD amf.

Example
=======

```js
import { hwencode } from "@xan105/video-capture";

hwencode("./path/to/file.mp4","h264_nvenc")
.then(console.log)
.catch(console.error);
```

Install
=======

```
npm install @xan105/video-capture
```

API
===

⚠️ This module is only available as an ECMAScript module (ESM) starting with version 2.0.0.<br />
Previous version(s) are CommonJS (CJS) with an ESM wrapper.

## Named export

#### `hwencode(filePath: string, codec: string, option?: obj): Promise<string>`

Record your screen in .mp4 using NVIDIA nvenc or AMD amf with h264 or h265/HEVC hardware encoder at given location.<br/>
Returns mp4 filepath.<br/>

- filePath: output file location<br/>
NB: _filepath extension will be enforced to '.mp4'_

- codec: 

  | |NVIDIA|AMD|
  |---|------|---|
  |H.264/AVC|h264_nvenc|h264_amf|
  |H.265/HEVC|hevc_nvenc|hevc_amf|

- option :

```js
option = {
    overwrite: false, //Allow (true) file overwrite if target already exists
    timeLength: "00:00:20", //duration
    framerate: 60, //HEVC can reach up to 100, 120 or 150
    probesize: 42, //1080p
    threadQueue: 512,
    size: "1920x1080", //default to current screen resolution
    offset_x: 0,
    offset_y: 0,
    videoEncodingOptions: "-rc:v vbr -level:v 4.2 -g:v 120 -bf:v 3 -qp:v 19",//* default to a custom profile
    bits10: false, //use 10bits color depth
    mouse: false, //capture the mouse
    audioInterface: null, //Windows interface name for audio loopback (aka record what you hear, stereo-mix, etc)
    audioDelay: 900, //(ms) delay; Set to 0 to disable 
    audioEncodingOptions: "",//*
    bitrate: {
      video: 6000, //(k) video
      min: 3000, //(k) video
      max: 9000, //(k) video
      audio: 160 //(k) audio
    }
  };
```

NB: *_Please refer to ffmpeg regarding video and audio encoding options._
