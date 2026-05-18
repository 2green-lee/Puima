import { useState, useEffect, ChangeEvent, FormEvent } from "react";
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  query, 
  orderBy, 
  serverTimestamp 
} from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";
import { db, auth, loginWithGoogle, logout } from "../lib/firebase";
import { 
  ArrowLeft, Plus, Edit2, Trash2, Save, X, LogIn, LogOut, 
  LayoutDashboard, PlusCircle, Tag, Megaphone, MessageSquare,
  Users, Clock, ShieldCheck, HelpCircle, UserX, ChevronRight,
  Menu, Bell, Settings, Search, Upload, Image as ImageIcon,
  GripVertical
} from "lucide-react";
import { motion, AnimatePresence, Reorder } from "framer-motion";

const ADMIN_EMAIL = "rtytgb123@gmail.com";

interface Post {
  id: string;
  title: string;
  image: string;
  naverUrl: string;
  price: string;
  imageUrl?: string;
  visuals?: string;
  category?: string;
  originalPrice?: string;
  rating?: string;
  reviews?: string;
  status?: "public" | "hidden";
  isSoldOut?: boolean;
  order?: number;
}

interface Category {
  id: string;
  name: string;
}

interface Notice {
  id: string;
  title: string;
  content: string;
  createdAt: any;
  isActive: boolean;
}

type TabType = 
  | "manage" | "register" | "categories" | "notices"
  | "users" | "history" | "roles" | "inquiry" | "blacklist";

export default function Admin() {
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [newNotice, setNewNotice] = useState({ title: "", content: "" });
  const [newCategoryName, setNewCategoryName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Post>>({});
  const [loading, setLoading] = useState(true);
  const [designMode, setDesignMode] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("manage");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  
  const isDev = import.meta.env.DEV;

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      alert("이미지 용량이 너무 큽니다 (최대 5MB).");
      return;
    }

    setIsUploading(true);
    
    // In a real production app, we would upload to Firebase Storage here.
    // For now, we'll create a local preview URL.
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({ ...prev, imageUrl: reader.result as string }));
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user?.email === ADMIN_EMAIL || designMode) {
      const q = query(
        collection(db, "posts"), 
        orderBy("order", "asc"),
        orderBy("createdAt", "desc")
      );
      const unsubscribePosts = onSnapshot(q, (snapshot) => {
        const docs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Post[];
        setPosts(docs);
        setLoading(false);
      });

      const catQ = query(collection(db, "categories"), orderBy("name", "asc"));
      const unsubscribeCats = onSnapshot(catQ, (snapshot) => {
        const docs = snapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name
        })) as Category[];
        setCategories(docs);
      });

      const noticeQ = query(collection(db, "notices"), orderBy("createdAt", "desc"));
      const unsubscribeNotices = onSnapshot(noticeQ, (snapshot) => {
        const docs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Notice[];
        setNotices(docs);
      });

      return () => {
        unsubscribePosts();
        unsubscribeCats();
        unsubscribeNotices();
      };
    }
  }, [user, designMode]);

  const handleReorder = async (newOrder: Post[]) => {
    setPosts(newOrder);
    
    // Batch update order in Firestore
    try {
      const updates = newOrder.map((post, index) => {
        if (post.order !== index) {
          return updateDoc(doc(db, "posts", post.id), { order: index });
        }
        return null;
      }).filter(Boolean);
      
      if (updates.length > 0) {
        await Promise.all(updates);
      }
    } catch (err) {
      console.error("Failed to update order:", err);
    }
  };

  const handleAddNotice = async (e: FormEvent) => {
    e.preventDefault();
    if (!newNotice.title.trim() || !newNotice.content.trim()) return;
    try {
      await addDoc(collection(db, "notices"), {
        ...newNotice,
        createdAt: serverTimestamp(),
        isActive: true
      });
      setNewNotice({ title: "", content: "" });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteNotice = async (id: string) => {
    if (!confirm("이 공지사항을 삭제하시겠습니까?")) return;
    try {
      await deleteDoc(doc(db, "notices", id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleNotice = async (id: string, current: boolean) => {
    try {
      await updateDoc(doc(db, "notices", id), { isActive: !current });
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddCategory = async (e: FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    try {
      await addDoc(collection(db, "categories"), { name: newCategoryName.trim() });
      setNewCategoryName("");
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm("이 카테고리를 삭제하시겠습니까?")) return;
    try {
      await deleteDoc(doc(db, "categories", id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleSave = async () => {
    if (!formData.title || !formData.price || !formData.naverUrl) return;

    const data = {
      ...formData,
      updatedAt: serverTimestamp(),
    };

    try {
      if (editingId) {
        await updateDoc(doc(db, "posts", editingId), data);
      } else {
        await addDoc(collection(db, "posts"), {
          ...data,
          order: posts.length,
          status: "public",
          isSoldOut: false,
          createdAt: serverTimestamp(),
        });
      }
      setEditingId(null);
      setFormData({});
      setActiveTab("manage");
    } catch (error) {
      console.error("Error saving post:", error);
    }
  };

  const handleSeedData = async () => {
    if (!confirm("홈페이지에 표시되는 초기 데이터를 관리자 데이터베이스로 가져오시겠습니까?")) return;
    
    const INITIAL_POSTS = [
      { title: "[마스터 클래스] 포카치아", visuals: "Deep character baking", image: "pastryImg", naverUrl: "https://smartstore.naver.com/putitinyourmouth", originalPrice: "₩69,900", price: "₩49,900", category: "마스터 클래스" },
      { title: "[마스터 클래스] 데이지", visuals: "Elegant floral design", image: "cakeImg", naverUrl: "https://smartstore.naver.com/putitinyourmouth", originalPrice: "₩49,900", price: "₩39,900", category: "마스터 클래스" },
      { title: "[특강] 에그타르트(쉬운 버전)", visuals: "Simple & Crispy", image: "heroImg", naverUrl: "https://smartstore.naver.com/putitinyourmouth", price: "₩39,900", category: "특강" },
      { title: "[마스터 클래스] 카페 앙브레", visuals: "Rich aromatic experience", image: "macaronsImg", naverUrl: "https://smartstore.naver.com/putitinyourmouth", price: "₩49,900", category: "마스터 클래스" },
      { title: "[마스터 클래스] 까눌레", visuals: "Classic French texture", image: "pastryImg", naverUrl: "https://smartstore.naver.com/putitinyourmouth", price: "₩49,900", category: "마스터 클래스" },
      { title: "[특강] 말차 쉬폰 케이크", visuals: "Light & Airy", image: "cakeImg", naverUrl: "https://smartstore.naver.com/putitinyourmouth", originalPrice: "₩39,900", price: "₩29,900", category: "특강" },
      { title: "[파티쉐 클래스] 10강 100% 피스타치오 (글라사주)", visuals: "Professional glazing tech", image: "heroImg", naverUrl: "https://smartstore.naver.com/putitinyourmouth", price: "₩39,900", category: "파티쉐 클래스" },
      { title: "[파티쉐 클래스] 9강 마카롱 (이탈리안 머랭vs프렌치 머랭)", visuals: "Mastering textures", image: "macaronsImg", naverUrl: "https://smartstore.naver.com/putitinyourmouth", price: "₩39,900", category: "파티쉐 클래스" },
      { title: "[파티쉐 클래스] 8강 사계절 파운드 (4종류)", visuals: "Year-round variety", image: "pastryImg", naverUrl: "https://smartstore.naver.com/putitinyourmouth", price: "₩39,900", rating: "5", reviews: "12", category: "파티쉐 클래스" },
      { title: "[마스터 클래스] 에떼 뻬쉬", visuals: "Summer peach flavor", image: "cakeImg", naverUrl: "https://smartstore.naver.com/putitinyourmouth", price: "₩49,900", rating: "5", reviews: "3", category: "마스터 클래스" },
      { title: "[파티쉐 클래스] 7강 오렌지 민트 타르트 (퐁사주)", visuals: "Refreshing citrus", image: "heroImg", naverUrl: "https://smartstore.naver.com/putitinyourmouth", price: "₩39,900", rating: "5", reviews: "4", category: "파티쉐 클래스" },
      { title: "[파티쉐 클래스] 6강 에그타르트 & 밀푀유", visuals: "Classic puff pastry", image: "macaronsImg", naverUrl: "https://smartstore.naver.com/putitinyourmouth", price: "₩39,900", rating: "4.88", reviews: "48", category: "파티쉐 클래스" },
      { title: "[파티쉐 클래스] 5강 바닐라 무스 (무스 케이크)", visuals: "Silky smooth vanilla", image: "pastryImg", naverUrl: "https://smartstore.naver.com/putitinyourmouth", price: "₩39,900", rating: "5", reviews: "14", category: "파티쉐 클래스" },
      { title: "[마스터 클래스] 유자 치즈케이크", visuals: "Zesty & Creamy", image: "cakeImg", naverUrl: "https://smartstore.naver.com/putitinyourmouth", price: "₩49,900", rating: "4.94", reviews: "18", category: "마스터 클래스" },
      { title: "[파티쉐 클래스] 4강 파리 브레스트 (파트 아 슈)", visuals: "French hazelnut classic", image: "heroImg", naverUrl: "https://smartstore.naver.com/putitinyourmouth", price: "₩39,900", rating: "5", reviews: "13", category: "파티쉐 클래스" },
      { title: "[마스터 클래스] 둘세 무스 케이크", visuals: "Caramelized chocolate", image: "macaronsImg", naverUrl: "https://smartstore.naver.com/putitinyourmouth", price: "₩49,900", rating: "5", reviews: "16", category: "마스터 클래스" },
      { title: "[파티쉐 클래스] 3강 샌드쿠키 (사블레 vs 슈크레)", visuals: "Cookie base comparison", image: "pastryImg", naverUrl: "https://smartstore.naver.com/putitinyourmouth", price: "₩39,900", rating: "5", reviews: "25", category: "파티쉐 클래스" },
      { title: "[파티쉐 클래스] 2강 프레지에", visuals: "Seasonal strawberry", image: "cakeImg", naverUrl: "https://smartstore.naver.com/putitinyourmouth", price: "₩39,900", rating: "4.96", reviews: "26", category: "파티쉐 클래스" },
      { title: "[무료강의] 체리 다쿠아즈", visuals: "Free introductory class", image: "heroImg", naverUrl: "https://smartstore.naver.com/putitinyourmouth", price: "₩10", rating: "4.94", reviews: "62", category: "무료강의" },
      { title: "[파티쉐 클래스] 1강 구움과자 (휘낭시에&마들렌)", visuals: "Fundamental tea cakes", image: "macaronsImg", naverUrl: "https://smartstore.naver.com/putitinyourmouth", price: "₩49,900", rating: "4.9", reviews: "100", category: "파티쉐 클래스" },
      { title: "[마스터 클래스] 딸기 크림치즈 타르트", visuals: "Rich & Sweet pairing", image: "pastryImg", naverUrl: "https://smartstore.naver.com/putitinyourmouth", price: "₩49,900", rating: "4.95", reviews: "19", category: "마스터 클래스" },
      { title: "[택배배송] 푸이마 휘낭시에 세트", visuals: "Fresh seasonal set", image: "cakeImg", naverUrl: "https://smartstore.naver.com/putitinyourmouth", originalPrice: "₩3,000", price: "₩2,700", rating: "4.98", reviews: "269", category: "택배배송" }
    ];

    setLoading(true);
    try {
      // Add Categories first
      const cats = ["마스터 클래스", "파티쉐 클래스", "특강", "무료강의", "택배배송"];
      for (const cat of cats) {
        if (!categories.find(c => c.name === cat)) {
          await addDoc(collection(db, "categories"), { name: cat });
        }
      }

      // Add Posts with default status and order
      for (let i = 0; i < INITIAL_POSTS.length; i++) {
        const post = INITIAL_POSTS[i];
        await addDoc(collection(db, "posts"), {
          ...post,
          status: "public",
          isSoldOut: false,
          order: i,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      alert("데이터를 성공적으로 가져왔습니다.");
    } catch (err) {
      console.error(err);
      alert("데이터를 가져오는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (id: string, current: string) => {
    try {
      await updateDoc(doc(db, "posts", id), { 
        status: current === "hidden" ? "public" : "hidden" 
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleSoldOut = async (id: string, current: boolean) => {
    try {
      await updateDoc(doc(db, "posts", id), { isSoldOut: !current });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Delete this post?")) {
      try {
        await deleteDoc(doc(db, "posts", id));
      } catch (error) {
        console.error("Error deleting post:", error);
      }
    }
  };

  const startEdit = (post: Post) => {
    setEditingId(post.id);
    setFormData(post);
    setActiveTab("register");
  };

  const handleLogin = async () => {
    try {
      await loginWithGoogle();
    } catch (error: any) {
      console.error("Login failed:", error);
      if (error.code === 'auth/popup-blocked') {
        alert("브라우저의 팝업 차단이 설정되어 있습니다. 팝업 차단을 해제하거나 주소창의 팝업 허용 아이콘을 클릭해주세요.");
      } else if (error.code === 'auth/operation-not-allowed') {
        alert("Firebase 콘솔에서 Google 로그인이 활성화되지 않았습니다.");
      } else {
        alert("로그인 중 오류가 발생했습니다: " + error.message);
      }
    }
  };

  const sidebarItems = [
    { section: "게시물 관리", items: [
      { id: "manage", label: "클래스 목록 및 상태", icon: LayoutDashboard },
      { id: "register", label: "클래스 등록", icon: PlusCircle },
      { id: "categories", label: "카테고리 관리", icon: Tag },
      { id: "notices", label: "공지사항 및 배너", icon: Megaphone },
    ]},
    { section: "회원 관리", items: [
      { id: "users", label: "전체 회원 조회", icon: Users },
      { id: "history", label: "예약 및 수강 히스토리", icon: Clock },
      { id: "roles", label: "회원 등급 및 권한", icon: ShieldCheck },
      { id: "inquiry", label: "1:1 문의 및 상담", icon: HelpCircle },
      { id: "blacklist", label: "이용 제한 관리", icon: UserX },
    ]}
  ];

  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <motion.h1 
        animate={{ opacity: [0.3, 1, 0.3] }}
        transition={{ repeat: Infinity, duration: 1.5 }}
        className="text-2xl font-black tracking-tighter uppercase"
      >
        Puima Admin
      </motion.h1>
    </div>
  );

  if (!designMode && (!user || user.email !== ADMIN_EMAIL)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-6">
        <div className="max-w-md w-full bg-white p-8 rounded-[32px] shadow-sm border border-zinc-200">
          <h1 className="text-2xl font-black tracking-tighter mb-6">Admin Access</h1>
          <p className="text-zinc-500 mb-2 text-sm font-medium">
            {user ? `접근 권한이 없습니다: ${user.email}` : "Please log in with the admin account."}
          </p>
          
          <div className="bg-zinc-50 border border-zinc-100 p-5 rounded-2xl mb-8">
            <p className="text-[12px] text-zinc-600 leading-relaxed font-medium">
              💡 <b>Note:</b> AI Studio 미리보기 환경에서는 구글 로그인이 원활하지 않을 수 있습니다. 
              로그인이 안 된다면 <b>배포된 Vercel URL</b>에서 관리해 주세요.
            </p>
          </div>

          <div className="space-y-3">
            <button 
              onClick={handleLogin}
              className="w-full flex items-center justify-center gap-2 bg-black text-white p-4 rounded-2xl font-bold hover:bg-zinc-800 transition-all active:scale-[0.98]"
            >
              <LogIn size={20} />
              Login with Google
            </button>

            {isDev && (
              <button 
                onClick={() => setDesignMode(true)}
                className="w-full flex items-center justify-center gap-2 bg-white text-black border border-zinc-200 p-4 rounded-2xl font-bold hover:bg-zinc-50 transition-all"
              >
                Preview UI (Design Mode)
              </button>
            )}
          </div>
          
          {user && (
            <button onClick={logout} className="w-full mt-6 text-[12px] text-zinc-400 hover:text-black underline underline-offset-4">
              Sign out and try another account
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex selection:bg-black selection:text-white font-sans">
      {/* Sidebar */}
      <aside className={`bg-white border-r border-zinc-200 flex flex-col transition-all duration-300 ${sidebarOpen ? "w-72" : "w-20"}`}>
        <div className="p-6 flex items-center justify-between">
          <div className={`flex items-center gap-3 ${!sidebarOpen && "hidden"}`}>
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center text-white font-black text-xs">P</div>
            <h1 className="text-xl font-black tracking-tighter uppercase whitespace-nowrap">Admin</h1>
          </div>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-zinc-100 rounded-xl transition-all">
            <Menu size={20} />
          </button>
        </div>

        <nav className="flex-grow overflow-y-auto px-3 space-y-8 mt-4">
          {sidebarItems.map((section, idx) => (
            <div key={idx}>
              {sidebarOpen && (
                <p className="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-4">{section.section}</p>
              )}
              <div className="space-y-1">
                {section.items.map(item => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id as TabType)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all relative group ${
                      activeTab === item.id 
                        ? "bg-black text-white shadow-lg shadow-black/10" 
                        : "text-zinc-600 hover:bg-zinc-100"
                    }`}
                  >
                    <item.icon size={20} className={activeTab === item.id ? "text-white" : "text-zinc-400 group-hover:text-black"} />
                    {sidebarOpen && (
                      <span className="text-sm font-bold truncate">{item.label}</span>
                    )}
                    {activeTab === item.id && sidebarOpen && (
                      <ChevronRight size={14} className="ml-auto opacity-50" />
                    )}
                    {!sidebarOpen && (
                      <div className="absolute left-full ml-4 px-2 py-1 bg-black text-white text-[10px] rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50">
                        {item.label}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-4 mt-auto border-t border-zinc-100">
          <button 
            onClick={() => { logout(); setDesignMode(false); }}
            className={`w-full flex items-center gap-3 p-3 rounded-xl text-zinc-400 hover:text-red-500 hover:bg-red-50 transition-all ${!sidebarOpen && "justify-center"}`}
          >
            <LogOut size={20} />
            {sidebarOpen && <span className="text-xs font-bold uppercase tracking-widest">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-grow flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-zinc-200 px-8 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <a href="/" className="p-2 hover:bg-zinc-100 rounded-xl transition-all">
              <ArrowLeft size={20} />
            </a>
            <h2 className="text-lg font-black tracking-tighter uppercase">
              {sidebarItems.flatMap(s => s.items).find(i => i.id === activeTab)?.label}
            </h2>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="relative group hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
              <input 
                type="text" 
                placeholder="Search..." 
                className="bg-zinc-100 border-none rounded-xl py-2 pl-10 pr-4 text-xs font-medium focus:ring-2 focus:ring-black/5 w-64 transition-all"
              />
            </div>
            <button className="relative p-2 text-zinc-400 hover:text-black transition-all">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="flex items-center gap-3 pl-6 border-l border-zinc-200">
              <div className="text-right">
                <p className="text-xs font-black truncate max-w-[120px]">{user?.email || "Admin User"}</p>
                <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Master</p>
              </div>
              <div className="w-10 h-10 bg-zinc-100 rounded-xl border border-zinc-200 flex items-center justify-center font-black text-xs">
                {user?.email?.[0].toUpperCase() || "A"}
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-grow overflow-y-auto p-8">
          <div className="max-w-6xl mx-auto">
            <AnimatePresence mode="wait">
              {/* Class Management View */}
              {activeTab === "manage" && (
                <motion.div 
                  key="manage"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <div className="flex justify-between items-end mb-8">
                    <div>
                      <h3 className="text-3xl font-black tracking-tighter uppercase mb-2">Current Classes</h3>
                      <p className="text-zinc-500 font-medium">관리 가능한 총 {posts.length}개의 클래스</p>
                    </div>
                    <div className="flex gap-3">
                      <button 
                        onClick={handleSeedData}
                        className="bg-white border border-zinc-200 px-6 py-3 rounded-2xl font-bold text-xs hover:border-black transition-all flex items-center gap-2"
                      >
                        <ImageIcon size={16} />
                        Sync Initial Data
                      </button>
                      <button 
                        onClick={() => setActiveTab("register")}
                        className="bg-black text-white px-6 py-3 rounded-2xl font-bold text-sm hover:bg-zinc-800 transition-all active:scale-95 flex items-center gap-2"
                      >
                        <Plus size={18} />
                        Add New Class
                      </button>
                    </div>
                  </div>

                  <Reorder.Group 
                    axis="y" 
                    values={posts} 
                    onReorder={handleReorder}
                    className="grid grid-cols-1 gap-4"
                  >
                    {posts.map(post => (
                      <Reorder.Item 
                        key={post.id} 
                        value={post}
                        className="bg-white p-6 rounded-[32px] border border-zinc-200 flex items-center gap-6 group hover:shadow-xl hover:shadow-black/5 hover:border-black/10 transition-all relative"
                      >
                        <div className="flex-shrink-0 text-zinc-300 cursor-grab active:cursor-grabbing hover:text-black transition-colors px-2">
                          <GripVertical size={20} />
                        </div>

                        <div className="w-24 h-24 bg-zinc-50 rounded-2xl overflow-hidden flex-shrink-0 border border-zinc-100 flex items-center justify-center">
                          {post.imageUrl ? (
                            <img src={post.imageUrl} alt={post.title} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-[10px] font-black uppercase tracking-tighter text-zinc-300">{post.image}</span>
                          )}
                        </div>
                        <div className="flex-grow">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">{post.category || "No Category"}</span>
                            {post.isSoldOut && (
                              <span className="px-2 py-0.5 bg-red-100 text-red-600 text-[8px] font-black uppercase tracking-widest rounded-full">Sold Out</span>
                            )}
                          </div>
                          <h4 className="font-bold text-lg mb-2">{post.title}</h4>
                          <div className="flex items-center gap-3 text-sm font-bold">
                            <span className="text-black font-black">{post.price}</span>
                            {post.originalPrice && <span className="text-zinc-300 line-through font-medium text-xs">{post.originalPrice}</span>}
                            
                            <div className="flex items-center gap-1 ml-4">
                              <button 
                                onClick={() => handleToggleStatus(post.id, post.status || "public")}
                                className={`flex items-center gap-1.5 px-3 py-1 rounded-full border transition-all ${
                                  post.status === "hidden" 
                                    ? "bg-zinc-100 border-zinc-200 text-zinc-400" 
                                    : "bg-green-50 border-green-100 text-green-600"
                                }`}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full ${post.status === "hidden" ? "bg-zinc-300" : "bg-green-500"}`}></span>
                                <span className="text-[10px] uppercase font-black tracking-widest">{post.status === "hidden" ? "Hidden" : "Public"}</span>
                              </button>

                              <button 
                                onClick={() => handleToggleSoldOut(post.id, !!post.isSoldOut)}
                                className={`px-3 py-1 rounded-full border text-[10px] uppercase font-black tracking-widest transition-all ${
                                  post.isSoldOut 
                                    ? "bg-red-50 border-red-100 text-red-600" 
                                    : "bg-white border-zinc-200 text-zinc-400 hover:border-black hover:text-black"
                                }`}
                              >
                                {post.isSoldOut ? "Restore" : "Set Sold Out"}
                              </button>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                          <button 
                            onClick={() => startEdit(post)}
                            className="p-4 text-zinc-400 hover:text-black hover:bg-zinc-100 rounded-2xl transition-all"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button 
                            onClick={() => handleDelete(post.id)}
                            className="p-4 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </Reorder.Item>
                    ))}
                  </Reorder.Group>
                  
                  {posts.length === 0 && (
                      <div className="text-center py-32 bg-zinc-50 border-2 border-dashed border-zinc-200 rounded-[40px] flex flex-col items-center">
                        <p className="text-zinc-400 text-sm font-medium mb-6">데이터가 없습니다.<br />새로운 마스터클래스를 등록하거나 초기 데이터를 가져오세요.</p>
                        <div className="flex gap-3">
                          <button 
                            onClick={() => setActiveTab("register")}
                            className="bg-black text-white px-8 py-3 rounded-full text-xs font-bold hover:bg-zinc-800 transition-all"
                          >
                            New Class
                          </button>
                          <button 
                            onClick={handleSeedData}
                            className="bg-white border border-zinc-200 px-8 py-3 rounded-full text-xs font-bold hover:border-black transition-all"
                          >
                            Import Default Data
                          </button>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

              {/* Class Registration/Edit View */}
              {activeTab === "register" && (
                <motion.div 
                  key="register"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="bg-white p-10 rounded-[40px] border border-zinc-200 shadow-sm"
                >
                  <div className="flex justify-between items-center mb-10 pb-6 border-b border-zinc-100">
                    <div>
                      <h3 className="text-3xl font-black tracking-tighter uppercase mb-2">
                        {editingId ? "Edit Class" : "New Registration"}
                      </h3>
                      <p className="text-zinc-500 font-medium">상세 정보를 입력하여 마스터클래스를 활성화하세요.</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    <div className="space-y-8">
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-3">Class Title</label>
                        <input 
                          type="text" 
                          value={formData.title || ""} 
                          onChange={e => setFormData({...formData, title: e.target.value})}
                          placeholder="[마스터 클래스] ..."
                          className="w-full p-4 bg-zinc-50 border border-zinc-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-black/5 transition-all"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-3">Class Category</label>
                        <select 
                          value={formData.category || ""} 
                          onChange={e => setFormData({...formData, category: e.target.value})}
                          className="w-full p-4 bg-zinc-50 border border-zinc-200 rounded-2xl text-sm font-black focus:outline-none focus:ring-4 focus:ring-black/5 appearance-none cursor-pointer"
                        >
                          <option value="">카테고리 선택</option>
                          {categories.map(cat => (
                            <option key={cat.id} value={cat.name}>{cat.name}</option>
                          ))}
                        </select>
                        <p className="mt-2 text-[10px] text-zinc-400 font-medium">카테고리 관리는 왼쪽 메뉴에서 가능합니다.</p>
                      </div>

                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-3">Class Thumbnail Image</label>
                        <div className="relative group">
                          <input 
                            type="file" 
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                          />
                          <div className={`w-full aspect-video rounded-[32px] border-2 border-dashed transition-all flex flex-col items-center justify-center p-6 text-center ${
                            formData.imageUrl ? "border-black/10 bg-zinc-50" : "border-zinc-200 hover:border-black/20 bg-white"
                          }`}>
                            {formData.imageUrl ? (
                              <div className="relative w-full h-full">
                                <img 
                                  src={formData.imageUrl} 
                                  alt="Preview" 
                                  className="w-full h-full object-cover rounded-2xl"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all rounded-2xl flex items-center justify-center text-white text-xs font-bold">
                                  Change Image
                                </div>
                              </div>
                            ) : (
                              <>
                                <div className="w-12 h-12 bg-zinc-100 rounded-2xl flex items-center justify-center mb-4 text-zinc-400 group-hover:text-black transition-colors">
                                  <Upload size={24} />
                                </div>
                                <p className="text-sm font-bold mb-1">Click to upload or drag & drop</p>
                                <p className="text-[10px] text-zinc-400 font-medium uppercase tracking-widest">JPG, PNG, WEBP (Max 5MB)</p>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-3">Reservation Link</label>
                        <input 
                          type="text" 
                          value={formData.naverUrl || ""} 
                          onChange={e => setFormData({...formData, naverUrl: e.target.value})}
                          placeholder="Naver Smart Store URL"
                          className="w-full p-4 bg-zinc-50 border border-zinc-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-black/5 transition-all"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-8">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-3">Sale Price</label>
                          <input 
                            type="text" 
                            value={formData.price || ""} 
                            onChange={e => setFormData({...formData, price: e.target.value})}
                            placeholder="₩49,900"
                            className="w-full p-4 bg-zinc-50 border border-zinc-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-black/5 transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-3">List Price</label>
                          <input 
                            type="text" 
                            value={formData.originalPrice || ""} 
                            onChange={e => setFormData({...formData, originalPrice: e.target.value})}
                            placeholder="₩69,900"
                            className="w-full p-4 bg-zinc-50 border border-zinc-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-black/5 transition-all"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-3">Class Theme (Fallback Visual)</label>
                        <select 
                          value={formData.image || ""} 
                          onChange={e => setFormData({...formData, image: e.target.value})}
                          className="w-full p-4 bg-zinc-50 border border-zinc-200 rounded-2xl text-sm font-black focus:outline-none focus:ring-4 focus:ring-black/5 appearance-none cursor-pointer"
                        >
                          <option value="">Select Theme</option>
                          <option value="heroImg">Deep Brown</option>
                          <option value="pastryImg">Warm Gold</option>
                          <option value="macaronsImg">Creamy Gray</option>
                          <option value="cakeImg">Minimal White</option>
                        </select>
                      </div>

                      <div className="bg-zinc-50 p-6 rounded-[32px] border border-zinc-100 italic">
                        <p className="text-[11px] text-zinc-400 leading-relaxed">
                          * Rating and Reviews are automatically synced with the store data when valid Naver Store link is provided (Feature coming soon).
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-12 pt-10 border-t border-zinc-100 flex justify-end gap-4">
                    <button 
                      onClick={() => { setActiveTab("manage"); setEditingId(null); setFormData({}); }}
                      className="px-10 py-4 rounded-2xl text-sm font-bold hover:bg-zinc-50 transition-all border border-transparent hover:border-zinc-200"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleSave}
                      className="flex items-center gap-3 bg-black text-white px-12 py-4 rounded-2xl font-black text-sm hover:bg-zinc-800 transition-all active:scale-[0.98] shadow-lg shadow-black/20"
                    >
                      <Save size={18} />
                      {editingId ? "Update Content" : "Publish Masterclass"}
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Category Management View */}
              {activeTab === "categories" && (
                <motion.div 
                  key="categories"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="bg-white p-10 rounded-[40px] border border-zinc-200 shadow-sm"
                >
                  <div className="mb-10">
                    <h3 className="text-3xl font-black tracking-tighter uppercase mb-2">Category Management</h3>
                    <p className="text-zinc-500 font-medium">클래스를 분류할 카테고리를 등록하고 관리하세요.</p>
                  </div>

                  <form onSubmit={handleAddCategory} className="flex gap-3 mb-10">
                    <input 
                      type="text" 
                      value={newCategoryName}
                      onChange={e => setNewCategoryName(e.target.value)}
                      placeholder="새 카테고리 이름 (예: 원데이 클래스)"
                      className="flex-grow p-4 bg-zinc-50 border border-zinc-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-black/5 transition-all"
                    />
                    <button 
                      type="submit"
                      className="bg-black text-white px-8 py-4 rounded-2xl font-black text-sm hover:bg-zinc-800 transition-all flex items-center gap-2"
                    >
                      <Plus size={18} />
                      Add
                    </button>
                  </form>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {categories.map(cat => (
                      <div key={cat.id} className="bg-white p-4 pl-6 rounded-2xl border border-zinc-200 flex items-center justify-between group hover:border-black transition-all">
                        <span className="font-bold text-sm">{cat.name}</span>
                        <button 
                          onClick={() => handleDeleteCategory(cat.id)}
                          className="p-2 text-zinc-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                    {categories.length === 0 && (
                      <div className="col-span-full py-12 text-center text-zinc-400 text-sm font-medium border-2 border-dashed border-zinc-100 rounded-3xl">
                        등록된 카테고리가 없습니다.
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Notice Management View */}
              {activeTab === "notices" && (
                <motion.div 
                  key="notices"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="bg-white p-10 rounded-[40px] border border-zinc-200 shadow-sm"
                >
                  <div className="mb-10">
                    <h3 className="text-3xl font-black tracking-tighter uppercase mb-2">Notices / Banners</h3>
                    <p className="text-zinc-500 font-medium">배포 페이지 상단에 노출될 소식을 기록하세요.</p>
                  </div>

                  <form onSubmit={handleAddNotice} className="space-y-6 mb-16 bg-zinc-50 p-8 rounded-[32px] border border-zinc-100">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-2">Notice Title</label>
                      <input 
                        type="text" 
                        value={newNotice.title}
                        onChange={e => setNewNotice({...newNotice, title: e.target.value})}
                        placeholder="공지사항 제목"
                        className="w-full p-4 bg-white border border-zinc-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-black/5"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-2">Content</label>
                      <textarea 
                        value={newNotice.content}
                        onChange={e => setNewNotice({...newNotice, content: e.target.value})}
                        placeholder="공지 내용을 입력하세요"
                        rows={3}
                        className="w-full p-4 bg-white border border-zinc-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-black/5"
                      />
                    </div>
                    <button 
                      type="submit"
                      className="bg-black text-white px-10 py-4 rounded-2xl font-black text-sm hover:bg-zinc-800 transition-all active:scale-95 flex items-center gap-2"
                    >
                      <Plus size={18} />
                      Publish Notice
                    </button>
                  </form>

                  <div className="space-y-4">
                    {notices.map(notice => (
                      <div key={notice.id} className="p-6 bg-white border border-zinc-200 rounded-[32px] flex items-center gap-6 group">
                        <div className="flex-grow">
                          <h4 className="font-bold text-base mb-1">{notice.title}</h4>
                          <p className="text-sm text-zinc-400 font-medium line-clamp-1">{notice.content}</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <button 
                            onClick={() => handleToggleNotice(notice.id, notice.isActive)}
                            className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                              notice.isActive ? "bg-green-100 text-green-700" : "bg-zinc-100 text-zinc-400"
                            }`}
                          >
                            {notice.isActive ? "Active" : "Hidden"}
                          </button>
                          <button 
                            onClick={() => handleDeleteNotice(notice.id)}
                            className="p-3 text-zinc-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    ))}
                    {notices.length === 0 && (
                      <div className="py-20 text-center text-zinc-400 font-medium">
                        첫 공지사항을 작성해 보세요.
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Placeholder Views for other tabs */}
              {["users", "history", "roles", "inquiry", "blacklist"].includes(activeTab) && (
                <motion.div 
                  key={activeTab}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white p-20 rounded-[40px] border border-zinc-200 text-center flex flex-col items-center"
                >
                  <div className="w-20 h-20 bg-zinc-50 rounded-full flex items-center justify-center mb-6">
                    {sidebarItems.flatMap(s => s.items).find(i => i.id === activeTab)?.icon({ size: 32, className: "text-zinc-300" })}
                  </div>
                  <h3 className="text-2xl font-black tracking-tighter uppercase mb-3">Under Construction</h3>
                  <p className="text-zinc-500 font-medium max-w-md">
                    {sidebarItems.flatMap(s => s.items).find(i => i.id === activeTab)?.label} 기능은 현재 준비 중입니다. 
                    시스템 업데이트를 기다려 주세요.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
}
