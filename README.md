# Discord iPhone Multi-Runtime Host (safe starter)

Mobile-friendly dashboard to upload and manage `.py` and `.js` files from an iPhone browser.

## What it does
- Password-protected panel API
- Uploads `.py` / `.js` files up to a configurable size limit (default 2 MB)
- Lists and deletes stored files
- Includes an optional starter Discord bot file with a basic welcome event

## Important security boundary
**Uploaded files are stored only and are never executed by this panel.** Arbitrary uploaded code can steal tokens, read files, mine cryptocurrency, attack other systems, or consume all resources. Do not add a button that executes arbitrary uploads inside the web server or Discord bot process.

For execution, build a separate worker service that runs each approved job in an isolated container/VM with CPU, memory, time, filesystem, and network limits; do not mount secrets into the worker. Many free hosting plans do not support safe privileged container execution or always-on workers. Start with an allowlist of reviewed scripts/commands.

## Run / deploy
1. Use Node.js 20+ and run `npm install`.
2. Copy `.env.example` to `.env`.
3. Set a long random `PANEL_PASSWORD`; keep `.env` private.
4. Optionally configure `DISCORD_TOKEN` for the sample bot.
5. Run `npm start`, then open the hosted URL on your iPhone.
6. In production, use HTTPS, a trusted hosting provider, rate limiting, persistent storage, and a private admin route.

The web panel and the Discord bot process are separate. This starter does not automatically launch `bot.js`; configure the bot as a separate worker using your hosting provider's supported process type.
