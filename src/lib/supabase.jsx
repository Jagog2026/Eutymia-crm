import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qwzdatnlfdnsxebfgjwu.supabase.co';
const supabaseAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3emRhdG5sZmRuc3hlYmZnand1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY1ODg5NTksImV4cCI6MjA4MjE2NDk1OX0.Sv80mva2PThxNhdaRAHLxMdNArl7pa3Ff1ew_R-FTd4';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
