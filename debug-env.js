require('dotenv').config({ path: '.env.local' });

console.log('Debug .env.local scan:');
console.log('File path:', require('path').resolve('.env.local'));
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'FOUND (Length: ' + process.env.NEXT_PUBLIC_SUPABASE_URL.length + ')' : 'MISSING');
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'FOUND (Length: ' + process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length + ')' : 'MISSING');

const fs = require('fs');
try {
    const content = fs.readFileSync('.env.local', 'utf8');
    console.log('Raw file content length:', content.length);
    console.log('First 20 chars:', content.substring(0, 20).replace(/\n/g, '\\n'));
} catch (e) {
    console.log('Error reading file directly:', e.message);
}
