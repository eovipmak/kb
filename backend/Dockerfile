# backend/Dockerfile
FROM node:20-alpine

WORKDIR /app

# Install OpenSSL for Prisma
RUN apk -U upgrade \
 && apk add --no-cache openssl

COPY package*.json ./
RUN npm install

COPY prisma ./prisma
COPY . .

# Generate Prisma Client
RUN npx prisma generate

EXPOSE 3001

# Ensure Prisma client is generated and migrations applied at container start (dev)
CMD ["sh", "-c", "cd /app && npx prisma generate && cd /app && npx prisma migrate deploy && npm run dev"]
