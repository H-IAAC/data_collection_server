import os
import cv2
import ffmpegcv
from Logger import Logger
from ultralytics import YOLO
import torch
import time
class VideoConverter:
    @staticmethod
    def hide_faces_using_yolo(
        video_in,
        video_out,
        model=f"{os.path.dirname(os.path.abspath(__file__))}/yolo11x-pose.pt",
    ):
        """
        Hide faces in a video using YOLO model.

        Args:
            video_in (str): video file to process
            video_out (str): video file to save the processed video
            model (str, optional): model to be used. Defaults to 'yolo11l.pt'.
            expand_factor (int, optional): Size of the expansion factor for the bounding box. Defaults to 0.
            size_bb_buffer (int, optional): Size of the buffer to decide how many last bounding boxes are stored. Defaults to 3.
            frame_count_threshold (int, optional): Threshold to decide how many frames to skip for detection. Defaults to 5.
            save_images_dir (str, optional): Directory to save images with keypoints. Defaults to 'saved_images'.
        """
        start_time = time.time()  
        print("-> hide_faces_using_yolo new buffer")
        cap = cv2.VideoCapture(video_in)

        video_height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        video_width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        video_fps = cap.get(cv2.CAP_PROP_FPS)

        print(f"-> VIDEO IN  video_fps: {cap.get(cv2.CAP_PROP_FPS)}")

        if video_width >= 540 or video_width >= 960:
            video_height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT) / 2)
            video_width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH) / 2)

        print(f"-> {video_in} video_height: {video_height} video_width: {video_width}")
        print(f"-> {video_in} video_fps: {video_fps}")

        out = ffmpegcv.VideoWriter(video_out, 'h264', video_fps)

        yolo = YOLO(model)
        device = 'cuda' if torch.cuda.is_available() else 'cpu'
        print(f"Using device: {device}")
        yolo.to(device)

        while True:
            ret, img = cap.read()
            if not ret:
                break
            results = yolo([img])
            for result in results:
                keypoints = result.keypoints  
                for index, box in enumerate(result.boxes.xyxy ):
                    img=draw_rectangle(img, keypoints[index],box)                    
            out.write(img)
        cap.release()
        out.release()
        print(f"Processing completed in {(time.time()-start_time)/60} min.")
