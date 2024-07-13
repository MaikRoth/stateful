#!/bin/bash

# Set image names
BACKEND_IMAGE="mathroik/my-backend"


# Build backend Docker image
echo "Building backend Docker image..."
docker build -t $BACKEND_IMAGE:latest .
if [ $? -ne 0 ]; then
    echo "Failed to build backend Docker image"
    exit 1
fi

# Push backend Docker image
echo "Pushing backend Docker image..."
docker push $BACKEND_IMAGE:latest
if [ $? -ne 0 ]; then
    echo "Failed to push backend Docker image"
    exit 1
fi

echo "Docker images built and pushed successfully"

# Remove backend Docker image from local disk
echo "Removing backend Docker image from local disk..."
docker rmi $BACKEND_IMAGE:latest
if [ $? -ne 0 ]; then
    echo "Failed to remove backend Docker image from local disk"
    exit 1
fi


