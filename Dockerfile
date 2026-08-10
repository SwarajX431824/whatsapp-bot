FROM ghcr.io/puppeteer/puppeteer:21.5.0

# Set working directory inside the Puppeteer image
WORKDIR /usr/src/app

# Copy package files and install Node.js dependencies
COPY package*.json ./
RUN npm install

# Copy application files
COPY . .

# Run application
CMD ["node", "index.js"]