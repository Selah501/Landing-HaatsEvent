const data = {
    reservationId: "res_123",
    customerInfo: { apt: "반도유보라 101-104", phone: "010-87944843" }
};
const currentAdjData = data;

const newApt = "중흥 126-403";
const newPhone = "010-1111-2222";

const updatedCustomerInfo = {
    ...(currentAdjData.customerInfo || {}),
    apt: newApt,
    phone: newPhone
};

currentAdjData.customerInfo = updatedCustomerInfo;

console.log(currentAdjData);

const updates = {};
const currentAdjSlots = ["09:00"];
currentAdjSlots.forEach(t => {
    updates[`reservations/2026-08-08/${t}`] = {
        ...currentAdjData,
        status: "confirmed",
        reservationId: "res_123",
        timestamp: Date.now()
    };
});

console.log(JSON.stringify(updates, null, 2));
