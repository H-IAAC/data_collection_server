import os
import cv2
import ffmpegcv
from Logger import Logger
from ultralytics import YOLO
import subprocess
import torch
from collections import deque

class VideoConverter:
    @staticmethod
    def hide_faces_using_yolo(
        video_in,
        video_out,
        model = f"{os.path.dirname(os.path.abspath(__file__)) }/yolov10n.pt",
        expand_factor=0,
        size_bb_buffer=15,
        frame_count_threshold=5,
        ):
        """
        Hide faces in a video using YOLO model.

        Args:
            video_in (mp4): video file to process
            video_out (mp4): video file to save the processed video
            model (str, optional): model to be used. Defaults to 'yolov10n'.
            expand_factor (int, optional): Size of the expansion factor for the bounding box. Defaults to 0.
            size_bb_buffer (int, optional): Size of the buffer to decide how many last bounding boxes are stored. Defaults to 3.
            frame_count_threshold (int, optional): Threshold to decide how many frames to skip for detection. Defaults to 5.
        """
        print("-> hide_faces_using_yolo new buffer")
        counter = 0
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

        # Buffer to store bounding boxes for recent frames
        bbox_buffer = deque()  # Storing half a second worth of bounding boxes
        no_person_detected_count = 0  # Counter for frames without detection
        max_no_detection_frames = video_fps * 6  # Clear buffer after seconds of no detection

        frame_count = 0  # Counter to track frames
        factor = expand_factor  # Expansion factor for the bounding box

        while True:
            ret, img = cap.read()

            if not ret:
                break
            
            # Detect every other frame (perform inference every frame_count_threshold frames)
            if frame_count >= size_bb_buffer*2 or frame_count % frame_count_threshold == 0:
                
                results = yolo.predict(img)

                names = yolo.names
                person_id = list(names)[list(names.values()).index('person')]
                boxes = results[0].boxes

                found_person = False
                for box in boxes:
                    if box.cls == person_id:  # Check if the detected object is a person
                        bbox = box.xyxy.cpu().numpy()  # Convert tensor to numpy array
                        bbox = bbox[0].astype(int)  # Convert to integers

                        # Modify the bounding box to only cover the upper part
                        upper_bbox_height = bbox[1] + int((bbox[3] - bbox[1]) * 0.3)  # Use 30% of the height

                        # Store the current bounding box in the buffer
                        bbox_buffer.append(bbox)
                        found_person = True
                        cv2.rectangle(img, (bbox[0], bbox[1]), (bbox[2] + factor, upper_bbox_height + factor), (0, 0, 0), -1)


                # if a person is not detected, increment the counter and fix the incorrect prediction by using buffered bounding boxes
                if not found_person:
                    no_person_detected_count += 1
                    counter += 1
                    # If no person detected, use the last bounding boxes from the buffer
                    if len(bbox_buffer) > 0:
                        for bbox in list(bbox_buffer)[-5:]:
                            upper_bbox_height = bbox[1] + int((bbox[3] - bbox[1]) * 0.3)

                            cv2.rectangle(img, (bbox[0], bbox[1]), (bbox[2] + factor, upper_bbox_height + factor), (0, 0, 0), -1)

                # Clear the buffer if no person is detected for the threshold duration
                if no_person_detected_count > max_no_detection_frames:
                    bbox_buffer.clear()  # Clear the buffer
                    no_person_detected_count = 0  # Reset the counter after clearing
            else:
                # If not a detection frame, plot the last bounding boxes from the buffer
                if len(bbox_buffer) > 0:
                    # Iterate through the last bounding boxes
                    # it can be a bounding box for someone else, so we get the latest 
                    for bbox in list(bbox_buffer)[-size_bb_buffer:]:
                        upper_bbox_height = bbox[1] + int((bbox[3] - bbox[1]) * 0.3)

                        cv2.rectangle(img, (bbox[0], bbox[1]), (bbox[2] + factor, upper_bbox_height + factor), (0, 0, 0), -1)

            out.write(img)

            frame_count += 1  # Increment the frame counter

        print(f'times of failed detection: {counter}')    

        cap_out = cv2.VideoCapture(video_out)
        print(f"-> VIDEO OUT video_fps: {video_fps}")

        cap.release()
        out.release()


    @staticmethod
    def is_cuda_present():

        ret = False

        try:
            subprocess.check_output('nvidia-smi')
            Logger.log('Nvidia GPU detected!')
        except Exception:
            Logger.log('No Nvidia GPU in system!')

        try:
            ret = torch.cuda.is_available()
            Logger.log(f"torch.cuda.is_available(): {torch.cuda.is_available()}")
            Logger.log(f"torch.cuda.device_count(): {torch.cuda.device_count()}")
            Logger.log(f"torch.cuda.current_device(): {torch.cuda.current_device()}")
        except Exception:
            Logger.log('torch.cuda error')

        return ret
