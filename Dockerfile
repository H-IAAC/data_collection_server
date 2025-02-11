FROM ubuntu:jammy-20211029

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt upgrade -y

# install essential packages
RUN apt-get install -y curl gpg

# add Node.js, PHP and ImageMagick repos
RUN curl -sL https://deb.nodesource.com/setup_18.x | bash -

RUN apt-get update && apt install -y \
  nodejs \
  python3 \
  python3-pip \
  python3-opencv \
  ffmpeg \
  libfdk-aac2

RUN python3 -m pip install --upgrade pip setuptools wheel

EXPOSE 8080

ENV PYTHONUNBUFFERED=1
ENV SRC_PATH=/usr/src/h-iaac/captureX
ENV PRE_PROCESSOR_PATH=${SRC_PATH}/preprocessor
ENV POST_PROCESSOR_PATH=${SRC_PATH}/postprocessor

RUN mkdir -p ${PRE_PROCESSOR_PATH}
RUN mkdir -p ${POST_PROCESSOR_PATH}

COPY ./run.sh ${SRC_PATH}
COPY ./preprocessor ${PRE_PROCESSOR_PATH}
COPY ./postprocessor ${POST_PROCESSOR_PATH} 

WORKDIR ${PRE_PROCESSOR_PATH}
RUN npm install

WORKDIR ${POST_PROCESSOR_PATH}
RUN pip3 install -r requirements.txt

RUN mkdir -p ${PRE_PROCESSOR_PATH}/_preprocessor
RUN mkdir -p ${PRE_PROCESSOR_PATH}/_postprocessor
RUN apt-get update && apt-get install -y wget && rm -rf /var/lib/apt/lists/*
RUN wget -O ${POST_PROCESSOR_PATH}/yolo11x-pose.pt https://github.com/ultralytics/assets/releases/download/v8.3.0/yolo11x-pose.pt

RUN ln -s ${PRE_PROCESSOR_PATH}/_preprocessor /pre_dataset
RUN ln -s ${PRE_PROCESSOR_PATH}/_postprocessor /post_dataset

RUN apt-get update && apt-get install -y libmediainfo0v5

WORKDIR ${SRC_PATH}
CMD ["sh", "run.sh"]
