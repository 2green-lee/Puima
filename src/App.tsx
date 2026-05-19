/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Youtube, Instagram, MessageCircle, ChevronDown, Settings, ArrowRight, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useState, useEffect } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { collection, onSnapshot, query, orderBy, where } from "firebase/firestore";
import { db } from "./lib/firebase";
import GridItem from "./components/GridItem";
import Admin from "./pages/Admin";

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

const INITIAL_POSTS: ClassPost[] = [
  { id: "1", title: "[마스터 클래스] 포카치아", category: "Masterclass", visuals: "Deep character baking", image: "pastryImg", naverUrl: "https://smartstore.naver.com/putitinyourmouth", originalPrice: "₩69,900", price: "₩49,900" },
  { id: "2", title: "[마스터 클래스] 데이지", category: "Cake Design", visuals: "Elegant floral design", image: "cakeImg", naverUrl: "https://smartstore.naver.com/putitinyourmouth", originalPrice: "₩49,900", price: "₩39,900" },
  { id: "3", title: "[특강] 에그타르트(쉬운 버전)", category: "One-day", visuals: "Simple & Crispy", image: "heroImg", naverUrl: "https://smartstore.naver.com/putitinyourmouth", price: "₩39,900" },
  { id: "4", title: "[마스터 클래스] 카페 앙브레", category: "Masterclass", visuals: "Rich aromatic experience", image: "macaronsImg", naverUrl: "https://smartstore.naver.com/putitinyourmouth", price: "₩49,900" },
  { id: "5", title: "[마스터 클래스] 까눌레", category: "Masterclass", visuals: "Classic French texture", image: "pastryImg", naverUrl: "https://smartstore.naver.com/putitinyourmouth", price: "₩49,900" },
  { id: "6", title: "[특강] 말차 쉬폰 케이크", category: "One-day", visuals: "Light & Airy", image: "cakeImg", naverUrl: "https://smartstore.naver.com/putitinyourmouth", originalPrice: "₩39,900", price: "₩29,900" },
  { id: "7", title: "[파티쉐 클래스] 10강 100% 피스타치오 (글라사주)", category: "Patissier", visuals: "Professional glazing tech", image: "heroImg", naverUrl: "https://smartstore.naver.com/putitinyourmouth", price: "₩39,900" },
  { id: "8", title: "[파티쉐 클래스] 9강 마카롱 (이탈리안 머랭vs프렌치 머랭)", category: "Patissier", visuals: "Mastering textures", image: "macaronsImg", naverUrl: "https://smartstore.naver.com/putitinyourmouth", price: "₩39,900" },
  { id: "9", title: "[파티쉐 클래스] 8강 사계절 파운드 (4종류)", category: "Patissier", visuals: "Year-round variety", image: "pastryImg", naverUrl: "https://smartstore.naver.com/putitinyourmouth", price: "₩39,900" },
  { id: "10", title: "[마스터 클래스] 에떼 뻬쉬", category: "Masterclass", visuals: "Summer peach flavor", image: "cakeImg", naverUrl: "https://smartstore.naver.com/putitinyourmouth", price: "₩49,900" },
  { id: "11", title: "[파티쉐 클래스] 7강 오렌지 민트 타르트 (퐁사주)", category: "Patissier", visuals: "Refreshing citrus", image: "heroImg", naverUrl: "https://smartstore.naver.com/putitinyourmouth", price: "₩39,900" },
  { id: "12", title: "[파티쉐 클래스] 6강 에그타르트 & 밀푀유", category: "Patissier", visuals: "Classic puff pastry", image: "macaronsImg", naverUrl: "https://smartstore.naver.com/putitinyourmouth", price: "₩39,900" },
  { id: "13", title: "[파티쉐 클래스] 5강 바닐라 무스 (무스 케이크)", category: "Patissier", visuals: "Silky smooth vanilla", image: "pastryImg", naverUrl: "https://smartstore.naver.com/putitinyourmouth", price: "₩39,900" },
  { id: "14", title: "[마스터 클래스] 유자 치즈케이크", category: "Masterclass", visuals: "Zesty & Creamy", image: "cakeImg", naverUrl: "https://smartstore.naver.com/putitinyourmouth", price: "₩49,900" },
  { id: "15", title: "[파티쉐 클래스] 4강 파리 브레스트 (파트 아 슈)", category: "Patissier", visuals: "French hazelnut classic", image: "heroImg", naverUrl: "https://smartstore.naver.com/putitinyourmouth", price: "₩39,900" },
  { id: "16", title: "[마스터 클래스] 둘세 무스 케이크", category: "Masterclass", visuals: "Caramelized chocolate", image: "macaronsImg", naverUrl: "https://smartstore.naver.com/putitinyourmouth", price: "₩49,900" },
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
  const [notices, setNotices] = useState<Notice[]>([]);
  const [banners, setBanners] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
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
    });

    return () => {
      unsubscribe();
      unsubscribeNotices();
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

  const publicPosts = posts.filter(post => post.status !== "hidden");
  const displayClasses = view === "grid" ? publicPosts : publicPosts.slice(0, 9);

  return (
    <div className="min-h-screen bg-white flex justify-center selection:bg-black selection:text-white">
      <div className="w-full max-w-[1200px] bg-white text-black font-sans relative">
        {/* Language Toggle */}
        <div className="absolute top-10 right-6 md:right-0 flex gap-3 text-[11px] font-bold tracking-widest z-20">
          <button 
            onClick={() => setLang("KOR")} 
            className={`${lang === "KOR" ? "text-black" : "text-zinc-300"} cursor-pointer transition-colors hover:text-black pb-0.5 ${lang === "KOR" ? "border-b border-black" : ""}`}
          >
            KOR
          </button>
          <span className="text-zinc-200">/</span>
          <button 
            onClick={() => setLang("ENG")} 
            className={`${lang === "ENG" ? "text-black" : "text-zinc-300"} cursor-pointer transition-colors hover:text-black pb-0.5 ${lang === "ENG" ? "border-b border-black" : ""}`}
          >
            ENG
          </button>
        </div>

        {/* Huge Title Header */}
        <header className="px-6 md:px-0 py-12 flex justify-between items-end">
          <motion.h1 
            layoutId="logo"
            onClick={handleBackToHome}
            className="text-hero cursor-pointer"
          >
            Puima
          </motion.h1>
          {view === "grid" && (
            <motion.button
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              whileHover={{ y: -2, scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleBackToHome}
              className="mb-4 text-[13px] font-bold border-b-2 border-black pb-1 hover:text-zinc-500 hover:border-zinc-500 transition-colors"
            >
              Back to Home
            </motion.button>
          )}
        </header>

        {/* Notices Section */}
        {notices.length > 0 && (
          <div className="bg-black text-white py-4 px-6 md:px-12 flex items-center justify-between border-y border-white/10">
            <div className="flex gap-6 items-center flex-grow overflow-hidden">
              <span className="bg-white text-black px-2 py-0.5 text-[10px] font-black uppercase tracking-widest rounded-sm flex-shrink-0">Notice</span>
              <div className="flex flex-col gap-1 overflow-hidden">
                <span className="text-sm font-bold tracking-tight truncate">{notices[0].title}</span>
                <span className="text-[11px] text-zinc-500 font-medium truncate">{notices[0].content}</span>
              </div>
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
          {view === "landing" ? (
            <motion.div
              key="landing-content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
            >
              {/* Bio Section */}
              <section className="px-6 md:px-0 flex flex-col md:flex-row justify-between items-start gap-12 pb-24">
                <div className="max-w-xl space-y-8">
                  <div className="space-y-1">
                    <p className="text-[18px] font-bold tracking-tight text-black">
                      BAKE HAPPINESS, EAT HAPPINESS
                    </p>
                    <p className="text-[14px] font-bold text-zinc-400">
                      {lang === "KOR" ? "함께 행복을 굽고, 먹어요." : "Bake happiness, eat happiness together."}
                    </p>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-8 text-[13px] font-bold">
                  <a href="https://www.youtube.com/@%ED%91%B8%EC%9D%B4%EB%A7%88" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:opacity-50 transition-opacity">
                    <Youtube size={18} />
                    Youtube
                  </a>
                  <a href="https://www.instagram.com/puima_official/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:opacity-50 transition-opacity">
                    <Instagram size={18} />
                    Instagram
                  </a>
                  <a href="https://smartstore.naver.com/putitinyourmouth" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:opacity-50 transition-opacity">
                    <NaverIcon size={18} />
                    Naver
                  </a>
                  <a href="#" className="hidden md:flex items-center gap-2 hover:opacity-50 transition-opacity">
                    <MessageCircle size={18} />
                    Kakao
                  </a>
                </div>
              </section>

              {/* Notice Preview Section */}
              <section className="mb-16 md:mb-32">
                <div className="px-6 md:px-0 py-12 flex justify-between items-end">
                  <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-zinc-300">Latest Updates</h2>
                  <button 
                    onClick={() => navigate("/notice")} 
                    className="text-[10px] font-black uppercase tracking-widest border-b border-black pb-1 hover:text-zinc-400 hover:border-zinc-400 transition-all flex items-center gap-2"
                  >
                    View More <ArrowRight size={14} />
                  </button>
                </div>
                
                <div className="px-6 md:px-0 grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Banner Items from Firestore */}
                  {banners.slice(0, 2).map((banner) => (
                    <a 
                      key={banner.id}
                      href={banner.url || "#"} 
                      target={banner.url?.startsWith("http") ? "_blank" : "_self"}
                      rel="noopener noreferrer" 
                      className="group bg-white rounded-2xl px-8 py-6 hover:bg-zinc-50 transition-all flex items-center justify-between min-h-[80px] border border-zinc-100 shadow-sm hover:shadow-md"
                    >
                      <p className="text-[15px] font-bold leading-tight group-hover:translate-x-1 transition-transform text-zinc-800">
                        {banner.title}
                      </p>
                      <ArrowRight size={18} className="text-zinc-300 group-hover:text-black transition-colors shrink-0 ml-4" />
                    </a>
                  ))}

                  {/* Fallback if less than 2 banners */}
                  {banners.length < 2 && (
                    <>
                      {banners.length === 0 && (
                        <a 
                          href="https://smartstore.naver.com/putitinyourmouth" 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="group bg-white rounded-2xl px-8 py-6 hover:bg-zinc-50 transition-all flex items-center justify-between min-h-[80px] border border-zinc-100 shadow-sm hover:shadow-md"
                        >
                          <p className="text-[15px] font-bold leading-tight group-hover:translate-x-1 transition-transform text-zinc-800">
                            시그니처 구움과자 주문하기
                          </p>
                          <ArrowRight size={18} className="text-zinc-300 group-hover:text-black transition-colors shrink-0 ml-4" />
                        </a>
                      )}
                      {(banners.length === 0 || banners.length === 1) && (
                        <a 
                          href="#" 
                          className="group bg-white rounded-2xl px-8 py-6 hover:bg-zinc-50 transition-all flex items-center justify-between min-h-[80px] border border-zinc-100 shadow-sm hover:shadow-md"
                        >
                          <p className="text-[15px] font-bold leading-tight group-hover:translate-x-1 transition-transform text-zinc-800">
                            푸이마 101 온라인 클래스
                          </p>
                          <ArrowRight size={18} className="text-zinc-300 group-hover:text-black transition-colors shrink-0 ml-4" />
                        </a>
                      )}
                    </>
                  )}

                  <div 
                    onClick={() => navigate('/notice')}
                    className="group cursor-pointer bg-white rounded-2xl px-8 py-6 hover:bg-zinc-50 transition-all flex items-center justify-between min-h-[80px] border border-zinc-100 shadow-sm hover:shadow-md"
                  >
                    {notices.length > 0 ? (
                      <>
                        <div className="space-y-1">
                          <p className="text-[9px] uppercase tracking-widest text-zinc-400 font-bold">New Post</p>
                          <p className="text-[15px] font-bold leading-tight line-clamp-1 group-hover:translate-x-1 transition-transform text-zinc-800">
                            {notices[0].title}
                          </p>
                        </div>
                        <ArrowRight size={18} className="text-zinc-300 group-hover:text-black transition-colors shrink-0 ml-4" />
                      </>
                    ) : (
                      <div className="opacity-40">
                        <p className="text-[15px] font-bold leading-tight italic text-zinc-300">
                          New update coming soon...
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </section>

              {/* Main Grid */}
              <main className="border border-zinc-200 min-h-[600px] relative">
                {loading ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/50 z-10">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-10 h-10 border-2 border-zinc-200 border-t-black rounded-full animate-spin"></div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Loading Masterclasses...</span>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3">
                    {displayClasses.map((item, idx) => (
                      <GridItem 
                        key={item.id}
                        title={item.title}
                        category={item.category || ""}
                        visuals={item.visuals || ""}
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
                <div className="flex justify-center py-24">
                  <button 
                    onClick={handleLoadMore}
                    className="px-10 py-3 bg-black text-white rounded-full text-[13px] font-bold hover:bg-zinc-800 transition-all active:scale-95"
                  >
                    View All Masterclasses
                  </button>
                </div>
              )}

              {/* Student Review Ticker Section */}
              <section className="pb-32 overflow-hidden border-t border-zinc-100">
                <div className="px-6 md:px-12 py-12 flex flex-col md:flex-row justify-between items-end gap-6 mb-12">
                  <div>
                    <h2 className="text-[12px] font-black uppercase tracking-[0.3em] text-zinc-300 mb-4">Student Masterpieces</h2>
                    <p className="text-[32px] font-serif italic tracking-tighter leading-tight">
                      {lang === "KOR" ? "수강생분들이 직접 완성한 예술" : "Art completed by our students"}
                    </p>
                  </div>
                  <p className="text-[12px] font-bold text-zinc-400 max-w-[200px] leading-relaxed">
                    Over 2,400+ students have started their baking journey with Puima.
                  </p>
                </div>

                <div className="relative flex">
                  <motion.div 
                    className="flex gap-4 px-2"
                    animate={{ x: ["0%", "-50%"] }}
                    transition={{ 
                      repeat: Infinity, 
                      duration: 30, 
                      ease: "linear" 
                    }}
                  >
                    {/* Double the images for seamless loop */}
                    {[...Array(2)].map((_, i) => (
                      <div key={i} className="flex gap-4">
                        {[heroImg, pastryImg, macaronsImg, cakeImg, heroImg, cakeImg].map((img, idx) => (
                          <div 
                            key={idx} 
                            className="w-[280px] md:w-[320px] aspect-[4/5] bg-zinc-100 overflow-hidden group border border-zinc-200"
                          >
                            <img 
                              src={img} 
                              alt="Student Review" 
                              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
                              <p className="text-white text-[11px] font-bold tracking-widest uppercase">Verified Student Review</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
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
              transition={{ duration: 0.4, ease: "easeInOut" }}
            >
              <div className="px-6 md:px-12 pb-12">
                <p className="text-[13px] font-bold uppercase tracking-[0.2em] text-zinc-400">
                  Collection • {posts.length} masterclasses
                </p>
              </div>

              {/* Main Grid */}
              <main className="border border-zinc-200 min-h-[600px] relative">
                {loading ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/50 z-10">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-10 h-10 border-2 border-zinc-200 border-t-black rounded-full animate-spin"></div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Loading masterclasses...</span>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3">
                    {publicPosts.map((item, idx) => (
                      <GridItem 
                        key={item.id}
                        title={item.title}
                        category={item.category || ""}
                        visuals={item.visuals || ""}
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

              <div className="flex justify-center py-24">
                <motion.button 
                  whileHover={{ scale: 1.05, backgroundColor: "#000", color: "#fff" }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleBackToHome}
                  className="px-10 py-3 border border-black text-black rounded-full text-[13px] font-bold transition-all"
                >
                  Return to Home
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Contact Section */}
        <section className="bg-black text-white pt-48 pb-32 px-6 md:px-12 text-center">
          <motion.h2 
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-[4vw] md:text-[3vw] leading-[1.2] font-black tracking-tight mb-12 uppercase"
          >
            {lang === "KOR" ? (
              <div className="space-y-8">
                <p>
                  유튜브 무료 레시피만 찾고<br />
                  <span className="underline decoration-white/30 underline-offset-8">행동을 미루는</span> 분들께는<br />
                  죄송하지만,<br />
                  <span className="text-amber-400 font-serif italic normal-case">이 수업은 맞지 않습니다.</span>
                </p>
                <p>
                  우리는 <span className="underline decoration-white/30 underline-offset-8">직접 손을 더럽히고</span>,<br />
                  현장에서 결과를 내는<br />
                  <span className="text-amber-400 font-serif italic normal-case">행동하는 사람을 위한<br />수업입니다.</span>
                </p>
              </div>
            ) : (
              <div className="space-y-8">
                <p>
                  For those who only look for free recipes<br />
                  and <span className="underline decoration-white/30 underline-offset-8">procrastinate taking action</span>,<br />
                  we are sorry, but<br />
                  <span className="text-amber-400 font-serif italic normal-case">this class is not for you.</span>
                </p>
                <p>
                  We are a class for<br />
                  <span className="underline decoration-white/30 underline-offset-8">those who get their hands dirty</span>,<br />
                  and <span className="text-amber-400 font-serif italic normal-case">take action to get results<br />in the field.</span>
                </p>
              </div>
            )}
          </motion.h2>
          
          <div className="flex flex-wrap justify-center gap-x-10 gap-y-6 text-[13px] font-bold">
            <a href="https://www.youtube.com/@%ED%91%B8%EC%9D%B4%EB%A7%88" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:opacity-50 transition-opacity">
              <Youtube size={18} />
              Youtube
            </a>
            <a href="https://www.instagram.com/puima_official/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:opacity-50 transition-opacity">
              <Instagram size={18} />
              Instagram
            </a>
            <a href="https://smartstore.naver.com/putitinyourmouth" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:opacity-50 transition-opacity">
              <NaverIcon size={18} />
              {lang === "KOR" ? "네이버 스토어" : "Naver Store"}
            </a>
            <a href="#" className="hidden md:flex items-center gap-2 hover:opacity-50 transition-opacity">
              <MessageCircle size={18} />
              Kakao
            </a>
          </div>
        </section>

        <footer className="bg-white border-t border-zinc-100 pt-16 pb-24 px-6 md:px-12">
          <div className="max-w-[1200px] mx-auto">
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
              <p className="text-[11px] leading-relaxed text-zinc-400 font-medium">
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
                <span className="text-xl font-black tracking-tighter uppercase">Puima</span>
                <p className="text-[10px] font-bold text-zinc-400 tracking-widest">
                  COPYRIGHT © PUIMA ATELIER. ALL RIGHTS RESERVED.
                </p>
              </div>
              
              <button 
                onClick={() => window.location.href='/admin'} 
                className="text-[9px] font-bold text-zinc-300 hover:text-black transition-all uppercase tracking-widest border border-zinc-200 px-4 py-2 rounded-full hover:border-black"
              >
                Admin Panel
              </button>
            </div>
          </div>
        </footer>
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
      <div className="w-full max-w-[1200px] bg-white text-black font-sans relative min-h-screen">
        <header className="px-6 md:px-12 py-12 flex justify-between items-center border-b border-zinc-100 sticky top-0 bg-white/80 backdrop-blur-md z-50">
          <h1 onClick={() => navigate('/')} className="text-[32px] font-serif italic tracking-tighter cursor-pointer">Puima</h1>
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

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="/notice" element={<NoticePage />} />
    </Routes>
  );
}
