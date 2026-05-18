import { useState, useEffect } from "react";
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
import { ArrowLeft, Plus, Edit2, Trash2, Save, X, LogIn, LogOut } from "lucide-react";

const ADMIN_EMAIL = "rtytgb123@gmail.com";

interface Post {
  id: string;
  title: string;
  visuals: string;
  image: string;
  naverUrl: string;
  originalPrice?: string;
  price: string;
  rating?: string;
  reviews?: string;
}

export default function Admin() {
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Post>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user?.email === ADMIN_EMAIL) {
      const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const docs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Post[];
        setPosts(docs);
      });
      return () => unsubscribe();
    }
  }, [user]);

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
          createdAt: serverTimestamp(),
        });
      }
      setEditingId(null);
      setFormData({});
    } catch (error) {
      console.error("Error saving post:", error);
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
  };

  if (loading) return <div className="p-10 text-center">Loading...</div>;

  if (!user || user.email !== ADMIN_EMAIL) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-6">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-sm border border-zinc-200">
          <h1 className="text-2xl font-bold mb-6">Admin Access</h1>
          <p className="text-zinc-500 mb-8 text-sm">Please log in with the admin account to manage your classes.</p>
          <button 
            onClick={loginWithGoogle}
            className="w-full flex items-center justify-center gap-2 bg-black text-white p-3 rounded-lg font-bold hover:bg-zinc-800 transition-colors"
          >
            <LogIn size={20} />
            Login with Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 pb-20">
      <header className="bg-white border-b border-zinc-200 p-6 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <a href="/" className="p-2 hover:bg-zinc-100 rounded-full transition-colors">
              <ArrowLeft size={20} />
            </a>
            <h1 className="text-xl font-bold">Admin Dashboard</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs font-medium text-zinc-400">{user.email}</span>
            <button onClick={logout} className="p-2 text-zinc-400 hover:text-black transition-colors">
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-lg font-bold">Manage Posts</h2>
          <button 
            onClick={() => { setEditingId(null); setFormData({}); }}
            className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-full font-bold text-sm hover:bg-zinc-800"
          >
            <Plus size={18} />
            Add New Class
          </button>
        </div>

        {/* Editor Modal/Form */}
        {(editingId !== null || Object.keys(formData).length > 0) && (
          <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm mb-10 overflow-hidden">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold">{editingId ? "Edit Post" : "New Post"}</h3>
              <button onClick={() => { setEditingId(null); setFormData({}); }} className="p-1 hover:bg-zinc-100 rounded-full">
                <X size={20} />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest mb-1 shadow-sm">Title</label>
                  <input 
                    type="text" 
                    value={formData.title || ""} 
                    onChange={e => setFormData({...formData, title: e.target.value})}
                    placeholder="[마스터 클래스] ..."
                    className="w-full p-3 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-black"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest mb-1">Visuals / Category</label>
                  <input 
                    type="text" 
                    value={formData.visuals || ""} 
                    onChange={e => setFormData({...formData, visuals: e.target.value})}
                    placeholder="Deep character baking"
                    className="w-full p-3 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-black"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest mb-1">Naver URL</label>
                  <input 
                    type="text" 
                    value={formData.naverUrl || ""} 
                    onChange={e => setFormData({...formData, naverUrl: e.target.value})}
                    placeholder="https://smartstore.naver.com/..."
                    className="w-full p-3 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-black"
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest mb-1">Price</label>
                    <input 
                      type="text" 
                      value={formData.price || ""} 
                      onChange={e => setFormData({...formData, price: e.target.value})}
                      placeholder="₩49,900"
                      className="w-full p-3 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-black"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest mb-1">Original Price</label>
                    <input 
                      type="text" 
                      value={formData.originalPrice || ""} 
                      onChange={e => setFormData({...formData, originalPrice: e.target.value})}
                      placeholder="₩69,900"
                      className="w-full p-3 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-black"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest mb-1">Rating</label>
                    <input 
                      type="text" 
                      value={formData.rating || ""} 
                      onChange={e => setFormData({...formData, rating: e.target.value})}
                      placeholder="4.95"
                      className="w-full p-3 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-black"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest mb-1">Reviews</label>
                    <input 
                      type="text" 
                      value={formData.reviews || ""} 
                      onChange={e => setFormData({...formData, reviews: e.target.value})}
                      placeholder="26"
                      className="w-full p-3 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-black"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest mb-1">Image Index / URL</label>
                  <select 
                    value={formData.image || ""} 
                    onChange={e => setFormData({...formData, image: e.target.value})}
                    className="w-full p-3 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-black"
                  >
                    <option value="">Select Placeholder or Custom</option>
                    <option value="heroImg">Hero Dessert</option>
                    <option value="pastryImg">Pastry</option>
                    <option value="macaronsImg">Macarons</option>
                    <option value="cakeImg">Cake</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div className="mt-8 flex justify-end gap-3">
              <button 
                onClick={() => { setEditingId(null); setFormData({}); }}
                className="px-6 py-2 border border-zinc-200 rounded-full text-sm font-bold hover:bg-zinc-50"
              >
                Cancel
              </button>
              <button 
                onClick={handleSave}
                className="flex items-center gap-2 bg-black text-white px-8 py-2 rounded-full font-bold text-sm hover:bg-zinc-800"
              >
                <Save size={18} />
                Save Post
              </button>
            </div>
          </div>
        )}

        {/* Posts List */}
        <div className="space-y-4">
          {posts.map(post => (
            <div key={post.id} className="bg-white p-4 rounded-xl border border-zinc-200 flex items-center gap-4 group">
              <div className="w-16 h-16 bg-zinc-100 rounded-lg overflow-hidden flex-shrink-0">
                <div className="w-full h-full flex items-center justify-center text-[10px] text-zinc-400 uppercase font-mono">
                  Img
                </div>
              </div>
              <div className="flex-grow">
                <h4 className="font-bold text-sm">{post.title}</h4>
                <div className="flex gap-3 text-[11px] text-zinc-500 font-mono mt-1">
                  <span>{post.price}</span>
                  {post.originalPrice && <span className="line-through">{post.originalPrice}</span>}
                  <span>{post.rating} ({post.reviews})</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => startEdit(post)}
                  className="p-2 text-zinc-400 hover:text-black hover:bg-zinc-100 rounded-full transition-all"
                >
                  <Edit2 size={18} />
                </button>
                <button 
                  onClick={() => handleDelete(post.id)}
                  className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
          
          {posts.length === 0 && (
            <div className="text-center py-20 bg-zinc-50 border-2 border-dashed border-zinc-200 rounded-3xl">
              <p className="text-zinc-500 text-sm">No posts yet. Add your first class!</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
