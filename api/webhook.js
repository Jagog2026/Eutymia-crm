// api/webhook.js
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://kpsoolwetgrdyglyxmhc.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtwc29vbHdldGdyZHlnbHl4bWhjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3ODQ1MzksImV4cCI6MjA4MzM2MDUzOX0.ia8Dnw6r3lZ7-ProijkkzJUrTyEjSGgNJtUOWpUpalM';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default async function handler(req, res) {
  // ─── GET: Verificación del webhook ───
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === process.env.META_VERIFY_TOKEN) {
      console.log('[Webhook] Verificación exitosa');
      return res.status(200).send(challenge);
    }
    return res.status(403).send('Token incorrecto');
  }

  // ─── POST: Eventos de WhatsApp ───
  if (req.method === 'POST') {
    const body = req.body;
    console.log('[Webhook] POST recibido:', JSON.stringify(body).slice(0, 500));

    if (body.object !== 'whatsapp_business_account') {
      return res.status(200).send('OK');
    }

    try {
      for (const entry of body.entry || []) {
        for (const change of entry.changes || []) {
          const value = change.value;

          // ─── Status updates ───
          if (value?.statuses) {
            for (const status of value.statuses) {
              const { error } = await supabase
                .from('messages')
                .update({ status: status.status, updated_at: new Date().toISOString() })
                .eq('whatsapp_id', status.id);
              if (error) console.error('[Webhook] Error actualizando status:', error.message);
            }
          }

          // ─── Mensajes entrantes ───
          if (value?.messages) {
            const contactInfo = value.contacts?.[0];

            for (const message of value.messages) {
              const from = message.from;
              const contactName = contactInfo?.profile?.name || 'WhatsApp Lead';
              const last10 = from.slice(-10);

              console.log('[Webhook] Mensaje de:', from, '- Nombre:', contactName, '- Últimos 10:', last10);

              // ── PASO 1: Buscar lead existente ──
              // Primero buscar todos los leads con teléfono para comparar
              const { data: allLeads, error: searchError } = await supabase
                .from('leads')
                .select('id, phone, full_name')
                .not('phone', 'is', null);

              if (searchError) {
                console.error('[Webhook] Error buscando leads:', searchError.message);
              }

              let lead = null;

              if (allLeads && allLeads.length > 0) {
                console.log('[Webhook] Total leads con teléfono:', allLeads.length);
                
                // Buscar coincidencia por últimos 10 dígitos
                lead = allLeads.find(l => {
                  if (!l.phone) return false;
                  const cleanPhone = l.phone.replace(/[^0-9]/g, '');
                  const cleanFrom = from.replace(/[^0-9]/g, '');
                  return cleanPhone.slice(-10) === cleanFrom.slice(-10);
                });

                if (lead) {
                  console.log('[Webhook] Lead encontrado:', lead.id, '- Tel DB:', lead.phone, '- Tel WA:', from);
                } else {
                  console.log('[Webhook] No se encontró match. Teléfonos en DB:', allLeads.map(l => l.phone).join(', '));
                }
              }

              // ── PASO 2: Crear lead si no existe ──
              if (!lead) {
                console.log('[Webhook] Creando lead nuevo...');
                const { data: newLead, error: createError } = await supabase
                  .from('leads')
                  .insert({
                    full_name: contactName || 'WhatsApp Lead',
                    phone: from,
                    source: 'whatsapp',
                    status: 'new',
                  })
                  .select('id, phone')
                  .single();

                if (createError) {
                  console.error('[Webhook] ERROR creando lead:', JSON.stringify(createError));
                  continue;
                }
                lead = newLead;
                console.log('[Webhook] Lead creado:', lead.id);
              }

              // ── PASO 3: Determinar contenido ──
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
                  break;
                case 'video':
                  content = message.video?.caption || '[Video]';
                  mediaType = 'video';
                  break;
                case 'document':
                  content = message.document?.caption || '[Documento]';
                  mediaType = 'document';
                  break;
                case 'sticker':
                  content = '[Sticker]';
                  break;
                case 'location':
                  content = `[Ubicación: ${message.location?.latitude}, ${message.location?.longitude}]`;
                  break;
                case 'contacts':
                  content = '[Contacto compartido]';
                  break;
                case 'reaction':
                  continue;
                default:
                  content = `[${message.type || 'Mensaje'}]`;
              }

              // ── PASO 4: Guardar mensaje ──
              const { error: msgError } = await supabase.from('messages').insert({
                lead_id: lead.id,
                whatsapp_id: message.id,
                content,
                media_url: mediaUrl,
                media_type: mediaType,
                message_type: messageType,
                direction: 'inbound',
                status: 'received',
                metadata: { from, contact_name: contactName },
              });

              if (msgError) {
                console.error('[Webhook] ERROR guardando mensaje:', JSON.stringify(msgError));
              } else {
                console.log('[Webhook] ✅ Mensaje guardado para lead:', lead.id, '- Contenido:', content.slice(0, 50));
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('[Webhook] Error general:', error.message, error.stack);
    }

    return res.status(200).send('EVENT_RECEIVED');
  }

  return res.status(405).send('Method not allowed');
}