# Ferramenta de Visualização

- **preprocessor:** Web tool responsible for handle input data, and provide data visualization.
- **postprocessor:** Python tool responsible for prepare csv data for visualization, checking timelapse, sync with video, split into multiple files, cleanning unnecessary content, ...
- **server.sh:** Script to start/stop the solution.

## Installation using docker images:
> docker compose -f docker-compose_cuda.yml up
  or
> docker compose -f docker-compose_cpu.yml up

## Installation without docker:
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


