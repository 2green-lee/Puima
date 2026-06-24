import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase environment variables.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function seed() {
  console.log("Seeding categories...");
  const { data: categories, error: catError } = await supabase.from('categories').insert([
    { name: '무료설명', order: 1 },
    { name: '택배배송', order: 2 },
    { name: '마스터 클래스', order: 3 },
    { name: '특강', order: 4 },
    { name: '파티시에 클래스', order: 5 }
  ]).select();

  if (catError) {
    console.error("Error inserting categories:", catError);
  } else {
    console.log("Categories seeded successfully.");
  }

  console.log("Seeding posts...");
  const { data: posts, error: postError } = await supabase.from('posts').insert([
    { title: '체리 다쿠아즈', category: '무료설명', price: '10', isSoldOut: false, status: 'public' },
    { title: '플로랑탱 3종류', category: '택배배송', price: '3200', isSoldOut: false, status: 'public' },
    { title: '포카치아', category: '마스터 클래스', price: '49900', originalPrice: '69900', isSoldOut: false, status: 'public' },
    { title: '두바이 샌드쿠키', category: '택배배송', price: '5000', isSoldOut: false, status: 'public' },
    { title: '데이지', category: '마스터 클래스', price: '39900', originalPrice: '49900', isSoldOut: false, status: 'public' },
    { title: '예. 샤르트(쉬운 버전)', category: '특강', price: '39900', isSoldOut: false, status: 'public' },
    { title: '카페 앙브레', category: '마스터 클래스', price: '49900', isSoldOut: false, status: 'public' },
    { title: '까눌레', category: '마스터 클래스', price: '49900', isSoldOut: false, status: 'public' },
    { title: '말차 쉬폰 케이크', category: '특강', price: '29900', originalPrice: '39900', isSoldOut: false, status: 'public' },
    { title: '10강 100% 피스타치오 (교차수강)', category: '파티시에 클래스', price: '39900', isSoldOut: false, status: 'public' },
    { title: '9강 마카롱 (이탈리안 머랭 vs 프렌치 머랭)', category: '파티시에 클래스', price: '39900', isSoldOut: false, status: 'public' },
    { title: '8강 사계절 파운드 (4종류)', category: '파티시에 클래스', price: '39900', isSoldOut: false, status: 'public' },
    { title: '쎄쎄 뻬쉬', category: '마스터 클래스', price: '49900', isSoldOut: false, status: 'public' },
    { title: '7강 오렌지 타르트 (홍차맛)', category: '파티시에 클래스', price: '39900', isSoldOut: false, status: 'public' },
    { title: '6강 에그타르트 & 몽블랑', category: '파티시에 클래스', price: '39900', isSoldOut: false, status: 'public' },
    { title: '5강 바닐라 무스 (무스 케이크)', category: '파티시에 클래스', price: '39900', isSoldOut: false, status: 'public' },
    { title: '유자 치즈케이크', category: '마스터 클래스', price: '49900', isSoldOut: false, status: 'public' },
    { title: '4강 파리 브레스트 (타르트 2종)', category: '파티시에 클래스', price: '39900', isSoldOut: false, status: 'public' },
    { title: '둘세 무스 케이크', category: '마스터 클래스', price: '49900', isSoldOut: false, status: 'public' },
    { title: '3강 샌드쿠키 (지앙두야 VS 수제잼)', category: '파티시에 클래스', price: '39900', isSoldOut: false, status: 'public' },
    { title: '2강 프레지에', category: '파티시에 클래스', price: '39900', isSoldOut: false, status: 'public' },
    { title: '1강 구움과자 (휘낭시에 & 마들렌)', category: '파티시에 클래스', price: '49900', isSoldOut: false, status: 'public' },
    { title: '딸기 크림치즈 타르트', category: '마스터 클래스', price: '49900', isSoldOut: false, status: 'public' },
    { title: '푸이마 휘낭시에 세트', category: '택배배송', price: '2700', originalPrice: '3000', isSoldOut: false, status: 'public' }
  ]);

  if (postError) {
    console.error("Error inserting posts:", postError);
  } else {
    console.log("Posts seeded successfully.");
  }
}

seed();
