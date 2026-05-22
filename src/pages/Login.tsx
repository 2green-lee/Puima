import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, User, ArrowRight, Chrome, AlertCircle, Loader2, Phone, Smile, ShieldCheck } from 'lucide-react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { 
  loginWithGoogle, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  updateProfile,
  auth,
  db,
  serverTimestamp
} from '../lib/firebase';

const Login: React.FC = () => {
  const location = useLocation();
  const [isLogin, setIsLogin] = useState(() => {
    if (location.state && (location.state as any).mode === 'signup') {
      return false;
    }
    return true;
  });
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [gender, setGender] = useState('남');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  React.useEffect(() => {
    if (location.state && (location.state as any).mode === 'signup') {
      setIsLogin(false);
    } else if (location.state && (location.state as any).mode === 'login') {
      setIsLogin(true);
    }
  }, [location.state]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLogin) {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));
        if (userDoc.exists() && userDoc.data()?.isAdmin) {
          navigate('/admin');
        } else {
          navigate('/');
        }
      } else {
        // Enforce validations for Sign Up
        const hasKorean = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(nickname);
        if (hasKorean && nickname.length > 5) {
          setError('닉네임은 한글 포함 시 최대 5자까지 가능합니다.');
          setLoading(false);
          return;
        }
        if (!hasKorean && nickname.length > 10) {
          setError('닉네임은 영문 기준 최대 10자까지 가능합니다.');
          setLoading(false);
          return;
        }

        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>₩~`_+=\-[\]\\';/ ]/.test(password);
        if (!hasSpecialChar) {
          setError('비밀번호는 특수문자를 최소 1개 이상 포함해야 합니다.');
          setLoading(false);
          return;
        }

        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const displayName = nickname || name || email.split('@')[0];
        await updateProfile(userCredential.user, { displayName });
        
        await setDoc(doc(db, "users", userCredential.user.uid), {
          email: email,
          displayName: displayName,
          nickname: nickname,
          realName: name,
          gender: gender,
          phone: phone,
          isAdmin: false,
          password: password,
          createdAt: serverTimestamp()
        });
        
        navigate('/');
      }
    } catch (err: any) {
      console.error(err);
      let errMsg = err.message || 'Authentication failed';
      if (err.code === 'auth/email-already-in-use') {
        errMsg = '이미 가입된 이메일 주소입니다.';
      } else if (err.code === 'auth/weak-password') {
        errMsg = '비밀번호는 6자 이상이어야 합니다.';
      } else if (err.code === 'auth/invalid-email') {
        errMsg = '올바르지 않은 이메일 형식입니다.';
      } else if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        errMsg = '이메일 또는 비밀번호가 올바르지 않습니다.';
      } else if (err.code === 'auth/operation-not-allowed') {
        errMsg = '이메일/비밀번호 가입이 현재 비활성화되어 있습니다. Firebase 콘솔 -> Build -> Authentication -> Sign-in method 탭에서 "이메일/비밀번호(Email/Password)" 로그인 제공업체를 활성화(Enable)해 주세요.';
      }
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      const result = await loginWithGoogle();
      const user = result.user;
      
      const userDocRef = doc(db, "users", user.uid);
      const userDocSnapshot = await getDoc(userDocRef);
      let isAdmin = false;
      if (!userDocSnapshot.exists()) {
        await setDoc(userDocRef, {
          email: user.email,
          displayName: user.displayName,
          nickname: user.displayName || "",
          realName: "",
          gender: "남",
          phone: "",
          isAdmin: false,
          createdAt: serverTimestamp()
        });
      } else {
        isAdmin = !!userDocSnapshot.data()?.isAdmin;
      }
      
      if (isAdmin) {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Google login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6 selection:bg-black selection:text-white">
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[440px] -mt-4"
      >
        <div className="text-center mb-8">
          <h1 
            onClick={() => navigate('/')}
            className="font-script text-[56px] leading-none cursor-pointer hover:opacity-80 transition-opacity select-none inline-block text-black"
          >
            Puima
          </h1>
        </div>

        <div className="bg-white shadow-2xl shadow-black/5 rounded-[40px] p-8 md:p-10">
          <AnimatePresence mode="wait">
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-8 p-4 bg-red-50 border border-red-105 rounded-2xl flex items-center gap-3 text-red-600 text-xs font-bold"
              >
                <AlertCircle size={18} className="shrink-0" />
                <p className="line-clamp-2">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleAuth} className="space-y-6">
            {!isLogin && (
              <>
                {/* 실명 입력 */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 ml-4">실명 Real Name</label>
                  <div className="relative group">
                    <User size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-black transition-colors" />
                    <input 
                      type="text" 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="이름을 입력해 주세요"
                      required={!isLogin}
                      className="w-full bg-zinc-50 border border-zinc-100 rounded-3xl py-5 pl-14 pr-8 text-base font-bold outline-none focus:bg-white focus:border-black/10 focus:ring-4 focus:ring-black/5 transition-all"
                    />
                  </div>
                </div>

                {/* 닉네임 입력 */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center px-4">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">닉네임 Nickname</label>
                    <span className="text-[9px] font-medium text-zinc-400">한글 5자 / 영문 10자 이내</span>
                  </div>
                  <div className="relative group">
                    <Smile size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-black transition-colors" />
                    <input 
                      type="text" 
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      placeholder="닉네임을 입력해 주세요"
                      required={!isLogin}
                      className="w-full bg-zinc-50 border border-zinc-100 rounded-3xl py-5 pl-14 pr-8 text-base font-bold outline-none focus:bg-white focus:border-black/10 focus:ring-4 focus:ring-black/5 transition-all"
                    />
                  </div>
                </div>

                {/* 성별 선택 */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 ml-4">성별 Gender</label>
                  <div className="flex gap-2">
                    {['남', '여'].map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setGender(g)}
                        className={`flex-1 py-4.5 rounded-3xl text-xs font-black transition-all border cursor-pointer ${
                          gender === g
                            ? 'bg-black text-white border-black shadow-sm'
                            : 'bg-zinc-50 text-zinc-500 border-zinc-100 hover:bg-zinc-100'
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 전화번호 입력 */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center px-4">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">전화번호 Phone</label>
                    <span className="text-[9px] font-medium text-zinc-400">숫자만 입력</span>
                  </div>
                  <div className="relative group">
                    <Phone size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-black transition-colors" />
                    <input 
                      type="text" 
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="휴대폰 번호 (예: 01012345678)"
                      required={!isLogin}
                      className="w-full bg-zinc-50 border border-zinc-100 rounded-3xl py-5 pl-14 pr-8 text-base font-bold outline-none focus:bg-white focus:border-black/10 focus:ring-4 focus:ring-black/5 transition-all"
                    />
                  </div>
                </div>
              </>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 ml-4">이메일 주소 Email Address</label>
              <div className="relative group">
                <Mail size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-black transition-colors" />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  className="w-full bg-zinc-50 border border-zinc-100 rounded-3xl py-5 pl-14 pr-8 text-base font-bold outline-none focus:bg-white focus:border-black/10 focus:ring-4 focus:ring-black/5 transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center px-4">
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">비밀번호 Password</label>
                <span className="text-[9px] font-medium text-zinc-400">특수문자 포함</span>
              </div>
              <div className="relative group">
                <Lock size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-black transition-colors" />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="•••••••• (6자 이상, 특수문자 필수)"
                  required
                  className="w-full bg-zinc-50 border border-zinc-100 rounded-3xl py-5 pl-14 pr-8 text-base font-bold outline-none focus:bg-white focus:border-black/10 focus:ring-4 focus:ring-black/5 transition-all"
                />
              </div>
            </div>

            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white rounded-3xl py-6 font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 hover:bg-zinc-800 transition-all disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  {isLogin ? '로그인 SIGN IN' : '회원가입 완료 JOIN'}
                  <ArrowRight size={18} />
                </>
              )}
            </motion.button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-100"></div>
            </div>
            <div className="relative flex justify-center text-[10px] font-black uppercase tracking-[0.15em]">
              <span className="bg-white px-6 text-zinc-400">또는 간편 로그인</span>
            </div>
          </div>

          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full bg-zinc-50 border border-zinc-100 text-black rounded-3xl py-6 font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 hover:bg-zinc-100 transition-all disabled:opacity-50 cursor-pointer"
          >
            <Chrome size={20} />
            Google 계정으로 계속하기
          </motion.button>

          {/* Preview Quick Admin Login Bypass */}
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              localStorage.setItem('admin_bypass', 'true');
              navigate('/admin');
            }}
            className="w-full mt-4 bg-zinc-50 border border-dashed border-zinc-300 text-zinc-650 rounded-3xl py-4 font-bold tracking-wider text-[11px] flex items-center justify-center gap-2 hover:bg-zinc-100/80 hover:border-zinc-400 transition-all cursor-pointer"
          >
            <ShieldCheck size={16} className="text-zinc-500" />
            [미리보기 전용] 비밀번호 없이 어드민 대시보드 바로 가기
          </motion.button>

          <div className="mt-8 text-center border-t border-zinc-50 pt-6">
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="text-[11px] font-black uppercase tracking-widest text-zinc-400 hover:text-black transition-all cursor-pointer"
            >
              {isLogin ? "계정이 없으신가요? 회원가입하기" : "이미 계정이 있으신가요? 로그인하기"}
            </button>
          </div>
        </div>

        <div className="mt-10 text-center">
          <button 
            onClick={() => navigate('/')}
            className="text-[10px] font-black uppercase tracking-widest text-zinc-300 hover:text-zinc-650 transition-all cursor-pointer"
          >
            홈으로 돌아가기 BACK TO HOME
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
