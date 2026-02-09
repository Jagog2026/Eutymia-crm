// api/webhook.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Mapa de negocios: Phone Number ID de Meta → portafolio
const PORTFOLIO_MAP = {
  [process.env.WHATSAPP_PHONE_NUMBER_ID]: 'eutymia',
};

export default async function handler(req, res) {
  // ─── GET: Verificación del webhook con Meta ───
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === process.env.META_VERIFY_TOKEN) {
      console.log('[Webhook] Verificación exitosa');
      return res.status(200).send(challenge);
    }
    return res.status(403).send('Token de verificación incorrecto');
  }

  // ─── POST: Recepción de eventos de WhatsApp ───
  if (req.method === 'POST') {
    const body = req.body;

    if (body.object !== 'whatsapp_business_account') {
      return res.status(404).send('Not a WhatsApp event');
    }

    try {
      for (const entry of body.entry || []) {
        for (const change of entry.changes || []) {
          const value = change.value;

          // ─── Status updates (delivered, read, etc.) ───
          if (value?.statuses) {
            for (const status of value.statuses) {
              await supabase
                .from('messages')
                .update({ status: status.status, updated_at: new Date().toISOString() })
                .eq('whatsapp_id', status.id);
            }
          }

          // ─── Incoming messages ───
          if (value?.messages) {
            const phoneNumberId = value.metadata?.phone_number_id;
            const portfolio = PORTFOLIO_MAP[phoneNumberId] || 'general';
            const contactInfo = value.contacts?.[0];

            for (const message of value.messages) {
              const from = message.from;
              const contactName = contactInfo?.profile?.name || 'WhatsApp Lead';

              // 1. Buscar o crear lead
              let { data: lead } = await supabase
                .from('leads')
                .select('id')
                .eq('phone', from)
                .single();

              if (!lead) {
                const { data: newLead } = await supabase
                  .from('leads')
                  .insert([{
                    full_name: contactName,
                    phone: from,
                    source: 'whatsapp',
                    business_portfolio: portfolio,
                    status: 'new',
                  }])
                  .select()
                  .single();
                lead = newLead;
              }

              if (!lead) {
                console.error('[Webhook] No se pudo crear/encontrar lead para:', from);
                continue;
              }

              // 2. Determinar tipo y contenido
              let content = '';
              let mediaUrl = null;
              let mediaType = null;
              let messageType = message.type || 'text';

              switch (message.type) {
                case 'text':
                  content = message.text?.body || '';
                  break;
                case 'image':
                  content = message.image?.caption || '[Imagen]';
                  mediaType = 'image';
                  mediaUrl = message.image?.id;
                  break;
                case 'audio':
                  content = '[Audio]';
                  mediaType = 'audio';
                  mediaUrl = message.audio?.id;
                  break;
                case 'video':
                  content = message.video?.caption || '[Video]';
                  mediaType = 'video';
                  mediaUrl = message.video?.id;
                  break;
                case 'document':
                  content = message.document?.caption || `[Documento: ${message.document?.filename || ''}]`;
                  mediaType = 'document';
                  mediaUrl = message.document?.id;
                  break;
                case 'sticker':
                  content = '[Sticker]';
                  messageType = 'sticker';
                  break;
                case 'location':
                  content = `[Ubicación: ${message.location?.latitude}, ${message.location?.longitude}]`;
                  messageType = 'location';
                  break;
                case 'contacts':
                  content = '[Contacto compartido]';
                  messageType = 'contacts';
                  break;
                case 'reaction':
                  continue; // No guardar reacciones como mensaje
                default:
                  content = `[${message.type || 'Desconocido'}]`;
              }

              // 3. Guardar mensaje
              await supabase.from('messages').insert({
                lead_id: lead.id,
                whatsapp_id: message.id,
                content,
                media_url: mediaUrl,
                media_type: mediaType,
                message_type: messageType,
                direction: 'inbound',
                status: 'received',
                metadata: {
                  from,
                  timestamp: message.timestamp,
                  phone_number_id: phoneNumberId,
                  contact_name: contactName,
                },
              });
            }
          }
        }
      }
    } catch (error) {
      console.error('[Webhook] Error procesando evento:', error);
    }

    return res.status(200).send('EVENT_RECEIVED');
  }

  return res.status(405).send('Method not allowed');
}