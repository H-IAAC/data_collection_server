#!/bin/bash

PROD=''
PORT=''
PRE_DIR='./preprocessor/_preprocessor/'
POST_DIR='./preprocessor/_postprocessor/'
PRE_SERVICE=''
POST_SERVICE=''
TOOL_NAME='ferramenta_de_visualizacao'

example() {
    echo "Development env:"
    echo "  bash server.sh start pre port 3000"
    echo "  bash server.sh start post"
    echo ""
    echo "Production env:"
    echo "  bash server.sh start prod pre"
    echo "  bash server.sh start prod post"
    echo ""
    echo "Stop:"
    echo "bash server.sh stop"
    echo ""
}

usage() {
    echo "Usage: server.sh [pre/post] [prod] [port <value>] [predir <pre_processing_dir>] [postdir <post_processing_dir>]"
    echo "  [pre/post]          Choose to start 'pre' processing or 'post' processing service."
    echo "  [prod]              Set to start as 'production' environment."
    echo "  [port <value>]      Set service port (eg.: 8081, 3000, ....)."
    echo ""
}

start() {
    for (( i=1; i<=$#; i++)); do   
        if [ "${!i}" = "prod" ]; then
            PROD='TRUE'
        fi

        if [ "${!i}" = "pre" ]; then
            PRE_SERVICE='TRUE'
        fi
        
        if [ "${!i}" = "post" ]; then
            POST_SERVICE='TRUE'
        fi
        
        if [ "${!i}" = "port" ]; then
            shift
            if [ -z ${!i} ]; then
                echo "Missing port value."
                usage;
                exit 1
            fi
            PORT="${!i}"
        fi
        
        if [ "${!i}" = "predir" ]; then
            shift
            if [ -z ${!i} ]; then
                echo "Missing pre directory value."
                usage;
                exit 1
            fi
            PRE_DIR="${!i}"
        fi

        if [ "${!i}" = "postdir" ]; then
            shift
            if [ -z "${!i}" ]; then
                echo "Missing post directory value."
                usage;
                exit 1
            fi
            POST_DIR="${!i}"
        fi
    done

    # If '$PROD' string is empty
    if [ -z $PROD ]; then
        echo "** Running as development environment **"
        
        if [ ! -z $PRE_SERVICE  ]
        then
            echo "  Starting pre-processing service..."
            node ./preprocessor/server.js $PORT $PRE_DIR $POST_DIR $TOOL_NAME
        elif [ ! -z $POST_SERVICE ] 
        then
            echo "  Starting post-processing service..."
            python3 ./postprocessor/main.py $PRE_DIR $POST_DIR $TOOL_NAME
        else
            echo ""
            echo "  Invalid command! Missing [pre/post] argument."
            exit 1
        fi
    else
        echo "** Running as production environment **"
        if [ ! -z $PRE_SERVICE  ]
        then
            echo "  Starting pre-processing service..."
            nohup node ./preprocessor/server.js $PORT $PRE_DIR $POST_DIR $TOOL_NAME >> log.out 2>&1 &
        elif [ ! -z $POST_SERVICE ] 
        then
            echo "  Starting post-processing service..."
            nohup python3 ./postprocessor/main.py $PRE_DIR $POST_DIR $TOOL_NAME >> log.out 2>&1 &
        else
            echo ""
            echo "  Invalid command! Missing [pre/post] argument."
            exit 1
        fi
    fi
}

stop() {
    ps -ef | grep $TOOL_NAME | grep -v grep | awk '{print $2}' | xargs kill
}

############################################################
# Main program                                             #
############################################################
if [ "$1" = "start" ]
then
	start $@
elif [ "$1" = "stop" ] 
then
	stop
elif [ "$1" = "example" ] 
then
    example
else
	echo "Invalid command."
	echo "Use [start/stop] options."
fi
