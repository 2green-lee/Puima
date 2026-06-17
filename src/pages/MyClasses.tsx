import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { collection, onSnapshot, query, orderBy, doc, updateDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../contexts/AuthContext";
import { FixedHeader } from "../components/FixedHeader";
import { BookOpen, ShoppingBag, ArrowLeft, ArrowRight, Play, Calendar, Clipboard, ShieldCheck, CheckCircle2, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface ClassPost {
  id: string;
  title: string;
  category?: string;
  price: string;
  imageUrl?: string;
  image?: string;
  visuals?: string;
}

export default function MyClasses() {
  const navigate = useNavigate();
  const { user, userProfile, setActiveLearningClass } = useAuth();
  
  const [posts, setPosts] = useState<ClassPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    window.scrollTo(0, 0);

    // Fetch class posts for simulation
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
      console.error("Error fetching posts for MyClasses:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleRegisterTestClass = async (classItem: ClassPost) => {
    if (!user) return;
    setSuccessMsg("");
    setErrorMsg("");

    const currentEnrollments = userProfile?.enrolledClasses || [];
    const isAlreadyEnrolled = currentEnrollments.some((e: any) => e.id === classItem.id);

    if (isAlreadyEnrolled) {
      setErrorMsg("이미 등록된 수강 클래스입니다.");
      setTimeout(() => setErrorMsg(""), 3000);
      return;
    }

    const orderNo = `PM-${Date.now().toString().slice(-6)}`;
    const newEnrollment = {
      id: classItem.id,
      title: classItem.title,
      category: classItem.category || "Masterclass",
      price: classItem.price || "₩49,900",
      imageUrl: classItem.imageUrl || "",
      image: classItem.image || "pastryImg",
      registeredAt: new Date().toISOString().split("T")[0],
      status: "수강 가능",
      purchaseNo: orderNo
    };

    try {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        enrolledClasses: [...currentEnrollments, newEnrollment]
      });
      setSuccessMsg(`'${classItem.title}' 클래스 수강 신청이 완료되었습니다!`);
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err: any) {
      console.error("Error subscribing to test class:", err);
      setErrorMsg("수강 신청 등록 중 오류가 발생했습니다.");
    }
  };

  const enrolledList = userProfile?.enrolledClasses || [];

  return (
    <div className="min-h-screen bg-white flex flex-col items-center selection:bg-black selection:text-white pt-[60px] md:pt-[100px] md:min-w-[1100px]">
      <FixedHeader />
      
      <div className="w-full max-w-[1100px] bg-white text-black font-sans relative min-h-screen px-6 lg:px-0">
        <main className="max-w-4xl mx-auto py-20 md:py-28">
          {/* Back Navigation Bar */}
          <div className="mb-10 text-left">
            <button
              onClick={() => navigate("/")}
              className="text-zinc-400 hover:text-black transition-colors text-xs font-normal tracking-widest inline-flex items-center gap-1.5 cursor-pointer uppercase"
            >
              <ArrowLeft size={14} />
              <span>메인 홈페이지로 돌아가기</span>
            </button>
          </div>

          {/* Gorgeous Header Section with Pretendard Font */}
          <div className="mb-16 text-center pb-6">
            <h2 className="text-4xl md:text-5xl font-extralight tracking-tight mb-4 select-none text-zinc-900">
              My Classes
            </h2>
            <p className="text-zinc-500 text-xs md:text-sm font-semibold tracking-tight leading-relaxed max-w-xl mx-auto text-center">
              푸이마 베이킹 클래스에 오신 것을 환영합니다.
            </p>
          </div>

          {/* Banner Messages */}
          {successMsg && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-2xl p-5 flex items-start gap-3.5 text-xs font-semibold"
            >
              <CheckCircle2 size={18} className="text-emerald-500 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </motion.div>
          )}

          {errorMsg && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 bg-red-50 border border-red-100 text-red-800 rounded-2xl p-5 flex items-start gap-3.5 text-xs font-semibold"
            >
              <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </motion.div>
          )}

          {/* Enrolled Classes List */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h4 className="text-[11px] font-black uppercase tracking-widest text-zinc-400">
                나의 수강 중인 마스터클래스 리스트
              </h4>
              <span className="text-xs font-mono font-bold text-black border border-zinc-200 bg-zinc-50 px-3 py-1 rounded-full">
                총 {enrolledList.length}개 강좌
              </span>
            </div>

            {enrolledList.length === 0 ? (
              <div className="border border-dashed border-zinc-200 rounded-[32px] p-12 text-center bg-zinc-50/20">
                <div className="w-16 h-16 bg-zinc-50 border border-zinc-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <ShoppingBag className="text-zinc-300" size={32} />
                </div>
                <h3 className="text-lg font-black tracking-tight text-zinc-900 mb-2">등록된 수강 클래스가 없습니다.</h3>
                <p className="text-xs text-zinc-450 leading-relaxed mb-6 max-w-md mx-auto font-medium">
                  수강을 시작하시려면 네이버 스마트스토어 혹은 외부 결제를 이용해 주세요.
                </p>
                <button
                  onClick={() => navigate("/")}
                  className="px-6 py-3 bg-black text-white hover:bg-zinc-800 rounded-xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer active:scale-95"
                >
                  클래스 구경하러 가기
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {enrolledList.map((item: any, i: number) => (
                  <div 
                    key={item.id || i} 
                    className="bg-white border border-zinc-200 hover:border-black rounded-2xl p-5 md:p-6 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-6 transition-all shadow-sm"
                  >
                    <div className="flex items-center gap-5 min-w-0 flex-1">
                      {/* Image Preview */}
                      <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-zinc-50 border border-zinc-100 overflow-hidden shrink-0">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" alt={item.title} />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[10px] text-zinc-400 font-bold bg-zinc-100">CLASS</div>
                        )}
                      </div>

                      {/* Info Panel */}
                      <div className="text-left min-w-0 flex-1">
                        <span className="inline-block px-2.5 py-1 bg-zinc-100 rounded-full text-[9px] font-black text-black uppercase tracking-widest mb-2 leading-none">
                          {item.category || "Masterclass"}
                        </span>
                        <h3 className="font-bold text-base md:text-lg text-zinc-900 leading-snug truncate" title={item.title}>
                          {item.title}
                        </h3>
                        
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-3 text-xs text-zinc-450 font-medium">
                          <span className="flex items-center gap-1">
                            <Clipboard size={13} className="text-zinc-400" />
                            <span>주문번호 : <strong className="font-mono text-zinc-700">{item.purchaseNo || "PM-0000"}</strong></span>
                          </span>
                          <span className="text-zinc-200 hidden md:inline">|</span>
                          <span className="flex items-center gap-1">
                            <Calendar size={13} className="text-zinc-400" />
                            <span>등록일 : <strong className="font-mono text-zinc-700">{item.registeredAt}</strong></span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Play Lecture Button */}
                    <button
                      type="button"
                      onClick={() => setActiveLearningClass(item)}
                      className="w-full md:w-auto px-6 py-4 bg-zinc-950 text-white hover:bg-black rounded-xl text-xs font-black uppercase tracking-widest transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2 font-bold shrink-0 shadow"
                    >
                      <Play size={12} className="fill-white" />
                      <span>강의 재생하기 (Study)</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
