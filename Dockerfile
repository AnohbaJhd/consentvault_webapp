# Use official Node.js base image
FROM node:18

# Set working directory inside the container
WORKDIR /app

# Copy dependency files and install
COPY package*.json ./
RUN npm install

# Copy the rest of your project files
COPY . .

# Expose the port your app runs on (adjust if it's not 3000)
EXPOSE 3000

# Start the server
CMD ["node", "server.js"]
