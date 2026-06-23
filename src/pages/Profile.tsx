import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User, Lock, Mail, Phone, RefreshCw, AlertCircle, CheckCircle2, ChevronLeft, ShieldCheck } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { FixedHeader } from "../components/FixedHeader";
import { translate } from "../utils/translate";

export default function Profile() {
  const navigate = useNavigate();
  const { user, userProfile, lang } = useAuth();

  // Route protection - if user logged out or loading is finished & user is null
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Form states initialized with userProfile values OR defaults
  const [profileNickname, setProfileNickname] = useState("");
  const [profileRealName, setProfileRealName] = useState("");
  const [profilePhone, setProfilePhone] = useState("");
  const [profileGender, setProfileGender] = useState("남");
  const [profileEmail, setProfileEmail] = useState("");

  // Re-auth confirmation
  const [confirmStatePassword, setConfirmStatePassword] = useState("");
  const [isPasswordVerified, setIsPasswordVerified] = useState(false);
  const [verifyingPassword, setVerifyingPassword] = useState(false);

  // New Password state
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Status indicators
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState("");
  const [profileErrorMsg, setProfileErrorMsg] = useState("");

  // Populate data when loaded
  useEffect(() => {
    if (userProfile) {
      setProfileNickname(userProfile.nickname || user?.user_metadata?.full_name || "");
      setProfileRealName(userProfile.realName || "");
      setProfilePhone(userProfile.phone || "");
      setProfileGender(userProfile.gender || "남");
      setProfileEmail(userProfile.email || user?.email || "");
    } else if (user) {
      setProfileEmail(user.email || "");
      setProfileNickname(user.user_metadata?.full_name || "");
    }
  }, [userProfile, user]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white p-6 font-sans">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <ShieldCheck size={32} />
          </div>
          <h1 className="text-2xl font-black mb-2 tracking-tighter uppercase">{translate("로그인이 필요합니다", lang)}</h1>
          <p className="text-zinc-500 mb-8 text-sm font-medium leading-relaxed">
            {translate("정보를 확인하고 수정하시려면 로그인을 진행해주셔야 합니다.", lang)}
          </p>
          <button
            onClick={() => navigate("/login")}
            className="w-full px-8 py-4 bg-black text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-zinc-800 transition-all font-bold active:scale-95 cursor-pointer"
          >
            {translate("로그인 하러 가기", lang)}
          </button>
        </div>
      </div>
    );
  }

  const handleVerifyPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmStatePassword) {
      setProfileErrorMsg(translate("비밀번호를 입력해 주세요.", lang));
      return;
    }
    setVerifyingPassword(true);
    setProfileErrorMsg("");
    setProfileSuccessMsg("");
    try {
      if (!user || !user.email) {
        throw new Error(translate("사용자 정보를 찾을 수 없습니다. 다시 로그인해 주세요.", lang));
      }
      const { error } = await supabase.auth.signInWithPassword({ email: user.email, password: confirmStatePassword });
      if (error) throw error;
      
      setIsPasswordVerified(true);
      setConfirmStatePassword("");
      setProfileSuccessMsg(translate("인증에 성공했습니다. 프로필 수정이 활성화되었습니다.", lang));
      setTimeout(() => setProfileSuccessMsg(""), 4000);
    } catch (err: any) {
      console.error("Password verification failed:", err);
      let msg = translate("비밀번호가 일치하지 않거나 오류가 발생했습니다.", lang);
      if (err.message.includes("Invalid login credentials")) {
        msg = translate("비밀번호가 올바르지 않거나 인증에 실패했습니다.", lang);
      }
      setProfileErrorMsg(msg);
    } finally {
      setVerifyingPassword(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileSuccessMsg("");
    setProfileErrorMsg("");

    try {
      if (!user) throw new Error(translate("로그인이 필요합니다.", lang));

      // 1. Update Supabase User profile document
      const { error: dbError } = await supabase.from("users").update({
        nickname: profileNickname.trim(),
        displayName: profileNickname.trim(),
        realName: profileRealName.trim(),
        phone: profilePhone.trim(),
        gender: profileGender,
        email: profileEmail.trim(),
      }).eq("id", user.id);

      if (dbError) throw dbError;

      // 2. Update Supabase Auth profile
      const updates: any = {};
      if (profileNickname.trim()) {
        updates.data = { full_name: profileNickname.trim() };
      }
      if (profileEmail.trim() && profileEmail.trim() !== user.email) {
        updates.email = profileEmail.trim();
      }

      const { error: authError } = await supabase.auth.updateUser(updates);
      
      if (authError) throw authError;

      setProfileSuccessMsg(translate("프로필 정보가 안전하게 저장되었습니다.", lang));
      setTimeout(() => setProfileSuccessMsg(""), 5000);
    } catch (err: any) {
      console.error("Error saving profile:", err);
      setProfileErrorMsg(err.message || translate("오류가 발생했습니다. 다시 시도해 주세요.", lang));
    } finally {
      setProfileSaving(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword) {
      setProfileErrorMsg(translate("새 비밀번호를 입력해 주세요.", lang));
      return;
    }
    if (newPassword !== confirmPassword) {
      setProfileErrorMsg(translate("비밀번호 확인이 일치하지 않습니다.", lang));
      return;
    }
    if (newPassword.length < 6) {
      setProfileErrorMsg(translate("비밀번호는 최소 6자 이상이어야 합니다.", lang));
      return;
    }

    setProfileSaving(true);
    setProfileSuccessMsg("");
    setProfileErrorMsg("");

    try {
      if (!user) throw new Error(translate("로그인이 필요합니다.", lang));
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      
      setProfileSuccessMsg(translate("비밀번호가 안전하게 변경되었습니다.", lang));
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setProfileSuccessMsg(""), 5000);
    } catch (err: any) {
      console.error("Error changing password:", err);
      setProfileErrorMsg(err.message || translate("비밀번호 변경 중 오류가 발생했습니다.", lang));
    } finally {
      setProfileSaving(false);
    }
  };

  const handleSendResetEmail = async () => {
    if (!user || !user.email) return;
    setProfileSaving(true);
    setProfileSuccessMsg("");
    setProfileErrorMsg("");
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email);
      if (error) throw error;
      setProfileSuccessMsg(translate("비밀번호 초기화 메일이 발송되었습니다. 메일함을 확인해 주세요.", lang));
    } catch (err: any) {
      console.error("Error sending reset email:", err);
      setProfileErrorMsg(err.message || translate("초기화 메일 발송 중 오류가 발생했습니다.", lang));
    } finally {
      setProfileSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-white pt-[120px] pb-24 font-sans text-left">
      <FixedHeader />

      <div className="max-w-2xl mx-auto px-6">
        {/* Navigation / Back Button */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="text-zinc-400 hover:text-black transition-colors text-xs font-bold tracking-tight inline-flex items-center gap-1.5 cursor-pointer"
          >
            <ChevronLeft size={14} />
            {translate("돌아가기", lang)}
          </button>
        </div>

        {/* Page Title */}
        <div className="mb-12 text-center">
          <h2 className="text-3xl md:text-4xl font-pretendard font-black tracking-tight mb-3 uppercase text-zinc-900">My Information</h2>
          <p className="text-zinc-400 text-xs md:text-sm font-medium tracking-tight">
            {translate("수강생님의 프로필 정보를 안전하게 관리하고 수정합니다.", lang)}
          </p>
        </div>

        {/* Main Form Box Container */}
        <div className="bg-white border border-zinc-200 rounded-[32px] p-8 md:p-12 shadow-sm space-y-10">

          {/* Status Alerts */}
          {profileSuccessMsg && (
            <div className="bg-emerald-50 border border-emerald-150 text-emerald-800 rounded-2xl p-4 flex items-start gap-3 text-xs font-semibold animate-fadeIn">
              <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
              <span>{profileSuccessMsg}</span>
            </div>
          )}

          {profileErrorMsg && (
            <div className="bg-red-50 border border-red-155 text-red-800 rounded-2xl p-4 flex items-start gap-3 text-xs font-semibold animate-fadeIn">
              <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
              <span>{profileErrorMsg}</span>
            </div>
          )}

          {/* 1. Security Verification Backdrop (if not verified) */}
          {!isPasswordVerified ? (
            <form onSubmit={handleVerifyPassword} className="space-y-6">
              <div className="space-y-2 bg-zinc-50/50 p-6 rounded-2xl border border-zinc-250">
                <div className="flex items-center gap-2 text-zinc-800">
                  <Lock size={16} />
                  <h4 className="font-extrabold text-xs uppercase tracking-wider">{translate("보안을 위한 비밀번호 확인", lang)}</h4>
                </div>
                <p className="text-[11px] text-zinc-500 leading-relaxed font-semibold">
                  {translate("회원님의 개인정보를 안전하게 보호하기 위해 현재 사용 중인 계정의 비밀번호를 다시 한 번 입력해 주세요.", lang)}
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500">{translate("비밀번호", lang)}</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
                  <input
                    type="password"
                    required
                    placeholder={translate("현재 비밀번호를 입력해 주세요", lang)}
                    value={confirmStatePassword}
                    onChange={(e) => setConfirmStatePassword(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl py-3.5 pl-11 pr-4 text-xs font-bold outline-none focus:bg-white focus:border-black/20 focus:ring-1 focus:ring-black/10 transition-all font-sans"
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
                  translate("비밀번호 확인", lang)
                )}
              </button>
            </form>
          ) : (
            // 2. Editing Form & Security Management
            <div className="space-y-10 animate-fadeIn">
              <form onSubmit={handleSaveProfile} className="space-y-6">
                <div className="flex items-center gap-2 border-b border-zinc-100 pb-2 text-zinc-800">
                  <User size={15} />
                  <h4 className="text-xs font-extrabold uppercase tracking-widest text-zinc-650">{translate("내 정보 수정", lang)}</h4>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1.5">{translate("실명", lang)}</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
                      <input
                        type="text"
                        required
                        placeholder={translate("실명을 입력해 주세요", lang)}
                        value={profileRealName}
                        onChange={(e) => setProfileRealName(e.target.value)}
                        className="w-full bg-zinc-50 border border-zinc-150 rounded-xl py-3.5 pl-11 pr-4 text-xs font-bold outline-none focus:bg-white focus:border-zinc-350 focus:ring-1 focus:ring-zinc-200 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400">{translate("닉네임", lang)}</label>
                      <span className="text-[9px] font-medium text-zinc-400">{translate("한글 5자 / 영문 10자 이내", lang)}</span>
                    </div>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
                      <input
                        type="text"
                        required
                        placeholder={translate("닉네임을 입력해 주세요", lang)}
                        value={profileNickname}
                        onChange={(e) => setProfileNickname(e.target.value)}
                        className="w-full bg-zinc-50 border border-zinc-150 rounded-xl py-3.5 pl-11 pr-4 text-xs font-bold outline-none focus:bg-white focus:border-zinc-350 focus:ring-1 focus:ring-zinc-200 transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1.5">{translate("성별", lang)}</label>
                      <select
                        value={profileGender}
                        onChange={(e) => setProfileGender(e.target.value)}
                        className="w-full bg-zinc-50 border border-zinc-150 rounded-xl py-3.5 px-4 text-xs font-bold outline-none focus:bg-white focus:border-zinc-350 focus:ring-1 focus:ring-zinc-200 transition-all appearance-none cursor-pointer"
                      >
                        <option value="남">{translate("남성", lang)}</option>
                        <option value="여">{translate("여성", lang)}</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1.5">{translate("전화번호", lang)}</label>
                      <div className="relative">
                        <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" size={13} />
                        <input
                          type="tel"
                          placeholder={translate("숫자만 입력", lang)}
                          value={profilePhone}
                          onChange={(e) => setProfilePhone(e.target.value)}
                          className="w-full bg-zinc-50 border border-zinc-150 rounded-xl py-3.5 pl-9 pr-4 text-xs font-bold outline-none focus:bg-white focus:border-zinc-350 focus:ring-1 focus:ring-zinc-200 transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1.5">{translate("이메일 주소", lang)}</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
                      <input
                        type="email"
                        required
                        value={profileEmail}
                        onChange={(e) => setProfileEmail(e.target.value)}
                        className="w-full bg-zinc-50 border border-zinc-150 rounded-xl py-3.5 pl-11 pr-4 text-xs font-bold outline-none focus:bg-white focus:border-zinc-350 focus:ring-1 focus:ring-zinc-200 transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={profileSaving}
                    className="w-full bg-black text-white py-3.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-zinc-800 transition-colors disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 shadow-sm font-bold active:scale-95"
                  >
                    {profileSaving ? (
                      <RefreshCw size={14} className="animate-spin" />
                    ) : (
                      translate("변경 사항 저장하기", lang)
                    )}
                  </button>
                </div>
              </form>

              {/* Password update Form */}
              <div className="border-t border-zinc-200 pt-8 space-y-6 text-left">
                <div className="flex items-center gap-2 border-b border-zinc-100 pb-2 text-zinc-800">
                  <Lock size={15} />
                  <h4 className="text-xs font-extrabold uppercase tracking-widest text-zinc-650">{translate("비밀번호 변경 및 계정 관리", lang)}</h4>
                </div>

                <form onSubmit={handleUpdatePassword} className="space-y-4">
                  <h5 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{translate("비밀번호 안전 변경", lang)}</h5>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-500 mb-1">{translate("새 비밀번호 (6자 이상)", lang)}</label>
                      <input
                        type="password"
                        placeholder={translate("새 비밀번호 입력", lang)}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full bg-zinc-50 border border-zinc-150 rounded-xl py-3.5 px-4 text-xs font-bold outline-none focus:bg-white focus:border-zinc-350 transition-all font-sans"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-500 mb-1">{translate("비밀번호 확인", lang)}</label>
                      <input
                        type="password"
                        placeholder={translate("한번 더 입력", lang)}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full bg-zinc-50 border border-zinc-150 rounded-xl py-3.5 px-4 text-xs font-bold outline-none focus:bg-white focus:border-zinc-350 transition-all font-sans"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={profileSaving}
                    className="w-full bg-black text-white hover:bg-zinc-800 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest transition-colors disabled:opacity-50 cursor-pointer font-bold active:scale-95 flex items-center justify-center gap-2"
                  >
                    {profileSaving ? (
                      <RefreshCw size={14} className="animate-spin" />
                    ) : (
                      translate("비밀번호 업데이트", lang)
                    )}
                  </button>
                </form>

                {/* Send recovery/reset link helper */}
                <div className="pt-6 border-t border-zinc-100 space-y-3">
                  <h5 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{translate("계정 소유권 관리 보조", lang)}</h5>
                  <p className="text-[10px] text-zinc-400 leading-relaxed font-semibold">
                    {translate("인증된 이메일을 사용 중인 경우 비밀번호를 분실하였을 때, 본인의 고유 이메일 주소로 언제든지 복구 재설정 이메일을 즉시 보내어 해결할 수 있습니다.", lang)}
                  </p>
                  <button
                    type="button"
                    onClick={handleSendResetEmail}
                    disabled={profileSaving}
                    className="w-full border border-dashed border-zinc-350 text-zinc-650 hover:border-black hover:text-black hover:bg-zinc-50/50 py-3.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer"
                  >
                    {translate("비밀번호 초기화 메일 발송", lang)}
                  </button>
                </div>

                {/* Account status info footer */}
                <div className="pt-6 border-t border-zinc-100 flex items-center justify-between text-[10px] font-bold text-zinc-400 font-sans uppercase tracking-widest">
                  <span>{translate("계정 상태 및 프로필 식별자", lang)}</span>
                  <span>{translate("정상 / 활성 (Active)", lang)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
