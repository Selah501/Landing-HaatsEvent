const { Client } = require('pg');
const client = new Client('postgresql://postgres.belchthacupzpgxevecx:lSUR7jziVlaqSAEz@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres');
client.connect()
  .then(() => client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'products'"))
  .then(res => { console.log(res.rows); client.end(); });
