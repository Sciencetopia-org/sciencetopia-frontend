FROM node:20-alpine AS build
WORKDIR /app
ARG HTTP_PROXY
ARG HTTPS_PROXY
ARG NO_PROXY
ENV HTTP_PROXY=$HTTP_PROXY \
    HTTPS_PROXY=$HTTPS_PROXY \
    NO_PROXY=$NO_PROXY \
    http_proxy=$HTTP_PROXY \
    https_proxy=$HTTPS_PROXY \
    no_proxy=$NO_PROXY
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ARG VUE_APP_API_BASE_URL
ARG VUE_APP_PY_API_BASE_URL
ARG VUE_APP_USE_MOCKS
ENV VUE_APP_API_BASE_URL=$VUE_APP_API_BASE_URL
ENV VUE_APP_PY_API_BASE_URL=$VUE_APP_PY_API_BASE_URL
ENV VUE_APP_USE_MOCKS=$VUE_APP_USE_MOCKS
RUN npm run build

FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
