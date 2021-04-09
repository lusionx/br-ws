FROM node:10.15-alpine
# 根正式 可以访问https
RUN apk --no-cache add ca-certificates
# fix /etc/hosts 失效
RUN echo "hosts: files dns" > /etc/nsswitch.conf

WORKDIR /srv/

# ADD node_modules /srv/node_modules
RUN npm --registry=https://registry.npm.taobao.org install koa@2 axios@0.21 moment@2 tslib@2 ws@7

COPY *.js /srv/
COPY config /srv/config/
COPY lib /srv/lib/
COPY k8s/package.json /srv/
