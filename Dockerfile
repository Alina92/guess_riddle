FROM keymetrics/pm2:latest-alpine

# Bundle APP files
COPY db db/
COPY package.json .
COPY index.js .
COPY Bot.js .
COPY pm2.json .
COPY rsa_private_key.pem .
COPY rsa_public_key.pem .

# Install app dependencies
ENV NPM_CONFIG_LOGLEVEL warn
RUN npm install --production

# Show current folder structure in logs
RUN ls -al

EXPOSE 8016

CMD [ "pm2-runtime", "start", "pm2.json" ]