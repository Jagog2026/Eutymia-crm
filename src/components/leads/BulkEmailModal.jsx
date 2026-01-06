import React, { useState, useRef } from 'react';
import { X, Send, Loader, Upload } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function BulkEmailModal({ isOpen, onClose, selectedLeads, leads }) {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const recipients = leads.filter(l => selectedLeads.includes(l.id) && l.email);
  const recipientCount = recipients.length;

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('email_attachments')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('email_attachments')
        .getPublicUrl(filePath);

      setImageUrl(data.publicUrl);
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Error al subir la imagen');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSend = async () => {
    if (!subject.trim() || !message.trim()) {
      alert('Por favor completa el asunto y el mensaje.');
      return;
    }

    if (recipientCount === 0) {
      alert('No hay destinatarios con email válido seleccionados.');
      return;
    }

    setSending(true);
    setResult(null);

    try {
      const emails = recipients.map(r => r.email);
      
      const { data, error } = await supabase.functions.invoke('send-bulk-email', {
        body: { emails, subject, message, imageUrl }
      });

      if (error) throw error;

      setResult({
        success: true,
        message: `Se enviaron correos a ${recipientCount} destinatarios.`
      });
      
      setTimeout(() => {
        onClose();
        setSubject('');
        setMessage('');
        setResult(null);
      }, 2000);

    } catch (error) {
      console.error('Error sending emails:', error);
      setResult({
        success: false,
        message: 'Hubo un error al enviar los correos. Por favor intenta de nuevo.'
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-800">Enviar Correo Masivo</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {result && (
            <div className={`mb-4 p-4 rounded-lg ${result.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {result.message}
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Destinatarios</label>
            <div className="p-3 bg-gray-50 rounded-lg border text-sm text-gray-600">
              Se enviará a <span className="font-bold text-gray-900">{recipientCount}</span> leads seleccionados.
              {recipientCount < selectedLeads.length && (
                <span className="text-amber-600 ml-2 text-xs">
                  ({selectedLeads.length - recipientCount} leads seleccionados no tienen email)
                </span>
              )}
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Asunto</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
              placeholder="Asunto del correo..."
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Mensaje</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full p-2 border rounded-lg h-64 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none resize-none"
              placeholder="Escribe tu mensaje aquí..."
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Imagen (Opcional)</label>
            
            {!imageUrl ? (
              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  className="hidden"
                  accept="image/*"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors w-full justify-center border-dashed"
                >
                  {uploading ? <Loader className="animate-spin" size={18} /> : <Upload size={18} />}
                  {uploading ? 'Subiendo...' : 'Seleccionar imagen desde mi computadora'}
                </button>
              </div>
            ) : (
              <div className="relative mt-2 inline-block border rounded-lg overflow-hidden bg-gray-50">
                <img src={imageUrl} alt="Vista previa" className="max-h-40 object-contain" />
                <button
                  onClick={() => setImageUrl('')}
                  className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors shadow-sm"
                  title="Eliminar imagen"
                >
                  <X size={14} />
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="p-6 border-t bg-gray-50 rounded-b-lg flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
            disabled={sending}
          >
            Cancelar
          </button>
          <button
            onClick={handleSend}
            disabled={sending || recipientCount === 0}
            className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? (
              <>
                <Loader className="animate-spin" size={18} />
                Enviando...
              </>
            ) : (
              <>
                <Send size={18} />
                Enviar Correo
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}