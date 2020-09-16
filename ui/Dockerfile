# Build in the node.js image
FROM node:latest as build-stage

# Create a folder to add the code to
WORKDIR /app

# Copy in package.json and package-lock.json
COPY package*.json ./
# Install dependencies
RUN npm install

# Copy the code into the container
COPY . .

# Build the code and save a production ready copy
RUN npm run webpackProd

# Set the server to run when executing the docker image
CMD node server.js
