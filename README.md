# viewer_tool


TZ=UTC touch -t 202207221357.59 6seg.mp4 

ffmpeg -ss 00:01:00 -to 00:02:00 -i input.mp4 -c copy output.mp4

bash start.sh port 3000 pre
