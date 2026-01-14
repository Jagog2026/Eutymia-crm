// api/webhook.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// 🗺️ MAPA DE NEGOCIOS: Asocia el ID del teléfono con el Portafolio
// Estos IDs los sacarás de Meta en el siguiente paso.
const PORTFOLIO_MAP = {
  'ID_DEL_TELEFONO_DE_EUTYMIA': 'eutymia',           
  'ID_DEL_TELEFONO_DE_ESPACIO': 'espacio_equilibrio' 
};

export default async function handler(req, res) {
  // 1. Verificación (Solo para conectar con Meta la primera vez)
  if (req.method === 'GET') {
    if (req.query['hub.mode'] === 'subscribe' && req.query['hub.verify_token'] === process.env.META_VERIFY_TOKEN) {
      return res.status(200).send(req.query['hub.challenge']);
    }
    return res.status(403).send('Token error');
  }

  // 2. Recepción de Mensajes
  if (req.method === 'POST') {
    const body = req.body;
    
    if (body.object === 'whatsapp_business_account') {
      try {
        const value = body.entry?.[0]?.changes?.[0]?.value;
        const message = value?.messages?.[0];
        
        // 🕵️ DETECTIVE: ¿A qué número le escribieron?
        const targetPhoneId = value?.metadata?.phone_number_id; 
        const portfolio = PORTFOLIO_MAP[targetPhoneId] || 'general';

        if (message) {
          const from = message.from; 
          
          // A. Buscar lead existente
          let { data: lead } = await supabase
            .from('leads')
            .select('id')
            .eq('phone', from)
            .single();

          // B. Si es nuevo, crearlo ETIQUETADO con el portafolio correcto
          if (!lead) {
            const { data: newLead } = await supabase
              .from('leads')
              .insert([{ 
                full_name: 'WhatsApp Lead', 
                phone: from,
                source: 'whatsapp',
                business_portfolio: portfolio, // <--- Aquí separamos los negocios
                status: 'new'
              }])
              .select()
              .single();
            lead = newLead;
          }

          // C. Guardar mensaje
          await supabase.from('messages').insert({
            lead_id: lead.id,
            whatsapp_id: message.id,
            content: message.text?.body,
            direction: 'inbound',
            status: 'received'
          });
        }
      } catch (e) { console.error(e); }
    }
    return res.status(200).send('EVENT_RECEIVED');
  }
}