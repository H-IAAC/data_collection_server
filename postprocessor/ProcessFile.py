import os
import shutil
from CsvUtils import CsvUtils
from Logger import Logger
from VideoConverter import VideoConverter
from pathlib import Path
from zipfile import ZipFile
from configparser import ConfigParser
import tempfile
from check_data import *

class ProcessFile:
    def __init__(self, fullpath, postprocessor_path):
        experiment_name = Path(fullpath).parts
        self.experiment = str(experiment_name[-2])
        self.fullpath = fullpath
        self.filename = Path(fullpath).stem
        self.extension = Path(fullpath).suffix
        self.postprocessor_path = postprocessor_path

    def __str__(self):
        return f"filename: {self.fullpath} extension: {self.extension} experiment: {self.experiment}"

    def check_event(self):
        # Create new directory based on 'experiment' value
        postprocessor_directory = f"{os.sep}{self.postprocessor_path}{os.sep}{self.experiment}{os.sep}"
        if not os.path.exists(postprocessor_directory):
            Logger.log(f"Create new directory:  {postprocessor_directory}")
            os.makedirs(postprocessor_directory, exist_ok=True)

        try:
            # Check what action to take based on file extesion
            if self.extension == '.csv'.lower() or self.extension == '.zip'.lower():

                if self.extension == '.zip'.lower():
                    with ZipFile(self.fullpath, 'r') as zObject:
                        uncompressed_filename = Path(self.fullpath).stem + '.csv'
                        Logger.log(f"Uncompressing {self.fullpath}")
                        Logger.log(f"  Extracting file {uncompressed_filename} from zip")

                        zObject.extract(uncompressed_filename,
                                        path=tempfile.gettempdir())
                        Logger.log(f"File {uncompressed_filename} extracted with success")
                    zObject.close()

                    self.fullpath = tempfile.gettempdir() + os.sep + uncompressed_filename
                    self.filename = Path(self.fullpath).stem
                    self.extension = Path(self.fullpath).suffix

                Logger.log(f"Processing csv file {self.filename}")
                has_video = self.has_video_files(postprocessor_directory)

                if not has_video:
                    self.handle_csv_when_no_video(postprocessor_directory)
                    return

                self.handle_csv(self.fullpath, postprocessor_directory, f"{postprocessor_directory}{has_video}")
                os.remove(self.fullpath)

            elif self.extension == '.video'.lower():
                Logger.log(f"{self.filename} processing video file")
                self.handle_video(postprocessor_directory)
                return

            else:
                Logger.log("No action for file " + self.filename + self.extension)
                return
        except Exception as e:
            Logger.log_error(postprocessor_directory, f"Failed when processing: [{self.filename}]. {e}")
            Logger.log_error(postprocessor_directory, f"Check if video was correctly uploaded.")

    def handle_csv_when_no_video(self, postprocessor_directory):
        # Without the video we cant process the file, as we dont have timestamps values
        # Need to create a copy in 'waiting' directory
        waiting_dir = f"{postprocessor_directory}waiting"
        waiting_file = f"{waiting_dir}{os.sep}{Path(self.fullpath).name}"

        os.makedirs(waiting_dir, exist_ok=True)            
        shutil.copyfile(self.fullpath, waiting_file)
        
        Logger.log(f"  {self.filename} file waiting for video, copied to: {waiting_file}")
        
    def handle_csv(self, csv_fullpath, postprocessor_directory, video_metadata):
        metadata = self.get_video_metadata(video_metadata)
        
        CsvUtils.checkFile(postprocessor_directory, csv_fullpath)

        try:
            # Remove rows before and after the video timestamps
            if not CsvUtils.drop_row_lower_than(csv_fullpath, int(metadata['startTimestamp'])):
                Logger.log_error(postprocessor_directory, f"{self.filename} is invalid! need to check {[csv_fullpath]} timestamp after drop rows lower than initial timestamp. (Data were collected before recording the video.)")
                return
                
            if not CsvUtils.drop_row_bigger_than(csv_fullpath, int(metadata['endTimestamp'])):
                Logger.log_error(postprocessor_directory, f"{self.filename} is invalid! need to check {[csv_fullpath]} timestamp after drop rows bigger than initial timestamp. (Data were collected after recording the video.)")
                return
            
            processed_files = CsvUtils.split(csv_fullpath, postprocessor_directory, int(metadata['startTimestamp']))
        except Exception as e:
            Logger.log_error(postprocessor_directory, f"Something went wrong with file [{self.filename}] and {csv_fullpath}. {e}")
            return

        for filename in processed_files:
            if ".csv" in filename:
                Logger.log("-> " + filename)
                Logger.log("-> " + postprocessor_directory)
                MAX_ACC_AMPLITUDE = 70
                MAX_F = 97
                script_check_data(filename, postprocessor_directory, MAX_ACC_AMPLITUDE, MAX_F)


    def handle_video(self, postprocessor_directory):
        # Get copy of .video to postprocessor directory
        metadata_file = self.filename + self.extension
        Logger.log(f"  Copy from: {self.fullpath} to: {postprocessor_directory}{metadata_file}")
        shutil.copyfile(self.fullpath, f"{postprocessor_directory}{metadata_file}")
        
        # Get copy of .mp4 to postprocessor directory
        mp4_file = self.filename + ".mp4"
        preprocessor_mp4_fullpath = self.fullpath.replace(".video", ".mp4")
        postprocessor_mp4_fullpath = f"{postprocessor_directory}{mp4_file}"
        #Logger.log(f"  Copy from: {preprocessor_mp4_fullpath} to: {postprocessor_mp4_fullpath}")
        #shutil.copyfile(preprocessor_mp4_fullpath, postprocessor_mp4_fullpath)

        # Process video, to hide faces
        try:
            hidden_face_video = f"{postprocessor_directory}facehidden-{mp4_file}"
            Logger.log(f"  VideoConverter: {preprocessor_mp4_fullpath} to: {hidden_face_video}")
            #VideoConverter.hide_faces_using_mediapipe(preprocessor_mp4_fullpath, hidden_face_video)
            # VideoConverter.hide_faces_using_yolo_faces(preprocessor_mp4_fullpath, hidden_face_video)
            VideoConverter.hide_faces_using_yolo(preprocessor_mp4_fullpath, hidden_face_video)
        except Exception as e:
            Logger.log_error(postprocessor_directory, f"Could not process video file {preprocessor_mp4_fullpath}: {e}")

        # Delete the original video, and then rename the new video
        #os.remove(postprocessor_mp4_fullpath)
        shutil.move(hidden_face_video, postprocessor_mp4_fullpath)

        #os.remove(self.fullpath)
        #os.remove(preprocessor_mp4_fullpath)

        # Need to check if there are .csv files, in the 'waiting' directory
        waiting_dir = f"{postprocessor_directory}waiting{os.sep}"
        
        if os.path.exists(waiting_dir):        
            for csv_file in os.listdir(waiting_dir):
                csv_file_fullpath = f"{waiting_dir}{csv_file}"
                Logger.log(f"  Checking for csv in waiting directory: {csv_file_fullpath}")
                self.handle_csv(csv_file_fullpath, postprocessor_directory, f"{postprocessor_directory}{metadata_file}")
            shutil.rmtree(waiting_dir)
        
    def has_video_files(self, postprocessor_directory):
        for fname in os.listdir(postprocessor_directory):
            Logger.log(f"  Checking if has video files in {postprocessor_directory} checking {fname} file")
            if fname.endswith('.video'):
                Logger.log(f"    found! {fname}")
                return fname
        
        Logger.log(f"  No video related file found in {postprocessor_directory}")
        return False

    def get_video_metadata(self, video_file):
        config = ConfigParser()
        
        if not os.path.exists(video_file):
            Logger.log(f"File {video_file} not exists!")
            
        # parse existing file
        config.read(video_file, encoding="cp1251")

        # read values from a section
        startTimestamp = config.get('Metadata', 'startTimestamp')
        endTimestamp = config.get('Metadata', 'endTimestamp')
        
        return dict(startTimestamp = startTimestamp, endTimestamp = endTimestamp)
