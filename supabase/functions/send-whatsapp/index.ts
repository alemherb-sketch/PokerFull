import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID") || "";
const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN") || "";
const TWILIO_WHATSAPP_NUMBER = Deno.env.get("TWILIO_WHATSAPP_NUMBER") || "whatsapp:+14155238886"; // Default Twilio Sandbox Number

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { phone, imageUrl, message } = await req.json();

    if (!phone || !imageUrl) {
      throw new Error("Phone and imageUrl are required");
    }

    // Prepare Twilio API request
    const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
    const formData = new URLSearchParams();
    
    // Ensure phone is formatted correctly for WhatsApp
    const toPhone = phone.startsWith('whatsapp:') ? phone : `whatsapp:${phone}`;
    
    formData.append('To', toPhone);
    formData.append('From', TWILIO_WHATSAPP_NUMBER);
    formData.append('Body', message || '¡Aquí tienes tus cartas!');
    formData.append('MediaUrl', imageUrl);

    const twilioResponse = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)
      },
      body: formData.toString()
    });

    const result = await twilioResponse.json();

    if (!twilioResponse.ok) {
      throw new Error(result.message || "Twilio API error");
    }

    return new Response(
      JSON.stringify({ success: true, messageId: result.sid }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error("Error sending WhatsApp:", error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});
