# VPS Bot Hosting Setup Guide

This guide explains how to set up actual Discord bot hosting on your VPS using the VoidHaven system.

## Architecture Overview

- **Website Server** (your current setup): Stores user accounts and bot configurations
- **VPS Worker**: Runs Discord.js and actually spawns/manages bot instances
- **Communication**: The website sends deployment commands to the VPS worker via HTTP

```
User Creates Bot → Website API → VPS Worker → Bot Runs on Discord
```

## Prerequisites

1. A VPS with Node.js installed (any Linux hosting works)
2. A static IP or domain name for your VPS
3. The ability to access port 5000 (or your chosen port) on your VPS
4. A secure auth token (random string)

## Step 1: Update Your Website's .env

Add VPS configuration to your `.env` file:

```env
# VPS Bot Hosting Configuration
VPS_ENABLED=true
VPS_HOST=your-vps-ip-or-domain.com
VPS_PORT=5000
VPS_AUTH_TOKEN=super-secret-auth-token-12345
VPS_PROTOCOL=http
```

**Important**: Replace the values:
- `VPS_HOST`: Your VPS's IP address or domain (e.g., `123.45.67.89` or `bots.example.com`)
- `VPS_AUTH_TOKEN`: A secure random string (use something like: `$(openssl rand -base64 32)`)
- `VPS_PORT`: Port to run the worker on (5000 is default, can be any unused port)
- `VPS_PROTOCOL`: Use `https` if your VPS has SSL; otherwise `http`

## Step 2: Set Up Your VPS

### On Your VPS Machine:

1. **SSH into your VPS**
   ```bash
   ssh user@your-vps-ip
   ```

2. **Create a directory for the bot worker**
   ```bash
   mkdir -p ~/voidhaven-bots && cd ~/voidhaven-bots
   ```

3. **Copy the worker template file** (from your website repo)
   ```bash
   # Copy vps-worker-template.js to your VPS, or create it manually
   # You can download the file or copy/paste the contents
   ```

4. **Initialize Node.js and install dependencies**
   ```bash
   npm init -y
   npm install express discord.js dotenv
   ```

5. **Create .env file for the VPS worker**
   ```bash
   cat > .env << EOF
VPS_PORT=5000
VPS_AUTH_TOKEN=super-secret-auth-token-12345
EOF
   ```

   **Important**: Use the SAME `VPS_AUTH_TOKEN` as your website's .env

6. **Start the worker**
   ```bash
   node vps-worker-template.js
   ```

   You should see:
   ```
   VPS Worker running on port 5000
   Auth token: supe...
   Ready to receive bot deployment commands from your website
   ```

## Step 3: Test the Connection

### From your website server, test the VPS connection:

```bash
curl -X POST http://YOUR-VPS-IP:5000/api/bots \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR-AUTH-TOKEN" \
  -d '{"action":"status"}'
```

You should get:
```json
{"bots":[],"count":0}
```

## Step 4: Enable Bot Hosting in Your Website

Restart your website server:

```bash
# Kill the old process
npm stop

# Start fresh
npm start
```

## Step 5: Test Bot Deployment

1. **Sign in** to your website
2. **Go to Bots page**
3. **Enter a Discord Bot Token** (get one from Discord Developer Portal)
4. **Select modules**
5. **Click "Host Bot"**

The bot should:
- Be created in your website's dashboard
- Be deployed to your VPS
- Log in to Discord
- Start running on your VPS!

Check your VPS logs to see:
```
[Deploy] Bot abc-123 deployed successfully
[Bot abc-123] Ready as MyBot#1234
```

## Troubleshooting

### Bot doesn't appear online

Check VPS logs:
```bash
# SSH to VPS and check output
journalctl -u your-service-name  # if using systemd
tail -f ~/voidhaven-bots/nohup.out  # if using nohup
```

### "VPS connection failed" error

- Check if VPS_HOST is correct (use IP, not localhost)
- Check if port 5000 is open on your VPS firewall
- Check if VPS_AUTH_TOKEN matches on both sides

### Bot token is invalid

- Ensure you're using a valid Discord bot token from Developer Portal
- Bot tokens start with `M` or `N` and contain dots

## Running Worker as a Service (Recommended)

Instead of running `node vps-worker-template.js` manually, use PM2 or systemd:

### Using PM2:

```bash
npm install -g pm2

cd ~/voidhaven-bots
pm2 start vps-worker-template.js --name "voidhaven-bots"
pm2 save
pm2 startup

# View logs anytime:
pm2 logs voidhaven-bots
```

### Using Systemd (on Linux):

Create `/etc/systemd/system/voidhaven-bots.service`:

```ini
[Unit]
Description=VoidHaven Bot Worker
After=network.target

[Service]
Type=simple
User=your-username
WorkingDirectory=/home/your-username/voidhaven-bots
ExecStart=/usr/bin/node vps-worker-template.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Then enable and start:
```bash
sudo systemctl enable voidhaven-bots
sudo systemctl start voidhaven-bots
sudo systemctl status voidhaven-bots
```

## Security Notes

1. **Change VPS_AUTH_TOKEN** to something cryptographically random
2. **Use HTTPS** in production (set VPS_PROTOCOL=https and get SSL certificate)
3. **Firewall**: Only allow ports 5000 (or your chosen port) from your website's IP
4. **Never** share your VPS_AUTH_TOKEN publicly
5. **Bot tokens** are stored in memory on the VPS (not on disk for security)

## Environment Variables Summary

### Website .env
```env
VPS_ENABLED=true              # Enable VPS integration
VPS_HOST=your-vps-ip.com      # VPS hostname/IP
VPS_PORT=5000                 # VPS worker port
VPS_AUTH_TOKEN=secret-token   # Shared auth token
VPS_PROTOCOL=http             # http or https
```

### VPS .env
```env
VPS_PORT=5000                 # Port to listen on
VPS_AUTH_TOKEN=secret-token   # Must match website's token
```

## Advanced: Module Implementation

The VPS worker template includes basic ping command. To add module features:

Edit `vps-worker-template.js` in the `messageCreate` event:

```javascript
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  // Moderation module
  if (modules.moderation && message.content.startsWith('!ban')) {
    // Your ban logic here
  }

  // Logging module
  if (modules.logging) {
    // Log message to file/database
  }

  // Add more modules as needed
});
```

## Support

If you encounter issues:

1. Check VPS logs: `tail -f ~/voidhaven-bots/nohup.out`
2. Check website logs: `npm start` output
3. Verify firewall rules with: `sudo ufw status`
4. Test connectivity: `curl http://VPS-IP:5000/api/health`

---

**Once set up, users can:**
- Sign in to your website
- Upload Discord bot tokens
- Select modules they want
- Bot runs automatically on your VPS
- Manage up to 3 bots per account
