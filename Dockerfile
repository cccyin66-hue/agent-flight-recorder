FROM node:24-bookworm-slim
WORKDIR /app
COPY package.json server.mjs lib.mjs verify.mjs ./
COPY public ./public
ENV NODE_ENV=production HOST=0.0.0.0 PORT=3000 DATA_DIR=/data
RUN mkdir -p /data && chown node:node /data
USER node
EXPOSE 3000
CMD ["node", "server.mjs"]
