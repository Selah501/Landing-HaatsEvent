import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://belchthacupzpgxevecx.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJlbGNodGhhY3VwenBneGV2ZWN4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTgwNTUwNiwiZXhwIjoyMTAxMzgxNTA2fQ.cjEfiENLjNwl5dudDTU_ylppF_SIhQCmx9lb_gXh8bo';
const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function run() {
    const { data } = await sb.from('products').select('id, detail_urls');
    for (const p of data) {
        if (p.detail_urls && p.detail_urls.length > 0) {
            const fixed = p.detail_urls.map(u => u.split(String.fromCharCode(92)).join('/'));
            if (JSON.stringify(fixed) !== JSON.stringify(p.detail_urls)) {
                await sb.from('products').update({detail_urls: fixed}).eq('id', p.id);
                console.log('Fixed', p.id);
            }
        }
    }
}
run();
