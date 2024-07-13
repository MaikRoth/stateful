#!/bin/bash

# Set image names
FRONTEND_IMAGE="mathroik/my-frontend"


# Build frontend Docker image
echo "Building frontend Docker image..."
docker build -t $FRONTEND_IMAGE:latest .
if [ $? -ne 0 ]; then
    echo "Failed to build frontend Docker image"
    exit 1
fi

# Push frontend Docker image
echo "Pushing frontend Docker image..."
docker push $FRONTEND_IMAGE:latest
if [ $? -ne 0 ]; then
    echo "Failed to push frontend Docker image"
    exit 1
fi

echo "Docker images built and pushed successfully"

# Remove frontend Docker image from local disk
echo "Removing backend Docker image from local disk..."
docker rmi $FRONTEND_IMAGE:latest
if [ $? -ne 0 ]; then
    echo "Failed to remove frontend Docker image from local disk"
    exit 1
fi

