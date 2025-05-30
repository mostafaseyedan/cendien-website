# Stage 1: Build the React frontend (assuming it's in react-rfp-app)
FROM node:18-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install 
COPY . . 
# Ensure your build script in package.json correctly targets the react-rfp-app directory
# For example, if vite.config.js is in react-rfp-app, and package.json is at root:
# "build:react": "vite build react-rfp-app"
RUN npm run build:react 

# Stage 2: Setup Node.js server and serve frontend + backend
FROM node:18-alpine
WORKDIR /app

# Copy only necessary files for production server
COPY package.json package-lock.json ./
RUN npm install --only=production # Install only backend dependencies

COPY server.js .
# If you have other backend-specific files (e.g., utils, configs for server.js), copy them too.
# COPY ./lib ./lib 

# Copy the built React app from the builder stage
# Ensure the destination path here matches what server.js expects
COPY --from=builder /app/react-rfp-app/dist ./react-rfp-app/dist 

# If your server.js still uses the top-level 'public' folder for other static assets
# (like images or the non-React resume-generator.html)
COPY public ./public 

ENV PORT 8080
EXPOSE 8080

CMD ["node", "server.js"]
