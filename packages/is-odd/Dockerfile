FROM vdtn359/node-pnpm-base:16-alpine-7.9.0 as builder
RUN mkdir -p /app
ENTRYPOINT []
WORKDIR /app
COPY _isolated_ /app/
RUN --mount=type=cache,id=pnpm-store,target=/root/.pnpm-store pnpm i --prod --frozen-lockfile

FROM docker.io/vdtn359/node-prod
RUN mkdir -p /app
WORKDIR /app
COPY --from=builder --chown=node:node /app /app/
USER node
CMD ["npm", "run", "start:prod"]