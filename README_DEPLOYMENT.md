# Fastest external deployment setup

This project now includes a minimal GitHub + VPS deployment path for hosted bots.

## 1) Put your bot code in GitHub
Create a repo and store your Discord bot runtime code there.

## 2) Set up a cheap VPS
Examples:
- Hetzner
- DigitalOcean
- Linode
- Railway (managed, simpler but slightly pricier)

## 3) Install the worker on the VPS
On the VPS:

```bash
mkdir -p /var/www/voidhaven-vps-worker
cd /var/www/voidhaven-vps-worker
npm install
cp .env.example .env
```

Set the values in .env:

```env
VPS_PORT=5000
VPS_AUTH_TOKEN=your-shared-secret
```

Then start:

```bash
npm start
```

## 4) Connect the website to the VPS
In the main app .env:

```env
VPS_ENABLED=true
VPS_HOST=your-vps-domain-or-ip
VPS_PORT=5000
VPS_AUTH_TOKEN=your-shared-secret
VPS_PROTOCOL=http
```

## 5) Auto-deploy from GitHub
This repo includes a GitHub Actions workflow at:

- .github/workflows/deploy-bot.yml

Add these GitHub secrets:

- VPS_SSH_PRIVATE_KEY
- VPS_HOST
- VPS_USER
- VPS_PATH

## 6) Use the bot dashboard
From the website, create a bot and add the GitHub repo URL. The app will record the repo and prepare the bot for external deployment.

This is the practical fast path without building a full custom infrastructure platform.
