#!/bin/bash

PRE_DIR='../preprocessor/_preprocessor/'
POST_DIR='../preprocessor/_postprocessor/'
TOOL_NAME='captureX'
SCRIPTPATH="$( cd -- "$(dirname "$0")" >/dev/null 2>&1 ; pwd -P )"

status () {
    echo 'Status:'
    if [[ $(ps -aux | grep $SCRIPTPATH | grep python3 | awk -F ' ' '{print $2}' | head -n 1) -ne 0 ]]
    then
         echo "  Process: $(ps -aux | grep $SCRIPTPATH | grep python3 | awk -F ' ' '{print $2}')"
         echo "    $(ps -aux | grep $SCRIPTPATH | grep python3 | awk '{ s = ""; for (i =11; i <= NF; i++) s = s $i " "; print s }')"
         echo ""
    else
        echo "  Not running"
        exit 1
    fi
}

start () {
    echo 'Starting' 
    if [ -z $2 ]; then
        nohup python3 $SCRIPTPATH/main.py $PRE_DIR $POST_DIR $TOOL_NAME >> log.out 2>&1 &
    else
        # Start with web api enabled: ./run start 7998
        nohup python3 $SCRIPTPATH/main.py $PRE_DIR $POST_DIR $TOOL_NAME $2 >> log.out 2>&1 &
    fi
}

docker () {
    echo 'Starting'
    if [ $# -eq 2 ]
    then
        echo ' Using PORT:' $2
        python3 $SCRIPTPATH/main.py $PRE_DIR $POST_DIR $TOOL_NAME $2 >> log.out 2>&1
    else
        echo ' ERROR! Missing PORT configuration.'
        echo ' Please set the port argument'
    fi
}

stop () {
   echo 'Stop:'
   echo "  Process: $(ps -aux | grep $SCRIPTPATH | grep python3 | awk -F ' ' '{print $2}')"
   kill -9 $(ps -aux | grep $SCRIPTPATH | grep python3 | awk -F ' ' '{print $2}')
}

help () {
   echo 'Usage: '
   echo '  run.sh status'
   echo '  run.sh start'
   echo '  run.sh stop'
}

case $1 in
    status) status ;;
    start) start $# $2 ;;
    docker) docker $# $2 ;;
    stop) stop ;;
    isrunning) status ;;
    *) help ;;
esac
