import { useState, useEffect, ChangeEvent, FormEvent, useRef } from "react";
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
  url?: string;
  isBanner?: boolean;
}

type TabType = 
  | "manage" | "register" | "categories" | "notices"
  | "users" | "history" | "roles" | "inquiry" | "blacklist";

export default function Admin() {
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [newNotice, setNewNotice] = useState({ title: "", content: "", url: "", isBanner: false });
  const [newCategoryName, setNewCategoryName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Post>>({});
  const [loading, setLoading] = useState(true);
  const [designMode, setDesignMode] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("manage");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragY = useRef<number | null>(null);
  const scrollInterval = useRef<number | null>(null);

  // Autosave for Class/Post editing
  useEffect(() => {
    if (editingId && formData.title) {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
      
      autoSaveTimerRef.current = setTimeout(() => {
        handleAutoSaveAction(async () => {
          // Exclude the id from the update data
          const { id, ...updateData } = formData;
          await updateDoc(doc(db, "posts", editingId), {
            ...updateData,
            updatedAt: serverTimestamp(),
          });
        });
      }, 800); // 800ms debounce
    }
    
    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [formData, editingId]);

  const isDev = import.meta.env.DEV;

  const startAutoScroll = () => {
    if (scrollInterval.current) return;
    
    scrollInterval.current = window.setInterval(() => {
      if (!containerRef.current || dragY.current === null) return;
      
      const container = containerRef.current;
      const { top, bottom } = container.getBoundingClientRect();
      const cursorY = dragY.current;
      
      const threshold = 120;
      const maxSpeed = 25;

      if (cursorY < top + threshold) {
        const intensity = Math.max(0, (top + threshold - cursorY) / threshold);
        container.scrollTop -= maxSpeed * Math.pow(intensity, 1.5);
      } else if (cursorY > bottom - threshold) {
        const intensity = Math.max(0, (cursorY - (bottom - threshold)) / threshold);
        container.scrollTop += maxSpeed * Math.pow(intensity, 1.5);
      }
    }, 10); // Higher frequency for smoother scrolling
  };

  const stopAutoScroll = () => {
    if (scrollInterval.current) {
      window.clearInterval(scrollInterval.current);
      scrollInterval.current = null;
    }
    dragY.current = null;
  };

  const handleDrag = (_: any, info: any) => {
    dragY.current = info.point.y;
  };

  const handleAutoSaveAction = async (action: () => Promise<any>) => {
    setIsSaving(true);
    try {
      await action();
      setLastSaved(new Date());
    } catch (err) {
      console.error("Auto-save failed:", err);
    } finally {
      setIsSaving(false);
    }
  };

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
    handleAutoSaveAction(async () => {
      const updates = newOrder.map((post, index) => {
        if (post.order !== index) {
          return updateDoc(doc(db, "posts", post.id), { order: index });
        }
        return null;
      }).filter(Boolean);
      
      if (updates.length > 0) {
        await Promise.all(updates);
      }
    });
  };

  const handleAddNotice = async (e: FormEvent) => {
    e.preventDefault();
    if (!newNotice.title.trim() || !newNotice.content.trim()) return;
    handleAutoSaveAction(async () => {
      await addDoc(collection(db, "notices"), {
        ...newNotice,
        createdAt: serverTimestamp(),
        isActive: true
      });
      setNewNotice({ title: "", content: "", url: "", isBanner: false });
    });
  };

  const handleDeleteNotice = async (id: string) => {
    if (!confirm("이 공지사항을 삭제하시겠습니까?")) return;
    handleAutoSaveAction(async () => {
      await deleteDoc(doc(db, "notices", id));
    });
  };

  const handleToggleNotice = async (id: string, current: boolean) => {
    handleAutoSaveAction(async () => {
      await updateDoc(doc(db, "notices", id), { isActive: !current });
    });
  };

  const handleAddCategory = async (e: FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    handleAutoSaveAction(async () => {
      await addDoc(collection(db, "categories"), { name: newCategoryName.trim() });
      setNewCategoryName("");
    });
  };

  const handleUpdateCategory = async (id: string, newName: string) => {
    if (!newName.trim()) return;
    handleAutoSaveAction(async () => {
      await updateDoc(doc(db, "categories", id), { name: newName.trim() });
      setEditingCategory(null);
    });
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm("이 카테고리를 삭제하시겠습니까?")) return;
    handleAutoSaveAction(async () => {
      await deleteDoc(doc(db, "categories", id));
    });
  };

  const handleSave = async () => {
    if (!formData.title || !formData.price || !formData.naverUrl) return;

    const data = {
      ...formData,
      updatedAt: serverTimestamp(),
    };

    handleAutoSaveAction(async () => {
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
    });
  };

  const handleToggleStatus = async (id: string, current: string) => {
    handleAutoSaveAction(async () => {
      await updateDoc(doc(db, "posts", id), { 
        status: current === "hidden" ? "public" : "hidden" 
      });
    });
  };

  const handleToggleSoldOut = async (id: string, current: boolean) => {
    handleAutoSaveAction(async () => {
      await updateDoc(doc(db, "posts", id), { isSoldOut: !current });
    });
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Delete this post?")) {
      handleAutoSaveAction(async () => {
        await deleteDoc(doc(db, "posts", id));
      });
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
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-black tracking-tighter uppercase whitespace-nowrap">
                {sidebarItems.flatMap(s => s.items).find(i => i.id === activeTab)?.label}
              </h2>
              
              {/* Auto-save Status Indicator */}
              <div className="hidden lg:flex items-center gap-2 pl-4 border-l border-zinc-200">
                <AnimatePresence mode="wait">
                  {isSaving ? (
                    <motion.div 
                      key="saving"
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="flex items-center gap-2"
                    >
                      <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Syncing...</span>
                    </motion.div>
                  ) : lastSaved ? (
                    <motion.div 
                      key="saved"
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="flex items-center gap-2"
                    >
                      <ShieldCheck size={14} className="text-green-500" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                        Saved at {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </motion.div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-zinc-200 rounded-full"></div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">All changes saved</span>
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </div>
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
        <div ref={containerRef} className="flex-grow overflow-y-auto p-8">
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
                        onDragStart={startAutoScroll}
                        onDragEnd={stopAutoScroll}
                        onDrag={handleDrag}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        whileDrag={{ 
                          scale: 1.01, 
                          boxShadow: "0 10px 20px rgba(0,0,0,0.1)",
                          zIndex: 50
                        }}
                        transition={{
                          layout: { type: "spring", stiffness: 500, damping: 30, mass: 0.8 },
                          opacity: { duration: 0.2 }
                        }}
                        className="bg-white px-4 py-2 rounded-xl border border-zinc-200 flex items-center gap-4 group hover:border-black/20 transition-[border-color,box-shadow,background-color] relative"
                      >
                        {/* Drag Handle */}
                        <div className="flex-shrink-0 text-zinc-300 cursor-grab active:cursor-grabbing hover:text-black transition-colors">
                          <GripVertical size={16} />
                        </div>

                        {/* Thumbnail */}
                        <div className="w-10 h-10 bg-zinc-50 rounded-lg overflow-hidden flex-shrink-0 border border-zinc-100 flex items-center justify-center">
                          {post.imageUrl ? (
                            <img src={post.imageUrl} alt={post.title} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-[8px] font-black uppercase text-zinc-300">{post.image}</span>
                          )}
                        </div>

                        {/* Title & Info */}
                        <div className="flex-grow min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black uppercase text-zinc-400 tracking-tighter">[{post.category || "No Cat"}]</span>
                            <h4 className="text-sm font-bold truncate tracking-tight">{post.title}</h4>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[11px] font-bold text-black">{post.price}</span>
                            {post.isSoldOut && (
                              <span className="bg-red-50 text-red-500 text-[8px] font-black uppercase px-1.5 py-0.5 rounded">Sold Out</span>
                            )}
                          </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => handleToggleStatus(post.id, post.status || "public")}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tighter transition-all border ${
                              post.status === "hidden" 
                                ? "bg-zinc-50 border-zinc-100 text-zinc-400" 
                                : "bg-green-50 border-green-100 text-green-600"
                            }`}
                          >
                            {post.status === "hidden" ? "Hidden" : "Public"}
                          </button>

                          <button 
                            onClick={() => handleToggleSoldOut(post.id, !!post.isSoldOut)}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tighter transition-all border ${
                              post.isSoldOut 
                                ? "bg-red-50 border-red-100 text-red-600" 
                                : "bg-white border-zinc-200 text-zinc-400 hover:border-black hover:text-black"
                            }`}
                          >
                            {post.isSoldOut ? "Restore" : "Sold Out"}
                          </button>
                        </div>

                        {/* Edit/Delete Icons */}
                        <div className="flex items-center gap-1 pl-4 border-l border-zinc-100">
                          <button 
                            onClick={() => startEdit(post)}
                            className="p-2 text-zinc-400 hover:text-black hover:bg-zinc-100 rounded-lg transition-all"
                            title="Edit"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => handleDelete(post.id)}
                            className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </Reorder.Item>
                    ))}
                  </Reorder.Group>
                  
                  {posts.length === 0 && (
                      <div className="text-center py-32 bg-zinc-50 border-2 border-dashed border-zinc-200 rounded-[40px] flex flex-col items-center">
                        <p className="text-zinc-400 text-sm font-medium mb-6">데이터가 없습니다.<br />새로운 마스터클래스를 등록해보세요.</p>
                        <div className="flex gap-3">
                          <button 
                            onClick={() => setActiveTab("register")}
                            className="bg-black text-white px-8 py-3 rounded-full text-xs font-bold hover:bg-zinc-800 transition-all"
                          >
                            New Class
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
                        {editingCategory === cat.id ? (
                          <input 
                            autoFocus
                            defaultValue={cat.name}
                            onBlur={(e) => handleUpdateCategory(cat.id, e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleUpdateCategory(cat.id, e.currentTarget.value);
                              if (e.key === 'Escape') setEditingCategory(null);
                            }}
                            className="w-full bg-transparent border-none p-0 text-sm font-bold focus:ring-0"
                          />
                        ) : (
                          <span 
                            onClick={() => setEditingCategory(cat.id)}
                            className="font-bold text-sm cursor-pointer hover:text-blue-600 transition-colors"
                          >
                            {cat.name}
                          </span>
                        )}
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-2">Notice Title</label>
                        <input 
                          type="text" 
                          value={newNotice.title}
                          onChange={e => setNewNotice({...newNotice, title: e.target.value})}
                          placeholder="공지 또는 배너 제목"
                          className="w-full p-4 bg-white border border-zinc-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-black/5"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-2">Redirect URL (Optional)</label>
                        <input 
                          type="text" 
                          value={newNotice.url}
                          onChange={e => setNewNotice({...newNotice, url: e.target.value})}
                          placeholder="https://smartstore.naver.com/..."
                          className="w-full p-4 bg-white border border-zinc-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-black/5"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="flex-1">
                        <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-2">Content</label>
                        <textarea 
                          value={newNotice.content}
                          onChange={e => setNewNotice({...newNotice, content: e.target.value})}
                          placeholder="상세 내용을 입력하세요"
                          rows={2}
                          className="w-full p-4 bg-white border border-zinc-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-black/5"
                        />
                      </div>
                      <div className="flex flex-col items-center justify-center p-6 bg-white rounded-2xl border border-zinc-100 min-w-[140px]">
                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-3 block text-center">Update Grid</label>
                        <button 
                          type="button"
                          onClick={() => setNewNotice({...newNotice, isBanner: !newNotice.isBanner})}
                          className={`w-12 h-6 rounded-full relative transition-colors ${newNotice.isBanner ? 'bg-black' : 'bg-zinc-200'}`}
                        >
                          <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${newNotice.isBanner ? 'left-7' : 'left-1'}`} />
                        </button>
                        <span className="text-[9px] font-bold mt-2 text-zinc-400">Mark as 'Banner'</span>
                      </div>
                    </div>
                    
                    <button 
                      type="submit"
                      className="bg-black text-white px-10 py-4 rounded-2xl font-black text-sm hover:bg-zinc-800 transition-all active:scale-95 flex items-center gap-2"
                    >
                      <Plus size={18} />
                      Publish Item
                    </button>
                  </form>

                  <div className="space-y-4">
                    {notices.map(notice => (
                      <div key={notice.id} className="p-6 bg-white border border-zinc-200 rounded-[32px] flex items-center gap-6 group hover:border-black/20 transition-all">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${notice.isBanner ? 'bg-amber-100 text-amber-600' : 'bg-zinc-100 text-zinc-400'}`}>
                          {notice.isBanner ? <Tag size={20} /> : <Megaphone size={20} />}
                        </div>
                        <div className="flex-grow min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            {notice.isBanner && <span className="text-[9px] font-black uppercase tracking-widest bg-amber-200 text-amber-800 px-2 py-0.5 rounded">Banner</span>}
                            <h4 className="font-bold text-base truncate">{notice.title}</h4>
                          </div>
                          <p className="text-sm text-zinc-400 font-medium line-clamp-1">{notice.content}</p>
                          {notice.url && <p className="text-[10px] text-zinc-300 font-mono truncate mt-1">{notice.url}</p>}
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
                            className="p-3 text-zinc-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
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
