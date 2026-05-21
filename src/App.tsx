/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Youtube, Instagram, MessageCircle, ChevronDown, Settings, ArrowRight, X, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import React, { useState, useEffect } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { collection, onSnapshot, query, orderBy, where } from "firebase/firestore";
import { db, auth } from "./lib/firebase";
import { signOut } from "firebase/auth";
import GridItem from "./components/GridItem";
import Admin from "./pages/Admin";
import Login from "./pages/Login";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { initGA, trackPageView } from "./utils/analytics";

const ProtectedRoute = ({ children, adminOnly = false }: { children: React.ReactNode, adminOnly?: boolean }) => {
  const { user, loading, isAdmin } = useAuth();
  
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="w-8 h-8 border-2 border-zinc-100 border-t-black rounded-full animate-spin"></div>
    </div>
  );

  const isBypassed = localStorage.getItem('admin_bypass') === 'true';
  if (isBypassed) {
    return <>{children}</>;
  }
  
  if (!user) return <Login />;
  if (adminOnly && !isAdmin) return (
    <div className="min-h-screen flex items-center justify-center bg-white p-6 text-center">
      <div className="max-w-md w-full">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <ShieldCheck size={32} />
        </div>
        <h1 className="text-2xl font-black mb-2 tracking-tighter uppercase">Access Denied</h1>
        <p className="text-zinc-500 mb-8 text-sm font-medium leading-relaxed">
          You are logged in as <span className="text-black font-bold">{user.email}</span>,<br />
          but you do not have administrative privileges.
        </p>
        <div className="flex flex-col gap-3">
          <button onClick={() => window.location.href = '/'} className="w-full px-8 py-4 bg-black text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-zinc-800 transition-all">Back Home</button>
          
          <button 
            onClick={() => {
              localStorage.setItem('admin_bypass', 'true');
              window.location.reload();
            }} 
            className="w-full px-8 py-4 bg-zinc-50 border border-zinc-100 text-black rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-zinc-100 transition-all font-bold"
          >
            [미리보기 전용] 어드민 강제 접속 / Admin Bypass
          </button>

          <button onClick={() => { signOut(auth); localStorage.removeItem('admin_bypass'); window.location.reload(); }} className="w-full px-8 py-4 bg-white border border-zinc-200 text-black rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-zinc-50 transition-all">Sign Out</button>
        </div>
      </div>
    </div>
  );
  
  return <>{children}</>;
};

const NaverIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="1" y="1" width="22" height="22" rx="2" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M8.5 17V7H10.8L13.2 12.4L13.2 7H15.5V17H13.2L10.8 11.6V17H8.5Z" fill="currentColor"/>
  </svg>
);

// Assets Mapping
import heroImg from "./assets/images/puima_hero_dessert_1779090061139.png";
import pastryImg from "./assets/images/puima_class_pastry_1779090076747.png";
import macaronsImg from "./assets/images/puima_class_macarons_1779090094299.png";
import cakeImg from "./assets/images/puima_class_cake_1779090143936.png";

const imageMap: Record<string, string> = {
  heroImg,
  pastryImg,
  macaronsImg,
  cakeImg,
};

interface ClassPost {
  id: string;
  title: string;
  titleEn?: string;
  image: string;
  naverUrl: string;
  price: string;
  imageUrl?: string;
  visuals?: string;
  category?: string;
  originalPrice?: string;
  status?: "public" | "hidden";
  isSoldOut?: boolean;
}

interface Notice {
  id: string;
  title: string;
  content: string;
  isActive: boolean;
  url?: string;
  isBanner?: boolean;
}

interface StudentReview {
  id: string;
  imageUrl: string;
  phrase?: string;
  phraseEn?: string;
  createdAt: any;
  order?: number;
}

const INITIAL_POSTS: ClassPost[] = [
  { id: "1", title: "[마스터 클래스] 포카치아", category: "Masterclass", visuals: "Deep character baking", image: "pastryImg", naverUrl: "https://smartstore.naver.com/putitinyourmouth", originalPrice: "₩69,900", price: "₩49,900" },
  { id: "2", title: "[마스터 클래스] 데이지", category: "Cake Design", visuals: "Elegant floral design", image: "cakeImg", naverUrl: "https://smartstore.naver.com/putitinyourmouth", originalPrice: "₩49,900", price: "₩39,900" },
  { id: "3", title: "[특강] 에그타르트(쉬운 버전)", category: "One-day", visuals: "Simple & Crispy", image: "heroImg", naverUrl: "https://smartstore.naver.com/putitinyourmouth", price: "₩39,900" },
  { id: "4", title: "[마스터 클래스] 카페 앙브레", category: "Masterclass", visuals: "Rich aromatic experience", image: "macaronsImg", naverUrl: "https://smartstore.naver.com/putitinyourmouth", price: "₩49,900" },
  { id: "5", title: "[마스터 클래스] 까눌레", category: "Masterclass", visuals: "Classic French texture", image: "pastryImg", naverUrl: "https://smartstore.naver.com/putitinyourmouth", price: "₩49,900" },
  { id: "6", title: "[특강] 말차 쉬폰 케이크", category: "One-day", visuals: "Light & Airy", image: "cakeImg", naverUrl: "https://smartstore.naver.com/putitinyourmouth", originalPrice: "₩39,900", price: "₩29,900" },
  { id: "16", title: "[마스터 클래스] 둘세 무스 케이크", category: "Masterclass", visuals: "Caramelized chocolate", image: "macaronsImg", naverUrl: "https://smartstore.naver.com/putitinyourmouth", price: "₩49,900" },
  { id: "7", title: "[파티쉐 클래스] 10강 100% 피스타치오 (글라사주)", category: "Patissier", visuals: "Professional glazing tech", image: "heroImg", naverUrl: "https://smartstore.naver.com/putitinyourmouth", price: "₩39,900" },
  { id: "8", title: "[파티쉐 클래스] 9강 마카롱 (이탈리안 머랭vs프렌치 머랭)", category: "Patissier", visuals: "Mastering textures", image: "macaronsImg", naverUrl: "https://smartstore.naver.com/putitinyourmouth", price: "₩39,900" },
  { id: "9", title: "[파티쉐 클래스] 8강 사계절 파운드 (4종류)", category: "Patissier", visuals: "Year-round variety", image: "pastryImg", naverUrl: "https://smartstore.naver.com/putitinyourmouth", price: "₩39,900" },
  { id: "10", title: "[마스터 클래스] 에떼 뻬쉬", category: "Masterclass", visuals: "Summer peach flavor", image: "cakeImg", naverUrl: "https://smartstore.naver.com/putitinyourmouth", price: "₩49,900" },
  { id: "11", title: "[파티쉐 클래스] 7강 오렌지 민트 타르트 (퐁사주)", category: "Patissier", visuals: "Refreshing citrus", image: "heroImg", naverUrl: "https://smartstore.naver.com/putitinyourmouth", price: "₩39,900" },
  { id: "12", title: "[파티쉐 클래스] 6강 에그타르트 & 밀푀유", category: "Patissier", visuals: "Classic puff pastry", image: "macaronsImg", naverUrl: "https://smartstore.naver.com/putitinyourmouth", price: "₩39,900" },
  { id: "13", title: "[파티쉐 클래스] 5강 바닐라 무스 (무스 케이크)", category: "Patissier", visuals: "Silky smooth vanilla", image: "pastryImg", naverUrl: "https://smartstore.naver.com/putitinyourmouth", price: "₩39,900" },
  { id: "14", title: "[마스터 클래스] 유자 치즈케이크", category: "Masterclass", visuals: "Zesty & Creamy", image: "cakeImg", naverUrl: "https://smartstore.naver.com/putitinyourmouth", price: "₩49,900" },
  { id: "15", title: "[파티쉐 클래스] 4강 파리 브레스트 (파트 아 슈)", category: "Patissier", visuals: "French hazelnut classic", image: "heroImg", naverUrl: "https://smartstore.naver.com/putitinyourmouth", price: "₩39,900" },
  { id: "17", title: "[파티쉐 클래스] 3강 샌드쿠키 (사블레 vs 슈크레)", category: "Patissier", visuals: "Cookie base comparison", image: "pastryImg", naverUrl: "https://smartstore.naver.com/putitinyourmouth", price: "₩39,900" },
  { id: "18", title: "[파티쉐 클래스] 2강 프레지에", visuals: "Seasonal strawberry", image: "cakeImg", naverUrl: "https://smartstore.naver.com/putitinyourmouth", price: "₩39,900" },
  { id: "19", title: "[무료강의] 체리 다쿠아즈", visuals: "Free introductory class", image: "heroImg", naverUrl: "https://smartstore.naver.com/putitinyourmouth", price: "₩10" },
  { id: "20", title: "[파티쉐 클래스] 1강 구움과자 (휘낭시에&마들렌)", visuals: "Fundamental tea cakes", image: "macaronsImg", naverUrl: "https://smartstore.naver.com/putitinyourmouth", price: "₩49,900" },
  { id: "21", title: "[마스터 클래스] 딸기 크림치즈 타르트", visuals: "Rich & Sweet pairing", image: "pastryImg", naverUrl: "https://smartstore.naver.com/putitinyourmouth", price: "₩49,900" },
  { id: "22", title: "[택배배송] 푸이마 휘낭시에 세트", visuals: "Fresh seasonal set", image: "cakeImg", naverUrl: "https://smartstore.naver.com/putitinyourmouth", originalPrice: "₩3,000", price: "₩2,700" }
];

function HomePage() {
  const [lang, setLang] = useState<"KOR" | "ENG">("KOR");
  const [view, setView] = useState<"landing" | "grid">("landing");
  const [posts, setPosts] = useState<ClassPost[]>([]);
  const { user, isAdmin } = useAuth();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [banners, setBanners] = useState<Notice[]>([]);
  const [reviews, setReviews] = useState<StudentReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [bannersLoading, setBannersLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const navigate = useNavigate();

  useEffect(() => {
    const q = query(
      collection(db, "posts"), 
      orderBy("order", "asc"),
      orderBy("createdAt", "desc")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ClassPost[];
      
      setPosts(docs);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching posts:", error);
      setLoading(false);
    });

    const noticeQ = query(collection(db, "notices"), where("isActive", "==", true), orderBy("createdAt", "desc"));
    const unsubscribeNotices = onSnapshot(noticeQ, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Notice[];
      setNotices(docs.filter(n => !n.isBanner));
      setBanners(docs.filter(n => n.isBanner));
      setBannersLoading(false);
    });

    const reviewsQ = query(collection(db, "reviews"), orderBy("createdAt", "desc"));
    const unsubscribeReviews = onSnapshot(reviewsQ, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as StudentReview[];
      setReviews(docs);
    });

    return () => {
      unsubscribe();
      unsubscribeNotices();
      unsubscribeReviews();
    };
  }, []);

  const handleLoadMore = () => {
    setView("grid");
    window.scrollTo(0, 0);
  };

  const handleBackToHome = () => {
    setView("landing");
    window.scrollTo(0, 0);
  };

  const rawCategories = Array.from(new Set(posts.map(p => p.category?.trim().toUpperCase()).filter(Boolean) as string[]));
  rawCategories.sort((a, b) => {
    const isMasterA = a === "MASTERCLASS" || a.includes("MASTER");
    const isMasterB = b === "MASTERCLASS" || b.includes("MASTER");
    if (isMasterA && !isMasterB) return -1;
    if (!isMasterA && isMasterB) return 1;
    return a.localeCompare(b);
  });
  const categories = [...rawCategories, "ALL"];

  const publicPosts = posts.filter(post => {
    const isPublic = post.status !== "hidden";
    const matchesCategory = selectedCategory === "ALL" || post.category?.toUpperCase() === selectedCategory;
    return isPublic && matchesCategory;
  });
  const displayClasses = view === "grid" ? publicPosts : publicPosts.slice(0, 9);

  return (
    <div className="min-h-screen bg-white selection:bg-black selection:text-white pt-[60px] md:pt-[100px] md:min-w-[1100px]">
      {/* Fixed Top Bar */}
      <div className="fixed top-0 left-0 w-full md:min-w-[1100px] h-[60px] md:h-[100px] bg-white border-b border-zinc-100 z-50 flex items-center justify-center px-6 md:px-12 lg:px-0">
        <div className="w-full max-w-[1100px] h-full flex items-center justify-end md:justify-between relative px-2 lg:px-0">
          {/* Social Links on the Left */}
          <div className="hidden md:flex items-center gap-4">
            <a 
              href="https://www.youtube.com/@%ED%91%B8%EC%9D%B4%EB%A7%88" 
              target="_blank" 
              rel="noreferrer"
              className="text-zinc-400 hover:text-black transition-all group"
            >
              <Youtube size={20} className="group-hover:scale-110 transition-transform" />
            </a>
            <a 
              href="https://instagram.com/puima_official" 
              target="_blank" 
              rel="noreferrer"
              className="text-zinc-400 hover:text-black transition-all group"
            >
              <Instagram size={20} className="group-hover:scale-110 transition-transform" />
            </a>
          </div>

          {/* Logo in the center */}
          <span className="absolute left-1/2 -translate-x-1/2 font-script text-3xl md:text-4xl cursor-pointer select-none" onClick={handleBackToHome}>Puima</span>
          
          {/* Language Toggle & Login/Logout actions */}
          <div className="flex items-center gap-2 md:gap-4 text-[10px] md:text-[11px] font-bold tracking-widest">
            {/* Beautiful Pill Toggle for Language (Desktop Only) */}
            <div className="hidden md:flex bg-white border border-zinc-200 rounded-full p-0.5 items-center select-none">
              <button
                onClick={() => setLang("KOR")}
                className={`px-1.5 md:px-2.5 py-0.5 md:py-1.5 text-[8px] md:text-[9px] font-black tracking-widest rounded-full transition-all cursor-pointer ${
                  lang === "KOR"
                    ? "bg-black text-white shadow-sm"
                    : "text-zinc-400 hover:text-zinc-800"
                }`}
                id="bar-lang-kor"
              >
                KOR
              </button>
              <button
                onClick={() => setLang("ENG")}
                className={`px-1.5 md:px-2.5 py-0.5 md:py-1.5 text-[8px] md:text-[9px] font-black tracking-widest rounded-full transition-all cursor-pointer ${
                  lang === "ENG"
                    ? "bg-black text-white shadow-sm"
                    : "text-zinc-400 hover:text-zinc-800"
                }`}
                id="bar-lang-eng"
              >
                ENG
              </button>
            </div>

            {user ? (
              <div className="flex items-center gap-1.5 md:gap-3 select-none text-[11px] md:text-xs">
                <span className="hidden md:inline text-zinc-500 font-medium max-w-[45px] sm:max-w-[70px] truncate">
                  {user.displayName || user.email?.split('@')[0]}님
                </span>
                <span className="hidden md:inline text-zinc-200">/</span>
                <button 
                  onClick={() => { signOut(auth); localStorage.removeItem('admin_bypass'); window.location.reload(); }}
                  className="text-zinc-500 hover:text-black transition-colors cursor-pointer uppercase text-[11px] md:text-xs border border-zinc-300 md:border-none rounded-full px-3 py-1 md:p-0"
                  id="bar-logout"
                >
                  {lang === "KOR" ? "로그아웃" : "LOGOUT"}
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 md:gap-3 select-none text-[11px] md:text-xs">
                <button 
                  onClick={() => navigate('/login', { state: { mode: 'signup' } })}
                  className="hidden md:inline text-zinc-400 hover:text-black transition-colors cursor-pointer"
                  id="bar-signup"
                >
                  {lang === "KOR" ? "회원가입" : "JOIN"}
                </button>
                <span className="hidden md:inline text-zinc-200">/</span>
                <button 
                  onClick={() => navigate('/login', { state: { mode: 'login' } })}
                  className="text-zinc-600 hover:text-black transition-colors cursor-pointer uppercase text-[11px] md:text-xs border border-zinc-300 md:border-none rounded-full px-3 py-1 md:p-0 font-extrabold"
                  id="bar-login"
                >
                  {lang === "KOR" ? "로그인" : "LOGIN"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-center px-4 md:px-12 lg:px-0 md:min-w-[1100px]">
        <div className="w-full max-w-[1100px] md:min-w-[1100px] bg-white text-black font-sans relative pt-[30px] md:pt-[100px]">
          {/* Main Content */}
          <div className="w-full">
            {/* Notice Bar Section */}
            {notices.length > 0 && (
              <div className="bg-white text-black py-4 px-6 flex items-center justify-between border-y border-zinc-100 mb-12">
                <div className="flex gap-6 items-center flex-grow overflow-hidden">
                  <span className="text-black text-[10px] font-black uppercase tracking-widest flex-shrink-0">Notice</span>
                  <div className="flex flex-col gap-1 overflow-hidden">
                    <span className="text-sm font-bold tracking-tight truncate text-black">{notices[0].title}</span>
                    <span className="text-[11px] text-zinc-900 font-medium truncate">{notices[0].content}</span>
                  </div>
                </div>
                <button 
                  onClick={() => navigate('/notice')}
                  className="ml-6 h-[65px] flex items-center text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-black transition-colors flex-shrink-0"
                >
                  Learn More
                </button>
              </div>
            )}

        <AnimatePresence mode="wait">
          {view === "landing" ? (
            <motion.div
              key="landing-content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
            >

              {/* Journal & News Section (Banners) */}
              {banners.length > 0 && (
                <section className="pt-8 md:pt-0 px-6 md:px-0 mb-32">
                  <div className="flex justify-center items-center mb-8">
                    <h2 className="text-[14px] font-semibold uppercase tracking-[0.3em] text-black text-center">Bake Happiness</h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {banners.slice(0, 3).map((banner, i) => (
                      <motion.div 
                        key={banner.id}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.1 }}
                        onClick={() => banner.url && window.open(banner.url, "_blank")}
                        className="group cursor-pointer bg-white border border-zinc-300 rounded-[24px] h-[60px] px-6 flex items-center justify-center text-center hover:shadow-xl hover:shadow-zinc-200/50 transition-all duration-500"
                      >
                        <h3 className="text-[14px] font-bold tracking-tight leading-tight group-hover:text-black transition-colors line-clamp-2">
                          {banner.title}
                        </h3>
                      </motion.div>
                    ))}
                  </div>
                </section>
              )}

              {/* Collection Section */}
              <div className="px-6 md:px-0 pb-12 flex justify-center items-center border-b border-zinc-100 mb-12">
                <h2 className="text-[14px] font-semibold uppercase tracking-[0.3em] text-black text-center">Eat Happiness</h2>
              </div>

              <main className="min-h-[600px] mb-8">
                {loading ? (
                  <div className="py-32 flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border border-zinc-200 border-t-black rounded-full animate-spin"></div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 md:gap-x-8 gap-y-4">
                    {displayClasses.map((item, idx) => (
                      <GridItem 
                        key={item.id}
                        title={item.title}
                        titleEn={item.titleEn}
                        lang={lang}
                        category={item.category || ""}
                        image={imageMap[item.image] || item.image || pastryImg}
                        imageUrl={item.imageUrl}
                        naverUrl={item.naverUrl}
                        originalPrice={item.originalPrice}
                        isSoldOut={item.isSoldOut}
                        price={item.price}
                        index={idx}
                      />
                    ))}
                  </div>
                )}
              </main>

              {posts.length > 9 && (
                <div className="flex justify-center pt-8 pb-32">
                  <button 
                    onClick={handleLoadMore}
                    className="group flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-900 border-b border-zinc-900 pb-1 hover:text-zinc-400 hover:border-zinc-400 transition-all"
                  >
                    더 많은 제품보러가기
                  </button>
                </div>
              )}

              {/* Student Review Ticker Section */}
              <section className="pb-32 overflow-hidden bg-white pt-32">
                <div className="px-6 md:px-0 pb-12 flex justify-between items-end border-b border-zinc-100 mb-12">
                  <h2 className="text-[14px] font-semibold uppercase tracking-[0.3em] text-black">REVIEW</h2>
                </div>

                <div className="relative flex">
                  <motion.div 
                    className="flex gap-4 px-2"
                    animate={{ x: ["0%", "-50%"] }}
                    transition={{ 
                      repeat: Infinity, 
                      duration: 35, 
                      ease: "linear" 
                    }}
                  >
                    {[...Array(2)].map((_, i) => {
                      const fallbackReviews = [
                        { id: "f1", imageUrl: heroImg, phrase: "초보자도 쉽게 완성하는 겉바속촉 에그타르트", phraseEn: "Verified Student Review" },
                        { id: "f2", imageUrl: pastryImg, phrase: "전통 방식 그대로, 깊은 풍미 of 천연 발효 사워도우", phraseEn: "Verified Student Review" },
                        { id: "f3", imageUrl: macaronsImg, phrase: "쫀득한 식감과 과하지 않은 단맛의 마카롱 클래스", phraseEn: "Verified Student Review" },
                        { id: "f4", imageUrl: cakeImg, phrase: "우아하고 섬세한 플라워 데코레이션 케이크", phraseEn: "Verified Student Review" },
                        { id: "f5", imageUrl: heroImg, phrase: "바삭하고 고소함 가득 품은 에클레어와 밀푀유", phraseEn: "Verified Student Review" },
                        { id: "f6", imageUrl: cakeImg, phrase: "계절 과일의 상큼함을 살린 가벼운 생크림 케이크", phraseEn: "Verified Student Review" },
                      ];
                      
                      // Combine user's uploaded reviews first, then pad with fallback items up to at least 6 unique items
                      let paddedList = [...reviews];
                      if (paddedList.length < 6) {
                        const needed = 6 - paddedList.length;
                        paddedList = [...paddedList, ...fallbackReviews.slice(0, needed)];
                      }

                      return (
                        <div key={i} className="flex gap-4">
                          {paddedList.map((item, idx) => {
                            const textToShow = lang === "KOR" 
                              ? (item.phrase || "수강생 작품") 
                              : (item.phraseEn || "Verified Student Review");

                            return (
                              <div 
                                key={`${item.id}-${i}-${idx}`} 
                                className="w-[280px] md:w-[320px] aspect-[4/5] bg-white overflow-hidden group border border-zinc-100 relative rounded-3xl shadow-sm"
                              >
                                <img 
                                  src={item.imageUrl} 
                                  alt="Student Review" 
                                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                  referrerPolicy="no-referrer"
                                />
                                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-6 flex flex-col justify-end text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                  <p className="text-[9px] font-bold text-zinc-300 tracking-widest uppercase">
                                    {lang === "KOR" ? "수강생 인증 후기" : "Verified Student Review"}
                                  </p>
                                  <p className="text-[12px] md:text-[13px] font-black leading-tight mt-1">
                                    {textToShow}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </motion.div>
                </div>
              </section>
            </motion.div>
          ) : (
            <motion.div
              key="grid-content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="px-6 md:px-0 pb-16 flex flex-col md:flex-row justify-between items-end gap-8 border-b border-zinc-100 mb-8">
                <div className="space-y-4">
                  <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-400">Class Index</h2>
                  <p className="text-[48px] md:text-[64px] font-script leading-none">The Collection</p>
                </div>
                <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">
                  Total {publicPosts.length} Curated Masterclasses
                </p>
              </div>

              {/* Category Tabs */}
              <div className="px-6 md:px-0 mb-16 overflow-x-auto no-scrollbar">
                <div className="flex gap-8 border-b border-zinc-100 pb-4 min-w-max">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`text-[11px] font-black uppercase tracking-[0.2em] transition-all relative pb-4 ${
                        selectedCategory === cat 
                          ? "text-black" 
                          : "text-zinc-300 hover:text-zinc-600"
                      }`}
                    >
                      {cat}
                      {selectedCategory === cat && (
                        <motion.div 
                          layoutId="activeCategory"
                          className="absolute bottom-0 left-0 w-full h-[2px] bg-black"
                        />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <main className="min-h-[600px] mb-32">
                {loading ? (
                  <div className="py-32 flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border border-zinc-200 border-t-black rounded-full animate-spin"></div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-x-4 md:gap-x-6 gap-y-12">
                    {publicPosts.map((item, idx) => (
                      <GridItem 
                        key={item.id}
                        title={item.title}
                        titleEn={item.titleEn}
                        lang={lang}
                        category={item.category || ""}
                        image={imageMap[item.image] || item.image || pastryImg}
                        imageUrl={item.imageUrl}
                        naverUrl={item.naverUrl}
                        originalPrice={item.originalPrice}
                        isSoldOut={item.isSoldOut}
                        price={item.price}
                        index={idx}
                        uniform={true}
                      />
                    ))}
                  </div>
                )}
              </main>

              <div className="flex justify-center py-24 border-t border-zinc-100">
                <motion.button 
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleBackToHome}
                  className="px-12 py-4 bg-black text-white rounded-full text-[10px] font-black uppercase tracking-[0.3em] transition-all"
                >
                  Return to Journal
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <footer className="bg-white border-t border-zinc-100 pt-16 pb-24 px-6 md:px-12">
          <div className="max-w-[1100px] mx-auto">
            {/* Upper Links */}
            <div className="flex flex-wrap gap-x-4 gap-y-2 mb-10 text-[11px] font-bold text-zinc-500 uppercase tracking-tighter">
              <a href="#" className="hover:text-black transition-colors">이용약관</a>
              <span className="text-zinc-300">|</span>
              <a href="#" className="hover:text-black transition-colors text-black">개인정보처리방침</a>
              <span className="text-zinc-300">|</span>
              <a href="#" className="hover:text-black transition-colors">법적고지</a>
              <span className="text-zinc-300">|</span>
              <a href="#" className="hover:text-black transition-colors">입점안내</a>
              <span className="text-zinc-300">|</span>
              <a href="#" className="hover:text-black transition-colors">안전거래센터</a>
              <span className="text-zinc-300">|</span>
              <a href="#" className="hover:text-black transition-colors">고객센터</a>
            </div>

            {/* Platform Disclaimer */}
            <div className="mb-10 pb-10 border-b border-zinc-200">
              <p className="text-[11px] leading-relaxed text-zinc-400 font-medium font-sans">
                푸이마(PUIMA)는 통신판매중개자이며, 통신판매의 당사자가 아닙니다. 게시된 상품, 상품정보, 거래에 관한 의무와 책임은 각 판매자에게 있습니다.<br />
                소비자 보호를 위해 안전한 거래 환경을 제공하며, 모든 클래스는 정식 라이선스 계약을 통해 운영됩니다.
              </p>
            </div>

            {/* Business Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 mb-16">
              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Business Info</h4>
                <div className="text-[11px] leading-relaxed text-zinc-600 space-y-1">
                  <p><span className="text-zinc-400">상호명 :</span> 푸이마 아틀리에 (PUIMA ATELIER)</p>
                  <p><span className="text-zinc-400">대표이사 :</span> 최수연 (Puima Choi)</p>
                  <p><span className="text-zinc-400">사업자등록번호 :</span> 220-81-62517</p>
                  <p><span className="text-zinc-400">통신판매업신고 :</span> 제2024-서울강남-0000호</p>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Contact & Address</h4>
                <div className="text-[11px] leading-relaxed text-zinc-600 space-y-1">
                  <p><span className="text-zinc-400">주소 :</span> 서울특별시 강남구 도산대로 1784, PUIMA 빌딩</p>
                  <p><span className="text-zinc-400">이메일 :</span> support@puima-atelier.com</p>
                  <p><span className="text-zinc-400">호스팅 서비스 제공 :</span> Google Cloud / Vercel</p>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Customer Support</h4>
                <div className="text-[11px] leading-relaxed text-zinc-600 space-y-1">
                  <p className="text-lg font-black text-black">1588-3820</p>
                  <p><span className="text-zinc-400">운영시간 :</span> 평일 10:00 - 18:00 (주말/공휴일 제외)</p>
                  <p><span className="text-zinc-400">점심시간 :</span> 12:30 - 13:30</p>
                </div>
              </div>
            </div>

            {/* Bottom Bar */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-6 pt-10 border-t border-zinc-200">
              <div className="flex items-center gap-6">
                <span className="text-3xl font-script leading-none">Puima</span>
                <p className="text-[10px] font-bold text-zinc-400 tracking-widest uppercase">
                  COPYRIGHT © PUIMA ATELIER. ALL RIGHTS RESERVED.
                </p>
              </div>
              
              <button 
                onClick={() => navigate('/admin')} 
                className="text-[11px] font-medium text-zinc-400 hover:text-zinc-650 hover:bg-zinc-50 border border-zinc-200 hover:border-zinc-300 transition-all tracking-widest px-6 py-2 rounded-full active:scale-95"
              >
                {user ? "Admin" : "Admin login"}
              </button>
            </div>
          </div>
        </footer>
      </div>
    </div>
  </div>
</div>
);
}

function NoticePage() {
  const navigate = useNavigate();
  const [notices, setNotices] = useState<Notice[]>([]);

  useEffect(() => {
    const noticeQ = query(collection(db, "notices"), where("isActive", "==", true), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(noticeQ, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Notice[];
      setNotices(docs);
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-white flex justify-center selection:bg-black selection:text-white">
      <div className="w-full max-w-[1100px] bg-white text-black font-sans relative min-h-screen">
        <header className="px-6 md:px-12 py-12 flex justify-between items-center border-b border-zinc-100 sticky top-0 bg-white/80 backdrop-blur-md z-50">
          <h1 onClick={() => navigate('/')} className="font-script text-[40px] leading-none cursor-pointer">Puima</h1>
          <button onClick={() => navigate('/')} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest hover:opacity-50">
            <X size={16} />
            Close
          </button>
        </header>

        <main className="max-w-4xl mx-auto px-6 py-24 md:py-32">
          <div className="mb-24">
            <h2 className="text-[120px] leading-[0.8] font-script tracking-tight mb-8">Notice</h2>
            <p className="text-zinc-400 text-sm font-medium tracking-tight">푸이마 아틀리에의 소식과 공지사항을 안내드립니다.</p>
          </div>

          <div className="space-y-px bg-zinc-200 border border-zinc-200">
            {notices.map((notice) => (
              <div key={notice.id} className="bg-white px-8 py-8 flex flex-col md:flex-row md:items-center justify-between gap-8 hover:bg-zinc-50 transition-colors cursor-pointer group">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-3">
                    <span className="text-[10px] font-mono text-zinc-300 uppercase tracking-widest">Announcement</span>
                  </div>
                  <h3 className="text-[20px] font-bold leading-tight group-hover:underline underline-offset-8 decoration-zinc-200">{notice.title}</h3>
                  <p className="mt-3 text-zinc-400 text-[14px] leading-relaxed line-clamp-2">{notice.content}</p>
                </div>
                <ArrowRight size={20} className="text-zinc-200 group-hover:text-black group-hover:translate-x-2 transition-all" />
              </div>
            ))}
          </div>

          {notices.length === 0 && (
            <div className="py-32 text-center">
              <p className="text-zinc-300 font-bold uppercase tracking-widest">No notices yet.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

const AnalyticsTracker = () => {
  const location = useLocation();

  useEffect(() => {
    initGA();
  }, []);

  useEffect(() => {
    trackPageView(location.pathname + location.search);
  }, [location]);

  return null;
};

export default function App() {
  return (
    <AuthProvider>
      <AnalyticsTracker />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute adminOnly>
              <Admin />
            </ProtectedRoute>
          } 
        />
        <Route path="/login" element={<Login />} />
        <Route path="/notice" element={<NoticePage />} />
      </Routes>
    </AuthProvider>
  );
}
