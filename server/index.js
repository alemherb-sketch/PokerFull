const express = require('express');
const cors = require('cors');
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

// Initialize WhatsApp Client
const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
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
  // Re-initialize the client to get a new QR code
  client.initialize();
});

client.on('auth_failure', msg => {
  console.error('WhatsApp Bot authentication failure:', msg);
  botStatus = 'DISCONNECTED';
  currentQR = null;
});

// Start the client
client.initialize();

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
