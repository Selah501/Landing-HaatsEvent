import { initializeApp } from "firebase/app";
import { getDatabase, ref, update, get } from "firebase/database";

const firebaseConfig = {
    databaseURL: "https://flyer-event-page-2026-default-rtdb.firebaseio.com",
    projectId: "flyer-event-page-2026",
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

async function testUpdate() {
    const dateStr = "2026-08-08";
    const t = "09:00";
    
    // Fetch current data
    const snap = await get(ref(db, `reservations/${dateStr}/${t}`));
    const currentAdjData = snap.val();
    
    // Emulate saveCustomerInfo
    const updatedCustomerInfo = {
        ...(currentAdjData.customerInfo || {}),
        apt: "중흥 126-403",
        notes: "전화예약 배정"
    };
    currentAdjData.customerInfo = updatedCustomerInfo;
    
    let updates1 = {};
    updates1[`reservations/${dateStr}/${t}/customerInfo`] = updatedCustomerInfo;
    await update(ref(db), updates1);
    
    // Emulate saveAdjustedSlots
    let updates2 = {};
    updates2[`reservations/${dateStr}/${t}`] = {
        ...currentAdjData,
        status: "confirmed",
        reservationId: currentAdjData.reservationId,
        timestamp: Date.now()
    };
    await update(ref(db), updates2);
    
    // Verify
    const snap2 = await get(ref(db, `reservations/${dateStr}/${t}`));
    console.log(snap2.val().customerInfo);
    process.exit(0);
}

testUpdate();
