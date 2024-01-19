#!/bin/bash

PRE_DIR='preprocessor'
POST_DIR='postprocessor'

echo 'Starting pre processor'
sh ./$PRE_DIR/run.sh docker 8080 &

echo 'Starting post processor'
sh ./$POST_DIR/run.sh docker 7998 &

# wait is used to suspend the script until one of the processes does terminate
wait

# exits with the status code issued by the finished script
echo 'Leaving with code '$?
