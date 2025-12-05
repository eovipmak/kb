# frontend/Dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
# Install dependencies including legacy peer deps for TipTap/Next compatibility
RUN npm install --legacy-peer-deps

COPY . .

EXPOSE 3002

CMD ["npm", "run", "dev"]