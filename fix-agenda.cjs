const fs = require('fs');

const files = [
  './src/components/agenda/AgendaGrid.jsx',
  './src/components/agenda/AgendaHeader.jsx',
  './src/components/agenda/AgendaSidebar.jsx',
  './src/components/agenda/Agenda.jsx',
  './src/components/agenda/NewAppointmentModal.jsx',
  './src/components/agenda/BlockScheduleModal.jsx'
];

files.forEach(file => {
  if (!fs.existsSync(file)) return;
  let code = fs.readFileSync(file, 'utf8');
  let original = code;
  
  // Grid lines
  code = code.replace(/\bborder-slate-100(?! dark:)/g, 'border-slate-100 dark:border-slate-800');
  
  // Backgrounds inside Grid
  code = code.replace(/\bbg-slate-50\/60(?! dark:)/g, 'bg-slate-50/60 dark:bg-slate-800/40');
  code = code.replace(/\bbg-slate-50\/40(?! dark:)/g, 'bg-slate-50/40 dark:bg-slate-800/20');
  code = code.replace(/\bto-white(?! dark:)/g, 'to-white dark:to-slate-900');
  code = code.replace(/\bfrom-slate-[0-9]+\/[0-9]+(?! dark:)/g, (match) => {
    if (match === 'from-slate-50/80') return 'from-slate-50/80 dark:from-slate-900';
    return match;
  });

  // Buttons and toggles in Header
  code = code.replace(/\bbg-slate-900 text-white(?! dark:)/g, 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900');
  code = code.replace(/\btext-slate-600 hover:bg-slate-50(?! dark:)/g, 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800');
  code = code.replace(/\btext-slate-500(?! dark:)/g, 'text-slate-500 dark:text-slate-400');
  code = code.replace(/\btext-slate-400(?! dark:)/g, 'text-slate-400 dark:text-slate-500');
  code = code.replace(/\bborder-slate-200(?! dark:)/g, 'border-slate-200 dark:border-slate-700');
  code = code.replace(/\bbg-slate-200(?! dark:)/g, 'bg-slate-200 dark:bg-slate-700');

  // Dark mode text tweaks that didn't get caught
  // Grid internal labels
  code = code.replace(/\btext-slate-800(?! dark:)/g, 'text-slate-800 dark:text-slate-200');
  code = code.replace(/\btext-slate-900(?! dark:)/g, 'text-slate-900 dark:text-slate-100');
  code = code.replace(/\btext-slate-700(?! dark:)/g, 'text-slate-700 dark:text-slate-300');

  // Sidebar blocks
  code = code.replace(/\bbg-slate-50 text-slate-700(?! dark:)/g, 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300');
  code = code.replace(/\bbg-white text-slate-800(?! dark:)/g, 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200');

  // Specific grid StatusConfig fix (we will manually do this if needed but let's try a regex for the object)
  code = code.replace(
    /card: 'bg-([a-z]+)-50\s+border-\1-200\s+ring-\1-200\/50'(?! dark:)/g,
    "card: 'bg-$1-50 dark:bg-$1-900/30 border-$1-200 dark:border-$1-800 ring-$1-200/50 dark:ring-$1-900/50'"
  );
  code = code.replace(
    /badge: 'bg-([a-z]+)-100\s+text-\1-700\s+border-\1-200'(?! dark:)/g,
    "badge: 'bg-$1-100 dark:bg-$1-900/50 text-$1-700 dark:text-$1-300 border-$1-200 dark:border-$1-800'"
  );
  code = code.replace(
    /badge: 'bg-([a-z]+)-100\s+text-\1-600\s+border-\1-200'(?! dark:)/g,
    "badge: 'bg-$1-100 dark:bg-$1-900/50 text-$1-600 dark:text-$1-300 border-$1-200 dark:border-$1-800'"
  );

  // Fallbacks for unreplaced
  code = code.replace(/bg-white(?! dark:)/g, 'bg-white dark:bg-slate-900');
  code = code.replace(/border-b(?! border-slate| dark:)/g, 'border-b border-slate-200 dark:border-slate-800');

  if(original !== code) {
    fs.writeFileSync(file, code, 'utf8');
  }
});
console.log('done fixing agenda');
