import { initializeApp } from "firebase/app";
import { getDatabase, ref, get } from "firebase/database";

const firebaseConfig = {
    databaseURL: "https://flyer-event-page-2026-default-rtdb.firebaseio.com",
    projectId: "flyer-event-page-2026",
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const today = new Date();
const yy = today.getFullYear();
const mm = String(today.getMonth() + 1).padStart(2, '0');
const dd = String(today.getDate()).padStart(2, '0');
const dateStr = `${yy}-${mm}-${dd}`;

get(ref(db, `reservations/${dateStr}`)).then(snap => {
    console.log(`--- Reservations for ${dateStr} ---`);
    console.log(JSON.stringify(snap.val(), null, 2));
    process.exit(0);
}).catch(e => {
    console.error(e);
    process.exit(1);
});
