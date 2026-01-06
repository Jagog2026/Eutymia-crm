import React, { useState, useRef } from 'react';
import { X, Upload, FileSpreadsheet, AlertCircle, Check, Download } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import * as XLSX from 'xlsx';

export default function ImportLeadsModal({ isOpen, onClose, onSuccess }) {
  const [file, setFile] = useState(null);
  const [previewData, setPreviewData] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      const validTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'text/csv'
      ];
      const validExtensions = ['.xlsx', '.xls', '.csv'];
      const hasValidExtension = validExtensions.some(ext => selectedFile.name.toLowerCase().endsWith(ext));
      
      if (!validTypes.includes(selectedFile.type) && !hasValidExtension) {
        setError('Por favor, sube un archivo Excel (.xlsx, .xls) o CSV válido.');
        return;
      }
      setFile(selectedFile);
      setError(null);
      parseFile(selectedFile);
    }
  };

  // Helper function to parse different date formats and return ISO date string (YYYY-MM-DD)
  const parseDate = (dateValue) => {
    if (!dateValue) return null;
    
    try {
      // If it's already a Date object (from Excel)
      if (dateValue instanceof Date) {
        return dateValue.toISOString().split('T')[0];
      }
      
      // If it's a string
      if (typeof dateValue === 'string') {
        // Try DD/MM/YYYY format
        const ddmmyyyyMatch = dateValue.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
        if (ddmmyyyyMatch) {
          const [, day, month, year] = ddmmyyyyMatch;
          return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        }
        
        // Try MM/DD/YYYY format
        const mmddyyyyMatch = dateValue.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
        if (mmddyyyyMatch) {
          const [, first, second, year] = mmddyyyyMatch;
          // Assume DD/MM/YYYY if first > 12
          if (parseInt(first) > 12) {
            return `${year}-${String(second).padStart(2, '0')}-${String(first).padStart(2, '0')}`;
          }
          // Otherwise assume MM/DD/YYYY
          return `${year}-${String(first).padStart(2, '0')}-${String(second).padStart(2, '0')}`;
        }
        
        // Try YYYY-MM-DD format (ISO)
        const isoMatch = dateValue.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
        if (isoMatch) {
          const [, year, month, day] = isoMatch;
          return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        }
        
        // Try parsing as ISO string
        const date = new Date(dateValue);
        if (!isNaN(date.getTime())) {
          return date.toISOString().split('T')[0];
        }
      }
      
      // If it's a number (Excel serial date)
      if (typeof dateValue === 'number') {
        const date = XLSX.SSF.parse_date_code(dateValue);
        return `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
      }
      
      return null;
    } catch (err) {
      console.error('Error parsing date:', dateValue, err);
      return null;
    }
  };

  // Helper function to parse date and return full ISO timestamp
  const parseTimestamp = (dateValue) => {
    if (!dateValue) return null;
    
    try {
      // If it's already a Date object (from Excel)
      if (dateValue instanceof Date) {
        return dateValue.toISOString();
      }
      
      // If it's a string
      if (typeof dateValue === 'string') {
        // Try DD/MM/YYYY format
        const ddmmyyyyMatch = dateValue.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
        if (ddmmyyyyMatch) {
          const [, day, month, year] = ddmmyyyyMatch;
          const date = new Date(`${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T00:00:00Z`);
          return date.toISOString();
        }
        
        // Try MM/DD/YYYY format
        const mmddyyyyMatch = dateValue.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
        if (mmddyyyyMatch) {
          const [, first, second, year] = mmddyyyyMatch;
          // Assume DD/MM/YYYY if first > 12
          if (parseInt(first) > 12) {
            const date = new Date(`${year}-${String(second).padStart(2, '0')}-${String(first).padStart(2, '0')}T00:00:00Z`);
            return date.toISOString();
          }
          // Otherwise assume MM/DD/YYYY
          const date = new Date(`${year}-${String(first).padStart(2, '0')}-${String(second).padStart(2, '0')}T00:00:00Z`);
          return date.toISOString();
        }
        
        // Try YYYY-MM-DD format (ISO)
        const isoMatch = dateValue.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
        if (isoMatch) {
          const [, year, month, day] = isoMatch;
          const date = new Date(`${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T00:00:00Z`);
          return date.toISOString();
        }
        
        // Try parsing as ISO string
        const date = new Date(dateValue);
        if (!isNaN(date.getTime())) {
          return date.toISOString();
        }
      }
      
      // If it's a number (Excel serial date)
      if (typeof dateValue === 'number') {
        const parsed = XLSX.SSF.parse_date_code(dateValue);
        const date = new Date(`${parsed.y}-${String(parsed.m).padStart(2, '0')}-${String(parsed.d).padStart(2, '0')}T00:00:00Z`);
        return date.toISOString();
      }
      
      return null;
    } catch (err) {
      console.error('Error parsing timestamp:', dateValue, err);
      return null;
    }
  };

  const parseFile = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
        
        // Get first sheet
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { raw: false, dateNF: 'yyyy-mm-dd' });
        
        if (jsonData.length === 0) {
          setError('El archivo está vacío o no tiene datos válidos.');
          return;
        }
        
        // Map the data to our database schema
        const mappedData = jsonData.map(row => {
          // Build full name from Nombres and Apellidos
          const firstName = row['Nombres'] || '';
          const lastName = row['Apellidos'] || '';
          const fullName = `${firstName} ${lastName}`.trim();
          
          // Build birth date from day, month, year
          let birthDate = null;
          const day = row['Día del nacimiento'];
          const month = row['Mes del nacimiento'];
          const year = row['Año de nacimiento.'];
          if (day && month && year) {
            try {
              birthDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            } catch (err) {
              console.warn('Error building birth date:', err);
            }
          }
          
          // Map gender (1 = Femenino, 2 = Masculino)
          let gender = null;
          const genderValue = row['Género. 1 = Femenino, 2 = Masculino'];
          if (genderValue === 1 || genderValue === '1') gender = 'Femenino';
          else if (genderValue === 2 || genderValue === '2') gender = 'Masculino';
          
          // Parse creation date as full timestamp
          const createdAt = parseTimestamp(row['Fecha de creación.']) || new Date().toISOString();
          
          return {
            full_name: fullName || row['Email'] || 'Sin nombre',
            email: row['Email'] || null,
            phone: row['Teléfono'] || null,
            secondary_phone: row['Teléfono secundario del cliente'] || null,
            dni: row['DNI o RFC'] || null,
            client_number: row['Número de cliente'] || null,
            address: row['Dirección'] || null,
            comuna: row['comuna'] || null,
            city: row['Ciudad'] || null,
            age: row['Edad'] || null,
            gender: gender,
            birth_date: birthDate,
            status: 'new',
            source: 'import',
            created_at: createdAt
          };
        }).filter(row => row.full_name || row.email || row.phone);
        
        setPreviewData(mappedData);
      } catch (err) {
        console.error('Error parsing file:', err);
        setError('Error al leer el archivo. Asegúrate de que sea un archivo Excel o CSV válido.');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleUpload = async () => {
    if (previewData.length === 0) {
      setError('No hay datos válidos para importar.');
      return;
    }

    try {
      setUploading(true);
      setError(null);

      // Insert in batches of 50 to avoid timeouts or limits
      const batchSize = 50;
      for (let i = 0; i < previewData.length; i += batchSize) {
        const batch = previewData.slice(i, i + batchSize);
        const { error: insertError } = await supabase
          .from('leads')
          .insert(batch);
        
        if (insertError) throw insertError;
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
        setFile(null);
        setPreviewData([]);
        setSuccess(false);
      }, 2000);
    } catch (err) {
      console.error('Error importing leads:', err);
      setError('Error al importar los datos: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = () => {
    // Create a sample template with the expected format
    const templateData = [{
      "Email": "ejemplo@email.com",
      "Nombres": "Juan",
      "Apellidos": "Pérez",
      "DNI o RFC": "12345678",
      "Número de cliente": "001",
      "Teléfono": "+5491123456789",
      "Teléfono secundario del cliente": "+5491198765432",
      "Dirección": "Calle Ejemplo 123",
      "comuna": "Comuna 1",
      "Ciudad": "Buenos Aires",
      "Edad": 30,
      "Género. 1 = Femenino, 2 = Masculino": 2,
      "Día del nacimiento": 15,
      "Mes del nacimiento": 6,
      "Año de nacimiento.": 1993,
      "Fecha de creación.": "2024-01-01"
    }];
    
    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Leads");
    XLSX.writeFile(workbook, "plantilla_importacion_leads.xlsx");
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Upload className="w-6 h-6 text-teal-600" />
            Importar Leads desde Excel
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {!file ? (
            <div className="space-y-4">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-teal-500 hover:bg-teal-50 transition-colors cursor-pointer"
              >
                <FileSpreadsheet className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-lg font-medium text-gray-900">Haz clic para subir tu archivo Excel o CSV</p>
                <p className="text-sm text-gray-500 mt-1">o arrastra y suelta el archivo aquí</p>
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                />
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Instrucciones:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>El archivo debe estar en formato <strong>.xlsx</strong>, <strong>.xls</strong> o <strong>.csv</strong></li>
                    <li>Columnas esperadas: Email, Nombres, Apellidos, DNI o RFC, Teléfono, Ciudad, Edad, Género, etc.</li>
                    <li>Descarga la plantilla para ver el formato exacto</li>
                  </ul>
                  <button 
                    onClick={downloadTemplate}
                    className="mt-3 flex items-center gap-1 text-blue-700 font-medium hover:underline"
                  >
                    <Download size={14} /> Descargar plantilla de ejemplo
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="w-8 h-8 text-green-600" />
                  <div>
                    <p className="font-medium text-gray-900">{file.name}</p>
                    <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(2)} KB</p>
                  </div>
                </div>
                <button 
                  onClick={() => { setFile(null); setPreviewData([]); }}
                  className="text-red-500 hover:text-red-700 text-sm font-medium"
                >
                  Cambiar archivo
                </button>
              </div>

              {previewData.length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Vista previa ({previewData.length} registros)</h3>
                  <div className="border rounded-lg overflow-hidden overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-gray-50 text-gray-500">
                        <tr>
                          <th className="px-4 py-2">Nombre</th>
                          <th className="px-4 py-2">Email</th>
                          <th className="px-4 py-2">Teléfono</th>
                          <th className="px-4 py-2">Ciudad</th>
                          <th className="px-4 py-2">Edad</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {previewData.slice(0, 5).map((row, i) => (
                          <tr key={i}>
                            <td className="px-4 py-2">{row.full_name || '-'}</td>
                            <td className="px-4 py-2">{row.email || '-'}</td>
                            <td className="px-4 py-2">{row.phone || '-'}</td>
                            <td className="px-4 py-2">{row.city || '-'}</td>
                            <td className="px-4 py-2">{row.age || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {previewData.length > 5 && (
                      <div className="px-4 py-2 bg-gray-50 text-xs text-gray-500 text-center border-t">
                        ... y {previewData.length - 5} más
                      </div>
                    )}
                  </div>
                </div>
              )}

              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-center gap-2">
                  <AlertCircle size={16} />
                  {error}
                </div>
              )}

              {success && (
                <div className="bg-green-50 text-green-600 p-3 rounded-lg text-sm flex items-center gap-2">
                  <Check size={16} />
                  ¡Importación completada con éxito!
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={uploading}
          >
            Cancelar
          </button>
          {file && (
            <button
              onClick={handleUpload}
              disabled={uploading || success}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? 'Importando...' : success ? 'Completado' : 'Importar Datos'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}