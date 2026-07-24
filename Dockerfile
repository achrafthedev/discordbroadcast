# Use Node.js 20 lightweight Alpine image
FROM node:26-alpine

# Set working directory
WORKDIR /usr/src/app

# Copy package descriptor files
COPY package*.json ./

# Install dependencies (only production)
RUN npm ci --omit=dev

# Copy application source files
COPY . .

# Expose port 3000 for the Web Administration Dashboard
EXPOSE 3000

# Execute command to run the server
CMD ["npm", "start"]
