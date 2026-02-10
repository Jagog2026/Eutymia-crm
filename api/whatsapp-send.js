// api/whatsapp-send.js
// Endpoint para enviar mensajes vía WhatsApp Business API
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://kpsoolwetgrdyglyxmhc.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtwc29vbHdldGdyZHlnbHl4bWhjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3ODQ1MzksImV4cCI6MjA4MzM2MDUzOX0.ia8Dnw6r3lZ7-ProijkkzJUrTyEjSGgNJtUOWpUpalM';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const WHATSAPP_API_URL = 'https://graph.facebook.com/v21.0';
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { to, message, leadId, type = 'text' } = req.body;

    if (!to || !message) {
      return res.status(400).json({ error: 'Se requiere "to" y "message"' });
    }

    if (!PHONE_NUMBER_ID || !ACCESS_TOKEN) {
      console.error('[WhatsApp Send] Faltan variables: PHONE_NUMBER_ID=', !!PHONE_NUMBER_ID, 'ACCESS_TOKEN=', !!ACCESS_TOKEN);
      return res.status(500).json({ error: 'WhatsApp API no configurada. Verifica las variables de entorno.' });
    }

    // Formatear número (quitar + si existe, asegurar código de país)
    const formattedPhone = to.replace(/[^0-9]/g, '');

    // Construir payload según tipo
    let messagePayload;

    if (type === 'text') {
      messagePayload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: formattedPhone,
        type: 'text',
        text: { body: message },
      };
    } else if (type === 'template') {
      messagePayload = {
        messaging_product: 'whatsapp',
        to: formattedPhone,
        type: 'template',
        template: {
          name: message, // nombre del template
          language: { code: 'es' },
        },
      };
    }

    // Enviar a WhatsApp API
    const response = await fetch(
      `${WHATSAPP_API_URL}/${PHONE_NUMBER_ID}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messagePayload),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('[WhatsApp Send] Error de API:', data);
      return res.status(response.status).json({
        error: 'Error enviando mensaje',
        details: data.error?.message || data,
      });
    }

    const whatsappMessageId = data.messages?.[0]?.id;

    // Guardar mensaje en BD
    if (leadId) {
      await supabase.from('messages').insert({
        lead_id: leadId,
        whatsapp_id: whatsappMessageId,
        content: type === 'template' ? `[Template: ${message}]` : message,
        direction: 'outbound',
        status: 'sent',
        message_type: type,
        metadata: {
          to: formattedPhone,
          whatsapp_response: data,
        },
      });
    }

    return res.status(200).json({
      success: true,
      messageId: whatsappMessageId,
    });
  } catch (error) {
    console.error('[WhatsApp Send] Error:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}
