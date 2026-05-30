FROM node:22-alpine AS base
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci
COPY . .

FROM base AS development
ENV NODE_ENV=development
EXPOSE 3000
CMD ["npm", "run", "start:dev"]

FROM base AS build
RUN npm run build && npm prune --omit=dev

FROM node:22-alpine AS production
WORKDIR /usr/src/app
ENV NODE_ENV=production
COPY --from=build /usr/src/app/node_modules ./node_modules
COPY --from=build /usr/src/app/dist ./dist
COPY package*.json ./
EXPOSE 3000
CMD ["node", "dist/main.js"]
