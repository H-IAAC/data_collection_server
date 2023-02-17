import os
import sys
import time
import argparse
from ProcessFile import ProcessFile
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler


class FileCreateHandler(FileSystemEventHandler):

    def __init__(self, postprocessor_path):
        self.postprocessor_path = postprocessor_path
        
    # Handle new created file
    def on_created(self, event):
        if os.path.isdir(event.src_path):
            # When event is related to a directory, the event can be ignore.
            return

        print(f"*- {event.src_path} detected")

        # Check file historical size to make sure that file
        # is not been copied.
        historicalSize = -1
        while (historicalSize != os.path.getsize(event.src_path)):
            historicalSize = os.path.getsize(event.src_path)
            time.sleep(2)

        process = ProcessFile(event.src_path, self.postprocessor_path)
        process.check_event()
        print(f"*-- {event.src_path} process completed")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Posprocessor service - This service is a watchdog for preprocessor files."
    )
    parser.add_argument("preprocessor", help="Path to the preprocessor directory.")
    parser.add_argument("postprocessor", help="Path to the postprocessor directory.")
    parser.add_argument("ferramenta_de_visualizacao", help="Not used, but necessary!")

    args = parser.parse_args()
    preprocessor_path = args.preprocessor
    postprocessor_path = args.postprocessor
    
    print(f"Running:")
    print(f"  preprocessor_path: {preprocessor_path}")
    print(f"  postprocessor_path: {postprocessor_path}")

    event_handler = FileCreateHandler(postprocessor_path)

    # Create an observer.
    observer = Observer()

    try:
        # Attach the observer to the event handler.
        observer.schedule(event_handler, preprocessor_path, recursive=True)

        # Start the observer.
        observer.start()
    except FileNotFoundError:
        print(f"Error: Directory not found: {preprocessor_path}")
        sys.exit(-1)
    
    try:
        while observer.is_alive():
            observer.join(1)
    finally:
        observer.stop()
        observer.join()
