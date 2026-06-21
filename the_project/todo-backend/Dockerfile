FROM node:20-alpine

WORKDIR /usr/src/app

COPY index.js .
COPY package.json .

RUN npm install

ENTRYPOINT ["node", "index.js"]
