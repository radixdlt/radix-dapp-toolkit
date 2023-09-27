#!/bin/bash

set -e

# Build the docker image
docker build -t sandbox:latest . --build-arg NETWORK_NAME=Stokenet --build-arg IS_PUBLIC=false 