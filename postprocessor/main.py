import os
import sys
import time
import pathlib
from pathlib import Path
import argparse
from multiprocessing import Process
from ProcessFile import ProcessFile
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
from flask import Flask, jsonify, request
from flask_cors import CORS, cross_origin
from Logger import Logger
import logging

config = {
    'ORIGINS': [
        'http://localhost:8080',
        'http://127.0.0.1:8080',
        'http://localhost:8070',
        'http://127.0.0.1:8070',
    ],
}

app = Flask(__name__)
cors = CORS(app, resources={r'/*': {'origins': config['ORIGINS']}}, supports_credentials=True)
app.config['CORS_HEADERS'] = 'Content-Type'
app.logger.disabled = True

logging.getLogger('werkzeug').disabled = True

class FileCreateHandler(FileSystemEventHandler):

    def __init__(self, postprocessor_path):
        self.postprocessor_path = postprocessor_path
        
    # Handle new created file
    def on_created(self, event):
        if os.path.isdir(event.src_path):
            # When event is related to a directory, the event can be ignore.
            return

        Logger.log(f"*- {event.src_path} detected")

        # Check file historical size to make sure that file
        # is not been copied.
        historicalSize = -1
        while (historicalSize != os.path.getsize(event.src_path)):
            historicalSize = os.path.getsize(event.src_path)
            time.sleep(2)

        process = ProcessFile(event.src_path, self.postprocessor_path)
        process.check_event()
        Logger.log(f"*-- {event.src_path} process completed")

######
# Display the log file when accessing the '/' path.
#
#####
@app.route("/")
@cross_origin()
def get():
    path = Path(__file__).parent.resolve()
    log_path = str(path) + '/logs/log_post.out'

    if not os.path.exists(log_path):
        return "No log content to display."

    return read_log(log_path)

######
# Read log content
#
#####
def read_log(log_path):
    with open(log_path, 'r+') as file:
        # loop to read iterate
        # last 1000 lines and print it
        file.seek(0)
        content = '<head><style>'
        content += 'body { font-family: "Courier New", monospace; }'
        content += '</style></head>'
        content += '<script> function scrollToBottom() { window.scrollTo(0, document.body.scrollHeight); } '
        content += 'history.scrollRestoration = "manual"; '
        content += 'window.onload = scrollToBottom; </script>'

        for line in (file.readlines()[-1000:]):
            content += line + "</br>"

        return content

######
# 
#
#####
def init_flask(server_port):
    Logger.log("Init Flask APIs...")
    if (server_port != None):
        app.run(host='0.0.0.0', port=server_port)

######
# 
#
#####
def init_observer(postprocessor_path):
    Logger.log("Init filesystem observer...")
    event_handler = FileCreateHandler(postprocessor_path)
    observer = Observer()

    try:
        # Attach the observer to the event handler.
        observer.schedule(event_handler, preprocessor_path, recursive=True)

        # Start the observer.
        observer.start()
    except FileNotFoundError:
        Logger.log(f"Error: Directory not found: {preprocessor_path}")
        sys.exit(-1)
    
    try:
        while observer.is_alive():
            observer.join(1)
    finally:
        observer.stop()
        observer.join()
        Logger.log("Filesystem observer finish")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Posprocessor service - This service is a watchdog for preprocessor files."
    )

    parser.add_argument("preprocessor", help="Path to the preprocessor directory.")
    parser.add_argument("postprocessor", help="Path to the postprocessor directory.")
    parser.add_argument("name", help="Reference to the execution.")
    parser.add_argument("port", help="(optional) Port used to expose APIs.", nargs='?', default=None)

    args = parser.parse_args()
    preprocessor_path = f"{pathlib.Path(__file__).parent.resolve()}{os.sep}{args.preprocessor}"
    postprocessor_path = f"{pathlib.Path(__file__).parent.resolve()}{os.sep}{args.postprocessor}"
    server_port = args.port
    
    Logger.log("=============================================")
    Logger.log("=================  Starting  ================")

    Logger.log(f"Running:")
    Logger.log(f"  preprocessor_path: {preprocessor_path}")
    Logger.log(f"  postprocessor_path: {postprocessor_path}")
    Logger.log(f"  server_port: {server_port}")

    p1 = Process(target=init_observer, args=([postprocessor_path]))
    p1.start()
  
    p2 = Process(target=init_flask, args=([server_port]))
    p2.start()

    p1.join()
    p2.join()