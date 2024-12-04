# Ferramenta de Visualização

- **preprocessor:** Web tool responsible for handle input data, and provide data visualization.
- **postprocessor:** Python tool responsible for prepare csv data for visualization, checking timelapse, sync with video, split into multiple files, cleanning unnecessary content, ...
- **server.sh:** Script to start/stop the solution.

## Version 4.0 tests and results:

- ### Static Test:
  - **Original video duration:** 13.10 minutes
  - **Time to process the video:** 06.53 minutes
  - **Percentage with mask on:** 97.79%
  
- ### Bench Test:
  - **Original video duration:** 13.30 minutes
  - **Time to process the video:** 06.59 minutes
  - **Percentage with mask on:** 96.68%
  
- ### Indoor/Final Test:
  - **Original video duration:** 02.45 minutes
  - **Time to process the video:** 01.36 minutes
  - **Percentage with mask on:** 99.42%

  *Full tests results can be found at:* [Tests results](https://drive.google.com/file/d/1G-EFDLe-UU6y-JhldMcDE6GRYTQBmiMx/view?usp=sharing)



## Build Docker:
When you are building the your own docker image, the code base will be the same from your git branch. So please, **make sure you are in the correct branch**. And configurations as password and server url (for auth token) may need your own configuration, so please **remember to review the config file** in *preprocessor/config/config.json*.

- If you are running with CUDA for video processing:
```
docker compose -f docker-compose_cuda.yml build
docker compose -f docker-compose_cuda.yml up
```
_Note: Only use the **build command** when you are building a new image, otherwise, you can go straight to the **up command**._

- Otherwise, use this command for CPU processing:
```
docker compose -f docker-compose_cpu.yml build
docker compose -f docker-compose_cpu.yml up
```
_Note: Only use the **build command** when you are building a new image, otherwise, you can go straight to the **up command**._

## Build without Docker:
**Note:** Step below are only necessary if you are not using docker.
### Pre processor:
1) Check system requirements:
- node v18.12.1
- npm 8.19.2

2) Go to preprocessor directory:
> cd preprocessor/

3) Run npm command to install dependencies
> npm install

4) Start execution
> ./run start <port>

### Post processor:
1) Check system requirements:
- Python 3.8.10
- pip 22.3.1

2) Go to postprocessor directory:
> cd postprocessor/

3) Install dependencies
> pip install watchdog argparse pandas numpy  shutil ConfigParser

4) Start execution
> ./run start

&nbsp;&nbsp;**Development env:**\
&emsp;&emsp;`bash server.sh start pre port 3000`\
&emsp;&emsp;`bash server.sh start post`

&nbsp;&nbsp;**Production env:**\
&ensp;start:\
&emsp;&emsp;`bash server.sh start prod pre`\
&emsp;&emsp;`bash server.sh start prod post`\
&ensp;stop:\
&emsp;&emsp;`bash server.sh stop`

## Overview:
![image](https://github.com/H-IAAC/viewer_tool/assets/117912051/1f22038c-1ac9-4baf-b62f-24199b02e7e5)

## Workflow:
![image](https://github.com/H-IAAC/viewer_tool/assets/117912051/8c9757e7-24d1-45ee-981a-bb88e9c57bed)

## Testing:
This solution follows the REST (Representational State Transfer) software architectural style, as illustrated in the diagrams above, there are some APIs that can be used by external tools to interact with this solution.
> These APIs are intented to be used by the Android mobile app and the Jupyter notebook, but it is also accessable to any other tool. Nowadays there are lots of different REST tools available, as Postman, Insomnia, EchoAPI, SoapUI, cURL just to cite a few.
So in order to simulate or test this solution, you can choose any REST tools of you preference.
### Send files to the server
### Sending a file (.zip or .csv)
To simulate a HTTP request, we need 2 configurations:
```
URL: http://<address>:<port>/api/file
Parameters: File (.zip or .cvs), experiment, subject, activity
```
#### Example:
Using Insomnia tool to POST a file.
![image](https://github.com/user-attachments/assets/57d968b3-7208-4684-a592-a86552ed9f6c)


### Sending a video (.mp4)
To simulate a HTTP request, we need 2 configurations:
```
URL: http://<address>:<port>/api/video
Parameters: File (.mp4), videoDuration, startTimestamp, endTimestamp and directory
```
**Note:** where *directory* format is '_experiment [activity] [subject]_'
#### Example:
Using Insomnia tool to POST the video file.
![image](https://github.com/user-attachments/assets/662718da-0e84-4161-bf61-f43850b0223f)




