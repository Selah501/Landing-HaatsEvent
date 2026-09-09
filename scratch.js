const fs = require('fs');

const htmlContent = `
<div class="product-detail-container" style="max-width: 800px; margin: 0 auto; font-family: 'Inter', sans-serif; color: #333; background: #fff; padding: 0;">
    <div style="background-color: #f8f9fa; padding: 40px 20px; text-align: center;">
        <h1 style="font-size: 28px; font-weight: 800; color: #111; margin-bottom: 8px;">하츠 허리케인 데코후드 HRH-90S</h1>
        <p style="font-size: 16px; color: #666; margin-bottom: 24px;">감각적인 디자인과 강력한 흡입력, 완벽한 주방의 완성</p>
        <img src="./images/products/hrh90s/catalog.png" style="width: 100%; max-width: 600px; border-radius: 8px; box-shadow: 0 10px 25px rgba(0,0,0,0.1);" alt="HRH-90S 카탈로그" />
    </div>

    <div style="padding: 40px 20px; text-align: center;">
        <h2 style="font-size: 22px; font-weight: bold; margin-bottom: 16px; color: #111;">우리 동네 전문 기사의<br><span style="color: #2563eb;">완벽한 맞춤 시공</span></h2>
        <p style="font-size: 15px; color: #555; margin-bottom: 24px;">하츠 충남대리점 전속 기사가 직접 방문하여 기존 후드를 깔끔하게 철거하고 설치해 드립니다.</p>
        <img src="./images/products/hrh90s/install.png" style="width: 100%; max-width: 600px; border-radius: 8px;" alt="설치 사례" />
    </div>

    <div style="background-color: #f8f9fa; padding: 40px 20px;">
        <h3 style="font-size: 20px; font-weight: bold; border-bottom: 2px solid #222; padding-bottom: 10px; margin-bottom: 20px; text-align: center;">제품 스펙 및 도면</h3>
        <div style="text-align: center; margin-bottom: 24px;">
            <img src="./images/products/hrh90s/specs.png" style="width: 100%; max-width: 600px;" alt="제품 도면 및 스펙" />
        </div>
        <table style="width: 100%; max-width: 600px; margin: 0 auto; border-collapse: collapse; font-size: 14px; background: #fff;">
            <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 12px; background: #f1f5f9; font-weight: bold; width: 35%; text-align: center;">크기 (W×D×H)</td>
                <td style="padding: 12px; text-align: center;">898 × 450 × 350 mm</td>
            </tr>
            <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 12px; background: #f1f5f9; font-weight: bold; text-align: center;">주요 소재</td>
                <td style="padding: 12px; text-align: center;">스테인리스 스틸</td>
            </tr>
            <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 12px; background: #f1f5f9; font-weight: bold; text-align: center;">풍량 (CMH)</td>
                <td style="padding: 12px; text-align: center;">540 / 400 / 320</td>
            </tr>
            <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 12px; background: #f1f5f9; font-weight: bold; text-align: center;">소음 (dB)</td>
                <td style="padding: 12px; text-align: center;">50 / 43 / 40</td>
            </tr>
        </table>
    </div>

    <div style="padding: 40px 20px; text-align: center;">
        <div style="background: #fff8e1; border: 1px solid #ffe082; padding: 20px; border-radius: 8px; text-align: left; max-width: 600px; margin: 0 auto;">
            <strong style="color: #d84315; font-size: 16px;">⚠️ 안내 · 참고사항</strong>
            <p style="margin-top: 10px; font-size: 14px; color: #555; line-height: 1.5;">
                자바라(은색 배관)는 배관 연결부가 노출 안 되어 있는 현장은 기존에 사용 중인 자바라를 그대로 사용하셔야 합니다. 추가 타공이나 특수 환경의 경우 사전 고지가 필요할 수 있습니다.
            </p>
        </div>
    </div>
</div>
`;

const productId = '3b7b8c08-8991-81d4-9788-fc8014b4b82e';
const payload = {
  detail_pages: [
    {
      id: 'v1_' + Date.now(),
      title: 'AI 생성 버전 (2026.09.08)',
      html: htmlContent,
      is_active: true
    }
  ]
};

const url = 'https://belchthacupzpgxevecx.supabase.co/rest/v1/products?id=eq.' + productId;
fetch(url, {
  method: 'PATCH',
  headers: {
    'apikey': 'sb_publishable_weMvIv-69PgtXwzGlgweLg_NEJfOACN',
    'Authorization': 'Bearer sb_publishable_weMvIv-69PgtXwzGlgweLg_NEJfOACN',
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  },
  body: JSON.stringify(payload)
})
.then(r => r.json())
.then(data => {
    console.log('Successfully updated DB:', data[0].id);
})
.catch(e => console.error(e));
