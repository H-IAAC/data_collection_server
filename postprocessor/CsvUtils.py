import pandas
import numpy as np
from pathlib import Path
from Logger import Logger


class CsvUtils:
    @staticmethod
    def checkFile(file):
        Logger.log(f"Checking file {file}")
        df_all = pandas.read_csv(file)
        columns=['Experiment Name', 'Sensor Name', 'Power Consumption (mAh)', 'Sensor Frequency (Hz)','Timestamp Server', 'Timestamp Local', 'Value 1', 'Value 2', 'Value 3', 'Data Status']
        df_ = pandas.read_csv(file, sep=';',  on_bad_lines='skip')

        df_clean=df_[columns].dropna(subset=columns)
        original_size = len(df_all)
        clean_size = len(df_clean)

        if original_size != clean_size:
            Logger.log_error(f"Checking file removed {original_size - clean_size} rows {len(df_clean.columns)}")
            vers_name=[element for element in df_.columns if 'HIAACApp v'  in element]
            df_clean[vers_name]=''
            df_clean.to_csv('clean'+file, sep=';',index=False)

    @staticmethod
    def drop_row_lower_than(file, video_start_time):
        Logger.log(f"drop_row_bigger_than {video_start_time}")
        csv = pandas.read_csv(file, sep=';', skipinitialspace=True)
        
        number_of_rows = len(csv.index)
        
        Logger.log(f"    total number_of_rows {number_of_rows} before drop_row_lower_than")
        Logger.log(f"    timestamp FIRST ROW: {csv.iloc[0]['Timestamp Server']}, \n deleting row lower than {video_start_time}")
        csv.drop(csv[csv["Timestamp Server"] < video_start_time].index, inplace=True)
        number_of_rows = len(csv.index)
        Logger.log(f"    total number_of_rows: {number_of_rows} after drop_row_lower_than")
        if not number_of_rows or number_of_rows == 0:
            return False
        
        csv.to_csv(file, index=False, sep=';')
        
        return True
        
    @staticmethod
    def drop_row_bigger_than(file, video_end_time):
        Logger.log(f"drop_row_bigger_than {video_end_time}")
        csv = pandas.read_csv(file, sep=';', skipinitialspace=True)
        number_of_rows = len(csv.index)
        
        Logger.log(f"    total number_of_rows: {number_of_rows} before drop_row_bigger_than")      
        Logger.log(f"    timestamp LAST ROW: {csv.iloc[-1]['Timestamp Server']}, \n  deleting bigger than {video_end_time}")
        csv.drop(csv[csv["Timestamp Server"] > video_end_time].index, inplace=True)
        number_of_rows = len(csv.index)
        Logger.log(f"    total number_of_rows: {number_of_rows} after drop_row_bigger_than") 
        if not number_of_rows or number_of_rows == 0:
            return False        
        
        csv.to_csv(file, index=False, sep=';')
        
        return True
        
    # Split csv in many others based on 'Sensor Name'
    @staticmethod
    def split(file, dest, video_start_time):
        Logger.log(f"Split csv by sensor name")
        csv = pandas.read_csv(file, sep=';', skipinitialspace=True)
        # Get a list of unique values on 'Sensor Name' column
        sensors = csv['Sensor Name'].unique()
        files_created = []
        
        try:
            on_body_positions = Path(file).stem.split('_')[-3];
        except IndexError:
            Logger.log(f"    Error!!! Invalid CSV filename: {Path(file).stem}. Missing 'on-body position' flag")
            return False

        # For each sensor on 'Sensor Name' column...
        for sensor in sensors:
            # ...get rows only related with specific sensor.
            csv_sensor = csv[csv['Sensor Name'] == sensor]
            
            # Drop unused columns
            csv_sensor = csv_sensor.drop(csv_sensor.columns[[1]], axis=1)

            csv_sensor.sort_values(by=['Timestamp Server'])
            
            #duplicate 'Timestamp' column
            csv_sensor.insert(loc=0, column='VideoTimelapse', value=csv_sensor['Timestamp Server'])

            # Drop duplicated rows
            csv_sensor = csv_sensor.drop_duplicates(keep='first')

            # The new CSV file will have a different timestamp, instead of the date, we need to set
            # the timestamp according to the video start time.
            # So video start time, refers to csv timestamp = 0.
            # But there are 2 possible situations:
            if (video_start_time < csv_sensor.iloc[0]['VideoTimelapse']):
                # 1) Video start before the csv timestamp. In this scenario the csv rows are updated
                # the have the difference between csv date and video start date.
                csv_sensor['VideoTimelapse'] = csv_sensor['VideoTimelapse'] - video_start_time
            else:
                # 2) Video starts after csv data. In this scenario, csv row match the video start time.
                # We just need to remove the difference between csv first row and the others, so first
                # will be zero.
                # Note, it is possible because 'drop_row_lower_than' and 'drop_row_bigger_than' methods
                # have been previously executed.
                csv_sensor['VideoTimelapse'] = csv_sensor['VideoTimelapse'] - csv_sensor.iloc[0]['VideoTimelapse']
                
            csv_sensor = csv_sensor.sort_values(by=['VideoTimelapse'])

            # Save rows to a new csv file.
            csv_file = dest + sensor + '_' + on_body_positions + '.csv'
            csv_sensor.to_csv(csv_file, index=False, sep=',')
            Logger.log(f"CSV {csv_file} created")

            files_created.append(csv_file)
            
        return files_created
