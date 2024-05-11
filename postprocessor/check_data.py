import matplotlib.pyplot as plt
from matplotlib.pyplot import figure
import seaborn as sns
import numpy as np
import pandas as pd
import seaborn as sns
from scipy.signal import find_peaks
import matplotlib.ticker as ticker 
from Logger import Logger
import os

"""Generate a plot figure with the data from the datasets. The figure will have a subplot for each dataset. 
Each subplot will have a trace for each axis.
The traces will be colored according to the axis 'acc X', 'acc Y', 'acc Z' as 'r', 'b', 'g' respectively. The window name is the dataframe label. 

Parameters
----------
dff : pd.DataFrame
    The datasets that you want to plot"""
def plot_fun_acc(dff):
    acc=np.array(dff[1:-1,6:9],dtype=float)
    time_=pd.to_datetime(dff[1:-1,5], unit='ms').tz_localize('UTC').tz_convert('Etc/GMT+3')
    time_v=pd.DataFrame({'date':time_})
    time_v['date']=pd.to_datetime(time_v['date'])
    time_v['time']=time_v['date'].dt.strftime('%H:%M:%S')
    time=time_v['time'].to_numpy()
    label_acc=[' acc X',' acc Y','acc Z']
    color_acc=['r','b','g']
    Accelerometer_X_axis_data = acc[:,0] #x
    Accelerometer_Y_axis_data = acc[:,1] #y
    Accelerometer_Z_axis_data = acc[:,2] #z
    col_=1
    row_=3  
    
    fig, axs = plt.subplots(ncols=col_, nrows=row_, figsize=(20, 10),layout="constrained")
    
    for row in range(row_):
        for col in range(col_):
            axs[row].plot( time, acc[:,row], color_acc[row], linewidth=0.8)
            axs[row].title.set_text(label_acc[row])
            axs[row].set_xlabel('datatime->')
            axs[row].set_ylabel('Acceleration (m/s^2)')
            axs[row].grid(True)
            axs[row].xaxis.set_major_locator(ticker.MultipleLocator(40)) 
            axs[row].tick_params(axis='x', rotation=90)    
    plt.show()



"""Generate a plot figure and save it in the folder 'output/' with the data from the datasets window of 300 samples. The figure will have a subplot for each axis acc dataset.
Each subplot will have a trace for each axis.
The traces will be colored according to the axis 'acc X', 'acc Y', 'acc Z' as 'r', 'b', 'g' respectively. The window name is a label input. 

Parameters
----------
dff : pd.DataFrame
    The datasets that you want to plot
point_time : int center of window 
    The point of time series that what window on the plot
title_ : string
    The window name  
"""
def plot_fun_window(dff,point_time,title_,path_out):
    Logger.log("plot_fun_window")
    try:
        (r,w)=dff.shape
        if point_time<150:
            return
        if point_time>(r-150):
            point_time=r-150
        point_l= point_time-150  
        point_h= point_time +150

        acc=np.array(dff[point_l:point_h,6:9],dtype=float)
        time_=pd.to_datetime(dff[point_l:point_h,5], unit='ms').tz_localize('UTC').tz_convert('Etc/GMT+3',)
        time_v=pd.DataFrame({'date':time_})
        time_v['date']=pd.to_datetime(time_v['date'])
        time_v['time']=time_v['date'].dt.strftime('%H:%M:%S.%f')
        time=time_v['time'].to_numpy()
        label_acc=[' acc X',' acc Y','acc Z']
        color_acc=['r','b','g']
        col_=1
        row_=3
        
        fig, axs = plt.subplots(ncols=col_, nrows=row_, figsize=(20, 10),layout="constrained")

        for row in range(row_):
            for col in range(col_):
                axs[row].plot(time, acc[:,row], color_acc[row], linewidth=0.8)
                axs[row].title.set_text(label_acc[row]+' '+dff[0,1])
                axs[row].set_xlabel('datatime ->')
                axs[row].set_ylabel('Acceleration (m/s^2)')
                axs[row].grid(True)
                axs[row].xaxis.set_major_locator(ticker.MultipleLocator(80)) 
                axs[row].tick_params(axis='x', rotation=0)

        img_output = path_out + title_.split("/")[-1][:-4] + str(time[150])+'.png'
        fig.savefig(img_output)                        
        Logger.log(f"plot_fun_window savefig path: {img_output}")
        #plt.show()
    except Exception as e:
        Logger.log_error(f"plot_fun_window failed for {title_}. exception: {e}")

"""Process all dataset in order to search the acc peaks higher than a threshold and generate a plot figure of window using the 
function plot_fun_window

Parameters
----------
dff : pd.DataFrame
    The datasets that you want to plot
th : threshold of accelerometer amplitude  
    The point of time series that what window on the plot
title_ : string
    """

def plot_peak_acc(dff,th,title_):
    acc_=(np.array(dff[1:-1,6:9],dtype=float))
    acc_x=np.absolute(acc_[:,0])
    id_peak, _ =find_peaks(acc_x, height=th)
    
    for p in id_peak:
        plot_fun_window(dff,p,title_)
     

"""Process all dataset in order to search the latency time peaks higher than a threshold and generate a plot figure of window using the 
function plot_fun_window

Parameters
----------
dff : pd.DataFrame
    The datasets that you want to plot
th : threshold of accelerometer amplitude  
    The point of time series that what window on the plot
title_ : string
    """
def plot_peak_time(dff,th, title_,path_out):
    t_local=np.diff(np.array(dff[1:-1,5],dtype=int))
    time_=np.absolute(t_local)
    id_peak, _ = find_peaks(time_, height=th)
    m=150
    
    for i in range(1,len(id_peak)):             
        if m>=150:
              plot_fun_window(dff,id_peak[i-1],title_,path_out)
        m=id_peak[i]-id_peak[i-1]

                  
       
    
"""Generate a plot figure with the timestamp_server_data and timestamp_local_data from the datasets. The figure will have a subplot for each dataset. 
Each subplot will have a trace for each timestamp server and local as a histogram of each one.

Parameters
----------
dff : pd.DataFrame
    The datasets that you want to plot

    """
def plot_fun_t(dff):
    t_server=np.array(dff[1:-1,4:6],dtype=int)
    label_t=['T Server','T local']
    color_t=['r','b']
    timestamp_server_data = np.diff(t_server[:,0])
    timestamp_local_data = np.diff(t_server[:,1])
    col_=1
    row_= 4
    
    fig, axs = plt.subplots(ncols=col_, nrows=row_, figsize=(20, 6),
                        layout="constrained")
    row=0
    axs[row].plot( timestamp_server_data, color_t[row], linewidth=0.5)
    axs[row].title.set_text(label_t[row])
    axs[row].set_xlabel('time (ms) ->')
    axs[row].set_ylabel('Latency (ms)')
    axs[row].grid(True)
    row=1
    axs[row].plot( timestamp_local_data, color_t[row], linewidth=0.5)
    axs[row].title.set_text(label_t[row])
    axs[row].set_xlabel('time (ms) ->')
    axs[row].set_ylabel('Latency (ms)')
    axs[row].grid(True)
    row=2
    axs[row].hist(timestamp_server_data, bins=30,color='red')
    axs[row].set_xlabel('Latency (ms)')
    axs[row].set_ylabel('Count server')
    row=3
    axs[row].hist(timestamp_local_data, bins=30,color='blue')
    axs[row].set_xlabel('Latency (ms)')
    axs[row].set_ylabel('Count Local')
    plt.show()
    

"""Check the signal quality searching for nan values or amplitude higher than a threshold of mean frequency higher than the reference frequency.

Parameters
----------
vector : pd.DataFrame
    The vector of signal as an example an axis of accelerometer
timestamp : A Timestamp Local vector
ref_frequency : Reference frequency value of the dataset as ex 100Hz 
ref_amplitude : Reference amplitude value of the dataset as ex 50 m/s^2  
"""

def check_quality(vector,timespamp,ref_frequency,ref_amplitud):
    
    if vector.isna().any().any():
        Logger.log("...nan")
        return False

    if vector.max() > ref_amplitud or abs(vector.min()) > ref_amplitud:
        Logger.log(f"...amplitude max: {vector.max()} min: {vector.min()}")
        return False
        

    w_start, w_end = timespamp.iloc[0], timespamp.iloc[-1]
    w_duration = w_end - w_start
    period=w_duration/timespamp.size
    ref_period= (1/ref_frequency)*1000
    if period>=ref_period:
        Logger.log(f"...period: {period}")
        return False

    return True

"""Script to run the signal quality searching using a path .

Parameters
----------
path_in : input path ex. "../../dataset/eldorado/2maiTS001/Accelerometer_Bolso Direito.csv""
path_out : output path ex. "output/"
MAX_ACC_AMPLITUDE : Reference amplitude value ex. 70
MAX_F : Reference frequency value  ex. 97
"""
def script_check_data(path_in, path_out,MAX_ACC_AMPLITUDE,MAX_F):
        print(path_in)
        df = pd.read_csv(path_in)
        df_valid=df[df['Data Status']=='VALID']
        dff_valid = df_valid.values
        df_invalid=df[df['Data Status']=='INVALID']
        dff_invalid = df_invalid.values
        if check_quality(df_valid['Value 1'],df_valid["Timestamp Local"],MAX_F,MAX_ACC_AMPLITUDE):
            Logger.log(f"[pass] {path_in}")
            #plot_fun_acc(dff_valid)        
            #plot_fun_t(dff_valid)            
        else:
            Logger.log(f"[Not pass] {path_in}")
            #plot_fun_acc(dff_valid)        
            #plot_fun_t(dff_valid)
            plot_peak_time(dff_valid,(100-MAX_F)*10,path_in,path_out)