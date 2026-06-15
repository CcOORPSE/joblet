FROM node:18-slim

# Install Python 3 and pip
RUN apt-get update && apt-get install -y python3 python3-pip && rm -rf /var/lib/apt/lists/*

# Symlink python3 to python so Node's spawn('python') command works
RUN ln -s /usr/bin/python3 /usr/bin/python

WORKDIR /usr/src/app

# Copy dependency configs
COPY package*.json ./
RUN npm install --production

# Copy Python scraper dependencies and install them
COPY job-scraper/requirements.txt ./job-scraper/requirements.txt
RUN pip3 install --no-cache-dir -r job-scraper/requirements.txt --break-system-packages || pip3 install --no-cache-dir -r job-scraper/requirements.txt

# Copy the rest of the server files
COPY . .

ENV PORT=3000
EXPOSE 3000

CMD ["npm", "start"]
