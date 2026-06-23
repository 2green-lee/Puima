import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/AuthContext";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { motion } from "motion/react";

export default function ClaimCourse() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [linkData, setLinkData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [claiming, setClaiming] = useState(false);

  useEffect(() => {
    async function verifyToken() {
      if (!token) {
        setError("유효하지 않은 링크입니다.");
        setLoading(false);
        return;
      }

      try {
        const { data, error: dbError } = await supabase
          .from("magic_links")
          .select("*, posts(title, imageUrl)")
          .eq("id", token)
          .single();

        if (dbError || !data) {
          setError("만료되었거나 존재하지 않는 링크입니다.");
        } else if (data.is_claimed) {
          setError("이미 수령 완료된 링크입니다.");
        } else if (new Date(data.expires_at) < new Date()) {
          setError("유효기간(7일)이 만료된 링크입니다.");
        } else {
          setLinkData(data);
        }
      } catch (err) {
        setError("링크 확인 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    }

    verifyToken();
  }, [token]);

  const handleClaim = async () => {
    if (!user || !linkData) return;
    setClaiming(true);

    try {
      // 1. Mark as claimed
      await supabase
        .from("magic_links")
        .update({ is_claimed: true, claimed_by: user.id })
        .eq("id", linkData.id);

      // 2. Add course to user's enrolledClasses
      const { data: userData } = await supabase
        .from("users")
        .select("enrolledClasses")
        .eq("id", user.id)
        .single();
      
      const enrolled = userData?.enrolledClasses || [];
      if (!enrolled.includes(linkData.post_id)) {
        await supabase
          .from("users")
          .update({ enrolledClasses: [...enrolled, linkData.post_id] })
          .eq("id", user.id);
      }

      alert("강의 수령이 완료되었습니다! 내 강의실로 이동합니다.");
      navigate("/my-classes");
    } catch (err) {
      alert("수령 중 오류가 발생했습니다. 다시 시도해주세요.");
      setClaiming(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <Loader2 className="animate-spin text-zinc-400" size={48} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 px-6">
        <div className="bg-white p-10 rounded-3xl shadow-sm border border-zinc-200 text-center max-w-md w-full">
          <XCircle className="mx-auto text-red-500 mb-6" size={64} />
          <h2 className="text-2xl font-black mb-2">오류 발생</h2>
          <p className="text-zinc-500 mb-8 font-medium">{error}</p>
          <button 
            onClick={() => navigate("/")}
            className="w-full bg-black text-white py-4 rounded-2xl font-bold hover:bg-zinc-800 transition-colors"
          >
            홈으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 px-6 py-20">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-10 rounded-3xl shadow-xl shadow-black/5 border border-zinc-200 text-center max-w-md w-full"
      >
        <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="text-green-500" size={40} />
        </div>
        <h2 className="text-3xl font-black mb-2 tracking-tight">강의 수령하기</h2>
        <p className="text-zinc-500 mb-8 font-medium text-sm">
          네이버 스마트스토어에서 구매하신 강의가 확인되었습니다.<br/>
          아래 버튼을 눌러 계정에 강의를 영구 소장하세요.
        </p>

        {linkData?.posts && (
          <div className="bg-zinc-50 p-4 rounded-2xl mb-8 flex items-center gap-4 text-left border border-zinc-100">
            {linkData.posts.imageUrl ? (
              <img src={linkData.posts.imageUrl} alt="Class" className="w-16 h-16 rounded-xl object-cover" />
            ) : (
              <div className="w-16 h-16 bg-zinc-200 rounded-xl flex-shrink-0" />
            )}
            <div>
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1">구매한 강의</p>
              <p className="font-bold text-sm text-zinc-800 line-clamp-2">{linkData.posts.title}</p>
            </div>
          </div>
        )}

        {!user ? (
          <div className="space-y-4">
            <p className="text-sm font-bold text-red-500 mb-4">로그인 또는 회원가입이 필요합니다.</p>
            <button 
              onClick={() => navigate(`/login?redirect=/claim-course?token=${token}`)}
              className="w-full bg-black text-white py-4 rounded-2xl font-bold hover:bg-zinc-800 transition-colors"
            >
              로그인 / 회원가입 하러가기
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm font-medium text-zinc-600">
              현재 <strong className="text-black">{user.email}</strong> 계정으로<br/>강의를 수령합니다.
            </p>
            <button 
              onClick={handleClaim}
              disabled={claiming}
              className="w-full bg-black text-white py-4 rounded-2xl font-bold hover:bg-zinc-800 transition-colors disabled:bg-zinc-300 flex items-center justify-center gap-2"
            >
              {claiming && <Loader2 className="animate-spin" size={18} />}
              {claiming ? "수령 중..." : "내 계정에 강의 추가하기"}
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
