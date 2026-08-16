# VPS Bot Hosting Architecture Diagram

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Your Website                             │
│                    (www.example.com)                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────┐         ┌──────────────────────┐      │
│  │   Login/Auth Pages   │         │   Bot Dashboard      │      │
│  │  ✓ Sign Up           │         │  ✓ Create Bots       │      │
│  │  ✓ Google Sign-In    │         │  ✓ View Bots         │      │
│  │  ✓ Sign In           │         │  ✓ Manage Modules    │      │
│  └──────────────────────┘         │  ✓ Delete Bots       │      │
│                                   └──────────────────────┘      │
│                                                                   │
│         ↓ (User creates bot with token)                          │
│                                                                   │
│  ┌────────────────────────────────────────────────────┐         │
│  │      Website Backend (Node.js / Express)          │         │
│  │  • server/index.js                                │         │
│  │  • Auth API endpoints                             │         │
│  │  • Bot storage & management                       │         │
│  │  • VPS communication                              │         │
│  └────────────────────────────────────────────────────┘         │
│                                                                   │
└──────────────────────┬──────────────────────────────────────────┘
                       │
          (HTTP/HTTPS POST Request)
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Your VPS                                │
│                 (IP: 123.45.67.89 or domain)                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌────────────────────────────────────────────────────┐         │
│  │   VPS Bot Worker (Node.js)                        │         │
│  │   • vps-worker-template.js                        │         │
│  │   • Listens on port 5000                          │         │
│  │   • Receives deployment commands                  │         │
│  │   • Manages Discord bot instances                 │         │
│  └────────────────────────────────────────────────────┘         │
│                                                                   │
│         ▼ (Spawns Discord.js client)                            │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  Discord     │  │  Discord     │  │  Discord     │          │
│  │   Bot #1     │  │   Bot #2     │  │   Bot #3     │          │
│  │              │  │              │  │              │          │
│  │ • Token A    │  │ • Token B    │  │ • Token C    │          │
│  │ • Modules    │  │ • Modules    │  │ • Modules    │          │
│  │ • Online!    │  │ • Online!    │  │ • Online!    │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                   │
│         ↓ (Connects to Discord)                                  │
│                                                                   │
└──────────────────────┬──────────────────────────────────────────┘
                       │
        (Discord API - Over Internet)
                       │
                       ▼
            ┌─────────────────────┐
            │   Discord Servers   │
            │  • Bot responds      │
            │  • Processes msgs    │
            │  • Runs 24/7         │
            └─────────────────────┘
```

## Data Flow: Creating a Bot

```
1. USER ACTION
   └─→ User enters Discord bot token
   └─→ User selects modules
   └─→ User clicks "Host Bot"

2. WEBSITE FRONTEND
   └─→ Validates token format
   └─→ Sends to server/index.js

3. WEBSITE BACKEND
   └─→ Verifies user is signed in
   └─→ Checks 3-bot limit
   └─→ Stores bot in local database
   └─→ Calls sendToVPS() function

4. VPS COMMUNICATION
   └─→ Sends HTTP POST to VPS
   └─→ Includes: botId, token, modules
   └─→ Includes auth token for security

5. VPS WORKER
   └─→ Receives command
   └─→ Verifies auth token
   └─→ Creates Discord.js client
   └─→ Logs in with bot token

6. DISCORD
   └─→ Bot connects to Discord API
   └─→ Bot comes online
   └─→ Ready to receive commands

7. USER SEES
   └─→ Bot listed in dashboard
   └─→ Status: "online"
   └─→ Ready to use!
```

## Data Flow: Deleting a Bot

```
1. USER ACTION
   └─→ Clicks delete on a bot

2. WEBSITE FRONTEND
   └─→ Sends delete request

3. WEBSITE BACKEND
   └─→ Removes from database
   └─→ Calls sendToVPS('remove', ...)

4. VPS COMMUNICATION
   └─→ Sends HTTP POST to VPS
   └─→ Includes: botId

5. VPS WORKER
   └─→ Finds the bot instance
   └─→ Calls client.destroy()

6. DISCORD
   └─→ Bot disconnects
   └─→ Bot goes offline

7. USER SEES
   └─→ Bot removed from dashboard
```

## Environment Variables & Communication

```
WEBSITE ←─────────── COMMUNICATION ─────────→ VPS

.env:                   (HTTP/HTTPS)           .env:
VPS_ENABLED=true    ←─────────────────────→  VPS_PORT=5000
VPS_HOST=123.45.67.89  POST /api/bots     VPS_AUTH_TOKEN=...
VPS_PORT=5000          Headers: Authorization
VPS_AUTH_TOKEN=...     Body: { action, data }
VPS_PROTOCOL=http
```

## Security Architecture

```
┌──────────────────────────────────────────────────────────┐
│  Communication Security                                  │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  Website → VPS:                                          │
│  ✓ Auth Token in Authorization header                   │
│  ✓ Auth Token in POST body (redundant)                  │
│  ✓ HTTPS recommended in production                      │
│                                                           │
│  Bot Tokens:                                             │
│  ✓ Never stored on disk on VPS                          │
│  ✓ Only kept in process memory                          │
│  ✓ Purged when bot stops                                │
│  ✓ Not logged or exposed                                │
│                                                           │
│  User Data:                                              │
│  ✓ Stored locally on website                            │
│  ✓ Password never sent to VPS                           │
│  ✓ Only bot data sent to VPS                            │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

## Scale-Up Scenarios

### Single VPS (Current)
```
Website → VPS-1 → Discord Bots
```
Maximum: 3 bots per user across all users

### Multiple VPS (Future)
```
Website → VPS-1 → Discord Bots (Group A)
       ↘ VPS-2 → Discord Bots (Group B)
        ↘ VPS-3 → Discord Bots (Group C)
```
Would require custom routing logic

### Dedicated Bot VPS (Future)
```
Website → Load Balancer → VPS-1 (8 bots)
                       ↘ VPS-2 (8 bots)
                        ↘ VPS-3 (8 bots)
```
Would require significant backend changes

## Status Checks

The website can also check bot status:

```
Website Backend:
└─→ Sends: { action: 'status', data: { botId } }

VPS Worker:
└─→ Returns: { status: 'online', botId: '...', error: null }

Website Frontend:
└─→ Shows user: "Bot is online and running"
```

## Error Handling

```
VPS Connection Fails:
├─→ Bot still created in website database
├─→ VPS deployment error logged
├─→ User notified of error
└─→ User can retry deployment

Bot Crashes on VPS:
├─→ Error caught and logged
├─→ Website can query status
├─→ Shows error to user
└─→ User can restart (redeploy)

Invalid Token:
├─→ Caught before sending to VPS
├─→ Validation regex checked
└─→ Error shown to user immediately
```

---

This architecture keeps your website secure while delegating bot management to your VPS!
