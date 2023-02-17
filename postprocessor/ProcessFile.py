import os
import shutil
from CsvUtils import CsvUtils
from Logger import Logger
from pathlib import Path
from configparser import ConfigParser

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
        postprocessor_directory = f".{os.sep}{self.postprocessor_path}{os.sep}{self.experiment}{os.sep}"
        if not os.path.exists(postprocessor_directory):
            print(f"Create new directory:  {postprocessor_directory}")
            os.makedirs(postprocessor_directory)

        # Check what action to take based on file extesion
        if self.extension == '.csv'.lower():
            print(f"{self.filename} processing csv file")
            has_video = self.has_video_files(postprocessor_directory)
            
            if not has_video:
                self.handle_csv_when_no_video(postprocessor_directory)
                return
            
            self.handle_csv(self.fullpath, postprocessor_directory, f"{postprocessor_directory}{has_video}")

        elif self.extension == '.video'.lower():
            print(f"{self.filename} processing video file")
            self.handle_video(postprocessor_directory)
            return

        else:
            print("No action for file " + self.filename + self.extension)
            return

    def handle_csv_when_no_video(self, postprocessor_directory):
        # Without the video we cant process the file, as we dont have timestamps values
        # Need to create a copy in 'waiting' directory
        waiting_dir = f"{postprocessor_directory}waiting"
        waiting_file = f"{waiting_dir}{os.sep}{Path(self.fullpath).name}"
        
        os.makedirs(waiting_dir, exist_ok=True)            
        shutil.copyfile(self.fullpath, waiting_file)
        
        print(f"  {self.filename} file waiting for video, copied to: {waiting_file}")
        
    def handle_csv(self, csv_fullpath, postprocessor_directory, video_metadata):
        metadata = self.get_video_metadata(video_metadata)
        
        try:
            # Remove rows before and after the video timestamps
            if not CsvUtils.drop_row_lower_than(csv_fullpath, int(metadata['startTimestamp'])):
                Logger.log_error(postprocessor_directory, f"{self.filename} is invalid! need to check timestamp after drop rows lower than initial timestamp");
                return
                
            if not CsvUtils.drop_row_bigger_than(csv_fullpath, int(metadata['endTimestamp'])):
                Logger.log_error(postprocessor_directory, f"{self.filename} is invalid! need to check timestamp after drop rows bigger than initial timestamp");
                return
            
            csv_files = CsvUtils.split(csv_fullpath, postprocessor_directory, int(metadata['startTimestamp']))
        except Exception as e:
            Logger.log_error(postprocessor_directory, f"Something went wrong with file [{self.filename}]. {e}");
            
        if not csv_files:
            print(f"    {self.filename} ignoring this file")
            Logger.log_error(postprocessor_directory, f"{self.filename} is invalid! Check filename.");

        #for file in csv_files:
        #    CsvUtils.plot(file, Path(file).stem, postprocessor_directory)
            
    def handle_video(self, postprocessor_directory):
        # Get copy of .video to postprocessor directory
        metadata_file = self.filename + self.extension
        print(f"  Copy from: {self.fullpath} to: {postprocessor_directory}{metadata_file}")
        shutil.copyfile(self.fullpath, f"{postprocessor_directory}{metadata_file}")
        
        # Get copy of .mp4 to postprocessor directory
        mp4_file = self.filename + ".mp4"
        mp4_fullpath = self.fullpath.replace(".video", ".mp4")
        print(f"  Copy from: {mp4_fullpath} to: {postprocessor_directory}{mp4_file}")
        shutil.copyfile(mp4_fullpath, f"{postprocessor_directory}{mp4_file}")
        
        # Need to check if there are .csv files, in the 'waiting' directory
        waiting_dir = f"{postprocessor_directory}waiting{os.sep}"
        
        if os.path.exists(waiting_dir):        
            for csv_file in os.listdir(waiting_dir):
                csv_file_fullpath = f"{waiting_dir}{csv_file}"
                print(f"  Checking for csv in waiting directory: {csv_file_fullpath}")
                self.handle_csv(csv_file_fullpath, postprocessor_directory, f"{postprocessor_directory}{metadata_file}")
            shutil.rmtree(waiting_dir)
        
    def has_video_files(self, postprocessor_directory):
        for fname in os.listdir(postprocessor_directory):
            print(f"  Checking if has video files in {postprocessor_directory} checking {fname} file")
            if fname.endswith('.video'):
                print(f"    found! {fname}")
                return fname
        
        print(f"  No video related file found in {postprocessor_directory}")
        return False

    def get_video_metadata(self, video_file):
        config = ConfigParser()
        
        if not os.path.exists(video_file):
            print(f"File {video_file} not exists!")
            
        # parse existing file
        config.read(video_file, encoding="cp1251")

        # read values from a section
        videoDuration = config.get('Metadata', 'videoDuration')
        startTimestamp = config.get('Metadata', 'startTimestamp')
        endTimestamp = config.get('Metadata', 'endTimestamp')
        
        return dict(videoDuration = videoDuration, startTimestamp = startTimestamp, endTimestamp = endTimestamp)







