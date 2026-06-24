-- ====================================================================
-- 001_seed_naver_products.sql
-- Description: Seeds the categories and posts (products) from Naver Smart Store
-- ====================================================================

-- 1. 카테고리 (Categories) 삽입
-- 중복 삽입 방지를 위해 ON CONFLICT 등을 사용할 수도 있으나,
-- 여기서는 초기 데이터 세팅 목적으로 바로 INSERT 합니다.
INSERT INTO public.categories (name, "order") VALUES
  ('무료설명', 1),
  ('택배배송', 2),
  ('마스터 클래스', 3),
  ('특강', 4),
  ('파티시에 클래스', 5);

-- 2. 상품 (Posts/Products) 삽입
-- 사진(이미지 URL)은 추후 관리자 페이지 등에서 직접 등록할 예정이므로 비워둡니다.
INSERT INTO public.posts (title, category, price, "originalPrice", "isSoldOut", status) VALUES
  ('체리 다쿠아즈', '무료설명', '10', NULL, false, 'public'),
  ('플로랑탱 3종류', '택배배송', '3200', NULL, false, 'public'),
  ('포카치아', '마스터 클래스', '49900', '69900', false, 'public'),
  ('두바이 샌드쿠키', '택배배송', '5000', NULL, false, 'public'),
  ('데이지', '마스터 클래스', '39900', '49900', false, 'public'),
  ('예. 샤르트(쉬운 버전)', '특강', '39900', NULL, false, 'public'),
  ('카페 앙브레', '마스터 클래스', '49900', NULL, false, 'public'),
  ('까눌레', '마스터 클래스', '49900', NULL, false, 'public'),
  ('말차 쉬폰 케이크', '특강', '29900', '39900', false, 'public'),
  ('10강 100% 피스타치오 (교차수강)', '파티시에 클래스', '39900', NULL, false, 'public'),
  ('9강 마카롱 (이탈리안 머랭 vs 프렌치 머랭)', '파티시에 클래스', '39900', NULL, false, 'public'),
  ('8강 사계절 파운드 (4종류)', '파티시에 클래스', '39900', NULL, false, 'public'),
  ('쎄쎄 뻬쉬', '마스터 클래스', '49900', NULL, false, 'public'),
  ('7강 오렌지 타르트 (홍차맛)', '파티시에 클래스', '39900', NULL, false, 'public'),
  ('6강 에그타르트 & 몽블랑', '파티시에 클래스', '39900', NULL, false, 'public'),
  ('5강 바닐라 무스 (무스 케이크)', '파티시에 클래스', '39900', NULL, false, 'public'),
  ('유자 치즈케이크', '마스터 클래스', '49900', NULL, false, 'public'),
  ('4강 파리 브레스트 (타르트 2종)', '파티시에 클래스', '39900', NULL, false, 'public'),
  ('둘세 무스 케이크', '마스터 클래스', '49900', NULL, false, 'public'),
  ('3강 샌드쿠키 (지앙두야 VS 수제잼)', '파티시에 클래스', '39900', NULL, false, 'public'),
  ('2강 프레지에', '파티시에 클래스', '39900', NULL, false, 'public'),
  ('1강 구움과자 (휘낭시에 & 마들렌)', '파티시에 클래스', '49900', NULL, false, 'public'),
  ('딸기 크림치즈 타르트', '마스터 클래스', '49900', NULL, false, 'public'),
  ('푸이마 휘낭시에 세트', '택배배송', '2700', '3000', false, 'public');
