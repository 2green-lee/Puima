import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { translate } from "../utils/translate";
// import { motion } from "motion/react";
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Star,
  Clock,
  Calculator,
  Camera,
  Layers,
  Heart,
  HelpCircle,
  Truck,
  Box
} from "lucide-react";

const FAQ_ITEMS = [
  {
    questionKOR: "한 번도 오븐을 다뤄보지 않은 왕초보 카페 사장님인데 따라갈 수 있나요?",
    answerKOR: "그럼요! 복잡한 제과 이론이나 손기술 중심이 아닙니다. 계량과 타이머만 맞추면 직원이나 아르바이트생도 완전 정밀하게 똑같은 퀄리티를 낼 수 있는 '표준 매뉴얼화 레시피'를 제공합니다.",
    questionENG: "I'm a complete beginner café owner who has never used an oven. Can I follow through?",
    answerENG: "Absolutely! It doesn't rely on complex baking theory or hand skills. We provide standard recipes designed so that anyone can yield identical quality just by following precise measurements and timer manuals."
  },
  {
    questionKOR: "오븐이 작아도 괜찮은가요?",
    answerKOR: "전혀 문제없습니다. 업소용 대형 오븐이 없어도 미니 컨벡션 오븐 1대로 똑같은 퀄리티를 내는 온습도 공략법과 '냉동 반죽 수면 발효법'을 함께 알려드립니다.",
    questionENG: "Is it okay if my oven is small?",
    answerENG: "No problem at all! Even without a large commercial oven, we teach you how to achieve identical results using a single mini-convection oven via temperature/humidity control and frozen-dough proofing methods."
  },
  {
    questionKOR: "원가 분석 엑셀은 평생 제공되나요?",
    answerKOR: "네! 수강생 전원에게 재료값이 변동될 때마다 원가와 마진을 알아서 다시 계산해주는 스마트 자동 계산 시트를 평생 제공합니다.",
    questionENG: "Is the cost analysis Excel sheet provided for lifetime?",
    answerENG: "Yes! All students get lifetime access to our smart auto-tracker sheets, which automatically recalculate cost structures and margins whenever base ingredient costs change."
  },
  {
    questionKOR: "클래스 이수 후 매출이 오르나요?",
    answerKOR: "수강하신 점주님들은 평균적으로 커피만 팔 때보다 객단가를 2배 이상 높이고 있으며, 마진율 높은 디저트류 성공 정착으로 순이익이 눈에 띄게 개선되었습니다.",
    questionENG: "Will my sales go up after this course?",
    answerENG: "On average, participating owners have seen ticket sizes double compared to selling coffee alone, and net profits have noticeably improved with high-margin signature desserts."
  }
];

export default function AdLanding() {
  const navigate = useNavigate();
  const { lang = "KOR" } = useAuth();
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  return (
    <div className="bg-white min-h-screen font-sans text-stone-900 selection:bg-[#FF4A32] selection:text-white pb-32">
      {/* Top Header */}
      <header className="sticky top-0 left-0 right-0 bg-white/90 backdrop-blur-md z-50 px-6 py-4 flex items-center justify-between border-b border-stone-100">
        <div className="flex items-center gap-10">
          <button 
            onClick={() => navigate("/")} 
            className="flex items-center gap-2 focus:outline-none"
          >
            <div className="bg-[#FF4A32] text-white w-7 h-7 rounded-lg flex items-center justify-center font-black text-sm tracking-tight">F</div>
            <span className="font-extrabold text-lg tracking-tight text-stone-900">FUIMA</span>
          </button>
          
          <nav className="hidden md:flex gap-6 text-sm font-semibold text-stone-600">
            <a href="#features" className="hover:text-stone-900 transition-colors">{translate("기능", lang)}</a>
            <a href="#pricing" className="hover:text-stone-900 transition-colors">{translate("요금", lang)}</a>
            <a href="#faq" className="hover:text-stone-900 transition-colors">{translate("이용 가이드", lang)}</a>
            <a href="#reviews" className="hover:text-stone-900 transition-colors">{translate("수강 후기", lang)}</a>
          </nav>
        </div>

        <div className="flex gap-4">
          <button 
            onClick={() => navigate("/login")}
            className="text-white bg-[#FF4A32] hover:bg-[#E63922] font-semibold text-sm px-5 py-2.5 rounded-lg transition-colors shadow-sm"
          >
            {translate("부트캠프 시작", lang)}
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-24 pb-16 px-4 text-center max-w-4xl mx-auto flex flex-col items-center">
        <div className="text-[#FF4A32] font-extrabold text-xs tracking-wider mb-6 bg-[#FF4A32]/10 px-3 py-1.5 rounded-full flex items-center gap-2">
          {translate("누적 수강 카페 1,240곳 돌파", lang)}
        </div>
        
        <h1 className="text-4xl md:text-[56px] font-black leading-[1.15] text-stone-900 tracking-tight whitespace-pre-line mb-6">
          {lang === "KOR" ? "사장님들 디저트로\n같이 돈 법시다." : "Let's increase your café revenue\nwith premium signature desserts."}
        </h1>
        
        <p className="text-stone-500 font-medium text-base md:text-lg mb-10 max-w-lg leading-relaxed">
          {translate("어제 만든 냉동 반죽, 오늘 오븐만 누르면 시그니처 완판. 하루 매출을 3배로 바꾸는 디저트 레시피 매뉴얼.", lang)}
        </p>

        <button 
          onClick={() => navigate("/my-classes")}
          className="bg-[#FF4A32] hover:bg-[#E63922] text-white font-bold text-lg px-10 py-5 rounded-2xl shadow-[0_8px_20px_rgba(255,74,50,0.3)] transition-all hover:-translate-y-1 active:translate-y-0"
        >
          {translate("무료 맛보기 시작하기", lang)}
        </button>
        <p className="text-[11px] text-stone-400 font-medium mt-4">{translate("카드 등록 없이 1주일 무료 · 즉시 레시피 확인", lang)}</p>

        {/* Hero Mockup Graphic (Similar to Sendman ref) */}
        <div className="mt-16 w-full max-w-3xl relative">
          <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent z-10 top-1/2"></div>
          <div className="bg-stone-50 rounded-[32px] border border-stone-200 p-8 md:p-12 relative overflow-hidden flex justify-center">
            
            {/* Mockup Card */}
            <div className="bg-white rounded-[24px] shadow-xl border border-stone-100 p-5 w-full max-w-md relative z-20 flex flex-col gap-4 text-left">
              <div className="flex items-center gap-3 pb-3 border-b border-stone-100">
                <div className="w-8 h-8 bg-green-500 rounded-xl flex items-center justify-center text-white text-[12px] font-black">N</div>
                <div>
                  <h4 className="font-bold text-stone-900 text-sm">
                    {lang === "KOR" ? "새 주문 알림" : "New Order Alert"}
                  </h4>
                  <p className="text-[11px] text-stone-400">
                    {lang === "KOR" ? "오후 2:30 · 포장 예약" : "2:30 PM · Take-out Booking"}
                  </p>
                </div>
              </div>

              <div className="bg-[#FF4A32]/5 rounded-xl p-4 border border-[#FF4A32]/10 mb-2 relative">
                 <div className="absolute top-4 right-4 bg-[#FF4A32] text-[10px] text-white font-bold px-2 py-0.5 rounded">
                   {lang === "KOR" ? "베스트 리뷰" : "Best Review"}
                 </div>
                 <h5 className="font-bold text-stone-900 text-sm mb-1">
                   {lang === "KOR" ? "[매출 달성] 사장님 화이팅! 🎉" : "[Sales Milestone] Keep up the fire! 🎉"}
                 </h5>
                 <p className="text-xs text-stone-600 leading-relaxed mb-4">
                   {lang === "KOR" 
                     ? "오후 진열된 단호박 타르트 전량 완판되었습니다. 내일을 위해 새로운 냉동 반죽을 예열하고 준비해주세요!" 
                     : "All sweet pumpkin tarts displayed this afternoon are completely sold out! Pre-heat the oven and prep new frozen dough for tomorrow!"}
                 </p>
                 
                 <div className="bg-white rounded-lg p-3 border border-stone-200 flex items-center gap-3">
                   <div className="bg-stone-100 w-10 h-10 rounded text-stone-400 flex items-center justify-center">
                     <Layers size={18} />
                   </div>
                   <div>
                     <p className="text-xs font-bold text-stone-800">
                       {lang === "KOR" ? "단호박 타르트 레시피 매뉴얼.pdf" : "Pumpkin Sourdough Recipe Manual.pdf"}
                     </p>
                     <p className="text-[10px] text-stone-500 mt-0.5">
                       {lang === "KOR" ? "상세 계량 0.1g 단위 안내" : "Detailed breakdown to 0.1g accuracy"}
                     </p>
                   </div>
                 </div>
              </div>
              
              <div className="flex justify-end pr-2">
                <span className="text-[11px] font-bold text-stone-500 bg-stone-100 px-3 py-1.5 rounded-full flex gap-1 items-center">
                  <CheckCircle2 size={12} className="text-green-500"/>
                  {lang === "KOR" ? "직원 확인 완료" : "Approved by Staff"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Black Stats Section */}
      <section className="bg-[#1A1A1A] py-24 px-6 relative mt-[-2px]">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-center text-white font-semibold text-lg md:text-xl mb-16 tracking-tight">
            {lang === "KOR" ? "수강 후, 숫자로 증명되는 기적" : "Proof in Numbers After the Bootcamp"}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center divide-y md:divide-y-0 md:divide-x divide-stone-800/80">
            <div className="pt-8 md:pt-0">
              <div className="text-[#FF4A32] font-black text-5xl md:text-6xl mb-3 flex items-center justify-center gap-1 tracking-tighter">
                <ArrowRight className="-rotate-45" size={32} /> 342%
              </div>
              <p className="text-stone-400 font-medium text-sm">
                {lang === "KOR" ? "매출이 이만큼 뛰었어요 (최고 기록)" : "Jump in revenue (Record High)"}
              </p>
            </div>
            <div className="pt-8 md:pt-0">
              <div className="text-white font-black text-5xl md:text-6xl mb-3 flex items-center justify-center gap-1 tracking-tighter">
                <ArrowRight className="rotate-45 text-[#FF4A32]" size={32} /> 78.1%
              </div>
              <p className="text-stone-400 font-medium text-sm">
                {lang === "KOR" ? "로스(반죽 폐기율)가 확 줄었어요 (평균)" : "Reduced dough waste rate (Average)"}
              </p>
            </div>
            <div className="pt-8 md:pt-0">
              <div className="text-stone-300 font-black text-5xl md:text-6xl mb-3 flex items-center justify-center gap-1 tracking-tighter">
                <ArrowRight className="-rotate-45" size={32} /> 52.2%
              </div>
              <p className="text-stone-400 font-medium text-sm">
                {lang === "KOR" ? "객단가 평균 이만큼 높아졌어요 (평균)" : "Average transaction size increase (Average)"}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Before/After Section */}
      <section className="py-24 px-6 bg-[#FEFEFE]" id="features">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold text-stone-900 mb-4 tracking-tight">
            {lang === "KOR" ? "사장님의 하루가 이렇게 바뀌어요" : "How a Café Owner's Day Changes"}
          </h2>
          <p className="text-sm text-stone-500 font-medium mb-12">
            {lang === "KOR" ? "밤마다 하던 실패 고민, 이제 안 하셔도 돼요." : "Say goodbye to nightly stress and baking failures."}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
             {/* Before Card */}
             <div className="bg-white border rounded-[28px] overflow-hidden text-left border-[#FF4A32] shadow-lg relative h-full"> {/* Swapped After to Left just to see or I'll fix this to Before */}
               <div className="absolute top-0 right-0 bg-stone-200 text-stone-600 px-4 py-1 rounded-bl-xl font-bold text-[11px]">
                 {lang === "KOR" ? "도입 전 🥲" : "BEFORE 🥲"}
               </div>
               <div className="bg-stone-50 px-6 py-4 border-b border-stone-100 flex items-center gap-2">
                 <span className="w-2 h-2 rounded-full bg-stone-400"></span>
                 <span className="font-bold text-sm text-stone-600">
                   {lang === "KOR" ? "푸이마 도입 전" : "Before PUIMA"}
                 </span>
               </div>
               <div className="p-6 md:p-8 space-y-6">
                 <div className="flex gap-4 items-start">
                   <span className="text-xs font-bold font-mono text-stone-400 mt-0.5">04:30</span>
                   <div>
                     <p className="font-bold text-stone-800">{lang === "KOR" ? "새벽 반죽과 실패의 반복" : "Pre-dawn Sops & Continuous Failures"}</p>
                     <p className="text-xs text-stone-500 mt-1">{lang === "KOR" ? "항상 감으로 구워 맛이 제각각" : "Baked by pure guesswork, irregular taste everyday"}</p>
                   </div>
                 </div>
                 <div className="flex gap-4 items-start relative before:absolute before:left-[11px] before:top-[-16px] before:bottom-[-20px] before:w-px before:bg-stone-200">
                   <span className="text-xs font-bold font-mono text-stone-400 mt-0.5 z-10 bg-white">09:00</span>
                   <div>
                     <p className="font-bold text-stone-800">{lang === "KOR" ? "초라한 진열과 떨이" : "Unhappy Display & Cheap Clearance"}</p>
                     <p className="text-xs text-stone-500 mt-1">{lang === "KOR" ? "팔리지 않는 메뉴, 매일 텅 빈 쇼케이스" : "Unsold items, empty cases, wasted energy"}</p>
                   </div>
                 </div>
                 <div className="flex gap-4 items-start">
                   <span className="text-xs font-bold font-mono text-stone-400 mt-0.5">18:00</span>
                   <div>
                     <p className="font-bold text-stone-800">{lang === "KOR" ? "아메리카노만 팔린 하루" : "Another Day of Selling Americano Only"}</p>
                     <p className="text-xs text-stone-500 mt-1">{lang === "KOR" ? "객단가 3,500원. 월세 내기도 빠듯함" : "Low order size, barely matching standard rent"}</p>
                   </div>
                 </div>
               </div>
             </div>

             {/* After Card */}
             <div className="bg-[#FFF5F3] border border-[#FF4A32]/30 rounded-[28px] overflow-hidden text-left relative h-full"> 
               <div className="absolute top-0 right-0 bg-[#FF4A32] text-white px-4 py-1 rounded-bl-xl font-bold text-[11px]">
                 도입 후 🥳
               </div>
               <div className="bg-[#FF4A32]/10 px-6 py-4 border-b border-[#FF4A32]/10 flex items-center gap-2">
                 <span className="w-2 h-2 rounded-full bg-[#FF4A32]"></span>
                 <span className="font-bold text-sm text-[#FF4A32]">푸이마 도입 후</span>
               </div>
               <div className="p-6 md:p-8 space-y-6">
                 <div className="flex gap-4 items-start">
                   <span className="text-xs font-bold font-mono text-[#FF4A32] mt-0.5">09:00</span>
                   <div>
                     <p className="font-bold text-stone-900">{lang === "KOR" ? "냉동 반죽 바로 꺼내 굽기" : "Bake Straight from Frozen Dough"}</p>
                     <p className="text-xs text-stone-600 mt-1">{lang === "KOR" ? "전날 만들어둔 시그니처, 굽기만 하면 마법" : "Magically bake pre-made dough instantly"}</p>
                   </div>
                 </div>
                 <div className="flex gap-4 items-start relative before:absolute before:left-[11px] before:top-[-16px] before:bottom-[-20px] before:w-px before:bg-[#FF4A32]/20">
                   <span className="text-xs font-bold font-mono text-[#FF4A32] mt-0.5 z-10 bg-[#FFF5F3]">13:00</span>
                   <div>
                     <p className="font-bold text-stone-900">{lang === "KOR" ? "시그니처 메뉴 조기 완판" : "Signature Menus Sold Out Early"}</p>
                     <p className="text-xs text-stone-600 mt-1">{lang === "KOR" ? "인스타용 촬영 가이드 덕에 찾아오는 손님들" : "Instagram aesthetics pull organic traffic"}</p>
                   </div>
                 </div>
                 <div className="flex gap-4 items-start">
                   <span className="text-xs font-bold font-mono text-[#FF4A32] mt-0.5">15:00</span>
                   <div>
                     <p className="font-bold text-stone-900">{lang === "KOR" ? "평균 단가 만 원 돌파" : "Order Size Exceeds 10,000 KRW"}</p>
                     <p className="text-xs text-stone-600 mt-1">{lang === "KOR" ? "음료 하나에 디저트 2개씩 담아가는 기적" : "Miracle of adding 2 desserts to each drink"}</p>
                   </div>
                 </div>
               </div>
             </div>
          </div>

          <div className="flex flex-wrap justify-center gap-4 text-sm font-semibold text-stone-600 pt-4">
            <span className="flex items-center gap-2"><CheckCircle2 size={16} className="text-stone-400" /> 복잡한 발효기술 없음</span>
            <span className="flex items-center gap-2"><CheckCircle2 size={16} className="text-stone-400" /> 일반 소형 오븐 100% 가능</span>
            <span className="flex items-center gap-2"><CheckCircle2 size={16} className="text-stone-400" /> 초보 알바생 즉시 투입</span>
          </div>
        </div>
      </section>

      {/* Zig-Zag Feature Details */}
      <section className="py-24 px-6 border-t border-stone-100 bg-white">
        <div className="max-w-5xl mx-auto space-y-32">
          
          {/* Item 1 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div className="order-2 md:order-1 bg-stone-50 rounded-[32px] p-8 h-80 relative overflow-hidden flex flex-col justify-center items-center group">
              <div className="w-[80%] bg-white rounded-2xl shadow-lg border border-stone-100 p-6 flex flex-col gap-3 group-hover:scale-105 transition-transform duration-500">
                 <div className="flex items-center gap-3 border-b border-stone-100 pb-3">
                   <Calculator className="text-[#FF4A32]" />
                   <h5 className="font-bold text-stone-900 text-sm">{lang === "KOR" ? "실시간 원가 계산기" : "Real-time Cost Calculator"}</h5>
                 </div>
                 <div className="flex justify-between text-xs text-stone-500 font-medium px-2">
                   <span>{lang === "KOR" ? "프랑스산 밀가루 (1kg)" : "French Flour (1kg)"}</span>
                   <span className="text-stone-900 font-bold">14,000 ₩</span>
                 </div>
                 <div className="flex justify-between text-xs text-stone-500 font-medium px-2">
                   <span>{lang === "KOR" ? "버터 변동 단가 반영" : "Butter Unit Cost Updates"}</span>
                   <span className="text-stone-900 font-bold">3,200 ₩</span>
                 </div>
                 <div className="flex justify-between text-xs text-[#FF4A32] font-bold bg-[#FF4A32]/10 p-2 rounded-lg mt-1">
                   <span>{lang === "KOR" ? "개당 추천 마진 판가" : "Recommended Retail Margin"}</span>
                   <span>3,800 ₩</span>
                 </div>
              </div>
            </div>
            <div className="order-1 md:order-2 space-y-4">
              <span className="text-xs font-bold text-stone-400 bg-stone-100 px-3 py-1 rounded-full uppercase tracking-wider">{lang === "KOR" ? "원가 방어 솔루션" : "Cost Protection Solution"}</span>
              <h3 className="text-3xl lg:text-4xl font-extrabold text-stone-900 leading-[1.2] mt-4 mb-4">
                {lang === "KOR" ? <React.Fragment>재료비 오르면 어쩌나,<br/>이제 엑셀에 맡기세요.</React.Fragment> : <React.Fragment>Worried about ingredient costs?<br/>Leave it to Excel now.</React.Fragment>}
              </h3>
              <p className="text-stone-500 font-medium leading-relaxed">
                {lang === "KOR" ? "밀가루값 100원 오를 때마다 고민하지 마세요. 버터, 계란 단가만 입력하면 우리 매장 상황에 맞는 최적의 디저트 가격표가 자동으로 세팅됩니다." : "Ditch stress when flour prices rise by pennies. Just type butter and egg base costs, and a tailored optimal price tag is formulated."} 
              </p>
            </div>
          </div>

          {/* Item 2 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div className="space-y-4">
              <span className="text-xs font-bold text-stone-400 bg-stone-100 px-3 py-1 rounded-full uppercase tracking-wider">{lang === "KOR" ? "정밀 매뉴얼 세팅" : "Precision Manual Setup"}</span>
              <h3 className="text-3xl lg:text-4xl font-extrabold text-stone-900 leading-[1.2] mt-4 mb-4">
                {lang === "KOR" ? <React.Fragment>알바생을 고용해도,<br/>사장님과 같은 퀄리티.</React.Fragment> : <React.Fragment>Hire anyone you want,<br/>you still get standard quality.</React.Fragment>}
              </h3>
              <p className="text-stone-500 font-medium leading-relaxed">
                {lang === "KOR" ? "\"이만큼 넣고 저만큼 구우세요\" 같은 대충 레시피는 버리세요. 0.1g 단위 계량과 초 단위 타이머 매뉴얼 교안이 제공됩니다. 누가 만들어도 완벽한 결과." : "Ditch vague recipes of \"throw in some of this\". Get 0.1g breakdown details and second-by-second timer manuals. Absolute perfection, regardless of who cooks."}
              </p>
            </div>
            <div className="bg-stone-50 rounded-[32px] p-8 h-80 relative overflow-hidden flex justify-center items-center group">
              <div className="absolute -right-20 -top-10 w-64 h-64 bg-[#FFF5F3] rounded-full blur-3xl opacity-50"></div>
              
              <div className="bg-white px-8 py-6 rounded-2xl shadow-xl w-[90%] border border-stone-100 relative group-hover:shadow-2xl transition-all duration-500">
                <div className="font-bold text-stone-900 mb-4 border-b border-stone-100 pb-2">{lang === "KOR" ? "기본 휘낭시에 (20구)" : "Classic Financier (20 pieces)"}</div>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <CheckCircle2 size={16} className="text-[#FF4A32]"/>
                    <p className="text-xs font-medium text-stone-600">{lang === "KOR" ? "버터 125.5g (태우기 시작)" : "Butter 125.5g (browning state)"}</p>
                  </div>
                  <div className="flex gap-2">
                    <CheckCircle2 size={16} className="text-[#FF4A32]"/>
                    <p className="text-xs font-medium text-stone-600">{lang === "KOR" ? "오븐 온도 195도, 13분 타이머" : "Oven 195°C, 13-min timer"}</p>
                  </div>
                  <div className="flex gap-2 opacity-50">
                     <CheckCircle2 size={16} className="text-stone-300"/>
                     <p className="text-xs font-medium text-stone-400">{lang === "KOR" ? "쇼케이스 진열 즉시 세팅" : "Instant Showcase Presentation"}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Grid Features */}
      <section className="bg-stone-50 py-24 px-6 border-t border-stone-200">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold text-stone-900 mb-4 tracking-tight">
              {lang === "KOR" ? "사장님, 이 기능도 필요하시죠?" : "Do you also need these features?"}
            </h2>
            <p className="text-stone-500 font-medium text-sm">
              {lang === "KOR" ? "운영은 편하게, 마진은 확실하게 챙겨드립니다." : "Effortless administration, guaranteed profits."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { 
                icon: Truck, 
                title: lang === "KOR" ? "우수 도매상 리스트업" : "Superior Wholesaler secret directory", 
                desc: lang === "KOR" ? "고퀄리티 수입 식자재를 평균 15% 저렴하게 공급받는 시크릿 직링크" : "Secret direct links to source premium imported ingredients 15% cheaper on average" 
              },
              { 
                icon: Layers, 
                title: lang === "KOR" ? "감성 한글 네이밍 태그" : "Aesthetic Naming Patterns", 
                desc: lang === "KOR" ? "이름만 봐도 사고 싶게 만드는 네이밍 규칙과 포토샵 템플릿 세트" : "Irresistible signature culinary naming rules mapped with clean PSD templates" 
              },
              { 
                icon: Camera, 
                title: lang === "KOR" ? "쇼케이스 사진 연출법" : "Showcase Photography Manual", 
                desc: lang === "KOR" ? "최신 아이폰 폰카 하나로 인스타 감성샷을 10대처럼 뽑아내는 법" : "Master the standard iPhone lens angles to capture highly shareable social assets" 
              },
              { 
                icon: Box, 
                title: lang === "KOR" ? "포장재 단가표 매칭" : "Packaging Unit cost Optimization", 
                desc: lang === "KOR" ? "종류별 타르트, 마들렌 규격에 딱 맞는 가장 싼 방산시장 포장지 리스트" : "A concise guide to the cheapest wholesale box suppliers corresponding to tart sizes" 
              },
              { 
                icon: Heart, 
                title: lang === "KOR" ? "재방문 유도 명함 폼" : "Retention Booster Formats", 
                desc: lang === "KOR" ? "단골 손님이 또 오도록 유도하는 박스 속 작은 안내문/쿠폰 디자인 양식" : "Print-ready coupon vectors placed inside packages to convert first-timers to loyalists" 
              },
              { 
                icon: HelpCircle, 
                title: lang === "KOR" ? "비상 상황 대처 PDF" : "Contingency Strategy Guidebook", 
                desc: lang === "KOR" ? "반죽이 분리되었을 때, 오븐이 갑자기 꺼졌을 때 등 현장 대처법 교안" : "Actionable handbooks resolving broken emulsion, sudden oven drops and other emergencies" 
              }
            ].map((f, i) => (
              <div key={i} className="bg-white border border-stone-200 rounded-2xl p-6 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-[#FFF5F3] flex items-center justify-center rounded-xl text-[#FF4A32] mb-5">
                  <f.icon size={22} />
                </div>
                <h4 className="font-bold text-stone-900 text-lg mb-2">{f.title}</h4>
                <p className="text-stone-500 text-xs font-medium leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-6 bg-white border-b border-stone-100" id="reviews">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-2xl mb-4 inline-block">💬</span>
            <h2 className="text-3xl font-extrabold text-stone-900 mb-4 tracking-tight">
              {lang === "KOR" ? "셀러들이 먼저 알아봤어요" : "Discovered by Leading Sellers First"}
            </h2>
            <p className="text-stone-500 font-medium text-sm">
              {lang === "KOR" ? "가장 확실한 추천은 매출이 오른 사장님들의 목소리입니다." : "The most reliable proof comes from real business owners with boosted sales."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-8 border border-stone-200 rounded-[24px] bg-stone-50 space-y-4">
              <h4 className="font-bold text-stone-900 text-[17px] leading-snug">
                {lang === "KOR" ? '"매일 나가는 재료비 폭탄.. 솔루션 한 번으로 끝냈습니다."' : '"Tackling rising ingredient bills... Resolved once and for all with this single solution."'}
              </h4>
              <p className="text-sm text-stone-600 leading-loose">
                {lang === "KOR" 
                  ? "단가 원가 계산을 못 해서 팔아도 남는 게 없는 느낌이었는데, 제공해 주신 맞춤 엑셀 하나로 100% 깔끔해졌습니다. 매일 얼마나 벌었는지 엑셀에 찍히니까 일할 맛이 나요."
                  : "Calculating margins was messy, and I felt like I was making zero profit. This simple customized Excel sheet made everything 100% transparent. Seeing my earnings update daily keeps me highly motivated."}
              </p>
              <div className="flex items-center gap-3 pt-6 !mt-6 border-t border-stone-200">
                <div className="flex gap-1 text-[#FF4A32]">
                  <Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" />
                </div>
                <span className="text-xs font-bold text-stone-900">
                  {lang === "KOR" ? "연남동 블에 카페 사장님" : "Owner, Café Vle in Yeonnam-dong"}
                </span>
              </div>
            </div>

            <div className="p-8 border border-stone-200 rounded-[24px] bg-stone-50 space-y-4">
              <h4 className="font-bold text-stone-900 text-[17px] leading-snug">
                {lang === "KOR" ? '"아메리카노만 팔던 매장에 드디어 빵순이들이 옵니다!"' : '"A café that sold only Americanos finally attracts dessert lovers!"'}
              </h4>
              <p className="text-sm text-stone-600 leading-loose">
                {lang === "KOR"
                  ? "레시피가 너무 직관적이어서 알바생도 척척 구워내요. 커피 객단가가 4천 원 대였는데 피칸 초코 타르트 도입하고 쇼케이스 세팅법 적용하니까 기본 만 원 넘게 긁고 가십니다!"
                  : "The recipes are so intuitive that even part-timers bake beautifully. Our average ticket was around 4,000 KRW, but introducing Pecan Chocolate Tarts and proper layout styles easily pushed tickets past 10,000 KRW!"}
              </p>
              <div className="flex items-center gap-3 pt-6 !mt-6 border-t border-stone-200">
                <div className="flex gap-1 text-[#FF4A32]">
                  <Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" />
                </div>
                <span className="text-xs font-bold text-stone-900">
                  {lang === "KOR" ? "제주도 R로스터리 점주님" : "Owner, R Roastery in Jeju Island"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3 Step Flow */}
      <section className="bg-white py-24 px-6 text-center">
        <h2 className="text-3xl font-extrabold text-stone-900 mb-16 tracking-tight">{lang === "KOR" ? "3분이면 시작해요" : "Start in 3 Minutes"}</h2>
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row justify-between relative gap-6">
          <div className="hidden md:block absolute top-[28px] left-[15%] right-[15%] h-px border-t border-dashed border-stone-300 -z-10"></div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-6 w-full">
            <div className="flex flex-col items-center">
              <div className="w-14 h-14 bg-stone-100 rounded-2xl flex items-center justify-center text-[#FF4A32] font-black text-xl mb-6 shadow-sm">1</div>
              <h4 className="font-bold text-stone-900 text-lg mb-2">{lang === "KOR" ? "과정 선택" : "Select Course"}</h4>
              <p className="text-xs text-stone-500 font-medium">{lang === "KOR" ? <React.Fragment>내 매장에 핏이 맞는 코스를<br/>골라 결제합니다.</React.Fragment> : <React.Fragment>Pick the class that best fits<br/>your shop and check out.</React.Fragment>}</p>
            </div>
            
            <div className="flex flex-col items-center">
              <div className="w-14 h-14 bg-stone-100 rounded-2xl flex items-center justify-center text-[#FF4A32] font-black text-xl mb-6 shadow-sm">2</div>
              <h4 className="font-bold text-stone-900 text-lg mb-2">{lang === "KOR" ? "교안 자동 발송" : "Instant Delivery"}</h4>
              <p className="text-xs text-stone-500 font-medium">{lang === "KOR" ? <React.Fragment>결제 즉시 평생 소장 가능한<br/>PDF와 엑셀폼이 해금됩니다.</React.Fragment> : <React.Fragment>Get lifetime access to the PDFs<br/>and Excel sheets instantly.</React.Fragment>}</p>
            </div>

            <div className="flex flex-col items-center">
              <div className="w-14 h-14 bg-[#FFF5F3] rounded-2xl flex items-center justify-center text-[#FF4A32] font-black text-xl mb-6 shadow-sm">3</div>
              <h4 className="font-bold text-[#FF4A32] text-lg mb-2">{lang === "KOR" ? "마진 상승 시작!" : "Profit Rise!"}</h4>
              <p className="text-xs text-stone-500 font-medium">{lang === "KOR" ? <React.Fragment>내일부터 바로 반영하여<br/>새로운 결제 기록을 확인하세요.</React.Fragment> : <React.Fragment>Apply tomorrow and watch your<br/>daily ticket sizes grow.</React.Fragment>}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Pricing Block */}
      <section className="bg-stone-50 py-24 px-6 border-y border-stone-200" id="pricing">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-extrabold text-stone-900 mb-10 tracking-tight">{lang === "KOR" ? <React.Fragment>수백만 원짜리 학원 대신,<br/>실전형 매뉴얼 요금제.</React.Fragment> : <React.Fragment>Forget expensive academies.<br/>Practical playbook pricing.</React.Fragment>}</h2>
          <div className="bg-white rounded-[24px] border border-stone-200 overflow-hidden shadow-sm text-left">
            <div className="p-6 md:p-8 flex items-center justify-between border-b border-stone-100 hover:bg-stone-50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shadow-sm font-black">A</div>
                <div>
                  <h4 className="font-bold text-stone-900 text-base mb-1">{lang === "KOR" ? "시그니처 구움과자 코스" : "Signature Pastry Class"}</h4>
                  <p className="text-xs text-stone-400 font-medium hidden sm:block">{lang === "KOR" ? "단골을 유치하는 6종 핵심 매뉴얼" : "6 core handbooks to hook loyalists"}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-stone-400 font-medium mb-0.5 line-through decoration-stone-300">120,000{lang === "KOR" ? "원" : " KRW"}</p>
                <p className="font-black text-lg md:text-xl text-stone-900">49,000<span className="text-stone-400 font-medium text-xs ml-1">{lang === "KOR" ? "원 / 월" : "KRW / mo"}</span></p>
              </div>
            </div>

            <div className="p-6 md:p-8 flex items-center justify-between border-b border-stone-100 hover:bg-stone-50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shadow-sm font-black">B</div>
                <div>
                  <h4 className="font-bold text-stone-900 text-base mb-1">{lang === "KOR" ? "프리미엄 럭셔리 케이크" : "Premium Luxury Cake Class"}</h4>
                  <p className="text-xs text-stone-400 font-medium hidden sm:block">{lang === "KOR" ? "특별한 날, 단가를 극대화하는 레시피" : "Recipes to maximize ticket size for special days"}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-stone-400 font-medium mb-0.5 line-through decoration-stone-300">160,000{lang === "KOR" ? "원" : " KRW"}</p>
                <p className="font-black text-lg md:text-xl text-stone-900">64,000<span className="text-stone-400 font-medium text-xs ml-1">{lang === "KOR" ? "원 / 월" : "KRW / mo"}</span></p>
              </div>
            </div>

            <div className="p-6 md:p-8 flex items-center justify-between hover:bg-stone-50 transition-colors bg-[#FFF5F3]/50">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#FF4A32] text-white flex items-center justify-center shadow-md font-black">ALL</div>
                <div>
                  <h4 className="font-bold text-[#FF4A32] text-base mb-1">{lang === "KOR" ? "마스터 풀 패키지 제안" : "Master All-in-One Bundle Offer"}</h4>
                  <p className="text-xs text-[#FF4A32] font-medium hidden sm:block">{lang === "KOR" ? "쇼케이스 마케팅 포함 전 강좌 혜택" : "Complete access including showcase marketing"}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-stone-400 font-medium mb-0.5 line-through decoration-stone-300">325,000{lang === "KOR" ? "원" : " KRW"}</p>
                <p className="font-black text-lg md:text-xl text-[#FF4A32]">99,000<span className="text-[#FF4A32]/60 font-medium text-xs ml-1">{lang === "KOR" ? "원 / 월" : "KRW / mo"}</span></p>
              </div>
            </div>
            
            <div className="bg-stone-100 px-6 py-4 flex flex-col sm:flex-row gap-4 items-center justify-center text-xs text-stone-600 font-medium text-center">
               <span className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-stone-400"/> {lang === "KOR" ? "실시간 원가 엑셀 무료 열람" : "Free access to live Cost Excel"}</span>
               <span className="hidden sm:inline text-stone-300">|</span>
               <span className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-stone-400"/> {lang === "KOR" ? "도매 발주 리스트 즉시 제공" : "Instant directory of wholesale builders"}</span>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ accordion */}
      <section className="py-24 px-6 max-w-3xl mx-auto" id="faq">
        <h2 className="text-3xl font-extrabold text-stone-900 text-center mb-12 tracking-tight">
          {lang === "KOR" ? "이게 제일 궁금하시죠?" : "Frequently Asked Questions"}
        </h2>
        
        <div className="space-y-4">
          {FAQ_ITEMS.map((faq, index) => (
            <div 
              key={index} 
              className={`border border-stone-200 rounded-2xl overflow-hidden transition-all duration-300 ${openFaqIndex === index ? 'bg-stone-50 border-stone-300 pb-2' : 'bg-white hover:border-stone-300'}`}
            >
              <button
                className="w-full flex items-center justify-between p-6 text-left focus:outline-none"
                onClick={() => setOpenFaqIndex(openFaqIndex === index ? null : index)}
              >
                <span className={`font-bold text-sm ${openFaqIndex === index ? 'text-[#FF4A32]' : 'text-stone-800'}`}>
                  {lang === "KOR" ? faq.questionKOR : faq.questionENG}
                </span>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-transform duration-300 ${openFaqIndex === index ? 'bg-[#FF4A32] text-white rotate-180' : 'bg-stone-100 text-stone-400'}`}>
                  <ChevronDown size={14} />
                </div>
              </button>
              
              {openFaqIndex === index && (
                <div className="px-6 pb-6 pt-0 text-sm text-stone-600 leading-relaxed font-medium transition-all">
                  {lang === "KOR" ? faq.answerKOR : faq.answerENG}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Base CTA Banner */}
      <section className="max-w-5xl mx-auto px-6 mb-10">
         <div className="bg-[#FF4A32] rounded-[32px] p-12 md:p-16 text-center shadow-xl relative overflow-hidden flex flex-col items-center">
            {/* Minimalist modern decor */}
            <div className="absolute right-[-10%] top-[-20%] w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
            <div className="absolute left-[-10%] bottom-[-20%] w-96 h-96 bg-black/10 rounded-full blur-3xl"></div>
            
<h2 className="text-3xl md:text-[40px] font-black text-white leading-tight tracking-tight relative z-10 mb-4">
              {lang === "KOR" ? <React.Fragment>발송, 이제 샌드맨에게 맡기세요<br/><span className="text-white/80 text-xl md:text-2xl mt-4 block">아니, 매출은 푸이마에게 맡기세요!</span></React.Fragment> : <React.Fragment>Trust your daily revenue to PUIMA!<br/><span className="text-white/80 text-xl md:text-2xl mt-4 block">Watch your showcase transform from tomorrow.</span></React.Fragment>}
            </h2>
            <p className="text-white/90 text-sm font-medium mb-10 relative z-10">{lang === "KOR" ? "3분이면 시작하고, 내일 아침의 쇼케이스가 달라집니다." : "Start in 3 minutes, witness a totally different showcase tomorrow morning."}</p>

            <button 
              onClick={() => navigate("/my-classes")}
              className="relative z-10 bg-white text-[#FF4A32] hover:bg-stone-100 font-extrabold text-lg px-10 py-5 rounded-2xl shadow-lg transition-transform hover:-translate-y-1 active:translate-y-0"
            >
              {lang === "KOR" ? "무료 맛보기 시작하기" : "Unlock Free Demo Premium"}
            </button>
            <p className="relative z-10 mt-6 text-xs font-semibold text-white/50">
              {lang === "KOR" ? "한 달에 40,000+ 건 발송 중인 셀러들과 함께하세요" : "Join over 40,000+ transactions powered monthly"}
            </p>
         </div>
      </section>

      {/* Footer mimic */}
      <footer className="border-t border-stone-200 mt-20 pt-10 pb-20 px-6">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-start gap-10">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="bg-stone-200 text-stone-600 w-5 h-5 rounded flex items-center justify-center font-black text-[10px]">F</div>
              <span className="font-extrabold text-sm text-stone-800">FUIMA</span>
            </div>
            <p className="text-[11px] text-stone-400">{lang === "KOR" ? "© 2026 FUIMA. 주문이 들어오면, 알아서 보냅니다." : "© 2026 FUIMA. When orders arrive, we handle them seamlessly."}</p>
          </div>
          
          <div className="text-[11px] text-stone-400 space-y-1 flex flex-col text-left md:text-right">
            <p><strong>{lang === "KOR" ? "주식회사 푸이마" : "PUIMA Corp."}</strong></p>
            <p>{lang === "KOR" ? "대표자 김푸이마 · 사업자등록번호 123-45-67890" : "CEO: Kim Puima · Business Registration No: 123-45-67890"}</p>
            <p>{lang === "KOR" ? "통신판매업 신고번호 제2026-서울강남-001호" : "E-Commerce License: No. 2026-Seoul-Gangnam-001"}</p>
            <p>{lang === "KOR" ? "고객센터 contact@fuima.co.kr" : "Support: contact@fuima.co.kr"}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
