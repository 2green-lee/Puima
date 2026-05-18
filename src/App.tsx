/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Youtube, Instagram, MessageCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useState, useEffect } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
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
  visuals: string;
  image: string;
  naverUrl: string;
  originalPrice?: string;
  price: string;
  rating?: string;
  reviews?: string;
}

function HomePage() {
  const [lang, setLang] = useState<"KOR" | "ENG">("KOR");
  const [view, setView] = useState<"landing" | "grid">("landing");
  const [posts, setPosts] = useState<ClassPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ClassPost[];
      setPosts(docs);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLoadMore = () => {
    setView("grid");
    window.scrollTo(0, 0);
  };

  const handleBackToHome = () => {
    setView("landing");
    window.scrollTo(0, 0);
  };

  const displayClasses = view === "grid" ? posts : posts.slice(0, 9);

  if (loading) return <div className="min-h-screen bg-white flex items-center justify-center font-bold">Loading...</div>;

  return (
    <div className="min-h-screen bg-zinc-50 flex justify-center selection:bg-black selection:text-white">
      <div className="w-full max-w-[1400px] bg-white text-black font-sans border-x border-zinc-200 relative">
        {/* Language Toggle */}
        <div className="absolute top-10 right-6 md:right-12 flex gap-3 text-[11px] font-bold tracking-widest z-20">
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
        <header className="px-6 md:px-12 py-12 flex justify-between items-end">
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
              <section className="px-6 md:px-12 flex flex-col md:flex-row justify-between items-start gap-12 pb-24">
                <div className="max-w-md">
                  <p className="text-[17px] leading-snug font-normal text-zinc-900">
                    {lang === "KOR" 
                      ? "푸이마는 온라인 큐레이션을 통해 예술을 일상으로 만드는 하이엔드 디저트 아틀리에입니다. 우리의 마스터클래스는 대담한 캐릭터 디자인과 초현실적이고 정서적으로 풍부한 맛을 당신의 주방으로 안내합니다."
                      : "Puima is a high-end dessert atelier making art accessible through online curation. Our masterclasses bring bold character designs and surreal, emotionally rich flavors to your kitchen."
                    }
                  </p>
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
                  <a href="#" className="flex items-center gap-2 hover:opacity-50 transition-opacity">
                    <MessageCircle size={18} />
                    Kakao
                  </a>
                </div>
              </section>

              {/* Main Grid */}
              <main className="border-y border-zinc-200">
                <div className="grid grid-cols-1 md:grid-cols-3">
                  {displayClasses.map((item, idx) => (
                    <GridItem 
                      key={item.id}
                      title={item.title}
                      visuals={item.visuals}
                      image={imageMap[item.image] || item.image || pastryImg}
                      naverUrl={item.naverUrl}
                      originalPrice={item.originalPrice}
                      price={item.price}
                      rating={item.rating}
                      reviews={item.reviews}
                      index={idx}
                    />
                  ))}
                </div>
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
              <main className="border-y border-zinc-200">
                <div className="grid grid-cols-1 md:grid-cols-3">
                  {posts.map((item, idx) => (
                    <GridItem 
                      key={item.id}
                      title={item.title}
                      visuals={item.visuals}
                      image={imageMap[item.image] || item.image || pastryImg}
                      naverUrl={item.naverUrl}
                      originalPrice={item.originalPrice}
                      price={item.price}
                      rating={item.rating}
                      reviews={item.reviews}
                      index={idx}
                    />
                  ))}
                </div>
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
            className="text-[10vw] leading-[0.9] font-black tracking-tighter mb-12 uppercase"
          >
            {lang === "KOR" ? <>협업 준비가 되셨나요?<br />문의주세요!</> : <>READY TO COLLAB?<br />REACH ME OUT!</>}
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
            <a href="#" className="flex items-center gap-2 hover:opacity-50 transition-opacity">
              <MessageCircle size={18} />
              Kakao
            </a>
          </div>
        </section>

        <footer className="py-12 flex flex-col items-center gap-8 border-t border-zinc-100">
          <p className="text-[13px] font-bold uppercase tracking-widest text-zinc-400">
            © PUIMA ATELIER, 2024
          </p>
        </footer>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/admin" element={<Admin />} />
    </Routes>
  );
}
