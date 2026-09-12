-- 아파트 사전조사 및 영업 DB 스펙 테이블 (`apartment_specs`)

CREATE TABLE public.apartment_specs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  apt_name text NOT NULL, -- "아파트명 지역명" (예: 효성해링턴 내포)
  apt_type text,          -- 특성: "임대", "일반", "임대+일반 섞임"
  total_units text,       -- 세대수
  campaign_period text,   -- 전단지 영업기간 (예: 26.7.26~8.2)
  sales_count text,       -- 시공세대수 (영업실적)
  sales_revenue text,     -- 매출총액 (영업실적)
  spec_hood text,         -- 주방 후드 규격
  spec_range text,        -- 주방 레인지 (가스/인덕션)
  has_oven boolean DEFAULT false, -- 전기오븐 유무
  has_dishwasher boolean DEFAULT false, -- 식기세척기 유무
  spec_bathroom text,     -- 욕실 스펙 (타공 규격, 배관 간섭 유무, 마감판 필요 여부 등)
  post_day text,          -- 전단지 게시 지정요일
  office_phone text,      -- 관리사무소 전화번호
  next_sales_notes text,  -- 다음 영업 참조사항 및 기타 메모
  history_links jsonb,    -- 과거 시공결과보고서(사진/영상) 링크 목록
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- RLS (Row Level Security) 설정
ALTER TABLE public.apartment_specs ENABLE ROW LEVEL SECURITY;

-- 서비스 내부에서 자체 인증(admin 비밀번호)을 사용하므로, 
-- Supabase 단의 정책은 퍼블릭으로 개방하여 통신이 막히지 않도록 합니다.
CREATE POLICY "Enable read access for all users"
ON public.apartment_specs FOR SELECT
USING (true);

CREATE POLICY "Enable insert for all users"
ON public.apartment_specs FOR INSERT
WITH CHECK (true);

CREATE POLICY "Enable update for all users"
ON public.apartment_specs FOR UPDATE
USING (true);

CREATE POLICY "Enable delete for all users"
ON public.apartment_specs FOR DELETE
USING (true);
