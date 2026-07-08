const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode');

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Bot State
let botStatus = 'DISCONNECTED'; // DISCONNECTED, QR_READY, CONNECTED
let currentQR = null;
let client = null;

// '--single-process' and '--no-zygote' were removed: on low-memory hosts (Render Starter, 512MB)
// they collapse Chromium into one OS process, so any renderer hiccup while rendering the heavy
// WhatsApp Web SPA kills the whole browser instantly instead of just the tab.
const PUPPETEER_ARGS = [
  '--no-sandbox',
  '--disable-setuid-sandbox',
  '--disable-dev-shm-usage',
  '--disable-accelerated-2d-canvas',
  '--disable-gpu',
  '--no-first-run',
  '--no-default-browser-check',
  '--disable-extensions',
  '--disable-background-networking',
  '--disable-default-apps',
  '--disable-sync',
  '--disable-translate',
  '--disable-features=TranslateUI',
  '--disable-hang-monitor',
  '--disable-prompt-on-repost',
  '--disable-client-side-phishing-detection',
  '--disable-backgrounding-occluded-windows',
  '--disable-renderer-backgrounding',
  '--mute-audio',
  '--metrics-recording-only'
];

// If the previous Chromium process was killed abruptly (crash/OOM/container restart) it can
// leave a stale SingletonLock behind on the persistent disk. Chromium then refuses to launch,
// thinking another process still owns the profile, so the client never gets past this point
// to emit a QR code. Clear these lock files before every launch attempt.
function clearStaleSingletonLocks() {
  const dataPath = path.resolve('./.wwebjs_auth/');
  const sessionDir = path.join(dataPath, 'session');
  for (const lockFile of ['SingletonLock', 'SingletonCookie', 'SingletonSocket']) {
    const lockPath = path.join(sessionDir, lockFile);
    try {
      fs.unlinkSync(lockPath);
      console.log(`Removed stale lock file: ${lockPath}`);
    } catch (err) {
      if (err.code !== 'ENOENT') {
        console.error(`Could not remove lock file ${lockPath}:`, err.message);
      }
    }
  }
}

// Build a brand-new Client each time we (re)connect. Reusing the same instance after a
// 'disconnected' event is unreliable in whatsapp-web.js because the underlying Puppeteer
// browser is often already dead/corrupted at that point.
function createClient() {
  clearStaleSingletonLocks();

  client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
      args: PUPPETEER_ARGS
    }
  });

  client.on('qr', (qr) => {
    console.log('QR Code received, waiting for scan...');
    currentQR = qr;
    botStatus = 'QR_READY';
  });

  client.on('ready', () => {
    console.log('WhatsApp Bot is ready and connected!');
    currentQR = null;
    botStatus = 'CONNECTED';
  });

  client.on('disconnected', (reason) => {
    console.log('WhatsApp Bot was disconnected:', reason);
    botStatus = 'DISCONNECTED';
    currentQR = null;
    const deadClient = client;
    client = null;
    deadClient.destroy().catch(err => console.error('Error destroying old client:', err.message));
    setTimeout(createClient, 5000);
  });

  client.on('auth_failure', msg => {
    console.error('WhatsApp Bot authentication failure:', msg);
    botStatus = 'DISCONNECTED';
    currentQR = null;
  });

  client.initialize().catch(err => {
    console.error('Error initializing WhatsApp client:', err.message);
    botStatus = 'DISCONNECTED';
    setTimeout(createClient, 5000);
  });
}

process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection:', err);
});

// Start the client
// createClient();
console.log('WhatsApp Bot initialization is DISABLED to prevent account blocks.');

// API Routes

// 1. Get Bot Status & QR
app.get('/api/status', async (req, res) => {
  let qrBase64 = null;
  if (currentQR) {
    try {
      qrBase64 = await qrcode.toDataURL(currentQR);
    } catch (err) {
      console.error('Error generating QR:', err);
    }
  }
  
  res.json({
    status: botStatus,
    qr: qrBase64
  });
});

// 2. Send Message with Photo
app.post('/api/send', async (req, res) => {
  if (botStatus !== 'CONNECTED') {
    return res.status(400).json({ success: false, error: 'WhatsApp Bot is not connected' });
  }

  const { phone, message, imageUrl } = req.body;
  if (!phone || !message || !imageUrl) {
    return res.status(400).json({ success: false, error: 'Missing phone, message or imageUrl' });
  }

  try {
    // Ensure phone number format for WA (must end with @c.us)
    const formattedPhone = phone.includes('@c.us') ? phone : `${phone}@c.us`;
    
    // Fetch image as MessageMedia
    const media = await MessageMedia.fromUrl(imageUrl);
    
    // Send message
    await client.sendMessage(formattedPhone, media, { caption: message });
    
    console.log(`Message sent successfully to ${phone}`);
    res.json({ success: true });
  } catch (err) {
    console.error('Error sending message:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(port, () => {
  console.log(`WhatsApp Bot API listening on port ${port}`);
});
