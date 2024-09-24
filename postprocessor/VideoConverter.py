import os
import cv2
import mediapipe as mp
import ffmpegcv
from Logger import Logger
#import face_recognition #https://github.com/ageitgey/face_recognition
import cv2
import moviepy.editor as mpe
from ultralytics import YOLO
import subprocess
import torch
from collections import deque
import time

class VideoConverter:
    #@staticmethod
    #def hide_faces_using_face_recognition(video_in, video_out):
    #    
    #    # Get a reference to webcam #0 (the default one)
    #    video_capture = cv2.VideoCapture(video_in)
    #    
    #    video_fps = int(video_capture.get(cv2.CAP_PROP_FPS))
    #    video_output = ffmpegcv.VideoWriter(video_out, None, video_fps)

        # Initialize some variables
    #    face_locations = []

    #    while True:
            # Grab a single frame of video
    #        ret, frame = video_capture.read()

    #        if ret == True:
                # Resize frame of video to 1/4 size for faster face detection processing
    #            small_frame = cv2.resize(frame, (0, 0), fx=0.25, fy=0.25)

                # Find all the faces and face encodings in the current frame of video
    #            face_locations = face_recognition.face_locations(small_frame, model="cnn")

                # Display the results
    #            for top, right, bottom, left in face_locations:
                    # Scale back up face locations since the frame we detected in was scaled to 1/4 size
    #                top *= 4
    #                right *= 4
    #                bottom *= 4
    #                left *= 4
                    # Extract the region of the image that contains the face
    #                face_image = frame[top:bottom, left:right]
                    # Blur the face image
    #                face_image = cv2.GaussianBlur(face_image, (99, 99), 30)
                    # Put the blurred face region back into the frame image
    #                frame[top:bottom, left:right] = face_image
                # Display the resulting image
                #cv2.imshow('Video', frame)
    #            video_output.write(frame)

    #        else:
    #            break

        # Release handle to the webcam
    #    video_capture.release()
    #    video_output.release()
    
    @staticmethod
    def hide_faces_using_mediapipe(video_in, video_out):
        print(f"->    hide_faces_using_mediapipe")

        cap = cv2.VideoCapture(video_in)

        video_height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        video_width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        video_fps = int(cap.get(cv2.CAP_PROP_FPS))
        
        if (video_width >= 540 or video_width >= 960):
            video_height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT) / 2)
            video_width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH) / 2)
        
        print(f"->    {video_in} video_height: {video_height} video_width: {video_width}")
        print(f"->    {video_in} video_fps: {video_fps}")
        
        out = ffmpegcv.VideoWriter(video_out, 'h264', video_fps)
        
        prev_detected = False
        prev_results = None
        
        with mp.solutions.face_detection.FaceDetection(
            model_selection=1, min_detection_confidence=0.5) as face_detection:

            while True:
                ret, img = cap.read()
                
                if ret == True:
                    # To improve performance, optionally mark the image as not writeable to
                    # pass by reference.
                    img.flags.writeable = False
                    img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

                    results = face_detection.process(img)

                    # Draw the face detection annotations on the image.
                    img.flags.writeable = True
                    img = cv2.resize(img, (video_width, video_height))
                    img = cv2.cvtColor(img, cv2.COLOR_RGB2BGR)

                    if results.detections or prev_detected:
                        if results.detections:
                            prev_results = results.detections
                        prev_detected = True

                        for detection in prev_results:

                            bboxC = detection.location_data.relative_bounding_box
                            ih, iw, ic = img.shape

                            # For rectange
                            bbox = int((bboxC.xmin - 0.04) * iw), int((bboxC.ymin - 0.04) * ih), int(bboxC.width * iw * 2), int(bboxC.height * ih * 2)
                            cv2.rectangle(img, bbox, (0,0,0), -1)

                    out.write(img)

                else:
                    break
        cap.release()
        out.release()

        # Final video has no audio, to merge audio from original video
        # to the new, we need to uncomment the line below.
        #VideoConverter.merge_audio(video_in, video_out)

    @staticmethod
    def hide_faces_using_yolo_faces(video_in, video_out, expand=True):
        cap = cv2.VideoCapture(video_in)

        # set yolov8n model
        model = f"{os.path.dirname(os.path.abspath(__file__)) }/yolov8n-face.pt"
        Logger.log(f"-> yolov8n-face path {model}")

        video_height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        video_width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        video_fps = int(cap.get(cv2.CAP_PROP_FPS))

        if (video_width >= 540 or video_width >= 960):
            video_height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT) / 2)
            video_width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH) / 2)

        Logger.log(f"-> {video_in} video_height: {video_height} video_width: {video_width}")
        Logger.log(f"-> {video_in} video_fps: {video_fps}")
        
        out = ffmpegcv.VideoWriter(video_out, 'h264', video_fps)

        yolo = YOLO(model)

        if VideoConverter.is_cuda_present():
            Logger.log(f"-> VideoConverter using GPU")
            yolo.to('cuda')
        else:
            Logger.log(f"-> VideoConverter using CPU")

        countFrames = 0

        while True:
            ret, img = cap.read()

            if ret:
                img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

                if (countFrames % 15) == 0:
                    results = yolo.predict(img)
                    names = yolo.names
                    face_id = list(names)[list(names.values()).index('face')]
                    boxes = results[0].boxes

                for box in boxes:
                    if box.cls == face_id:  # Check if the detected object is a person
        
                        bbox = box.xyxy.cpu().numpy()  # Convert tensor to numpy array
                        bbox = bbox[0].astype(int)  # Convert to integers
        
                        # draw original bounding box
                        # cv2.rectangle(img, (bbox[0], bbox[1]), (bbox[2], bbox[3]), (0, 255, 0), 2)
        
                        if expand == True:
                            factor = 40
                            cv2.rectangle(img, (bbox[0], bbox[1]), (bbox[2]+factor, bbox[3]+factor), (0,0,0), -1)

                        else:
                            cv2.rectangle(img, (bbox[0], bbox[1]), (bbox[2], bbox[3]), (0,0,0), -1)
            
                img = cv2.cvtColor(img, cv2.COLOR_RGB2BGR)
                out.write(img)

                countFrames = countFrames + 1
            else:
                break
        
        cap.release()
        out.release()

    @staticmethod
    def hide_faces_using_yolo(
        video_in,
        video_out,
        model='yolov10n',
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
        video_fps = int(cap.get(cv2.CAP_PROP_FPS))

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
        cap.release()
        out.release()


    @staticmethod
    def merge_audio(video_in, video_out):
        # Load the video with audio
        video_with_sound = mpe.VideoFileClip(video_in)

        # Extract the audio from the video clip
        audio = video_with_sound.audio

        video_mute = mpe.VideoFileClip(video_out)

        final = video_mute.set_audio(audio)
        final.write_videofile(video_out, audio=True, codec='libx264', audio_codec='aac')


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