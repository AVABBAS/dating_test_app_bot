FROM node:20-alpine
WORKDIR /app

# 1. Build frontend
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm install
COPY frontend/ ./frontend/
RUN cd frontend && npm run build

# 2. Build backend
COPY package*.json ./
RUN npm install
COPY . .
RUN npx prisma generate

EXPOSE 3000
CMD ["node", "server.js"]
