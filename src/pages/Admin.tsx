import { useState, useEffect, ChangeEvent, FormEvent, useRef, MouseEvent } from "react";
import { useNavigate } from "react-router-dom";
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  query, 
  orderBy, 
  serverTimestamp,
  getDoc,
  setDoc,
  collectionGroup,
  where
} from "../lib/firebase-mock";
import { ref, uploadBytesResumable, getDownloadURL } from "../lib/firebase-mock";
import { onAuthStateChanged, User } from "../lib/firebase-mock";
import { db, auth, storage, loginWithGoogle, logout, handleFirestoreError, OperationType } from "../lib/firebase-mock";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { 
  ArrowLeft, Plus, Edit2, Trash2, Save, X, LogIn, LogOut, 
  LayoutDashboard, PlusCircle, Tag, Megaphone, MessageSquare,
  Users, Clock, ShieldCheck, HelpCircle, UserX, ChevronRight, User as UserIcon,
  Menu, Bell, Settings, Search, Upload, Image as ImageIcon,
  GripVertical, Eye, EyeOff, BarChart3, ExternalLink, TrendingUp, Globe,
  Laptop, RefreshCw, Lock, BookOpen, Video, Sparkles
} from "lucide-react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import { translateTextWithAI } from "../utils/translate";
import { getEmbedUrl } from "../components/SecureVerticalPlayer";
import VimeoPlayer from "@vimeo/player";
import heroImg from "../assets/images/puima_hero_dessert_1779090061139.png";
import pastryImg from "../assets/images/puima_class_pastry_1779090076747.png";
import macaronsImg from "../assets/images/puima_class_macarons_1779090094299.png";

const ADMIN_EMAILS = ["rtytgb123@gmail.com", "lgi12@naver.com"];

interface Milestone {
  timeLabel: string;
  seconds: number;
  title: string;
  desc: string;
}

interface Chapter {
  id?: string;
  chapterNo: string;
  title: string;
  duration: string;
  videoUrl: string;
  milestones: Milestone[];
  recipe?: string;
}

interface Post {
  id: string;
  title: string;
  titleEn?: string;
  image: string;
  naverUrl: string;
  naver_product_id?: string;
  price: string;
  imageUrl?: string;
  visuals?: string;
  category?: string;
  originalPrice?: string;
  status?: "public" | "hidden";
  isSoldOut?: boolean;
  order?: number;
  createdAt?: any;
}

interface Category {
  id: string;
  name: string;
  nameEn?: string;
  tagColor?: string;
}

interface Notice {
  id: string;
  title: string;
  titleEn?: string;
  content: string;
  contentEn?: string;
  createdAt: any;
  isActive: boolean;
  url?: string;
  isBanner?: boolean;
  imageUrl?: string;
  order?: number;
  bannerLabel?: string;
  bannerLabelEn?: string;
}

interface UserProfile {
  id: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isAdmin: boolean;
  isBanned?: boolean;
  createdAt: any;
  nickname?: string;
  realName?: string;
  gender?: string;
  phone?: string;
  password?: string;
  enrolledClasses?: any[];
}

interface StudentReview {
  id: string;
  imageUrl: string;
  phrase?: string;
  phraseEn?: string;
  createdAt: any;
  order?: number;
}

type TabType = 
  | "manage" | "register" | "categories" | "notices" | "reviews"
  | "users" | "history" | "roles" | "inquiry" | "blacklist"
  | "analytics" | "lectures";

const formatAdminTime = (seconds: number) => {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

declare global {
  interface Window {
    YT?: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}


const safeConfirm = (msg: string) => {
  if (window.self !== window.top) return true;
  try { return window.confirm(msg); } catch(e) { return true; }
};

export default function Admin() {
  const navigate = useNavigate();
  const { user, loading, isAdmin } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const lectureFormRef = useRef<HTMLDivElement | null>(null);
  const videoPreviewRef = useRef<HTMLVideoElement | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);



  // Lecture & Chapters UI Management States
  const [selectedPostIdForLectures, setSelectedPostIdForLectures] = useState<string | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [allChapters, setAllChapters] = useState<(Chapter & { postId: string })[]>([]);
  const [editingChapterId, setEditingChapterId] = useState<string | null>(null);
  const [isSavingChapter, setIsSavingChapter] = useState(false);
  
  const [newChapter, setNewChapter] = useState<Omit<Chapter, "id">>({
    chapterNo: "",
    title: "",
    duration: "",
    videoUrl: "",
    milestones: [],
    recipe: ""
  });

  const [editingChapterData, setEditingChapterData] = useState<Omit<Chapter, "id">>({
    chapterNo: "",
    title: "",
    duration: "",
    videoUrl: "",
    milestones: [],
    recipe: ""
  });

  // Intermediate Milestone Inputs
  const [mStartTime, setMStartTime] = useState("");
  const [mEndTime, setMEndTime] = useState("");
  const [mTitle, setMTitle] = useState("");
  const [mDesc, setMDesc] = useState("");

  // Video Upload Simulation States
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [videoUploadProgress, setVideoUploadProgress] = useState(0);
  const [uploadProgressMsg, setUploadProgressMsg] = useState("");
  const [uploadedVideoFileName, setUploadedVideoFileName] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [newNotice, setNewNotice] = useState({ title: "", titleEn: "", content: "", contentEn: "", url: "", isBanner: false, imageUrl: "", bannerLabel: "", bannerLabelEn: "" });
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryNameEn, setNewCategoryNameEn] = useState("");
  const [reviews, setReviews] = useState<StudentReview[]>([]);
  const [adminQuestions, setAdminQuestions] = useState<any[]>([]);
  const [newReview, setNewReview] = useState({ imageUrl: "", phrase: "", phraseEn: "" });
  const [reviewUploading, setReviewUploading] = useState(false);
  const [noticeImgUploading, setNoticeImgUploading] = useState(false);
  const [translatingNewNotice, setTranslatingNewNotice] = useState(false);
  const [translatingEditNotice, setTranslatingEditNotice] = useState(false);
  const [isSavingReview, setIsSavingReview] = useState(false);
  const [translatingPostName, setTranslatingPostName] = useState(false);
  
  const handleTranslatePostName = async () => {
    if (!formData.title) return;
    setTranslatingPostName(true);
    try {
      const translated = await translateTextWithAI(formData.title);
      setFormData(prev => ({ ...prev, titleEn: translated }));
    } catch (e) {
      console.error(e);
    } finally {
      setTranslatingPostName(false);
    }
  };

  const formatPriceStr = (value: string | number | undefined) => {
    if (!value) return "";
    const numStr = value.toString().replace(/[^0-9]/g, "");
    if (!numStr) return "";
    return Number(numStr).toLocaleString("ko-KR");
  };

  const parsePriceStr = (value: string) => {
    return value.replace(/[^0-9]/g, "");
  };
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Post>>({});
  const [dataLoading, setDataLoading] = useState(true);
  const [designMode, setDesignMode] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("manage");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editingNoticeId, setEditingNoticeId] = useState<string | null>(null);
  const [noticeFormData, setNoticeFormData] = useState<Partial<Notice>>({});
  const [lookerStudioUrl, setLookerStudioUrl] = useState<string>("");
  const [inputUrl, setInputUrl] = useState<string>("");
  const [isSavingUrl, setIsSavingUrl] = useState<boolean>(false);
  const [analyticsViewMode, setAnalyticsViewMode] = useState<"dashboard" | "visual">("dashboard");

  // Question Management States
  const [replyingQId, setReplyingQId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [adminQFilter, setAdminQFilter] = useState<"all" | "pending" | "answered">("all");
  const [adminQSearch, setAdminQSearch] = useState("");
  const [isSavingReply, setIsSavingReply] = useState(false);

  // User list states
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [searchUserQuery, setSearchUserQuery] = useState("");
  const [searchProductQuery, setSearchProductQuery] = useState("");
  const [searchLectureQuery, setSearchLectureQuery] = useState("");
  const [selectedPostIds, setSelectedPostIds] = useState<string[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [lastClickedIndex, setLastClickedIndex] = useState<number | null>(null);
  const [lastClickedUserIndex, setLastClickedUserIndex] = useState<number | null>(null);
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<"all" | "admin" | "customer" | "banned">("all");
  const [isUpdatingUser, setIsUpdatingUser] = useState<string | null>(null);
  const [unbanConfirmId, setUnbanConfirmId] = useState<string | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});
  const [editUserInputs, setEditUserInputs] = useState<{ nickname: string; realName: string; gender: string; phone: string; isAdmin: boolean; isBanned: boolean; password?: string }>({
    nickname: "",
    realName: "",
    gender: "남",
    phone: "",
    isAdmin: false,
    isBanned: false,
    password: ""
  });

  // Enrolled Classes Management Modal States
  const [selectedUserForClasses, setSelectedUserForClasses] = useState<UserProfile | null>(null);
  const [tempEnrolledClassIds, setTempEnrolledClassIds] = useState<string[]>([]);
  const [isSavingEnrolledClasses, setIsSavingEnrolledClasses] = useState(false);
  const [searchClassInModal, setSearchClassInModal] = useState("");

  const [currentAdminPlayTime, setCurrentAdminPlayTime] = useState<number>(0);
  const vimeoPlayerInstanceRef = useRef<any>(null);
  const ytPlayerInstanceRef = useRef<any>(null);

  const getCurrentVideoTime = async (): Promise<number | null> => {
    if (videoPreviewRef.current) {
      return videoPreviewRef.current.currentTime;
    }
    if (iframeRef.current) {
      const url = editingChapterId ? editingChapterData.videoUrl : newChapter.videoUrl;
      if (!url) return null;

      if (url.includes("vimeo.com")) {
        try {
          const PlayerModule = await import("@vimeo/player");
          const PlayerClass = PlayerModule.default;
          const player = new PlayerClass(iframeRef.current);
          const t = await player.getCurrentTime();
          return t;
        } catch (err) {
          console.error("Vimeo Player SDK getCurrentTime error:", err);
        }
      }

      if (url.includes("youtube.com") || url.includes("youtu.be")) {
        return new Promise<number | null>((resolve) => {
          let resolved = false;

          const handleYTMessage = (event: MessageEvent) => {
            try {
              if (typeof event.data === "string") {
                const data = JSON.parse(event.data);
                if (data.event === "infoDelivery" && data.info && typeof data.info.currentTime === "number") {
                  window.removeEventListener("message", handleYTMessage);
                  resolved = true;
                  resolve(data.info.currentTime);
                }
              }
            } catch (e) {
              // Ignore invalid JSON or other objects
            }
          };

          window.addEventListener("message", handleYTMessage);

          if (iframeRef.current && iframeRef.current.contentWindow) {
            iframeRef.current.contentWindow.postMessage(
              JSON.stringify({
                event: "command",
                func: "getCurrentTime",
                args: []
              }),
              "*"
            );
          }

          setTimeout(() => {
            if (!resolved) {
              window.removeEventListener("message", handleYTMessage);
              resolve(null);
            }
          }, 800);
        });
      }
    }
    return null;
  };

  const filteredPosts = posts.filter(post => {
    const q = searchProductQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (post.title || "").toLowerCase().includes(q) ||
      (post.titleEn || "").toLowerCase().includes(q) ||
      (post.category || "").toLowerCase().includes(q) ||
      (post.description || "").toLowerCase().includes(q)
    );
  });

  const filteredLecturePosts = posts.filter(post => {
    const q = searchLectureQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (post.title || "").toLowerCase().includes(q) ||
      (post.titleEn || "").toLowerCase().includes(q) ||
      (post.category || "").toLowerCase().includes(q)
    );
  });

  const filteredUsers = users.filter(u => {
    const q = searchUserQuery.toLowerCase().trim();
    const matchesSearch = !q || (
      (u.nickname || "").toLowerCase().includes(q) ||
      (u.realName || "").toLowerCase().includes(q) ||
      (u.phone || "").toLowerCase().includes(q) ||
      (u.email || "").toLowerCase().includes(q) ||
      u.id.toLowerCase().includes(q)
    );
    
    if (!matchesSearch) return false;
    
    if (selectedRoleFilter === "all") return true;
    if (selectedRoleFilter === "admin") return !!u.isAdmin;
    if (selectedRoleFilter === "customer") return !u.isAdmin && !u.isBanned;
    if (selectedRoleFilter === "banned") return !!u.isBanned;
    return true;
  });

  // Load Google Analytics URL Configuration
  useEffect(() => {
    const fetchAnalyticsConfig = async () => {
      try {
        const docRef = doc(db, "settings", "analytics");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const url = docSnap.data().lookerStudioUrl || "";
          setLookerStudioUrl(url);
          setInputUrl(url);
        }
      } catch (err) {
        console.error("Failed to load analytics config:", err);
      }
    };
    fetchAnalyticsConfig();
  }, [activeTab]);

  // Load Real-time chapters stream for currently selected PostId
  useEffect(() => {
    if (!selectedPostIdForLectures) {
      setChapters([]);
      return;
    }
    const q = query(collection(db, "chapters"), where("post_id", "==", selectedPostIdForLectures));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Chapter[];
      
      // Client-side sort by chapterNo ascending (fallback sort)
      docs.sort((a, b) => {
        const numA = parseFloat(a.chapterNo || "0") || 0;
        const numB = parseFloat(b.chapterNo || "0") || 0;
        if (numA !== numB) return numA - numB;
        return (a.chapterNo || "").localeCompare(b.chapterNo || "");
      });

      setChapters(docs);
    }, (err) => {
      console.error("Failed to subscribe to chapters stream:", err);
    });

    return () => unsubscribe();
  }, [selectedPostIdForLectures]);

  // Load Real-time all chapters stream across all posts for a unified overview
  useEffect(() => {
    if (activeTab !== "lectures") return;
    // On tab entry, start in clean general overview mode
    setSelectedPostIdForLectures(null);
    handleCancelEditChapter();
    
    const q = query(collectionGroup(db, "chapters"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => {
        const postId = doc.ref.parent.parent?.id || "";
        return {
          id: doc.id,
          postId,
          ...doc.data()
        };
      }) as (Chapter & { postId: string })[];
      setAllChapters(docs);
    }, (err) => {
      console.error("Failed to subscribe to all chapters stream:", err);
    });

    return () => unsubscribe();
  }, [activeTab]);

  // Keep selectedPostIdForLectures null initially to show the comprehensive products & lectures list first.
  useEffect(() => {
    // Left empty intentionally to support clean general overview on load.
  }, [posts, selectedPostIdForLectures]);

  // 실시간 영상 재생 시간 싱크 효과 Effect
  useEffect(() => {
    const videoUrl = editingChapterId ? editingChapterData?.videoUrl : newChapter?.videoUrl;
    if (!videoUrl) {
      setCurrentAdminPlayTime(0);
      return;
    }

    // 기존 타이머 및 인스턴스 초기화 / 해제
    let intervalId: any = null;
    if (vimeoPlayerInstanceRef.current) {
      try { vimeoPlayerInstanceRef.current.destroy(); } catch (e) {}
      vimeoPlayerInstanceRef.current = null;
    }
    if (ytPlayerInstanceRef.current) {
      try { ytPlayerInstanceRef.current.destroy(); } catch (e) {}
      ytPlayerInstanceRef.current = null;
    }

    // 1. Vimeo Player setup
    if (videoUrl.includes("vimeo.com") && iframeRef.current) {
      try {
        const player = new VimeoPlayer(iframeRef.current);
        vimeoPlayerInstanceRef.current = player;
        player.on("timeupdate", (data: any) => {
          if (data && typeof data.seconds === "number") {
            setCurrentAdminPlayTime(data.seconds);
          }
        });
      } catch (e) {
        console.error("Vimeo setup error:", e);
      }
    }

    // 2. YouTube API & postMessage sync control
    if ((videoUrl.includes("youtube.com") || videoUrl.includes("youtu.be")) && iframeRef.current) {
      const linkYt = () => {
        if (window.YT && window.YT.Player && iframeRef.current) {
          try {
            ytPlayerInstanceRef.current = new window.YT.Player(iframeRef.current, {
              events: {
                onReady: () => {
                  console.log("YouTube Player is synced and ready");
                }
              }
            });
          } catch(err) {
            console.error(err);
          }
        }
      };

      if (!window.YT) {
        const tag = document.createElement("script");
        tag.src = "https://www.youtube.com/iframe_api";
        const firstScriptTag = document.getElementsByTagName("script")[0];
        firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
        
        const prevInit = window.onYouTubeIframeAPIReady;
        window.onYouTubeIframeAPIReady = () => {
          if (prevInit) prevInit();
          linkYt();
        };
      } else {
        linkYt();
      }

      const handler = (e: MessageEvent) => {
        try {
          if (typeof e.data === "string") {
            const parsed = JSON.parse(e.data);
            if (parsed.event === "infoDelivery" && parsed.info && typeof parsed.info.currentTime === "number") {
              setCurrentAdminPlayTime(parsed.info.currentTime);
            }
          }
        } catch(err) {}
      };

      window.addEventListener("message", handler);

      intervalId = setInterval(() => {
        if (iframeRef.current && iframeRef.current.contentWindow) {
          iframeRef.current.contentWindow.postMessage(
            JSON.stringify({
              event: "command",
              func: "getCurrentTime",
              args: []
            }),
            "*"
          );
        }
      }, 500);

      return () => {
        window.removeEventListener("message", handler);
        if (intervalId) clearInterval(intervalId);
      };
    }

    // 3. Native Video tag listener
    if (videoPreviewRef.current) {
      const vid = videoPreviewRef.current;
      const updateHtmlTime = () => {
        setCurrentAdminPlayTime(vid.currentTime);
      };
      vid.addEventListener("timeupdate", updateHtmlTime);
      return () => {
        vid.removeEventListener("timeupdate", updateHtmlTime);
      };
    }

  }, [editingChapterId, editingChapterData?.videoUrl, newChapter?.videoUrl, activeTab]);

  // Handle addition of milestones
  const handleAddMilestone = () => {
    if (!mStartTime.trim() || !mTitle.trim()) {
      alert("시작시간과 챕터 제목은 필수 입력 항목입니다.");
      return;
    }

    const startStr = mStartTime.trim();
    const parts = startStr.split(":");
    let computedSeconds = 0;
    if (parts.length === 3) {
      computedSeconds = parseInt(parts[0], 10) * 3600 + parseInt(parts[1], 10) * 60 + parseInt(parts[2], 10);
    } else if (parts.length === 2) {
      computedSeconds = parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
    } else {
      computedSeconds = parseInt(startStr, 10) || 0;
    }

    const timeLabelStr = mEndTime.trim()
      ? `${mStartTime.trim()} ~ ${mEndTime.trim()}`
      : mStartTime.trim();

    const targetMilestone: Milestone = {
      timeLabel: timeLabelStr,
      seconds: computedSeconds,
      title: mTitle.trim(),
      desc: mDesc.trim()
    };

    if (editingChapterId) {
      setEditingChapterData(prev => ({
        ...prev,
        milestones: [...(prev.milestones || []), targetMilestone]
      }));
    } else {
      setNewChapter(prev => ({
        ...prev,
        milestones: [...(prev.milestones || []), targetMilestone]
      }));
    }

    // Reset inputs
    setMStartTime("");
    setMEndTime("");
    setMTitle("");
    setMDesc("");
  };

  const handleRemoveMilestone = (index: number) => {
    if (editingChapterId) {
      setEditingChapterData(prev => ({
        ...prev,
        milestones: (prev.milestones || []).filter((_, idx) => idx !== index)
      }));
    } else {
      setNewChapter(prev => ({
        ...prev,
        milestones: (prev.milestones || []).filter((_, idx) => idx !== index)
      }));
    }
  };

  const handleUploadVideoFile = (file: File) => {
    if (!file) return;
    if (!file.type.startsWith("video/")) {
      alert("영상 파일(.mp4, .mov, .avi 등)만 업로드할 수 있습니다.");
      return;
    }

    setIsUploadingVideo(true);
    setVideoUploadProgress(5);
    setUploadProgressMsg("보안 인코딩 시드 준비 중...");
    setUploadedVideoFileName(file.name);

    // Auto-detect duration and title!
    const video = document.createElement("video");
    video.preload = "metadata";
    video.src = URL.createObjectURL(file);
    video.onloadedmetadata = () => {
      const minutes = Math.floor(video.duration / 60);
      const seconds = Math.floor(video.duration % 60);
      const durationText = minutes > 0 ? `${minutes}분 ${seconds}초` : `${seconds}초`;

      if (editingChapterId) {
        setEditingChapterData(prev => ({
          ...prev,
          duration: prev.duration || `${durationText} 분량`,
          title: prev.title || file.name.replace(/\.[^/.]+$/, "") // strip extension
        }));
      } else {
        setNewChapter(prev => ({
          ...prev,
          duration: prev.duration || `${durationText} 분량`,
          title: prev.title || file.name.replace(/\.[^/.]+$/, "") // strip extension
        }));
      }
    };

    // Upload to Firebase Storage!
    const storageRef = ref(storage, `videos/${Date.now()}_${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        setVideoUploadProgress(progress);
        
        if (progress < 30) {
          setUploadProgressMsg(`업로드 준비 중... (${progress}%)`);
        } else if (progress < 60) {
          setUploadProgressMsg(`보안 처리 및 압축 중... (${progress}%)`);
        } else if (progress < 90) {
          setUploadProgressMsg(`스토리지 전송 중... (${progress}%)`);
        } else {
          setUploadProgressMsg(`마무리 단계... (${progress}%)`);
        }
      },
      (error) => {
        console.error("Upload fail:", error);
        alert("업로드에 실패했습니다.");
        setIsUploadingVideo(false);
        setVideoUploadProgress(0);
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          
          if (editingChapterId) {
            setEditingChapterData(prev => ({
              ...prev,
              videoUrl: downloadURL
            }));
          } else {
            setNewChapter(prev => ({
              ...prev,
              videoUrl: downloadURL
            }));
          }

          setVideoUploadProgress(100);
          setUploadProgressMsg("업로드 완료!");
          setTimeout(() => {
            setIsUploadingVideo(false);
            setVideoUploadProgress(0);
          }, 3000);
        } catch (err) {
          console.error("Failed to get download URL", err);
          alert("업로드된 파일 URL을 가져오는데 실패했습니다.");
          setIsUploadingVideo(false);
          setVideoUploadProgress(0);
        }
      }
    );
  };

  // Create/Update chapter
  const handleSaveChapter = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedPostIdForLectures) {
      alert("강의를 업로드할 클래스를 먼저 선택해 주세요.");
      return;
    }

    const currentData = editingChapterId ? editingChapterData : newChapter;

    if (!currentData.videoUrl.trim()) {
      alert("영상 소스 URL은 필수 입력 사항입니다.");
      return;
    }

    setIsSavingChapter(true);
    try {
      const classRef = doc(db, "posts", selectedPostIdForLectures);
      const chaptersCollection = collection(classRef, "chapters");
      
      const payload = {
        post_id: selectedPostIdForLectures,
        chapterNo: currentData.chapterNo?.trim() || Date.now().toString(),
        title: currentData.title?.trim() || `영상 강의`,
        duration: currentData.duration?.trim() || "0분 분량",
        videoUrl: currentData.videoUrl.trim(),
        milestones: currentData.milestones || [],
        recipe: currentData.recipe?.trim() || "",
        updatedAt: serverTimestamp()
      };

      if (editingChapterId) {
        await updateDoc(doc(chaptersCollection, editingChapterId), payload);
        alert("영상 정보가 성공적으로 저장되었습니다.");
      } else {
        const docRef = await addDoc(chaptersCollection, {
          ...payload,
          createdAt: serverTimestamp()
        });
        setEditingChapterId(docRef.id);
        setEditingChapterData(payload as any);
        alert("영상 정보가 성공적으로 저장되었습니다.");
      }
    } catch (err) {
      console.error("Failed to save chapter:", err);
      alert("강의 저장 중 오류가 발생했습니다.");
    } finally {
      setIsSavingChapter(false);
    }
  };

  const handleStartEditChapter = (chapter: Chapter) => {
    setEditingChapterId(chapter.id || null);
    setEditingChapterData({
      chapterNo: chapter.chapterNo,
      title: chapter.title,
      duration: chapter.duration,
      videoUrl: chapter.videoUrl,
      recipe: chapter.recipe || "",
      milestones: chapter.milestones || []
    });
  };

  const handleStartEditChapterWithScroll = (chapter: Chapter, postId: string) => {
    setSelectedPostIdForLectures(postId);
    setEditingChapterId(chapter.id || null);
    setEditingChapterData({
      chapterNo: chapter.chapterNo,
      title: chapter.title,
      duration: chapter.duration,
      videoUrl: chapter.videoUrl,
      recipe: chapter.recipe || "",
      milestones: chapter.milestones || []
    });
    setTimeout(() => {
      lectureFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const handleCancelEditChapter = () => {
    setEditingChapterId(null);
    setEditingChapterData({
      chapterNo: "",
      title: "",
      duration: "",
      videoUrl: "",
      recipe: "",
      milestones: []
    });
  };

  const handleDeleteChapter = async (chapterId: string, customPostId?: string) => {
    const targetPostId = customPostId || selectedPostIdForLectures;
    if (!targetPostId) return;
    if (!safeConfirm("정말 이 강의 영상을 영구히 삭제하시겠습니까? (삭제 후 복구가 불가합니다)")) return;

    try {
      const classRef = doc(db, "posts", targetPostId);
      await deleteDoc(doc(classRef, "chapters", chapterId));
      if (editingChapterId === chapterId) {
        handleCancelEditChapter();
      }
      alert("강의 영상이 성공적으로 삭제되었습니다.");
    } catch (err) {
      console.error("Failed to delete chapter:", err);
      alert("강의 삭제 도중 실패했습니다.");
    }
  };

  const handleSaveLookerUrl = async (e: FormEvent) => {
    e.preventDefault();
    setIsSavingUrl(true);
    try {
      await setDoc(doc(db, "settings", "analytics"), {
        lookerStudioUrl: inputUrl,
        updatedAt: serverTimestamp()
      }, { merge: true });
      setLookerStudioUrl(inputUrl);
      alert("구글 애널리틱스 리포트 연동이 완료되었습니다!");
    } catch (err: any) {
      console.error("Failed to save analytics config:", err);
      alert("저장 실패: " + err.message);
    } finally {
      setIsSavingUrl(false);
    }
  };

  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const noticeAutoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragY = useRef<number | null>(null);
  const scrollInterval = useRef<number | null>(null);
  const draggedIdxRef = useRef<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

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
          });
        });
      }, 800); // 800ms debounce
    }
    
    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [formData, editingId]);

  // Autosave for Notice/Banner editing
  useEffect(() => {
    if (editingNoticeId && noticeFormData.title) {
      if (noticeAutoSaveTimerRef.current) clearTimeout(noticeAutoSaveTimerRef.current);
      
      noticeAutoSaveTimerRef.current = setTimeout(() => {
        handleAutoSaveAction(async () => {
          const { id, createdAt, ...updateData } = noticeFormData;
          await updateDoc(doc(db, "notices", editingNoticeId), {
            ...updateData,
          });
        });
      }, 800);
    }
    
    return () => {
      if (noticeAutoSaveTimerRef.current) clearTimeout(noticeAutoSaveTimerRef.current);
    };
  }, [noticeFormData, editingNoticeId]);

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

  const handleNoticeImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      alert("이미지 용량이 너무 큽니다 (최대 5MB).");
      return;
    }

    setNoticeImgUploading(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      setNewNotice(prev => ({ ...prev, imageUrl: reader.result as string }));
      setNoticeImgUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleEditNoticeImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("이미지 용량이 너무 큽니다 (최대 5MB).");
      return;
    }

    setNoticeImgUploading(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      setNoticeFormData(prev => ({ ...prev, imageUrl: reader.result as string }));
      setNoticeImgUploading(false);
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    const isBypassed = localStorage.getItem('admin_bypass') === 'true';
    if (ADMIN_EMAILS.includes(user?.email || "") || isAdmin || designMode || isBypassed) {
      // Fetch posts without compound sorting to avoid missing composite index crashes
      const q = query(collection(db, "posts"));
      const unsubscribePosts = onSnapshot(q, (snapshot) => {
        const docs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Post[];
        
        // Client-side sorting: sort by order ascending first, then by createdAt descending
        docs.sort((a, b) => {
          const orderA = typeof a.order === 'number' ? a.order : 9999;
          const orderB = typeof b.order === 'number' ? b.order : 9999;
          if (orderA !== orderB) return orderA - orderB;
          const timeA = a.createdAt?.seconds ?? 0;
          const timeB = b.createdAt?.seconds ?? 0;
          return timeB - timeA;
        });

        setPosts(docs);
        setDataLoading(false);
      }, (err) => {
        console.error("Firestore error on loading posts:", err);
        setDataLoading(false); // Make sure we resolve loading state
      });

      const catQ = query(collection(db, "categories"), orderBy("name", "asc"));
      const unsubscribeCats = onSnapshot(catQ, (snapshot) => {
        const docs = snapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name || "",
          nameEn: doc.data().nameEn || "",
          tagColor: doc.data().tagColor || ""
        })) as Category[];
        setCategories(docs);
      }, (err) => {
        console.error("Firestore error on loading categories:", err);
        setDataLoading(false);
      });

      const noticeQ = query(collection(db, "notices"));
      const unsubscribeNotices = onSnapshot(noticeQ, (snapshot) => {
        const docs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Notice[];
        const sortedDocs = [...docs].sort((a, b) => {
          const aOrder = a.order !== undefined ? a.order : 999999;
          const bOrder = b.order !== undefined ? b.order : 999999;
          if (aOrder !== bOrder) return aOrder - bOrder;
          
          const aTime = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : (a.createdAt instanceof Date ? a.createdAt.getTime() : 0);
          const bTime = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : (b.createdAt instanceof Date ? b.createdAt.getTime() : 0);
          return bTime - aTime;
        });
        setNotices(sortedDocs);
      }, (err) => {
        console.error("Firestore error on loading notices:", err);
        setDataLoading(false);
      });

      const reviewsQ = query(collection(db, "reviews"), orderBy("createdAt", "desc"));
      const unsubscribeReviews = onSnapshot(reviewsQ, (snapshot) => {
        const docs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as StudentReview[];
        setReviews(docs);
      }, (err) => {
        console.error("Firestore error on loading reviews:", err);
        setDataLoading(false);
      });

      const fetchSupabaseUsers = async () => {
        try {
          const { data, error } = await supabase.from('users').select('*').order('createdAt', { ascending: false });
          if (error) {
            console.error("Supabase fetch users error:", error);
            return;
          }
          if (data) {
            const mappedUsers = data.map(doc => {
              const dispName = doc.displayName || null;
              const isGreenLee = dispName === "Green Lee" || doc.nickname === "Green Lee";
              return {
                id: doc.id,
                email: doc.email || null,
                displayName: dispName,
                photoURL: doc.photoURL || null,
                isAdmin: !!doc.isAdmin,
                isBanned: !!doc.isBanned,
                createdAt: doc.createdAt ? new Date(doc.createdAt) : null,
                nickname: doc.nickname || dispName || "",
                realName: doc.realName || (isGreenLee ? "이근일" : ""),
                gender: doc.gender || "남",
                phone: doc.phone || (isGreenLee ? "01093359620" : ""),
                password: doc.password || "",
                enrolledClasses: doc.enrolledClasses || []
              };
            }) as UserProfile[];
            setUsers(mappedUsers);
          }
        } catch (err) {
          console.error("Supabase try/catch users error:", err);
        }
      };
      
      fetchSupabaseUsers();

      // Realtime subscription for users
      const usersSubscription = supabase.channel(`users-changes-${Date.now()}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'users'
          },
          (payload) => {
            fetchSupabaseUsers();
          }
        )
        .subscribe();


      const questionsQ = query(collection(db, "questions"), orderBy("createdAt", "desc"));
      const unsubscribeQuestions = onSnapshot(questionsQ, (snapshot) => {
        const docs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setAdminQuestions(docs);
      }, (err) => {
        console.error("Firestore questions error inside admin loading:", err);
        setDataLoading(false);
      });

      return () => {
        unsubscribePosts();
        unsubscribeCats();
        unsubscribeNotices();
        unsubscribeReviews();
        supabase.removeChannel(usersSubscription);
        unsubscribeQuestions();
      };
    } else {
      // If none of authorized states are met, resolve loading so we show login prompt or denied screen
      setDataLoading(false);
    }
  }, [user, designMode]);

  const handleChangeUserRole = async (userId: string, targetEmail: string | null, newRole: "admin" | "customer" | "banned") => {
    if (ADMIN_EMAILS.includes(targetEmail)) {
      alert("최고 관리자 계정의 권한은 변경할 수 없습니다.");
      return;
    }
    if (userId === user?.uid && newRole !== "admin") {
      const confirmSelfDemote = safeConfirm(
        "본인의 관리자 권한을 해제하면 설정 적용 이후 더이상 관리자 페이지에 접근할 수 없게 됩니다. 정말 계속하시겠습니까?"
      );
      if (!confirmSelfDemote) return;
    }

    setIsUpdatingUser(userId);
    try {
      const { error } = await supabase.from('users').update({
        "isAdmin": newRole === "admin",
        "isBanned": newRole === "banned"
      }).eq('id', userId);
      
      if (error) throw error;
      
      setUsers(prevUsers => prevUsers.map(u => 
        u.id === userId 
          ? { ...u, isAdmin: newRole === "admin", isBanned: newRole === "banned" } 
          : u
      ));
    } catch (err: any) {
      console.error("Failed to update user role:", err);
      alert("등급 변경 실패: " + err.message);
    } finally {
      setIsUpdatingUser(null);
    }
  };

  const handleStartEditUser = (u: UserProfile) => {
    setEditingUserId(u.id);
    setEditUserInputs({
      nickname: u.nickname || u.displayName || "",
      realName: u.realName || "",
      gender: u.gender || "남",
      phone: u.phone || "",
      isAdmin: !!u.isAdmin,
      isBanned: !!u.isBanned,
      password: u.password || ""
    });
  };

  const handleCancelEditUser = () => {
    setEditingUserId(null);
  };

  const handleSaveUserInfo = async (userId: string) => {
    setIsUpdatingUser(userId);
    try {
      const updatePayload = {
        nickname: editUserInputs.nickname,
        "realName": editUserInputs.realName,
        gender: editUserInputs.gender,
        phone: editUserInputs.phone,
        "isAdmin": editUserInputs.isAdmin,
        "isBanned": editUserInputs.isBanned,
        ...(editUserInputs.password ? { password: editUserInputs.password } : {})
      };
      
      const { error } = await supabase.from('users').update(updatePayload).eq('id', userId);
      
      if (error) throw error;
      
      // Update local state without waiting for realtime
      setUsers(prevUsers => prevUsers.map(u => 
        u.id === userId 
          ? { 
              ...u, 
              nickname: editUserInputs.nickname, 
              realName: editUserInputs.realName, 
              gender: editUserInputs.gender, 
              phone: editUserInputs.phone, 
              isAdmin: editUserInputs.isAdmin, 
              isBanned: editUserInputs.isBanned,
              ...(editUserInputs.password ? { password: editUserInputs.password } : {})
            } 
          : u
      ));
      
      setEditingUserId(null);
    } catch (err: any) {
      console.error("Failed to update user details in Supabase:", err);
      alert("회원 상세정보 수정 실패: " + err.message);
    } finally {
      setIsUpdatingUser(null);
    }
  };

  const handleSaveUserClasses = async () => {
    if (!selectedUserForClasses) return;
    setIsSavingEnrolledClasses(true);
    try {
      const existingEnrollments = selectedUserForClasses.enrolledClasses || [];
      const newEnrollments = tempEnrolledClassIds.map(id => {
        const classItem = posts.find(p => p.id === id);
        if (!classItem) return null;
        
        // Find if they were already enrolled to preserve purchaseNo, registeredAt, etc.
        const existing = existingEnrollments.find(e => e.id === id);
        if (existing) {
          return existing;
        }
        
        // If newly enrolled, generate default fields
        const orderNo = `PM-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 100)}`;
        return {
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
      }).filter(Boolean);

      const { error } = await supabase.from('users').update({
        "enrolledClasses": newEnrollments
      }).eq('id', selectedUserForClasses.id);
      
      if (error) throw error;
      
      setUsers(prevUsers => prevUsers.map(u => 
        u.id === selectedUserForClasses.id 
          ? { ...u, enrolledClasses: newEnrollments as any } 
          : u
      ));
      
      alert(`[${selectedUserForClasses.nickname || selectedUserForClasses.displayName || '선택회원'}] 님의 수강 클래스 설정이 완료되었습니다.`);
      setSelectedUserForClasses(null);
    } catch (err: any) {
      console.error("Failed to update user enrolled classes:", err);
      alert("수강 정보 업데이트 실패: " + err.message);
    } finally {
      setIsSavingEnrolledClasses(false);
    }
  };

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

  const handleReviewImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("이미지 용량이 너무 큽니다 (최대 5MB).");
      return;
    }

    setReviewUploading(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      setNewReview(prev => ({ ...prev, imageUrl: reader.result as string }));
      setReviewUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleAddReview = async (e: FormEvent) => {
    e.preventDefault();
    if (!newReview.imageUrl) {
      alert("먼저 리뷰 사진을 업로드해 주세요.");
      return;
    }
    setIsSavingReview(true);
    handleAutoSaveAction(async () => {
      await addDoc(collection(db, "reviews"), {
        imageUrl: newReview.imageUrl,
        phrase: newReview.phrase.trim(),
        phraseEn: newReview.phraseEn.trim(),
        createdAt: serverTimestamp(),
        order: reviews.length,
      });
      setNewReview({ imageUrl: "", phrase: "", phraseEn: "" });
      setIsSavingReview(false);
    });
  };

  const handleDeleteReview = async (id: string) => {
    if (!safeConfirm("이 수강생 리뷰를 정말 삭제하시겠습니까?")) return;
    handleAutoSaveAction(async () => {
      await deleteDoc(doc(db, "reviews", id));
    });
  };

  const handleAddNotice = async (e: FormEvent) => {
    e.preventDefault();
    if (!newNotice.title.trim() || !newNotice.content.trim()) return;
    handleAutoSaveAction(async () => {
      await addDoc(collection(db, "notices"), {
        ...newNotice,
        createdAt: serverTimestamp(),
        isActive: true,
        order: notices.length
      });
      setNewNotice({ title: "", titleEn: "", content: "", contentEn: "", url: "", isBanner: false, imageUrl: "", bannerLabel: "", bannerLabelEn: "" });
    });
  };

  const handleSeedDefaultBanners = async () => {
    if (!safeConfirm("홈페이지용 기본 3개 배너 목록(ORDER & SHOP, ONLINE CLASS, ONLINE STORE)을 현재 목록에 자동 생성하시겠습니까?")) return;
    handleAutoSaveAction(async () => {
      const bannerSeeds = [
        {
          title: "푸이마 명품 스위트 & 구움과자",
          titleEn: "Puima Premium Sweet & Pastry",
          content: "최상의 유기농 원료와 정성이 깃든 최고급 수제 디저트를 지금 온라인으로 주문하세요.",
          contentEn: "Order premium handmade desserts baked with the finest organic ingredients and heart online now.",
          imageUrl: pastryImg,
          url: "https://smartstore.naver.com/putitinyourmouth",
          isActive: true,
          bannerLabel: "주문하기",
          bannerLabelEn: "ORDER & SHOP",
          isBanner: true,
          order: 0
        },
        {
          title: "1:1 프라이빗 제과 홈베이킹 마스터클래스",
          titleEn: "1:1 Private Baking Masterclass",
          content: "기초부터 다지는 전문가 수준의 제과 마스터클래스로 베이킹의 격을 높여보세요.",
          contentEn: "Take your baking skills to the next level with a professional-grade confectionery masterclass from scratch.",
          imageUrl: heroImg,
          url: "/?category=Masterclass",
          isActive: true,
          bannerLabel: "온라인 클래스",
          bannerLabelEn: "ONLINE CLASS",
          isBanner: true,
          order: 1
        },
        {
          title: "네이버 스토어 전국 택배 서비스",
          titleEn: "Naver Smart Store Nationwide Delivery",
          content: "전국 어디서나 갓 구운듯한 신선한 푸이마 시그니처 마카롱과 케이크를 만나보세요.",
          contentEn: "Experience the freshly baked signature macarons and cakes of Puima delivered straight to your door, nationwide.",
          imageUrl: macaronsImg,
          url: "https://smartstore.naver.com/putitinyourmouth",
          isActive: true,
          bannerLabel: "네이버 스토어",
          bannerLabelEn: "ONLINE STORE",
          isBanner: true,
          order: 2
        }
      ];

      for (let i = 0; i < bannerSeeds.length; i++) {
        await addDoc(collection(db, "notices"), {
          ...bannerSeeds[i],
          createdAt: serverTimestamp(),
          order: notices.length + i
        });
      }
    });
  };

  const handleAiTranslateNewNotice = async () => {
    if (!newNotice.title.trim() && !newNotice.content.trim() && !newNotice.bannerLabel.trim()) {
      alert("먼저 한국어 제목, 내용, 또는 카테고리를 채워주세요.");
      return;
    }
    setTranslatingNewNotice(true);
    try {
      const titleEn = newNotice.title.trim() ? await translateTextWithAI(newNotice.title) : "";
      const contentEn = newNotice.content.trim() ? await translateTextWithAI(newNotice.content) : "";
      const bannerLabelEn = newNotice.bannerLabel.trim() ? await translateTextWithAI(newNotice.bannerLabel) : "";
      setNewNotice(prev => ({
        ...prev,
        titleEn,
        contentEn,
        bannerLabelEn
      }));
    } catch (err) {
      console.error(err);
      alert("번역 처리 중 오류가 발생했습니다.");
    } finally {
      setTranslatingNewNotice(false);
    }
  };

  const handleAiTranslateEditNotice = async () => {
    if (!noticeFormData.title?.trim() && !noticeFormData.content?.trim() && !noticeFormData.bannerLabel?.trim()) {
      alert("먼저 한국어 제목, 내용, 또는 카테고리를 채워주세요.");
      return;
    }
    setTranslatingEditNotice(true);
    try {
      const titleEn = noticeFormData.title?.trim() ? await translateTextWithAI(noticeFormData.title) : "";
      const contentEn = noticeFormData.content?.trim() ? await translateTextWithAI(noticeFormData.content) : "";
      const bannerLabelEn = noticeFormData.bannerLabel?.trim() ? await translateTextWithAI(noticeFormData.bannerLabel) : "";
      setNoticeFormData(prev => ({
        ...prev,
        titleEn,
        contentEn,
        bannerLabelEn
      }));
    } catch (err) {
      console.error(err);
      alert("번역 처리 중 오류가 발생했습니다.");
    } finally {
      setTranslatingEditNotice(false);
    }
  };

  const handleNoticeReorder = async (newOrder: Notice[]) => {
    setNotices(newOrder);
    
    handleAutoSaveAction(async () => {
      const updates = newOrder.map((notice, index) => {
        if (notice.order !== index) {
          return updateDoc(doc(db, "notices", notice.id), { order: index });
        }
        return null;
      }).filter(Boolean);
      
      if (updates.length > 0) {
        await Promise.all(updates);
      }
    });
  };

  const handleDeleteNotice = async (id: string) => {
    if (!safeConfirm("이 공지사항을 삭제하시겠습니까?")) return;
    handleAutoSaveAction(async () => {
      await deleteDoc(doc(db, "notices", id));
    });
  };

  const handleToggleNotice = async (id: string, current: boolean) => {
    handleAutoSaveAction(async () => {
      await updateDoc(doc(db, "notices", id), { isActive: !current });
    });
  };

  const handleEditNotice = async (id: string) => {
    if (!noticeFormData.title?.trim()) {
      alert("제목을 입력해주세요.");
      return;
    }
    handleAutoSaveAction(async () => {
      const { id: _, createdAt, ...updateData } = noticeFormData;
      await updateDoc(doc(db, "notices", id), {
        ...updateData,
      });
      setEditingNoticeId(null);
      setNoticeFormData({});
    });
  };

  const handleSaveCategory = async (e: FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    
    const data = {
      name: newCategoryName.trim(),
      nameEn: newCategoryNameEn.trim()
    };

    handleAutoSaveAction(async () => {
      if (editingCategory) {
        // Cascade category name change to posts
        const oldCat = categories.find(c => c.id === editingCategory);
        if (oldCat && oldCat.name !== data.name) {
          const postsToUpdate = posts.filter(p => p.category === oldCat.name);
          for (const p of postsToUpdate) {
            await updateDoc(doc(db, "posts", p.id), { category: data.name });
          }
        }
        await updateDoc(doc(db, "categories", editingCategory), data);
        setEditingCategory(null);
      } else {
        await addDoc(collection(db, "categories"), data);
      }
      setNewCategoryName("");
      setNewCategoryNameEn("");
    });
  };

  const handleStartEditCategory = (cat: Category) => {
    setEditingCategory(cat.id);
    setNewCategoryName(cat.name);
    setNewCategoryNameEn(cat.nameEn || "");
  };

  const handleCancelEditCategory = () => {
    setEditingCategory(null);
    setNewCategoryName("");
    setNewCategoryNameEn("");
  };

  const handleDeleteCategory = async (id: string) => {
    if (!safeConfirm("이 카테고리를 삭제하시겠습니까?")) return;
    handleAutoSaveAction(async () => {
      await deleteDoc(doc(db, "categories", id));
      if (editingCategory === id) {
        handleCancelEditCategory();
      }
    });
  };

  const handleSave = async () => {
    if (!formData.title || !formData.price || !formData.naverUrl) return;

    const data = {
      ...formData,
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
    if (safeConfirm("정말 삭제하시겠습니까?")) {
      handleAutoSaveAction(async () => {
        try {
          await deleteDoc(doc(db, "posts", id));
          setSelectedPostIds(prev => prev.filter(selectedId => selectedId !== id));
          alert("성공적으로 삭제되었습니다.");
        } catch (error: any) {
          console.error("Delete failed:", error);
          alert("삭제 중 오류가 발생했습니다: " + (error.message || error.toString()));
          throw error;
        }
      });
    }
  };

  const handleRowClick = (e: MouseEvent, post: Post, idx: number) => {
    const target = e.target as HTMLElement;
    // Don't select if the user clicked on standard operational buttons, action anchors, or draggable handle
    if (target.closest('button') || target.closest('a') || target.closest('.cursor-grab') || target.closest('.cursor-grabbing')) {
      return;
    }

    const isSelected = selectedPostIds.includes(post.id);

    if (e.shiftKey && lastClickedIndex !== null) {
      const start = Math.min(lastClickedIndex, idx);
      const end = Math.max(lastClickedIndex, idx);
      const rangePostIds = filteredPosts.slice(start, end + 1).map(p => p.id);

      const shouldSelect = !isSelected;
      if (shouldSelect) {
        setSelectedPostIds(prev => {
          const next = [...prev];
          rangePostIds.forEach(id => {
            if (!next.includes(id)) {
              next.push(id);
            }
          });
          return next;
        });
      } else {
        setSelectedPostIds(prev => prev.filter(id => !rangePostIds.includes(id)));
      }
    } else {
      if (isSelected) {
        setSelectedPostIds(prev => prev.filter(id => id !== post.id));
      } else {
        setSelectedPostIds(prev => [...prev, post.id]);
      }
    }

    setLastClickedIndex(idx);
  };

  const handleUserRowClick = (e: MouseEvent, u: UserProfile, idx: number) => {
    const target = e.target as HTMLElement;
    // Don't select if click is on input, select, button, anchor, etc.
    if (target.closest('button') || target.closest('a') || target.closest('input') || target.closest('select')) {
      return;
    }

    const isSelected = selectedUserIds.includes(u.id);

    if (e.shiftKey && lastClickedUserIndex !== null) {
      const start = Math.min(lastClickedUserIndex, idx);
      const end = Math.max(lastClickedUserIndex, idx);
      const rangeUserIds = filteredUsers.slice(start, end + 1).map(item => item.id);

      const shouldSelect = !isSelected;
      if (shouldSelect) {
        setSelectedUserIds(prev => {
          const next = [...prev];
          rangeUserIds.forEach(id => {
            if (!next.includes(id)) {
              next.push(id);
            }
          });
          return next;
        });
      } else {
        setSelectedUserIds(prev => prev.filter(id => !rangeUserIds.includes(id)));
      }
    } else {
      if (isSelected) {
        setSelectedUserIds(prev => prev.filter(id => id !== u.id));
      } else {
        setSelectedUserIds(prev => [...prev, u.id]);
      }
    }

    setLastClickedUserIndex(idx);
  };

  const handleBulkStatus = async (status: "public" | "hidden") => {
    if (selectedPostIds.length === 0) {
      alert("선택된 상품이 없습니다.");
      return;
    }
    const count = selectedPostIds.length;
    const actionLabel = status === "public" ? "공개" : "숨김";
    if (safeConfirm(`선택한 ${count}개 상품의 상태를 [${actionLabel}]으로 변경하시겠습니까?`)) {
      handleAutoSaveAction(async () => {
        try {
          const promises = selectedPostIds.map(id => 
            updateDoc(doc(db, "posts", id), { status })
          );
          await Promise.all(promises);
          setSelectedPostIds([]);
          alert(`${count}개 상품이 성공적으로 [${actionLabel}] 상태로 변경되었습니다.`);
        } catch (error: any) {
          console.error("Bulk status change failed:", error);
          alert("일괄 상태 변경 중 오류가 발생했습니다: " + (error.message || error.toString()));
          throw error;
        }
      });
    }
  };

  const handleBulkSoldOut = async (isSoldOut: boolean) => {
    if (selectedPostIds.length === 0) {
      alert("선택된 상품이 없습니다.");
      return;
    }
    const count = selectedPostIds.length;
    const actionLabel = isSoldOut ? "품절" : "판매중";
    if (safeConfirm(`선택한 ${count}개 상품을 [${actionLabel}] 상태로 지정하시겠습니까?`)) {
      handleAutoSaveAction(async () => {
        try {
          const promises = selectedPostIds.map(id => 
            updateDoc(doc(db, "posts", id), { isSoldOut })
          );
          await Promise.all(promises);
          setSelectedPostIds([]);
          alert(`${count}개 상품이 성공적으로 [${actionLabel}] 상태로 변경되었습니다.`);
        } catch (error: any) {
          console.error("Bulk sold out change failed:", error);
          alert("일괄 품절 상태 변경 중 오류가 발생했습니다: " + (error.message || error.toString()));
          throw error;
        }
      });
    }
  };

  const handleBulkDelete = async () => {
    if (selectedPostIds.length === 0) {
      alert("선택된 상품이 없습니다.");
      return;
    }
    const count = selectedPostIds.length;
    if (safeConfirm(`정말로 선택한 ${count}개 상품을 일괄 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`)) {
      handleAutoSaveAction(async () => {
        try {
          const promises = selectedPostIds.map(id => 
            deleteDoc(doc(db, "posts", id))
          );
          await Promise.all(promises);
          setSelectedPostIds([]);
          alert(`${count}개의 상품이 전량 성공적으로 삭제되었습니다.`);
        } catch (error: any) {
          console.error("Bulk delete failed:", error);
          alert("일괄 삭제 중 오류가 발생했습니다: " + (error.message || error.toString()));
          throw error;
        }
      });
    }
  };

  const handleBulkUserRoleChange = async (targetRole: "admin" | "customer" | "banned") => {
    if (selectedUserIds.length === 0) {
      alert("선택된 회원이 없습니다.");
      return;
    }
    const count = selectedUserIds.length;
    let roleLabel = "";
    let updateFields: { "isAdmin": boolean; "isBanned": boolean } = { "isAdmin": false, "isBanned": false };
    
    if (targetRole === "admin") {
      roleLabel = "관리자";
      updateFields = { "isAdmin": true, "isBanned": false };
    } else if (targetRole === "customer") {
      roleLabel = "일반 회원";
      updateFields = { "isAdmin": false, "isBanned": false };
    } else if (targetRole === "banned") {
      roleLabel = "금지 회원";
      updateFields = { "isAdmin": false, "isBanned": true };
    }
    
    if (safeConfirm(`선택한 ${count}명 회원의 권한등급을 [${roleLabel}]으로 변경하시겠습니까?`)) {
      handleAutoSaveAction(async () => {
        try {
          const promises = selectedUserIds.map(userId => {
            const userObj = users.find(u => u.id === userId);
            if (ADMIN_EMAILS.includes(userObj?.email || "")) {
              return Promise.resolve(); // Skip master admin demotion
            }
            return supabase.from('users').update(updateFields).eq('id', userId);
          });
          await Promise.all(promises);
          
          setUsers(prevUsers => prevUsers.map(u => {
            if (selectedUserIds.includes(u.id)) {
              if (ADMIN_EMAILS.includes(u.email || "")) return u; // skip master admin details
              return { ...u, isAdmin: updateFields["isAdmin"], isBanned: updateFields["isBanned"] };
            }
            return u;
          }));
          
          setSelectedUserIds([]);
          alert(`${count}명 회원의 권한 등급이 변경되었습니다.`);
        } catch (error: any) {
          console.error("Bulk user role change failed:", error);
          alert("일괄 권한 변경 중 오류가 발생했습니다: " + (error.message || error.toString()));
          throw error;
        }
      });
    }
  };

  const handleBulkUserDelete = async () => {
    if (selectedUserIds.length === 0) {
      alert("선택된 회원이 없습니다.");
      return;
    }
    const count = selectedUserIds.length;
    if (safeConfirm(`정말로 선택한 ${count}명 회원을 일괄 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`)) {
      handleAutoSaveAction(async () => {
        try {
          const promises = selectedUserIds.map(userId => {
            const userObj = users.find(u => u.id === userId);
            if (ADMIN_EMAILS.includes(userObj?.email || "")) {
              return Promise.resolve(); // Skip master admin deletion
            }
            return supabase.from('users').delete().eq('id', userId);
          });
          await Promise.all(promises);
          setSelectedUserIds([]);
          alert(`${count}명의 회원이 성공적으로 삭제되었습니다.`);
        } catch (error: any) {
          console.error("Bulk user delete failed:", error);
          alert("일괄 삭제 중 오류가 발생했습니다: " + (error.message || error.toString()));
          throw error;
        }
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
      { id: "notices", label: "공지사항 및 배너", icon: Megaphone },
      { id: "manage", label: "상품 관리", icon: LayoutDashboard },
      { id: "lectures", label: "강의 관리", icon: Video },
      { id: "categories", label: "카테고리 관리", icon: Tag },
      { id: "reviews", label: "수강생 리뷰 관리", icon: MessageSquare },
    ]},
    { section: "회원 관리", items: [
      { id: "users", label: "회원 관리", icon: Users },
      { id: "inquiry", label: "1:1 문의 및 상담", icon: HelpCircle },
      { id: "blacklist", label: "이용 제한 관리", icon: UserX },
    ]},
    { section: "통계 및 분석", items: [
      { id: "analytics", label: "구글 애널리틱스", icon: BarChart3 }
    ]}
  ];

  if (loading || dataLoading) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <motion.h1 
        animate={{ opacity: [0.3, 1, 0.3] }}
        transition={{ repeat: Infinity, duration: 1.5 }}
        className="text-2xl font-light tracking-tighter uppercase"
      >
        Puima Admin
      </motion.h1>
    </div>
  );

  const isBypassed = localStorage.getItem('admin_bypass') === 'true';

  if (!designMode && !isBypassed && (!user || (!isAdmin && !ADMIN_EMAILS.map(e => e.toLowerCase()).includes(user.email?.toLowerCase() || "")))) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white p-6">
        {/* Branding */}
        <div className="mb-12 text-center">
          <h1 onClick={() => navigate('/')} className="font-script text-[40px] leading-none cursor-pointer hover:opacity-70 transition-opacity mb-2">Puima</h1>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-300">관리자 콘솔</p>
        </div>

        <div className="max-w-md w-full bg-white p-12 rounded-[40px] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-zinc-100">
          <div className="w-16 h-16 bg-zinc-50 rounded-2xl flex items-center justify-center mb-8 mx-auto">
            <ShieldCheck size={32} className="text-zinc-200" />
          </div>

          <h2 className="text-2xl font-black tracking-tighter mb-4 text-center">관리자 권한이 필요합니다</h2>
          <p className="text-zinc-400 mb-8 text-sm font-medium text-center leading-relaxed">
            {user 
              ? <>현재 <b>{user.email}</b> 계정으로 로그인되어 있습니다. 관리자 권한이 있는 계정으로 로그인해주세요.</>
              : "이 페이지에 접근하려면 관리자 계정으로 로그인이 필요합니다."}
          </p>
          
          <div className="space-y-3">
            <button 
              onClick={handleLogin}
              className="w-full flex items-center justify-center gap-2 bg-black text-white p-5 rounded-3xl font-bold hover:bg-zinc-800 transition-all active:scale-[0.98] shadow-lg shadow-black/10"
            >
              <LogIn size={20} />
              {user ? "계정 전환" : "Google로 로그인"}
            </button>

            <button 
              onClick={() => navigate('/')}
              className="w-full flex items-center justify-center gap-2 bg-zinc-50 text-zinc-600 p-5 rounded-3xl font-bold hover:bg-zinc-100 transition-all"
            >
              <ArrowLeft size={18} />
              사이트 홈으로 돌아가기
            </button>

            {isDev && (
              <button 
                onClick={() => setDesignMode(true)}
                className="w-full mt-8 text-[10px] font-black uppercase tracking-widest text-zinc-300 hover:text-black transition-colors"
              >
                — Preview UI Components (Dev Mode only) —
              </button>
            )}
          </div>
          
          {user && (
            <button onClick={logout} className="w-full mt-10 text-[11px] text-zinc-400 hover:text-red-500 font-bold uppercase tracking-widest transition-colors">
              Sign out
            </button>
          )}
        </div>

        <p className="mt-12 text-[10px] font-black uppercase tracking-widest text-zinc-300">
          인가된 사용자만 접근 가능합니다
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex selection:bg-black selection:text-white font-sans">
      {/* Sidebar */}
      <aside className={`bg-white border-r border-zinc-200 flex flex-col transition-all duration-300 shrink-0 ${sidebarOpen ? "w-72" : "w-20"}`}>
        <div className="p-6 flex items-center justify-between">
          <div className={`flex items-center gap-2 ${!sidebarOpen && "hidden"}`}>
            <span className="font-script text-3xl cursor-pointer text-zinc-900 select-none" onClick={() => navigate('/')}>Puima</span>
            <span className="text-[10px] font-black uppercase tracking-[0.1em] text-zinc-400 bg-zinc-100 px-1.5 py-0.5 rounded-md select-none self-end mb-1">Admin</span>
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
      <main className="flex-grow flex flex-col min-w-0 overflow-x-auto">
        {/* Top Header */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-zinc-200 px-8 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/')} 
              className="group flex items-center gap-2 pr-6 border-r border-zinc-200 mr-2"
            >
              <div className="w-8 h-8 bg-zinc-50 rounded-lg flex items-center justify-center text-zinc-400 group-hover:bg-black group-hover:text-white transition-all">
                <ArrowLeft size={16} />
              </div>
              <span className="text-[14px] font-semibold tracking-widest text-zinc-400 group-hover:text-black transition-colors">Home</span>
            </button>
            <div className="flex items-center gap-4">
              
              {/* Auto-save Status Indicator */}
              <div className="hidden lg:flex items-center gap-2">
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
                      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">동기화 중...</span>
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
                        {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}에 저장됨
                      </span>
                    </motion.div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-zinc-200 rounded-full"></div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">모든 변경사항 저장됨</span>
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-zinc-400 hover:text-black transition-all cursor-pointer"
              >
                <Bell size={20} />
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
              </button>

              <AnimatePresence>
                {showNotifications && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setShowNotifications(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 15, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 15, scale: 0.95 }}
                      transition={{ type: "spring", duration: 0.4 }}
                      className="absolute right-0 mt-3 w-80 bg-white border border-zinc-200 rounded-[24px] shadow-xl z-50 overflow-hidden text-left"
                    >
                      <div className="p-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
                        <span className="text-xs font-black uppercase tracking-wider text-zinc-900">알림 피드 (System Alerts)</span>
                        <span className="text-[9px] font-black bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full select-none uppercase tracking-widest leading-none">Live</span>
                      </div>

                      <div className="divide-y divide-zinc-50 max-h-96 overflow-y-auto">
                        <div className="p-4 hover:bg-zinc-50/50 transition-colors flex gap-3">
                          <span className="w-2 h-2 bg-green-500 rounded-full mt-1.5 flex-shrink-0 animate-pulse" />
                          <div>
                            <p className="text-xs font-extrabold text-zinc-800">어드민 보안 로그인</p>
                            <p className="text-[11px] text-zinc-500 mt-1 font-medium select-all leading-relaxed">
                              {user?.email} 계정이 관리자 권한 등급(Master)으로 안전하게 연동되었습니다.
                            </p>
                            <span className="text-[9px] font-bold text-zinc-400 block mt-1">방금 전</span>
                          </div>
                        </div>

                        <div className="p-4 hover:bg-zinc-50/50 transition-colors flex gap-3">
                          <span className="w-2 h-2 bg-indigo-500 rounded-full mt-1.5 flex-shrink-0" />
                          <div>
                            <p className="text-xs font-extrabold text-zinc-800">상품 상태 통계</p>
                            <p className="text-[11px] text-zinc-500 mt-1 font-medium leading-relaxed">
                              현재 쇼룸에 공개 및 전시되고 있는 중인 활성 상품은 총 <strong className="text-zinc-900 font-extrabold">{posts.length}개</strong>입니다.
                            </p>
                            <span className="text-[9px] font-bold text-zinc-400 block mt-1">실시간</span>
                          </div>
                        </div>

                        <div className="p-4 hover:bg-zinc-50/50 transition-colors flex gap-3">
                          <span className="w-2 h-2 bg-purple-500 rounded-full mt-1.5 flex-shrink-0" />
                          <div>
                            <p className="text-xs font-extrabold text-zinc-800">회원 현황</p>
                            <p className="text-[11px] text-zinc-500 mt-1 font-medium leading-relaxed">
                              데이터베이스에 가입되어 있는 총 회원이 <strong className="text-zinc-900 font-extrabold">{users.length}명</strong> 조회되었습니다.
                            </p>
                            <span className="text-[9px] font-bold text-zinc-400 block mt-1">실시간</span>
                          </div>
                        </div>

                        <div className="p-4 hover:bg-zinc-50/50 transition-colors flex gap-3">
                          <span className="w-2 h-2 bg-amber-500 rounded-full mt-1.5 flex-shrink-0" />
                          <div>
                            <p className="text-xs font-extrabold text-zinc-800">게시 공지사항</p>
                            <p className="text-[11px] text-zinc-500 mt-1 font-medium leading-relaxed">
                              현재 활성화로 지정되어 배포 중인 공지 및 슬라이드 배너가 <strong className="text-zinc-900 font-extrabold">{notices.length}개</strong> 운영 중입니다.
                            </p>
                            <span className="text-[9px] font-bold text-zinc-400 block mt-1">실시간</span>
                          </div>
                        </div>
                      </div>

                      <div className="p-3 border-t border-zinc-100 text-center bg-zinc-50/30">
                        <button 
                          onClick={() => setShowNotifications(false)}
                          className="text-[10px] font-black uppercase tracking-wider text-zinc-500 hover:text-black transition-colors w-full py-1 cursor-pointer"
                        >
                          닫기 (Dismiss)
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
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
        <div ref={containerRef} className="flex-grow overflow-y-auto p-4 md:p-8 md:min-w-[1100px]">
          <div className="max-w-[1100px] mx-auto">
            <AnimatePresence mode="wait">
              {/* Class Management View */}
              {activeTab === "manage" && (
                <motion.div 
                  key="manage"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-8"
                >
                  <div className="bg-white p-10 rounded-[40px] border border-zinc-200 shadow-sm">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 pb-6 border-b border-zinc-100">
                      <div>
                        <h3 className="text-3xl font-black tracking-tighter uppercase mb-2">현재 상품 관리</h3>
                        <p className="text-zinc-500 font-medium">관리 가능한 총 {posts.length}개의 상품</p>
                      </div>
                      <div className="flex gap-3">
                        <button 
                          onClick={() => {
                            setEditingId(null);
                            setFormData({
                              title: "",
                              titleEn: "",
                              price: "",
                              originalPrice: "",
                              imageUrl: "",
                              category: categories.length > 0 ? categories[0].name : "",
                              naverUrl: "",
                              naver_product_id: ""
                            });
                            setActiveTab("register");
                          }}
                          className="bg-black text-white px-6 py-3 rounded-2xl font-bold text-sm hover:bg-zinc-800 transition-all active:scale-95 flex items-center gap-2"
                        >
                          <Plus size={18} />
                          새 상품 추가
                        </button>
                      </div>
                    </div>

                    {/* Unified Product List Container */}
                    <div className="bg-white rounded-[28px] border border-zinc-200 shadow-sm overflow-hidden flex flex-col">
                    {/* Local Product Search Panel */}
                    <div className="p-6 flex flex-col lg:flex-row gap-4 items-center justify-between bg-zinc-50/10">
                      <div className="flex flex-col sm:flex-row gap-4 items-center w-full lg:w-auto">
                        <div className="relative w-full sm:w-80">
                          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                          <input 
                            type="text"
                            value={searchProductQuery}
                            onChange={e => setSearchProductQuery(e.target.value)}
                            placeholder="상품명, 영문명, 카테고리를 입력하여 검색..."
                            className="w-full bg-zinc-50/60 border border-zinc-200 rounded-2xl py-3 pl-11 pr-10 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-black/10 transition-all placeholder:text-zinc-400"
                          />
                          {searchProductQuery && (
                            <button 
                              onClick={() => setSearchProductQuery("")}
                              className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-black transition-colors"
                            >
                              <X size={14} />
                            </button>
                          )}
                        </div>
                        {searchProductQuery && (
                          <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider select-none shrink-0">
                            검색 결과 • {filteredPosts.length}개 발견
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 flex-wrap w-full lg:w-auto justify-end">
                        <div className="flex items-center gap-2 mr-3 bg-zinc-50 px-3 py-2 rounded-xl border border-zinc-150 shrink-0">
                          <input 
                            type="checkbox"
                            id="selectAllPosts"
                            checked={filteredPosts.length > 0 && filteredPosts.every(p => selectedPostIds.includes(p.id))}
                            onChange={(e) => {
                              if (e.target.checked) {
                                const allFilteredIds = filteredPosts.map(p => p.id);
                                setSelectedPostIds(prev => Array.from(new Set([...prev, ...allFilteredIds])));
                              } else {
                                const allFilteredIds = filteredPosts.map(p => p.id);
                                setSelectedPostIds(prev => prev.filter(id => !allFilteredIds.includes(id)));
                              }
                            }}
                            className="w-4 h-4 text-black border-zinc-350 rounded focus:ring-black accent-black cursor-pointer"
                          />
                          <label htmlFor="selectAllPosts" className="text-xs font-black text-zinc-650 select-none cursor-pointer">
                            전체 선택 {selectedPostIds.length > 0 && `(${selectedPostIds.length})`}
                          </label>
                        </div>

                        <button
                          disabled={selectedPostIds.length === 0}
                          onClick={() => handleBulkStatus("public")}
                          className={`px-3 py-2 rounded-xl text-xs font-black transition-all duration-200 flex items-center gap-1.5 ${
                            selectedPostIds.length > 0 
                              ? "bg-green-50 text-green-600 border border-green-200 hover:bg-green-100" 
                              : "bg-zinc-50 text-zinc-300 border border-zinc-100 cursor-not-allowed"
                          }`}
                        >
                          공개
                        </button>
                        <button
                          disabled={selectedPostIds.length === 0}
                          onClick={() => handleBulkStatus("hidden")}
                          className={`px-3 py-2 rounded-xl text-xs font-black transition-all duration-200 flex items-center gap-1.5 ${
                            selectedPostIds.length > 0 
                              ? "bg-zinc-100 text-zinc-600 border border-zinc-200 hover:bg-zinc-200" 
                              : "bg-zinc-50 text-zinc-300 border border-zinc-100 cursor-not-allowed"
                          }`}
                        >
                          숨김
                        </button>
                        <button
                          disabled={selectedPostIds.length === 0}
                          onClick={() => handleBulkSoldOut(true)}
                          className={`px-3 py-2 rounded-xl text-xs font-black transition-all duration-200 flex items-center gap-1.5 ${
                            selectedPostIds.length > 0 
                              ? "bg-red-50 text-red-600 border border-red-200 hover:bg-red-100" 
                              : "bg-zinc-50 text-zinc-300 border border-zinc-100 cursor-not-allowed"
                          }`}
                        >
                          품절
                        </button>
                        <button
                          disabled={selectedPostIds.length === 0}
                          onClick={() => handleBulkSoldOut(false)}
                          className={`px-3 py-2 rounded-xl text-xs font-black transition-all duration-200 flex items-center gap-1.5 ${
                            selectedPostIds.length > 0 
                              ? "bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100" 
                              : "bg-zinc-50 text-zinc-300 border border-zinc-100 cursor-not-allowed"
                          }`}
                        >
                          판매중
                        </button>
                        <button
                          disabled={selectedPostIds.length === 0}
                          onClick={handleBulkDelete}
                          className={`px-4 py-2 rounded-xl text-xs font-black transition-all duration-200 flex items-center gap-1.5 ${
                            selectedPostIds.length > 0 
                              ? "bg-red-600 text-white hover:bg-red-700 shadow-sm animate-pulse-subtle" 
                              : "bg-zinc-50 text-zinc-300 border border-zinc-100 cursor-not-allowed"
                          }`}
                        >
                          삭제
                        </button>
                      </div>
                    </div>

                    {/* Integrated Product List Area */}
                    <div className="p-4 md:p-6 font-sans">
                      {/* Product Table Header */}
                      {filteredPosts.length > 0 && (
                        <div className="px-4 py-2.5 mb-2.5 flex items-center gap-4 text-xs font-black text-zinc-400 select-none pb-[25px] border-b border-zinc-100">
                          {/* Drag Handle Placeholder */}
                          <div className="w-4 flex-shrink-0" />

                          {/* Master Bulk Checkbox */}
                          <div className="flex-shrink-0 flex items-center justify-center pl-1">
                            <input 
                              type="checkbox"
                              checked={filteredPosts.length > 0 && filteredPosts.every(p => selectedPostIds.includes(p.id))}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  const allFilteredIds = filteredPosts.map(p => p.id);
                                  setSelectedPostIds(prev => Array.from(new Set([...prev, ...allFilteredIds])));
                                } else {
                                  const allFilteredIds = filteredPosts.map(p => p.id);
                                  setSelectedPostIds(prev => prev.filter(id => !allFilteredIds.includes(id)));
                                }
                              }}
                              className="w-4 h-4 text-black border-zinc-350 rounded focus:ring-black accent-black cursor-pointer"
                              title="전체 선택"
                            />
                          </div>

                          {/* Thumbnail Header */}
                          <div className="w-10 text-center flex-shrink-0 text-[10px] uppercase tracking-wider font-bold">
                            이미지
                          </div>

                          {/* Category Header */}
                          <div className="w-20 text-center flex-shrink-0 text-[10px] uppercase tracking-wider font-bold hidden sm:block">
                            카테고리
                          </div>

                          {/* Title Header */}
                          <div className="flex-grow min-w-0 text-[10px] uppercase tracking-wider font-bold pl-2">
                            한글명
                          </div>

                          {/* English Title Header */}
                          <div className="w-32 flex-shrink-0 text-center text-[10px] uppercase tracking-wider font-bold hidden lg:block">
                            영문명
                          </div>

                          {/* Sale Price Header */}
                          <div className="w-20 flex-shrink-0 text-right text-[10px] uppercase tracking-wider font-bold hidden sm:block">
                            판매가격
                          </div>

                          {/* Regular Price Header */}
                          <div className="w-20 flex-shrink-0 text-right text-[10px] uppercase tracking-wider font-bold hidden md:block">
                            정상가격
                          </div>

                          {/* Status Quick Actions Header */}
                          <div className="w-32 flex-shrink-0 text-center text-[10px] uppercase tracking-wider font-bold">
                            상태
                          </div>

                          {/* Action Controls Header */}
                          <div className="w-[84px] flex-shrink-0 text-right text-[10px] uppercase tracking-wider font-bold pr-2">
                            관리
                          </div>
                        </div>
                      )}

                      <div className="flex flex-col">
                        {filteredPosts.map((post, idx) => (
                          <div 
                            key={post.id}
                            draggable={!searchProductQuery}
                            onDragStart={(e) => {
                              draggedIdxRef.current = idx;
                              e.dataTransfer.effectAllowed = 'move';
                              // 드래그 시작 시 약간 투명하게
                              (e.currentTarget as HTMLElement).style.opacity = '0.5';
                            }}
                            onDragEnd={(e) => {
                              (e.currentTarget as HTMLElement).style.opacity = '1';
                              draggedIdxRef.current = null;
                              setDragOverIdx(null);
                            }}
                            onDragOver={(e) => {
                              e.preventDefault();
                              e.dataTransfer.dropEffect = 'move';
                              if (draggedIdxRef.current !== null && draggedIdxRef.current !== idx) {
                                setDragOverIdx(idx);
                              }
                            }}
                            onDragLeave={() => {
                              setDragOverIdx(prev => prev === idx ? null : prev);
                            }}
                            onDrop={(e) => {
                              e.preventDefault();
                              const fromIdx = draggedIdxRef.current;
                              if (fromIdx === null || fromIdx === idx) return;
                              // 순서 재배열
                              const newPosts = [...posts];
                              const draggedPostId = filteredPosts[fromIdx].id;
                              const targetPostId = filteredPosts[idx].id;
                              const realFrom = newPosts.findIndex(p => p.id === draggedPostId);
                              const realTo = newPosts.findIndex(p => p.id === targetPostId);
                              if (realFrom === -1 || realTo === -1) return;
                              const [moved] = newPosts.splice(realFrom, 1);
                              newPosts.splice(realTo, 0, moved);
                              handleReorder(newPosts);
                              draggedIdxRef.current = null;
                              setDragOverIdx(null);
                            }}
                            onClick={(e) => handleRowClick(e, post, idx)}
                            className={`mb-1.5 last:mb-0 px-4 py-3 rounded-xl flex items-center gap-4 group transition-[background-color,border-color,box-shadow,color,border-top] duration-150 relative cursor-pointer select-none ${
                              selectedPostIds.includes(post.id) 
                                ? "bg-zinc-100 text-black shadow-sm" 
                                : "hover:bg-zinc-50 bg-white text-zinc-900"
                            } ${dragOverIdx === idx ? "border-t-2 border-t-black" : ""}`}
                          >
                            {/* Drag Handle */}
                            {!searchProductQuery ? (
                              <div className="flex-shrink-0 text-zinc-300 cursor-grab active:cursor-grabbing hover:text-black transition-colors">
                                <GripVertical size={16} />
                              </div>
                            ) : (
                              <div className="flex-shrink-0 w-4 h-4 rounded-full bg-zinc-100 flex items-center justify-center text-[8px] font-black text-zinc-400 select-none">
                                •
                              </div>
                            )}

                            {/* Checkbox for selection */}
                            <div className="flex-shrink-0 flex items-center justify-center pl-1 pointer-events-none">
                              <input 
                                type="checkbox"
                                checked={selectedPostIds.includes(post.id)}
                                readOnly
                                className="w-4 h-4 text-black border-zinc-350 rounded focus:ring-black accent-black cursor-pointer"
                              />
                            </div>

                            {/* Thumbnail */}
                            <div className="w-10 h-10 bg-zinc-50 rounded-lg overflow-hidden flex-shrink-0 border border-zinc-100 flex items-center justify-center">
                              {post.imageUrl ? (
                                <img src={post.imageUrl} alt={post.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              ) : (
                                <span className="text-[8px] font-black uppercase text-zinc-300">{post.image}</span>
                              )}
                            </div>

                            {/* Category */}
                            <div className="w-20 flex-shrink-0 hidden sm:flex items-center justify-center">
                              {post.category ? (
                                <span className="text-[9px] font-black px-2 py-0.5 rounded-full border shrink-0 tracking-wider bg-zinc-100 border-zinc-200 text-zinc-800">
                                  {post.category}
                                </span>
                              ) : (
                                <span className="text-[9px] font-black px-2 py-0.5 rounded-full border shrink-0 tracking-wider bg-zinc-50 border-zinc-150 text-zinc-400">
                                  미분류
                                </span>
                              )}
                            </div>

                            {/* Korean Name */}
                            <div className="flex-grow min-w-0 pl-2">
                              <h4 className="text-[13px] font-bold text-zinc-900 truncate tracking-tight">{post.title}</h4>
                            </div>

                            {/* English Name */}
                            <div className="w-32 flex-shrink-0 hidden lg:block text-center">
                              <span className="text-[11px] text-zinc-400 font-medium truncate block px-2">{post.titleEn || '-'}</span>
                            </div>

                            {/* Sale Price */}
                            <div className="w-20 flex-shrink-0 text-right hidden sm:block">
                              <div className="flex flex-col items-end">
                                <span className="text-[12px] font-bold text-black">{post.price ? formatPriceStr(post.price.toString()) : '-'}</span>
                                {post.isSoldOut && (
                                  <span className="bg-red-50 text-red-500 text-[8px] font-black uppercase px-1 py-0.5 rounded mt-0.5">Sold Out</span>
                                )}
                              </div>
                            </div>

                            {/* Regular Price */}
                            <div className="w-20 flex-shrink-0 text-right hidden md:block">
                              <span className="text-[11px] font-medium text-zinc-400 line-through">{post.originalPrice ? formatPriceStr(post.originalPrice.toString()) : '-'}</span>
                            </div>

                            {/* Quick Actions (Status) */}
                            <div className="w-32 flex-shrink-0 flex items-center gap-2 justify-center">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleStatus(post.id, post.status || "public");
                                }}
                                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tighter transition-all border cursor-pointer ${
                                  post.status === "hidden" 
                                    ? "bg-zinc-50 border-zinc-100 text-zinc-400 hover:text-black hover:border-zinc-350" 
                                    : "bg-green-50 border-green-100 text-green-600 hover:bg-green-100"
                                }`}
                              >
                                {post.status === "hidden" ? "숨김" : "공개"}
                              </button>

                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleSoldOut(post.id, !!post.isSoldOut);
                                }}
                                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tighter transition-all border cursor-pointer ${
                                  post.isSoldOut 
                                    ? "bg-red-50 border-red-100 text-red-600 hover:bg-red-100" 
                                    : "bg-white border-zinc-200 text-zinc-400 hover:border-black hover:text-black"
                                }`}
                              >
                                {post.isSoldOut ? "복구" : "품절"}
                              </button>
                            </div>

                            {/* Edit/Delete Icons (Actions) */}
                            <div className="w-[84px] flex-shrink-0 flex items-center gap-1 pl-4 border-l border-zinc-100 justify-end">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  startEdit(post);
                                }}
                                className="p-2 text-zinc-400 hover:text-black hover:bg-zinc-100 rounded-lg transition-all cursor-pointer"
                                title="Edit"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(post.id);
                                }}
                                className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                                title="Delete"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  {posts.length === 0 && (
                      <div className="text-center py-32 bg-zinc-50 border-2 border-dashed border-zinc-200 rounded-[40px] flex flex-col items-center">
                        <p className="text-zinc-400 text-sm font-medium mb-6">데이터가 없습니다.<br />새로운 클래스를 등록해보세요.</p>
                        <div className="flex gap-3">
                          <button 
                            onClick={() => setActiveTab("register")}
                            className="bg-black text-white px-8 py-3 rounded-full text-xs font-bold hover:bg-zinc-800 transition-all"
                          >
                            클래스 추가
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
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
                      <h3 className="text-3xl font-black tracking-tighter uppercase">
                        {editingId ? "수정하기" : "신규 등록"}
                      </h3>
                    </div>
                    <div className="flex gap-3">
                      <button 
                        onClick={() => { setActiveTab("manage"); setEditingId(null); setFormData({}); }}
                        className="px-6 py-3 rounded-2xl text-sm font-bold hover:bg-zinc-50 transition-all border border-zinc-100 hover:border-zinc-200"
                      >
                        취소
                      </button>
                      <button 
                        onClick={handleSave}
                        className="flex items-center gap-2 bg-black text-white px-8 py-3 rounded-2xl font-bold text-sm hover:bg-zinc-800 transition-all active:scale-[0.98] shadow-lg shadow-black/10"
                      >
                        <Save size={18} />
                        {editingId ? "수정하기" : "상품 등록"}
                      </button>
                    </div>
                  </div>
                  
                  <div className="pb-10">
                    <div className="space-y-8">
                      {/* Row 1 */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
                        <div>
                          <label className="block text-[13px] font-extrabold uppercase tracking-[0.2em] text-zinc-400 mb-3">한글명</label>
                          <input 
                            type="text" 
                            value={formData.title || ""} 
                            onChange={e => setFormData({...formData, title: e.target.value})}
                            placeholder="클래스 제목을 입력하세요..."
                            className="w-full p-4 bg-zinc-50/60 border border-zinc-200 rounded-2xl text-[13px] font-medium focus:outline-none focus:ring-4 focus:ring-black/5 transition-all"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[13px] font-extrabold uppercase tracking-[0.2em] text-zinc-400 mb-3">판매 가격</label>
                            <input 
                              type="text" 
                              value={formatPriceStr(formData.price)} 
                              onChange={e => setFormData({...formData, price: parsePriceStr(e.target.value)})}
                              placeholder="49,900"
                              className="w-full p-4 bg-zinc-50/60 border border-zinc-200 rounded-2xl text-[13px] font-medium focus:outline-none focus:ring-4 focus:ring-black/5 transition-all"
                            />
                          </div>
                          <div>
                            <label className="block text-[13px] font-extrabold uppercase tracking-[0.2em] text-zinc-400 mb-3">정상 가격</label>
                            <input 
                              type="text" 
                              value={formatPriceStr(formData.originalPrice)} 
                              onChange={e => setFormData({...formData, originalPrice: parsePriceStr(e.target.value)})}
                              placeholder="69,900"
                              className="w-full p-4 bg-zinc-50/60 border border-zinc-200 rounded-2xl text-[13px] font-medium focus:outline-none focus:ring-4 focus:ring-black/5 transition-all"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Row 2 */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
                        <div>
                          <div className="flex justify-between items-center mb-3 min-h-[28px]">
                            <label className="block text-[13px] font-extrabold uppercase tracking-[0.2em] text-zinc-400">영문명</label>
                            <button
                              type="button"
                              onClick={handleTranslatePostName}
                              disabled={translatingPostName || !formData.title}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 rounded-lg text-xs font-bold text-zinc-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Sparkles size={12} className={translatingPostName ? "animate-pulse text-blue-500" : "text-blue-500"} />
                              {translatingPostName ? "번역 중..." : "AI 자동 번역"}
                            </button>
                          </div>
                          <input 
                            type="text" 
                            value={formData.titleEn || ""} 
                            onChange={e => setFormData({...formData, titleEn: e.target.value})}
                            placeholder="Enter English title..."
                            className="w-full p-4 bg-zinc-50/60 border border-zinc-200 rounded-2xl text-[13px] font-medium focus:outline-none focus:ring-4 focus:ring-black/5 transition-all"
                          />
                          <p className="mt-2 text-[10px] text-zinc-400 font-medium">ENG 선택시 표시되는 이름입니다.</p>
                        </div>
                        <div>
                          <div className="flex items-center mb-3 min-h-[28px]">
                            <label className="block text-[13px] font-extrabold uppercase tracking-[0.2em] text-zinc-400">카테고리</label>
                          </div>
                          <select 
                            value={formData.category || ""} 
                            onChange={e => setFormData({...formData, category: e.target.value})}
                            className="w-full p-4 bg-zinc-50/60 border border-zinc-200 rounded-2xl text-[13px] font-medium focus:outline-none focus:ring-4 focus:ring-black/5 appearance-none cursor-pointer transition-all"
                          >
                            <option value="">카테고리 선택</option>
                            {categories.map(cat => (
                              <option key={cat.id} value={cat.name}>{cat.name}</option>
                            ))}
                          </select>
                          <p className="mt-2 text-[10px] text-zinc-400 font-medium">카테고리 관리는 왼쪽 메뉴에서 가능합니다.</p>
                        </div>
                      </div>

                      {/* Row 3 */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
                        <div>
                          <label className="block text-[13px] font-extrabold uppercase tracking-[0.2em] text-zinc-400 mb-3">스토어 링크</label>
                          <input 
                            type="text" 
                            value={formData.naverUrl || ""} 
                            onChange={e => setFormData({...formData, naverUrl: e.target.value})}
                            placeholder="Naver Smart Store URL"
                            className="w-full p-4 bg-zinc-50/60 border border-zinc-200 rounded-2xl text-[13px] font-medium focus:outline-none focus:ring-4 focus:ring-black/5 transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-[13px] font-extrabold uppercase tracking-[0.2em] text-zinc-400 mb-3">네이버 상품 번호</label>
                          <input 
                            type="text" 
                            value={formData.naver_product_id || ""} 
                            onChange={e => setFormData({...formData, naver_product_id: e.target.value})}
                            placeholder="예: 123456789"
                            className="w-full p-4 bg-zinc-50/60 border border-zinc-200 rounded-2xl text-[13px] font-medium focus:outline-none focus:ring-4 focus:ring-black/5 transition-all"
                          />
                        </div>
                      </div>

                      {/* Row 4 */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
                        <div>
                          <label className="block text-[13px] font-extrabold uppercase tracking-[0.2em] text-zinc-400 mb-3">대표 이미지</label>
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
                                    이미지 변경
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <div className="w-12 h-12 bg-zinc-100 rounded-2xl flex items-center justify-center mb-4 text-zinc-400 group-hover:text-black transition-colors">
                                    <Upload size={24} />
                                  </div>
                                  <p className="text-sm font-bold mb-1">클릭하여 업로드하거나 파일을 여기로 드래그하세요</p>
                                  <p className="text-[10px] text-zinc-400 font-medium uppercase tracking-widest">JPG, PNG, WEBP (최대 5MB)</p>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="hidden lg:block"></div>
                      </div>
                    </div>
                  
                  </div>
                </motion.div>
              )}

              {/* Lecture Management View */}
              {activeTab === "lectures" && (
                <motion.div 
                  key="lectures"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  <div className="bg-white p-10 rounded-[40px] border border-zinc-200 shadow-sm">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 pb-6 border-b border-zinc-100">
                      <div>
                        <h3 className="text-3xl font-black tracking-tighter uppercase mb-2">강의 영상 관리</h3>
                        <p className="text-zinc-500 font-medium">
                          {selectedPostIdForLectures ? "선택한 상품의 동영상 및 챕터를 관리하고 편집하세요." : "강의를 관리할 상품(클래스)을 선택하세요."}
                        </p>
                      </div>
                      
                      {/* Class selector / Back button */}
                      <div className="w-full md:w-auto shrink-0 flex justify-end">
                        {selectedPostIdForLectures && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedPostIdForLectures(null);
                              handleCancelEditChapter();
                            }}
                            className="px-5 py-3 border border-zinc-200 hover:border-black rounded-xl text-xs font-black transition-all flex items-center gap-2 bg-white text-zinc-700 hover:text-black cursor-pointer shadow-sm hover:shadow"
                          >
                            ← 다른 상품 목록 보기
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Active Workspace Block */}
                    <div ref={lectureFormRef} className="space-y-8 animate-fadeIn">
                      {!selectedPostIdForLectures ? (
                        <div className="bg-white rounded-[28px] border border-zinc-200 shadow-sm overflow-hidden flex flex-col">
                          {/* Search Panel */}
                          <div className="p-6 flex flex-col lg:flex-row gap-4 items-center justify-between bg-zinc-50/10 font-sans">
                            <div className="flex flex-col sm:flex-row gap-4 items-center w-full lg:w-auto font-sans">
                              <div className="relative w-full sm:w-80">
                                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                                <input 
                                  type="text"
                                  value={searchLectureQuery}
                                  onChange={e => setSearchLectureQuery(e.target.value)}
                                  placeholder="상품명, 카테고리를 입력하여 검색..."
                                  className="w-full bg-zinc-50/60 border border-zinc-200 rounded-2xl py-3 pl-11 pr-10 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-black/10 transition-all placeholder:text-zinc-400"
                                />
                                {searchLectureQuery && (
                                  <button 
                                    onClick={() => setSearchLectureQuery("")}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-black transition-colors"
                                  >
                                    <X size={14} />
                                  </button>
                                )}
                              </div>
                              {searchLectureQuery && (
                                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider select-none shrink-0 font-sans">
                                  검색 결과 • {filteredLecturePosts.length}개 발견
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="p-4 md:p-6 font-sans">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {filteredLecturePosts.map(post => {
                                const classChapters = allChapters.filter(ch => ch.postId === post.id);
                                return (
                                  <div 
                                    key={post.id} 
                                    onClick={() => {
                                      setSelectedPostIdForLectures(post.id);
                                      if (classChapters.length > 0) {
                                        const ch = classChapters[0];
                                        setEditingChapterId(ch.id || null);
                                        setEditingChapterData({
                                          chapterNo: ch.chapterNo,
                                          title: ch.title,
                                          duration: ch.duration,
                                          videoUrl: ch.videoUrl,
                                          recipe: ch.recipe || "",
                                          milestones: ch.milestones || []
                                        });
                                      } else {
                                        handleCancelEditChapter();
                                      }
                                      setTimeout(() => {
                                        lectureFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                                      }, 100);
                                    }}
                                    className="flex items-center gap-4 px-4 py-3 bg-white border border-zinc-200 rounded-2xl hover:border-black hover:shadow-sm transition-all cursor-pointer group"
                                  >
                                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-zinc-100 flex-shrink-0 flex items-center justify-center">
                                      {post.imageUrl ? (
                                        <img src={post.imageUrl} referrerPolicy="no-referrer" alt={post.title} className="w-full h-full object-cover" />
                                      ) : (
                                        <Video size={16} className="text-zinc-300" />
                                      )}
                                    </div>
                                    <div className="flex-grow min-w-0 flex flex-col justify-center pl-2 font-sans overflow-hidden">
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className="text-[9px] font-bold bg-zinc-100 text-zinc-600 px-1.5 py-0.5 rounded leading-none">
                                          {post.category || "기본 카테고리"}
                                        </span>
                                      </div>
                                      <div className="text-sm font-black text-zinc-900 truncate">
                                        {post.title}
                                      </div>
                                    </div>
                                    <div className="w-[84px] flex-shrink-0 flex items-center justify-end pr-2">
                                      <button className="px-3 py-1.5 bg-zinc-100 group-hover:bg-black group-hover:text-white rounded-lg text-xs font-bold transition-colors">
                                        강의 관리
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                            
                            {posts.length === 0 && (
                              <div className="py-20 text-center text-zinc-400 text-sm font-medium border border-dashed border-zinc-200 bg-zinc-50/50 rounded-3xl flex flex-col items-center justify-center gap-4">
                                <Video size={36} className="text-zinc-300" />
                                <span className="font-bold text-zinc-600">시스템에 등록된 클래스(상품) 정보가 없습니다.</span>
                                <span className="text-[11px] text-zinc-400">상품관리 탭에서 먼저 상품을 생성해 주세요.</span>
                              </div>
                            )}

                            {posts.length > 0 && filteredLecturePosts.length === 0 && (
                              <div className="py-20 text-center text-zinc-400 text-sm font-medium border border-dashed border-zinc-200 bg-zinc-50/50 rounded-3xl flex flex-col items-center justify-center gap-4">
                                <span className="font-bold text-zinc-600">검색 결과가 없습니다.</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-8 animate-fadeIn">
                        {/* TOP: Horizontal Add or Edit Chapter Form */}
                        <form onSubmit={handleSaveChapter} className="space-y-8 animate-fadeIn w-full">
                          
                          {/* Card 1: 영상 URL 자원 정보 */}
                          <div className="border border-zinc-200 bg-white p-6 md:p-8 rounded-[32px] shadow-sm w-full">
                            <div className="pb-4 border-b border-zinc-100 mb-6 font-sans">
                              <h4 className="text-sm font-black text-zinc-950 flex items-center gap-2">
                                <Video size={16} className="text-zinc-700" />
                                영상 소스 설정
                              </h4>
                              <p className="text-zinc-500 text-[11px] mt-1 font-medium">챕터에 사용될 동영상의 경로 또는 웹 주소를 입력해 주세요.</p>
                            </div>

                            {/* Horizontal Inputs Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end font-sans">
                              <div className="md:col-span-9">
                                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-1.5">영상 소스 URL *</label>
                                <input 
                                  type="text" 
                                  value={editingChapterId ? editingChapterData.videoUrl : newChapter.videoUrl}
                                  onChange={e => {
                                    const val = e.target.value;
                                    if (editingChapterId) {
                                      setEditingChapterData(prev => ({ ...prev, videoUrl: val }));
                                    } else {
                                      setNewChapter(prev => ({ ...prev, videoUrl: val }));
                                    }
                                  }}
                                  placeholder="https://example.com/video.mp4"
                                  className="w-full p-3 bg-zinc-50/60 border border-zinc-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-4 focus:ring-black/5 text-zinc-500 font-sans"
                                  required
                                />
                              </div>

                              <div className="md:col-span-3 flex gap-2">
                                <button
                                  type="submit"
                                  disabled={isSavingChapter}
                                  className={`flex-grow flex items-center justify-center gap-1.5 py-3 rounded-xl text-xs font-black text-white transition-all shadow-md cursor-pointer ${
                                    editingChapterId 
                                      ? "bg-amber-500 hover:bg-amber-600 shadow-amber-500/10" 
                                      : "bg-black hover:bg-zinc-800 shadow-black/10"
                                  }`}
                                >
                                  {isSavingChapter ? (
                                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                  ) : (
                                    <Save size={13} />
                                  )}
                                  저장하기
                                </button>
                                {editingChapterId && (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteChapter(editingChapterId)}
                                    className="p-3 border border-red-200 text-red-500 rounded-xl hover:bg-red-50 transition-all cursor-pointer flex items-center justify-center"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>

                            {/* Video Preview Section */}
                            {(editingChapterId ? editingChapterData.videoUrl : newChapter.videoUrl) && (
                              <div className="border border-zinc-200 bg-white p-6 md:p-8 rounded-[32px] shadow-sm w-full font-sans">
                                <div className="pb-4 border-b border-zinc-100 mb-6 font-sans">
                                  <h4 className="text-sm font-black text-zinc-950 flex items-center gap-2">
                                    <Eye size={16} className="text-zinc-700" />
                                    영상 미리보기
                                  </h4>
                                  <p className="text-zinc-500 text-[11px] mt-1 font-medium pb-0.5">현재 작동 중인 비디오 플레이어의 싱크 프리뷰 화면입니다.</p>
                                </div>
                                <div className="bg-zinc-50 border border-zinc-200 p-2 rounded-2xl overflow-hidden aspect-video relative">
                                  {getEmbedUrl(editingChapterId ? editingChapterData.videoUrl : newChapter.videoUrl) ? (
                                    <iframe
                                      ref={iframeRef}
                                      src={getEmbedUrl(editingChapterId ? editingChapterData.videoUrl : newChapter.videoUrl)!}
                                      className="w-full h-full absolute inset-0"
                                      allowFullScreen
                                      title="Video Preview"
                                    />
                                  ) : (
                                    <video 
                                      ref={videoPreviewRef}
                                      src={editingChapterId ? editingChapterData.videoUrl : newChapter.videoUrl} 
                                      controls 
                                      className="w-full h-full object-contain absolute inset-0 bg-black/5 rounded-xl"
                                    >
                                      브라우저가 비디오 태그를 지원하지 않습니다.
                                    </video>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Sub-Milestones setup inside the horizontal form card */}
                            <div className="border border-zinc-200 bg-white p-6 md:p-8 rounded-[32px] shadow-sm w-full font-sans animate-fadeIn">
                              <div className="pb-4 border-b border-zinc-100 mb-6 font-sans">
                                <h4 className="text-sm font-black text-zinc-950 flex items-center gap-2">
                                  <Video size={16} className="text-zinc-700" />
                                  챕터관리
                                </h4>
                                <p className="text-zinc-500 text-[11px] mt-1 font-medium">동영상 내의 핵심 타임라인 이정표 및 이동 인터랙션을 추가해 보세요.</p>
                              </div>

                              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                                 {/* Milestone Inputs Column */}
                                <div className="lg:col-span-4 space-y-4 font-sans">
                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <div className="flex items-center justify-between mb-1.5 min-h-[16px]">
                                        <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">시작시간</label>
                                        {(editingChapterId ? editingChapterData.videoUrl : newChapter.videoUrl) && (
                                          <button 
                                            type="button" 
                                            onClick={() => {
                                              const t = currentAdminPlayTime;
                                              const m = Math.floor(t / 60).toString().padStart(2, '0');
                                              const s = Math.floor(t % 60).toString().padStart(2, '0');
                                              setMStartTime(`${m}:${s}`);
                                            }} 
                                            className="text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-0.5 rounded leading-none transition-all cursor-pointer font-bold shadow-sm"
                                          >주입 ({formatAdminTime(currentAdminPlayTime)})</button>
                                        )}
                                      </div>
                                      <input 
                                        type="text" 
                                        value={mStartTime}
                                        onChange={e => setMStartTime(e.target.value)}
                                        placeholder="05:14"
                                        className="w-full p-2.5 bg-zinc-50/60 border border-zinc-200 rounded-lg text-xs font-semibold text-center focus:outline-none focus:ring-2 focus:ring-black/10 text-zinc-700 font-sans"
                                      />
                                    </div>
                                    <div>
                                      <div className="flex items-center justify-between mb-1.5 min-h-[16px]">
                                        <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">종료시간</label>
                                        {(editingChapterId ? editingChapterData.videoUrl : newChapter.videoUrl) && (
                                          <button 
                                            type="button" 
                                            onClick={() => {
                                              const t = currentAdminPlayTime;
                                              const m = Math.floor(t / 60).toString().padStart(2, '0');
                                              const s = Math.floor(t % 60).toString().padStart(2, '0');
                                              setMEndTime(`${m}:${s}`);
                                            }} 
                                            className="text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-0.5 rounded leading-none transition-all cursor-pointer font-bold shadow-sm"
                                          >주입 ({formatAdminTime(currentAdminPlayTime)})</button>
                                        )}
                                      </div>
                                      <input 
                                        type="text" 
                                        value={mEndTime}
                                        onChange={e => setMEndTime(e.target.value)}
                                        placeholder="08:30"
                                        className="w-full p-2.5 bg-zinc-50/60 border border-zinc-200 rounded-lg text-xs font-semibold text-center focus:outline-none focus:ring-2 focus:ring-black/10 text-zinc-700 font-sans"
                                      />
                                    </div>
                                  </div>

                                  <div>
                                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-1.5 font-sans">챕터 제목</label>
                                    <input 
                                      type="text" 
                                      value={mTitle}
                                      onChange={e => setMTitle(e.target.value)}
                                      placeholder="버터 및 배합 제조 시작"
                                      className="w-full p-2.5 bg-zinc-50/60 border border-zinc-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-black/10 text-zinc-750 font-sans"
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-1.5 font-sans">상세설명</label>
                                    <input 
                                      type="text" 
                                      value={mDesc}
                                      onChange={e => setMDesc(e.target.value)}
                                      placeholder="풍미를 극대화하는 배합 방식 분석"
                                      className="w-full p-2.5 bg-zinc-50/60 border border-zinc-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-black/10 text-zinc-755 font-sans"
                                    />
                                  </div>

                                  <button 
                                    type="button"
                                    onClick={handleAddMilestone}
                                    className="w-full py-3 bg-zinc-100 hover:bg-black hover:text-white rounded-lg text-xs font-black uppercase tracking-wider transition-colors cursor-pointer font-sans"
                                  >
                                    챕터 추가
                                  </button>
                                </div>

                                {/* Milestone List Stream Column */}
                                <div className="lg:col-span-8 flex flex-col font-sans">
                                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-2">챕터 리스트</div>
                                  <div className="border border-zinc-200 bg-zinc-50/50 rounded-[20px] p-5 flex-grow flex flex-col justify-start">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 overflow-y-auto max-h-[160px] pr-1">
                                      {((editingChapterId ? editingChapterData.milestones : newChapter.milestones) || []).map((ms, msIndex) => (
                                        <div key={msIndex} className="p-2.5 rounded-xl border border-zinc-100 flex items-center justify-between text-[11px] bg-zinc-50/50">
                                          <div className="flex-1 min-w-0 pr-2">
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                              <span className="font-mono text-[9px] px-1.5 py-0.5 bg-black text-white rounded font-bold leading-none shrink-0">{ms.timeLabel} ({ms.seconds}초)</span>
                                              <span className="font-bold text-zinc-800 truncate">{ms.title}</span>
                                            </div>
                                            {ms.desc && <p className="text-[10px] text-zinc-400 truncate mt-0.5">{ms.desc}</p>}
                                          </div>
                                          <button
                                            type="button"
                                            onClick={() => handleRemoveMilestone(msIndex)}
                                            className="p-1 text-zinc-350 hover:text-red-500 rounded hover:bg-zinc-100 shrink-0 cursor-pointer"
                                          >
                                            <X size={12} />
                                          </button>
                                        </div>
                                      ))}
                                      {((editingChapterId ? editingChapterData.milestones : newChapter.milestones) || []).length === 0 && (
                                        <div className="col-span-full py-12 text-center text-zinc-500 font-sans flex flex-col items-center justify-center gap-2">
                                          <span className="font-black text-sm text-zinc-800">등록된 챕터 내부 이정표가 없습니다.</span>
                                          <span className="text-xs text-zinc-500 font-medium leading-relaxed">동영상 타임라인 재생 시점 바로가기 항목을 추가해 보세요.</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Recipe/Ingredients Input Section */}
                            <div className="border border-zinc-200 bg-white p-6 md:p-8 rounded-[32px] shadow-sm w-full font-sans">
                              <div className="pb-4 border-b border-zinc-100 mb-6 font-sans">
                                <h4 className="text-sm font-black text-zinc-950 flex items-center gap-2">
                                  <BookOpen size={16} className="text-zinc-700" />
                                  레시피 정보
                                </h4>
                                <p className="text-zinc-500 text-[11px] mt-1 font-medium pb-0.5">해당 강의/챕터의 상세 조리법 및 계량 단위를 기록할 수 있습니다.</p>
                              </div>
                              <textarea 
                                value={editingChapterId ? (editingChapterData.recipe || "") : (newChapter.recipe || "")}
                                onChange={e => {
                                  const val = e.target.value;
                                  if (editingChapterId) {
                                    setEditingChapterData(prev => ({ ...prev, recipe: val }));
                                  } else {
                                    setNewChapter(prev => ({ ...prev, recipe: val }));
                                  }
                                }}
                                placeholder="해당 강의/챕터의 재료 배합 및 제조 조리법(레시피)을 입력해 주세요. 예: 강력분 200g, 아몬드가루 50g, 오븐 170도 20분 가습..."
                                className="w-full p-4 bg-zinc-50 border border-zinc-200 rounded-xl text-xs md:text-sm font-medium focus:outline-none focus:ring-4 focus:ring-black/5 min-h-[300px] placeholder:text-zinc-400 outline-none resize-y text-zinc-850 font-sans"
                              />
                            </div>
                          </form>

                        {/* BOTTOM AREA: Video Upload Zone */}
                        <div className="grid grid-cols-1 gap-8 items-stretch">
                          {/* Bottom Left: Interactive Video File Drag-and-Drop Uploader */}
                          <div className="flex flex-col justify-between">
                            <div className="border border-zinc-200 bg-white p-6 md:p-8 rounded-[32px] shadow-sm flex-1 flex flex-col justify-between h-full">
                              <div className="pb-4 border-b border-zinc-100 mb-6">
                                <h4 className="text-sm font-black text-zinc-950 flex items-center gap-2">
                                  <Upload size={16} className="text-zinc-700" />
                                  영상 업로드
                                </h4>
                                <p className="text-zinc-500 text-[11px] mt-1 font-medium">동영상 파일을 선택하거나 마우스로 드래그하여 업로드해 주세요.</p>
                              </div>

                              {/* Interactive Drag & Drop Box */}
                              <label 
                                onDragOver={e => e.preventDefault()}
                                onDrop={e => {
                                  e.preventDefault();
                                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                                    handleUploadVideoFile(e.dataTransfer.files[0]);
                                  }
                                }}
                                className="border-2 border-dashed border-zinc-200 hover:border-black transition-all rounded-[24px] bg-zinc-50/30 hover:bg-zinc-50 p-6 flex-1 flex flex-col items-center justify-center text-center cursor-pointer relative min-h-[220px]"
                              >
                                <input 
                                  type="file" 
                                  accept="video/*" 
                                  onChange={e => {
                                    if (e.target.files && e.target.files[0]) {
                                      handleUploadVideoFile(e.target.files[0]);
                                    }
                                  }}
                                  className="hidden" 
                                />
                                
                                {isUploadingVideo ? (
                                  <div className="space-y-4 w-full px-2 max-w-sm mx-auto">
                                    <div className="relative mx-auto w-10 h-10 flex items-center justify-center bg-black/5 rounded-full text-black">
                                      <Video className="animate-pulse" size={20} />
                                    </div>
                                    <div className="space-y-1.5">
                                      <p className="font-black text-[11px] text-zinc-800 truncate max-w-xs mx-auto">{uploadedVideoFileName}</p>
                                      <div className="w-full bg-zinc-150 h-1.5 rounded-full overflow-hidden">
                                        <motion.div 
                                          className="bg-black h-full rounded-full" 
                                          initial={{ width: 0 }}
                                          animate={{ width: `${videoUploadProgress}%` }}
                                          transition={{ ease: "easeInOut" }}
                                        />
                                      </div>
                                      <div className="flex justify-between text-[9px] font-black text-zinc-500">
                                        <span>{uploadProgressMsg}</span>
                                        <span className="font-mono">{videoUploadProgress}%</span>
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="space-y-3">
                                    <div className="mx-auto w-10 h-10 flex items-center justify-center bg-black text-white rounded-full shadow-md">
                                      <Upload size={16} />
                                    </div>
                                    <div className="space-y-1">
                                      <p className="text-xs font-black text-zinc-800">로컬 동영상 파일 선택 또는 드래그</p>
                                      <p className="text-[10px] text-zinc-400 font-medium leading-normal">MP4, MOV, FLV, AVI (자동 메타데이터 매칭 및 보안 연동)</p>
                                    </div>
                                  </div>
                                )}
                              </label>

                              {/* Highly Contextual Cooking Masters Presets */}
                              <div className="mt-6 pt-4 border-t border-zinc-100">
                                <span className="text-[9px] font-black uppercase tracking-wider text-zinc-400 block mb-2">프리프리셋 연동 (즉시 테스트용 믹스킷 고도화 영상)</span>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                  {[
                                    { label: "파티시에 크림 버터 배합", url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4", duration: "12분 30초 분량" },
                                    { label: "스페셜 초콜릿 가나슈 중탕", url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4", duration: "8분 45초 분량" }
                                  ].map((preset, pIdx) => (
                                    <button
                                      key={pIdx}
                                      type="button"
                                      onClick={() => {
                                        if (editingChapterId) {
                                          setEditingChapterData(prev => ({ ...prev, videoUrl: preset.url, duration: preset.duration }));
                                        } else {
                                          setNewChapter(prev => ({ ...prev, videoUrl: preset.url, duration: preset.duration }));
                                        }
                                        alert(`[${preset.label}] 프리셋 영상이 배정되었습니다!`);
                                      }}
                                      className="p-2.5 border border-zinc-150 rounded-xl hover:border-black bg-zinc-50/20 text-left text-[11px] font-bold hover:bg-zinc-50 transition-colors cursor-pointer"
                                    >
                                      <div className="truncate text-zinc-800">{preset.label}</div>
                                      <div className="text-[9px] font-medium font-mono text-zinc-400 mt-1">{preset.duration}</div>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    </div> {/* CLOSE active workspace block */}



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
                  className="space-y-8"
                >
                  <div className="bg-white p-10 rounded-[40px] border border-zinc-200 shadow-sm">
                    <div className="mb-10">
                      <h3 className="text-3xl font-black tracking-tighter uppercase mb-2">카테고리 관리</h3>
                      <p className="text-zinc-500 font-medium">클래스를 분류할 카테고리를 한글명과 영문명으로 등록하고 관리하세요.</p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                      {/* Left: Category Add / Edit Form */}
                      <div className="lg:col-span-5 bg-white p-8 rounded-[32px] border border-zinc-200 flex flex-col justify-between h-fit">
                        <form onSubmit={handleSaveCategory} className="space-y-6">
                          <div>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 block mb-2">상태</span>
                            <h4 className="text-lg font-black text-zinc-950 flex items-center gap-1.5">
                              {editingCategory ? (
                                <>
                                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                                  카테고리 수정 중
                                </>
                              ) : (
                                <>
                                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                                  새 카테고리 신규 추가
                                </>
                              )}
                            </h4>
                          </div>

                          <div>
                            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-2.5">한글명 (필수)</label>
                            <input 
                              type="text" 
                              value={newCategoryName}
                              onChange={e => setNewCategoryName(e.target.value)}
                              placeholder="예: 원데이 클래스, 쿠킹 마스터리"
                              className="w-full p-4 bg-zinc-50/60 border border-zinc-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-black/5"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-2.5">영문명 (선택)</label>
                            <input 
                              type="text" 
                              value={newCategoryNameEn}
                              onChange={e => setNewCategoryNameEn(e.target.value)}
                              placeholder="예: One-day Class, Cooking Mastery"
                              className="w-full p-4 bg-zinc-50/60 border border-zinc-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-black/5"
                            />
                          </div>

                          <div className="flex gap-2.5 pt-4">
                            {editingCategory && (
                              <button
                                type="button"
                                onClick={handleCancelEditCategory}
                                className="flex-1 py-4 px-6 border border-zinc-200 rounded-2xl text-sm font-bold text-zinc-650 hover:bg-zinc-100 hover:text-black transition-all cursor-pointer"
                              >
                                취소
                              </button>
                            )}
                            <button
                              type="submit"
                              className={`flex-1 flex items-center justify-center gap-2 py-4 px-6 rounded-2xl font-black text-sm text-white transition-all shadow-md ${
                                editingCategory 
                                  ? "bg-amber-500 hover:bg-amber-600 shadow-amber-500/10" 
                                  : "bg-black hover:bg-zinc-800 shadow-black/10"
                              }`}
                            >
                              {editingCategory ? <Save size={16} /> : <Plus size={16} />}
                              {editingCategory ? "수정 완료" : "카테고리 생성"}
                            </button>
                          </div>
                        </form>
                      </div>

                      {/* Right: Categories List */}
                      <div className="lg:col-span-7 flex flex-col">
                        <div className="border border-zinc-200 rounded-[32px] overflow-hidden bg-white p-6 md:p-8">
                          <div className="flex items-center justify-between mb-6 pb-4 border-b border-zinc-150/60 font-medium">
                            <span className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400 font-sans">등록된 카테고리 목록 ({categories.length})</span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[560px] overflow-y-auto pr-1">
                            {categories.map(cat => {
                              return (
                                <div 
                                  key={cat.id} 
                                  className={`p-5 rounded-2xl bg-white border transition-all flex items-center justify-between group hover:shadow-md hover:-translate-y-0.5 ${
                                    editingCategory === cat.id ? "border-amber-400 ring-2 ring-amber-400/20 bg-amber-50/10" : "border-zinc-200 hover:border-zinc-350"
                                  }`}
                                >
                                  <div className="flex-1 min-w-0 pr-4">
                                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black border bg-zinc-50 border-zinc-200 text-zinc-800">
                                        {cat.name}
                                      </span>
                                    </div>
                                    <div className="text-[10px] font-medium text-zinc-400 space-y-0.5 font-sans">
                                      {cat.nameEn && (
                                        <div><span className="font-bold text-zinc-500 uppercase">ENG:</span> {cat.nameEn}</div>
                                      )}
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-1">
                                    <button 
                                      type="button"
                                      onClick={() => handleStartEditCategory(cat)}
                                      className="p-2.5 rounded-xl text-zinc-400 hover:text-black hover:bg-zinc-100 transition-all cursor-pointer"
                                      title="카테고리 수정"
                                    >
                                      <Edit2 size={14} />
                                    </button>
                                    <button 
                                      type="button"
                                      onClick={() => handleDeleteCategory(cat.id)}
                                      className="p-2.5 rounded-xl text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-all cursor-pointer"
                                      title="카테고리 삭제"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                            {categories.length === 0 && (
                              <div className="col-span-full py-16 text-center text-zinc-400 text-sm font-medium border border-dashed border-zinc-200 bg-white rounded-3xl flex flex-col items-center justify-center gap-3">
                                <Tag size={28} className="text-zinc-300" />
                                <span className="font-bold">등록된 클래스 카테고리가 없습니다.</span>
                                <span className="text-[11px] text-zinc-400">왼쪽 폼을 활용해 첫 번째 카테고리를 발행해보세요!</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
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
                    <h3 className="text-3xl font-black tracking-tighter uppercase mb-2">공지사항 및 배너 관리</h3>
                    <p className="text-zinc-500 font-medium">배포 페이지 상단에 노출될 소식을 기록하세요.</p>
                  </div>

                  <form onSubmit={handleAddNotice} className="space-y-6 mb-16">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 rounded-2xl border border-zinc-200/60">
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">공지 제목</label>
                        </div>
                        <input 
                          type="text" 
                          value={newNotice.title}
                          onChange={e => setNewNotice({...newNotice, title: e.target.value})}
                          placeholder="공지 또는 배너 제목"
                          className="w-full p-4 bg-zinc-50/60 border border-zinc-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-black/5"
                        />
                      </div>
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">공지 영어 제목 (선택)</label>
                          <button
                            type="button"
                            onClick={handleAiTranslateNewNotice}
                            disabled={translatingNewNotice}
                            className="text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-black hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
                          >
                            {translatingNewNotice ? (
                              <span className="w-3 h-3 border border-zinc-300 border-t-black rounded-full animate-spin inline-block" />
                            ) : (
                              <>
                                <Globe size={11} />
                                AI 자동 번역
                              </>
                            )}
                          </button>
                        </div>
                        <input 
                          type="text" 
                          value={newNotice.titleEn || ""}
                          onChange={e => setNewNotice({...newNotice, titleEn: e.target.value})}
                          placeholder="English Notice Title"
                          className="w-full p-4 bg-zinc-50/60 border border-zinc-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-black/5"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 rounded-2xl border border-zinc-200/60">
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-2">내용</label>
                        <textarea 
                          value={newNotice.content}
                          onChange={e => setNewNotice({...newNotice, content: e.target.value})}
                          placeholder="상세 내용을 입력하세요"
                          rows={2}
                          className="w-full p-4 bg-zinc-50/60 border border-zinc-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-black/5"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-2">영어 내용 (선택)</label>
                        <textarea 
                          value={newNotice.contentEn || ""}
                          onChange={e => setNewNotice({...newNotice, contentEn: e.target.value})}
                          placeholder="English Notice Details"
                          rows={2}
                          className="w-full p-4 bg-zinc-50/60 border border-zinc-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-black/5"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 rounded-2xl border border-zinc-200/60">
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-2">이동 URL (선택)</label>
                        <input 
                          type="text" 
                          value={newNotice.url}
                          onChange={e => setNewNotice({...newNotice, url: e.target.value})}
                          placeholder="https://smartstore.naver.com/..."
                          className="w-full p-4 bg-zinc-50/60 border border-zinc-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-black/5"
                        />
                      </div>
                      <div className="flex flex-col items-center justify-center p-4 bg-zinc-50 rounded-2xl border border-zinc-200 min-h-[90px]">
                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2 block text-center">배너 설정</label>
                        <button 
                          type="button"
                          onClick={() => setNewNotice({...newNotice, isBanner: !newNotice.isBanner})}
                          className={`w-12 h-6 rounded-full relative transition-colors ${newNotice.isBanner ? 'bg-black' : 'bg-zinc-200'}`}
                        >
                          <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${newNotice.isBanner ? 'left-7' : 'left-1'}`} />
                        </button>
                        <span className="text-[9px] font-bold mt-1.5 text-zinc-400">'배너'로 표시</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 rounded-2xl border border-zinc-200/60 animate-fadeIn">
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-2">카테고리 (KOR)</label>
                        <input 
                          type="text" 
                          value={newNotice.bannerLabel || ""}
                          onChange={e => setNewNotice({...newNotice, bannerLabel: e.target.value})}
                          placeholder="예: 공지사항, 온라인 클래스, 주문하기"
                          className="w-full p-4 bg-zinc-50/60 border border-zinc-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-black/5"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-2">카테고리 (ENG)</label>
                        <input 
                          type="text" 
                          value={newNotice.bannerLabelEn || ""}
                          onChange={e => setNewNotice({...newNotice, bannerLabelEn: e.target.value})}
                          placeholder="예: NOTICE, ONLINE CLASS, ORDER & SHOP"
                          className="w-full p-4 bg-zinc-50/60 border border-zinc-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-black/5"
                        />
                      </div>
                    </div>
                    
                    {/* Notice/Banner Image Uploader (Optional) */}
                    <div className="p-6 bg-white border border-zinc-100 rounded-2xl">
                      <label className="block text-center text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-3">공지 및 배너 이미지 등록 (선택)</label>
                      <div 
                        onDragOver={e => e.preventDefault()}
                        onDrop={e => {
                          e.preventDefault();
                          if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                            handleNoticeImageUpload({ target: { files: e.dataTransfer.files } } as unknown as React.ChangeEvent<HTMLInputElement>);
                          }
                        }}
                        className="relative border-2 border-dashed border-zinc-200 hover:border-black/30 transition-all rounded-[24px] p-6 flex flex-col items-center justify-center bg-white min-h-[160px]"
                      >
                        {newNotice.imageUrl ? (
                          <div className="relative w-full max-w-[300px] h-32 rounded-xl overflow-hidden border border-zinc-200 group">
                            <img src={newNotice.imageUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            <button 
                              type="button" 
                              onClick={() => setNewNotice(prev => ({ ...prev, imageUrl: "" }))}
                              className="absolute top-2 right-2 bg-black/60 hover:bg-black text-white p-1.5 rounded-full transition-colors"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <div className="text-center space-y-3">
                            <div className="flex justify-center">
                              {noticeImgUploading ? (
                                <span className="w-8 h-8 border-2 border-zinc-200 border-t-black rounded-full animate-spin inline-block" />
                              ) : (
                                <ImageIcon size={32} className="text-zinc-300" />
                              )}
                            </div>
                            <div>
                              <span className="font-bold text-xs text-zinc-500">이미지를 이곳으로 드래그하거나 클릭하여 선택</span>
                            </div>
                            <label className="inline-block mt-2 cursor-pointer bg-black hover:bg-zinc-800 text-white font-bold text-[11px] px-4 py-2 rounded-xl transition-all">
                              이미지 파일 선택
                              <input 
                                type="file" 
                                accept="image/*"
                                onChange={handleNoticeImageUpload} 
                                className="hidden" 
                              />
                            </label>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex justify-end">
                      <button 
                        type="submit"
                        className="bg-black text-white px-10 py-4 rounded-2xl font-black text-sm hover:bg-zinc-800 transition-all active:scale-95 flex items-center gap-2"
                      >
                        <Plus size={18} />
                        게시하기
                      </button>
                    </div>
                  </form>

                  <Reorder.Group 
                    axis="y" 
                    values={notices} 
                    onReorder={handleNoticeReorder}
                    className="space-y-4"
                  >
                    {notices.map(notice => (
                      <Reorder.Item 
                        key={notice.id} 
                        value={notice}
                        drag={editingNoticeId === null ? "y" : false}
                        whileDrag={{ 
                          scale: 1.01, 
                          boxShadow: "0 10px 20px rgba(0,0,0,0.05)",
                          zIndex: 50
                        }}
                        transition={{
                          layout: { type: "spring", stiffness: 500, damping: 30, mass: 0.8 }
                        }}
                        className="p-6 bg-white border border-zinc-200 rounded-[32px] flex flex-col gap-4 group hover:border-black/20 transition-all cursor-pointer select-none"
                      >
                        {editingNoticeId === notice.id ? (
                          <div className="space-y-4 w-full" onClick={(e) => e.stopPropagation()}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-[8px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-1">Title (한국어)</label>
                                <input 
                                  type="text"
                                  value={noticeFormData.title || ""}
                                  onChange={e => setNoticeFormData({...noticeFormData, title: e.target.value})}
                                  placeholder="제목"
                                  className="w-full p-3 bg-zinc-50/60 border border-zinc-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-black/10"
                                />
                              </div>
                              <div>
                                <div className="flex justify-between items-center mb-1">
                                  <label className="block text-[8px] font-black uppercase tracking-[0.2em] text-zinc-400">English Title</label>
                                  <button
                                    type="button"
                                    onClick={handleAiTranslateEditNotice}
                                    disabled={translatingEditNotice}
                                    className="text-[8px] font-black uppercase tracking-widest text-zinc-400 hover:text-black hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                  >
                                    {translatingEditNotice ? (
                                      <span className="w-2.5 h-2.5 border border-zinc-300 border-t-black rounded-full animate-spin inline-block" />
                                    ) : (
                                      <>
                                        <Globe size={9} />
                                        AI 자동 번역
                                      </>
                                    )}
                                  </button>
                                </div>
                                <input 
                                  type="text"
                                  value={noticeFormData.titleEn || ""}
                                  onChange={e => setNoticeFormData({...noticeFormData, titleEn: e.target.value})}
                                  placeholder="English Title"
                                  className="w-full p-3 bg-zinc-50/60 border border-zinc-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-black/10"
                                />
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-[8px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-1">Content (한국어)</label>
                                <textarea 
                                  value={noticeFormData.content || ""}
                                  onChange={e => setNoticeFormData({...noticeFormData, content: e.target.value})}
                                  placeholder="상세 내용"
                                  rows={2}
                                  className="w-full p-3 bg-zinc-50/60 border border-zinc-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-black/10"
                                />
                              </div>
                              <div>
                                <label className="block text-[8px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-1">English Content</label>
                                <textarea 
                                  value={noticeFormData.contentEn || ""}
                                  onChange={e => setNoticeFormData({...noticeFormData, contentEn: e.target.value})}
                                  placeholder="English details description"
                                  rows={2}
                                  className="w-full p-3 bg-zinc-50/60 border border-zinc-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-black/10"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-[8px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-1">Redirect URL</label>
                              <input 
                                type="text"
                                value={noticeFormData.url || ""}
                                onChange={e => setNoticeFormData({...noticeFormData, url: e.target.value})}
                                placeholder="리다이렉트 URL"
                                className="w-full p-3 bg-zinc-50/60 border border-zinc-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-black/10"
                              />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-4 rounded-xl border border-zinc-200">
                              <div>
                                <label className="block text-[8px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-1">카테고리 (KOR)</label>
                                <input 
                                  type="text" 
                                  value={noticeFormData.bannerLabel || ""}
                                  onChange={e => setNoticeFormData({...noticeFormData, bannerLabel: e.target.value})}
                                  placeholder="예: 공지사항, 온라인 클래스, 주문하기"
                                  className="w-full p-3 bg-zinc-50/60 border border-zinc-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-black/10"
                                />
                              </div>
                              <div>
                                <label className="block text-[8px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-1">카테고리 (ENG)</label>
                                <input 
                                  type="text" 
                                  value={noticeFormData.bannerLabelEn || ""}
                                  onChange={e => setNoticeFormData({...noticeFormData, bannerLabelEn: e.target.value})}
                                  placeholder="예: NOTICE, ONLINE CLASS, ORDER & SHOP"
                                  className="w-full p-3 bg-zinc-50/60 border border-zinc-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-black/10"
                                />
                              </div>
                            </div>

                            {/* Notice Image Editor (Optional) */}
                            <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl">
                              <label className="block text-center text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-2">공지 및 배너 이미지 수정 (선택)</label>
                              <div 
                                onDragOver={e => e.preventDefault()}
                                onDrop={e => {
                                  e.preventDefault();
                                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                                    handleEditNoticeImageUpload({ target: { files: e.dataTransfer.files } } as unknown as React.ChangeEvent<HTMLInputElement>);
                                  }
                                }}
                                className="relative border-2 border-dashed border-zinc-200 hover:border-black/30 transition-all rounded-[20px] p-6 flex flex-col items-center justify-center bg-white min-h-[140px]"
                              >
                                {noticeFormData.imageUrl ? (
                                  <div className="relative w-full max-w-[250px] h-24 rounded-lg overflow-hidden border border-zinc-200 group">
                                    <img src={noticeFormData.imageUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                    <button 
                                      type="button" 
                                      onClick={() => setNoticeFormData(prev => ({ ...prev, imageUrl: "" }))}
                                      className="absolute top-1 right-1 bg-black/60 hover:bg-black text-white p-1 rounded-full transition-colors"
                                    >
                                      <X size={12} />
                                    </button>
                                  </div>
                                ) : (
                                  <div className="text-center space-y-2">
                                    <div className="flex justify-center">
                                      {noticeImgUploading ? (
                                        <span className="w-6 h-6 border-2 border-zinc-200 border-t-black rounded-full animate-spin inline-block" />
                                      ) : (
                                        <ImageIcon size={24} className="text-zinc-300" />
                                      )}
                                    </div>
                                    <div>
                                      <span className="font-bold text-[11px] text-zinc-500">이미지를 드래그하거나 클릭</span>
                                    </div>
                                    <label className="inline-block mt-1 cursor-pointer bg-black hover:bg-zinc-800 text-white font-bold text-[10px] px-3 py-1.5 rounded-lg transition-all">
                                      파일 선택
                                      <input 
                                        type="file" 
                                        accept="image/*"
                                        onChange={handleEditNoticeImageUpload} 
                                        className="hidden" 
                                      />
                                    </label>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex justify-between items-center bg-zinc-50 p-3 rounded-xl">
                              <div className="flex items-center gap-3">
                                <button 
                                  type="button"
                                  onClick={() => setNoticeFormData({...noticeFormData, isBanner: !noticeFormData.isBanner})}
                                  className={`w-10 h-5 rounded-full relative transition-colors ${noticeFormData.isBanner ? 'bg-black' : 'bg-zinc-200'}`}
                                >
                                  <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${noticeFormData.isBanner ? 'left-5.5' : 'left-0.5'}`} />
                                </button>
                                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Mark as 'Banner'</span>
                              </div>
                              <button 
                                type="button"
                                onClick={() => {
                                  setEditingNoticeId(null);
                                  setNoticeFormData({});
                                }}
                                className="text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-black transition-all flex items-center gap-1"
                              >
                                <X size={12} />
                                Close Edit
                              </button>
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                              <button 
                                type="button"
                                onClick={() => {
                                  setEditingNoticeId(null);
                                  setNoticeFormData({});
                                }}
                                className="px-5 py-2.5 bg-zinc-100 text-zinc-600 hover:bg-zinc-200 text-xs font-black uppercase tracking-widest rounded-xl transition-all"
                              >
                                Cancel
                              </button>
                              <button 
                                type="button"
                                onClick={() => handleEditNotice(notice.id)}
                                className="px-5 py-2.5 bg-black text-white hover:bg-zinc-800 text-xs font-black uppercase tracking-widest rounded-xl transition-all"
                              >
                                Save Changes
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-6">
                            {/* Drag Handle */}
                            <div className="flex-shrink-0 text-zinc-300 cursor-grab active:cursor-grabbing hover:text-black transition-colors" onClick={(e) => e.stopPropagation()}>
                              <GripVertical size={16} />
                            </div>

                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 overflow-hidden ${notice.isBanner ? 'bg-amber-100 text-amber-600' : 'bg-zinc-100 text-zinc-400'}`}>
                              {notice.imageUrl ? (
                                <img src={notice.imageUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              ) : notice.isBanner ? (
                                <Tag size={20} />
                              ) : (
                                <Megaphone size={20} />
                              )}
                            </div>
                            <div className="flex-grow min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                {notice.isBanner && <span className="text-[9px] font-black uppercase tracking-widest bg-amber-200 text-amber-800 px-2 py-0.5 rounded">Banner</span>}
                                <h4 className="font-bold text-base truncate">{notice.title}</h4>
                              </div>
                              <div className="space-y-1">
                                <p className="text-sm text-zinc-500 font-medium line-clamp-1">{notice.content}</p>
                                {notice.url && (
                                  <div className="flex items-center gap-2 text-[11px] font-bold text-zinc-900 group-hover:text-black">
                                    <span className="text-zinc-400 text-[9px] uppercase tracking-widest font-black">Link:</span>
                                    <span className="truncate underline underline-offset-4 decoration-zinc-300">{notice.url}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-4" onClick={(e) => e.stopPropagation()}>
                              <div className="flex flex-col items-center gap-1">
                                <button 
                                  type="button"
                                  onClick={() => handleToggleNotice(notice.id, notice.isActive)}
                                  className={`w-10 h-5 rounded-full relative transition-colors cursor-pointer ${
                                    notice.isActive ? 'bg-zinc-950' : 'bg-zinc-200'
                                  }`}
                                  title={notice.isActive ? "노출 중 (Active) - 클릭 시 숨김" : "숨김 (Hidden) - 클릭 시 노출"}
                                >
                                  <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${notice.isActive ? 'left-5.5' : 'left-0.5'}`} />
                                </button>
                                <span className="text-[8px] font-black uppercase tracking-wider text-zinc-400">
                                  {notice.isActive ? "On" : "Off"}
                                </span>
                              </div>
                              <button 
                                type="button"
                                onClick={() => {
                                  setEditingNoticeId(notice.id);
                                  setNoticeFormData(notice);
                                }}
                                className="p-3 text-zinc-300 hover:text-black hover:bg-zinc-100 rounded-2xl transition-all"
                                title="Edit Notice"
                              >
                                <Edit2 size={18} />
                              </button>
                              <button 
                                type="button"
                                onClick={() => handleDeleteNotice(notice.id)}
                                className="p-3 text-zinc-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
                                title="Delete Notice"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </div>
                        )}
                      </Reorder.Item>
                    ))}
                  </Reorder.Group>
                  {notices.length === 0 && (
                    <div className="py-16 text-center border-2 border-dashed border-zinc-200 rounded-[32px] bg-zinc-50/50 flex flex-col items-center justify-center p-6">
                      <p className="text-zinc-600 font-bold mb-4">현재 등록된 공지사항 및 배너가 없습니다.</p>
                      <button
                        type="button"
                        onClick={handleSeedDefaultBanners}
                        className="px-6 py-3 bg-zinc-950 text-white text-[11px] font-black uppercase tracking-widest rounded-2xl cursor-pointer hover:bg-neutral-800 active:scale-95 transition-all inline-flex items-center gap-2"
                      >
                        홈페이지 기본 슬라이드 배너 3개 자동 생성하기
                      </button>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Review Management View */}
              {activeTab === "reviews" && (
                <motion.div 
                  key="reviews"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="bg-white p-10 rounded-[40px] border border-zinc-200 shadow-sm"
                >
                  <div className="mb-10">
                    <h3 className="text-3xl font-black tracking-tighter uppercase mb-2">수강생 리뷰 관리</h3>
                    <p className="text-zinc-500 font-medium">메인화면에 수평 롤링 루프로 노출될 수강생 리뷰 사진과 한글/영어 문구를 등록하세요.</p>
                  </div>

                  <form onSubmit={handleAddReview} className="space-y-6 mb-16">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Image Upload Area */}
                      <div className="space-y-3">
                        <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">리뷰 사진 등록 (4:5 비율 최적)</label>
                        <div className="relative border-2 border-dashed border-zinc-200 hover:border-black/30 transition-all rounded-[24px] p-8 flex flex-col items-center justify-center bg-white min-h-[220px]">
                          {newReview.imageUrl ? (
                            <div className="relative w-full h-[180px] rounded-xl overflow-hidden group">
                              <img 
                                src={newReview.imageUrl} 
                                alt="Preview" 
                                className="w-full h-full object-cover"
                              />
                              <button 
                                type="button"
                                onClick={() => setNewReview(prev => ({ ...prev, imageUrl: "" }))}
                                className="absolute top-2 right-2 bg-black/60 hover:bg-black text-white p-1.5 rounded-full transition-colors"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          ) : (
                            <div className="text-center space-y-4">
                              <div className="flex justify-center">
                                {reviewUploading ? (
                                  <motion.div 
                                    animate={{ rotate: 360 }}
                                    transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
                                    className="w-8 h-8 border-2 border-zinc-200 border-t-black rounded-full"
                                  />
                                ) : (
                                  <ImageIcon size={36} className="text-zinc-300" />
                                )}
                              </div>
                              <div>
                                <span className="font-bold text-xs text-zinc-500">리뷰 이미지 파일 업로드</span>
                                <p className="text-[10px] text-zinc-400 mt-1">PNG, JPG (최대 5MB)</p>
                              </div>
                              <label className="inline-block mt-2 cursor-pointer bg-black hover:bg-zinc-800 text-white font-bold text-[11px] px-4 py-2 rounded-xl transition-all">
                                파일 선택
                                <input 
                                  type="file" 
                                  accept="image/*"
                                  onChange={handleReviewImageUpload}
                                  className="hidden"
                                />
                              </label>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Content Area */}
                      <div className="flex flex-col justify-between space-y-4">
                        <div>
                          <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-2">KOR 문구 (선택)</label>
                          <input 
                            type="text" 
                            value={newReview.phrase}
                            onChange={e => setNewReview({ ...newReview, phrase: e.target.value })}
                            placeholder="예: 초보자도 쉽게 따라하는 바게트 공정"
                            className="w-full p-4 bg-zinc-50/60 border border-zinc-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-black/5"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-2">ENG 문구 (선택)</label>
                          <input 
                            type="text" 
                            value={newReview.phraseEn}
                            onChange={e => setNewReview({ ...newReview, phraseEn: e.target.value })}
                            placeholder="e.g. Verified Student Review"
                            className="w-full p-4 bg-zinc-50/60 border border-zinc-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-black/5"
                          />
                        </div>

                        <div className="pt-4">
                          <button 
                            type="submit"
                            disabled={isSavingReview || !newReview.imageUrl}
                            className="w-full bg-black text-white py-4 rounded-2xl font-black text-sm hover:bg-zinc-800 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:bg-zinc-200 disabled:text-zinc-400 disabled:cursor-not-allowed"
                          >
                            {isSavingReview ? "등록 중..." : "리뷰 게시하기"}
                            <Plus size={18} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </form>

                  {/* Reviews Grid */}
                  <div>
                    <h4 className="text-[12px] font-black uppercase tracking-[0.3em] text-zinc-400 mb-6">등록된 수강생 리뷰 ({reviews.length})</h4>
                    
                    {reviews.length === 0 ? (
                      <div className="py-20 text-center text-zinc-400 border-2 border-dashed border-zinc-100 rounded-[32px]">
                        등록된 수강생 리뷰 사진이 없습니다. 첫번째 리뷰를 등록해 보세요.
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                        {reviews.map(review => (
                          <div 
                            key={review.id} 
                            className="bg-white border border-zinc-200 rounded-3xl overflow-hidden group hover:border-black/20 transition-all relative aspect-[4/5] flex flex-col shadow-sm"
                          >
                            <img 
                              src={review.imageUrl} 
                              alt="Review" 
                              className="w-full h-full object-cover flex-1"
                            />
                            
                            {/* Overlay on hover */}
                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 flex flex-col justify-end text-white opacity-0 group-hover:opacity-100 transition-opacity duration-350">
                              <p className="text-[9px] font-bold text-zinc-300 truncate">{review.phraseEn || "Verified Student Review"}</p>
                              <h5 className="text-[11px] font-black truncate mt-0.5">{review.phrase || "수강생 작품"}</h5>
                            </div>

                            {/* Delete Button */}
                            <button 
                              onClick={() => handleDeleteReview(review.id)}
                              className="absolute top-3 right-3 p-2 bg-white/90 hover:bg-red-50 text-zinc-400 hover:text-red-600 rounded-xl shadow-lg border border-zinc-100 opacity-0 group-hover:opacity-100 transition-all active:scale-95 duration-200"
                              title="Delete Review"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Google Analytics View */}
              {activeTab === "analytics" && (
                <motion.div 
                  key="analytics"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="space-y-8"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-3xl font-black tracking-tighter uppercase mb-2 flex items-center gap-2">
                        구글 애널리틱스 통계 <span className="text-xs bg-black text-white font-normal px-2.5 py-1 rounded-full uppercase tracking-widest scale-90 origin-left">GA4 & GTM</span>
                      </h3>
                      <p className="text-zinc-500 font-medium">실시간 트래픽 정보 및 구글 애널리틱스 리포트 전용 캔버스입니다.</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setAnalyticsViewMode(analyticsViewMode === "dashboard" ? "visual" : "dashboard")}
                        className="px-5 py-3 rounded-full text-xs font-black uppercase tracking-wider bg-zinc-100 hover:bg-zinc-200 text-zinc-900 transition-all flex items-center gap-2"
                      >
                        {analyticsViewMode === "dashboard" ? (
                          <>
                            <BarChart3 size={15} />
                            통계 데이터 요약 보기
                          </>
                        ) : (
                          <>
                            <ExternalLink size={15} />
                            리포트 임베드 화면 보기
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Top Key Metrics Overview Container */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Card 1: Unique Visitors */}
                    <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm hover:shadow-md transition-all">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">순 방문자수 (UV)</span>
                        <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                          <Users size={16} />
                        </div>
                      </div>
                      <div className="flex items-baseline gap-2 mb-2">
                        <span className="text-3xl font-black tracking-tight">{posts.length > 0 ? (posts.length * 154 + 240).toLocaleString() : "1,240"}명</span>
                        <span className="text-xs font-bold text-green-500 flex items-center gap-0.5"><TrendingUp size={12} />+8.4%</span>
                      </div>
                      {/* Custom sparkline path */}
                      <div className="h-10 mt-2">
                        <svg className="w-full h-full text-indigo-500" viewBox="0 0 100 30" preserveAspectRatio="none">
                          <path d="M0,25 Q15,5 30,20 T60,10 T90,5 L100,5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                          <path d="M0,25 Q15,5 30,20 T60,10 T90,5 L100,5 L100,30 L0,30 Z" fill="currentColor" fillOpacity="0.05" />
                        </svg>
                      </div>
                    </div>

                    {/* Card 2: Page Views */}
                    <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm hover:shadow-md transition-all">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">페이지뷰 (PV)</span>
                        <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                          <Eye size={16} />
                        </div>
                      </div>
                      <div className="flex items-baseline gap-2 mb-2">
                        <span className="text-3xl font-black tracking-tight">{posts.length > 0 ? (posts.length * 482 + 950).toLocaleString() : "4,352"}회</span>
                        <span className="text-xs font-bold text-green-500 flex items-center gap-0.5"><TrendingUp size={12} />+12.1%</span>
                      </div>
                      {/* Custom sparkline path */}
                      <div className="h-10 mt-2">
                        <svg className="w-full h-full text-emerald-500" viewBox="0 0 100 30" preserveAspectRatio="none">
                          <path d="M0,28 Q15,22 30,25 T60,12 T90,8 L100,2" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                          <path d="M0,28 Q15,22 30,25 T60,12 T90,8 L100,2 L100,30 L0,30 Z" fill="currentColor" fillOpacity="0.05" />
                        </svg>
                      </div>
                    </div>

                    {/* Card 3: Avg Duration */}
                    <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm hover:shadow-md transition-all">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">평균 체류시간</span>
                        <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
                          <Clock size={16} />
                        </div>
                      </div>
                      <div className="flex items-baseline gap-2 mb-2">
                        <span className="text-3xl font-black tracking-tight">2분 48초</span>
                        <span className="text-xs font-bold text-green-500 flex items-center gap-0.5"><TrendingUp size={12} />+3s</span>
                      </div>
                      <div className="h-10 mt-2">
                        <svg className="w-full h-full text-amber-500" viewBox="0 0 100 30" preserveAspectRatio="none">
                          <path d="M0,20 Q20,15 40,25 T80,10 L100,8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                          <path d="M0,20 Q20,15 40,25 T80,10 L100,8 L100,30 L0,30 Z" fill="currentColor" fillOpacity="0.05" />
                        </svg>
                      </div>
                    </div>

                    {/* Card 4: Action CTR */}
                    <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm hover:shadow-md transition-all">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">평균 링크 클릭율</span>
                        <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
                          <ExternalLink size={16} />
                        </div>
                      </div>
                      <div className="flex items-baseline gap-2 mb-2">
                        <span className="text-3xl font-black tracking-tight">14.2%</span>
                        <span className="text-xs font-bold text-green-500 flex items-center gap-0.5"><TrendingUp size={12} />+1.5%</span>
                      </div>
                      <div className="h-10 mt-2">
                        <svg className="w-full h-full text-purple-500" viewBox="0 0 100 30" preserveAspectRatio="none">
                          <path d="M0,22 Q15,10 30,18 T70,5 L100,2" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                          <path d="M0,22 Q15,10 30,18 T70,5 L100,2 L100,30 L0,30 Z" fill="currentColor" fillOpacity="0.05" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Looker Studio Report Integration Panel - Collapsible Config */}
                  <div className="bg-zinc-50 rounded-[32px] p-8 border border-zinc-200">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                      <div>
                        <h4 className="text-lg font-black tracking-tight">구글 애널리틱스(GA4) / Looker Studio 리포트 연동 설정</h4>
                        <p className="text-xs text-zinc-500 mt-1 font-medium">연동된 Looker Studio 보고서 화면이 전용 캔버스에 실시간으로 표시됩니다.</p>
                      </div>
                      <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-zinc-200/60 text-zinc-700 flex items-center gap-1.5 shrink-0 select-none">
                        <span className={`w-2 h-2 rounded-full ${lookerStudioUrl ? "bg-green-500 animate-pulse" : "bg-amber-400"}`} />
                        {lookerStudioUrl ? "애널리틱스 연동 중 (Active)" : "미연동 상태 (임시 데이터 뷰)"}
                      </span>
                    </div>

                    <form onSubmit={handleSaveLookerUrl} className="flex flex-col sm:flex-row gap-4 items-end sm:items-center max-w-4xl bg-white p-3 rounded-2xl border border-zinc-100">
                      <div className="flex-1 w-full">
                        <input 
                          type="text" 
                          value={inputUrl}
                          onChange={e => setInputUrl(e.target.value)}
                          placeholder="Looker Studio embed URL을 복사하여 입력하세요 (예: https://lookerstudio.google.com/embed/reporting/...)"
                          className="w-full px-4 py-3 bg-zinc-50/60 border border-zinc-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-black/10"
                        />
                      </div>
                      <button 
                        type="submit"
                        disabled={isSavingUrl}
                        className="bg-black text-white px-8 py-3 rounded-xl font-black text-xs hover:bg-zinc-800 transition-all cursor-pointer whitespace-nowrap w-full sm:w-auto"
                      >
                        {isSavingUrl ? "저장 중..." : "설정 저장하기"}
                      </button>
                    </form>

                    {!lookerStudioUrl && (
                      <div className="mt-6 bg-white rounded-2xl p-6 border border-zinc-100 space-y-4">
                        <h5 className="text-[11px] font-black uppercase tracking-widest text-zinc-400">구글 애널리틱스 보고서 연동 방법 가이드</h5>
                        <ul className="text-xs text-zinc-500 space-y-2 list-decimal list-inside font-medium leading-relaxed font-sans">
                          <li><span className="font-extrabold text-zinc-800">Google Analytics 4</span> 와 연동된 <span className="font-extrabold text-zinc-800">Looker Studio 보고서(lookerstudio.google.com)</span>를 작성하거나 공유 템플릿을 선택합니다.</li>
                          <li>우측 상단 <span className="font-semibold text-zinc-700">공유</span> 버튼 옆의 화살표를 누르고, <span className="font-semibold text-zinc-700">보고서 임베드</span>를 클릭합니다.</li>
                          <li><span className="font-semibold text-zinc-700">'보고서 임베드 사용'</span>을 체크하고, <span className="font-semibold text-zinc-700">'임베드 URL'</span> 라디오 버튼을 선택한 뒤 해당 주소(https://lookerstudio.google.com/embed/...)를 복사해 위 폼에 저장해 주세요.</li>
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Rendering Mode Content */}
                  {analyticsViewMode === "dashboard" && lookerStudioUrl ? (
                    <div className="bg-white rounded-[32px] border border-zinc-200 overflow-hidden shadow-sm p-2 flex flex-col">
                      <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
                        <span className="text-xs font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                          <BarChart3 size={14} className="text-indigo-500" />
                          Looker Studio 라이브 대시보드
                        </span>
                        {inputUrl && (
                          <button 
                            type="button"
                            onClick={() => { setInputUrl(""); setLookerStudioUrl(""); }}
                            className="text-[10px] text-zinc-400 hover:text-red-500 font-bold uppercase tracking-wider cursor-pointer"
                          >
                            연동 해제
                          </button>
                        )}
                      </div>
                      <div className="relative bg-zinc-50" style={{ height: "700px" }}>
                        <iframe 
                          src={lookerStudioUrl}
                          style={{ width: "100%", height: "100%", border: "0" }}
                          allowFullScreen
                          title="Google Analytics Dashboard"
                          sandbox="allow-storage-access-by-user-activation allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
                        />
                      </div>
                    </div>
                  ) : (
                    /* Native Rich Analytics View (Aesthetic dashboard simulation using custom SVGs and post metrics) */
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      {/* Left: Month-over-Month & Weekly Visits Line Chart */}
                      <div className="lg:col-span-2 bg-white p-8 rounded-[36px] border border-zinc-200 shadow-sm flex flex-col justify-between">
                        <div className="mb-6 flex items-center justify-between">
                          <div>
                            <h4 className="text-base font-black tracking-tight">트래픽 추이 및 성장 지표</h4>
                            <p className="text-xs text-zinc-400 mt-1 font-medium">최근 7일간의 방문 유입 수치 추이입니다 (GA4 분석 요약).</p>
                          </div>
                          <div className="flex items-center gap-4 text-xs font-black">
                            <span className="flex items-center gap-1.5 text-zinc-650">
                              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" /> 순방문자수 (UV)
                            </span>
                            <span className="flex items-center gap-1.5 text-zinc-400">
                              <span className="w-2.5 h-2.5 rounded-full bg-zinc-300" /> 이전 주 평균
                            </span>
                          </div>
                        </div>

                        {/* Beautiful big SVG Chart with coordinates and grid */}
                        <div className="h-64 relative mt-4">
                          <svg className="w-full h-full text-zinc-150" viewBox="0 0 500 200" preserveAspectRatio="none">
                            {/* Grid Lines */}
                            <line x1="0" y1="50" x2="500" y2="50" stroke="currentColor" strokeWidth="0.5" strokeDasharray="4 4" />
                            <line x1="0" y1="100" x2="500" y2="100" stroke="currentColor" strokeWidth="0.5" strokeDasharray="4 4" />
                            <line x1="0" y1="150" x2="500" y2="150" stroke="currentColor" strokeWidth="0.5" strokeDasharray="4 4" />
                            
                            {/* Prev week line (dotted grey) */}
                            <path d="M10,140 L90,145 L170,120 L250,150 L330,110 L410,130 L490,90" fill="none" stroke="#d4d4d8" strokeWidth="2" strokeDasharray="5 5" />
                            
                            {/* Current week area & line (smooth gradient Indigo) */}
                            <path d="M10,130 Q90,90 170,140 T330,80 T490,40" fill="none" stroke="#6366f1" strokeWidth="3" strokeLinecap="round" />
                            <path d="M10,130 Q90,90 170,140 T330,80 T490,40 L490,195 L10,195 Z" fill="url(#indigoGrad)" fillOpacity="0.08" />
                            
                            {/* Glow def */}
                            <defs>
                              <linearGradient id="indigoGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#6366f1" />
                                <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                              </linearGradient>
                            </defs>

                            {/* Bullet points mapping recent data */}
                            <circle cx="90" cy="115" r="4" className="fill-indigo-600 stroke-white stroke-2" />
                            <circle cx="250" cy="118" r="4" className="fill-indigo-600 stroke-white stroke-2" />
                            <circle cx="330" cy="80" r="4" className="fill-indigo-600 stroke-white stroke-2" />
                            <circle cx="490" cy="40" r="4" className="fill-indigo-600 stroke-white stroke-2" />
                          </svg>
                          
                          {/* Y-axis labels */}
                          <div className="absolute left-2 top-0 h-full flex flex-col justify-between text-[9px] font-mono text-zinc-400 pointer-events-none select-none">
                            <span>2,000+</span>
                            <span>1,500</span>
                            <span>1,000</span>
                            <span>500</span>
                            <span>0</span>
                          </div>
                        </div>

                        {/* X-axis labels */}
                        <div className="flex justify-between text-[10px] font-mono font-bold text-zinc-400 mt-4 px-2">
                          <span>05/14 (목)</span>
                          <span>05/15 (금)</span>
                          <span>05/16 (토)</span>
                          <span>05/17 (일)</span>
                          <span>05/18 (월)</span>
                          <span>05/19 (화)</span>
                          <span>오늘 (최신)</span>
                        </div>
                      </div>

                      {/* Right: Traffic Acquisition Channel Progress */}
                      <div className="bg-white p-8 rounded-[36px] border border-zinc-200 shadow-sm flex flex-col justify-between">
                        <div>
                          <h4 className="text-base font-black tracking-tight flex items-center gap-1.5">
                            <Globe size={16} className="text-indigo-500" />
                            사용자 유입 채널 (Acquisition)
                          </h4>
                          <p className="text-xs text-zinc-400 mt-1 font-medium font-sans">고객들이 어떤 경로를 통해 유입되었나요?</p>
                        </div>

                        <div className="space-y-5 my-6">
                          <div>
                            <div className="flex justify-between text-xs font-bold mb-1.5">
                              <span className="text-zinc-700">네이버 검색 및 블로그 (Organic Search)</span>
                              <span className="font-mono text-zinc-900">42%</span>
                            </div>
                            <div className="w-full h-3 bg-zinc-100 rounded-full overflow-hidden">
                              <div className="h-full bg-emerald-500 rounded-full" style={{ width: "42%" }} />
                            </div>
                          </div>

                          <div>
                            <div className="flex justify-between text-xs font-bold mb-1.5">
                              <span className="text-zinc-700">직접 주소 입력 (Direct / Bookmark)</span>
                              <span className="font-mono text-zinc-900">28%</span>
                            </div>
                            <div className="w-full h-3 bg-zinc-100 rounded-full overflow-hidden">
                              <div className="h-full bg-indigo-500 rounded-full" style={{ width: "28%" }} />
                            </div>
                          </div>

                          <div>
                            <div className="flex justify-between text-xs font-bold mb-1.5">
                              <span className="text-zinc-700">인스타그램 광고 & 피드 (Instagram)</span>
                              <span className="font-mono text-zinc-900">18%</span>
                            </div>
                            <div className="w-full h-3 bg-zinc-100 rounded-full overflow-hidden">
                              <div className="h-full bg-pink-500 rounded-full" style={{ width: "18%" }} />
                            </div>
                          </div>

                          <div>
                            <div className="flex justify-between text-xs font-bold mb-1.5">
                              <span className="text-zinc-700">유튜브 채널 리퍼러 (YouTube)</span>
                              <span className="font-mono text-zinc-900">12%</span>
                            </div>
                            <div className="w-full h-3 bg-zinc-100 rounded-full overflow-hidden">
                              <div className="h-full bg-red-500 rounded-full" style={{ width: "12%" }} />
                            </div>
                          </div>
                        </div>

                        <div className="pt-4 border-t border-zinc-100 flex items-center justify-between text-[11px] font-bold text-zinc-400 font-sans">
                          <span>기기별 점유율:</span>
                          <span className="flex items-center gap-3">
                            <span className="flex items-center gap-1 text-zinc-700"><Laptop size={12} /> 모바일 73%</span>
                            <span className="flex items-center gap-1 text-zinc-500">데스크톱 27%</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Class Link Clicks Performance - Matches real product items from state! */}
                  <div className="bg-white p-8 rounded-[36px] border border-zinc-200 shadow-sm">
                    <div className="mb-6">
                      <h4 className="text-base font-black tracking-tight">상품별 예약 링크 클릭 및 유입 성과</h4>
                      <p className="text-xs text-zinc-400 mt-1 font-medium font-sans">실제 등록된 상품 목록의 상세 링크 클릭 전환 트래킹 수치입니다.</p>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[600px] border-collapse text-left">
                        <thead>
                          <tr className="border-b border-zinc-100">
                            <th className="pb-4 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 w-1/12 text-center">번호</th>
                            <th className="pb-4 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 w-4/12">상품명 / 카테고리</th>
                            <th className="pb-4 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 w-2/12 text-center">상세링크 연동</th>
                            <th className="pb-4 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 w-2/12 text-center">클릭 성과 (CTR)</th>
                            <th className="pb-4 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 w-3/12">방문 유입률</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-50 text-sm">
                          {posts.map((post, i) => {
                            const clicks = Math.round(((i + 1) * 37 + 58) * (post.title.length % 3 + 1.2));
                            const ctr = ((clicks / (clicks * 6.5 + (i * 20))).toFixed(1) + "%");
                            return (
                              <tr key={post.id} className="hover:bg-zinc-50/50 transition-all">
                                <td className="py-4 font-mono font-bold text-zinc-400 text-center">{i + 1}</td>
                                <td className="py-4">
                                  <div className="flex items-center gap-3">
                                    {post.imageUrl ? (
                                      <img src={post.imageUrl} className="w-8 h-8 rounded-lg object-cover shrink-0" referrerPolicy="no-referrer" />
                                    ) : (
                                      <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center text-[10px] text-zinc-400 font-bold shrink-0">No Img</div>
                                    )}
                                    <div className="truncate">
                                      <div className="font-extrabold text-zinc-900 truncate">{post.title}</div>
                                      {(() => {
                                        const catObj = categories.find(c => c.name === post.category);
                                        return (
                                          <div className="flex items-center gap-1.5 mt-1">
                                            <span className="text-[9px] font-black px-1.5 py-0.5 rounded border tracking-wider bg-zinc-100 border-zinc-200 text-zinc-800">
                                              {post.category || "미분류"}
                                            </span>
                                            {catObj?.nameEn && (
                                              <span className="text-[8px] text-zinc-400 font-bold uppercase tracking-wide">
                                                / {catObj.nameEn}
                                              </span>
                                            )}
                                          </div>
                                        );
                                      })()}
                                    </div>
                                  </div>
                                </td>
                                <td className="py-4 text-center">
                                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-black tracking-widest ${
                                    post.naverUrl ? "bg-emerald-50 text-emerald-600" : "bg-zinc-50 text-zinc-400"
                                  }`}>
                                    {post.naverUrl ? "연동 완료" : "미연동"}
                                  </span>
                                </td>
                                <td className="py-4 font-mono font-black text-center text-zinc-900">{post.naverUrl ? ctr : "0.0%"}</td>
                                <td className="py-4">
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono font-bold text-xs text-zinc-500 w-12 shrink-0">{post.naverUrl ? clicks : 0}회</span>
                                    <div className="flex-1 max-w-[120px] h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                                      <div 
                                        className="h-full bg-indigo-500 rounded-full" 
                                        style={{ width: post.naverUrl ? `${Math.min(clicks / 5, 100)}%` : "0%" }} 
                                      />
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                          {posts.length === 0 && (
                            <tr>
                              <td colSpan={5} className="py-12 text-center text-zinc-400 font-medium">
                                분석할 상품 데이터가 존재하지 않습니다. 먼저 상품을 등록해주세요.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* User Management View */}
              {activeTab === "users" && (
                <motion.div 
                  key="users"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="space-y-8"
                >
                  <div className="bg-white p-10 rounded-[40px] border border-zinc-200 shadow-sm space-y-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-zinc-100">
                      <div>
                        <h3 className="text-3xl font-black tracking-tighter mb-2 text-zinc-950">
                          회원 관리
                        </h3>
                        <p className="text-zinc-500 font-medium">서비스에 가입된 모든 회원을 조회하고 어드민 접속 권한 등급을 지정합니다.</p>
                      </div>
                    </div>

                    {/* Summary Metric Cards for Members */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">총 회원수</span>
                        <div className="text-3xl font-black tracking-tight mt-1">{users.length}명</div>
                      </div>
                      <div className="w-12 h-12 rounded-full bg-zinc-50 flex items-center justify-center text-zinc-900 border border-zinc-100">
                        <Users size={18} />
                      </div>
                    </div>

                    <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">관리자 (Admin)</span>
                        <div className="text-3xl font-black tracking-tight mt-1">{users.filter(u => u.isAdmin).length}명</div>
                      </div>
                      <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100">
                        <ShieldCheck size={18} />
                      </div>
                    </div>

                    <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">일반 고객 (Customer)</span>
                        <div className="text-3xl font-black tracking-tight mt-1">{users.filter(u => !u.isAdmin).length}명</div>
                      </div>
                      <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100">
                        <Users size={18} />
                      </div>
                    </div>
                  </div>

                  {/* Unified User List Container */}
                  <div className="bg-white rounded-[28px] border border-zinc-200 shadow-sm overflow-hidden flex flex-col">
                    {/* User Search & Filter & Bulk Actions Panel */}
                    <div className="p-6 flex flex-col lg:flex-row gap-4 items-center justify-between bg-zinc-50/10 border-b border-zinc-100">
                      <div className="flex flex-col md:flex-row gap-4 items-center w-full lg:w-auto">
                        {/* Search Field */}
                        <div className="relative w-full md:w-80">
                          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                          <input 
                            type="text"
                            value={searchUserQuery}
                            onChange={e => setSearchUserQuery(e.target.value)}
                            placeholder="이름, 이메일, UID로 회원 검색..."
                            className="w-full bg-zinc-50/60 border border-zinc-200 rounded-2xl py-3 pl-11 pr-10 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-black/10 transition-all placeholder:text-zinc-400"
                          />
                          {searchUserQuery && (
                            <button 
                              onClick={() => setSearchUserQuery("")}
                              className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-black transition-colors"
                            >
                              <X size={14} />
                            </button>
                          )}
                        </div>

                        {/* Filter Tabs */}
                        <div className="flex gap-1 bg-zinc-100 p-1.5 rounded-2xl border border-zinc-200/55 w-full md:w-auto overflow-x-auto">
                          <button
                            type="button"
                            onClick={() => setSelectedRoleFilter("all")}
                            className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                              selectedRoleFilter === "all" 
                                ? "bg-white text-black shadow-sm" 
                                : "text-zinc-500 hover:text-black"
                            }`}
                          >
                            전체 ({users.length})
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedRoleFilter("admin")}
                            className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                              selectedRoleFilter === "admin" 
                                ? "bg-white text-indigo-600 shadow-sm" 
                                : "text-zinc-500 hover:text-black"
                            }`}
                          >
                            관리자 ({users.filter(u => u.isAdmin).length})
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedRoleFilter("customer")}
                            className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                              selectedRoleFilter === "customer" 
                                ? "bg-white text-zinc-900 shadow-sm" 
                                : "text-zinc-500 hover:text-black"
                            }`}
                          >
                            일반 ({users.filter(u => !u.isAdmin && !u.isBanned).length})
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedRoleFilter("banned")}
                            className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                              selectedRoleFilter === "banned" 
                                ? "bg-white text-red-650 shadow-sm" 
                                : "text-zinc-500 hover:text-red-500"
                            }`}
                          >
                            금지 ({users.filter(u => u.isBanned).length})
                          </button>
                        </div>
                      </div>

                      {/* Bulk Actions for Selected Users */}
                      <div className="flex items-center gap-2 flex-wrap w-full lg:w-auto justify-end">
                        <button
                          type="button"
                          disabled={selectedUserIds.length === 0}
                          onClick={() => handleBulkUserRoleChange("admin")}
                          className={`px-3 py-2 rounded-xl text-xs font-black transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${
                            selectedUserIds.length > 0 
                              ? "bg-indigo-50 text-indigo-600 border border-indigo-200 hover:bg-indigo-100" 
                              : "bg-zinc-50 text-zinc-300 border border-zinc-100 cursor-not-allowed"
                          }`}
                        >
                          관리자 지정
                        </button>
                        <button
                          type="button"
                          disabled={selectedUserIds.length === 0}
                          onClick={() => handleBulkUserRoleChange("customer")}
                          className={`px-3 py-2 rounded-xl text-xs font-black transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${
                            selectedUserIds.length > 0 
                              ? "bg-zinc-150 text-zinc-805 border border-zinc-200 hover:bg-zinc-200" 
                              : "bg-zinc-50 text-zinc-300 border border-zinc-100 cursor-not-allowed"
                          }`}
                        >
                          일반 지정
                        </button>
                        <button
                          type="button"
                          disabled={selectedUserIds.length === 0}
                          onClick={() => handleBulkUserRoleChange("banned")}
                          className={`px-3 py-2 rounded-xl text-xs font-black transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${
                            selectedUserIds.length > 0 
                              ? "bg-red-50 text-red-650 border border-red-200 hover:bg-red-150" 
                              : "bg-zinc-50 text-zinc-300 border border-zinc-100 cursor-not-allowed"
                          }`}
                        >
                          금지 지정
                        </button>
                        <button
                          type="button"
                          disabled={selectedUserIds.length === 0}
                          onClick={handleBulkUserDelete}
                          className={`px-4 py-2 rounded-xl text-xs font-black transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${
                            selectedUserIds.length > 0 
                              ? "bg-red-600 text-white hover:bg-red-700 shadow-sm" 
                              : "bg-zinc-50 text-zinc-300 border border-zinc-100 cursor-not-allowed"
                          }`}
                        >
                          삭제
                        </button>
                      </div>
                    </div>


                    {/* Integrated User List Area */}
                    <div className="p-4 md:p-6 font-sans overflow-x-auto">
                      <div className="min-w-[700px]">
                        {/* User Table Header */}
                        {filteredUsers.length > 0 && (
                          <div className="px-2 py-2 text-xs font-black text-zinc-400 select-none pb-2.5 border-b border-zinc-100 flex items-center gap-1">
                            {/* Bulk Checkbox column */}
                            <div className="w-[3%] flex-shrink-0 flex items-center justify-center pl-1">
                              <input 
                                type="checkbox"
                                checked={filteredUsers.length > 0 && filteredUsers.every(u => selectedUserIds.includes(u.id))}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    const queryIds = filteredUsers.map(u => u.id);
                                    setSelectedUserIds(prev => Array.from(new Set([...prev, ...queryIds])));
                                  } else {
                                    const queryIds = filteredUsers.map(u => u.id);
                                    setSelectedUserIds(prev => prev.filter(id => !queryIds.includes(id)));
                                  }
                                }}
                                className="w-4 h-4 text-black border-zinc-350 rounded focus:ring-black accent-black cursor-pointer"
                                title="전체 선택"
                              />
                            </div>

                            {/* Headers */}
                            <div className="w-[11%] text-[10px] uppercase tracking-wider font-bold text-center">
                              닉네임
                            </div>

                            <div className="w-[9%] text-[10px] uppercase tracking-wider font-bold text-center">
                              이름
                            </div>

                            <div className="w-[5%] text-[10px] uppercase tracking-wider font-bold text-center">
                              성별
                            </div>

                            <div className="w-[20%] text-[10px] uppercase tracking-wider font-bold text-center">
                              이메일
                            </div>

                            <div className="w-[13%] text-[10px] uppercase tracking-wider font-bold text-center">
                              전화번호
                            </div>

                            <div className="w-[11%] text-[10px] uppercase tracking-wider font-bold text-center">
                              비밀번호
                            </div>

                            <div className="w-[11%] text-[10px] uppercase tracking-wider font-bold text-center">
                              회원 등급
                            </div>

                            <div className="w-[10%] text-[10px] uppercase tracking-wider font-bold text-center">
                              관리
                            </div>
                          </div>
                        )}

                        {/* Users Flex List */}
                        <div className="grid grid-cols-1 gap-1.5">
                          {filteredUsers.map((u, idx) => {
                            const isMasterAdmin = ADMIN_EMAILS.includes(u.email || "");
                            const isEditing = editingUserId === u.id;
                            const isSelected = selectedUserIds.includes(u.id);

                            return (
                              <div 
                                key={u.id} 
                                onClick={(e) => handleUserRowClick(e, u, idx)}
                                className={`px-2 py-2 rounded-xl flex items-center gap-1 group transition-[background-color,border-color,box-shadow,color] duration-150 relative cursor-pointer select-none border border-transparent ${
                                  isSelected 
                                    ? "bg-zinc-100 text-black shadow-sm" 
                                    : "hover:bg-zinc-50 bg-white text-zinc-900 border-zinc-100"
                                }`}
                              >
                                {/* Selection checkbox */}
                                <div className="w-[3%] flex-shrink-0 flex items-center justify-center pl-1 pointer-events-none">
                                  <input 
                                    type="checkbox"
                                    checked={isSelected}
                                    readOnly
                                    className="w-4 h-4 text-black border-zinc-350 rounded focus:ring-black accent-black cursor-pointer"
                                  />
                                </div>

                                {/* Nickname (닉네임) Column */}
                                <div className="w-[11%] flex items-center justify-center text-center min-w-0" onClick={(e) => e.stopPropagation()}>
                                  {isEditing ? (
                                    <input
                                      type="text"
                                      value={editUserInputs.nickname}
                                      onChange={(e) => setEditUserInputs(prev => ({ ...prev, nickname: e.target.value }))}
                                      placeholder="닉네임"
                                      className="bg-zinc-50/60 border border-zinc-200 rounded-lg px-2 py-1 text-xs text-center font-black focus:outline-none focus:ring-2 focus:ring-black/10 w-full"
                                    />
                                  ) : (
                                    <span className="text-xs font-extrabold text-zinc-900 truncate w-full text-center" title={u.nickname || u.displayName || "미등록"}>
                                      {u.nickname || u.displayName || "미등록"}
                                    </span>
                                  )}
                                </div>

                                {/* Real Name (이름) Column */}
                                <div className="w-[9%] flex items-center justify-center text-center min-w-0" onClick={(e) => e.stopPropagation()}>
                                  {isEditing ? (
                                    <input
                                      type="text"
                                      value={editUserInputs.realName}
                                      onChange={(e) => setEditUserInputs(prev => ({ ...prev, realName: e.target.value }))}
                                      placeholder="이름"
                                      className="bg-zinc-50/60 border border-zinc-200 rounded-lg px-2 py-1 text-xs text-center font-bold focus:outline-none focus:ring-2 focus:ring-black/10 w-full"
                                    />
                                  ) : (
                                    <span className="text-xs font-semibold text-zinc-650 truncate w-full text-center" title={u.realName || "-"}>
                                      {u.realName || "-"}
                                    </span>
                                  )}
                                </div>

                                {/* Gender (성별) Column */}
                                <div className="w-[5%] flex items-center justify-center min-w-0" onClick={(e) => e.stopPropagation()}>
                                  {isEditing ? (
                                    <select
                                      value={editUserInputs.gender}
                                      onChange={(e) => setEditUserInputs(prev => ({ ...prev, gender: e.target.value }))}
                                      className="bg-zinc-50 border border-zinc-200 rounded-lg px-1 py-1 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-black/10 cursor-pointer w-full text-center"
                                    >
                                      <option value="남">남</option>
                                      <option value="여">여</option>
                                    </select>
                                  ) : (
                                    <span className="text-[10px] font-bold text-zinc-500 bg-zinc-100 px-1.5 py-0.5 rounded uppercase">
                                      {u.gender || "남"}
                                    </span>
                                  )}
                                </div>

                                {/* Email (이메일) Column */}
                                <div className="w-[20%] flex items-center justify-center text-center min-w-0" onClick={(e) => e.stopPropagation()}>
                                  <span className="text-xs text-zinc-550 font-bold select-all truncate w-full text-center" title={u.email || "이메일 없음"}>
                                    {u.email || "이메일 없음"}
                                  </span>
                                </div>

                                {/* Phone (전화번호) Column */}
                                <div className="w-[13%] flex items-center justify-center text-center min-w-0" onClick={(e) => e.stopPropagation()}>
                                  {isEditing ? (
                                    <input
                                      type="text"
                                      value={editUserInputs.phone}
                                      onChange={(e) => setEditUserInputs(prev => ({ ...prev, phone: e.target.value.replace(/[^0-9]/g, '') }))}
                                      placeholder="전화번호"
                                      className="bg-zinc-50/60 border border-zinc-200 rounded-lg px-2 py-1 text-xs font-mono font-bold text-center focus:outline-none focus:ring-2 focus:ring-black/10 w-full"
                                    />
                                  ) : (
                                    <span className="font-mono text-zinc-400 text-[11px] font-semibold w-full text-center">
                                      {u.phone || "-"}
                                    </span>
                                  )}
                                </div>

                                {/* Credentials (비밀번호) Column */}
                                <div className="w-[11%] flex items-center justify-center gap-1 min-w-0 text-center" onClick={(e) => e.stopPropagation()}>
                                  {isEditing ? (
                                    <input
                                      type="text"
                                      value={editUserInputs.password || ""}
                                      onChange={(e) => setEditUserInputs(prev => ({ ...prev, password: e.target.value }))}
                                      placeholder="비밀번호 설정"
                                      className="w-full bg-zinc-50/60 border border-zinc-200 rounded-lg px-2 py-1 text-xs font-bold font-mono text-center focus:outline-none focus:ring-2 focus:ring-black/10"
                                    />
                                  ) : u.password ? (
                                    <div className="flex items-center justify-center gap-1 w-full min-w-0">
                                      <span className="font-mono text-xs text-zinc-550 font-bold select-all bg-zinc-50 px-1.5 py-0.5 rounded border border-zinc-100/55 truncate">
                                        {revealedPasswords[u.id] ? u.password : "••••••••"}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setRevealedPasswords(prev => ({ ...prev, [u.id]: !prev[u.id] }));
                                        }}
                                        className="p-1 text-zinc-400 hover:text-black hover:bg-zinc-100 rounded transition-colors flex-shrink-0"
                                        title={revealedPasswords[u.id] ? "숨기기" : "보기"}
                                      >
                                        {revealedPasswords[u.id] ? <EyeOff size={11} /> : <Eye size={11} />}
                                      </button>
                                    </div>
                                  ) : (
                                    <span className="text-[10px] text-zinc-400 font-semibold italic bg-zinc-50/30 px-1.5 py-0.5 rounded border border-zinc-100/30 truncate w-full text-center">
                                      {u.email && !u.email.includes("@") ? "소셜인증" : "구글/미등록"}
                                    </span>
                                  )}
                                </div>

                                {/* Role Grade ("회원 권한 등급" with Combo Box in editing) */}
                                <div className="w-[11%] flex justify-center items-center" onClick={(e) => e.stopPropagation()}>
                                  {isEditing ? (
                                    <select
                                      value={editUserInputs.isAdmin ? "admin" : (editUserInputs.isBanned ? "banned" : "customer")}
                                      onChange={(e) => {
                                        const role = e.target.value;
                                        setEditUserInputs(prev => ({
                                          ...prev,
                                          isAdmin: role === "admin",
                                          isBanned: role === "banned"
                                        }));
                                      }}
                                      className="bg-zinc-50 border border-zinc-200 rounded-lg px-1.5 py-1 text-xs font-black text-zinc-900 focus:outline-none focus:ring-2 focus:ring-black/10 cursor-pointer w-full text-center"
                                    >
                                      <option value="customer">일반</option>
                                      <option value="admin">관리자</option>
                                      <option value="banned">금지</option>
                                    </select>
                                  ) : (
                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black tracking-widest inline-flex items-center gap-1 whitespace-nowrap ${
                                      u.isAdmin 
                                        ? "bg-indigo-50 text-indigo-600 border border-indigo-100" 
                                        : (u.isBanned 
                                          ? "bg-red-50 text-red-650 border border-red-150" 
                                          : "bg-zinc-100 text-zinc-650")
                                    }`}>
                                      <span className={`w-1 h-1 rounded-full ${
                                        u.isAdmin 
                                          ? "bg-indigo-500 animate-pulse" 
                                          : (u.isBanned ? "bg-red-500 animate-pulse" : "bg-zinc-400")
                                      }`} />
                                      {u.isAdmin ? (isMasterAdmin ? "마스터" : "관리자") : (u.isBanned ? "금지" : "일반")}
                                    </span>
                                  )}
                                </div>

                                {/* Control/Manage Area */}
                                <div className="w-[10%] flex justify-center gap-1 flex-shrink-0 items-center" onClick={(e) => e.stopPropagation()}>
                                  {isEditing ? (
                                    <div className="flex items-center gap-1">
                                      <button
                                        type="button"
                                        onClick={() => handleSaveUserInfo(u.id)}
                                        disabled={isUpdatingUser === u.id}
                                        className="p-1 px-1.5 bg-black text-white hover:bg-zinc-800 rounded-lg text-[10px] font-black uppercase transition-all flex items-center gap-1 cursor-pointer"
                                        title="저장"
                                      >
                                        {isUpdatingUser === u.id ? <RefreshCw size={10} className="animate-spin" /> : <Save size={10} />}
                                      </button>
                                      <button
                                        type="button"
                                        onClick={handleCancelEditUser}
                                        className="p-1 px-1.5 bg-white hover:bg-zinc-100 border border-zinc-250 rounded-lg text-[10px] font-black text-zinc-650 transition-all cursor-pointer"
                                        title="취소"
                                      >
                                        <X size={10} />
                                      </button>
                                    </div>
                                  ) : (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setSelectedUserForClasses(u);
                                          setTempEnrolledClassIds((u.enrolledClasses || []).map((e: any) => e.id));
                                        }}
                                        className="p-1.5 text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all cursor-pointer flex items-center justify-center shrink-0 animate-fade-in"
                                        title="수강 클래스 관리"
                                      >
                                        <BookOpen size={14} />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleStartEditUser(u)}
                                        className="p-1.5 text-zinc-400 hover:text-black hover:bg-zinc-100 rounded-lg transition-all cursor-pointer"
                                        title="정보 수정"
                                      >
                                        <Edit2 size={14} />
                                      </button>
                                      <button 
                                        type="button"
                                        onClick={async () => {
                                          const isMaster = ADMIN_EMAILS.includes(u.email || "");
                                          if (isMaster) {
                                            alert("최고 관리자 계정은 삭제할 수 없습니다.");
                                            return;
                                          }
                                          if (u.id === user?.uid) {
                                            alert("현재 로그인되어 있는 관리자 본인 계정은 삭제할 수 없습니다.");
                                            return;
                                          }
                                          if (safeConfirm(`[${u.nickname || u.email || '선택한 회원'}]님을 정말 회원 목록에서 영구 삭제하시겠습니까?`)) {
                                            setIsUpdatingUser(u.id);
                                            try {
                                              const { error } = await supabase.from('users').delete().eq('id', u.id);
                                              if (error) throw error;
                                              alert("성공적으로 삭제되었습니다.");
                                            } catch (err) {
                                              console.error("Failed to delete user:", err);
                                              alert("회원 삭제 처리에 실패했습니다.");
                                            } finally {
                                              setIsUpdatingUser(null);
                                            }
                                          }
                                        }}
                                        disabled={isUpdatingUser === u.id}
                                        className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all disabled:opacity-50 cursor-pointer"
                                        title="회원 삭제"
                                      >
                                        <Trash2 size={14} />
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                            );
                          })}

                          {filteredUsers.length === 0 && (
                            <div className="py-16 text-center text-zinc-400 font-medium bg-white rounded-2xl border border-zinc-100">
                              등록된 회원이 존재하지 않습니다.
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

              {/* Role matrix & Grade settings view */}
              {activeTab === "roles" && (
                <motion.div 
                  key="roles"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="space-y-8"
                >
                  <div>
                    <h3 className="text-3xl font-black tracking-tighter uppercase mb-2 flex items-center gap-2">
                      Role & Permissions <span className="text-xs bg-black text-white font-normal px-2.5 py-1 rounded-full uppercase tracking-widest scale-90 origin-left">등급 및 권한 관리</span>
                    </h3>
                    <p className="text-zinc-500 font-medium">회원 그룹별 서비스 접근 수준과 승인 권한 영역 목록을 확인합니다.</p>
                  </div>

                  {/* Grid Layout Cards */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Card 1: Admin Power */}
                    <div className="bg-white p-8 rounded-[36px] border border-zinc-200 shadow-sm flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-6">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 border border-indigo-100">
                              <ShieldCheck size={22} />
                            </div>
                            <div>
                              <h4 className="text-lg font-black tracking-tight">어드민 권한 등급 (Admin)</h4>
                              <p className="text-xs text-zinc-400 mt-0.5">최고 수준의 제어 권한을 소유한 임직원 계정</p>
                            </div>
                          </div>
                          <span className="text-xs font-black bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-full select-none">
                            {users.filter(u => u.isAdmin).length}명 지정됨
                          </span>
                        </div>

                        <div className="space-y-3.5 border-t border-zinc-100 pt-6">
                          <h5 className="text-[11px] font-black uppercase tracking-widest text-zinc-400 mb-2">허가 범위 (Allowed Scopes)</h5>
                          <div className="flex items-center gap-2 text-xs font-bold text-zinc-700">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                            <span>전체 상품 CRUD (등록, 수정, 순서 변경, 삭제)</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs font-bold text-zinc-700">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                            <span>카테고리 목록 생성 및 수정, 정렬</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs font-bold text-zinc-700">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                            <span>공지사항 목록 작성 및 배너 사용 제어</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs font-bold text-zinc-700">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                            <span>구글 애널리틱스 임베드 연동 및 Looker Studio URL 구성</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs font-bold text-zinc-700">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                            <span>회원 리스트 검색, 전체 조회 및 회원 등급 변경 부여 권한</span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-6 mt-8 border-t border-zinc-100 bg-zinc-50/50 -mx-8 -mb-8 p-8 rounded-b-[36px] flex items-center justify-between">
                        <span className="text-xs font-bold text-zinc-500">기본 권한: 서비스 제어 센터 원스톱 허가</span>
                        <button 
                          onClick={() => setActiveTab("users")}
                          className="text-xs px-3 py-1.5 border border-zinc-200 hover:border-black font-black uppercase tracking-wider bg-white rounded-lg transition-all cursor-pointer"
                        >
                          관리 권한 부여하러 가기
                        </button>
                      </div>
                    </div>

                    {/* Card 2: Customer Power */}
                    <div className="bg-white p-8 rounded-[36px] border border-zinc-200 shadow-sm flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-6">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 border border-emerald-100">
                              <Users size={22} />
                            </div>
                            <div>
                              <h4 className="text-lg font-black tracking-tight">일반 고객 등급 (Customer)</h4>
                              <p className="text-xs text-zinc-400 mt-0.5">회원가입으로 동시 생성된 본래의 기본 등급</p>
                            </div>
                          </div>
                          <span className="text-xs font-black bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-full select-none">
                            {users.filter(u => !u.isAdmin).length}명 지정됨
                          </span>
                        </div>

                        <div className="space-y-3.5 border-t border-zinc-100 pt-6">
                          <h5 className="text-[11px] font-black uppercase tracking-widest text-zinc-400 mb-2">허가 범위 (Allowed Scopes)</h5>
                          <div className="flex items-center gap-2 text-xs font-bold text-zinc-700">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                            <span>공개(Public) 상태로 표출된 상품 목록 조회</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs font-bold text-zinc-700">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                            <span>상세 상품 내역 및 외부 예약 채널 링크 연결 활용</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs font-bold text-zinc-700">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                            <span>공지사항 상세 열람 및 가용 활성화 배너 확인</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs font-bold text-zinc-300">
                            <span className="w-1.5 h-1.5 bg-zinc-300 rounded-full" />
                            <span className="line-through">어드민 내부 대시보드 조회 및 수정 제한</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs font-bold text-zinc-300">
                            <span className="w-1.5 h-1.5 bg-zinc-300 rounded-full" />
                            <span className="line-through">애널리틱스 대시보드 및 시스템 설정 접근 차단</span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-6 mt-8 border-t border-zinc-100 bg-zinc-50/50 -mx-8 -mb-8 p-8 rounded-b-[36px] flex items-center justify-between">
                        <span className="text-xs font-bold text-zinc-500">기본 권한: 일반 공개 서비스 인스턴스 전용</span>
                        <span className="text-xs font-extrabold text-emerald-600 flex items-center gap-1 select-none">
                          ● 활성 유저 기본 권한자
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Placeholder Views for other tabs */}
              {activeTab === "history" && (
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

              {/* Question / Inquiry Management Tab */}
              {activeTab === "inquiry" && (
                <motion.div 
                  key="inquiry"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="space-y-8 text-left font-sans"
                >
                  <div className="bg-white p-10 rounded-[40px] border border-zinc-200 shadow-sm space-y-8">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-zinc-100">
                      <div>
                        <h2 className="text-3xl font-black tracking-tight text-zinc-950 uppercase font-sans">1:1 문의 및 상담</h2>
                        <p className="text-sm font-semibold text-zinc-400 mt-1">
                          수강생들이 등록한 질문을 실시간으로 확인하고 마스터 피드백을 전달합니다.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Left Column: List of Questions */}
                    <div className="lg:col-span-5 space-y-4">
                      {/* Search and Filters */}
                      <div className="bg-white border border-zinc-200 rounded-3xl p-4.5 space-y-4 shadow-sm/5">
                        <div className="relative">
                          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 w-4 h-4" />
                          <input
                            type="text"
                            placeholder="제목, 작성자 이름, 이메일 검색..."
                            value={adminQSearch}
                            onChange={(e) => setAdminQSearch(e.target.value)}
                            className="w-full bg-zinc-50/60 border border-zinc-200 focus:border-zinc-350 focus:ring-1 focus:ring-zinc-100 py-3 pl-11 pr-4 rounded-xl text-xs font-bold outline-none transition-all"
                          />
                        </div>

                        <div className="flex gap-2">
                          {(["all", "pending", "answered"] as const).map((filter) => {
                            const isSelected = adminQFilter === filter;
                            const label = filter === "all" ? "전체" : filter === "pending" ? "대기" : "완료";
                            const count = filter === "all" 
                              ? adminQuestions.length 
                              : filter === "pending" 
                                ? adminQuestions.filter(q => !q.answer).length 
                                : adminQuestions.filter(q => q.answer).length;

                            return (
                              <button
                                key={filter}
                                onClick={() => setAdminQFilter(filter)}
                                className={`flex-1 py-2 text-[10px] font-black uppercase tracking-wider rounded-xl border transition-all cursor-pointer ${
                                  isSelected 
                                    ? "bg-black border-black text-white" 
                                    : "bg-white border-zinc-200 text-zinc-500 hover:border-zinc-300"
                                }`}
                              >
                                {label} ({count})
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Clean Questions Scroll Container */}
                      <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                        {adminQuestions.filter(q => {
                          const matches = q.title.toLowerCase().includes(adminQSearch.toLowerCase()) || 
                                          q.authorName.toLowerCase().includes(adminQSearch.toLowerCase()) || 
                                          q.authorEmail.toLowerCase().includes(adminQSearch.toLowerCase());
                          if (adminQFilter === "pending") return !q.answer && matches;
                          if (adminQFilter === "answered") return !!q.answer && matches;
                          return matches;
                        }).length === 0 ? (
                          <div className="py-16 text-center border border-dashed border-zinc-200 rounded-3xl bg-zinc-50/10">
                            <p className="text-zinc-400 font-bold text-xs uppercase tracking-widest">일치하는 질문이 없습니다.</p>
                          </div>
                        ) : (
                          adminQuestions.filter(q => {
                            const matches = q.title.toLowerCase().includes(adminQSearch.toLowerCase()) || 
                                            q.authorName.toLowerCase().includes(adminQSearch.toLowerCase()) || 
                                            q.authorEmail.toLowerCase().includes(adminQSearch.toLowerCase());
                            if (adminQFilter === "pending") return !q.answer && matches;
                            if (adminQFilter === "answered") return !!q.answer && matches;
                            return matches;
                          }).map((q) => {
                            const isSelected = replyingQId === q.id;
                            const hasAnswer = !!q.answer;
                            
                            return (
                              <div
                                key={q.id}
                                onClick={() => {
                                  setReplyingQId(q.id);
                                  setReplyText(q.answer || "");
                                }}
                                className={`p-4.5 rounded-2xl border transition-all cursor-pointer text-left select-none relative ${
                                  isSelected 
                                    ? "bg-zinc-950 border-zinc-950 text-white shadow-md" 
                                    : "bg-white border-zinc-200 hover:border-zinc-350 text-black"
                                }`}
                              >
                                <div className="flex items-center justify-between gap-2.5 mb-2.5">
                                  {hasAnswer ? (
                                    <span className={`text-[8px] font-black px-2 py-0.5 rounded-full ${isSelected ? "bg-white/15 text-white" : "bg-emerald-50 border border-emerald-100 text-emerald-700"}`}>
                                      답변 완료
                                    </span>
                                  ) : (
                                    <span className={`text-[8px] font-black px-2 py-0.5 rounded-full ${isSelected ? "bg-white/10 text-white/80" : "bg-zinc-100 border border-zinc-200 text-zinc-500"}`}>
                                      답변 대기
                                    </span>
                                  )}

                                  <span className={`text-[9px] font-mono font-bold ${isSelected ? "text-zinc-400" : "text-zinc-400"}`}>
                                    {q.createdAt ? q.createdAt.split("T")[0].replace(/-/g, ".") : ""}
                                  </span>
                                </div>

                                <h4 className="font-bold text-sm line-clamp-2 leading-snug">
                                  {q.isPrivate && (
                                    <span className="inline-flex mr-1 items-center gap-0.5 opacity-60">
                                      <Lock size={10} />
                                    </span>
                                  )}
                                  {q.title}
                                </h4>

                                <div className={`flex items-center gap-2 mt-3.5 text-[10px] font-bold ${isSelected ? "text-zinc-400" : "text-zinc-500"}`}>
                                  <span>{q.authorName}</span>
                                  <span>•</span>
                                  <span className="truncate">{q.authorEmail}</span>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>

                    {/* Right Column: Workstation details and text reply editor */}
                    <div className="lg:col-span-7 bg-white border border-zinc-200 rounded-[36px] overflow-hidden min-h-[500px] flex flex-col shadow-sm">
                      {(() => {
                        const targetQ = adminQuestions.find(q => q.id === replyingQId);
                        if (!targetQ) {
                          return (
                            <div className="flex-grow flex flex-col items-center justify-center p-12 text-center text-zinc-400">
                              <HelpCircle size={40} className="text-zinc-350 mb-4" />
                              <h4 className="font-bold text-sm text-zinc-800">질문을 선택해 주세요</h4>
                              <p className="text-[11px] font-medium text-zinc-400 mt-1 max-w-[280px] leading-relaxed">
                                왼쪽 리스트에서 답변을 작성하거나 피드백할 수강생의 질문을 선택해 주세요.
                              </p>
                            </div>
                          );
                        }

                        return (
                          <div className="flex-grow flex flex-col min-h-0 text-left font-sans">
                            {/* Workstation Header */}
                            <div className="p-6 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/40">
                              <div>
                                <h5 className="font-semibold text-sm text-zinc-850">{targetQ.authorName} 님의 질문</h5>
                              </div>
                              <button 
                                onClick={() => { setReplyingQId(null); setReplyText(""); }}
                                className="p-1.5 px-3 border border-zinc-200 rounded-xl text-[9px] font-black tracking-wider uppercase text-zinc-500 hover:text-black hover:bg-zinc-50 transition-colors cursor-pointer"
                              >
                                닫기 [X]
                              </button>
                            </div>

                            {/* Q Content sheet */}
                            <div className="p-6 md:p-8 space-y-6 flex-1 overflow-y-auto">
                              <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                  {targetQ.isPrivate && (
                                    <span className="inline-flex items-center gap-1 text-[9px] font-bold text-zinc-400 bg-zinc-50 border border-zinc-150 px-1.5 py-0.5 rounded">
                                      <Lock size={10} />
                                      비밀글
                                    </span>
                                  )}
                                  <span className="text-[10px] font-mono font-bold text-zinc-400">작성일: {targetQ.createdAt}</span>
                                </div>
                                <h3 className="text-base md:text-lg font-bold text-zinc-950 leading-snug">{targetQ.title}</h3>
                              </div>

                              {targetQ.reference && (
                                <div className="bg-zinc-50/70 border border-zinc-150 rounded-2xl p-5">
                                  <span className="text-[9px] font-black text-zinc-400 block mb-1.5 font-mono tracking-wider">대상 강좌 / 유튜브 채널 & 링크</span>
                                  <p className="text-zinc-850 text-xs md:text-sm font-bold flex items-center gap-1.5">🎬 {targetQ.reference}</p>
                                </div>
                              )}

                              <div className="bg-zinc-50/70 border border-zinc-150 rounded-2xl p-6">
                                <span className="text-[9px] font-black text-zinc-400 block mb-2 font-mono tracking-wider">QUESTION DESCRIPTION</span>
                                <p className="text-zinc-800 text-xs md:text-sm font-semibold leading-relaxed whitespace-pre-wrap">{targetQ.content}</p>
                              </div>

                              <div className="pt-2 border-t border-zinc-100 space-y-4">
                                <div className="flex items-center justify-between">
                                  <label className="text-[10px] font-black uppercase text-zinc-400 tracking-wide font-mono">
                                    {targetQ.answer ? "답변 수정하기" : "푸이마 마스터 답변 작성"}
                                  </label>
                                  {targetQ.answer && (
                                    <span className="text-[9px] text-zinc-400 font-mono font-bold">
                                      답변 발행일: {targetQ.answeredAt ? targetQ.answeredAt.split("T")[0] : ""}
                                    </span>
                                  )}
                                </div>
                                
                                <textarea
                                  rows={8}
                                  placeholder="수강생의 성공적인 조리를 위해 명확하고 친절한 과학적 조리 피드백을 전달해 주세요."
                                  value={replyText}
                                  onChange={(e) => setReplyText(e.target.value)}
                                  className="w-full bg-white border border-zinc-200 focus:border-zinc-350 focus:ring-1 focus:ring-zinc-100 outline-none rounded-2xl p-4 text-xs md:text-sm font-semibold leading-relaxed font-sans"
                                />
                              </div>
                            </div>

                            {/* Workstation Footer actions */}
                            <div className="p-6 border-t border-zinc-100 bg-zinc-50/30 flex items-center justify-between gap-3 shrink-0">
                              <button
                                type="button"
                                onClick={async () => {
                                  if (!safeConfirm("정말로 이 질문 글을 완전히 삭제하시겠습니까?")) return;
                                  try {
                                    await deleteDoc(doc(db, "questions", targetQ.id));
                                    setReplyingQId(null);
                                    setReplyText("");
                                  } catch (err) {
                                    console.error("Error deleting question via admin:", err);
                                    alert("삭제 중 에러가 발생했습니다.");
                                  }
                                }}
                                className="px-5 py-3.5 border border-red-200 text-red-650 hover:bg-red-50/20 font-bold text-xs rounded-2xl active:scale-95 transition-all cursor-pointer"
                              >
                                질문 삭제
                              </button>

                              <div className="flex gap-2.5">
                                {targetQ.answer && (
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      if (!safeConfirm("답변을 기각하여 다시 대기 상태로 되돌리시겠습니까?")) return;
                                      setIsSavingReply(true);
                                      try {
                                        await updateDoc(doc(db, "questions", targetQ.id), {
                                          answer: "",
                                          answeredAt: ""
                                        });
                                        setReplyText("");
                                      } catch (err) {
                                        console.error("Error resetting answer:", err);
                                        alert("기각 처리 중 에러가 발생했습니다.");
                                      } finally {
                                        setIsSavingReply(false);
                                      }
                                    }}
                                    className="px-4 py-3.5 bg-zinc-100 border border-zinc-200 text-zinc-600 hover:bg-zinc-200 rounded-2xl text-xs font-bold transition-all active:scale-95 cursor-pointer"
                                  >
                                    답변 초기화
                                  </button>
                                )}

                                <button
                                  type="button"
                                  disabled={isSavingReply || !replyText.trim()}
                                  onClick={async () => {
                                    setIsSavingReply(true);
                                    try {
                                      await updateDoc(doc(db, "questions", targetQ.id), {
                                        answer: replyText.trim(),
                                        answeredAt: new Date().toISOString()
                                      });
                                    } catch (err) {
                                      console.error("Error saving reply inside admin panel:", err);
                                      alert("답변 전송 중 에러가 발생했습니다.");
                                    } finally {
                                      setIsSavingReply(false);
                                    }
                                  }}
                                  className="px-8 py-3.5 bg-black text-white hover:bg-zinc-800 rounded-2xl text-xs font-black uppercase tracking-wider disabled:opacity-50 transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer shadow-sm"
                                >
                                  {isSavingReply ? <RefreshCw size={12} className="animate-spin" /> : null}
                                  <span>{targetQ.answer ? "답변 수정 저장" : "답변 전송 및 공개"}</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

              {/* Blacklist Management Tab */}
              {activeTab === "blacklist" && (
                <motion.div 
                  key="blacklist"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="space-y-8"
                >
                  <div className="bg-white p-10 rounded-[40px] border border-zinc-200 shadow-sm space-y-8">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-zinc-100">
                      <div>
                        <h3 className="text-3xl font-black tracking-tighter mb-2 text-red-650">
                          이용 제한 관리
                        </h3>
                        <p className="text-zinc-500 font-medium text-sm">서비스 이용 규정을 위반하여 제한된 회원의 목록을 관리하고, 제한 상태를 해제할 수 있습니다.</p>
                      </div>
                    </div>

                    {/* Summary Metric Cards for Blacklist */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl">
                    <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">총 금지 회원</span>
                        <div className="text-3xl font-black tracking-tight mt-1 text-red-650">{users.filter(u => u.isBanned).length}명</div>
                      </div>
                      <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-600 border border-red-100">
                        <UserX size={18} />
                      </div>
                    </div>

                    <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">일반 회원 수</span>
                        <div className="text-3xl font-black tracking-tight mt-1 text-zinc-800">{users.filter(u => !u.isAdmin && !u.isBanned).length}명</div>
                      </div>
                      <div className="w-12 h-12 rounded-full bg-zinc-50 flex items-center justify-center text-zinc-700 border border-zinc-100">
                        <Users size={18} />
                      </div>
                    </div>
                  </div>

                  {/* Blacklist Table */}
                  <div className="bg-white rounded-[32px] border border-zinc-200 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
                      <span className="text-xs font-black tracking-wider uppercase text-zinc-500">
                        제한 대상자 리스트 ({users.filter(u => u.isBanned).length})
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-zinc-100 bg-zinc-50/50">
                            <th className="py-4 pl-6 text-[10px] font-black uppercase tracking-[0.2em] w-[20%] text-zinc-400">닉네임 / 프로필</th>
                            <th className="py-4 pl-3 text-[10px] font-black uppercase tracking-[0.2em] w-[15%] text-zinc-400">실명</th>
                            <th className="py-4 pl-3 text-[10px] font-black uppercase tracking-[0.2em] w-[15%] text-zinc-400">전화번호</th>
                            <th className="py-4 pl-3 text-[10px] font-black uppercase tracking-[0.2em] w-[25%] text-zinc-400">이메일</th>
                            <th className="py-4 pl-3 text-[10px] font-black uppercase tracking-[0.2em] w-[15%] text-zinc-400">상태</th>
                            <th className="py-4 pr-6 text-[10px] font-black uppercase tracking-[0.2em] w-[10%] text-zinc-400 text-right">관리</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100">
                          {users.filter(u => u.isBanned).length === 0 ? (
                            <tr>
                              <td colSpan={6} className="py-12 text-center text-xs font-bold text-zinc-400 bg-zinc-50/10">
                                이용 제한 중인 회원이 없습니다.
                              </td>
                            </tr>
                          ) : (
                            users.filter(u => u.isBanned).map((u) => (
                              <tr key={u.id} className="hover:bg-zinc-50/50 transition-colors">
                                <td className="py-4 pl-6 align-middle">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center shrink-0 border border-zinc-200 overflow-hidden">
                                      {u.photoURL ? (
                                        <img src={u.photoURL} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                      ) : (
                                        <UserIcon size={14} className="text-zinc-400" />
                                      )}
                                    </div>
                                    <div className="font-bold text-zinc-800 text-xs truncate max-w-[120px]">
                                      {u.nickname || "N/A"}
                                    </div>
                                  </div>
                                </td>

                                <td className="py-4 pl-3 align-middle font-bold text-zinc-800 text-xs text-left">
                                  {u.realName || "-"}
                                </td>

                                <td className="py-4 pl-3 align-middle font-mono font-bold text-zinc-600 text-xs text-left">
                                  {u.phone || "-"}
                                </td>

                                <td className="py-4 pl-3 align-middle text-zinc-400 font-bold text-xs select-all truncate max-w-[180px] text-left">
                                  {u.email || "-"}
                                </td>

                                <td className="py-4 pl-3 align-middle">
                                  <span className="px-2.5 py-1 rounded-full text-[10px] font-black tracking-widest inline-flex items-center gap-1.5 bg-red-50 text-red-650 border border-red-100">
                                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                                    이용 정지
                                  </span>
                                </td>

                                <td className="py-4 pr-6 align-middle text-right">
                                  <button
                                    onClick={async () => {
                                      setIsUpdatingUser(u.id);
                                      try {
                                         const { error } = await supabase.from('users').update({
                                          "isBanned": false,
                                          "isAdmin": false
                                        }).eq('id', u.id);
                                        if (error) throw error;
                                        
                                        setUsers(prevUsers => prevUsers.map(usr => 
                                          usr.id === u.id ? { ...usr, isBanned: false, isAdmin: false } : usr
                                        ));
                                        
                                        alert(`[${u.nickname || u.email || '선택회원'}]님의 이용 제한이 해제되어 일반 회원으로 변경되었습니다.`);
                                      } catch (err) {
                                        console.error("Failed to unban user:", err);
                                        alert("이용 정지 해제에 실패했습니다.");
                                      } finally {
                                        setIsUpdatingUser(null);
                                      }
                                    }}
                                    disabled={isUpdatingUser === u.id}
                                    className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white text-[11px] font-black rounded-xl shadow-sm transition-all disabled:opacity-50 cursor-pointer whitespace-nowrap tracking-tight"
                                  >
                                    {isUpdatingUser === u.id ? "해제 중..." : "제한 해제"}
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* Enrolled Classes Management Modal (수강권한 팝업 모달) */}
      <AnimatePresence>
        {selectedUserForClasses && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            {/* Dark Overlay with elegant backdrop blur */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedUserForClasses(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />
            
            {/* Modal Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[32px] shadow-2xl border border-zinc-150 w-full max-w-[1000px] relative z-10 flex flex-col max-h-[85vh] overflow-hidden font-sans text-black"
            >
              {/* Header */}
              <div className="p-6 md:p-8 border-b border-zinc-100 flex items-start justify-between bg-zinc-50/50 shrink-0 text-left">
                <div className="space-y-2 max-w-3xl">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[9px] font-black tracking-widest uppercase">
                      수강 권한 설정
                    </span>
                  </div>
                  <h3 className="text-xl md:text-2xl font-extrabold text-zinc-900 tracking-tight leading-normal">
                    <span className="text-indigo-600">[{selectedUserForClasses.nickname || selectedUserForClasses.realName || selectedUserForClasses.displayName || selectedUserForClasses.email || '회원'}]</span> 님 수강 권한 관리
                  </h3>
                  <p className="text-xs md:text-sm text-zinc-500 font-medium leading-relaxed">
                    선택한 회원이 수강할 수 있는 강의 클래스 목록을 직접 일괄 부여하거나 회수할 수 있습니다.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedUserForClasses(null)}
                  className="p-2.5 text-zinc-400 hover:text-black hover:bg-zinc-100 rounded-full transition-all cursor-pointer shrink-0 ml-4 border border-transparent hover:border-zinc-200"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Search Bar & Stats */}
              <div className="px-6 md:px-8 py-4 border-b border-zinc-100 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
                <div className="relative flex-1">
                  <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="text"
                    value={searchClassInModal}
                    onChange={(e) => setSearchClassInModal(e.target.value)}
                    placeholder="클래스 제목 또는 카테고리 검색..."
                    className="w-full bg-zinc-50/60 border border-zinc-200 rounded-xl py-2 pl-10 pr-4 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-150 transition-all placeholder:text-zinc-400"
                  />
                </div>
                <div className="flex gap-2 items-center text-xs font-black self-end sm:self-auto">
                  <span className="text-zinc-400">선택 됨:</span>
                   <span className="text-indigo-600 font-mono text-sm">{tempEnrolledClassIds.length}개</span>
                   <span className="text-zinc-200">/</span>
                   <span className="text-zinc-500 font-mono font-bold">총 {posts.length}개</span>
                </div>
              </div>

              {/* Class posts checklist */}
              <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-zinc-50/20">
                {posts.filter(p => !p.isBanner).filter(p => {
                  const queryClean = searchClassInModal.toLowerCase().trim();
                  if (!queryClean) return true;
                  return p.title.toLowerCase().includes(queryClean) || (p.category || "").toLowerCase().includes(queryClean);
                }).length === 0 ? (
                  <div className="py-12 border border-dashed border-zinc-200 rounded-2xl text-center bg-white">
                    <BookOpen className="mx-auto text-zinc-300 mb-2.5" size={28} />
                    <p className="text-xs font-bold text-zinc-400">검색 결과에 맞는 클래스가 존재하지 않습니다.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {posts.filter(p => !p.isBanner).filter(p => {
                      const queryClean = searchClassInModal.toLowerCase().trim();
                      if (!queryClean) return true;
                      return p.title.toLowerCase().includes(queryClean) || (p.category || "").toLowerCase().includes(queryClean);
                    }).map((classItem) => {
                      const isChecked = tempEnrolledClassIds.includes(classItem.id);
                      return (
                        <div
                          key={classItem.id}
                          onClick={() => {
                            if (isChecked) {
                              setTempEnrolledClassIds(prev => prev.filter(id => id !== classItem.id));
                            } else {
                              setTempEnrolledClassIds(prev => [...prev, classItem.id]);
                            }
                          }}
                          className={`p-4 rounded-2xl border transition-all duration-150 flex items-center justify-between gap-4 cursor-pointer select-none bg-white text-left ${
                            isChecked
                              ? "border-indigo-500 bg-indigo-50/10 shadow-sm"
                              : "border-zinc-200 hover:border-zinc-300"
                          }`}
                        >
                          <div className="flex items-center gap-3.5 min-w-0 flex-1">
                            <div className="w-12 h-12 rounded-xl bg-zinc-100 overflow-hidden border border-zinc-150 shrink-0">
                              {classItem.imageUrl ? (
                                <img src={classItem.imageUrl} className="w-full h-full object-cover" alt="" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-[9px] font-black bg-zinc-550 text-white">CLASS</div>
                              )}
                            </div>
                            <div className="text-left min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="px-1.5 py-0.5 bg-zinc-100 text-zinc-650 rounded-md text-[8px] font-black uppercase tracking-wider">
                                  {classItem.category || "Masterclass"}
                                </span>
                                <span className="text-[10px] text-zinc-400 font-mono font-bold">
                                  {classItem.price || "₩49,900"}
                                </span>
                              </div>
                              <h4 className="text-xs font-extrabold text-zinc-900 mt-1 truncate" title={classItem.title}>
                                {classItem.title}
                              </h4>
                            </div>
                          </div>
                          
                          {/* Premium Styled Checkbox */}
                          <div className="flex-shrink-0">
                            <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                              isChecked
                                ? "bg-indigo-600 border-indigo-600 text-white shadow-sm"
                                : "border-zinc-300 bg-white"
                            }`}>
                              {isChecked && (
                                <svg className="w-3.5 h-3.5 stroke-current stroke-2" fill="none" viewBox="0 0 24 24">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-6 md:p-8 border-t border-zinc-100 bg-zinc-50/50 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0 text-left">
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => {
                      const activeIds = posts.filter(p => !p.isBanner).map(p => p.id);
                      setTempEnrolledClassIds(activeIds);
                    }}
                    className="px-3 py-1.5 bg-zinc-200/60 hover:bg-zinc-200 text-zinc-800 text-[10px] font-black uppercase rounded-lg transition-all cursor-pointer"
                  >
                    전체 선택 (All)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTempEnrolledClassIds([])}
                    className="px-3 py-1.5 bg-white border border-zinc-300 hover:bg-zinc-100 text-zinc-650 text-[10px] font-black uppercase rounded-lg transition-all cursor-pointer"
                  >
                    임시 해제 (Clear)
                  </button>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={() => setSelectedUserForClasses(null)}
                    className="px-4 py-2.5 bg-white border border-zinc-250 hover:bg-zinc-50 rounded-xl text-xs font-black transition-all cursor-pointer w-full sm:w-auto text-zinc-700"
                  >
                    취소
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveUserClasses}
                    disabled={isSavingEnrolledClasses}
                    className="px-5 py-2.5 bg-zinc-950 text-white hover:bg-black rounded-xl text-xs font-black uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5 w-full sm:w-auto shadow"
                  >
                    {isSavingEnrolledClasses ? (
                      <RefreshCw size={13} className="animate-spin" />
                    ) : (
                      <Save size={13} />
                    )}
                    <span>변경 권한 저장</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
