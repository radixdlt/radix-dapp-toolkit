ARG BUILDKIT_SBOM_SCAN_CONTEXT=true

FROM node:16-alpine as builder

ARG BUILDKIT_SBOM_SCAN_STAGE=true

WORKDIR /app

# Copy the package.json and install dependencies
COPY package.json ./
COPY package-lock.json ./
RUN npm install

# Copy rest of the files
COPY . .

# Build the project
RUN npm run build examples
RUN cp -r ./examples/assets/sandbox_icon.png ./examples/dist/assets/sandbox_icon.png

FROM nginx:alpine as production-build

ARG BUILDKIT_SBOM_SCAN_STAGE=true

COPY ./.nginx/nginx.conf /etc/nginx/nginx.conf

## Remove default nginx index page
RUN rm -rf /usr/share/nginx/html/*

COPY --from=builder /app/examples/dist /usr/share/nginx/html

EXPOSE 80
ENTRYPOINT ["nginx", "-g", "daemon off;"]
