# smart people already figured out how to install node
# FROM mhart/alpine-node:7 
FROM resinci/npm-x86_64-ubuntu-node10

# create a work directory inside the container
RUN mkdir /app
WORKDIR /app

# Expose the port outside of the container
EXPOSE 3000

# install utilities. I currently like yarn
RUN npm install -g yarn nodemon typescript web3
# install dependencies
RUN yarn