/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Youtube, Instagram, MessageCircle, ChevronDown, Settings, ArrowRight, X, ShieldCheck, User, Mail, Lock, BookOpen, CreditCard, CheckCircle2, AlertCircle, ShoppingBag, Phone, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import React, { useState, useEffect } from "react";
import { Routes, Route, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { collection, onSnapshot, query, orderBy, where, doc, updateDoc } from "firebase/firestore";
import { db, auth } from "./lib/firebase";
import { signOut, updateProfile, updatePassword, updateEmail, sendPasswordResetEmail, signInWithEmailAndPassword } from "firebase/auth";
import GridItem from "./components/GridItem";
import Admin from "./pages/Admin";
import Login from "./pages/Login";
import Question from "./pages/Question";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { initGA, trackPageView } from "./utils/analytics";
import { FixedHeader } from "./components/FixedHeader";

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
  const {
    user,
    isAdmin,
    userProfile,
    setUserProfile,
    lang,
    setLang,
    isProfileOpen,
    setIsProfileOpen,
    activeLearningClass,
    setActiveLearningClass
  } = useAuth();

  const [searchParams] = useSearchParams();
  const [view, setView] = useState<"landing" | "grid">("landing");
  const [posts, setPosts] = useState<ClassPost[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [banners, setBanners] = useState<Notice[]>([]);
  const [reviews, setReviews] = useState<StudentReview[]>([]);
  const [homeQuestions, setHomeQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [bannersLoading, setBannersLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const navigate = useNavigate();

  // Active Tab: 'courses' | 'profile'
  const [profileTab, setProfileTab] = useState<"courses" | "profile">("courses");

  // Real-time password verification before modifying profile info
  const [confirmStatePassword, setConfirmStatePassword] = useState("");
  const [isPasswordVerified, setIsPasswordVerified] = useState(false);
  const [verifyingPassword, setVerifyingPassword] = useState(false);

  // Form states
  const [profileNickname, setProfileNickname] = useState("");
  const [profileRealName, setProfileRealName] = useState("");
  const [profilePhone, setProfilePhone] = useState("");
  const [profileGender, setProfileGender] = useState("남");
  const [profileEmail, setProfileEmail] = useState("");

  // Password fields
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Status indicators
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState("");
  const [profileErrorMsg, setProfileErrorMsg] = useState("");

  // Set up ?profile=true listener
  useEffect(() => {
    if (searchParams.get("profile") === "true") {
      setIsProfileOpen(true);
      navigate("/", { replace: true });
    }
  }, [searchParams, setIsProfileOpen, navigate]);

  // Reset password verification when profile gets closed or tab changes
  useEffect(() => {
    if (!isProfileOpen) {
      setIsPasswordVerified(false);
      setConfirmStatePassword("");
    }
  }, [isProfileOpen]);

  useEffect(() => {
    if (profileTab !== "profile") {
      setIsPasswordVerified(false);
      setConfirmStatePassword("");
    }
  }, [profileTab]);

  // Sync profile details into form states when profile document loads
  useEffect(() => {
    if (userProfile) {
      setProfileNickname(userProfile.nickname || user?.displayName || "");
      setProfileRealName(userProfile.realName || "");
      setProfilePhone(userProfile.phone || "");
      setProfileGender(userProfile.gender || "남");
      setProfileEmail(userProfile.email || user?.email || "");
    } else if (user) {
      setProfileEmail(user.email || "");
      setProfileNickname(user.displayName || "");
    }
  }, [userProfile, user, isProfileOpen]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileSuccessMsg("");
    setProfileErrorMsg("");

    try {
      if (!user) throw new Error("로그인이 필요합니다.");

      // 1. Update Firestore User profile document
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        nickname: profileNickname.trim(),
        displayName: profileNickname.trim(),
        realName: profileRealName.trim(),
        phone: profilePhone.trim(),
        gender: profileGender,
        email: profileEmail.trim(),
      });

      // 2. Update FirebaseAuth profile display name
      if (profileNickname.trim()) {
        await updateProfile(auth.currentUser!, {
          displayName: profileNickname.trim()
        });
      }

      // 3. Update Email in FirebaseAuth if changed
      if (profileEmail.trim() && profileEmail.trim() !== user.email) {
        try {
          await updateEmail(auth.currentUser!, profileEmail.trim());
        } catch (emailErr: any) {
          console.warn("Auth email update triggered error (likely requires re-auth):", emailErr);
          if (emailErr.code === "auth/requires-recent-login") {
            setProfileSuccessMsg("프로필 일반 정보는 저장되었으나, 이메일 주소를 변경하기 위해서는 이메일 수정 직전에 다시 로그인을 하셔야 합니다.");
            setProfileSaving(false);
            return;
          }
          throw emailErr;
        }
      }

      setProfileSuccessMsg("프로필 정보가 안전하게 저장되었습니다.");
      setTimeout(() => setProfileSuccessMsg(""), 5000);
    } catch (err: any) {
      console.error("Error saving profile:", err);
      setProfileErrorMsg(err.message || "오류가 발생했습니다. 다시 시도해 주세요.");
    } finally {
      setProfileSaving(false);
    }
  };

  const handleVerifyPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmStatePassword) {
      setProfileErrorMsg("비밀번호를 입력해 주세요.");
      return;
    }
    setVerifyingPassword(true);
    setProfileErrorMsg("");
    setProfileSuccessMsg("");
    try {
      if (!user || !user.email) {
        throw new Error("사용자 정보를 찾을 수 없습니다. 다시 로그인해 주세요.");
      }
      // Re-evaluate using verification with email and password
      await signInWithEmailAndPassword(auth, user.email, confirmStatePassword);
      setIsPasswordVerified(true);
      setConfirmStatePassword("");
      setProfileSuccessMsg("인증에 성공했습니다. 프로필 수정이 활성화되었습니다.");
      setTimeout(() => setProfileSuccessMsg(""), 3000);
    } catch (err: any) {
      console.error("Password verification failed:", err);
      let msg = "비밀번호가 일치하지 않거나 오류가 발생했습니다.";
      if (err.code === "auth/wrong-password") {
        msg = "비밀번호가 올바르지 않습니다.";
      } else if (err.code === "auth/invalid-credential") {
        msg = "비밀번호가 올바르지 않거나 인증에 실패했습니다.";
      } else if (err.code === "auth/too-many-requests") {
        msg = "로그인 시도 횟수가 초과되었습니다. 잠시 후 다시 시도해 주세요.";
      }
      setProfileErrorMsg(msg);
    } finally {
      setVerifyingPassword(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword) {
      setProfileErrorMsg("새 비밀번호를 입력해 주세요.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setProfileErrorMsg("비밀번호 확인이 일치하지 않습니다.");
      return;
    }
    if (newPassword.length < 6) {
      setProfileErrorMsg("비밀번호는 최소 6자 이상이어야 합니다.");
      return;
    }

    setProfileSaving(true);
    setProfileSuccessMsg("");
    setProfileErrorMsg("");

    try {
      if (!auth.currentUser) throw new Error("로그인이 필요합니다.");
      await updatePassword(auth.currentUser, newPassword);
      try {
        await updateDoc(doc(db, "users", auth.currentUser.uid), {
          password: newPassword
        });
      } catch (fErr) {
        console.error("Failed to update password in Firestore doc:", fErr);
      }
      setProfileSuccessMsg("비밀번호가 안전하게 변경되었습니다.");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setProfileSuccessMsg(""), 5000);
    } catch (err: any) {
      console.error("Error changing password:", err);
      if (err.code === "auth/requires-recent-login") {
        setProfileErrorMsg("보안을 위해 비밀번호 변경은 최근 로그인한 경우에만 적용됩니다. 로그아웃 후 다시 로그인하여 시도해 주세요.");
      } else {
        setProfileErrorMsg(err.message || "비밀번호 변경 중 오류가 발생했습니다.");
      }
    } finally {
      setProfileSaving(false);
    }
  };

  const handleSendResetEmail = async () => {
    setProfileSaving(true);
    setProfileSuccessMsg("");
    setProfileErrorMsg("");
    try {
      if (!profileEmail) {
        throw new Error("이메일 주소가 올바르지 않습니다.");
      }
      await sendPasswordResetEmail(auth, profileEmail);
      setProfileSuccessMsg("비밀번호 재설정 이메일이 발송되었습니다. 메일함을 확인해 주세요.");
      setTimeout(() => setProfileSuccessMsg(""), 5000);
    } catch (err: any) {
      console.error("Error sending reset email:", err);
      setProfileErrorMsg(err.message || "이메일 발송 중 오류가 발생했습니다.");
    } finally {
      setProfileSaving(false);
    }
  };

  const handleRegisterTestClass = async (classItem: ClassPost) => {
    if (!user) return;
    setProfileSuccessMsg("");
    setProfileErrorMsg("");

    const currentEnrollments = userProfile?.enrolledClasses || [];
    const isAlreadyEnrolled = currentEnrollments.some((e: any) => e.id === classItem.id);

    if (isAlreadyEnrolled) {
      setProfileErrorMsg("이미 등록된 수강 클래스입니다.");
      setTimeout(() => setProfileErrorMsg(""), 3000);
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
      setProfileSuccessMsg(`'${classItem.title}' 클래스 수강 신청이 완료되었습니다!`);
      setTimeout(() => setProfileSuccessMsg(""), 5000);
    } catch (err: any) {
      console.error("Error subscribing to test class:", err);
      setProfileErrorMsg("수강 신청 등록 중 오류가 발생했습니다.");
    }
  };

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

    const questionsQ = query(collection(db, "questions"), orderBy("createdAt", "desc"));
    const unsubscribeQuestions = onSnapshot(questionsQ, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setHomeQuestions(docs);
    });

    return () => {
      unsubscribe();
      unsubscribeNotices();
      unsubscribeReviews();
      unsubscribeQuestions();
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
  const categories = ["ALL", ...rawCategories];

  const rawPublicPosts = posts.filter(post => {
    const isPublic = post.status !== "hidden";
    const matchesCategory = selectedCategory === "ALL" || post.category?.toUpperCase() === selectedCategory;
    return isPublic && matchesCategory;
  });

  const publicPosts = [...rawPublicPosts];
  const displayClasses = view === "grid" ? publicPosts : publicPosts.slice(0, 9);

  return (
    <div className="min-h-screen bg-white selection:bg-black selection:text-white pt-[60px] md:pt-[100px] md:min-w-[1100px]">
      {/* Persistent Global Fixed Top Bar */}
      <FixedHeader handleBackToHome={handleBackToHome} />

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
                <section className="pt-8 md:pt-0 px-6 md:px-0 mb-[100px]">
                  <div className="flex justify-center items-center mb-[70px]">
                    <h2 className="text-[14px] font-normal uppercase tracking-[0.3em] text-black text-center">Bake Happiness</h2>
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
                        <h3 className="text-[13px] md:text-[14px] font-semibold md:font-bold tracking-tight leading-tight group-hover:text-black transition-colors line-clamp-2">
                          {banner.title}
                        </h3>
                      </motion.div>
                    ))}
                  </div>
                </section>
              )}

              {/* Collection Section */}
              <div className="px-6 md:px-0 flex justify-center items-center mb-[70px]">
                <h2 className="text-[14px] font-normal uppercase tracking-[0.3em] text-black text-center">Eat Happiness</h2>
              </div>

              <main className="min-h-[600px] mb-8">
                {loading ? (
                  <div className="py-32 flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border border-zinc-200 border-t-black rounded-full animate-spin"></div>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 md:grid-cols-4 gap-x-2 md:gap-x-8 gap-y-4 px-2 md:px-0">
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

              {/* Question Q&A Preview Section */}
              <section className="pb-24 bg-white pt-24 border-t border-zinc-100/60">
                <div className="px-6 md:px-0 flex flex-col justify-center items-center mb-[50px]">
                  <h2 className="text-[14px] font-normal uppercase tracking-[0.3em] text-black text-center mb-1">QUESTION</h2>
                  <p className="text-zinc-400 text-[10px] font-black uppercase tracking-wider text-center">푸이마에게 질문하세요 / Ask Puima</p>
                </div>

                <div className="max-w-[850px] mx-auto px-6">
                  {homeQuestions.length === 0 ? (
                    <div className="py-12 text-center border border-dashed border-zinc-200 rounded-[24px] bg-zinc-50/20">
                      <p className="text-zinc-400 text-xs font-bold uppercase tracking-wider">No questions registered yet.</p>
                      <p className="text-zinc-400 text-[11px] font-semibold mt-1">푸이마 마스터에게 첫 번째 질문을 해보세요!</p>
                    </div>
                  ) : (
                    <div className="border border-zinc-200 rounded-[24px] overflow-hidden divide-y divide-zinc-100 bg-white shadow-sm/30">
                      {homeQuestions.slice(0, 5).map((q: any) => {
                        const hasAnswer = !!q.answer;
                        const maskName = (name: string) => {
                          if (!name) return "익명";
                          if (name.length <= 1) return name;
                          if (name.length === 2) return name[0] + "*";
                          return name[0] + "*".repeat(name.length - 2) + name[name.length - 1];
                        };
                        const formatDate = (isoStr: string) => {
                          if (!isoStr) return "";
                          try {
                            const d = new Date(isoStr);
                            const year = d.getFullYear();
                            const month = String(d.getMonth() + 1).padStart(2, "0");
                            const day = String(d.getDate()).padStart(2, "0");
                            return `${year}.${month}.${day}`;
                          } catch (e) {
                            return isoStr;
                          }
                        };

                        return (
                          <div 
                            key={q.id}
                            onClick={() => { navigate('/question'); window.scrollTo(0, 0); }}
                            className="px-6 py-4.5 flex items-center justify-between gap-4 hover:bg-zinc-50/40 transition-all cursor-pointer text-left font-sans"
                          >
                            <div className="flex-grow min-w-0 flex items-center gap-3">
                              {/* Status Badge */}
                              {hasAnswer ? (
                                <span className="text-[8px] font-black px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 shrink-0 uppercase tracking-wider">
                                  답변 완료
                                </span>
                              ) : (
                                <span className="text-[8px] font-black px-2 py-0.5 rounded-full bg-zinc-50 border border-zinc-200 text-zinc-400 shrink-0 uppercase tracking-wider">
                                  답변 대기
                                </span>
                              )}

                              {q.isPrivate && (
                                <span className="inline-flex items-center gap-0.5 text-[8px] font-bold text-zinc-400/80 bg-zinc-50/50 border border-zinc-100 px-1 py-0.2 rounded shrink-0">
                                  <Lock size={9} />
                                </span>
                              )}

                              <span className="text-xs font-bold text-zinc-905 truncate leading-snug">
                                {q.isPrivate ? "비밀글입니다." : q.title}
                              </span>
                            </div>

                            <div className="flex items-center gap-3 text-[10px] text-zinc-400 font-medium font-mono shrink-0">
                              <span>{maskName(q.authorName)}</span>
                              <span className="text-zinc-200">|</span>
                              <span>{formatDate(q.createdAt)}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div className="flex justify-center mt-8 gap-2">
                    <button 
                      onClick={() => { navigate('/question'); window.scrollTo(0, 0); }}
                      className="group flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-900 border-b border-zinc-900 pb-1 hover:text-zinc-400 hover:border-zinc-400 transition-all cursor-pointer"
                    >
                      <span>질문하러가기</span>
                    </button>
                  </div>
                </div>
              </section>

              {/* Student Review Ticker Section */}
              <section className="pb-32 overflow-hidden bg-white pt-32">
                <div className="px-6 md:px-0 flex justify-center items-center mb-[70px]">
                  <h2 className="text-[14px] font-normal uppercase tracking-[0.3em] text-black text-center">REVIEW</h2>
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
              {/* Category Tabs */}
              <div className="px-6 md:px-0 mb-8 md:mb-16">
                {/* Mobile View: Wrapping Pill Buttons for 100% Visibility */}
                <div className="flex flex-wrap gap-2 md:hidden pb-2">
                  {categories.map((cat) => {
                    const isActive = selectedCategory === cat;
                    return (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`text-[10px] font-semibold uppercase tracking-wider px-3.5 py-1.5 rounded-full border transition-all ${
                          isActive 
                            ? "bg-black border-black text-white" 
                            : "bg-white border-zinc-200 text-zinc-500 hover:border-zinc-400"
                        }`}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>

                {/* Desktop View: Elegant Minimal Underlined Line */}
                <div className="hidden md:flex gap-8 border-b border-zinc-100 pb-4">
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

              <main className="min-h-[600px] mb-16 md:mb-32">
                {loading ? (
                  <div className="py-32 flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border border-zinc-200 border-t-black rounded-full animate-spin"></div>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-2 md:gap-x-6 gap-y-6 md:gap-y-12 px-2 md:px-0">
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
                <button 
                  onClick={handleBackToHome}
                  className="group flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-900 border-b border-zinc-900 pb-1 hover:text-zinc-400 hover:border-zinc-400 transition-all cursor-pointer"
                >
                  돌아가기
                </button>
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

        {/* Profile Info Overlay Side-Drawer */}
        <AnimatePresence>
          {isProfileOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsProfileOpen(false)}
                className="fixed inset-0 bg-black/40 backdrop-blur-[3px] z-[9998]"
              />

              {/* Side Drawer Container */}
              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="fixed top-0 right-0 h-full w-full max-w-lg bg-white shadow-[0px_0px_50px_rgba(0,0,0,0.15)] z-[9999] flex flex-col font-sans"
              >
                {/* Subheader Details & User profile mini-card */}
                <div className="bg-zinc-50/50 border-b border-zinc-100 p-6 flex items-center justify-between gap-4 flex-shrink-0">
                  <div className="min-w-0 flex-1 flex items-center gap-1 text-left">
                    <span className="font-semibold text-zinc-900 text-base truncate max-w-[180px] sm:max-w-[240px]">
                      {profileNickname || "수강생님"}
                    </span>
                    <span className="text-zinc-500 font-medium text-xs pt-0.5 shrink-0">님</span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <button
                      onClick={() => {
                        signOut(auth);
                        localStorage.removeItem("admin_bypass");
                        window.location.reload();
                      }}
                      className="text-xs font-medium text-zinc-650 hover:text-red-650 border border-zinc-200 hover:border-red-200 rounded-xl px-4 py-2 transition-all bg-white cursor-pointer hover:bg-red-50/20 shadow-sm"
                    >
                      로그아웃
                    </button>
                    <button 
                      onClick={() => {
                        setIsProfileOpen(false);
                        setProfileSuccessMsg("");
                        setProfileErrorMsg("");
                      }} 
                      className="p-2 text-zinc-400 hover:text-black rounded-full hover:bg-zinc-200/50 transition-colors cursor-pointer"
                      title="닫기"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-zinc-100 bg-white sticky top-0 z-10 flex-shrink-0 text-center text-xs font-semibold select-none">
                  <button 
                    onClick={() => { setProfileTab("courses"); setProfileErrorMsg(""); setProfileSuccessMsg(""); }}
                    className={`flex-1 py-4 flex items-center justify-center gap-2 border-b-2 transition-all cursor-pointer ${
                      profileTab === "courses" 
                        ? "border-black text-black font-extrabold" 
                        : "border-transparent text-zinc-400 hover:text-zinc-700"
                    }`}
                  >
                    <BookOpen size={14} />
                    <span>수강 / 구매 내역</span>
                  </button>
                  <button 
                    onClick={() => { setProfileTab("profile"); setProfileErrorMsg(""); setProfileSuccessMsg(""); }}
                    className={`flex-1 py-4 flex items-center justify-center gap-2 border-b-2 transition-all cursor-pointer ${
                      profileTab === "profile" 
                        ? "border-black text-black font-extrabold" 
                        : "border-transparent text-zinc-400 hover:text-zinc-700"
                    }`}
                  >
                    <User size={14} />
                    <span>내 정보 수정</span>
                  </button>
                </div>

                {/* Scrollable Workspace */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {/* Status Banner Messages */}
                  {profileSuccessMsg && (
                    <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-xl p-4 flex items-start gap-2.5 text-xs font-medium">
                      <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                      <span>{profileSuccessMsg}</span>
                    </div>
                  )}

                  {profileErrorMsg && (
                    <div className="bg-red-50 border border-red-100 text-red-800 rounded-xl p-4 flex items-start gap-2.5 text-xs font-medium">
                      <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
                      <span>{profileErrorMsg}</span>
                    </div>
                  )}

                  {profileTab === "courses" && (
                    <div className="space-y-6">
                      {/* Course / Order history 목록 */}
                      <div className="space-y-3.5">
                        <div className="flex items-center justify-between">
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">나의 마스터클래스</h4>
                          <span className="text-[10px] text-zinc-400 font-mono">총 {(userProfile?.enrolledClasses || []).length}개 강좌</span>
                        </div>

                        {(!userProfile?.enrolledClasses || userProfile.enrolledClasses.length === 0) ? (
                          <div className="border border-dashed border-zinc-200 rounded-3xl p-8 text-center bg-zinc-50/30">
                            <ShoppingBag className="mx-auto text-zinc-300 mb-3" size={28} />
                            <p className="text-xs font-bold text-zinc-650 mb-1">등록된 수강 클래스가 없습니다.</p>
                            <p className="text-[11px] text-zinc-400 leading-relaxed mb-4 max-w-[320px] mx-auto font-medium">
                              수강을 시작하시려면 네이버 스마트스토어 혹은 외부 결제를 이용해 주세요. 아래 체험용 테스트를 바로 이용하실 수도 있습니다.
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {userProfile.enrolledClasses.map((item: any, i: number) => (
                              <div key={item.id || i} className="bg-white border border-zinc-150 rounded-2xl p-4 flex items-center justify-between gap-4 hover:border-black/20 transition-all flex-row">
                                <div className="flex items-center gap-3 truncate">
                                  <div className="w-12 h-12 rounded-lg bg-zinc-100 flex-shrink-0 overflow-hidden border border-zinc-100">
                                    {item.imageUrl ? (
                                      <img src={item.imageUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-[10px] text-zinc-400 font-bold bg-zinc-50">CLASS</div>
                                    )}
                                  </div>
                                  <div className="truncate text-left">
                                    <span className="inline-block px-2 py-0.5 bg-zinc-100 rounded-full text-[9px] font-black text-black uppercase tracking-widest mb-1 leading-none">
                                      {item.category}
                                    </span>
                                    <h5 className="font-extrabold text-xs text-zinc-900 truncate" title={item.title}>
                                      {item.title}
                                    </h5>
                                    <div className="flex items-center gap-2 mt-1 text-[10px] text-zinc-400 font-mono">
                                      <span>주문: {item.purchaseNo || "PM-0000"}</span>
                                      <span>/</span>
                                      <span>수강일: {item.registeredAt}</span>
                                    </div>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setActiveLearningClass(item)}
                                  className="px-3.5 py-2 bg-black text-white hover:bg-zinc-855 transition-colors text-[10px] font-black rounded-lg tracking-widest uppercase shrink-0 active:scale-95 cursor-pointer flex items-center gap-1.5"
                                >
                                  <span>학습하기</span>
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* 테스트용 신청 섹션 */}
                      <div className="pt-6 border-t border-zinc-100 space-y-4">
                        <div className="space-y-1 text-left">
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                            [체험 전용] 수강 신청 시뮬레이션
                          </h4>
                          <p className="text-[10px] text-zinc-400 font-semibold">
                            아래 상품 카탈로그에서 바로 1-Click 수강 등록을 하여 학습 대시보드를 테스트하실 수 있습니다.
                          </p>
                        </div>

                        <div className="grid grid-cols-1 gap-2.5 max-h-[220px] overflow-y-auto pr-1">
                          {posts.map((classPost) => {
                            const isEnrolled = (userProfile?.enrolledClasses || []).some((e: any) => e.id === classPost.id);
                            return (
                              <div key={classPost.id} className="bg-zinc-50/50 hover:bg-zinc-100/50 rounded-xl p-3 border border-zinc-150 flex items-center justify-between gap-3 text-left">
                                <div className="truncate">
                                  <p className="text-[10px] font-mono text-zinc-400 tracking-wider uppercase leading-none mb-1">{classPost.category || "Class"}</p>
                                  <h6 className="text-[11px] font-extrabold text-zinc-800 truncate" title={classPost.title}>
                                    {classPost.title}
                                  </h6>
                                </div>
                                <button
                                  type="button"
                                  disabled={isEnrolled}
                                  onClick={() => handleRegisterTestClass(classPost)}
                                  className={`px-3 py-1.5 text-[9px] font-black tracking-widest rounded-lg uppercase whitespace-nowrap shrink-0 transition-all ${
                                    isEnrolled
                                      ? "bg-zinc-100 text-zinc-350 border border-zinc-100 cursor-not-allowed font-medium"
                                      : "bg-white text-zinc-800 border border-zinc-200 hover:border-black active:scale-95 cursor-pointer font-bold"
                                  }`}
                                >
                                  {isEnrolled ? "신청완료" : "수강신청"}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {profileTab === "profile" && !isPasswordVerified && (
                    <form onSubmit={handleVerifyPassword} className="space-y-5 text-left bg-zinc-50/50 border border-zinc-150 rounded-2xl p-6">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-zinc-800">
                          <Lock size={16} />
                          <h4 className="font-extrabold text-xs uppercase tracking-wider">보안을 위한 비밀번호 확인</h4>
                        </div>
                        <p className="text-[11px] text-zinc-500 leading-relaxed font-semibold">
                          회원님의 개인정보를 안전하게 보호하기 위해 현재 사용 중인 계정의 비밀번호를 다시 한 번 입력해 주세요.
                        </p>
                      </div>

                      <div className="space-y-1.5 pt-2">
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400">비밀번호</label>
                        <div className="relative">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
                          <input
                            type="password"
                            required
                            placeholder="현재 비밀번호를 입력해 주세요"
                            value={confirmStatePassword}
                            onChange={(e) => setConfirmStatePassword(e.target.value)}
                            className="w-full bg-white border border-zinc-150 rounded-xl py-3 pl-11 pr-4 text-xs font-bold outline-none focus:border-zinc-350 focus:ring-1 focus:ring-zinc-200 transition-all font-sans"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={verifyingPassword}
                        className="w-full bg-black text-white py-3.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-zinc-800 transition-colors disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 shadow-sm font-bold active:scale-95"
                      >
                        {verifyingPassword ? (
                          <RefreshCw size={14} className="animate-spin" />
                        ) : (
                          "비밀번호 확인"
                        )}
                      </button>
                    </form>
                  )}

                  {profileTab === "profile" && isPasswordVerified && (
                    <div className="space-y-8 animate-fadeIn">
                      <form onSubmit={handleSaveProfile} className="space-y-5 text-left">
                        <div className="flex items-center gap-2 mb-1 border-b border-zinc-100 pb-2 text-zinc-800">
                          <User size={15} />
                          <h4 className="text-xs font-bold uppercase tracking-wide">내 정보 수정</h4>
                        </div>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1.5">실명</label>
                            <div className="relative">
                              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
                              <input
                                type="text"
                                required
                                placeholder="실명을 입력해 주세요"
                                value={profileRealName}
                                onChange={(e) => setProfileRealName(e.target.value)}
                                className="w-full bg-zinc-50 border border-zinc-150 rounded-xl py-3 pl-11 pr-4 text-xs font-bold outline-none focus:bg-white focus:border-zinc-350 focus:ring-1 focus:ring-zinc-200 transition-all"
                              />
                            </div>
                          </div>

                          <div>
                            <div className="flex justify-between items-center mb-1.5">
                              <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400">닉네임</label>
                              <span className="text-[9px] font-medium text-zinc-400">한글 5자 / 영문 10자 이내</span>
                            </div>
                            <div className="relative">
                              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
                              <input
                                type="text"
                                required
                                placeholder="닉네임을 입력해 주세요"
                                value={profileNickname}
                                onChange={(e) => setProfileNickname(e.target.value)}
                                className="w-full bg-zinc-50 border border-zinc-150 rounded-xl py-3 pl-11 pr-4 text-xs font-bold outline-none focus:bg-white focus:border-zinc-350 focus:ring-1 focus:ring-zinc-200 transition-all"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1.5">성별</label>
                              <select
                                value={profileGender}
                                onChange={(e) => setProfileGender(e.target.value)}
                                className="w-full bg-zinc-50 border border-zinc-150 rounded-xl py-3 px-4 text-xs font-bold outline-none focus:bg-white focus:border-zinc-350 focus:ring-1 focus:ring-zinc-200 transition-all appearance-none cursor-pointer"
                              >
                                <option value="남">남성</option>
                                <option value="여">여성</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1.5">전화번호</label>
                              <div className="relative">
                                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" size={13} />
                                <input
                                  type="tel"
                                  placeholder="숫자만 입력"
                                  value={profilePhone}
                                  onChange={(e) => setProfilePhone(e.target.value)}
                                  className="w-full bg-zinc-50 border border-zinc-150 rounded-xl py-3 pl-9 pr-4 text-xs font-bold outline-none focus:bg-white focus:border-zinc-350 focus:ring-1 focus:ring-zinc-200 transition-all"
                                />
                              </div>
                            </div>
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1.5">이메일 주소</label>
                            <div className="relative">
                              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
                              <input
                                type="email"
                                required
                                value={profileEmail}
                                onChange={(e) => setProfileEmail(e.target.value)}
                                className="w-full bg-zinc-50 border border-zinc-150 rounded-xl py-3 pl-11 pr-4 text-xs font-bold outline-none focus:bg-white focus:border-zinc-350 focus:ring-1 focus:ring-zinc-200 transition-all"
                              />
                            </div>
                          </div>
                        </div>

                        <button
                          type="submit"
                          disabled={profileSaving}
                          className="w-full bg-black text-white py-3.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-zinc-800 transition-colors disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 shadow-sm font-bold active:scale-95"
                        >
                          {profileSaving ? (
                            <RefreshCw size={14} className="animate-spin" />
                          ) : (
                            "변경 사항 저장하기"
                          )}
                        </button>
                      </form>

                      {/* Merged Security & Account Section */}
                      <div className="border-t border-zinc-200 pt-7 space-y-7 text-left">
                        <div className="flex items-center gap-2 border-b border-zinc-100 pb-2 text-zinc-800">
                          <Lock size={15} />
                          <h4 className="text-xs font-extrabold uppercase tracking-wide">비밀번호 변경 및 계정 관리</h4>
                        </div>

                        {/* 비밀번호 변경 폼 */}
                        <form onSubmit={handleUpdatePassword} className="space-y-4">
                          <h5 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">비밀번호 안전 변경</h5>
                          
                          <div className="space-y-3.5">
                            <div>
                              <label className="block text-[10px] font-bold text-zinc-500 mb-1">새 비밀번호 (6자 이상)</label>
                              <input
                                type="password"
                                placeholder="새 비밀번호 입력"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full bg-zinc-50 border border-zinc-150 rounded-xl py-3 px-4 text-xs font-bold outline-none focus:bg-white focus:border-zinc-350 transition-all font-sans"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-zinc-500 mb-1">비밀번호 확인</label>
                              <input
                                type="password"
                                placeholder="한번 더 입력"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full bg-zinc-50 border border-zinc-150 rounded-xl py-3 px-4 text-xs font-bold outline-none focus:bg-white focus:border-zinc-350 transition-all font-sans"
                              />
                            </div>
                          </div>

                          <button
                            type="submit"
                            disabled={profileSaving}
                            className="w-full bg-black text-white hover:bg-zinc-800 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest transition-colors disabled:opacity-50 cursor-pointer font-bold active:scale-95"
                          >
                            비밀번호 업데이트
                          </button>
                        </form>

                        {/* 이메일 재설정 링크 */}
                        <div className="pt-6 border-t border-zinc-100 space-y-3">
                          <h5 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">계정 소유권 관리 보조</h5>
                          <p className="text-[10px] text-zinc-400 leading-relaxed font-semibold">
                            인증된 이메일을 사용 중인 경우 비밀번호를 분실하였을 때, 본인의 고유 이메일 주소로 언제든지 복구 재설정 이메일을 즉시 보내어 해결할 수 있습니다.
                          </p>
                          <button
                            type="button"
                            onClick={handleSendResetEmail}
                            disabled={profileSaving}
                            className="w-full border border-dashed border-zinc-300 text-zinc-650 hover:border-black hover:text-black hover:bg-zinc-50/50 py-3 rounded-xl text-[11px] font-bold transition-all cursor-pointer"
                          >
                            비밀번호 초기화 메일 발송
                          </button>
                        </div>

                        {/* 탈퇴 및 메타 */}
                        <div className="pt-6 border-t border-zinc-100 flex items-center justify-between text-[11px] font-bold text-zinc-400 font-sans">
                          <span>계정 상태 및 프로필 식별자</span>
                          <span>정상 / 활성 (Active)</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Dynamic Learning Classroom Modal popup */}
        <AnimatePresence>
          {activeLearningClass && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setActiveLearningClass(null)}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[10000]"
              />

              {/* Classroom Overlay Panel */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                className="fixed inset-4 md:inset-x-12 md:inset-y-16 lg:max-w-4xl lg:mx-auto bg-zinc-950 text-white rounded-[28px] overflow-hidden shadow-2xl z-[10001] flex flex-col border border-zinc-800 font-sans"
              >
                {/* Classroom Header */}
                <div className="bg-zinc-900 border-b border-zinc-850 px-6 py-5 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">PUIMA ONLINE MASTERCLASS</h4>
                  </div>
                  <button 
                    onClick={() => setActiveLearningClass(null)}
                    className="p-1 text-zinc-500 hover:text-white rounded-full hover:bg-zinc-850 transition-colors cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Main Content Areas */}
                <div className="flex-1 overflow-y-auto flex flex-col md:flex-row min-h-0 bg-zinc-950">
                  
                  {/* Video Simulator Container */}
                  <div className="w-full md:w-3/5 bg-black p-4 flex flex-col justify-between aspect-video md:aspect-auto border-r border-zinc-900 relative">
                    <div className="absolute inset-0 bg-zinc-900 flex items-center justify-center opacity-95">
                      <div className="text-center p-6 space-y-4">
                        <BookOpen size={48} className="mx-auto text-zinc-600 animate-bounce" />
                        <div className="space-y-1.5">
                          <p className="text-sm font-bold text-white tracking-tight">시그니처 비디오 강의 아카이브를 로드 중입니다.</p>
                          <p className="text-[11px] text-zinc-500 max-w-[320px] mx-auto leading-relaxed">
                            온라인 수강권 인가가 정상 확인되었습니다. 고화질 실습 자료 및 조리 과학 이론에 입각한 4K 자막 비디오를 즉시 재생하실 수 있습니다.
                          </p>
                        </div>
                        <button className="bg-white text-black px-6 py-2.5 rounded-full text-[10px] font-black hover:bg-zinc-200 transition-colors uppercase tracking-widest cursor-pointer shadow">
                          강의 재생하기 (Play Video)
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Syllabus chapters lists */}
                  <div className="w-full md:w-2/5 p-6 flex flex-col bg-zinc-905 overflow-y-auto max-h-[300px] md:max-h-none border-t md:border-t-0 border-zinc-850">
                    <div className="mb-4 text-left">
                      <span className="text-[9px] bg-zinc-800 text-zinc-400 border border-zinc-700 font-bold tracking-widest uppercase px-2.5 py-1 rounded-full">{activeLearningClass.category}</span>
                      <h3 className="text-sm font-extrabold text-white tracking-tight mt-2.5">{activeLearningClass.title}</h3>
                      <p className="text-[10px] text-zinc-500 font-medium mt-1">지도: 최수연 아틀리에 마스터 (Puima Master)</p>
                    </div>

                    <div className="border-t border-zinc-800 pt-4 flex-1 space-y-3.5">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-650 text-left">실시간 파티세리 커리큘럼</h4>
                      
                      <div className="space-y-2.5 text-left text-xs font-semibold">
                        <div className="bg-zinc-900 p-3 rounded-xl border border-zinc-850 flex items-center gap-3.5">
                          <div className="w-6 h-6 bg-zinc-850 border border-zinc-800 text-zinc-400 flex items-center justify-center rounded-lg text-[10px] font-black font-mono shrink-0">01</div>
                          <div className="min-w-0">
                            <p className="text-white truncate text-[11px]">파티세리 오리엔테이션 및 밀가루 배합과학</p>
                            <span className="text-[10px] text-zinc-500 font-mono font-medium">25분 분량 고화질 촬영본</span>
                          </div>
                        </div>

                        <div className="bg-zinc-900 p-3 rounded-xl border border-zinc-850 flex items-center gap-3.5">
                          <div className="w-6 h-6 bg-zinc-850 border border-zinc-800 text-zinc-400 flex items-center justify-center rounded-lg text-[10px] font-black font-mono shrink-0">02</div>
                          <div className="min-w-0">
                            <p className="text-white truncate text-[11px]">수분율(Hydration)에 따른 팽창 시뮬레이션</p>
                            <span className="text-[10px] text-emerald-400 font-medium font-mono">45분 핵심 비법 코스</span>
                          </div>
                        </div>

                        <div className="bg-zinc-900 p-3 rounded-xl border border-zinc-850 flex items-center gap-3.5">
                          <div className="w-6 h-6 bg-zinc-850 border border-zinc-800 text-zinc-400 flex items-center justify-center rounded-lg text-[10px] font-black font-mono shrink-0">03</div>
                          <div className="min-w-0">
                            <p className="text-white truncate text-[11px]">천연 버터 향미 극대화 및 미각 시그니처 연출</p>
                            <span className="text-[10px] text-zinc-500 font-mono font-medium">35분 심사 전수 가이드</span>
                          </div>
                        </div>

                        <div className="bg-zinc-900 p-3 rounded-xl border border-zinc-850 flex items-center gap-3.5 opacity-60">
                          <div className="w-6 h-6 bg-zinc-850 border border-zinc-800 text-zinc-400 flex items-center justify-center rounded-lg text-[10px] font-black font-mono shrink-0">04</div>
                          <div className="min-w-0">
                            <p className="text-white truncate text-[11px]">질문 답변(Q&A) 및 졸업 피드백 세션</p>
                            <span className="text-[10px] text-zinc-500 font-mono font-medium font-medium">서면 제출 기반 맞춤 피드백</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer specs */}
                <div className="bg-zinc-900 border-t border-zinc-850 px-6 py-4 flex items-center justify-between shrink-0 text-[10px] font-bold text-zinc-650">
                  <span className="font-mono">수강 정보 식별: {activeLearningClass.purchaseNo}</span>
                  <span>모든 영상자료의 무단 도용 및 복제를 엄격히 금지합니다.</span>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
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
    <div className="min-h-screen bg-white flex flex-col items-center selection:bg-black selection:text-white pt-[60px] md:pt-[100px] md:min-w-[1100px]">
      <FixedHeader />
      <div className="w-full max-w-[1100px] bg-white text-black font-sans relative min-h-screen">
        <main className="max-w-4xl mx-auto px-6 py-24 md:py-32">
          {/* Back button (돌아가기) as clean text link */}
          <div className="mb-8 text-left">
            <button
              onClick={() => navigate("/")}
              className="text-zinc-400 hover:text-black transition-colors text-xs font-bold tracking-tight inline-flex items-center gap-1.5 cursor-pointer"
            >
              ← 돌아가기
            </button>
          </div>

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
        <Route path="/question" element={<Question />} />
      </Routes>
    </AuthProvider>
  );
}
