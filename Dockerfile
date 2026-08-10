FROM ghcr.io/puppeteer/puppeteer:21.5.0

# Switch to root user to allow file copying and package installation
USER root

# Set working directory inside the container
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Grant pptruser ownership of the working directory
RUN chown -R pptruser:pptruser /usr/src/app

# Switch back to pptruser for npm install
USER pptruser

# Install Node.js dependencies
RUN npm install

# Copy remaining application code
COPY --chown=pptruser:pptruser . .

# Launch application
CMD ["node", "index.js"]