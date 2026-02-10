import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import {
  Search,
  Send,
  Phone,
  MoreVertical,
  ArrowLeft,
  MessageCircle,
  Clock,
  Check,
  CheckCheck,
  User,
  Smile,
  Paperclip,
  X,
  RefreshCw,
  Plus,
} from 'lucide-react';

export default function WhatsAppInbox() {
  // ─── State ───
  const [conversations, setConversations] = useState([]);
  const [selectedLead, setSelectedLead] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const [newChatPhone, setNewChatPhone] = useState('');
  const [newChatName, setNewChatName] = useState('');
  const [statusMsg, setStatusMsg] = useState(null);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // ─── Cargar conversaciones ───
  const loadConversations = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('id, full_name, phone, source, last_message_at, unread_count')
        .not('phone', 'is', null)
        .order('last_message_at', { ascending: false, nullsFirst: true });

      if (error) throw error;
      setConversations(data || []);
    } catch (err) {
      console.error('Error cargando conversaciones:', err);
      setStatusMsg({ type: 'error', text: 'Error cargando conversaciones: ' + err.message });
    } finally {
      setLoading(false);
    }
  }, []);

  // ─── Cargar mensajes de un lead ───
  const loadMessages = useCallback(async (leadId) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);

      // Marcar como leídos
      await supabase
        .from('leads')
        .update({ unread_count: 0 })
        .eq('id', leadId);

      // Actualizar conteo local
      setConversations((prev) =>
        prev.map((c) => (c.id === leadId ? { ...c, unread_count: 0 } : c))
      );
    } catch (err) {
      console.error('Error cargando mensajes:', err);
    }
  }, []);

  // ─── Enviar mensaje ───
  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedLead || sending) return;

    const messageText = newMessage.trim();
    setNewMessage('');
    setSending(true);
    setStatusMsg(null);

    try {
      const res = await fetch('/api/whatsapp-send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: selectedLead.phone,
          message: messageText,
          leadId: selectedLead.id,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || data.details || 'Error enviando mensaje');
      }

      setStatusMsg({ type: 'success', text: 'Mensaje enviado ✓' });
      setTimeout(() => setStatusMsg(null), 3000);

      // Recargar mensajes
      await loadMessages(selectedLead.id);
      await loadConversations();
    } catch (err) {
      console.error('Error enviando:', err);
      setNewMessage(messageText);
      setStatusMsg({ type: 'error', text: 'Error: ' + err.message });
    } finally {
      setSending(false);
    }
  };

  // ─── Iniciar nueva conversación ───
  const startNewChat = async () => {
    if (!newChatPhone.trim()) return;

    const phone = newChatPhone.replace(/[^0-9]/g, '');
    if (phone.length < 10) {
      setStatusMsg({ type: 'error', text: 'Número inválido. Incluye código de país (ej: 521XXXXXXXXXX)' });
      return;
    }

    // Buscar si ya existe un lead con ese teléfono
    let { data: existingLead } = await supabase
      .from('leads')
      .select('id, full_name, phone')
      .or(`phone.eq.${phone},phone.eq.+${phone}`)
      .single();

    if (!existingLead) {
      // Crear nuevo lead
      const { data: newLead, error } = await supabase
        .from('leads')
        .insert([{
          full_name: newChatName.trim() || 'Contacto WhatsApp',
          phone: phone,
          source: 'whatsapp',
          status: 'new',
        }])
        .select()
        .single();

      if (error) {
        setStatusMsg({ type: 'error', text: 'Error creando contacto: ' + error.message });
        return;
      }
      existingLead = newLead;
    }

    setShowNewChat(false);
    setNewChatPhone('');
    setNewChatName('');
    await loadConversations();
    selectConversation(existingLead);
  };

  // ─── Seleccionar conversación ───
  const selectConversation = (lead) => {
    setSelectedLead(lead);
    loadMessages(lead.id);
    setIsMobileView(true);
  };

  // ─── Volver a la lista (mobile) ───
  const backToList = () => {
    setIsMobileView(false);
    setSelectedLead(null);
  };

  // ─── Efectos ───
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Scroll al final cuando cambian los mensajes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus en input cuando se selecciona conversación
  useEffect(() => {
    if (selectedLead) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [selectedLead]);

  // ─── Realtime: escuchar nuevos mensajes ───
  useEffect(() => {
    const channel = supabase
      .channel('messages-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const msg = payload.new;

          // Si es de la conversación activa, agregarlo
          if (selectedLead && msg.lead_id === selectedLead.id) {
            setMessages((prev) => [...prev, msg]);
            // Marcar como leído
            supabase
              .from('leads')
              .update({ unread_count: 0 })
              .eq('id', selectedLead.id);
          }

          // Actualizar lista de conversaciones
          loadConversations();
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'messages' },
        (payload) => {
          // Actualizar status de mensaje
          setMessages((prev) =>
            prev.map((m) =>
              m.id === payload.new.id ? { ...m, status: payload.new.status } : m
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedLead, loadConversations]);

  // ─── Filtro de búsqueda ───
  const filteredConversations = conversations.filter((c) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.full_name?.toLowerCase().includes(q) ||
      c.phone?.includes(q)
    );
  });

  // ─── Helpers de render ───
  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();

    if (isToday) {
      return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    }

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) {
      return 'Ayer';
    }

    return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'sent':
        return <Check size={14} className="text-gray-400" />;
      case 'delivered':
        return <CheckCheck size={14} className="text-gray-400" />;
      case 'read':
        return <CheckCheck size={14} className="text-blue-500" />;
      case 'failed':
        return <X size={14} className="text-red-500" />;
      default:
        return <Clock size={14} className="text-gray-300" />;
    }
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  // ─── Render ───
  return (
    <div className="flex h-full bg-gray-100 rounded-2xl overflow-hidden border border-slate-200 shadow-xl">
      {/* ═══ Lista de conversaciones ═══ */}
      <div
        className={`w-full md:w-96 bg-white border-r flex flex-col ${
          isMobileView && selectedLead ? 'hidden md:flex' : 'flex'
        }`}
      >
        {/* Header */}
        <div className="p-4 bg-slate-50 border-b">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <MessageCircle size={22} className="text-green-600" />
              WhatsApp
            </h2>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowNewChat(true)}
                className="p-2 rounded-full hover:bg-green-100 text-green-600"
                title="Nuevo mensaje"
              >
                <Plus size={18} />
              </button>
              <button
                onClick={loadConversations}
                className="p-2 rounded-full hover:bg-slate-200 text-slate-600"
                title="Actualizar"
              >
                <RefreshCw size={18} />
              </button>
            </div>
          </div>

          {/* Búsqueda */}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar conversación..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
            />
          </div>

          {/* Modal nuevo chat */}
          {showNewChat && (
            <div className="mt-3 p-3 bg-white rounded-xl border border-green-200 shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-slate-700">Nuevo mensaje</span>
                <button onClick={() => setShowNewChat(false)} className="p-1 hover:bg-gray-100 rounded-full">
                  <X size={14} />
                </button>
              </div>
              <input
                type="text"
                placeholder="Nombre (opcional)"
                value={newChatName}
                onChange={(e) => setNewChatName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <input
                type="text"
                placeholder="Teléfono (ej: 521XXXXXXXXXX)"
                value={newChatPhone}
                onChange={(e) => setNewChatPhone(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && startNewChat()}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <button
                onClick={startNewChat}
                className="w-full py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
              >
                Iniciar conversación
              </button>
            </div>
          )}
        </div>

        {/* Lista */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-gray-400 text-sm">
              <MessageCircle size={32} className="mb-2 opacity-50" />
              <span>No hay conversaciones</span>
            </div>
          ) : (
            filteredConversations.map((lead) => (
              <div
                key={lead.id}
                onClick={() => selectConversation(lead)}
                className={`flex items-center gap-3 px-4 py-3 cursor-pointer border-b border-gray-50 transition-colors ${
                  selectedLead?.id === lead.id
                    ? 'bg-green-50 border-l-4 border-l-green-500'
                    : 'hover:bg-gray-50'
                }`}
              >
                {/* Avatar */}
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {getInitials(lead.full_name)}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm text-slate-800 truncate">
                      {lead.full_name || 'Sin nombre'}
                    </span>
                    <span className="text-[11px] text-gray-400 whitespace-nowrap ml-2">
                      {formatTime(lead.last_message_at)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="text-xs text-gray-500 truncate">
                      {lead.phone}
                    </span>
                    {lead.unread_count > 0 && (
                      <span className="bg-green-500 text-white text-[10px] font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5">
                        {lead.unread_count}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ═══ Vista de chat ═══ */}
      <div
        className={`flex-1 flex flex-col bg-[#efeae2] ${
          !isMobileView && !selectedLead ? 'hidden md:flex' : 'flex'
        }`}
      >
        {selectedLead ? (
          <>
            {/* Header del chat */}
            <div className="px-4 py-3 bg-slate-50 border-b flex items-center gap-3 shadow-sm">
              <button
                onClick={backToList}
                className="md:hidden p-1 rounded-full hover:bg-gray-200"
              >
                <ArrowLeft size={20} />
              </button>

              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                {getInitials(selectedLead.full_name)}
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm text-slate-800 truncate">
                  {selectedLead.full_name || 'Sin nombre'}
                </h3>
                <p className="text-xs text-gray-500">{selectedLead.phone}</p>
              </div>

              <div className="flex items-center gap-1">
                <a
                  href={`tel:${selectedLead.phone}`}
                  className="p-2 rounded-full hover:bg-gray-200 text-slate-600"
                >
                  <Phone size={18} />
                </a>
                <button className="p-2 rounded-full hover:bg-gray-200 text-slate-600">
                  <MoreVertical size={18} />
                </button>
              </div>
            </div>

            {/* Mensajes */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <MessageCircle size={48} className="mb-3 opacity-30" />
                  <p className="text-sm">No hay mensajes aún</p>
                  <p className="text-xs mt-1">Envía el primer mensaje</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isOutbound = msg.direction === 'outbound';
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isOutbound ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[75%] rounded-lg px-3 py-2 shadow-sm ${
                          isOutbound
                            ? 'bg-[#d9fdd3] rounded-tr-none'
                            : 'bg-white rounded-tl-none'
                        }`}
                      >
                        {/* Contenido */}
                        <p className="text-sm text-slate-800 whitespace-pre-wrap break-words">
                          {msg.content}
                        </p>

                        {/* Footer: hora + status */}
                        <div className="flex items-center justify-end gap-1 mt-1">
                          <span className="text-[10px] text-gray-500">
                            {formatTime(msg.created_at)}
                          </span>
                          {isOutbound && getStatusIcon(msg.status)}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="px-4 py-3 bg-slate-50 border-t">
              {/* Status message */}
              {statusMsg && (
                <div className={`mb-2 px-3 py-1.5 rounded-lg text-xs font-medium ${
                  statusMsg.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
                }`}>
                  {statusMsg.text}
                </div>
              )}
              <div className="flex items-center gap-2">
                <button className="p-2 rounded-full hover:bg-gray-200 text-slate-500" title="Emoji">
                  <Smile size={22} />
                </button>
                <button className="p-2 rounded-full hover:bg-gray-200 text-slate-500" title="Adjuntar">
                  <Paperclip size={22} />
                </button>

                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Escribe un mensaje..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                />

                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || sending}
                  className={`p-2.5 rounded-full transition-colors ${
                    newMessage.trim() && !sending
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <Send size={20} />
                </button>
              </div>
            </div>
          </>
        ) : (
          /* Sin conversación seleccionada */
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
            <div className="w-64 h-64 mb-6 flex items-center justify-center">
              <MessageCircle size={120} className="text-gray-200" />
            </div>
            <h3 className="text-xl font-light text-gray-500 mb-2">WhatsApp Business</h3>
            <p className="text-sm text-gray-400 text-center max-w-sm">
              Selecciona una conversación para ver los mensajes y responder desde aquí.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
