import os,time
import cv2
import ffmpegcv
from ultralytics import YOLO
import torch
from pymediainfo import MediaInfo
from Logger import Logger

@staticmethod
def get_info_video(video_path):
    media_info = MediaInfo.parse(video_path)
        
    for track in media_info.tracks:
        if track.track_type == 'Video':
                frame_rate = float(track.frame_rate) if track.frame_rate and isinstance(track.frame_rate, (int, float, str)) else 0
                # Calculate total number of frames
                quantidade_frames = int((track.duration / 1000) * frame_rate)  # Total frames
                
                return {
                    "video_path": video_path,
                   # "ID": track.track_id,
                    "Formato": track.format,
                    "Perfil de Formato": track.format_profile,
                    "Codec ID": track.codec_id,
                    "Duração (s)": track.duration / 1000,  # Duration in seconds
                    "Bit rate (kb/s)": track.bit_rate,
                    "Largura (pixels)": track.width,
                    "Altura (pixels)": track.height,
                    "Taxa de Aspecto": track.display_aspect_ratio,
                    "Taxa de Quadros (FPS)": frame_rate,
                    "Modo de Taxa de Quadros": track.frame_rate_mode,
                    "Taxa de Quadros Mínima": getattr(track, 'frame_rate_min', 'None'),
                    "Taxa de Quadros Máxima": getattr(track, 'frame_rate_max', 'None'),
                    "Total de Frames": quantidade_frames
                }


def draw_rectangle(img, keypoint,box):
    keypoints_data = keypoint.xy.cpu().numpy()
    x1_b, y1_b, x2_b, y2_b = box.tolist()
    for i in range(5,7,1):        
        x, y = None, None
        try:
            x, y = keypoints_data[0][i][0], keypoints_data[0][i][1]
            if x is not None and (x, y) != (0, 0):
                y2_=int(y)
                cv2.rectangle(img, (int(x1_b),int(y1_b)), (int(x2_b), y2_), (0, 0, 0), -1)
                return img
        except IndexError:
            Logger.log("Left shoulder not detected")    
    y2=y1_b +(y2_b-y1_b)/2    
    cv2.rectangle(img, (int(x1_b),int(y1_b)), (int(x2_b), int(y2)), (0, 0, 0), -1)
    return img


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
        Logger.log("-> hide_faces_using_yolo new buffer")
        cap = cv2.VideoCapture(video_in)

        video_height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        video_width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        video_fps = cap.get(cv2.CAP_PROP_FPS)

        Logger.log(f"-> VIDEO IN  video_fps: {cap.get(cv2.CAP_PROP_FPS)}")

        if video_width >= 540 or video_width >= 960:
            video_height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT) / 2)
            video_width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH) / 2)

        Logger.log(f"-> {video_in} video_height: {video_height} video_width: {video_width}")
        Logger.log(f"-> {video_in} video_fps: {video_fps}")

        out = ffmpegcv.VideoWriter(video_out, 'h264', video_fps)

        yolo = YOLO(model)
        device = 'cuda' if torch.cuda.is_available() else 'cpu'
        Logger.log(f"Using device: {device}")
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
        Logger.log(f"Processing completed in {(time.time()-start_time)/60} min.")
        Logger.log(get_info_video(video_in))
        Logger.log(get_info_video(video_out))

    
