FROM node:20-alpine

EXPOSE 3000

COPY index.js .
COPY package.json . 

RUN npm install

ENTRYPOINT ["node", "index.js"]