# Ferramenta de Visualização

- **preprocessor:** Web tool responsible for handle input data, and provide data visualization.
- **postprocessor:** Python tool responsible for prepare csv data for visualization, checking timelapse, sync with video, split into multiple files, cleanning unnecessary content, ...
- **server.sh:** Script to start/stop the solution.

## Installation:
### Pre processor:
1) Check system requirements:
> node v18.12.1
npm 8.19.2

2) Go to preprocessor directory:
> cd preprocessor/

3) Run npm command to install dependencies
> npm install

### Post processor:
1) Check system requirements:
> Python 3.8.10
pip 22.3.1

2) Go to postprocessor directory:
> cd postprocessor/

3) Install dependencies
> pip install watchdog argparse pandas numpy  shutil ConfigParser

## Service execution:
  Use the server.sh script to execute the preprocessor and postprocessor tools,

&nbsp;&nbsp;**Development env:**
> &nbsp; bash start.sh start pre port 3000
> &nbsp; bash start.sh start post

&nbsp;&nbsp;**Production env:**
> start:
> &nbsp; bash start.sh start prod pre
> &nbsp; bash start.sh start prod post
> stop:
> &nbsp; bash start.sh stop
