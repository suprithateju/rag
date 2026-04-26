import React, { useState } from 'react';
import { useAuth } from '../AuthContext';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login, register } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (isLogin) {
      const res = await login(username, password);
      if (!res.success) setError(res.message);
    } else {
      const res = await register(username, email, password);
      if (res.success) {
        // Auto-login after successful registration
        await login(username, password);
      } else {
        setError(res.message);
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-8 bg-slate-900 relative overflow-hidden font-outfit">
      
      {/* Background blobs matching the main app */}
      <div className="absolute top-0 -left-4 w-96 h-96 bg-fuchsia-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-70 animate-blob"></div>
      <div className="absolute top-0 -right-4 w-96 h-96 bg-cyan-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-70 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-20 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-70 animate-blob animation-delay-4000"></div>

      {/* Glassmorphic Auth Card */}
      <div className="w-full max-w-md bg-white/90 backdrop-blur-3xl rounded-[2.5rem] p-10 shadow-[0_8px_32px_rgba(0,0,0,0.3)] border border-white/40 relative z-10 animate-in fade-in zoom-in duration-500">
        
        <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto bg-gradient-to-br from-fuchsia-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg transform -rotate-3 mb-4">
                <span className="text-3xl">✨</span>
            </div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">DocuMind</h1>
            <p className="text-slate-500 font-bold mt-1 text-[15px]">Intelligent Document Analysis</p>
        </div>

        <h2 className="text-2xl font-bold text-slate-800 mb-6 text-center">
            {isLogin ? 'Welcome Back' : 'Create an Account'}
        </h2>

        {error && (
            <div className="bg-red-100/80 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 text-sm font-bold animate-in fade-in slide-in-from-top-2">
                ⚠️ {error}
            </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
            
            <div className="space-y-1">
                <label className="text-xs font-black tracking-wider text-slate-500 uppercase ml-1">Username</label>
                <input 
                    type="text" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-white/40 bg-white/60 focus:bg-white text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-fuchsia-500/50 transition-all font-medium"
                    placeholder="Enter your username"
                />
            </div>

            {!isLogin && (
                <div className="space-y-1 animate-in fade-in slide-in-from-top-2">
                    <label className="text-xs font-black tracking-wider text-slate-500 uppercase ml-1">Email</label>
                    <input 
                        type="email" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full px-4 py-3 rounded-xl border border-white/40 bg-white/60 focus:bg-white text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-fuchsia-500/50 transition-all font-medium"
                        placeholder="you@example.com"
                    />
                </div>
            )}

            <div className="space-y-1">
                <label className="text-xs font-black tracking-wider text-slate-500 uppercase ml-1">Password</label>
                <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-white/40 bg-white/60 focus:bg-white text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-fuchsia-500/50 transition-all font-medium"
                    placeholder="••••••••"
                />
            </div>

            <button 
                type="submit" 
                disabled={loading}
                className="w-full mt-6 bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white py-3.5 rounded-xl font-black text-[15px] shadow-[0_10px_20px_rgba(217,70,239,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
                {loading && <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
                {isLogin ? 'Sign In' : 'Sign Up'}
            </button>
        </form>

        <div className="mt-8 text-center text-sm font-bold text-slate-500">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button 
                onClick={() => {
                    setIsLogin(!isLogin);
                    setError('');
                }}
                className="text-fuchsia-600 hover:text-fuchsia-700 hover:underline focus:outline-none"
            >
                {isLogin ? 'Sign up' : 'Sign in'}
            </button>
        </div>

      </div>
    </div>
  );
};

export default AuthPage;
