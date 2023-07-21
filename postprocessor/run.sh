#!/bin/bash

PRE_DIR='../preprocessor/_preprocessor/'
POST_DIR='../preprocessor/_postprocessor/'
TOOL_NAME='captureX'

status () {
    echo 'Status:'
    if [[ $(ps -aux | grep `pwd` | grep python3 | awk -F ' ' '{print $2}') -ne 0 ]]
    then
         echo "  Process: $(ps -aux | grep `pwd` | grep python3 | awk -F ' ' '{print $2}')"
         echo "    $(ps -aux | grep `pwd` | grep python3 | awk '{ s = ""; for (i =11; i <= NF; i++) s = s $i " "; print s }')"
         echo ""
    else
        echo "  Not running"
        exit 1
    fi
}

start () {
    echo 'Starting'
    nohup python3 `pwd`/main.py $PRE_DIR $POST_DIR $TOOL_NAME >> log_post.out 2>&1 &
}

stop () {
   echo 'Stop:'
   echo "  Process: $(ps -aux | grep `pwd` | grep python3 | awk -F ' ' '{print $2}')"
   kill -9 $(ps -aux | grep `pwd` | grep python3 | awk -F ' ' '{print $2}')
}

help () {
   echo 'Usage: '
   echo '  run.sh status'
   echo '  run.sh start'
   echo '  run.sh stop'
}

case $1 in
    status) status ;;
    start) start ;;
    stop) stop ;;
    isrunning) status ;;
    *) help ;;
esac
