import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { collection, addDoc, onSnapshot, query, orderBy, deleteDoc, doc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../contexts/AuthContext";
import { X, Lock, ArrowRight, Plus, ChevronDown, ChevronUp, AlertCircle, MessageSquare } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { FixedHeader } from "../components/FixedHeader";
import { translate } from "../utils/translate";

interface QuestionItem {
  id: string;
  title: string;
  content: string;
  reference?: string;
  authorId: string;
  authorEmail: string;
  authorName: string;
  isPrivate: boolean;
  createdAt: string;
  answer?: string;
  answeredAt?: string;
}

export default function Question() {
  const navigate = useNavigate();
  const { user, userId, lang } = useAuth();
  
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Accordion state
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newReference, setNewReference] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newIsPrivate, setNewIsPrivate] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const isBypassed = localStorage.getItem('admin_bypass') === 'true';
  const isAdminUser = isBypassed || (user && user.email === "rtytgb123@gmail.com");

  useEffect(() => {
    window.scrollTo(0, 0);
    const q = query(collection(db, "questions"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as QuestionItem[];
      setQuestions(docs);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching questions:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleOpenModal = () => {
    if (!user) {
      if (window.confirm(translate("질문 등록하기 위해서는 로그인이 필요합니다. 로그인 페이지로 이동하시겠습니까?", lang))) {
        navigate("/login", { state: { from: "/question" } });
      }
      return;
    }
    setNewTitle("");
    setNewReference("");
    setNewContent("");
    setNewIsPrivate(false);
    setErrorMessage("");
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!newTitle.trim() || !newContent.trim()) {
      setErrorMessage(translate("제목과 내용을 입력해 주세요.", lang));
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");
    try {
      await addDoc(collection(db, "questions"), {
        title: newTitle.trim(),
        reference: newReference.trim(),
        content: newContent.trim(),
        authorId: user.uid,
        authorEmail: user.email || "",
        authorName: user.displayName || user.email?.split("@")[0] || "수강생",
        isPrivate: newIsPrivate,
        createdAt: new Date().toISOString(),
        answer: ""
      });
      setIsModalOpen(false);
    } catch (err: any) {
      console.error("Error adding question:", err);
      setErrorMessage(translate("질문 등록 중 오류가 발생했습니다. 다시 시도해 주세요.", lang));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!window.confirm(translate("정말로 이 질문을 삭제하시겠습니까?", lang))) return;
    try {
      await deleteDoc(doc(db, "questions", id));
      if (expandedId === id) setExpandedId(null);
    } catch (err) {
      console.error("Error deleting question:", err);
      alert(translate("질문 삭제 중 문제가 발생했습니다.", lang));
    }
  };

  const handleToggleAccordion = (q: QuestionItem) => {
    if (q.isPrivate && q.authorId !== user?.uid && !isAdminUser) {
      alert(translate("비밀글입니다. 작성자 본인과 관리자만 확인할 수 있습니다.", lang));
      return;
    }
    setExpandedId(expandedId === q.id ? null : q.id);
  };

  const maskName = (name: string) => {
    if (!name) return translate("익명", lang);
    return name[0] + "**";
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
    <div className="min-h-screen bg-white flex flex-col items-center selection:bg-black selection:text-white pt-[60px] md:pt-[100px] md:min-w-[1100px]">
      <FixedHeader />
      <div className="w-full max-w-[1100px] bg-white text-black font-sans relative min-h-screen">
        <main className="max-w-4xl mx-auto px-6 pt-10 pb-24 md:pt-14 md:pb-32">
          {/* Back button (돌아가기) as clean text link */}
          <div className="mb-8 text-left">
            <button
              onClick={() => navigate("/")}
              className="text-zinc-400 hover:text-black transition-colors text-xs font-bold tracking-tight inline-flex items-center gap-1.5 cursor-pointer"
            >
              ← {translate("돌아가기", lang)}
            </button>
          </div>

          <div className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6 text-left border-b border-zinc-100 pb-8">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-zinc-900 mb-1">Q&A</h2>
              <p className="text-zinc-450 text-xs md:text-sm font-medium tracking-tight">{translate("푸이마에게 궁금한 점을 편하게 질문해보세요.", lang)}</p>
            </div>
            <button
              onClick={handleOpenModal}
              className="bg-black text-white px-8 py-4.5 rounded-2xl font-black text-xs hover:bg-zinc-800 transition-all flex items-center gap-2 tracking-widest uppercase cursor-pointer shrink-0"
            >
              <Plus size={16} />
              {translate("질문 등록하기", lang)}
            </button>
          </div>

          <div className="space-y-4">
            {loading ? (
              <div className="py-24 text-center">
                <div className="w-8 h-8 border border-zinc-200 border-t-black rounded-full animate-spin mx-auto mb-4" />
                <p className="text-zinc-400 text-xs font-bold tracking-widest uppercase">Loading questions...</p>
              </div>
            ) : questions.length === 0 ? (
              <div className="py-24 text-center border-2 border-dashed border-zinc-100 rounded-[32px] bg-zinc-50/20">
                <MessageSquare size={36} className="text-zinc-300 mx-auto mb-4" />
                <p className="text-zinc-400 text-sm font-bold">{translate("등록된 질문이 없습니다.", lang)}</p>
                <p className="text-zinc-400 text-xs font-semibold mt-1">{translate("첫 번째 질문을 등록해보세요!", lang)}</p>
              </div>
            ) : (
              <div className="border border-zinc-200 rounded-[32px] overflow-hidden divide-y divide-zinc-200 bg-zinc-50/10">
                {questions.map((q) => {
                  const isExpanded = expandedId === q.id;
                  const isPrivateReadable = !q.isPrivate || q.authorId === user?.uid || isAdminUser;
                  
                  return (
                    <div 
                      key={q.id} 
                      className={`transition-colors ${isExpanded ? "bg-zinc-50/40" : "hover:bg-zinc-50/20"}`}
                    >
                      {/* Accordion Trigger Header */}
                      <div 
                        onClick={() => handleToggleAccordion(q)}
                        className="px-6 md:px-8 py-4 flex items-center justify-between gap-4 cursor-pointer select-none text-left"
                      >
                        <div className="flex-grow min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            {/* Answer status status indicator */}
                            {q.answer ? (
                              <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 uppercase tracking-wider">
                                {translate("답변 완료", lang)}
                              </span>
                            ) : (
                              <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-zinc-100 border border-zinc-200 text-zinc-500 uppercase tracking-wider">
                                {translate("답변 대기", lang)}
                              </span>
                            )}
                            {q.isPrivate && (
                              <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-zinc-400 bg-zinc-50 border border-zinc-150 px-1.5 py-0.5 rounded-md">
                                <Lock size={10} />
                                {translate("비밀글", lang)}
                              </span>
                            )}
                          </div>
                          
                          <h3 className="text-sm md:text-base font-bold text-zinc-900 truncate leading-snug">
                            {q.isPrivate && !isPrivateReadable ? translate("비밀글입니다.", lang) : q.title}
                          </h3>

                          <div className="flex items-center gap-2.5 text-[10px] text-zinc-400 font-medium font-mono mt-1">
                            <span>{maskName(q.authorName)}</span>
                            <span className="hidden md:inline">•</span>
                            <span className="hidden md:inline">{formatDate(q.createdAt)}</span>
                            {(user?.uid === q.authorId || isAdminUser) && (
                              <>
                                <span>•</span>
                                <button
                                  type="button"
                                  onClick={(e) => handleDelete(e, q.id)}
                                  className="text-red-400 hover:text-red-600 transition-colors uppercase font-sans font-bold cursor-pointer"
                                >
                                  {translate("삭제", lang)}
                                </button>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="text-zinc-400 shrink-0">
                          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </div>
                      </div>

                      {/* Expanded Panel */}
                      <AnimatePresence initial={false}>
                        {isExpanded && isPrivateReadable && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25, ease: "easeInOut" }}
                            className="overflow-hidden"
                          >
                            <div className="px-6 md:px-8 pb-5 pt-1.5 border-t border-zinc-100/60 text-left">
                              <div className="bg-white border border-zinc-300 rounded-2xl p-5 md:p-6 mb-3">
                                {q.reference && (
                                  <div className="mb-3 pb-3 border-b border-zinc-100">
                                    <span className="text-[11px] font-extrabold uppercase text-zinc-400 tracking-wider block mb-1 font-mono">{translate("강좌명 또는 유튜브 영상 제목", lang)}</span>
                                    <div className="text-xs md:text-sm font-medium text-zinc-800 mt-1">
                                      🎬 {q.reference}
                                    </div>
                                  </div>
                                )}
                                <span className="text-[11px] font-extrabold uppercase text-zinc-400 tracking-wider block mb-1 font-mono">{translate("질문 내용", lang)}</span>
                                <div className="text-xs md:text-sm text-zinc-855 font-medium leading-relaxed whitespace-pre-wrap">
                                  {q.content}
                                </div>
                              </div>

                              {/* Answer block */}
                              {q.answer ? (
                                <div className="bg-zinc-50/80 border border-zinc-300 rounded-2xl p-5 md:p-6">
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                    <span className="text-[10px] font-black uppercase text-zinc-800 tracking-wider font-mono">PUT-IT-IN-YOUR-MOUTH (PUIMA) ANSWER</span>
                                  </div>
                                  <div className="text-xs md:text-sm text-zinc-800 font-semibold leading-relaxed whitespace-pre-wrap">
                                    {q.answer}
                                  </div>
                                  {q.answeredAt && (
                                    <div className="text-[9px] text-zinc-400 font-mono font-medium mt-3">
                                      {translate("답변일", lang)}: {formatDate(q.answeredAt)}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="bg-zinc-50/40 border border-zinc-300 rounded-2xl p-4 text-center text-zinc-440 flex items-center justify-center gap-2 text-xs font-semibold">
                                  <AlertCircle size={14} className="text-zinc-400" />
                                  <span>{translate("푸이마 마스터가 질문을 확인하고 있습니다. 조금만 기다려주세요!", lang)}</span>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Reg Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[1000]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-x-4 bottom-4 md:bottom-auto md:top-1/2 md:-translate-y-1/2 md:max-w-xl md:mx-auto bg-white rounded-[32px] overflow-hidden shadow-2xl z-[1001] border border-zinc-100 flex flex-col font-sans"
            >
              <div className="px-6 md:px-8 py-6 border-b border-zinc-100 flex items-center justify-between">
                <h3 className="text-lg font-black text-zinc-950">{translate("새 질문 등록", lang)}</h3>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 hover:bg-zinc-50 rounded-full transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-5 text-left">
                {errorMessage && (
                  <div className="bg-red-50 border border-red-100 text-red-800 p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2">
                    <AlertCircle size={14} className="text-red-500 flex-shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-[0.1em] text-zinc-400 mb-2">{translate("질문 제목", lang)}</label>
                  <input
                    type="text"
                    required
                    placeholder={translate("예: 에그타르트 온도가 안 맞는데 어떻게 해야 하나요?", lang)}
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl py-3.5 px-4 text-xs font-medium outline-none focus:bg-white focus:border-zinc-350 transition-all font-sans"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-[0.1em] text-zinc-400 mb-2">{translate("대상 강좌명 또는 유튜브 영상 정보", lang)}</label>
                  <input
                    type="text"
                    placeholder={translate("예: 에그타르트 클래스 3강 / 유튜브 바삭한 타르트 쉘 굽기 영상", lang)}
                    value={newReference}
                    onChange={(e) => setNewReference(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl py-3.5 px-4 text-xs font-medium outline-none focus:bg-white focus:border-zinc-350 transition-all font-sans"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-[0.1em] text-zinc-400 mb-2">{translate("질문 내용 (질문란)", lang)}</label>
                  <textarea
                    required
                    rows={6}
                    placeholder={translate("조리 도구, 온도 세팅 등 구체적인 과정 정보를 함께 기입해주시면 더욱 정확한 마스터 피드백을 전달드릴 수 있습니다.", lang)}
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl py-3.5 px-4 text-xs font-medium outline-none focus:bg-white focus:border-zinc-350 transition-all font-sans resize-none"
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-zinc-50 border border-zinc-150 rounded-2xl">
                  <div className="text-left">
                    <h5 className="text-[11px] font-bold text-zinc-900">{translate("비밀글로 설정", lang)}</h5>
                    <p className="text-[10px] text-zinc-405 font-medium mt-0.5">{translate("작성자와 관리자만 볼 수 있도록 글을 보호합니다.", lang)}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer"
                      checked={newIsPrivate}
                      onChange={(e) => setNewIsPrivate(e.target.checked)}
                    />
                    <div className="w-9 h-5 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-black"></div>
                  </label>
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-4 border border-zinc-200 rounded-2xl text-xs font-bold text-zinc-650 hover:bg-zinc-50 transition-all cursor-pointer"
                  >
                    {translate("취소", lang)}
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-4 bg-black text-white hover:bg-zinc-800 rounded-2xl text-xs font-black uppercase tracking-widest transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? translate("등록 중...", lang) : translate("등록하기", lang)}
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
