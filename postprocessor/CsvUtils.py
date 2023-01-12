import pandas
import numpy as np
import matplotlib.pyplot as plt
import matplotlib.dates as mdates
from pathlib import Path


class CsvUtils:
    @staticmethod
    def drop_row_lower_than(file, value):
        csv = pandas.read_csv(file, sep=';', skipinitialspace=True)
        number_of_rows = len(csv.index)
        
        print(f"    total number_of_rows {number_of_rows} before drop_row_lower_than")
        print(f"    first row timestamp value is {csv.iloc[0]['Timestamp']}, \n         and drop_row_lower_than {value}")
        csv.drop(csv[csv["Timestamp"] < value].index, inplace=True)
        number_of_rows = len(csv.index)
        print(f"    total number_of_rows: {number_of_rows} after drop_row_lower_than")
        if not number_of_rows or number_of_rows == 0:
            return False
        
        csv.to_csv(file, index=False, sep=';')
        
        return True
        
    @staticmethod
    def drop_row_bigger_than(file, value):
        csv = pandas.read_csv(file, sep=';', skipinitialspace=True)
        number_of_rows = len(csv.index)
        
        print(f"    total number_of_rows: {number_of_rows} before drop_row_bigger_than")      
        print(f"    last row timestamp value is {csv.iloc[-1]['Timestamp']}, \n       and drop_row_bigger_than {value}")
        csv.drop(csv[csv["Timestamp"] > value].index, inplace=True)
        number_of_rows = len(csv.index)
        print(f"    total number_of_rows: {number_of_rows} after drop_row_bigger_than") 
        if not number_of_rows or number_of_rows == 0:
            return False        
        
        csv.to_csv(file, index=False, sep=';')
        
        return True
        
    # Split csv in many others based on 'Sensor Name'
    @staticmethod
    def split(file, dest):
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
            
            # Update Timestamp column to consider the first row as 0 ms.
            # WARNING (funciona mas gera mensagem de warning)
            #/CsvUtils.py:63: SettingWithCopyWarning: 
            #A value is trying to be set on a copy of a slice from a DataFrame.
            #Try using .loc[row_indexer,col_indexer] = value instead
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
