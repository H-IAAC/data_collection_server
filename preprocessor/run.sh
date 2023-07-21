#!/bin/bash

PRE_DIR='./_preprocessor/'
POST_DIR='./_postprocessor/'
TOOL_NAME='captureX'

status () {
    echo 'Status:'
    if [[ $(ps -aux | grep `pwd` | grep node | awk -F ' ' '{print $2}') -ne 0 ]]
    then
         echo "  Process: $(ps -aux | grep `pwd` | grep node | awk -F ' ' '{print $2}')"
         echo "    $(ps -aux | grep `pwd` | grep node | awk '{ s = ""; for (i =11; i <= NF; i++) s = s $i " "; print s }')"
         echo ""
    else
        echo "  Not running"
    fi
}

start () {
    echo 'Starting'
    if [ $# -eq 2 ]
    then
        echo ' Using PORT:' $2
        nohup node `pwd`/server.js $2 $PRE_DIR $POST_DIR $TOOL_NAME >> log_pre.out 2>&1 &
    else
        echo ' ERROR! Missing PORT configuration.'
        echo ' Please set the port argument'
        help
    fi
}

stop () {
   echo 'Stop:'
   echo "  Process: $(ps -aux | grep `pwd` | grep node | awk -F ' ' '{print $2}')"
   kill -9 $(ps -aux | grep `pwd` | grep node | awk -F ' ' '{print $2}')
}

help () {
   echo 'Usage: '
   echo '  run.sh status'
   echo '  run.sh start <PORT>'
   echo '  run.sh stop'
}

case $1 in
    status) status ;;
    start) start $@ ;;
    stop) stop ;;
    *) help ;;
esac
