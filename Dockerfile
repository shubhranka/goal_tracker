FROM node:18-alpine

WORKDIR /app

# Install dependencies for the frontend
COPY package.json ./
COPY package-lock.json ./
RUN npm install

# Install dependencies for the backend
COPY server/package.json ./server/
COPY server/package-lock.json ./server/
RUN npm install --prefix server

# Copy the rest of the frontend and backend code
COPY . .

# Build the frontend
RUN npm run build

# Build the backend
RUN npm run build --prefix server

# Expose the port the app runs on
EXPOSE 3001

# Start the backend server
CMD ["npm", "start", "--prefix", "server"]
