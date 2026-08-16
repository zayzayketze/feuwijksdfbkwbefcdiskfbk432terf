# VoidHaven Bot Hosting - VPS Integration Guide

You now have a complete bot hosting system that can deploy Discord bots to your VPS!

## 📋 Files Overview

| File | Purpose |
|------|---------|
| `.env.example` | Template for website configuration (includes VPS settings) |
| `.env.vps.example` | Template for VPS worker configuration |
| `VPS_SETUP.md` | Detailed step-by-step setup guide |
| `VPS_QUICK_START.md` | Quick reference for getting started |
| `vps-worker-template.js` | The bot worker that runs on your VPS |
| `server/index.js` | Website backend (now includes VPS deployment) |

## 🚀 Quick Start (5 minutes)

### On Your Website Server

1. **Update `.env`** with VPS details:
```env
VPS_ENABLED=true
VPS_HOST=your-vps-ip-or-domain.com
VPS_PORT=5000
VPS_AUTH_TOKEN=generate-a-random-token-here
VPS_PROTOCOL=http
```

2. **Restart website**:
```bash
npm start
```

### On Your VPS

1. **Create directory and install**:
```bash
mkdir ~/voidhaven-bots && cd ~/voidhaven-bots
npm init -y
npm install express discord.js dotenv
```

2. **Copy `vps-worker-template.js`** to your VPS and create `.env`:
```env
VPS_PORT=5000
VPS_AUTH_TOKEN=same-token-as-website
```

3. **Start worker**:
```bash
node vps-worker-template.js
```

✅ Done! Users can now deploy bots through your website and they'll run on your VPS.

---

## 🔧 Configuration

### Website .env Settings

```env
# Enable VPS bot hosting (default: false)
VPS_ENABLED=true

# Your VPS's IP address or domain
# Examples: 192.168.1.100, bots.example.com, vps.hosting.com
VPS_HOST=your-vps-ip-or-domain.com

# Port where VPS worker listens (must be open in firewall)
VPS_PORT=5000

# Shared authentication token (random secure string)
# Generate with: openssl rand -base64 32
VPS_AUTH_TOKEN=your-secure-random-token

# Use http or https (https requires SSL certificate on VPS)
VPS_PROTOCOL=http
```

### VPS .env Settings

```env
# Port to listen on
VPS_PORT=5000

# MUST match website's VPS_AUTH_TOKEN
VPS_AUTH_TOKEN=your-secure-random-token
```

---

## 🔄 How It Works

```
1. User signs in to your website
   ↓
2. User enters Discord bot token and selects modules
   ↓
3. Website stores bot configuration locally
   ↓
4. Website sends deployment command to VPS
   ↓
5. VPS worker receives the command
   ↓
6. VPS worker spawns the Discord bot
   ↓
7. Bot logs into Discord and starts responding to commands
```

---

## 📋 Deployment Flow

### Create Bot
- User provides bot token and modules
- Website validates token format
- Website stores bot in local database
- Website sends to VPS: `{ action: 'deploy', data: { botId, token, modules } }`
- VPS spawns Discord bot instance
- Bot appears in user's dashboard

### Delete Bot
- User clicks delete
- Website removes from database
- Website sends to VPS: `{ action: 'remove', data: { botId } }`
- VPS stops the Discord bot
- Bot connection closes

### Check Status
- Website sends: `{ action: 'status', data: { botId } }`
- VPS returns: `{ status: 'online', botId: '...', ... }`
- Website shows live status to user

---

## 🧪 Testing Locally First

To test the entire system on your local machine before deploying to a VPS:

```env
# In your .env
VPS_ENABLED=true
VPS_HOST=127.0.0.1
VPS_PORT=5000
VPS_AUTH_TOKEN=test-token-123
VPS_PROTOCOL=http
```

Then run both servers:

```bash
# Terminal 1: Website server
npm start

# Terminal 2: VPS worker (in a different directory)
node vps-worker-template.js
```

Now create bots through the website and see them run locally!

---

## 🔐 Security Best Practices

1. **Generate a strong auth token**:
   ```bash
   openssl rand -base64 32
   ```

2. **Use HTTPS in production**:
   - Set `VPS_PROTOCOL=https`
   - Get SSL certificate for your domain

3. **Firewall VPS port**:
   ```bash
   # Only allow website server to connect to port 5000
   sudo ufw allow from WEBSITE-SERVER-IP to any port 5000
   ```

4. **Never share VPS_AUTH_TOKEN** publicly

5. **Bot tokens are kept in memory** on the VPS (safer than disk storage)

---

## 🛠️ Module Support

The VPS worker template includes basic functionality. To add module-specific features, edit `vps-worker-template.js`:

```javascript
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  // Add your module logic
  if (modules.moderation) {
    // Handle moderation commands
  }

  if (modules.logging) {
    // Log messages
  }

  // etc.
});
```

Available modules:
- moderation, antiSpam, antiRaid, admin, logging, automod, ticketing
- welcome, farewell, verification, announcements, reactionRoles
- roleManagement, levelSystem, economy, music, utility, social
- fun, games, ai, stats, reminders, customCommands, webhooks
- invites, voice, scheduler, polls, suggestions, serverInsights
- status, backup, automations, slashCommands, messageCommands, moderationPanel

---

## 📞 Support & Troubleshooting

### Bot doesn't appear online
- Check VPS logs: `node vps-worker-template.js` console output
- Ensure VPS_AUTH_TOKEN matches on both sides
- Verify bot token is valid (starts with M or N)

### Connection refused error
- Check VPS_HOST is correct (not localhost if testing remotely)
- Check port 5000 is open: `sudo ufw status`
- Check firewall on your hosting provider

### "Invalid bot token" error
- Ensure token is from Discord Developer Portal
- Check token wasn't corrupted when copying
- Tokens: `Prefix (M/N) . (6-7 chars) . (27 chars)`

### VPS worker won't start
- Check Node.js is installed: `node --version`
- Check dependencies: `npm list`
- Check port 5000 is not in use: `lsof -i :5000`

---

## 🚀 Running as a Background Service

### Using PM2 (Recommended)

```bash
npm install -g pm2
cd ~/voidhaven-bots
pm2 start vps-worker-template.js --name "voidhaven-bots"
pm2 save
pm2 startup

# View logs anytime:
pm2 logs voidhaven-bots
```

### Using Systemd

See `VPS_SETUP.md` for detailed systemd service setup instructions.

---

## 📝 .env.example Reference

Your website's `.env` should have (alongside existing settings):

```env
PORT=3000
SESSION_SECRET=your-session-secret
GOOGLE_CLIENT_ID=your-google-id
GOOGLE_CLIENT_SECRET=your-google-secret
FRONTEND_URL=http://localhost:3000
BASE_URL=http://localhost:3000

# VPS Configuration (NEW)
VPS_ENABLED=true
VPS_HOST=your-vps-ip-or-domain.com
VPS_PORT=5000
VPS_AUTH_TOKEN=your-secure-token
VPS_PROTOCOL=http
```

---

## 🎯 Next Steps

1. ✅ Review this guide
2. ✅ Read `VPS_SETUP.md` for detailed instructions
3. ✅ Generate VPS_AUTH_TOKEN: `openssl rand -base64 32`
4. ✅ Update `.env` with your VPS details
5. ✅ Copy `vps-worker-template.js` to your VPS
6. ✅ Create `.env.vps.example` as `.env` on VPS
7. ✅ Run VPS worker: `node vps-worker-template.js`
8. ✅ Restart website: `npm start`
9. ✅ Test: Create a bot through the website!

---

**Your bot hosting system is now production-ready!** 🎉
