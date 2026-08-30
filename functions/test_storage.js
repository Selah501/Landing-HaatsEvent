const admin = require('firebase-admin');
const { getStorage } = require('firebase-admin/storage');
admin.initializeApp({ projectId: 'flyer-event-page-2026' });

async function listFiles() {
  try {
    const defaultBucket = getStorage().bucket();
    console.log('Default bucket name:', defaultBucket.name);
    const [files1] = await defaultBucket.getFiles({ prefix: 'call_records' });
    console.log(`Found ${files1.length} files in default bucket call_records/`);
  } catch (e) {
    console.error('Error with default bucket:', e.message);
  }
  
  try {
    const firebasestorageBucket = getStorage().bucket('flyer-event-page-2026.firebasestorage.app');
    console.log('Testing firebasestorageBucket name:', firebasestorageBucket.name);
    const [files2] = await firebasestorageBucket.getFiles({ prefix: 'call_records' });
    console.log(`Found ${files2.length} files in firebasestorageBucket call_records/`);
  } catch (e) {
    console.error('Error with firebasestorageBucket:', e.message);
  }
}

listFiles().catch(console.error);
