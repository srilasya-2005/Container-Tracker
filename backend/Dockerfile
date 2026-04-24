FROM node:20-alpine

WORKDIR /app

COPY package*.json yarn.lock* ./

RUN if [ -f yarn.lock ]; then yarn install --frozen-lockfile --production; \
    else npm ci --omit=dev; fi

COPY . .

ENV NODE_ENV=production
EXPOSE 8001

CMD ["node", "server.js"]
