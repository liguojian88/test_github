FROM hub.smartone.net.cn/soft/nginx:1.26-shop
COPY ./dist /usr/share/nginx/html/dist
COPY ./nginx.conf /etc/nginx/conf.d
