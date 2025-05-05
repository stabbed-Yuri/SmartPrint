#!/bin/bash

echo "Starting SmartPrint application..."
echo

# Check for JAVA_HOME
if [ -z "$JAVA_HOME" ]; then
    echo "Error: JAVA_HOME environment variable is not set."
    echo "Please install Java and set JAVA_HOME before running this application."
    exit 1
fi

# Check if Maven is in PATH
if ! command -v mvn &> /dev/null; then
    echo "Maven is not found in PATH. Trying to use Maven wrapper..."
    
    if [ -f "./mvnw" ]; then
        echo "Using Maven wrapper to start the application"
        chmod +x ./mvnw
        ./mvnw spring-boot:run
    else
        echo "Error: Neither Maven nor Maven wrapper found."
        echo "Please install Maven or make sure it's in your PATH."
        exit 1
    fi
else
    echo "Using Maven to start the application"
    mvn spring-boot:run
fi

if [ $? -ne 0 ]; then
    echo
    echo "Error: Failed to start the application."
    echo "Please check the logs above for details."
    exit 1
fi

echo
echo "Application started successfully!" 