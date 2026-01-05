# AWS Deployment Guide

This guide covers deploying the Stock Learning Platform to AWS using various services.

## Prerequisites

- AWS account with appropriate permissions
- AWS CLI installed and configured
- Docker installed (for ECS/ECS Fargate deployment)
- Domain name (optional, for custom domain)

## Architecture Options

### Option 1: AWS Elastic Beanstalk (Easiest)

Elastic Beanstalk is the simplest way to deploy Node.js applications to AWS.

#### Steps:

1. **Install EB CLI**:
   ```bash
   pip install awsebcli
   ```

2. **Initialize EB**:
   ```bash
   eb init -p "Node.js 20 running on 64bit Amazon Linux 2" stock-learning-platform
   ```

3. **Create environment file** (`.ebextensions/environment.config`):
   ```yaml
   option_settings:
     aws:elasticbeanstalk:application:environment:
       NODE_ENV: production
       PORT: 8081
       DATABASE_URL: your-database-url
       FIREBASE_PROJECT_ID: your-firebase-project-id
       FIREBASE_SERVICE_ACCOUNT: your-service-account-json
       SESSION_SECRET: your-session-secret
   ```

4. **Create Procfile**:
   ```
   web: node dist/index.js
   ```

5. **Deploy**:
   ```bash
   npm run build
   eb create stock-learning-platform-env
   eb deploy
   ```

### Option 2: AWS ECS with Fargate (Recommended for Production)

ECS Fargate provides serverless container deployment.

#### Steps:

1. **Build and push Docker image to ECR**:
   ```bash
   # Login to ECR
   aws ecr get-login-password --region eu-west-2 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.eu-west-2.amazonaws.com

   # Create repository
   aws ecr create-repository --repository-name stock-learning-platform --region eu-west-2

   # Build image
   docker build -t stock-learning-platform .

   # Tag and push
   docker tag stock-learning-platform:latest <account-id>.dkr.ecr.eu-west-2.amazonaws.com/stock-learning-platform:latest
   docker push <account-id>.dkr.ecr.eu-west-2.amazonaws.com/stock-learning-platform:latest
   ```

2. **Create ECS Task Definition** (use AWS Console or CLI):
   - Container image: Your ECR image URL
   - Port mappings: 8081
   - Environment variables: Set all required env vars
   - Memory: 512 MB minimum
   - CPU: 0.25 vCPU minimum

3. **Create ECS Service**:
   - Use Fargate launch type
   - Create or use existing VPC and subnets
   - Create Application Load Balancer
   - Configure health checks

4. **Set up RDS PostgreSQL** (if not using Neon/Supabase):
   ```bash
   aws rds create-db-instance \
     --db-instance-identifier stock-learning-db \
     --db-instance-class db.t3.micro \
     --engine postgres \
     --master-username postgres \
     --master-user-password <password> \
     --allocated-storage 20 \
     --region eu-west-2
   ```

### Option 3: AWS EC2 (Traditional VM)

For more control over the infrastructure.

#### Steps:

1. **Launch EC2 Instance**:
   - AMI: Amazon Linux 2023
   - Instance type: t3.small or larger
   - Security group: Allow HTTP (80), HTTPS (443), and SSH (22)
   - Region: eu-west-2 (London) or eu-central-1 (Frankfurt)

2. **SSH into instance**:
   ```bash
   ssh -i your-key.pem ec2-user@<instance-ip>
   ```

3. **Install Node.js and dependencies**:
   ```bash
   # Install Node.js 20
   curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
   sudo yum install -y nodejs

   # Install Git
   sudo yum install -y git

   # Clone repository
   git clone <your-repo-url>
   cd StockFantasySimulator

   # Install dependencies
   npm ci

   # Build
   npm run build
   ```

4. **Set up environment variables**:
   ```bash
   sudo nano /etc/environment
   # Add: DATABASE_URL=..., FIREBASE_PROJECT_ID=..., etc.
   ```

5. **Install PM2 for process management**:
   ```bash
   sudo npm install -g pm2
   pm2 start dist/index.js --name stock-learning-platform
   pm2 save
   pm2 startup
   ```

6. **Set up Nginx reverse proxy**:
   ```bash
   sudo yum install -y nginx
   sudo systemctl start nginx
   sudo systemctl enable nginx
   ```

   Edit `/etc/nginx/nginx.conf`:
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       location / {
           proxy_pass http://localhost:8081;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

7. **Set up SSL with Let's Encrypt**:
   ```bash
   sudo yum install -y certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com
   ```

## Environment Variables

Set these in your deployment environment:

```bash
# Required
DATABASE_URL=postgresql://...
FIREBASE_PROJECT_ID=your-project-id
SESSION_SECRET=$(openssl rand -base64 32)

# Required for production
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}
NODE_ENV=production
PORT=8081

# Optional
CORS_ORIGIN=https://yourdomain.com
```

## Database Setup

### Option A: Use Neon/Supabase (Recommended)
- Easier setup
- Managed service
- Free tier available

### Option B: AWS RDS PostgreSQL
- Full control
- More configuration needed
- Pay for instance

After database is set up, run the migration:
```sql
ALTER TABLE contests DROP COLUMN IF EXISTS entry_fee;
```

## Security Considerations

1. **Use AWS Secrets Manager** for sensitive environment variables
2. **Enable HTTPS** (use Application Load Balancer or CloudFront)
3. **Set up WAF** (Web Application Firewall) if needed
4. **Use security groups** to restrict access
5. **Enable CloudWatch** for logging and monitoring
6. **Set up auto-scaling** for production workloads

## Monitoring

1. **CloudWatch Logs**: Application logs
2. **CloudWatch Metrics**: CPU, memory, request counts
3. **X-Ray**: Distributed tracing (optional)
4. **Health checks**: Configure in load balancer

## Cost Estimation

- **ECS Fargate**: ~$15-30/month (0.5 vCPU, 1GB RAM, minimal traffic)
- **RDS PostgreSQL**: ~$15-30/month (db.t3.micro)
- **Application Load Balancer**: ~$20/month
- **Data Transfer**: Variable
- **Total**: ~$50-80/month minimum

Consider using Neon/Supabase to avoid RDS costs.

## UK/EU Region Selection

For UK Ltd company compliance, use:
- **eu-west-2** (London) - Recommended for UK
- **eu-central-1** (Frankfurt) - Alternative for EU

## Quick Deploy Script (ECS Fargate)

Save as `deploy-aws.sh`:

```bash
#!/bin/bash
set -e

REGION="eu-west-2"
ECR_REPO="stock-learning-platform"
IMAGE_TAG="latest"

# Get AWS account ID
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# Build and push
docker build -t $ECR_REPO:$IMAGE_TAG .
aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com
docker tag $ECR_REPO:$IMAGE_TAG $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/$ECR_REPO:$IMAGE_TAG
docker push $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/$ECR_REPO:$IMAGE_TAG

echo "✅ Image pushed to ECR"
echo "Next: Update ECS service to use new image"
```

Make it executable: `chmod +x deploy-aws.sh`

## Troubleshooting

### Container fails to start
- Check CloudWatch logs
- Verify environment variables are set
- Check database connectivity
- Verify PORT is correctly set

### Database connection errors
- Verify DATABASE_URL is correct
- Check security groups allow database access
- Verify database is publicly accessible (or use VPC)

### High memory usage
- Increase container memory allocation
- Check for memory leaks in application
- Monitor with CloudWatch

## Next Steps

1. Set up CI/CD pipeline (GitHub Actions → AWS)
2. Configure auto-scaling
3. Set up monitoring and alerts
4. Configure backup strategy
5. Set up staging environment

## Additional Resources

- [AWS ECS Documentation](https://docs.aws.amazon.com/ecs/)
- [AWS Elastic Beanstalk Documentation](https://docs.aws.amazon.com/elasticbeanstalk/)
- [AWS RDS PostgreSQL Guide](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_PostgreSQL.html)


