import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { X, Plus, Calendar, Bell, CheckCircle, Circle, Trash2, Tag, AlertTriangle, Clock } from 'lucide-react';

export default function LeadTasksModal({ isOpen, onClose, lead }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    due_date: '',
    type: 'task',
    tags: '',
    notes: ''
  });

  useEffect(() => {
    if (isOpen && lead) {
      fetchTasks();
    }
  }, [isOpen, lead]);

  const fetchTasks = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('lead_tasks')
      .select('*')
      .eq('lead_id', lead.id)
      .order('due_date', { ascending: true });

    if (error) {
      console.error('Error fetching tasks:', error);
    } else {
      setTasks(data || []);
    }
    setLoading(false);
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTask.title) return;

    const tagsArray = newTask.tags.split(',').map(t => t.trim()).filter(t => t);

    const taskData = {
      lead_id: lead.id,
      title: newTask.title,
      description: newTask.description,
      due_date: newTask.due_date || null,
      type: newTask.type,
      tags: tagsArray,
      notes: newTask.notes,
      status: 'pending'
    };

    const { data, error } = await supabase
      .from('lead_tasks')
      .insert([taskData])
      .select();

    if (error) {
      console.error('Error adding task:', error);
      alert('Error al crear la tarea');
    } else {
      setTasks([...tasks, data[0]]);
      setNewTask({
        title: '',
        description: '',
        due_date: '',
        type: 'task',
        tags: ''
      });
    }
  };

  const applyAutomation = async (automationType) => {
    if (!window.confirm('¿Aplicar esta automatización? Se crearán varias tareas.'));

    const today = new Date();
    let newTasks = [];

    if (automationType === 'follow_up') {
      newTasks = [
        {
          lead_id: lead.id,
          title: 'Llamada de seguimiento 1',
          type: 'task',
          due_date: new Date(today.setDate(today.getDate() + 1)).toISOString(),
          tags: ['seguimiento', 'llamada'],
          notes: '',
          status: 'pending'
        },
        {
          lead_id: lead.id,
          title: 'Enviar correo de información',
          type: 'task',
          due_date: new Date(today.setDate(today.getDate() + 2)).toISOString(), // +3 days total
          tags: ['seguimiento', 'email'],
          notes: '',
          status: 'pending'
        },
        {
          lead_id: lead.id,
          title: 'Llamada de cierre',
          type: 'alert',
          due_date: new Date(today.setDate(today.getDate() + 4)).toISOString(), // +7 days total
          tags: ['cierre', 'importante'],
          notes: '',
          status: 'pending'
        }
      ];
    }

    if (newTasks.length > 0) {
      const { data, error } = await supabase
        .from('lead_tasks')
        .insert(newTasks)
        .select();

      if (error) {
        console.error('Error applying automation:', error);
      } else {
        setTasks([...tasks, ...data]);
      }
    }
  };

  const toggleTaskStatus = async (task) => {
    const newStatus = task.status === 'pending' ? 'completed' : 'pending';
    
    const { error } = await supabase
      .from('lead_tasks')
      .update({ status: newStatus })
      .eq('id', task.id);

    if (error) {
      console.error('Error updating task:', error);
    } else {
      setTasks(tasks.map(t => t.id === task.id ? { ...t, status: newStatus } : t));
    }
  };

  const deleteTask = async (taskId) => {
    if (!window.confirm('¿Eliminar esta tarea?')) return;

    const { error } = await supabase
      .from('lead_tasks')
      .delete()
      .eq('id', taskId);

    if (error) {
      console.error('Error deleting task:', error);
    } else {
      setTasks(tasks.filter(t => t.id !== taskId));
    }
  };

  if (!isOpen || !lead) return null;

  const getTypeIcon = (type) => {
    switch (type) {
      case 'alert': return <AlertTriangle size={16} className="text-red-500" />;
      case 'reminder': return <Bell size={16} className="text-yellow-500" />;
      default: return <CheckCircle size={16} className="text-blue-500" />;
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'alert': return 'Alerta';
      case 'reminder': return 'Recordatorio';
      default: return 'Tarea';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Tareas y Recordatorios</h2>
            <p className="text-sm text-gray-500">Para: {lead.full_name || lead.name}</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        <div className="p-4 border-b bg-gray-50">
          <div className="flex justify-end mb-4">
            <button
              onClick={() => applyAutomation('follow_up')}
              className="text-xs flex items-center gap-1 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100 hover:bg-indigo-100"
            >
              <Clock size={12} />
              Aplicar Plan de Seguimiento (Automático)
            </button>
          </div>
          <form onSubmit={handleAddTask} className="space-y-3">
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="Título de la tarea..."
                className="flex-1 p-2 border rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                value={newTask.title}
                onChange={e => setNewTask({...newTask, title: e.target.value})}
                required
              />
              <select
                className="p-2 border rounded-lg bg-white"
                value={newTask.type}
                onChange={e => setNewTask({...newTask, type: e.target.value})}
              >
                <option value="task">Tarea</option>
                <option value="reminder">Recordatorio</option>
                <option value="alert">Alerta</option>
              </select>
            </div>
            <textarea
              placeholder="Notas internas..."
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
              rows="2"
              value={newTask.notes}
              onChange={e => setNewTask({...newTask, notes: e.target.value})}
            ></textarea>
            
            <div className="flex gap-3">
              <input
                type="datetime-local"
                className="p-2 border rounded-lg bg-white"
                value={newTask.due_date}
                onChange={e => setNewTask({...newTask, due_date: e.target.value})}
              />
              <input
                type="text"
                placeholder="Etiquetas (sep. por comas)"
                className="flex-1 p-2 border rounded-lg"
                value={newTask.tags}
                onChange={e => setNewTask({...newTask, tags: e.target.value})}
              />
              <button
                type="submit"
                className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 flex items-center gap-2"
              >
                <Plus size={18} /> Añadir
              </button>
            </div>
          </form>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="text-center py-8 text-gray-500">Cargando tareas...</div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No hay tareas pendientes para este lead.</div>
          ) : (
            tasks.map(task => (
              <div 
                key={task.id} 
                className={`flex items-start gap-3 p-3 rounded-lg border ${task.status === 'completed' ? 'bg-gray-50 opacity-75' : 'bg-white hover:shadow-sm'}`}
              >
                <button 
                  onClick={() => toggleTaskStatus(task)}
                  className={`mt-1 ${task.status === 'completed' ? 'text-green-500' : 'text-gray-300 hover:text-green-500'}`}
                >
                  {task.status === 'completed' ? <CheckCircle size={20} /> : <Circle size={20} />}
                </button>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 border ${
                      task.type === 'alert' ? 'bg-red-50 text-red-700 border-red-100' :
                      task.type === 'reminder' ? 'bg-yellow-50 text-yellow-700 border-yellow-100' :
                      'bg-blue-50 text-blue-700 border-blue-100'
                    }`}>
                      {getTypeIcon(task.type)}
                      {getTypeLabel(task.type)}
                    </span>
                    <h3 className={`font-medium ${task.status === 'completed' ? 'line-through text-gray-500' : 'text-gray-800'}`}>
                      {task.title}
                    </h3>
                  </div>
                  
                  {task.description && (
                    <p className="text-sm text-gray-600 mb-1">{task.description}</p>
                  )}

                  {task.notes && (
                    <p className="text-sm text-gray-500 italic mb-1">Notas: {task.notes}</p>
                  )}

                  {task.due_date && (
                    <div className={`text-xs flex items-center gap-1 mb-1 ${
                      new Date(task.due_date) < new Date() && task.status !== 'completed' ? 'text-red-600 font-medium' : 'text-gray-500'
                    }`}>
                      <Clock size={12} />
                      {new Date(task.due_date).toLocaleString()}
                    </div>
                  )}
                  
                  {task.tags && task.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {task.tags.map((tag, i) => (
                        <span key={i} className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded flex items-center gap-0.5">
                          <Tag size={8} /> {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <button 
                  onClick={() => deleteTask(task.id)}
                  className="text-gray-400 hover:text-red-500 p-1"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}