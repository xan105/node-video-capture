..\lib\dist\ffmpeg.exe -hide_banner -f gdigrab -t 00:00:20 -framerate 60 -probesize 42M -draw_mouse 0 -offset_x 0 -offset_y 0 -video_size 1920x1080 -show_region 0 -thread_queue_size 512 -i desktop -f dshow -t 00:00:20 -audio_buffer_size 50 -thread_queue_size 512 -i audio="virtual-audio-capturer" -c:v h264_nvenc -c:a aac -b:v 6000k -minrate:v 3000k -maxrate:v 9000k -bufsize:v 9000k -qp:v 19 -profile:v high -rc:v vbr -level:v 4.2 -r:v 60 -g:v 120 -bf:v 3 -b:a 160k -pix_fmt yuv420p -af "adelay=delays=700:all=1" -y "D:\Documents\GitHub\xan105\node-video-capture\test\dump\vid eo.mp4"
PAUSE

