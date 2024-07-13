#!/bin/bash

FRONTEND_IMAGE="mathroik/my-frontend"


echo "Building frontend Docker image..."
docker build -t $FRONTEND_IMAGE:latest .
if [ $? -ne 0 ]; then
    echo "Failed to build frontend Docker image"
    exit 1
fi

echo "Pushing frontend Docker image..."
docker push $FRONTEND_IMAGE:latest
if [ $? -ne 0 ]; then
    echo "Failed to push frontend Docker image"
    exit 1
fi

echo "Docker images built and pushed successfully"

echo "Removing backend Docker image from local disk..."
docker rmi $FRONTEND_IMAGE:latest
if [ $? -ne 0 ]; then
    echo "Failed to remove frontend Docker image from local disk"
    exit 1
fi

