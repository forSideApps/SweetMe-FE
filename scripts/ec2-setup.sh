#!/bin/bash
# ============================================================
# One-time EC2 setup for withstudy.kro.kr
#
# Run DIRECTLY ON the EC2 instance (ssh in first):
#   bash ~/withstudy/scripts/ec2-setup.sh <EMAIL>
#
# After this script succeeds, push to GitHub main branch to
# trigger CI/CD — that will write secrets, pull images, and
# start all containers automatically.
#
# GitHub Secrets to add (Settings → Secrets → Actions):
#
#   EC2_HOST       ec2-13-124-149-214.ap-northeast-2.compute.amazonaws.com
#   EC2_USER       ubuntu
#   EC2_PASSWORD   <EC2 password>
#   DB_USERNAME    <Oracle DB username>
#   DB_PASSWORD    <Oracle DB password>
#   WALLET_BASE64  run on LOCAL: cd backend && tar czf - wallet | base64
#   OCI_BASE64     run on LOCAL: tar czf - -C ~/.oci . | base64
# ============================================================
set -e

EMAIL=${1:?"Usage: $0 <EMAIL>  e.g.  $0 admin@example.com"}
APP_DIR=/home/ubuntu/withstudy
DOMAIN=withstudy.kro.kr

echo "[1/4] Installing Docker..."
sudo apt-get update -q
sudo apt-get install -y -q docker.io docker-compose-plugin
sudo systemctl enable docker
sudo systemctl start docker
sudo usermod -aG docker ubuntu

echo "[2/4] Cloning repository..."
if [ ! -d "$APP_DIR/.git" ]; then
  git clone https://github.com/forSideApps/Interview.git "$APP_DIR"
else
  echo "  repo already exists, pulling latest"
  git -C "$APP_DIR" pull origin main
fi

echo "[3/4] Creating required directories..."
mkdir -p "$APP_DIR/certbot/conf"
mkdir -p "$APP_DIR/certbot/www"
mkdir -p "$APP_DIR/backend/wallet"
mkdir -p "$APP_DIR/oci"

echo "[4/4] Obtaining SSL certificate via certbot standalone..."
# Port 80 must be free. Nothing is running yet, so this is safe.
docker run --rm \
  -p 80:80 \
  -v "$APP_DIR/certbot/conf:/etc/letsencrypt" \
  certbot/certbot certonly \
  --standalone \
  --non-interactive \
  --agree-tos \
  --email "$EMAIL" \
  -d "$DOMAIN"

echo ""
echo "======================================================"
echo "  SSL certificate obtained successfully."
echo ""
echo "  Next step: push to GitHub main branch."
echo "  CI/CD will deploy the app automatically."
echo "  URL: https://$DOMAIN"
echo "======================================================"
