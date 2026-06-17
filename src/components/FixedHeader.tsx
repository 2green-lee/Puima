import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Youtube, Instagram, User, BookOpen, Settings, LogOut, ChevronDown } from "lucide-react";
import { auth } from "../lib/firebase";
import { signOut } from "firebase/auth";

export function FixedHeader({ handleBackToHome }: { handleBackToHome?: () => void }) {
  const { user, userProfile, lang, setLang, setIsProfileOpen } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogoClick = () => {
    if (handleBackToHome) {
      handleBackToHome();
    } else {
      navigate("/");
      window.scrollTo(0, 0);
    }
  };

  const handleMyPageClick = () => {
    setDropdownOpen(!dropdownOpen);
  };

  const handleGoToMyClasses = () => {
    setDropdownOpen(false);
    navigate("/my-classes");
  };

  const handleOpenProfileDrawer = () => {
    setDropdownOpen(false);
    if (location.pathname !== "/") {
      navigate("/?profile=true");
    } else {
      setIsProfileOpen(true);
    }
  };

  const handleLogoutAction = () => {
    setDropdownOpen(false);
    signOut(auth);
    localStorage.removeItem("admin_bypass");
    window.location.reload();
  };

  return (
    <div className="fixed top-0 left-0 w-full md:min-w-[1100px] h-[60px] md:h-[100px] bg-white border-b border-zinc-100 z-50 flex items-center justify-center px-6 md:px-12 lg:px-0">
      <div className="w-full max-w-[1100px] h-full flex items-center justify-between relative px-2 lg:px-0">
        {/* Social Links on the Left */}
        <div className="flex items-center gap-3.5 md:gap-5">
          <a 
            href="https://www.youtube.com/@%ED%91%B8%EC%9D%B4%EB%A7%88" 
            target="_blank" 
            rel="noreferrer"
            className="text-zinc-400 hover:text-black transition-all group"
          >
            <Youtube size={22} className="group-hover:scale-110 transition-transform" />
          </a>
          <a 
            href="https://instagram.com/puima_official" 
            target="_blank" 
            rel="noreferrer"
            className="text-zinc-400 hover:text-black transition-all group"
          >
            <Instagram size={22} className="group-hover:scale-110 transition-transform" />
          </a>
        </div>

        {/* Logo always centered absolute */}
        <span className="absolute left-1/2 -translate-x-1/2 font-script text-[28px] md:text-4xl cursor-pointer select-none" onClick={handleLogoClick}>Puima</span>

        {/* Language Toggle & Login actions on the Right */}
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
            <div className="relative flex items-center gap-1.5 md:gap-2.5 select-none text-[11px] md:text-xs">
              <button 
                onClick={handleMyPageClick}
                className="inline-flex items-center gap-1 text-zinc-700 hover:text-black font-semibold tracking-tight transition-colors cursor-pointer border border-zinc-200 rounded-full px-2 py-1 md:py-1.5 md:px-3 bg-zinc-50/50 hover:bg-zinc-100/50"
                id="bar-profile"
              >
                <User size={13} className="text-zinc-400" />
                <span className="max-w-[50px] sm:max-w-[90px] truncate font-extrabold">
                  {userProfile?.nickname || user.displayName || user.email?.split('@')[0]}
                </span>
                <span className="text-zinc-400 font-medium text-[10px]">님</span>
                <ChevronDown size={11} className={`text-zinc-400 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
              </button>

              {/* Outside Click Invisible Backdrop */}
              {dropdownOpen && (
                <div 
                  className="fixed inset-0 z-40 bg-transparent" 
                  onClick={() => setDropdownOpen(false)}
                />
              )}

              {/* Dropdown Menu Container */}
              {dropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-44 bg-white border border-zinc-150 rounded-2xl shadow-xl z-50 py-2.5 animate-fadeIn font-sans text-left">
                  <div className="px-4 py-2 border-b border-zinc-50 mb-1.5 shrink-0 select-none">
                    <p className="text-[9px] font-black tracking-widest text-zinc-400 uppercase leading-none mb-1">My Account</p>
                    <p className="text-[11px] font-bold text-black truncate">{user.email}</p>
                  </div>

                  <button
                    onClick={handleGoToMyClasses}
                    className="w-full px-4 py-2 text-xs font-extrabold text-zinc-700 hover:text-black hover:bg-zinc-50 transition-colors flex items-center gap-2 cursor-pointer text-left"
                  >
                    <BookOpen size={13} className="text-zinc-400" />
                    <span>나의 수강 강의</span>
                  </button>

                  <button
                    onClick={handleOpenProfileDrawer}
                    className="w-full px-4 py-2 text-xs font-extrabold text-zinc-700 hover:text-black hover:bg-zinc-50 transition-colors flex items-center gap-2 cursor-pointer text-left"
                  >
                    <Settings size={13} className="text-zinc-400" />
                    <span>내 정보 수정</span>
                  </button>

                  <div className="h-px bg-zinc-100 my-1.5" />

                  <button
                    onClick={handleLogoutAction}
                    className="w-full px-4 py-2 text-xs font-extrabold text-red-650 hover:text-red-750 hover:bg-red-50/30 transition-colors flex items-center gap-2 cursor-pointer text-left"
                  >
                    <LogOut size={13} className="text-red-400" />
                    <span>로그아웃</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1.5 md:gap-3 select-none text-[11px] md:text-xs">
              <button 
                onClick={() => navigate('/login', { state: { from: location.pathname, mode: 'signup' } })}
                className="hidden md:inline text-zinc-400 hover:text-black transition-colors cursor-pointer font-extrabold"
                id="bar-signup"
              >
                {lang === "KOR" ? "회원가입" : "JOIN"}
              </button>
              <span className="hidden md:inline text-zinc-200">/</span>
              <button 
                onClick={() => navigate('/login', { state: { from: location.pathname, mode: 'login' } })}
                className="text-zinc-650 hover:text-black transition-colors cursor-pointer uppercase text-[10px] md:text-xs border border-zinc-300 md:border-none rounded-full px-2.5 py-1 md:p-0 font-extrabold"
                id="bar-login"
              >
                {lang === "KOR" ? "로그인" : "LOGIN"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
