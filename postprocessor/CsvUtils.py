import pandas
import numpy as np
import matplotlib.pyplot as plt
import matplotlib.dates as mdates
from pathlib import Path


class CsvUtils:
    @staticmethod
    def drop_row_lower_than(file, video_start_time):
        csv = pandas.read_csv(file, sep=';', skipinitialspace=True)
        number_of_rows = len(csv.index)
        
        print(f"    total number_of_rows {number_of_rows} before drop_row_lower_than")
        print(f"    first row timestamp value is {csv.iloc[0]['Timestamp']}, \n         and drop_row_lower_than {video_start_time}")
        csv.drop(csv[csv["Timestamp"] < video_start_time].index, inplace=True)
        number_of_rows = len(csv.index)
        print(f"    total number_of_rows: {number_of_rows} after drop_row_lower_than")
        if not number_of_rows or number_of_rows == 0:
            return False
        
        csv.to_csv(file, index=False, sep=';')
        
        return True
        
    @staticmethod
    def drop_row_bigger_than(file, video_end_time):
        csv = pandas.read_csv(file, sep=';', skipinitialspace=True)
        number_of_rows = len(csv.index)
        
        print(f"    total number_of_rows: {number_of_rows} before drop_row_bigger_than")      
        print(f"    last row timestamp value is {csv.iloc[-1]['Timestamp']}, \n       and drop_row_bigger_than {video_end_time}")
        csv.drop(csv[csv["Timestamp"] > video_end_time].index, inplace=True)
        number_of_rows = len(csv.index)
        print(f"    total number_of_rows: {number_of_rows} after drop_row_bigger_than") 
        if not number_of_rows or number_of_rows == 0:
            return False        
        
        csv.to_csv(file, index=False, sep=';')
        
        return True
        
    # Split csv in many others based on 'Sensor Name'
    @staticmethod
    def split(file, dest, video_start_time):
        csv = pandas.read_csv(file, sep=';', skipinitialspace=True)
        # Get a list of unique values on 'Sensor Name' column
        sensors = csv['Sensor Name'].unique()
        files_created = []
        
        try:
            on_body_positions = Path(file).stem.split('_')[-3];
        except IndexError:
            print(f"    Error!!! Invalid CSV filename: {Path(file).stem}. Missing 'on-body position' flag")
            return False

        # For each sensor on 'Sensor Name' column...
        for sensor in sensors:
            # ...get rows only related with specific sensor.
            csv_sensor = csv[csv['Sensor Name'] == sensor]
            
            # Drop unused columns
            csv_sensor = csv_sensor.drop(csv_sensor.columns[[0, 1, 2, 3]], axis=1)
            
            # Drop duplicated rows
            csv_sensor = csv_sensor.drop_duplicates(keep='first')

            # The new CSV file will have a different timestamp, instead of the date, we need to set
            # the timestamp according to the video start time.
            # So video start time, refers to csv timestamp = 0.
            # But there are 2 possible situations:
            if (video_start_time < csv_sensor.iloc[0]['Timestamp']):
                # 1) Video start before the csv timestamp. In this scenario the csv rows are updated
                # the have the difference between csv date and video start date.
                csv_sensor['Timestamp'] = csv_sensor['Timestamp'] - video_start_time            
            else:
                # 2) Video starts after csv data. In this scenario, csv row match the video start time.
                # We just need to remove the difference between csv first row and the others, so first
                # will be zero.
                # Note, it is possible because 'drop_row_lower_than' and 'drop_row_bigger_than' methods
                # have been previously executed.
                csv_sensor['Timestamp'] = csv_sensor['Timestamp'] - csv_sensor.iloc[0]['Timestamp']

            # Save rows to a new csv file.
            csv_file = dest + sensor + '_' + on_body_positions + '.csv'
            csv_sensor.to_csv(csv_file, index=False, sep=',')
            print(f"CSV {csv_file} created")

            files_created.append(csv_file)
            
        return files_created

    @staticmethod
    def plot(file, sensor, dest):
        img_file = dest + sensor
        print(f"Plot file {file} to {img_file}")

        columns = ["Timestamp", "Value 1", "Value 2", "Value 3"]
        df = pandas.read_csv(file, usecols=columns, sep=',', skipinitialspace=True)

        fig, ax = plt.subplots()

        print(f"->>> {df['Timestamp'][0]}")
        df["Timestamp"] = df["Timestamp"] - df['Timestamp'][0]

        x = df["Timestamp"].values
        sensor_x = df["Value 1"].values
        sensor_y = df["Value 2"].values
        sensor_z = df["Value 3"].values

        lines = plt.plot(x, sensor_x, x, sensor_y, x, sensor_z)

        l1, l2, l3 = lines
        plt.setp(l1, linewidth=1, color='r')
        plt.setp(l2, linewidth=1, color='g')
        plt.setp(l3, linewidth=1, color='b')

        print(fig.get_figwidth())
        fig.set_figwidth((df["Timestamp"].iloc[-1] / 1000) * 2)

        plt.savefig(img_file, format="svg")

        plt.close()
        plt.cla()
        plt.clf()

        return
