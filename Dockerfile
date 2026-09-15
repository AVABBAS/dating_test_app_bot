FROM node:20-alpine
WORKDIR /app

COPY frontend/package*.json ./frontend/
RUN cd frontend && npm install
COPY frontend/ ./frontend/
RUN cd frontend && npm run build

COPY package*.json ./
RUN npm install
COPY . .
# Prisma 6 loads prisma.config.ts during generate. DATABASE_URL is intentionally
# unavailable at image build time; provide a non-networked placeholder only for
# config validation. The real DATABASE_URL is supplied at runtime for migrations.
RUN DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder" npx prisma generate

EXPOSE 3000
CMD ["sh", "-c", "npx prisma migrate deploy && node server.js"]
