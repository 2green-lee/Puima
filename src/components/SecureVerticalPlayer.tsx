import React, { useRef, useState, useEffect } from "react";
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Lock, 
  CheckCircle2, 
  ChevronRight,
  BookOpen,
  Video
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { collection, query, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";

interface Milestone {
  timeLabel: string;
  seconds: number;
  title: string;
  desc: string;
}

interface Chapter {
  id: string;
  chapterNo?: string;
  title: string;
  duration: string;
  videoUrl: string;
  milestones: Milestone[];
  recipe?: string;
}

export function getEmbedUrl(url: string, startSeconds?: number): string | null {
  if (!url) return null;
  const cleanUrl = url.trim();
  
  let baseEmbed: string | null = null;
  
  if (cleanUrl.includes("youtube.com") || cleanUrl.includes("youtu.be")) {
    if (cleanUrl.includes("youtube.com/embed/")) {
      const sep = cleanUrl.includes("?") ? "&" : "?";
      baseEmbed = `${cleanUrl}${sep}enablejsapi=1`;
    } else {
      const ytReg = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
      const match = cleanUrl.match(ytReg);
      if (match && match[1]) {
        baseEmbed = `https://www.youtube.com/embed/${match[1]}?autoplay=0&rel=0&enablejsapi=1`;
      } else {
        const fallback = cleanUrl.replace(/watch\?v=/, "embed/").replace(/youtu\.be\//, "youtube.com/embed/");
        const sep = fallback.includes("?") ? "&" : "?";
        baseEmbed = `${fallback}${sep}enablejsapi=1`;
      }
    }
    
    if (baseEmbed && startSeconds !== undefined && startSeconds !== null) {
      const sep = baseEmbed.includes("?") ? "&" : "?";
      let cleanBase = baseEmbed;
      if (baseEmbed.includes("autoplay=0")) {
        cleanBase = baseEmbed.replace("autoplay=0", "autoplay=1");
      } else if (!baseEmbed.includes("autoplay=")) {
        cleanBase = `${baseEmbed}${sep}autoplay=1`;
      }
      return `${cleanBase}&start=${startSeconds}`;
    }
    return baseEmbed;
  }

  if (cleanUrl.includes("vimeo.com")) {
    if (cleanUrl.includes("player.vimeo.com/video/")) {
      const sep = cleanUrl.includes("?") ? "&" : "?";
      baseEmbed = `${cleanUrl}${sep}api=1`;
    } else {
      const noQuery = cleanUrl.split('?')[0];
      const manageMatch = noQuery.match(/vimeo\.com\/manage\/videos\/(\d+)/);
      if (manageMatch && manageMatch[1]) {
        baseEmbed = `https://player.vimeo.com/video/${manageMatch[1]}?api=1`;
      } else {
        const vimeoReg = /vimeo\.com\/(\d+)(?:\/([a-zA-Z0-9]+))?/;
        const match = noQuery.match(vimeoReg);
        if (match && match[1]) {
          baseEmbed = `https://player.vimeo.com/video/${match[1]}?api=1`;
          if (match[2]) {
            baseEmbed += `&h=${match[2]}`;
          }
        }
      }
    }
    
    if (baseEmbed && startSeconds !== undefined && startSeconds !== null) {
      const sep = baseEmbed.includes("?") ? "&" : "?";
      let cleanBase = baseEmbed;
      if (!baseEmbed.includes("autoplay=")) {
        cleanBase = `${baseEmbed}${sep}autoplay=1`;
      }
      return `${cleanBase}#t=${startSeconds}s`;
    }
    return baseEmbed;
  }

  return null;
}

interface SecureVerticalPlayerProps {
  classData: {
    id?: string;
    title: string;
    category: string;
    purchaseNo?: string | number;
  };
  userEmail: string;
  activeChapter: number;
  setActiveChapter: (idx: number) => void;
}

const CHAPTER_DATA: Chapter[] = [
  {
    id: "01",
    title: "파티세리 오리엔테이션 및 밀가루 배합과학",
    duration: "25분 분량",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    milestones: [
      { timeLabel: "00:00", seconds: 0, title: "웰컴 아틀리에 & 강사 오리엔테이션", desc: "시그니처 코스 구성 및 기본 마음가짐 기술" },
      { timeLabel: "00:05", seconds: 5, title: "파티세리 핵심 3대 밀가루 종류 특징", desc: "단백질 함량에 따른 구조 강도 차이 이론" },
      { timeLabel: "00:12", seconds: 12, title: "분자 결합에 기초한 배합 레시피 제안", desc: "물성 한계를 조절하는 글루텐 그물망 수치 분석" },
      { timeLabel: "00:20", seconds: 20, title: "오리엔테이션 요약 및 1교시 피드백", desc: "반죽 성형 전 확인해야 할 환경 온도 세팅" }
    ]
  },
  {
    id: "02",
    title: "수분율(Hydration)에 따른 팽창 시뮬레이션",
    duration: "45분 분량",
    videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
    milestones: [
      { timeLabel: "00:00", seconds: 0, title: "가습 조건과 수분 오차 가이드 개요", desc: "실내 연소 기구에 의한 수분 증발 요인 파악" },
      { timeLabel: "00:06", seconds: 6, title: "소수점 계량 제빵 과학의 미시 수치", desc: "밀가루 수용성 상태 변화 실험 시연" },
      { timeLabel: "00:15", seconds: 15, title: "팽창 오븐 스프링 최고점 제동 타이밍", desc: "스팀 제어로 크러스트 부풀림 극대화" },
      { timeLabel: "00:25", seconds: 25, title: "반죽 텍스처 검정 및 최적 수분 도출", desc: "과팽창 방지를 위한 안전 조절 세션" }
    ]
  },
  {
    id: "03",
    title: "천연 버터 향미 극대화 및 미각 시그니처 연출",
    duration: "35분 분량",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    milestones: [
      { timeLabel: "00:00", seconds: 0, title: "버터 풍미 유지를 위한 물리적 녹임 규칙", desc: "버터 지질 성분의 융점 관리 규칙 설명" },
      { timeLabel: "00:07", seconds: 7, title: "온도 가속을 통한 분자 아로마 축적법", desc: "갈색 버터(Beurre Noisette) 환상 농도 추출" },
      { timeLabel: "00:14", seconds: 14, title: "필링 크림 내 가루 배합 분산 설계", desc: "기포 안정감을 높여 촉촉한 질감 완성하기" },
      { timeLabel: "00:22", seconds: 22, title: "미각 시그니처 연출을 위한 피니시 터치", desc: "과일 산미와 버터 고소함의 궁극적인 밸런스" }
    ]
  },
  {
    id: "04",
    title: "질문 답변(Q&A) 및 졸업 피드백 세션",
    duration: "서면 맞춤 피드백",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    milestones: [
      { timeLabel: "00:00", seconds: 0, title: "전공생 최다 실패 원인 오답 노트 분석", desc: "두께 불균일, 크랙 발생, 식감 손실 요소 해결" },
      { timeLabel: "00:08", seconds: 8, title: "아틀리에 마스터의 직접 서면 피드백", desc: "과제물 제출 프로세스 가이드 및 기준안" },
      { timeLabel: "00:16", seconds: 16, title: "실력 심사 합격을 위한 최종 마인드셋", desc: "창작 레시피 완성도를 위한 핵심 조리과학 복기" }
    ]
  }
];

export const SecureVerticalPlayer: React.FC<SecureVerticalPlayerProps> = ({ 
  classData, 
  userEmail,
  activeChapter,
  setActiveChapter
}) => {
  const [dbChapters, setDbChapters] = useState<Chapter[]>([]);
  const [loadingDb, setLoadingDb] = useState(true);

  useEffect(() => {
    if (!classData.id) {
      setDbChapters([]);
      setLoadingDb(false);
      return;
    }
    const chaptersRef = collection(db, "posts", classData.id, "chapters");
    const q = query(chaptersRef);
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Chapter[];

      // Sort chapter list ascending
      docs.sort((a, b) => {
        const numA = parseFloat(a.chapterNo || "0") || 0;
        const numB = parseFloat(b.chapterNo || "0") || 0;
        if (numA !== numB) return numA - numB;
        return (a.chapterNo || "").localeCompare(b.chapterNo || "");
      });

      setDbChapters(docs);
      setLoadingDb(false);
    }, (err) => {
      console.error("Failed to load class chapters:", err);
      setLoadingDb(false);
    });

    return () => unsubscribe();
  }, [classData.id]);

  const activeChaptersList = (classData.id && dbChapters.length === 0 && !loadingDb) 
    ? [{ id: "empty", title: classData.title, duration: "0분", videoUrl: "", milestones: [] }] 
    : (dbChapters.length > 0 ? dbChapters.map(ch => ({
      ...ch,
      videoUrl: ch.videoUrl
    })) : CHAPTER_DATA);
  
  const currentChapter = activeChaptersList[activeChapter] || activeChaptersList[0];
  const videoRef = useRef<HTMLVideoElement>(null);

  // Right Side Panel Tab Choice
  const [activeRightTab, setActiveRightTab] = useState<"chapters" | "recipe">("chapters");

  // Video State
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [iframeSeekTime, setIframeSeekTime] = useState<number | null>(null);

  // Security State: Random floating watermark positions
  const [watermarkPos, setWatermarkPos] = useState({ top: "20%", left: "15%" });
  const [watermarkPulse, setWatermarkPulse] = useState(true);

  // Periodically change watermark position to prevent screen capture / scraping record
  useEffect(() => {
    const interval = setInterval(() => {
      const topOptions = ["15%", "35%", "55%", "75%", "85%"];
      const leftOptions = ["10%", "25%", "45%", "60%", "75%"];
      const randomTop = topOptions[Math.floor(Math.random() * topOptions.length)];
      const randomLeft = leftOptions[Math.floor(Math.random() * leftOptions.length)];
      setWatermarkPos({ top: randomTop, left: randomLeft });
      setWatermarkPulse(prev => !prev);
    }, 6000);

    return () => clearInterval(interval);
  }, []);

  const [videoError, setVideoError] = useState(false);

  // Sync state if audio/video plays or pauses outside standard UI
  useEffect(() => {
    setVideoError(false);
    setIsPlaying(false);
    setHasStarted(false);
    setCurrentTime(0);
    setDuration(0);
    setShowSpeedMenu(false);
    setIframeSeekTime(null);
    if (videoRef.current) {
      videoRef.current.load();
      videoRef.current.playbackRate = playbackSpeed;
    }
  }, [activeChapter]);

  const handlePlayToggle = () => {
    if (!videoRef.current) return;
    
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play()
        .then(() => {
          setIsPlaying(true);
          setHasStarted(true);
          setVideoError(false);
        })
        .catch((err) => {
          console.error("Video play failed:", err);
          setVideoError(true);
          setHasStarted(true); // Proceed anyway to show error UI
        });
    }
  };

  const handleStartPlay = () => {
    if (!videoRef.current) return;
    videoRef.current.play()
      .then(() => {
        setIsPlaying(true);
        setHasStarted(true);
        setVideoError(false);
      })
      .catch((err) => {
        console.error("Video play failed:", err);
        setVideoError(true);
        setHasStarted(true); // Force overlay to hide
      });
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration || 30); // Use 30s as default fallback
    }
  };

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
    }
  };

  const handleSeek = (newTime: number) => {
    setCurrentTime(newTime);
    const isEmbed = !!(currentChapter.videoUrl && getEmbedUrl(currentChapter.videoUrl));
    if (isEmbed) {
      setIframeSeekTime(newTime);
    } else if (videoRef.current) {
      videoRef.current.currentTime = newTime;
      videoRef.current.play().then(() => {
        setIsPlaying(true);
        setVideoError(false);
      }).catch((err) => {
        console.error("Video play failed on seek:", err);
        setVideoError(true);
      });
      setHasStarted(true);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const changeSpeed = (speed: number) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
    setShowSpeedMenu(false);
  };

  // Convert seconds to readable MM:SS
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  if (loadingDb) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-zinc-950 p-12 text-center text-zinc-500 font-sans min-h-[350px]">
        <div className="w-10 h-10 border-2 border-emerald-500/10 border-t-emerald-500 rounded-full animate-spin mb-4" />
        <span className="font-extrabold text-zinc-200 text-sm tracking-tight">강의 및 챕터 로드 중</span>
        <span className="text-zinc-500 text-xs mt-1.5 leading-relaxed max-w-[280px]">수강 인가를 검증하고 보안 세션을 설정하고 있습니다. 잠시만 기다려주세요.</span>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto flex flex-col md:flex-row min-h-0 bg-zinc-950 font-sans">
      
      {/* 1. Left Side Video Panel containing horizontal 16:9 video player */}
      <div className="w-full md:w-[640px] bg-zinc-950 p-6 flex flex-col items-center justify-center border-r border-zinc-900 overflow-y-auto shrink-0 select-none">
        
        {/* 16:9 Video Canvas Component */}
        <div 
          className="relative aspect-[16/9] w-full max-w-[585px] bg-black overflow-hidden border border-zinc-900 shadow-2xl group flex flex-col justify-end"
          onContextMenu={(e) => e.preventDefault()}
        >
          {/* HTML5 Direct Video Container with strict copy protective layers */}
          {currentChapter.videoUrl && getEmbedUrl(currentChapter.videoUrl) ? (
            <iframe
              src={getEmbedUrl(currentChapter.videoUrl, iframeSeekTime !== null ? iframeSeekTime : undefined)!}
              className="w-full h-full absolute inset-0 z-50 border-0 pointer-events-auto"
              allowFullScreen
              allow="autoplay; fullscreen; picture-in-picture"
              title="Video Player"
            />
          ) : currentChapter.videoUrl && currentChapter.videoUrl.length > 5 && !videoError ? (
            <video
              key={currentChapter.id}
              ref={videoRef}
              src={currentChapter.videoUrl}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              playsInline
              controls={false}
              disablePictureInPicture
              controlsList="nodownload nofullscreen noremoteplayback"
              className="w-full h-full object-cover select-none pointer-events-none"
              onEnded={() => setIsPlaying(false)}
              onError={() => setVideoError(true)}
            />
          ) : (
            <div className="w-full h-full absolute inset-0 z-10 flex flex-col items-center justify-center bg-zinc-900 border border-zinc-800 text-zinc-500 text-[11px] font-bold font-sans">
              <span className="mb-2 w-8 h-8 flex items-center justify-center bg-zinc-800 rounded-full text-zinc-600">
                <Video size={14} />
              </span>
              {(currentChapter.videoUrl && currentChapter.videoUrl.length > 5 && videoError) ? "재생할 수 없는 영상 소스입니다." : "등록된 영상이 없습니다."}
            </div>
          )}

          {/* Secure Copy protection: Intercepting Layer to prevent clicks on native items or inspection */}
          {currentChapter.videoUrl && !getEmbedUrl(currentChapter.videoUrl) && (
            <div className="absolute inset-0 z-30 pointer-events-auto bg-transparent" />
          )}

          {/* Pre-play Cover State Overlay */}
          <AnimatePresence>
            {currentChapter.videoUrl && currentChapter.videoUrl.length > 5 && !getEmbedUrl(currentChapter.videoUrl) && !hasStarted && (
              <motion.div 
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-zinc-950/98 z-40 flex flex-col items-center justify-center p-6 text-center"
              >
                {/* Visual Lock Accent */}
                <div className="w-12 h-12 bg-zinc-900 rounded-xl border border-zinc-800 flex items-center justify-center mb-3 text-emerald-400 shadow-md">
                  <Lock size={18} className="animate-pulse" />
                </div>

                <p className="text-xs font-extrabold text-white tracking-tight leading-relaxed px-4">
                  {currentChapter.title}
                </p>
                <p className="text-[10px] text-zinc-400 mt-2 max-w-[340px] leading-relaxed">
                  수강생님의 안전 조리 분석 인가가 확인되었습니다. 암호화된 플레이어로 즉시 강의를 안전 재생합니다.
                </p>

                <button 
                  onClick={handleStartPlay}
                  className="mt-5 bg-emerald-600 text-white hover:bg-emerald-500 text-[10px] font-black tracking-widest px-6 py-2.5 rounded-full uppercase shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Play size={10} fill="currentColor" />
                  강의 재생하기 (Play)
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Custom Media Controls Overlay */}
          {currentChapter.videoUrl && currentChapter.videoUrl.length > 5 && !getEmbedUrl(currentChapter.videoUrl) && hasStarted && (
            <div className="absolute bottom-0 inset-x-0 z-50 bg-gradient-to-t from-black/98 via-black/80 to-transparent p-4 flex flex-col gap-3 pt-10 select-none">
              
              {/* Playback progress scrub bar slider */}
              <div className="space-y-1 relative">
                <input
                  type="range"
                  min="0"
                  max={duration || 100}
                  step="0.05"
                  value={currentTime}
                  onChange={handleSeekChange}
                  className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500 focus:outline-none focus:ring-0 active:accent-emerald-400"
                  style={{
                    background: `linear-gradient(to right, #10b981 0%, #10b981 ${(currentTime / (duration || 1)) * 100}%, #27272a ${(currentTime / (duration || 1)) * 100}%, #27272a 100%)`
                  }}
                />

                {/* Milestone progress markers inside the scrub bar strictly for visuals */}
                <div className="absolute top-0 inset-x-0 h-1 pointer-events-none flex justify-between">
                  {currentChapter.milestones.map((ms, idx) => {
                    if (duration <= 0) return null;
                    const leftPercent = (ms.seconds / duration) * 100;
                    return (
                      <div 
                        key={idx} 
                        style={{ left: `${leftPercent}%` }}
                        className="absolute w-1 h-1 bg-white border border-black rounded-full"
                        title={ms.title}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Bottom control buttons row */}
              <div className="flex items-center justify-between text-white">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={handlePlayToggle}
                    className="p-1.5 hover:bg-zinc-800/80 rounded-lg transition-colors text-white cursor-pointer"
                  >
                    {isPlaying ? <Pause size={14} fill="white" /> : <Play size={14} fill="white" />}
                  </button>

                  {/* Volume Button */}
                  <button 
                    onClick={toggleMute}
                    className="p-1.5 hover:bg-zinc-800/80 rounded-lg transition-colors text-zinc-300 hover:text-white cursor-pointer"
                  >
                    {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                  </button>

                  {/* Current Duration text */}
                  <span className="text-[10px] font-mono text-zinc-400">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                </div>

                {/* Right utility options */}
                <div className="flex items-center gap-2.5 relative">
                  
                  {/* Speed Setting */}
                  <button 
                    onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                    className="text-[9px] font-black border border-zinc-800 px-2 py-1 rounded hover:bg-zinc-900 transition-colors uppercase tracking-widest text-zinc-300 font-mono cursor-pointer"
                  >
                    {playbackSpeed.toFixed(1)}x
                  </button>

                  <AnimatePresence>
                    {showSpeedMenu && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute bottom-9 right-0 bg-zinc-900 border border-zinc-805 p-1.5 rounded-xl flex flex-col gap-0.5 z-50 shadow-2xl min-w-[65px]"
                      >
                        {[0.75, 1.0, 1.25, 1.5, 2.0].map((spd) => (
                          <button
                            key={spd}
                            onClick={() => changeSpeed(spd)}
                            className={`px-2 py-1.5 text-left text-[9px] font-mono rounded font-medium cursor-pointer ${
                              playbackSpeed === spd ? "bg-emerald-500 text-white font-bold" : "text-zinc-400 hover:bg-zinc-850 hover:text-white"
                            }`}
                          >
                            {spd.toFixed(2)}x
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

            </div>
          )}
        </div>

      </div>

      {/* 2. Right Side: Overall curriculum syllabus list / Recipe notes */}
      <div className="flex-1 p-6 flex flex-col bg-zinc-950 overflow-y-auto max-h-[340px] md:max-h-none border-t md:border-t-0 border-zinc-900">
        {/* Tab Selection */}
        <div className="flex border-b border-zinc-900 mb-5 font-sans justify-center gap-1 shrink-0">
          <button
            onClick={() => setActiveRightTab("chapters")}
            className={`flex-1 py-3 text-center text-xs font-black tracking-widest uppercase transition-all border-b-2 cursor-pointer select-none ${
              activeRightTab === "chapters"
                ? "text-emerald-500 border-emerald-500"
                : "text-zinc-500 border-transparent hover:text-zinc-300"
            }`}
          >
            강의 챕터
          </button>
          <button
            onClick={() => setActiveRightTab("recipe")}
            className={`flex-1 py-3 text-center text-xs font-black tracking-widest uppercase transition-all border-b-2 cursor-pointer select-none ${
              activeRightTab === "recipe"
                ? "text-emerald-500 border-emerald-500"
                : "text-zinc-500 border-transparent hover:text-zinc-300"
            }`}
          >
            레시피
          </button>
        </div>

        {activeRightTab === "chapters" ? (
          <div className="flex-1 space-y-3">
            {currentChapter && currentChapter.milestones && currentChapter.milestones.length > 0 ? (
              <div className="px-1 py-1 space-y-3">
                {currentChapter.milestones.map((ms, msIdx) => (
                  <button
                    key={msIdx}
                    onClick={() => handleSeek(ms.seconds)}
                    className="relative w-full p-4 rounded-xl border border-zinc-800/80 bg-zinc-900/35 hover:bg-zinc-900/70 hover:border-emerald-500/35 transition-all duration-300 cursor-pointer group flex flex-row items-center gap-4 text-left shadow-sm overflow-hidden pl-5"
                  >
                    {/* Active accent strip on hover */}
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-0 bg-emerald-500 group-hover:h-3/5 rounded-r-md transition-all duration-300" />
                    
                    <div className="shrink-0 relative">
                      <span className="px-2.5 py-1 rounded-md bg-zinc-950 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-black tracking-wider whitespace-nowrap block group-hover:border-emerald-500/60 group-hover:text-emerald-300 transition-all duration-300 shadow-inner">
                        {ms.timeLabel}
                      </span>
                    </div>
                    
                    <div className="flex-1 min-w-0 pr-2">
                       <p className="text-[14px] font-bold text-zinc-200 leading-snug group-hover:text-emerald-400 transition-colors truncate">
                        {ms.title}
                      </p>
                      {ms.desc && (
                        <p className="text-[11px] text-zinc-400 mt-1 font-medium leading-relaxed line-clamp-1">
                          {ms.desc}
                        </p>
                      )}
                    </div>
                    
                    <div className="shrink-0 w-8 h-8 rounded-full bg-zinc-950/60 border border-zinc-850 group-hover:bg-emerald-950/30 group-hover:border-emerald-500/40 group-hover:text-emerald-400 flex items-center justify-center text-zinc-500 transition-all duration-300 shadow-inner">
                      <Play size={10} className="ml-0.5" fill="currentColor" />
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 flex flex-col items-center justify-center gap-3 border border-dashed border-zinc-800 rounded-2xl bg-zinc-900/10">
                <p className="text-[13px] text-zinc-550 font-bold font-sans">
                  등록된 챕터가 없습니다.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 text-left flex flex-col h-full">
            {currentChapter && currentChapter.recipe ? (
              <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-850 text-[14px] whitespace-pre-wrap leading-relaxed font-sans text-zinc-200 select-text overflow-y-auto min-h-[300px]">
                {currentChapter.recipe}
              </div>
            ) : (
              <div className="text-center py-20 flex flex-col items-center justify-center gap-3 border border-dashed border-zinc-800 rounded-2xl bg-zinc-900/10">
                <p className="text-[13px] text-zinc-550 font-bold font-sans">
                  등록된 레시피 정보가 없습니다.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
