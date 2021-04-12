# Based on https://nodejs.org/en/docs/guides/nodejs-docker-webapp

# Node 12 is the current version supported by Aragon
FROM node:12.22

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies. A wildcard is used to ensure 
# both package.json AND package-lock.json are copied
COPY package*.json ./
RUN npm install

# For production
# RUN npm ci --only=production

# Copy app source
COPY . .

# Start server
CMD [ "npm", "run", "start" ]


