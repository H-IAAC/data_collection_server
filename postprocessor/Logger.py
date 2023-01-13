from pathlib import Path


class Logger:
    @staticmethod
    def log_error(path, msg):
        log_file = 'err.log'
        
        file_object = open(path + log_file, 'a')
        file_object.write("LOG: " + msg + "\n")
        file_object.close()
