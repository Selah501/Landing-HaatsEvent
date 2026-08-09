const fs = require('fs');

const reportData = {
    usedProducts: [
        { name: '테라 주방후드', qty: 1, cost: 150000, sellPrice: 200000 },
        '현장추가 공임비(5만원)'
    ],
    techNotes: '배관이 짧아서 연장 배관 사용함. 실리콘 마감 꼼꼼히 처리.',
    salesNotes: '고객님이 매우 만족해 하심. 다음 달에 인덕션 교체도 문의하심.',
    payAmount: 250000,
    margin: 100000,
    payMethod: '현금',
    mediaUrls: [
        'https://via.placeholder.com/150'
    ]
};

fetch('https://flyer-event-page-2026-default-rtdb.firebaseio.com/reservations/2026-07-30/09:00/report.json', {
    method: 'PUT',
    body: JSON.stringify(reportData),
    headers: { 'Content-Type': 'application/json' }
})
.then(res => res.json())
.then(json => console.log('Successfully triggered report write:', json))
.catch(err => console.error('Error:', err));
