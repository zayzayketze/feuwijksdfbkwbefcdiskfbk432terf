# Quick VPS Bot Hosting Setup

## Option 1: Disabled (Default - Local Testing Only)

If you want to test the website locally without a VPS, do nothing. VPS is disabled by default.

```env
VPS_ENABLED=false
```

Bots will be created in the dashboard but won't actually run anywhere.

---

## Option 2: Enable VPS Bot Hosting

Follow these steps to enable actual bot hosting on your VPS:

### Website Server (.env)

```env
VPS_ENABLED=true
VPS_HOST=your-vps-ip-or-domain.com
VPS_PORT=5000
VPS_AUTH_TOKEN=your-secure-random-token-here
VPS_PROTOCOL=http
```

### VPS Machine

1. Copy `vps-worker-template.js` to your VPS
2. Run: `npm install express discord.js dotenv`
3. Create `.env` with:
   ```env
   VPS_PORT=5000
   VPS_AUTH_TOKEN=your-secure-random-token-here
   ```
4. Run: `node vps-worker-template.js`

That's it! Your bots will now run on your VPS.

---

## Quick Reference

| Setting | Description | Example |
|---------|-------------|---------|
| `VPS_ENABLED` | Enable/disable VPS integration | `true` or `false` |
| `VPS_HOST` | Your VPS's IP or domain | `123.45.67.89` or `bots.example.com` |
| `VPS_PORT` | Port the worker listens on | `5000` |
| `VPS_AUTH_TOKEN` | Shared secret between website and VPS | `abc123xyz...` |
| `VPS_PROTOCOL` | HTTP or HTTPS | `http` or `https` |

---

## Detailed Setup

See `VPS_SETUP.md` for complete setup instructions including:
- How to SSH to your VPS
- How to install Node.js dependencies
- How to run the worker as a background service
- Troubleshooting guide
- Security best practices

---

## Testing Without a VPS

To test the entire bot hosting system locally (both website and worker on same machine):

```env
# Website .env
VPS_ENABLED=true
VPS_HOST=127.0.0.1
VPS_PORT=5000
VPS_AUTH_TOKEN=test-token-123
VPS_PROTOCOL=http
```

Then run both servers:

```bash
# Terminal 1: Website
npm start

# Terminal 2: VPS Worker
node vps-worker-template.js
```

Now you can create bots locally and see them run!
