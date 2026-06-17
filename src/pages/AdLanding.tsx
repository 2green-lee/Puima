import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router-dom";
import {
  TrendingUp,
  Award,
  Users,
  CheckCircle2,
  ChevronDown,
  ArrowRight,
  Sparkles,
  ShoppingBag,
  Clock,
  Briefcase,
  Heart,
  ChevronRight,
  Compass,
  ArrowUpRight,
  Coins,
  Camera,
  Layers,
  HelpCircle,
  MessageCircle,
  Star,
  Flame,
  MousePointerClick
} from "lucide-react";

// Types for interactivity
interface ClassCard {
  id: string;
  category: string;
  title: string;
  subtitle: string;
  badge: string;
  duration: string;
  difficulty: "초급" | "중급" | "고급";
  marginRate: string;
  price: string;
  points: string[];
}

const ALL_CLASSES: ClassCard[] = [
  {
    id: "gourmet-1",
    category: "시그니처 구움과자",
    title: "1인 매장을 위한 6종 휘낭시에 & 대량 생산 마스터클래스",
    subtitle: "해 뜰 때 오븐 돌릴 필요 없는 저녁 반죽 벌크 저온 숙성 공법과 최적의 마진율 세팅",
    badge: "매출 1위 베스트셀러",
    duration: "총 8주 과정",
    difficulty: "초급",
    marginRate: "82%",
    price: "월 49,000원",
    points: ["밀가루 최소화 아몬드 가루 황금 비율", "겉바속촉 식감을 5일간 보존하는 특급 유화 비법", "냉동 보관 후 자연 해동 세일즈 가이드"]
  },
  {
    id: "gourmet-2",
    category: "시그니처 구움과자",
    title: "글루텐프리 쌀 티라미수 & 스콘 매장 회전율 극대화 과정",
    subtitle: "밀가루 소화 불량 손님들의 재방문율을 300% 이상 올리는 시너지 레시피",
    badge: "재방문 치트키",
    duration: "총 6주 과정",
    difficulty: "초급",
    marginRate: "79%",
    price: "월 52,000원",
    points: ["국산 쌀가루 밀도 컨트롤 비법", "설탕 가공을 대체하는 천연 감미 비율", "포장 판매 유도 패키징 전략"]
  },
  {
    id: "cake-1",
    category: "하이엔드 케이크",
    title: "인스타 해시태그 폭발! 비주얼 빅토리아 & 촉촉 과일 레이어 생크림 케이크",
    subtitle: "조각당 마진액 4,500원 이상! 아이 캐칭 쇼케이스 연출법과 제철 과일 소싱 팁",
    badge: "테이블 단가 상승 견인",
    duration: "총 12주 과정",
    difficulty: "중급",
    marginRate: "75%",
    price: "월 64,000원",
    points: ["동물성 생크림 무너지지 않는 수분 가이드", "아이싱 없이도 극강의 미학을 풍기는 러프 디자인", "정교한 조각 컷팅 및 로스율 제로 보관법"]
  },
  {
    id: "cake-2",
    category: "하이엔드 케이크",
    title: "인체 무해 비건 파운드와 계절 타르트 시그니처 정공법",
    subtitle: "아토피, 알레르기 손님까지 단골로 확보하는 대안 식재료 완벽 치환 가이드",
    badge: "블루오션 개척",
    duration: "총 8주 과정",
    difficulty: "중급",
    marginRate: "78%",
    price: "월 58,000원",
    points: ["비건 달걀과 대체 버터 크림화 테크닉", "바삭한 식감을 3일 이상 보존하는 타르트 쉘", "알레르기 프리 안심 마크 마케팅 기법"]
  },
  {
    id: "marketing-1",
    category: "쇼케이스 비주얼 에셋",
    title: "1초 만에 지갑을 열게 하는 쇼케이스 레이아웃 & 테마 조명 연출 마스터리",
    subtitle: "동일 디저트도 1.5배 비싸 보이게 만드는 그리드 배치법과 아크릴 스탠딩 가이드",
    badge: "구매 전환율 보장",
    duration: "총 4주 과정",
    difficulty: "초급",
    marginRate: "90%",
    price: "월 35,000원",
    points: ["손님의 시선 흐름을 저격하는 골든존 배치", "자연광과 LED 인공조명을 활용한 보정 없는 사진 연출", "맛을 연상시키는 감성 한글 네이밍 태그 작성 공식"]
  },
  {
    id: "solution-1",
    category: "카페 원가 & 경영 솔루션",
    title: "원가율 25% 철저 방어! 스마트 원가 엑셀 계산기 및 포장 로스 세이브 캠프",
    subtitle: "버려지는 꼬투리 디저트 재활용 레시피와 도매 유통 단가 15% 낮추는 협상 전략",
    badge: "순이익률 2배 상승",
    duration: "총 5주 과정",
    difficulty: "중급",
    marginRate: "85%",
    price: "월 39,000원",
    points: ["원부자재 거래처 제안용 템플릿 제공", "포장재 일괄 공구 및 재질별 단가 매칭표", "직원 및 알바생도 3분 만에 계량하는 표준 레시피북 세팅"]
  }
];

const FAQ_ITEMS = [
  {
    question: "한 번도 오븐을 다뤄보지 않은 왕초보 카페 사장님인데 따라갈 수 있나요?",
    answer: "그럼요! 저희 과정은 복잡한 제과 이론이나 손기술 중심이 아닙니다. 계량과 타이머만 맞추면 직원이나 아르바이트생도 완전 정밀하게 똑같은 퀄리티를 낼 수 있는 '표준 매뉴얼화 레시피'를 제공합니다. 첫 날 바로 구워 판매할 수 있을 만큼 쉽고 직관적입니다."
  },
  {
    question: "카페가 많이 협소하여 보관 공간이나 대형 오븐이 없는데 수강해도 됩니까?",
    answer: "전혀 문제없습니다. 업소용 대형 데크 오븐이 없더라도 가정용 미니 컨벡션 오븐(우녹스, 스메그 등) 1대나 심지어 에어프라이어로도 동일한 겉바속촉 질감을 낼 수 있는 전용 레시피를 포함하고 있습니다. 공간을 차지하지 않는 '냉동 반죽 수면 저온 발효법'을 알려드려 최소 공간으로 최대 세일즈를 견인해 드립니다."
  },
  {
    question: "원가 분석 및 엑셀 솔루션 파일은 영구 제공되나요?",
    answer: "네, 맞습니다. 수강생 누구나 무한 다운로드 가능한 '푸이마 실시간 스마트 원가 추적용 대시보드 시트'가 평생 라이선스로 제공됩니다. 향후 밀가루, 버터 등 원자재 가격이 요동칠 때마다 실시간으로 조각당 최적의 판가를 자동 계산해주는 시스템입니다."
  },
  {
    question: "이 커리큘럼을 이수한 다른 점주들의 실제 성과는 어떤 수준인가요?",
    answer: "성수, 마포, 대구, 부산 등의 95명 이상의 개인 점주분들이 이 과정을 마쳤습니다. 음료 단일 메뉴로 객단가 4,000원에 머물던 카페들이 조각 케이크 및 구움과자 콤보 세트를 전면에 내세워 평균 객단가 11,200원으로 돌파했으며, 디저트 도입 후 매장 순이익률이 최소 2.5배에서 최고 4배까지 치솟아 기존 적자 매장을 성수기 흑자로 즉각 전환하는 쾌거를 거뒀습니다."
  },
  {
    question: "마케팅 사진도 휴대폰으로만 찍는데 감성 인스타 샷 촬영이 가능한가요?",
    answer: "물론입니다. 수 천만 원 상당의 고급 카메라 대신 사장님의 스마트폰 기본 카메라의 숨겨진 프로 모드 셋팅, 아크릴 판과 보정 필터 단 1개를 사용해 자연 보정하는 3가지 조명 각도법을 알려 드립니다. 손님들이 저절로 찍어서 해시태그로 홍보해주도록 비주얼 쇼케이스를 브랜딩하는 기술도 덤으로 가르쳐 드립니다."
  }
];

export default function AdLanding() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>("전체");
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  // Filter cards based on tab selection
  const filteredClasses = activeTab === "전체" 
    ? ALL_CLASSES 
    : ALL_CLASSES.filter(c => c.category === activeTab);

  const tabs = ["전체", "시그니처 구움과자", "하이엔드 케이크", "쇼케이스 비주얼 에셋", "카페 원가 & 경영 솔루션"];

  return (
    <div className="bg-[#FCFCFC] min-h-screen font-sans text-zinc-900 selection:bg-violet-600 selection:text-white" id="ad-root">
      {/* Dynamic Top Floating Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-400 via-purple-500 to-indigo-600 z-[1000] shadow-sm"></div>

      {/* Modern Compact Global Navigation Header (Mimics Codeit sprint navbar) */}
      <header className="sticky top-1 left-0 right-0 bg-white/80 backdrop-blur-md border-b border-zinc-100 z-50 px-4 md:px-12 py-3.5 flex items-center justify-between" id="ad-header">
        <div className="flex items-center gap-8">
          <button 
            onClick={() => navigate("/")} 
            className="text-lg font-black tracking-tighter text-zinc-950 flex items-center gap-1.5 focus:outline-none"
          >
            <span className="bg-gradient-to-br from-violet-600 to-indigo-700 text-white w-7 h-7 inline-flex items-center justify-center rounded-xl font-bold font-serif text-sm">F</span>
            <span className="font-extrabold tracking-wide text-sm font-sans">FUIMA <span className="text-violet-600 text-xs font-black tracking-widest uppercase ml-0.5">sprint</span></span>
          </button>
          
          <nav className="hidden md:flex items-center gap-6">
            <a href="#classes-section" className="text-xs text-zinc-500 hover:text-zinc-900 transition-colors font-semibold">베킹 카탈로그</a>
            <a href="#testimonials-section" className="text-xs text-zinc-500 hover:text-zinc-900 transition-colors font-semibold">동료 성공사례</a>
            <a href="#stats-section" className="text-xs text-zinc-500 hover:text-zinc-900 transition-colors font-semibold">성장 지표</a>
            <a href="#why-sprint-section" className="text-xs text-zinc-500 hover:text-zinc-900 transition-colors font-semibold">부트캠프 강점</a>
            <a href="#benefits-section" className="text-xs text-zinc-500 hover:text-zinc-900 transition-colors font-semibold">한정 혜택</a>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate("/")}
            className="text-xs text-zinc-650 hover:text-black font-semibold tracking-tight transition-all py-1.5 px-3 rounded-lg hover:bg-zinc-50"
          >
            일반 마스터클래스 홈
          </button>
          <button 
            onClick={() => navigate("/my-classes")}
            className="bg-violet-50 hover:bg-violet-100/80 text-violet-700 text-xs font-bold px-4 py-2 rounded-xl transition-all"
          >
            클래스 대시보드
          </button>
        </div>
      </header>

      {/* Main Main Content Container */}
      <div className="max-w-[1240px] mx-auto px-4 md:px-8 pt-10" id="ad-content-wrapper">
        
        {/* ========================================================== */}
        {/* SECTION 1: HERO LANDING BANNER SECTION */}
        {/* ========================================================== */}
        <section className="py-16 md:py-24 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center border-b border-zinc-100/80" id="ad-hero">
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-violet-50 border border-violet-100/60 rounded-full text-violet-700 shrink-0">
              <span className="flex h-2 w-2 rounded-full bg-violet-600 animate-pulse"></span>
              <span className="text-[11px] font-black tracking-wider uppercase">점주 전용 매출 돌파 부트캠프</span>
            </div>
            
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[54px] font-extrabold leading-[1.12] text-zinc-950 tracking-tight font-sans">
              압도적 만족도의 <br />
              <span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">카페 매출 돌파</span> <br className="hidden sm:block" />
              푸이마 베이킹 스프린트
            </h1>
            
            <p className="text-sm md:text-base text-zinc-500 max-w-xl leading-relaxed font-medium">
              매일 똑같이 들어가는 원두값 걱정에 애가 타시나요? 가성비 저가 프랜차이즈 공세에 손님이 뜸하신가요? 매출을 바꾸는 돌파구는 저렴한 커피가 아닌, <span className="text-zinc-900 font-bold underline decoration-violet-400 decoration-2 underline-offset-4">단골 손님이 줄 서서 사 가는 '시그니처 디저트'</span> 단 한 가지뿐입니다.
            </p>

            <div className="pt-4 flex flex-col sm:flex-row gap-3.5">
              <a 
                href="#classes-section"
                className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-2xl px-8 py-4 text-sm font-black tracking-tight shadow-md hover:shadow-lg active:scale-98 transition-all hover:translate-y-[-1px]"
              >
                <span>매출 돌파 패키지 신청하기</span>
                <ArrowRight size={16} />
              </a>
              <a 
                href="#testimonials-section"
                className="inline-flex items-center justify-center gap-2 bg-white border border-zinc-200 hover:border-zinc-400 hover:bg-zinc-50/70 text-zinc-700 rounded-2xl px-6 py-4 text-sm font-semibold tracking-tight transition-all"
              >
                <span>점주 생생 후기 읽기</span>
                <ChevronRight size={16} />
              </a>
            </div>

            <div className="pt-6 grid grid-cols-3 gap-6 border-t border-zinc-100 max-w-lg">
              <div className="text-left">
                <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">누적 수강생</p>
                <p className="text-xl font-extrabold text-zinc-900 mt-1">1,240명+</p>
              </div>
              <div className="text-left">
                <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">레시피 보존 만족도</p>
                <p className="text-xl font-extrabold text-indigo-600 mt-1">99.4%</p>
              </div>
              <div className="text-left">
                <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">평균 마진율</p>
                <p className="text-xl font-extrabold text-violet-600 mt-1">78.5%</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1"></div>

          {/* Right graphics mockup reflecting premium bakery visual representation */}
          <div className="lg:col-span-4 relative mt-6 lg:mt-0">
            <div className="absolute -inset-2 bg-gradient-to-r from-violet-200/40 to-indigo-200/40 rounded-[36px] blur-xl opacity-80 -z-10"></div>
            <div className="bg-white border border-zinc-150 rounded-[32px] p-6 shadow-xl relative overflow-hidden flex flex-col gap-6 text-left">
              {/* Bakery Tag badge */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-indigo-500"></div>
                  <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-zinc-400">SIGNATURE LINEUP</span>
                </div>
                <span className="bg-violet-50 text-violet-750 text-[10px] font-black tracking-widest px-2 py-0.5 rounded-full uppercase">NEW BREAKTHROUGH</span>
              </div>

              {/* Mockup Recipe Item Card */}
              <div className="bg-zinc-50/60 rounded-2xl p-4 border border-zinc-100 flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-sm font-extrabold text-zinc-900">골드 얼그레이 무화과 마들렌</h4>
                    <p className="text-[10px] text-zinc-450 font-medium">숙성 마들렌 반죽기 전용 꿀조합 양식 비법</p>
                  </div>
                  <span className="text-xs font-black text-violet-600 bg-white border border-violet-100 px-2 py-0.5 rounded-lg">마진 82%</span>
                </div>
                
                <div className="space-y-1.5 pt-1 border-t border-zinc-200/70">
                  <div className="flex items-center gap-1.5 text-[10px] text-zinc-650 font-medium">
                    <CheckCircle2 size={11} className="text-violet-500 shrink-0" />
                    <span>황동틀이 아닌 기본 실리콘틀 완벽 구현</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-zinc-650 font-medium">
                    <CheckCircle2 size={11} className="text-violet-500 shrink-0" />
                    <span>실온 밀폐 보관 5일에도 촉촉 유지 비결</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-zinc-650 font-medium">
                    <CheckCircle2 size={11} className="text-violet-500 shrink-0" />
                    <span>조개 배꼽 높게 솟구치는 급열 테크닉</span>
                  </div>
                </div>
              </div>

              {/* Graphic stats diagram */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold text-zinc-800">
                  <span>커피 단일 마진 구조</span>
                  <span>디저트 콤보 도입 후 마진구조</span>
                </div>
                
                <div className="grid grid-cols-2 gap-2 h-20 items-end">
                  <div className="bg-zinc-150 h-10 w-full rounded-t-xl relative group flex justify-center">
                    <span className="absolute -top-5 text-[10px] font-bold text-zinc-400">4,000원</span>
                    <span className="text-[9px] text-zinc-450 font-black tracking-tight mt-auto pb-1 mb-1">커피만</span>
                  </div>
                  <div className="bg-gradient-to-t from-violet-600 to-indigo-500 h-20 w-full rounded-t-xl relative flex justify-center">
                    <span className="absolute -top-5 text-[10px] font-bold text-violet-600">11,200원</span>
                    <span className="text-[9px] text-white font-black tracking-tight mt-auto pb-1 mb-1">시그니처 콤보</span>
                  </div>
                </div>
              </div>

              {/* Interactive cursor element */}
              <div className="flex items-center gap-3 border-t border-zinc-100 pt-3">
                <div className="h-8 w-8 rounded-full bg-zinc-100 flex items-center justify-center shrink-0">
                  <Flame size={14} className="text-amber-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-zinc-400 uppercase font-black tracking-wider leading-none">REALTIME HOT ISSUE</p>
                  <p className="text-xs text-zinc-800 font-bold truncate mt-1">대구 카페, 디저트 세팅 3주 만에 평일 전석 만석 달성</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================== */}
        {/* SECTION 2: CATEGORY FILTERING INTERACTIVE TABS & CARDS */}
        {/* ========================================================== */}
        <section className="py-20 border-b border-zinc-100/80" id="classes-section">
          <div className="max-w-2xl mx-auto text-center space-y-4 mb-16">
            <span className="text-[10px] bg-zinc-100 text-zinc-650 border border-zinc-200 font-black tracking-widest uppercase px-3 py-1 rounded-full">
              Baking Sprint Selection
            </span>
            <h2 className="text-3xl font-extrabold tracking-tight text-zinc-950 sm:text-4xl">
              카페 매출 돌파구를 위한 맞춤형 커리큘럼
            </h2>
            <p className="text-xs sm:text-sm text-zinc-500 leading-relaxed font-semibold max-w-lg mx-auto">
              사장님의 한정된 리소스와 현재 매장의 크기, 장비 보관고 상태에 맞는 최적의 주차별 교육 과정을 필터링하여 확인해 보세요.
            </p>
          </div>

          {/* Responsive custom-designed tabs */}
          <div className="flex flex-wrap justify-center gap-1.5 md:gap-2 mb-12">
            {tabs.map((tab) => {
              const isSelected = activeTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2.5 rounded-full text-xs font-bold tracking-tight transition-all cursor-pointer ${
                    isSelected
                      ? "bg-violet-600 text-white shadow-md shadow-violet-200"
                      : "bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-650"
                  }`}
                >
                  {tab}
                </button>
              );
            })}
          </div>

          {/* Cards Grid dynamically updating with Animation */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="classes-grid">
            <AnimatePresence mode="popLayout">
              {filteredClasses.map((item) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.98, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98, y: 15 }}
                  transition={{ duration: 0.3 }}
                  key={item.id}
                  className="bg-white border border-zinc-150 rounded-3xl p-6 hover:shadow-xl hover:border-violet-200 transition-all flex flex-col justify-between text-left group"
                >
                  <div className="space-y-4">
                    {/* Upper Category and Badge row */}
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-zinc-400 font-bold uppercase tracking-wider">{item.category}</span>
                      <span className="bg-violet-50 text-violet-700 border border-violet-100/40 text-[9px] font-extrabold px-2.5 py-0.5 rounded-lg">{item.badge}</span>
                    </div>

                    {/* Class title & Subtitle */}
                    <div className="space-y-1.5">
                      <h3 className="text-base font-extrabold hover:text-violet-600 transition-colors text-zinc-900 leading-snug">
                        {item.title}
                      </h3>
                      <p className="text-xs text-zinc-450 leading-relaxed font-semibold">
                        {item.subtitle}
                      </p>
                    </div>

                    {/* Core standard bullet targets */}
                    <div className="space-y-2 pt-3 border-t border-zinc-100">
                      <p className="text-[10px] uppercase tracking-wider font-extrabold text-zinc-400">교안 핵심 가이드</p>
                      {item.points.map((pt, index) => (
                        <div key={index} className="flex items-start gap-1.5 text-xs text-zinc-650">
                          <CheckCircle2 size={13} className="text-violet-500 shrink-0 mt-0.5" />
                          <span className="font-medium">{pt}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Pricing and Details CTA bottom bar */}
                  <div className="pt-6 mt-6 border-t border-zinc-100 space-y-4">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 text-zinc-400">
                        <Clock size={12} />
                        <span className="font-bold">{item.duration}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-zinc-400">난이도: <strong className="text-zinc-700">{item.difficulty}</strong></span>
                        <span className="bg-zinc-100 text-zinc-600 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase">핵심마진 {item.marginRate}</span>
                      </div>
                    </div>

                    <button 
                      onClick={() => navigate("/my-classes")}
                      className="w-full inline-flex items-center justify-center gap-2 bg-zinc-50 hover:bg-violet-600 text-zinc-800 hover:text-white border border-zinc-150 group-hover:border-violet-300 rounded-2xl py-3.5 text-xs font-black tracking-wide uppercase transition-all"
                    >
                      <span>수강 신청 및 상세안내</span>
                      <ArrowUpRight size={14} className="opacity-60 group-hover:opacity-100 transition-all group-hover:translate-x-0.5" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </section>

        {/* ========================================================== */}
        {/* SECTION 3: STUDENT TESTIMONIALS SECTION */}
        {/* ========================================================== */}
        <section className="py-20 border-b border-zinc-100/80 text-left" id="testimonials-section">
          <div className="max-w-xl text-left space-y-4 mb-16">
            <span className="text-[10px] bg-zinc-100 text-indigo-650 border border-zinc-200 font-black tracking-widest uppercase px-3 py-1 rounded-full">
              Success Stories
            </span>
            <h2 className="text-3xl font-extrabold tracking-tight text-zinc-950 sm:text-4xl">
              어려움을 겪던 사장님들이 <br />직접 수치로 보여주는 실전 증명서
            </h2>
            <p className="text-xs sm:text-sm text-zinc-500 leading-relaxed font-semibold">
              커피 단가 싸움과 가성비 경쟁에 뒤처져 폐업 직전 기로에서 시그니처 베이킹 디저트로 돌파구를 찾은 실제 카페 점주분들의 리얼 성장기입니다.
            </p>
          </div>

          {/* Master Main Feature Testimonial Card */}
          <div className="bg-zinc-50/50 rounded-3xl border border-zinc-150 p-6 md:p-10 mb-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Visual illustrative portrait placeholder */}
            <div className="lg:col-span-4 relative h-64 lg:h-80 bg-gradient-to-tr from-violet-200/50 to-indigo-150/40 rounded-2xl border border-zinc-150 overflow-hidden flex flex-col justify-end p-6">
              <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 border border-zinc-150/70 rounded-full flex items-center gap-1.5">
                <Users size={12} className="text-violet-600" />
                <span className="text-[10px] font-extrabold text-zinc-800 mt-0.5">성수동 개인카페 S사 사장님</span>
              </div>
              <div className="relative space-y-2 text-left z-10 z-[2]">
                <p className="text-2xl font-black text-zinc-900 leading-none">월 평균 매출</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-semibold text-zinc-400 line-through">420만원</span>
                  <span className="text-2xl font-black text-violet-600">→ 1,650만원 달성</span>
                </div>
              </div>
              {/* Subtle visual styling */}
              <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent opacity-80 pointer-events-none"></div>
            </div>

            {/* Testimonial written block */}
            <div className="lg:col-span-8 space-y-6">
              <div className="flex gap-1.5 text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={16} fill="currentColor" />
                ))}
              </div>
              
              <blockquote className="text-lg md:text-xl font-extrabold text-zinc-950 leading-snug">
                "옆집에 대형 프랜차이즈가 들어오고 아메리카노 1,500원 경쟁에 휘쓸렸을 땐 잠 한 숨 못잤습니다. 푸이마 시그니처 휘낭시에 레시피와 쇼케이스 마케팅 솔루션을 속는 셈 치고 전면 도입한 지 일주일 만에, 디저트 콤보 판매로 일 매출 50만 원선을 드디어 안전하게 안착시켰습니다. 이제 매출의 70%가 디저트에서 나와요!"
              </blockquote>

              <div className="border-t border-zinc-200/70 pt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h5 className="text-xs font-black text-zinc-900">김지영 (성수동 디저트테마 S카페 운영, 수강 28주차)</h5>
                  <p className="text-[10px] text-zinc-450 mt-1 font-semibold">24년 8월 실무 마스터클래스 합류, 도입 3달 만에 일평균 객단가 12,200원 달성</p>
                </div>
                <button
                  onClick={() => navigate("/my-classes")}
                  className="bg-white hover:border-black border border-zinc-200 text-zinc-800 text-[11px] font-black tracking-widest px-4 py-2.5 rounded-xl uppercase transition-all"
                >
                  지영님의 도입 일지 맛보기
                </button>
              </div>
            </div>
          </div>

          {/* Secondary smaller grid rows */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white border border-zinc-150 rounded-2xl p-6 relative">
              <span className="absolute -top-3.5 left-4 bg-zinc-100 text-zinc-650 border border-zinc-200/60 text-[9px] font-extrabold px-3 py-1 rounded-full">
                1인 브런치 카페, 연남동
              </span>
              <p className="text-xs text-zinc-500 leading-relaxed font-semibold mt-4 mb-4">
                "대량 생산 숙성 반죽법 덕분에 1인 카페인데도 일찌감치 출근할 필요가 없어요. 반죽 숙성해뒀다 출근해서 오븐 타이머만 누르면 끝입니다. 피로도가 반으로 줄면서 디저트 종류는 다양하게 늘렸습니다."
              </p>
              <div className="pt-3 border-t border-zinc-100 text-[10px]">
                <strong className="text-zinc-850 font-extrabold block">박승규 사장님 (B* 카페)</strong>
                <span className="text-zinc-400 mt-1 block">휘낭시에 & 원가 마스터 수강</span>
              </div>
            </div>

            <div className="bg-white border border-zinc-150 rounded-2xl p-6 relative">
              <span className="absolute -top-3.5 left-4 bg-zinc-100 text-zinc-650 border border-zinc-200/60 text-[9px] font-extrabold px-3 py-1 rounded-full">
                동네 후미진 골목 매장, 인천
              </span>
              <p className="text-xs text-zinc-500 leading-relaxed font-semibold mt-4 mb-4">
                "쇼케이스 조명 각도와 트렌디한 한글 이름 태그 배치 솔루션 하나만으로, 기존 마른 과자처럼 보이던 생토노레 타르트가 하루 30통 예약 판매 완판 신화를 달성했습니다. 자리가 안 좋아도 맛과 비주얼이면 찾아옵니다."
              </p>
              <div className="pt-3 border-t border-zinc-100 text-[10px]">
                <strong className="text-zinc-850 font-extrabold block">이나경 파티시에 (카페 나경)</strong>
                <span className="text-zinc-400 mt-1 block">비주얼 에셋 & 타르트 클래스 수강</span>
              </div>
            </div>

            <div className="bg-white border border-zinc-150 rounded-2xl p-6 relative">
              <span className="absolute -top-3.5 left-4 bg-zinc-100 text-zinc-650 border border-zinc-200/60 text-[9px] font-extrabold px-3 py-1 rounded-full">
                적자 매장 생존기, 울산
              </span>
              <p className="text-xs text-zinc-500 leading-relaxed font-semibold mt-4 mb-4">
                "원가 엑셀 도매 분석법을 활용해서 버터와 크림치즈 공급처를 15% 저렴한 도매 센터로 전환했고 버려지던 반죽 마진 로스율도 0%로 줄였습니다. 드디어 정산 시 마진 걱정 없는 안전 매장이 되었습니다!"
              </p>
              <div className="pt-3 border-t border-zinc-100 text-[10px]">
                <strong className="text-zinc-850 font-extrabold block">최한길 사장님 (브레드 앤 코)</strong>
                <span className="text-zinc-400 mt-1 block">원가 경영 & 포장 로스 수강</span>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================== */}
        {/* SECTION 4: HIGH-IMPACT STATS BLOCK */}
        {/* ========================================================== */}
        <section className="py-20 bg-zinc-50/50 rounded-[48px] border border-zinc-150 px-6 sm:px-12 text-center" id="stats-section">
          <div className="max-w-xl mx-auto space-y-4 mb-14">
            <span className="text-[10px] bg-white text-violet-750 border border-violet-100 font-black tracking-widest uppercase px-3 py-1 rounded-full">
              Verified Achievement Index
            </span>
            <h2 className="text-3xl font-extrabold text-zinc-950">
              압도적인 성장 수치로 <br className="sm:hidden" />증명된 디저트 매출 성과
            </h2>
            <p className="text-xs text-zinc-450 leading-relaxed font-semibold max-w-sm mx-auto">
              수강생 1,240인의 종합적인 실제 매장 원장과 판매 지표 분석을 통해 나타난 성과 지표입니다.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-4 max-w-4xl mx-auto">
            <div className="space-y-2 text-center">
              <p className="text-zinc-400 text-xs font-bold uppercase tracking-wider">평균 디저트 마진율</p>
              <div className="text-5xl md:text-6xl font-black text-zinc-950 tracking-tighter flex items-center justify-center">
                78<span className="text-violet-600">%</span>
              </div>
              <p className="text-[11px] text-zinc-450 font-semibold">커피 40%대 대비 2배 수준</p>
            </div>

            <div className="space-y-2 text-center border-y md:border-y-0 md:border-x border-zinc-200/70 py-6 md:py-0">
              <p className="text-zinc-400 text-xs font-bold uppercase tracking-wider">평균 테이블 객단가</p>
              <div className="text-5xl md:text-6xl font-black text-violet-600 tracking-tighter flex items-center justify-center">
                210<span className="text-zinc-950">%</span>
              </div>
              <p className="text-[11px] text-zinc-450 font-semibold">음료 세트 콤보 판매 극대화율</p>
            </div>

            <div className="space-y-2 text-center">
              <p className="text-zinc-400 text-xs font-bold uppercase tracking-wider">레시피 현장 정착률</p>
              <div className="text-5xl md:text-6xl font-black text-indigo-650 tracking-tighter flex items-center justify-center">
                98<span className="text-zinc-950">%</span>
              </div>
              <p className="text-[11px] text-zinc-450 font-semibold">왕초보 점주의 실무 안착 성공률</p>
            </div>
          </div>
        </section>

        {/* ========================================================== */}
        {/* SECTION 5: WHY CHOOSE US (스프린트 강점) */}
        {/* ========================================================== */}
        <section className="py-24 border-b border-zinc-100/80 text-left" id="why-sprint-section">
          <div className="max-w-xl space-y-3 mb-16">
            <span className="text-[10px] bg-zinc-100 text-zinc-650 border border-zinc-200 font-black tracking-widest uppercase px-3 py-1 rounded-full">
              Our Exclusive Strengths
            </span>
            <h2 className="text-3xl font-extrabold text-zinc-950 sm:text-4xl">
              푸이마 스프린트가 자신하는 <br />성공할 수밖에 없는 5가지 핵심 이유
            </h2>
            <p className="text-xs sm:text-sm text-zinc-500 font-semibold leading-relaxed">
              기존의 일반 요리학원, 취미 제과 교실의 번거로운 실습으로는 실제 매장 운영과 매출을 바꿀 수 없습니다. 오직 매장의 지속가능성과 마진 창출만 보고 보강된 실전형 밀착 케어입니다.
            </p>
          </div>

          <div className="space-y-12 max-w-4xl">
            {/* Reason 1 */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 items-start border-l-2 border-zinc-200 pl-6 hover:border-violet-600 transition-colors">
              <div className="md:col-span-3">
                <span className="text-xs font-mono font-black text-violet-600 tracking-widest block uppercase">REASON 01</span>
                <h4 className="text-lg font-black text-zinc-900 mt-2">트렌드 분석 커리큘럼</h4>
              </div>
              <div className="md:col-span-9 space-y-2">
                <p className="text-sm font-bold text-zinc-800">미각 트렌드를 분석한 100% 매장 친화적인 자체 개발 리얼 레시피</p>
                <p className="text-xs text-zinc-500 leading-relaxed font-medium">
                  일반 요리학원의 오래된 클래식 무스 레시피는 손이 가고 손실률이 높습니다. 저희는 성수, 한남동 팝업에서 솔드아웃 대란을 기록한 식감 트렌드를 계량화하여 즉시 팔릴 수 있는 고부가가치 레시피로만 구성했습니다.
                </p>
              </div>
            </div>

            {/* Reason 2 */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 items-start border-l-2 border-zinc-200 pl-6 hover:border-violet-600 transition-colors">
              <div className="md:col-span-3">
                <span className="text-xs font-mono font-black text-violet-600 tracking-widest block uppercase">REASON 02</span>
                <h4 className="text-lg font-black text-zinc-900 mt-2">대량 생산 최적 가이드</h4>
              </div>
              <div className="md:col-span-9 space-y-2">
                <p className="text-sm font-bold text-zinc-800">1인 카페 점주를 구제하는 안심 저온 저녁 벌크 반죽기법</p>
                <p className="text-xs text-zinc-500 leading-relaxed font-medium">
                  새벽 4시에 출근해 빵을 구워야 하는 고난 가득한 생태계를 고쳤습니다. 수면 숙성 공법을 통해 전날 마감 전 15분 반죽 후 냉동 보관된 마들렌과 스콘을 출근 직후 즉시 예열 구움하여 오븐 돌리는 편리한 일과표를 직접 이식해 드립니다.
                </p>
              </div>
            </div>

            {/* Reason 3 */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 items-start border-l-2 border-zinc-200 pl-6 hover:border-violet-600 transition-colors">
              <div className="md:col-span-3">
                <span className="text-xs font-mono font-black text-violet-600 tracking-widest block uppercase">REASON 03</span>
                <h4 className="text-lg font-black text-zinc-900 mt-2">1:1 카페 쇼케이스 케어</h4>
              </div>
              <div className="md:col-span-9 space-y-2">
                <p className="text-sm font-bold text-zinc-800">인스타 브랜딩 & 전용 메뉴판 작명 솔루션 컨설팅</p>
                <p className="text-xs text-zinc-500 leading-relaxed font-medium">
                  아무리 맛있는 디저트도 쇼케이스 한구석에 이름표 없이 무심히 올려놓으면 먼지만 쌓입니다. 손님들이 직관적으로 고급 식감을 인지하는 감정 한글 카피라이팅 기법과 눈을 사로잡는 아크릴 거치 구조를 일러스트 세팅해 드립니다.
                </p>
              </div>
            </div>

            {/* Reason 4 */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 items-start border-l-2 border-zinc-200 pl-6 hover:border-violet-600 transition-colors">
              <div className="md:col-span-3">
                <span className="text-xs font-mono font-black text-violet-600 tracking-widest block uppercase">REASON 04</span>
                <h4 className="text-lg font-black text-zinc-900 mt-2">수료 후 유통 단가 보 보장</h4>
              </div>
              <div className="md:col-span-9 space-y-2">
                <p className="text-sm font-bold text-zinc-800">품질 타협 없는 원부자재 도매 직공급 링크 개방</p>
                <p className="text-xs text-zinc-500 leading-relaxed font-medium">
                  수입 버터, 프랑스 소금 등 식재료 비용 폭등으로부터 안전을 점주를 보위하기 위해 보급 단가 링크를 특별 우대 개설했습니다. 정기 회원권을 가진 수강생들은 중대형 도매 가격 수준으로 프랑스 버터와 풍부한 크림 원자재를 15% 감가된 채로 우대 링크 공급받습니다.
                </p>
              </div>
            </div>

            {/* Reason 5 */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 items-start border-l-2 border-zinc-200 pl-6 hover:border-violet-600 transition-colors">
              <div className="md:col-span-3">
                <span className="text-xs font-mono font-black text-violet-600 tracking-widest block uppercase">REASON 05</span>
                <h4 className="text-lg font-black text-zinc-900 mt-2">동료 밀착 피드백망</h4>
              </div>
              <div className="md:col-span-9 space-y-2">
                <p className="text-sm font-bold text-zinc-800">함께 고민을 헤쳐 나갈 든든한 정기 점주 네트워크 운영</p>
                <p className="text-xs text-zinc-500 leading-relaxed font-medium">
                  홀로 외롭게 카페를 운영하며 속앓이할 필요가 없습니다. 카카오톡 실시간 고민 단톡방과 디저트 회전 솔루션 세미나를 정기 오픈하여 타지 점주들의 우수 매대 연출 모범사례나 소량 공구 소식들을 발 빠르게 나누는 거대한 길잡이가 되어 드립니다.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================== */}
        {/* SECTION 6: LIMITED BENEFITS FOR SPRINTERS */}
        {/* ========================================================== */}
        <section className="py-20 border-b border-zinc-100/80 text-center relative" id="benefits-section">
          {/* Subtle light glowing decor */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-indigo-50/50 rounded-full blur-3xl opacity-60 -z-10 pointer-events-none"></div>

          <div className="max-w-xl mx-auto space-y-4 mb-16">
            <span className="text-[10px] bg-violet-50 text-violet-750 border border-violet-100/50 font-black tracking-widest uppercase px-3 py-1 rounded-full">
              Exclusive Members Benefit
            </span>
            <h2 className="text-3xl font-extrabold text-zinc-950">
              더욱 확실한 매출 폭발을 돕는 <br />푸이마 클래스 한정 특별 증정 혜택
            </h2>
            <p className="text-xs text-zinc-500 leading-relaxed font-semibold">
              수강 신청 즉시 평생 무료 보존 가능한 핵심 에셋 툴을 전부 사장님의 주머니 속에 세팅해 드립니다.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
            <div className="bg-white hover:bg-zinc-50/50 border border-zinc-150 rounded-2xl p-6 text-left space-y-4 transition-all hover:scale-101 shadow-sm">
              <div className="h-10 w-10 bg-violet-50 rounded-xl flex items-center justify-center">
                <Coins size={18} className="text-violet-600" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-black text-zinc-900">실시간 원가 자동계산기</h4>
                <p className="text-[10.5px] text-zinc-500 leading-relaxed font-semibold">
                  계란 하나, 버터 가격이 바뀔 때마다 조각당 최적의 타겟 판가와 마진을 실시간 변환 추척하는 영구 스프레드시트 제공
                </p>
              </div>
            </div>

            <div className="bg-white hover:bg-zinc-50/50 border border-zinc-150 rounded-2xl p-6 text-left space-y-4 transition-all hover:scale-101 shadow-sm">
              <div className="h-10 w-10 bg-violet-50 rounded-xl flex items-center justify-center">
                <Camera size={18} className="text-violet-600" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-black text-zinc-900">디저트 인스타 폰카 셋팅법</h4>
                <p className="text-[10.5px] text-zinc-500 leading-relaxed font-semibold">
                  무보정으로도 미각을 자극하는 조명 각도, 스마트폰 프로 모드를 이용한 조리개 감도 컨트롤 비밀 소책자 파일
                </p>
              </div>
            </div>

            <div className="bg-white hover:bg-zinc-50/50 border border-zinc-150 rounded-2xl p-6 text-left space-y-4 transition-all hover:scale-101 shadow-sm">
              <div className="h-10 w-10 bg-violet-50 rounded-xl flex items-center justify-center">
                <Layers size={18} className="text-violet-600" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-black text-zinc-900">도매 공구 커뮤니티 평생 수강</h4>
                <p className="text-[10.5px] text-zinc-500 leading-relaxed font-semibold">
                  단 한 명이 사더라도 공동 소싱하여 프랑스 고메 버터, 동물성 수크레 크림치즈 등을 직구가에 공급하는 연합체 진입권
                </p>
              </div>
            </div>

            <div className="bg-white hover:bg-zinc-50/50 border border-zinc-150 rounded-2xl p-6 text-left space-y-4 transition-all hover:scale-101 shadow-sm">
              <div className="h-10 w-10 bg-violet-50 rounded-xl flex items-center justify-center">
                <MessageCircle size={18} className="text-violet-600" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-black text-zinc-900">카카오톡 1:1 디렉팅 피드백</h4>
                <p className="text-[10.5px] text-zinc-500 leading-relaxed font-semibold">
                  구워본 디저트의 구움색, 조개 배꼽 상태, 부피 팽창 상태를 사진으로 보내주시면 강사가 5분 내 진단 교정하는 안심 구원 패널
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================== */}
        {/* SECTION 7: CURRICULUM INSIGHT TASTERS */}
        {/* ========================================================== */}
        <section className="py-20 border-b border-zinc-100/80 text-left" id="insights-section">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
            <div>
              <span className="text-[10px] bg-zinc-100 text-zinc-650 border border-zinc-200 font-black tracking-widest uppercase px-3 py-1 rounded-full">
                Pre-View Insights
              </span>
              <h2 className="text-3xl font-extrabold tracking-tight text-zinc-950 mt-4">
                매장 인사이트 미리 맛보기
              </h2>
              <p className="text-xs sm:text-sm text-zinc-500 font-semibold mt-1">
                수강 신청 전에 일부 알짜배기 극비 상식 전략을 간결하게 미리 제공해 드립니다.
              </p>
            </div>
            
            <button 
              onClick={() => navigate("/my-classes")}
              className="bg-black hover:bg-zinc-800 text-white text-[11px] font-black tracking-widest px-6 py-4 rounded-xl uppercase transition-all whitespace-nowrap self-start md:self-auto shrink-0"
            >
              전체 맛보기 레시피 열람하기
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Guide Item 1 */}
            <div className="bg-white border border-zinc-150 rounded-2xl p-5 hover:border-zinc-300 transition-all shadow-sm flex flex-col justify-between">
              <div className="space-y-4">
                <div className="h-32 bg-zinc-50 rounded-xl relative overflow-hidden p-4 flex flex-col justify-end">
                  <span className="absolute top-2.5 left-2.5 bg-violet-50 border border-violet-100 text-violet-750 text-[9px] font-extrabold px-2 py-0.5 rounded">HOT INSIGHT</span>
                  <p className="text-xs font-black text-zinc-800 leading-tight">테이블 단가를 올리는 쇼케이스 디저트 홀딩 연출법</p>
                </div>
                <p className="text-xs font-semibold text-zinc-500 leading-relaxed">
                  결제 카운터 바로 옆 25cm 거리에 금빛 보정 웜 화이트 LED를 비추며 시그니처 휘낭시에의 조개 배꼽을 위풍당당하게 세워 두세요. 주문을 한 손님들 중 48.4%가 무의식중에 음료와 함께 추가 디저트 1개를 지목하게 됩니다.
                </p>
              </div>
              <div className="pt-4 border-t border-zinc-100 mt-4 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[10px] text-zinc-400">
                  <Clock size={11} />
                  <span>읽는 데 2분</span>
                </div>
                <span className="text-xs font-bold text-zinc-900 inline-flex items-center gap-1 group cursor-pointer hover:text-violet-600 transition-all">
                  <span>읽기</span>
                  <ChevronRight size={13} className="group-hover:translate-x-0.5 transition-all" />
                </span>
              </div>
            </div>

            {/* Guide Item 2 */}
            <div className="bg-white border border-zinc-150 rounded-2xl p-5 hover:border-zinc-300 transition-all shadow-sm flex flex-col justify-between">
              <div className="space-y-4">
                <div className="h-32 bg-zinc-50 rounded-xl relative overflow-hidden p-4 flex flex-col justify-end">
                  <span className="absolute top-2.5 left-2.5 bg-amber-50 border border-amber-100 text-amber-750 text-[9px] font-extrabold px-2 py-0.5 rounded">원가 사수 꿀팁</span>
                  <p className="text-xs font-black text-zinc-800 leading-tight">마진 사수를 위한 도매 원재료 15% 감가 정산법</p>
                </div>
                <p className="text-xs font-semibold text-zinc-500 leading-relaxed">
                  네이버 쇼핑이나 마트에서 소량 소싱하면 무조건 적자 전환의 지름길입니다. 등급 높은 마크를 단 뉴질랜드산 앵커 버터 혹은 엘르엔비르 버터를 최소 로스로 도매 거래 협약용 가이드라인 템플릿 제안 프로세스 상식을 공개합니다.
                </p>
              </div>
              <div className="pt-4 border-t border-zinc-100 mt-4 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[10px] text-zinc-400">
                  <Clock size={11} />
                  <span>읽는 데 3분</span>
                </div>
                <span className="text-xs font-bold text-zinc-900 inline-flex items-center gap-1 group cursor-pointer hover:text-violet-600 transition-all">
                  <span>읽기</span>
                  <ChevronRight size={13} className="group-hover:translate-x-0.5 transition-all" />
                </span>
              </div>
            </div>

            {/* Guide Item 3 */}
            <div className="bg-white border border-zinc-150 rounded-2xl p-5 hover:border-zinc-300 transition-all shadow-sm flex flex-col justify-between">
              <div className="space-y-4">
                <div className="h-32 bg-zinc-50 rounded-xl relative overflow-hidden p-4 flex flex-col justify-end">
                  <span className="absolute top-2.5 left-2.5 bg-indigo-50 border border-indigo-100 text-indigo-750 text-[9px] font-extrabold px-2 py-0.5 rounded">인스타 대란</span>
                  <p className="text-xs font-black text-zinc-800 leading-tight">손님들이 스마트폰으로 조각 케이크 사진 잘 찍는 각 유도하기</p>
                </div>
                <p className="text-xs font-semibold text-zinc-500 leading-relaxed">
                  비장하고 촘촘한 데커레이션보다는, 단면의 과일 시트 결이 자연스럽게 흘러내리는 러프한 단면 컷팅이 인스타 감성을 자극합니다. 영수증 리뷰 이벤트를 무미건조하게 권하는 것보다 카메라 셔터를 부르는 무광 아크릴 접시를 연출하세요.
                </p>
              </div>
              <div className="pt-4 border-t border-zinc-100 mt-4 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[10px] text-zinc-400">
                  <Clock size={11} />
                  <span>읽는 데 2분</span>
                </div>
                <span className="text-xs font-bold text-zinc-900 inline-flex items-center gap-1 group cursor-pointer hover:text-violet-600 transition-all">
                  <span>읽기</span>
                  <ChevronRight size={13} className="group-hover:translate-x-0.5 transition-all" />
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================== */}
        {/* SECTION 8: COLLAPSIBLE FAQ ACCORDIAN SECTION */}
        {/* ========================================================== */}
        <section className="py-24 border-b border-zinc-100/80 text-left max-w-4xl mx-auto" id="faq-section">
          <div className="text-center space-y-4 mb-16">
            <span className="text-[10px] bg-zinc-100 text-zinc-650 px-3 py-1 border border-zinc-200.60 font-black tracking-widest uppercase rounded-full">
              Faq Corner
            </span>
            <h2 className="text-3xl font-extrabold text-zinc-950">
              궁금하신 점이 있으세요?
            </h2>
            <p className="text-xs text-zinc-450 leading-relaxed font-semibold">
              카페 매출을 정말 구원해 주는지, 수많은 사장님이 가장 걱정하고 자주 여쭤보시는 질문만 모았습니다.
            </p>
          </div>

          <div className="space-y-3.5">
            {FAQ_ITEMS.map((faq, index) => {
              const isOpen = openFaqIndex === index;
              return (
                <div 
                  key={index} 
                  className="bg-white border border-zinc-150 rounded-2xl overflow-hidden transition-all duration-200 hover:border-zinc-300 shadow-sm"
                >
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                    className="w-full px-6 py-5 flex items-center justify-between text-left focus:outline-none cursor-pointer"
                  >
                    <span className="text-xs sm:text-sm font-extrabold text-zinc-900 pr-4">
                      {faq.question}
                    </span>
                    <ChevronDown 
                      size={16} 
                      className={`text-zinc-400 shrink-0 transition-transform duration-300 ${isOpen ? "rotate-180 text-violet-600" : ""}`} 
                    />
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                      >
                        <div className="px-6 pb-6 pt-1 text-xs sm:text-[13px] text-zinc-500 leading-relaxed font-semibold border-t border-zinc-50">
                          {faq.answer}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </section>

        {/* ========================================================== */}
        {/* SECTION 9: FOOTER CTA BANNER AND BRAND CREDIT */}
        {/* ========================================================== */}
        <section className="py-20 text-center" id="footer-cta">
          <div className="bg-gradient-to-br from-violet-650 via-zinc-900 to-indigo-950 text-white rounded-[40px] p-8 md:p-16 space-y-8 relative overflow-hidden shadow-2xl">
            {/* Subtle decor dots inside CTA card */}
            <div className="absolute top-0 right-0 h-40 w-40 bg-white/5 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 h-40 w-40 bg-violet-500/10 rounded-full blur-3xl pointer-events-none"></div>

            <div className="max-w-2xl mx-auto space-y-4 relative z-10">
              <span className="text-[10px] bg-white/10 text-violet-300 font-extrabold tracking-widest px-3.5 py-1 rounded-full uppercase leading-none">
                Start Today
              </span>
              <h2 className="text-3xl md:text-4xl font-black tracking-tight leading-tight">
                망설이는 오늘 하루 동안도 <br className="sm:hidden" />손님은 경쟁 매장으로 발길을 옮깁니다.
              </h2>
              <p className="text-xs text-zinc-300 leading-relaxed font-medium max-w-lg mx-auto">
                더는 커피 가격 낮추기에 휘쓸리거나 원두 회전율에 스트레스받지 마세요. 푸이마 시그니처 1-Click 수강 신청 즉시 사장님의 매장을 동네 전석 조기 솔드아웃 파라다이스 매장으로 인도해 드립니다.
              </p>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row justify-center gap-3.5 relative z-10">
              <button
                onClick={() => navigate("/my-classes")}
                className="bg-white hover:bg-zinc-100 text-zinc-950 text-xs font-black tracking-widest px-10 py-5 rounded-2xl uppercase shadow-md transition-all hover:translate-y-[-1px] active:scale-98 cursor-pointer"
              >
                1-Click 부트캠프 무료 체험 수강하기
              </button>
              <button
                onClick={() => navigate("/")}
                className="bg-zinc-800/80 hover:bg-zinc-800 hover:border-zinc-500 border border-zinc-700 text-white text-xs font-bold px-8 py-5 rounded-2xl transition-all"
              >
                베이킹 전체 레시피 포트폴리오 관람
              </button>
            </div>
          </div>
        </section>

      </div>

      {/* Subdued minimal human style branding Footer */}
      <footer className="bg-zinc-50 border-t border-zinc-150 py-16 text-center text-zinc-400 mt-20" id="ad-footer">
        <div className="max-w-[1240px] mx-auto px-4 md:px-8 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-1.5 grayscale opacity-75">
              <span className="bg-zinc-850 text-white w-6 h-6 inline-flex items-center justify-center rounded-lg font-bold font-serif text-xs">F</span>
              <span className="font-extrabold text-zinc-800 tracking-wide text-xs">FUIMA <span className="text-zinc-500 text-[10px] font-black tracking-widest uppercase">sprint</span></span>
            </div>
            <p className="text-[11px] text-zinc-400 font-medium">
              © 2026 FUIMA ATELIER SPRINT. All content rights reserved.
            </p>
          </div>

          <div className="border-t border-zinc-200/60 pt-6 text-[10px] text-zinc-400 font-medium text-left space-y-1">
            <p>(주) 푸이마 아틀리에 대표 김민우 | 개인정보보호책임자 김민우 | 사업자 등록번호 112-85-00122 </p>
            <p>통신판매업 신고번호 제 2026-서울마포-1102호 | 서울 마포구 백범로 35 마포스퀘어 빌딩 15층 | 대표 전화번호 : 02-1599-2424</p>
            <p className="text-zinc-350 mt-2">본 사이트는 광고 마케팅 분석 랜딩페이지 체험과 교육 정보 제공을 위해 구성되었으며, 부트캠프 체험은 인앱 대시보드 시뮬레이션으로 안전하게 테스팅 및 평생 제공됩니다.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
