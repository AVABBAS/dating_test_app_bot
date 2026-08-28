FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY backend/package*.json ./backend/
RUN cd backend && npm install

# Copy source code and generate prisma client
COPY backend/ ./backend/
RUN cd backend && npx prisma generate

# Create an empty frontend/dist directory to prevent any path errors in server.js
RUN mkdir -p frontend/dist

EXPOSE 3000

CMD ["node", "backend/server.js"]
