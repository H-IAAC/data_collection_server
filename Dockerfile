ARG NODE_VERSION=18.12.1
ARG ALPINE_VERSION=3.16

FROM node:${NODE_VERSION}-alpine AS node
FROM alpine:${ALPINE_VERSION}

COPY --from=node /usr/lib /usr/lib
COPY --from=node /usr/local/lib /usr/local/lib
COPY --from=node /usr/local/include /usr/local/include
COPY --from=node /usr/local/bin /usr/local/bin

EXPOSE 8080

RUN apk add --update --no-cache python3 && ln -sf python3 /usr/bin/python
RUN python3 -m ensurepip
RUN apk update
RUN apk add py-pip
RUN apk --update add --no-cache g++
RUN pip3 install --no-cache --upgrade pip setuptools wheel && \
    if [ ! -e /usr/bin/pip ]; then ln -s pip3 /usr/bin/pip ; fi

ENV PYTHONUNBUFFERED=1
ENV SRC_PATH=/usr/src/h-iaac/captureX
ENV PRE_PROCESSOR_PATH=${SRC_PATH}/preprocessor
ENV POST_PROCESSOR_PATH=${SRC_PATH}/postprocessor

RUN mkdir -p ${PRE_PROCESSOR_PATH}
RUN mkdir -p ${POST_PROCESSOR_PATH}

COPY ./ ${SRC_PATH}
COPY ./preprocessor ${PRE_PROCESSOR_PATH}
COPY ./postprocessor ${POST_PROCESSOR_PATH} 

WORKDIR ${PRE_PROCESSOR_PATH}
RUN npm install

WORKDIR ${POST_PROCESSOR_PATH}
RUN pip3 install -r requirements.txt

RUN mkdir -p ${PRE_PROCESSOR_PATH}/_preprocessor
RUN mkdir -p ${PRE_PROCESSOR_PATH}/_postprocessor

RUN ln -s ${PRE_PROCESSOR_PATH}/_preprocessor /pre_dataset
RUN ln -s ${POST_PROCESSOR_PATH}/_postprocessor /post_dataset

WORKDIR ${SRC_PATH}
CMD ["sh", "run.sh"]
