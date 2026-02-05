import { createClient } from '@supabase/supabase-js';

// ✅ NUEVA BASE DE DATOS EUTYMIA CRM
// Proyecto: kpsoolwetgrdyglyxmhc
const supabaseUrl = 'https://kpsoolwetgrdyglyxmhc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtwc29vbHdldGdyZHlnbHl4bWhjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3ODQ1MzksImV4cCI6MjA4MzM2MDUzOX0.ia8Dnw6r3lZ7-ProijkkzJUrTyEjSGgNJtUOWpUpalM';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
