FROM vietlq/enki-login-base:latest

COPY enki-login-app /opt/enki/login/app
WORKDIR /opt/enki/login/app
VOLUME /opt/enki/login/config

RUN npm install
RUN npm install -g -D babel-cli uglify-js
RUN make build

EXPOSE 1337

CMD ["/usr/local/bin/node", "index.js"]
