import React, { useState, useRef } from 'react';
import { X, MessageCircle, ExternalLink, Copy, Check, Bold, Italic, Strikethrough, Image as ImageIcon, Loader, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function BulkWhatsAppModal({ isOpen, onClose, selectedLeads, leads }) {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const [selectedLine, setSelectedLine] = useState('1');
  const [imageUrl, setImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const textareaRef = useRef(null);

  if (!isOpen) return null;

  const recipients = leads.filter(l => selectedLeads.includes(l.id) && (l.whatsapp_line || l.phone));
  const recipientCount = recipients.length;

  const handleFormat = (format) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.substring(start, end);
    
    let formattedText = '';
    let symbol = '';

    switch (format) {
      case 'bold': symbol = '*'; break;
      case 'italic': symbol = '_'; break;
      case 'strikethrough': symbol = '~'; break;
      default: return;
    }

    formattedText = `${symbol}${selectedText}${symbol}`;
    
    const newText = text.substring(0, start) + formattedText + text.substring(end);
    setMessage(newText);
    
    // Restore focus and selection
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + 1, end + 1);
    }, 0);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('whatsapp_attachments')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('whatsapp_attachments')
        .getPublicUrl(filePath);

      setImageUrl(data.publicUrl);
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Error al subir la imagen');
    } finally {
      setUploading(false);
    }
  };

  const getFullMessage = () => {
    let fullMsg = '';
    if (title) fullMsg += `*${title}*\n\n`;
    fullMsg += message;
    if (imageUrl) fullMsg += `\n\n${imageUrl}`;
    return fullMsg;
  };

  const getWhatsAppLink = (phone) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const encodedMsg = encodeURIComponent(getFullMessage());
    return `https://wa.me/${cleanPhone}?text=${encodedMsg}`;
  };

  const copyMessage = () => {
    navigator.clipboard.writeText(getFullMessage());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <MessageCircle className="text-green-600" />
            Enviar WhatsApp Masivo
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Left Panel: Message Editor */}
          <div className="w-1/2 p-6 border-r overflow-y-auto">
            <div className="space-y-4">
              {/* Line Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Enviar desde</label>
                <select
                  value={selectedLine}
                  onChange={(e) => setSelectedLine(e.target.value)}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                >
                  <option value="1">Línea WhatsApp 1</option>
                  <option value="2">Línea WhatsApp 2</option>
                  <option value="3">Línea WhatsApp 3</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Asegúrate de tener abierta la sesión de WhatsApp Web correspondiente.
                </p>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Título (opcional)</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none font-bold"
                  placeholder="Título del mensaje"
                />
              </div>

              {/* Message Editor */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mensaje</label>
                <div className="border rounded-lg overflow-hidden">
                  {/* Toolbar */}
                  <div className="flex items-center gap-1 p-2 bg-gray-50 border-b">
                    <button onClick={() => handleFormat('bold')} className="p-1.5 hover:bg-gray-200 rounded" title="Negrita">
                      <Bold size={16} />
                    </button>
                    <button onClick={() => handleFormat('italic')} className="p-1.5 hover:bg-gray-200 rounded" title="Cursiva">
                      <Italic size={16} />
                    </button>
                    <button onClick={() => handleFormat('strikethrough')} className="p-1.5 hover:bg-gray-200 rounded" title="Tachado">
                      <Strikethrough size={16} />
                    </button>
                    <div className="w-px h-4 bg-gray-300 mx-1" />
                    <label className="p-1.5 hover:bg-gray-200 rounded cursor-pointer" title="Subir imagen">
                      <ImageIcon size={16} />
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
                    </label>
                  </div>
                  
                  <textarea
                    ref={textareaRef}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full p-3 h-40 focus:outline-none resize-none"
                    placeholder="Escribe tu mensaje aquí..."
                  />
                </div>
              </div>

              {/* Image Preview */}
              {uploading && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Loader className="animate-spin" size={16} /> Subiendo imagen...
                </div>
              )}
              
              {imageUrl && (
                <div className="relative inline-block border rounded-lg overflow-hidden group">
                  <img src={imageUrl} alt="Adjunto" className="h-32 w-auto object-cover" />
                  <button
                    onClick={() => setImageUrl('')}
                    className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={12} />
                  </button>
                </div>
              )}

              {/* Preview Box */}
              <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                <h4 className="text-xs font-semibold text-green-800 uppercase mb-2">Vista previa del mensaje</h4>
                <div className="text-sm text-gray-800 whitespace-pre-wrap font-sans">
                  {title && <div className="font-bold mb-2">{title}</div>}
                  {message || <span className="text-gray-400 italic">Tu mensaje aparecerá aquí...</span>}
                  {imageUrl && (
                    <div className="mt-2 text-blue-600 text-xs break-all">
                      {imageUrl}
                    </div>
                  )}
                </div>
                <button
                  onClick={copyMessage}
                  className="mt-3 flex items-center gap-1 text-xs text-green-700 hover:text-green-800 font-medium"
                >
                  {copied ? <Check size={12} /> : <Copy size={12} />}
                  {copied ? 'Copiado' : 'Copiar texto completo'}
                </button>
              </div>
            </div>
          </div>

          {/* Right Panel: Recipients */}
          <div className="w-1/2 p-6 bg-gray-50 overflow-y-auto">
            <h3 className="font-medium text-gray-900 mb-3 flex items-center justify-between">
              Destinatarios ({recipientCount})
              <span className="text-xs font-normal text-gray-500">
                Se abrirá WhatsApp Web
              </span>
            </h3>
            
            <div className="space-y-2">
              {recipients.map(lead => {
                const phone = lead.whatsapp_line || lead.phone;
                return (
                  <div key={lead.id} className="flex items-center justify-between p-3 bg-white rounded-lg border shadow-sm hover:shadow-md transition-shadow">
                    <div>
                      <p className="font-medium text-gray-900">{lead.full_name || lead.name}</p>
                      <p className="text-sm text-gray-500 flex items-center gap-1">
                        <MessageCircle size={12} /> {phone}
                      </p>
                    </div>
                    <a
                      href={getWhatsAppLink(phone)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                        (message.trim() || title.trim() || imageUrl)
                          ? 'bg-green-600 text-white hover:bg-green-700 shadow-sm' 
                          : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      }`}
                      onClick={(e) => !(message.trim() || title.trim() || imageUrl) && e.preventDefault()}
                    >
                      Enviar <ExternalLink size={14} />
                    </a>
                  </div>
                );
              })}
              
              {recipients.length === 0 && (
                <div className="text-center py-8 text-gray-500 bg-white rounded-lg border border-dashed">
                  No hay destinatarios seleccionados con número de teléfono válido.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 border-t bg-white rounded-b-lg flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}