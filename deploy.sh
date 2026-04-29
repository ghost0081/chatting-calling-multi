#!/bin/bash

# Antigravity Deployment Script for Ubuntu VPS
echo "Starting Antigravity Deployment..."

# 1. Update OS and install dependencies
sudo apt-update
sudo apt install -y curl dirmngr apt-transport-https lsb-release ca-certificates nodejs npm nginx mysql-server redis-server

# 2. Setup Node.js (via NVM)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.5/install.sh | bash
source ~/.bashrc
nvm install 20
nvm use 20

# 3. Install PM2
npm install -g pm2

# 4. MySQL setup (Automated setup snippet)
# Replace 'secret' with a strong password
sudo mysql -e "CREATE DATABASE antigravity;"
sudo mysql -e "CREATE USER 'antigravity_user'@'localhost' IDENTIFIED BY 'secret';"
sudo mysql -e "GRANT ALL PRIVILEGES ON antigravity.* TO 'antigravity_user'@'localhost';"
sudo mysql -e "FLUSH PRIVILEGES;"

# 5. Clone/Copy repository (Assume code is in /var/www/antigravity)
# cd /var/www/antigravity/backend
# npm install

# 6. PM2 Ecosystem setup
cat <<EOF > ecosystem.config.js
module.exports = {
  apps: [
    {
      name: "antigravity-api",
      script: "./src/server.js",
      instances: "max",
      exec_mode: "cluster",
      env: {
        NODE_ENV: "production",
        PORT: 5000,
      }
    }
  ]
};
EOF

# pm2 start ecosystem.config.js
# pm2 save
# pm2 startup

# 7. Setup NGINX Reverse Proxy
sudo cat <<EOF > /etc/nginx/sites-available/antigravity
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

sudo ln -s /etc/nginx/sites-available/antigravity /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

echo "Deployment setup complete. Please populate .env and run PM2."
