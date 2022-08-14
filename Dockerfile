FROM vdtn359/node-pnpm-base:16-alpine-7.9.0 as source
RUN mkdir -p /app
WORKDIR /app
RUN apk add --no-cache tree
COPY pnpm-*.yaml /app
COPY package.json /app
COPY .npmrc /app
RUN --mount=type=bind,target=/docker-context \
    cd /docker-context/; \
    find . -name "package.json" -mindepth 3 -maxdepth 3 -exec cp --parents "{}" /app/ \;
RUN tree

FROM vdtn359/node-pnpm-base:16-alpine-7.9.0 as builder
RUN apk add --no-cache git
RUN mkdir -p /app
ENTRYPOINT []
WORKDIR /app
COPY --from=source /app .
RUN --mount=type=cache,id=pnpm-store,target=/root/.pnpm-store pnpm install --frozen-lockfile
COPY . /app
