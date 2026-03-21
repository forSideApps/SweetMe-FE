FROM nginx:alpine
# Frontend static files (built by CI before docker build)
COPY dist /usr/share/nginx/html
# Nginx config
COPY default.conf /etc/nginx/conf.d/default.conf
