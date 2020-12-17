Record your screen using hardware accelerated encoder

Install
-------

```
npm install https://github.com/xan105/node-video-capture
//or
npm install xan105/node-video-capture
```

Example
-------

```js
"use strict";

const videoCapture = require("@xan105/video-capture");

videoCapture.h264_nvenc("./path/to/file.mp4").then(console.log).catch(console.error);
```

API
---

`h264_nvenc(string filepath, [obj option = {}]) <promise>string`

Record your screen in .mp4 using NVIDIA nvenc h264 hardware encoder at given location.<br/>
Returns mp4 filepath.<br/>

NB: _filepath extension will be enforced to '.mp4'_

```js
option = {
    overwrite: false,
    timeLength: "00:00:10", //duration
    framerate: 60, 
    probesize: 42, //1080p
    threadQueue: 64,
    size: "1920x1080", //default to current screen resolution
    videoEncodingOptions:
      "-b:v 5000k -minrate:v 2500k -maxrate:v 8000k -bufsize:v 8000k -qp:v 19 -profile:v high -rc:v vbr -level:v 4.2 -r:v 60 -g:v 120 -bf:v 3", //Tested with GTX 1060
    yuv420: true, //True: Encoding for 'dumb players' which only support the YUV planar color space with 4:2:0 chroma subsampling
    mouse: false, 
    audioInterface: null, //Windows interface name for audio loopback (aka record what you hear, stereo-mix, etc)
    audioEncodingOptions: "-b:a 160k",
  };
```

NB: _Please refer to ffmpeg regarding video and audio encoding options._
