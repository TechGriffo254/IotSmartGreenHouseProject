# Deployment Guide

This guide covers different deployment options for the Smart Greenhouse IoT system.

## Table of Contents
- [Koyeb Deployment (Recommended)](#koyeb-deployment-recommended)
- [Heroku Deployment](#heroku-deployment)
- [DigitalOcean Deployment](#digitalocean-deployment)
- [AWS Deployment](#aws-deployment)
- [Docker Deployment](#docker-deployment)
- [Local Production Setup](#local-production-setup)

## Koyeb Deployment (Recommended)

Koyeb provides excellent support for Node.js applications with automatic scaling.

### Prerequisites
- GitHub account with your forked repository
- Koyeb account (free tier available)
- MongoDB Atlas cluster

### Step-by-Step Guide

1. **Fork the Repository**
   ```bash
   # Fork https://github.com/TechGriffo254/IotSmartGreenHouseProject on GitHub
   ```

2. **Setup MongoDB Atlas**
   - Create account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - Create a new cluster
   - Add your IP to whitelist (or use 0.0.0.0/0 for all IPs)
   - Create database user with read/write permissions
   - Get connection string

3. **Deploy to Koyeb**
   - Sign up at [Koyeb](https://www.koyeb.com/)
   - Connect your GitHub account
   - Create new service
   - Select your forked repository
   - Configure deployment settings:

   **Build Settings:**
   ```
   Build Command: npm install
   Run Command: npm start
   Port: 8080
   ```

   **Environment Variables:**
   ```
   NODE_ENV=production
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/greenhouse
   JWT_SECRET=your_super_secure_jwt_secret_minimum_32_characters
   JWT_EXPIRE=7d
   ESP32_PINCODE=your_secure_pincode
   ALERT_THRESHOLD_TEMP_HIGH=35
   ALERT_THRESHOLD_TEMP_LOW=15
   ALERT_THRESHOLD_HUMIDITY_HIGH=80
   ALERT_THRESHOLD_HUMIDITY_LOW=40
   ALERT_THRESHOLD_SOIL_MOISTURE_LOW=30
   ALERT_THRESHOLD_LIGHT_LOW=200
   ```

4. **Deploy and Verify**
   - Click Deploy
   - Wait for deployment to complete
   - Test your API endpoint
   - Update frontend configuration with new backend URL

### Koyeb Configuration Files

Create these files in your repository root:

**package.json** (already exists)
```json
{
  "name": "iot-smart-greenhouse",
  "version": "1.0.0",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "engines": {
    "node": ">=16.0.0"
  }
}
```

**.nvmrc**
```
18
```

**Procfile**
```
web: npm start
```

## Heroku Deployment

### Prerequisites
- Heroku CLI installed
- Heroku account

### Setup Steps

1. **Install Heroku CLI**
   ```bash
   # macOS
   brew tap heroku/brew && brew install heroku
   
   # Windows
   # Download from https://devcenter.heroku.com/articles/heroku-cli
   
   # Ubuntu
   curl https://cli-assets.heroku.com/install.sh | sh
   ```

2. **Login and Create App**
   ```bash
   heroku login
   heroku create your-greenhouse-app
   ```

3. **Configure Environment Variables**
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set MONGODB_URI="mongodb+srv://username:password@cluster.mongodb.net/greenhouse"
   heroku config:set JWT_SECRET="your_super_secure_jwt_secret"
   heroku config:set JWT_EXPIRE="7d"
   heroku config:set ESP32_PINCODE="your_secure_pincode"
   ```

4. **Deploy**
   ```bash
   git add .
   git commit -m "Prepare for Heroku deployment"
   git push heroku main
   ```

5. **Scale and Monitor**
   ```bash
   heroku ps:scale web=1
   heroku logs --tail
   heroku open
   ```

## DigitalOcean Deployment

### Using DigitalOcean App Platform

1. **Create App**
   - Go to DigitalOcean App Platform
   - Connect your GitHub repository
   - Configure build settings

2. **App Spec Configuration**
   ```yaml
   name: smart-greenhouse
   services:
   - name: api
     source_dir: /
     github:
       repo: your-username/IotSmartGreenHouseProject
       branch: main
       deploy_on_push: true
     run_command: npm start
     environment_slug: node-js
     instance_count: 1
     instance_size_slug: basic-xxs
     envs:
     - key: NODE_ENV
       value: production
     - key: MONGODB_URI
       value: "your_mongodb_connection_string"
       type: SECRET
     - key: JWT_SECRET
       value: "your_jwt_secret"
       type: SECRET
   ```

### Using DigitalOcean Droplet

1. **Create Droplet**
   ```bash
   # Create Ubuntu 20.04 droplet
   # Connect via SSH
   ```

2. **Install Dependencies**
   ```bash
   # Update system
   sudo apt update && sudo apt upgrade -y
   
   # Install Node.js
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # Install PM2
   sudo npm install -g pm2
   
   # Install Nginx
   sudo apt install nginx -y
   ```

3. **Deploy Application**
   ```bash
   # Clone repository
   git clone https://github.com/your-username/IotSmartGreenHouseProject.git
   cd IotSmartGreenHouseProject
   
   # Install dependencies
   npm install
   
   # Create environment file
   cp .env.example .env
   # Edit .env with your configuration
   
   # Start with PM2
   pm2 start server.js --name greenhouse-api
   pm2 startup
   pm2 save
   ```

4. **Configure Nginx**
   ```nginx
   # /etc/nginx/sites-available/greenhouse
   server {
       listen 80;
       server_name your-domain.com;
       
       location / {
           proxy_pass http://localhost:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

   ```bash
   # Enable site
   sudo ln -s /etc/nginx/sites-available/greenhouse /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

## AWS Deployment

### Using AWS Elastic Beanstalk

1. **Install EB CLI**
   ```bash
   pip install awsebcli
   ```

2. **Initialize Application**
   ```bash
   eb init
   # Select region and application name
   # Choose Node.js platform
   ```

3. **Create Environment**
   ```bash
   eb create production
   ```

4. **Configure Environment Variables**
   ```bash
   eb setenv NODE_ENV=production
   eb setenv MONGODB_URI="your_mongodb_uri"
   eb setenv JWT_SECRET="your_jwt_secret"
   ```

5. **Deploy**
   ```bash
   eb deploy
   eb open
   ```

### Using AWS ECS (Docker)

1. **Create Dockerfile**
   ```dockerfile
   FROM node:18-alpine
   
   WORKDIR /app
   
   COPY package*.json ./
   RUN npm ci --only=production
   
   COPY . .
   
   EXPOSE 5000
   
   USER node
   
   CMD ["npm", "start"]
   ```

2. **Build and Push to ECR**
   ```bash
   # Build image
   docker build -t greenhouse-api .
   
   # Tag for ECR
   docker tag greenhouse-api:latest <account-id>.dkr.ecr.<region>.amazonaws.com/greenhouse-api:latest
   
   # Push to ECR
   docker push <account-id>.dkr.ecr.<region>.amazonaws.com/greenhouse-api:latest
   ```

3. **Deploy with ECS**
   - Create ECS cluster
   - Create task definition
   - Create service
   - Configure load balancer

## Docker Deployment

### Development Docker Setup

**Dockerfile**
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Change ownership
RUN chown -R nodejs:nodejs /app
USER nodejs

EXPOSE 5000

CMD ["npm", "start"]
```

**docker-compose.yml**
```yaml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://mongo:27017/greenhouse
      - JWT_SECRET=your_jwt_secret
    depends_on:
      - mongo
    volumes:
      - ./logs:/app/logs

  mongo:
    image: mongo:6.0
    ports:
      - "27017:27017"
    environment:
      - MONGO_INITDB_DATABASE=greenhouse
    volumes:
      - mongo_data:/data/db

  frontend:
    build: ./frontend
    ports:
      - "3000:80"
    depends_on:
      - api

volumes:
  mongo_data:
```

### Production Docker Setup

**docker-compose.prod.yml**
```yaml
version: '3.8'

services:
  api:
    build: 
      context: .
      dockerfile: Dockerfile.prod
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=${MONGODB_URI}
      - JWT_SECRET=${JWT_SECRET}
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - api
    restart: unless-stopped
```

## Local Production Setup

### Prerequisites
- Node.js 18+
- MongoDB (local or cloud)
- PM2 process manager

### Setup Steps

1. **Install PM2**
   ```bash
   npm install -g pm2
   ```

2. **Create Production Environment**
   ```bash
   cp .env.example .env.production
   # Edit .env.production with production values
   ```

3. **Create PM2 Ecosystem File**
   ```javascript
   // ecosystem.config.js
   module.exports = {
     apps: [{
       name: 'greenhouse-api',
       script: 'server.js',
       instances: 'max',
       exec_mode: 'cluster',
       env: {
         NODE_ENV: 'development'
       },
       env_production: {
         NODE_ENV: 'production',
         PORT: 5000
       },
       log_file: './logs/combined.log',
       out_file: './logs/out.log',
       error_file: './logs/error.log',
       max_memory_restart: '500M'
     }]
   };
   ```

4. **Start Production**
   ```bash
   # Start with PM2
   pm2 start ecosystem.config.js --env production
   
   # Enable startup script
   pm2 startup
   pm2 save
   
   # Monitor
   pm2 monit
   ```

## Security Considerations

### Environment Variables
- Use strong, unique JWT secrets (minimum 32 characters)
- Use secure database passwords
- Keep API keys and secrets out of version control
- Use different secrets for different environments

### Network Security
- Use HTTPS in production
- Configure CORS properly
- Implement rate limiting
- Use security headers (Helmet.js)
- Keep dependencies updated

### Database Security
- Use MongoDB Atlas or secure MongoDB installation
- Enable authentication
- Use connection string with SSL
- Regular backups
- Monitor for suspicious activity

### Monitoring
- Set up application monitoring (e.g., New Relic, DataDog)
- Configure log aggregation
- Set up alerts for errors and downtime
- Monitor resource usage

## Troubleshooting

### Common Deployment Issues

1. **Port Binding Errors**
   ```bash
   # Check if port is in use
   lsof -i :5000
   
   # Kill process using port
   kill -9 <PID>
   ```

2. **Environment Variable Issues**
   ```bash
   # Verify environment variables
   env | grep NODE_ENV
   
   # Test with specific environment
   NODE_ENV=production npm start
   ```

3. **Database Connection Issues**
   ```bash
   # Test MongoDB connection
   mongo "mongodb+srv://cluster.mongodb.net/test" --username <username>
   ```

4. **Memory Issues**
   ```bash
   # Check memory usage
   free -h
   
   # Monitor Node.js process
   top -p <node_pid>
   ```

### Performance Optimization

1. **Enable Compression**
   ```javascript
   const compression = require('compression');
   app.use(compression());
   ```

2. **Configure Caching**
   ```javascript
   const redis = require('redis');
   const client = redis.createClient();
   ```

3. **Database Optimization**
   - Create proper indexes
   - Use connection pooling
   - Enable query optimization

4. **CDN Setup**
   - Use CloudFlare or AWS CloudFront
   - Optimize static assets
   - Enable browser caching

## Backup Strategy

### Database Backup
```bash
# MongoDB backup
mongodump --uri="mongodb+srv://username:password@cluster.mongodb.net/greenhouse"

# Automated backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
mongodump --uri="$MONGODB_URI" --out=/backups/greenhouse_$DATE
```

### Application Backup
```bash
# Create backup script
#!/bin/bash
tar -czf greenhouse_backup_$(date +%Y%m%d).tar.gz \
  --exclude=node_modules \
  --exclude=.git \
  --exclude=logs \
  .
```

### Automated Backups
- Set up cron jobs for regular backups
- Store backups in cloud storage (S3, Google Cloud Storage)
- Test backup restoration procedures
- Keep multiple backup versions

This deployment guide should help you successfully deploy the Smart Greenhouse IoT system to various platforms. Choose the option that best fits your needs and infrastructure requirements.
