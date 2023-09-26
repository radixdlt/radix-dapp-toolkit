ARG BUILDKIT_SBOM_SCAN_CONTEXT=true

FROM node:16-alpine as builder

ARG BUILDKIT_SBOM_SCAN_STAGE=true

WORKDIR /app

# Copy the package.json and install dependencies
COPY package.json ./
COPY package-lock.json ./
RUN npm install

ARG NETWORK_NAME
ENV VITE_NETWORK_NAME=$NETWORK_NAME

ARG IS_PUBLIC
ENV VITE_IS_PUBLIC=$IS_PUBLIC

RUN echo "The VITE_IS_PUBLIC variable value is $VITE_IS_PUBLIC"
RUN echo "The VITE_NETWORK_NAME variable value is $VITE_NETWORK_NAME"

# Copy rest of the files
COPY . .

# Build the project
RUN npm run build examples
RUN cp -r ./examples/assets/sandbox_icon.png ./examples/dist/assets/sandbox_icon.png
RUN cp -r ./examples/assets/og.webp ./examples/dist/assets/og.webp
RUN cp -r ./examples/assets/favicon.png ./examples/dist/assets/favicon.png

FROM nginx:alpine as production-build

ARG BUILDKIT_SBOM_SCAN_STAGE=true

COPY ./.nginx/nginx.conf /etc/nginx/nginx.conf

## Remove default nginx index page
RUN rm -rf /usr/share/nginx/html/*

COPY --from=builder /app/examples/dist /usr/share/nginx/html

EXPOSE 80
ENTRYPOINT ["nginx", "-g", "daemon off;"]
