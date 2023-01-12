from pathlib import Path


class Logger:
    @staticmethod
    def log_error(path, msg):
        log_file = 'err.log'
        
        file_object = open(path + log_file, 'a')
        file_object.write(msg)
        file_object.close()
