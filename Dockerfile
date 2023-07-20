
FROM node:16-alpine as builder

WORKDIR /app

# Copy the package.json and install dependencies
COPY package.json ./
COPY package-lock.json ./
RUN npm ci

# Copy rest of the files
COPY . .

# Build the project
RUN npm run build examples

FROM nginx:alpine as production-build

COPY ./.nginx/nginx.conf /etc/nginx/nginx.conf

## Remove default nginx index page
RUN rm -rf /usr/share/nginx/html/*

COPY --from=builder /app/examples/dist /usr/share/nginx/html

EXPOSE 80
ENTRYPOINT ["nginx", "-g", "daemon off;"]