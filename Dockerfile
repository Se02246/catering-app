# Stage 1: Build the React frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Final production image
FROM node:20-alpine
WORKDIR /app

# Copy only necessary files
COPY package*.json ./
RUN npm install --omit=dev

# Copy the built frontend from Stage 1
COPY --from=frontend-builder /app/dist ./dist

# Copy the backend server files
COPY server ./server

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Expose the port the app runs on
EXPOSE 3000

# Start the server
CMD ["node", "server/index.js"]
