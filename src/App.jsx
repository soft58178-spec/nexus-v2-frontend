import { useState, useEffect, useRef, useCallback } from "react";
import { io } from "https://cdn.socket.io/4.7.4/socket.io.esm.min.js";

// ══════════════════════════════════════════
// CONFIG — замените на ваш Railway/Render URL
// ══════════════════════════════════════════
const API_BASE = "nexus-v2-server-production.up.railway.app"; // напр. https://nexus-v2.up.railway.app
const SOCKET_URL = API_BASE;

// ── WebRTC Config (бесплатные STUN серверы Google) ──
const RTC_CONFIG = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "stun:global.stun.twilio.com:3478" }
  ]
};

// ══════════════════════════════════════════
// STYLES
// ══════════════════════════════════════════
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=Space+Mono:wght@400;700&display=swap');
  
  * { margin:0; padding:0; box-sizing:border-box; }
  
  :root {
    --bg: #0a0c10;
    --surface: #111318;
    --surface2: #1a1d24;
    --surface3: #22262f;
    --accent: #00e5ff;
    --accent2: #7c4dff;
    --green: #00e676;
    --red: #ff1744;
    --orange: #ff9100;
    --text: #e8eaf0;
    --muted: #6b7280;
    --border: rgba(255,255,255,0.06);
    --glow: 0 0 20px rgba(0,229,255,0.15);
  }
  
  body { font-family:'Outfit',sans-serif; background:var(--bg); color:var(--text); height:100vh; overflow:hidden; }
  
  .app { display:flex; height:100vh; }
  
  /* SIDEBAR */
  .sidebar {
    width:320px; min-width:320px; background:var(--surface);
    border-right:1px solid var(--border); display:flex; flex-direction:column;
    transition:all 0.3s;
  }
  .sidebar-header {
    padding:20px 16px 12px; border-bottom:1px solid var(--border);
    display:flex; flex-direction:column; gap:12px;
  }
  .logo {
    font-family:'Space Mono',monospace; font-size:22px; font-weight:700;
    background:linear-gradient(135deg,#00e5ff,#7c4dff); -webkit-background-clip:text;
    -webkit-text-fill-color:transparent; letter-spacing:-0.5px;
  }
  .logo span { font-size:11px; opacity:0.5; display:block; font-family:'Outfit',sans-serif; font-weight:400; letter-spacing:2px; -webkit-text-fill-color:#6b7280; }
  .search-bar {
    position:relative;
  }
  .search-bar input {
    width:100%; background:var(--surface2); border:1px solid var(--border);
    color:var(--text); padding:10px 12px 10px 38px; border-radius:12px;
    font-family:'Outfit',sans-serif; font-size:14px; outline:none; transition:all 0.2s;
  }
  .search-bar input:focus { border-color:var(--accent); box-shadow:var(--glow); }
  .search-icon { position:absolute; left:12px; top:50%; transform:translateY(-50%); color:var(--muted); font-size:16px; pointer-events:none; }
  
  .chat-list { flex:1; overflow-y:auto; padding:8px 8px; }
  .chat-list::-webkit-scrollbar { width:3px; }
  .chat-list::-webkit-scrollbar-thumb { background:var(--surface3); border-radius:4px; }
  
  .chat-item {
    display:flex; align-items:center; gap:12px; padding:10px 10px;
    border-radius:14px; cursor:pointer; transition:all 0.15s; position:relative;
  }
  .chat-item:hover { background:var(--surface2); }
  .chat-item.active { background:var(--surface3); }
  .chat-item.active::before {
    content:''; position:absolute; left:0; top:50%; transform:translateY(-50%);
    width:3px; height:60%; background:var(--accent); border-radius:0 3px 3px 0;
  }
  
  .avatar { position:relative; flex-shrink:0; }
  .avatar img { width:46px; height:46px; border-radius:50%; object-fit:cover; background:var(--surface3); }
  .avatar .dot {
    position:absolute; bottom:2px; right:2px; width:11px; height:11px;
    border-radius:50%; border:2px solid var(--surface); background:var(--muted);
  }
  .avatar .dot.online { background:var(--green); }
  
  .chat-info { flex:1; min-width:0; }
  .chat-name { font-weight:600; font-size:14.5px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .chat-preview { font-size:12.5px; color:var(--muted); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin-top:2px; }
  .chat-meta { display:flex; flex-direction:column; align-items:flex-end; gap:4px; }
  .chat-time { font-size:11px; color:var(--muted); }
  .unread-badge {
    background:var(--accent); color:#000; font-size:11px; font-weight:700;
    padding:2px 7px; border-radius:10px; min-width:20px; text-align:center;
  }
  
  .user-panel {
    padding:12px 16px; border-top:1px solid var(--border);
    display:flex; align-items:center; gap:10px;
  }
  .user-panel .my-name { font-weight:600; font-size:14px; }
  .user-panel .my-id { font-size:11px; color:var(--accent); font-family:'Space Mono',monospace; }
  
  /* MAIN CHAT */
  .main { flex:1; display:flex; flex-direction:column; background:var(--bg); min-width:0; }
  
  .chat-header {
    padding:14px 20px; border-bottom:1px solid var(--border);
    display:flex; align-items:center; gap:12px; background:var(--surface);
    min-height:68px;
  }
  .chat-header .info { flex:1; }
  .chat-header .name { font-weight:700; font-size:16px; }
  .chat-header .status { font-size:12px; color:var(--muted); }
  .chat-header .status.online { color:var(--green); }
  .call-btns { display:flex; gap:8px; }
  .call-btn {
    width:38px; height:38px; border-radius:50%; border:none; cursor:pointer;
    display:flex; align-items:center; justify-content:center; font-size:16px;
    transition:all 0.2s;
  }
  .call-btn.audio { background:rgba(0,230,118,0.12); color:var(--green); }
  .call-btn.audio:hover { background:var(--green); color:#000; }
  .call-btn.video { background:rgba(0,229,255,0.12); color:var(--accent); }
  .call-btn.video:hover { background:var(--accent); color:#000; }
  
  /* MESSAGES */
  .messages-area {
    flex:1; overflow-y:auto; padding:20px 20px 8px;
    display:flex; flex-direction:column; gap:4px;
  }
  .messages-area::-webkit-scrollbar { width:4px; }
  .messages-area::-webkit-scrollbar-thumb { background:var(--surface3); border-radius:4px; }
  
  .msg-group { display:flex; flex-direction:column; gap:2px; }
  .msg-row { display:flex; align-items:flex-end; gap:8px; }
  .msg-row.mine { flex-direction:row-reverse; }
  
  .bubble {
    max-width:65%; padding:10px 14px; border-radius:18px; line-height:1.5;
    font-size:14.5px; position:relative; word-break:break-word;
  }
  .bubble.theirs {
    background:var(--surface2); border-bottom-left-radius:4px; color:var(--text);
  }
  .bubble.mine {
    background:linear-gradient(135deg,#0097a7,var(--accent2));
    border-bottom-right-radius:4px; color:#fff;
  }
  .bubble-time { font-size:10.5px; opacity:0.55; margin-top:4px; display:block; text-align:right; }
  .bubble img { max-width:240px; border-radius:10px; display:block; margin-bottom:4px; cursor:pointer; }
  .bubble video { max-width:260px; border-radius:10px; display:block; margin-bottom:4px; }
  .media-file { display:flex; align-items:center; gap:8px; padding:8px; background:rgba(0,0,0,0.2); border-radius:10px; font-size:13px; }
  
  .typing-indicator { display:flex; align-items:center; gap:6px; padding:6px 0; color:var(--muted); font-size:13px; }
  .typing-dots { display:flex; gap:3px; }
  .typing-dots span { width:6px; height:6px; background:var(--muted); border-radius:50%; animation:bounce 1.2s infinite; }
  .typing-dots span:nth-child(2) { animation-delay:0.2s; }
  .typing-dots span:nth-child(3) { animation-delay:0.4s; }
  @keyframes bounce { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-6px)} }
  
  .date-divider { text-align:center; margin:12px 0; }
  .date-divider span { background:var(--surface2); color:var(--muted); font-size:11.5px; padding:4px 12px; border-radius:10px; }
  
  /* INPUT */
  .input-area {
    padding:12px 20px 16px; border-top:1px solid var(--border); background:var(--surface);
  }
  .media-preview { display:flex; gap:8px; flex-wrap:wrap; margin-bottom:8px; }
  .media-preview-item { position:relative; }
  .media-preview-item img { width:60px; height:60px; object-fit:cover; border-radius:8px; }
  .media-preview-item .remove-media {
    position:absolute; top:-5px; right:-5px; width:18px; height:18px;
    background:var(--red); border:none; border-radius:50%; color:#fff; font-size:10px;
    cursor:pointer; display:flex; align-items:center; justify-content:center;
  }
  .input-row { display:flex; align-items:flex-end; gap:10px; }
  .input-row textarea {
    flex:1; background:var(--surface2); border:1px solid var(--border); color:var(--text);
    padding:12px 16px; border-radius:16px; font-family:'Outfit',sans-serif; font-size:14.5px;
    resize:none; outline:none; min-height:48px; max-height:120px; line-height:1.5; transition:all 0.2s;
  }
  .input-row textarea:focus { border-color:var(--accent); box-shadow:var(--glow); }
  .attach-btn, .send-btn {
    width:46px; height:46px; border-radius:50%; border:none; cursor:pointer;
    display:flex; align-items:center; justify-content:center; font-size:18px; transition:all 0.2s;
    flex-shrink:0;
  }
  .attach-btn { background:var(--surface2); color:var(--muted); }
  .attach-btn:hover { background:var(--surface3); color:var(--text); }
  .send-btn { background:linear-gradient(135deg,#0097a7,var(--accent2)); color:#fff; }
  .send-btn:hover { transform:scale(1.08); box-shadow:0 4px 16px rgba(0,229,255,0.3); }
  .send-btn:disabled { opacity:0.4; transform:none; cursor:not-allowed; }
  
  /* EMPTY STATE */
  .empty-state {
    flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center;
    gap:16px; color:var(--muted);
  }
  .empty-state .big-logo {
    font-family:'Space Mono',monospace; font-size:48px; font-weight:700;
    background:linear-gradient(135deg,#00e5ff,#7c4dff); -webkit-background-clip:text;
    -webkit-text-fill-color:transparent; opacity:0.4;
  }
  
  /* CALL OVERLAY */
  .call-overlay {
    position:fixed; inset:0; background:rgba(0,0,0,0.92); z-index:1000;
    display:flex; flex-direction:column; align-items:center; justify-content:center;
    backdrop-filter:blur(10px);
  }
  .call-videos {
    position:relative; width:100%; max-width:900px; height:500px; margin-bottom:24px;
  }
  .call-videos video.remote {
    width:100%; height:100%; object-fit:cover; border-radius:20px; background:#111;
  }
  .call-videos video.local {
    position:absolute; bottom:16px; right:16px; width:160px; height:110px;
    object-fit:cover; border-radius:12px; border:2px solid var(--accent); background:#222;
  }
  .call-info { text-align:center; margin-bottom:24px; }
  .call-info .call-name { font-size:28px; font-weight:700; }
  .call-info .call-status { color:var(--muted); font-size:16px; margin-top:4px; }
  .call-controls { display:flex; gap:16px; }
  .ctrl-btn {
    width:60px; height:60px; border-radius:50%; border:none; cursor:pointer;
    display:flex; align-items:center; justify-content:center; font-size:22px; transition:all 0.2s;
  }
  .ctrl-btn.mute { background:var(--surface3); color:var(--text); }
  .ctrl-btn.mute:hover { background:var(--surface2); }
  .ctrl-btn.cam { background:var(--surface3); color:var(--text); }
  .ctrl-btn.cam:hover { background:var(--surface2); }
  .ctrl-btn.end { background:var(--red); color:#fff; }
  .ctrl-btn.end:hover { background:#d50000; transform:scale(1.08); }
  .ctrl-btn.accept { background:var(--green); color:#000; }
  .ctrl-btn.accept:hover { background:#00c853; transform:scale(1.08); }
  
  /* INCOMING CALL */
  .incoming-call {
    position:fixed; bottom:24px; right:24px; z-index:1001;
    background:var(--surface); border:1px solid var(--border); border-radius:20px;
    padding:20px 24px; width:300px; box-shadow:0 8px 40px rgba(0,0,0,0.6);
    animation:slideIn 0.3s ease;
  }
  @keyframes slideIn { from{transform:translateY(20px);opacity:0} to{transform:none;opacity:1} }
  .incoming-call h4 { font-size:18px; font-weight:700; margin-bottom:4px; }
  .incoming-call p { color:var(--muted); font-size:13px; margin-bottom:16px; }
  .incoming-btns { display:flex; gap:10px; }
  .incoming-btns button {
    flex:1; padding:11px; border-radius:12px; border:none; font-family:'Outfit',sans-serif;
    font-weight:600; font-size:15px; cursor:pointer; transition:all 0.2s;
  }
  .btn-accept { background:var(--green); color:#000; }
  .btn-reject { background:var(--surface3); color:var(--text); }
  
  /* AUTH */
  .auth-screen {
    min-height:100vh; display:flex; align-items:center; justify-content:center;
    background:var(--bg); padding:20px;
  }
  .auth-card {
    background:var(--surface); border:1px solid var(--border); border-radius:24px;
    padding:40px; width:100%; max-width:420px;
  }
  .auth-logo { font-family:'Space Mono',monospace; font-size:32px; font-weight:700; background:linear-gradient(135deg,#00e5ff,#7c4dff); -webkit-background-clip:text; -webkit-text-fill-color:transparent; margin-bottom:6px; }
  .auth-sub { color:var(--muted); font-size:14px; margin-bottom:32px; }
  .field { margin-bottom:16px; }
  .field label { display:block; font-size:13px; color:var(--muted); margin-bottom:6px; font-weight:500; }
  .field input {
    width:100%; background:var(--surface2); border:1px solid var(--border); color:var(--text);
    padding:13px 16px; border-radius:12px; font-family:'Outfit',sans-serif; font-size:15px; outline:none; transition:all 0.2s;
  }
  .field input:focus { border-color:var(--accent); box-shadow:var(--glow); }
  .auth-btn {
    width:100%; padding:14px; border:none; border-radius:14px; cursor:pointer;
    background:linear-gradient(135deg,#0097a7,#7c4dff); color:#fff;
    font-family:'Outfit',sans-serif; font-weight:700; font-size:16px; transition:all 0.2s;
    margin-top:8px;
  }
  .auth-btn:hover { transform:translateY(-1px); box-shadow:0 6px 24px rgba(0,229,255,0.25); }
  .auth-switch { text-align:center; margin-top:18px; font-size:14px; color:var(--muted); }
  .auth-switch span { color:var(--accent); cursor:pointer; font-weight:600; }
  .error-msg { background:rgba(255,23,68,0.12); border:1px solid rgba(255,23,68,0.3); color:#ff8a80; padding:10px 14px; border-radius:10px; font-size:13.5px; margin-bottom:14px; }
  
  /* SEARCH RESULTS */
  .search-results {
    position:absolute; left:8px; right:8px; top:calc(100% + 4px);
    background:var(--surface2); border:1px solid var(--border); border-radius:14px;
    z-index:100; overflow:hidden; box-shadow:0 8px 32px rgba(0,0,0,0.4);
  }
  .search-result-item {
    display:flex; align-items:center; gap:12px; padding:12px 14px; cursor:pointer; transition:background 0.15s;
  }
  .search-result-item:hover { background:var(--surface3); }
  .search-result-item img { width:38px; height:38px; border-radius:50%; }
  .search-result-info .sname { font-weight:600; font-size:14px; }
  .search-result-info .sid { font-size:11.5px; color:var(--accent); font-family:'Space Mono',monospace; }
  
  @media(max-width:640px) {
    .sidebar { width:100%; position:absolute; z-index:10; height:100%; }
    .sidebar.hidden { display:none; }
    .main { width:100%; }
  }
`;

// ══════════════════════════════════════════
// UTILS
// ══════════════════════════════════════════
const api = async (path, opts = {}, token = null) => {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    ...opts,
    body: opts.body ? JSON.stringify(opts.body) : undefined
  });
  return res.json();
};

const formatTime = (iso) => {
  const d = new Date(iso);
  return d.toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' });
};

const formatDate = (iso) => {
  const d = new Date(iso);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return 'Сегодня';
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return 'Вчера';
  return d.toLocaleDateString('ru', { day: 'numeric', month: 'long' });
};

// ══════════════════════════════════════════
// AUTH SCREEN
// ══════════════════════════════════════════
function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ username: '', password: '', displayName: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError(''); setLoading(true);
    try {
      const path = mode === 'login' ? '/api/login' : '/api/register';
      const body = mode === 'login'
        ? { username: form.username, password: form.password }
        : { username: form.username, password: form.password, displayName: form.displayName };
      const data = await api(path, { method: 'POST', body });
      if (data.error) { setError(data.error); setLoading(false); return; }
      localStorage.setItem('nv2_token', data.token);
      onAuth(data.token, data.user);
    } catch (e) {
      setError('Ошибка подключения к серверу. Проверьте URL сервера.');
    }
    setLoading(false);
  };

  return (
    <div className="auth-screen">
      <style>{styles}</style>
      <div className="auth-card">
        <div className="auth-logo">NEXUS-V2</div>
        <div className="auth-sub">Безопасный мессенджер нового поколения</div>
        {error && <div className="error-msg">{error}</div>}
        {mode === 'register' && (
          <div className="field">
            <label>Имя</label>
            <input placeholder="Ваше имя" value={form.displayName} onChange={e => setForm(f => ({...f, displayName: e.target.value}))} />
          </div>
        )}
        <div className="field">
          <label>Username (ID для поиска)</label>
          <input placeholder="например: ivan_petrov" value={form.username} onChange={e => setForm(f => ({...f, username: e.target.value}))} />
        </div>
        <div className="field">
          <label>Пароль</label>
          <input type="password" placeholder="••••••••" value={form.password} onChange={e => setForm(f => ({...f, password: e.target.value}))} onKeyDown={e => e.key === 'Enter' && submit()} />
        </div>
        <button className="auth-btn" onClick={submit} disabled={loading}>
          {loading ? '...' : mode === 'login' ? 'Войти' : 'Зарегистрироваться'}
        </button>
        <div className="auth-switch">
          {mode === 'login' ? <>Нет аккаунта? <span onClick={() => setMode('register')}>Создать</span></> : <>Есть аккаунт? <span onClick={() => setMode('login')}>Войти</span></>}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════
// CALL OVERLAY
// ══════════════════════════════════════════
function CallOverlay({ call, onEnd, onMute, onCam, muted, camOff, isVideo }) {
  const localRef = useRef(null);
  const remoteRef = useRef(null);

  useEffect(() => {
    if (call.localStream && localRef.current) localRef.current.srcObject = call.localStream;
    if (call.remoteStream && remoteRef.current) remoteRef.current.srcObject = call.remoteStream;
  }, [call.localStream, call.remoteStream]);

  return (
    <div className="call-overlay">
      {isVideo ? (
        <div className="call-videos">
          <video className="remote" ref={remoteRef} autoPlay playsInline />
          <video className="local" ref={localRef} autoPlay playsInline muted />
        </div>
      ) : (
        <div style={{marginBottom:24}}>
          <img src={call.avatar} style={{width:100,height:100,borderRadius:'50%',border:'3px solid var(--accent)'}} alt="" />
        </div>
      )}
      <div className="call-info">
        <div className="call-name">{call.name}</div>
        <div className="call-status">{call.status}</div>
      </div>
      <div className="call-controls">
        <button className="ctrl-btn mute" onClick={onMute}>{muted ? '🔇' : '🎤'}</button>
        {isVideo && <button className="ctrl-btn cam" onClick={onCam}>{camOff ? '📷' : '📹'}</button>}
        <button className="ctrl-btn end" onClick={onEnd}>📵</button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════
// MAIN APP
// ══════════════════════════════════════════
export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem('nv2_token'));
  const [me, setMe] = useState(null);
  const [socket, setSocket] = useState(null);
  const [chats, setChats] = useState([]); // [{user, lastMsg, unread}]
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [searchQ, setSearchQ] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [typing, setTyping] = useState(false);
  const [partnerTyping, setPartnerTyping] = useState(false);
  const [mediaFiles, setMediaFiles] = useState([]);
  // Call state
  const [activeCall, setActiveCall] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);
  const [callMuted, setCallMuted] = useState(false);
  const [camOff, setCamOff] = useState(false);

  const messagesEndRef = useRef(null);
  const typingTimeout = useRef(null);
  const pcRef = useRef(null); // RTCPeerConnection
  const localStreamRef = useRef(null);

  // ── Scroll to bottom ──
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  // ── Load me ──
  useEffect(() => {
    if (!token) return;
    api('/api/me', {}, token).then(u => { if (!u.error) setMe(u); else setToken(null); });
  }, [token]);

  // ── Socket ──
  useEffect(() => {
    if (!token || !me) return;
    const s = io(SOCKET_URL, { auth: { token } });
    setSocket(s);

    s.on('message:receive', (msg) => {
      setMessages(prev => {
        const chatId = [me.id, msg.fromId === me.id ? msg.toId : msg.fromId].sort().join('_');
        if (msg.chatId !== chatId && activeChat?.id !== msg.fromId && activeChat?.id !== msg.toId) return prev;
        if (prev.find(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      updateChatList(msg);
    });

    s.on('user:online', ({ userId, online }) => {
      setChats(prev => prev.map(c => c.user.id === userId ? { ...c, user: { ...c.user, online } } : c));
      setActiveChat(prev => prev?.id === userId ? { ...prev, online } : prev);
    });

    s.on('typing:start', ({ fromUserId }) => {
      if (activeChat?.id === fromUserId) setPartnerTyping(true);
    });
    s.on('typing:stop', ({ fromUserId }) => {
      if (activeChat?.id === fromUserId) setPartnerTyping(false);
    });

    // ── Call events ──
    s.on('call:incoming', (data) => setIncomingCall(data));
    s.on('call:answer', ({ answer }) => handleCallAnswer(answer));
    s.on('call:ice', ({ candidate }) => pcRef.current?.addIceCandidate(new RTCIceCandidate(candidate)));
    s.on('call:rejected', () => { endCall(); alert('Звонок отклонён'); });
    s.on('call:ended', () => endCall());
    s.on('call:unavailable', () => { endCall(); alert('Пользователь не в сети'); });

    return () => s.disconnect();
  }, [token, me]);

  const updateChatList = useCallback((msg) => {
    // будет обновлять список чатов на основе сообщений
  }, []);

  // ── Open chat ──
  const openChat = async (user) => {
    setActiveChat(user);
    setSearchQ(''); setSearchResults([]);
    const chatId = [me.id, user.id].sort().join('_');
    const msgs = await api(`/api/messages/${chatId}`, {}, token);
    setMessages(Array.isArray(msgs) ? msgs : []);
    // Обновляем список чатов
    setChats(prev => {
      const exists = prev.find(c => c.user.id === user.id);
      if (exists) return prev;
      return [{ user, lastMsg: null, unread: 0 }, ...prev];
    });
    if (socket) socket.emit('message:read', { chatId });
  };

  // ── Search ──
  useEffect(() => {
    if (!searchQ.trim() || !token) { setSearchResults([]); return; }
    const t = setTimeout(async () => {
      const res = await api(`/api/search?q=${encodeURIComponent(searchQ)}`, {}, token);
      setSearchResults(Array.isArray(res) ? res : []);
    }, 300);
    return () => clearTimeout(t);
  }, [searchQ, token]);

  // ── Send message ──
  const sendMessage = async () => {
    if (!input.trim() && mediaFiles.length === 0) return;
    if (!activeChat || !socket) return;

    let media = null;
    if (mediaFiles.length > 0) {
      const formData = new FormData();
      formData.append('file', mediaFiles[0].file);
      const res = await fetch(`${API_BASE}/api/upload`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: formData
      });
      media = await res.json();
    }

    socket.emit('message:send', { toUserId: activeChat.id, text: input.trim(), media });
    setInput(''); setMediaFiles([]);
    socket.emit('typing:stop', { toUserId: activeChat.id });
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    if (!socket || !activeChat) return;
    if (!typing) { socket.emit('typing:start', { toUserId: activeChat.id }); setTyping(true); }
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => { socket.emit('typing:stop', { toUserId: activeChat.id }); setTyping(false); }, 1500);
  };

  // ── File attach ──
  const handleFileAttach = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const preview = URL.createObjectURL(file);
    setMediaFiles([{ file, preview, type: file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : 'file', name: file.name }]);
  };

  // ══════════════════════════════════════
  // WEBRTC CALLS
  // ══════════════════════════════════════
  const startCall = async (callType) => {
    if (!activeChat || !socket) return;
    try {
      const constraints = callType === 'video' ? { video: true, audio: true } : { video: false, audio: true };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;

      const pc = new RTCPeerConnection(RTC_CONFIG);
      pcRef.current = pc;
      stream.getTracks().forEach(t => pc.addTrack(t, stream));

      let remoteStream = new MediaStream();
      pc.ontrack = (e) => { e.streams[0].getTracks().forEach(t => remoteStream.addTrack(t)); };

      pc.onicecandidate = (e) => {
        if (e.candidate) socket.emit('call:ice', { toUserId: activeChat.id, candidate: e.candidate });
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit('call:offer', { toUserId: activeChat.id, offer, type: callType });

      setActiveCall({
        name: activeChat.displayName,
        avatar: activeChat.avatar,
        status: 'Звоним...',
        localStream: stream,
        remoteStream,
        type: callType
      });
    } catch (e) {
      alert('Нет доступа к микрофону/камере: ' + e.message);
    }
  };

  const handleCallAnswer = async (answer) => {
    if (!pcRef.current) return;
    await pcRef.current.setRemoteDescription(new RTCSessionDescription(answer));
    setActiveCall(prev => prev ? { ...prev, status: 'Разговор...' } : null);
  };

  const acceptCall = async () => {
    if (!incomingCall || !socket) return;
    const callType = incomingCall.type;
    try {
      const constraints = callType === 'video' ? { video: true, audio: true } : { video: false, audio: true };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;

      const pc = new RTCPeerConnection(RTC_CONFIG);
      pcRef.current = pc;
      stream.getTracks().forEach(t => pc.addTrack(t, stream));

      let remoteStream = new MediaStream();
      pc.ontrack = (e) => { e.streams[0].getTracks().forEach(t => remoteStream.addTrack(t)); };
      pc.onicecandidate = (e) => {
        if (e.candidate) socket.emit('call:ice', { toUserId: incomingCall.fromUserId, candidate: e.candidate });
      };

      await pc.setRemoteDescription(new RTCSessionDescription(incomingCall.offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit('call:answer', { toUserId: incomingCall.fromUserId, answer });

      setActiveCall({
        name: incomingCall.fromUser.displayName,
        avatar: incomingCall.fromUser.avatar,
        status: 'Разговор...',
        localStream: stream,
        remoteStream,
        type: callType,
        toUserId: incomingCall.fromUserId
      });
      setIncomingCall(null);
    } catch (e) {
      alert('Нет доступа к микрофону/камере: ' + e.message);
    }
  };

  const rejectCall = () => {
    if (incomingCall && socket) socket.emit('call:reject', { toUserId: incomingCall.fromUserId });
    setIncomingCall(null);
  };

  const endCall = () => {
    if (activeCall?.toUserId && socket) socket.emit('call:end', { toUserId: activeCall.toUserId });
    if (pcRef.current) { pcRef.current.close(); pcRef.current = null; }
    if (localStreamRef.current) { localStreamRef.current.getTracks().forEach(t => t.stop()); localStreamRef.current = null; }
    setActiveCall(null);
    setCallMuted(false); setCamOff(false);
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(t => { t.enabled = !t.enabled; });
      setCallMuted(m => !m);
    }
  };

  const toggleCam = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach(t => { t.enabled = !t.enabled; });
      setCamOff(c => !c);
    }
  };

  // ── Auth ──
  if (!token || !me) return <AuthScreen onAuth={(t, u) => { setToken(t); setMe(u); }} />;

  // ── Render messages ──
  const renderMessage = (msg) => {
    const mine = msg.fromId === me.id;
    return (
      <div key={msg.id} className={`msg-row ${mine ? 'mine' : ''}`}>
        <div className={`bubble ${mine ? 'mine' : 'theirs'}`}>
          {msg.media && msg.media.type === 'image' && (
            <img src={`${API_BASE}${msg.media.url}`} alt="media" onClick={() => window.open(`${API_BASE}${msg.media.url}`)} />
          )}
          {msg.media && msg.media.type === 'video' && (
            <video src={`${API_BASE}${msg.media.url}`} controls />
          )}
          {msg.media && msg.media.type === 'file' && (
            <div className="media-file">📎 <a href={`${API_BASE}${msg.media.url}`} target="_blank" rel="noreferrer" style={{color:'inherit'}}>{msg.media.name}</a></div>
          )}
          {msg.text && <span>{msg.text}</span>}
          <span className="bubble-time">{formatTime(msg.timestamp)}{mine && (msg.read ? ' ✓✓' : ' ✓')}</span>
        </div>
      </div>
    );
  };

  const chatId = activeChat ? [me.id, activeChat.id].sort().join('_') : null;

  return (
    <>
      <style>{styles}</style>
      <div className="app">
        {/* SIDEBAR */}
        <div className="sidebar">
          <div className="sidebar-header">
            <div className="logo">NEXUS-V2 <span>MESSENGER</span></div>
            <div className="search-bar" style={{position:'relative'}}>
              <span className="search-icon">🔍</span>
              <input
                placeholder="Поиск по @username..."
                value={searchQ}
                onChange={e => setSearchQ(e.target.value)}
              />
              {searchResults.length > 0 && (
                <div className="search-results">
                  {searchResults.map(u => (
                    <div key={u.id} className="search-result-item" onClick={() => openChat(u)}>
                      <img src={u.avatar} alt="" />
                      <div className="search-result-info">
                        <div className="sname">{u.displayName}</div>
                        <div className="sid">@{u.username}</div>
                      </div>
                      <div style={{marginLeft:'auto', width:10, height:10, borderRadius:'50%', background: u.online ? 'var(--green)' : 'var(--muted)'}} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="chat-list">
            {chats.map(({ user, lastMsg, unread = 0 }) => (
              <div
                key={user.id}
                className={`chat-item ${activeChat?.id === user.id ? 'active' : ''}`}
                onClick={() => openChat(user)}
              >
                <div className="avatar">
                  <img src={user.avatar} alt="" />
                  <div className={`dot ${user.online ? 'online' : ''}`} />
                </div>
                <div className="chat-info">
                  <div className="chat-name">{user.displayName}</div>
                  <div className="chat-preview">{lastMsg?.text || '@' + user.username}</div>
                </div>
                <div className="chat-meta">
                  {lastMsg && <span className="chat-time">{formatTime(lastMsg.timestamp)}</span>}
                  {unread > 0 && <span className="unread-badge">{unread}</span>}
                </div>
              </div>
            ))}
          </div>
          <div className="user-panel">
            <div className="avatar"><img src={me.avatar} alt="" /><div className="dot online" /></div>
            <div>
              <div className="my-name">{me.displayName}</div>
              <div className="my-id">@{me.username}</div>
            </div>
          </div>
        </div>

        {/* MAIN */}
        <div className="main">
          {!activeChat ? (
            <div className="empty-state">
              <div className="big-logo">NV2</div>
              <div style={{fontSize:18, fontWeight:600}}>Добро пожаловать в Nexus-V2</div>
              <div style={{fontSize:14, color:'var(--muted)', textAlign:'center', maxWidth:280}}>Найдите пользователя через поиск по @username и начните общение</div>
            </div>
          ) : (
            <>
              <div className="chat-header">
                <div className="avatar">
                  <img src={activeChat.avatar} alt="" />
                  <div className={`dot ${activeChat.online ? 'online' : ''}`} />
                </div>
                <div className="info">
                  <div className="name">{activeChat.displayName}</div>
                  <div className={`status ${activeChat.online ? 'online' : ''}`}>
                    {activeChat.online ? 'в сети' : '@' + activeChat.username}
                  </div>
                </div>
                <div className="call-btns">
                  <button className="call-btn audio" onClick={() => startCall('audio')} title="Аудиозвонок">📞</button>
                  <button className="call-btn video" onClick={() => startCall('video')} title="Видеозвонок">📹</button>
                </div>
              </div>

              <div className="messages-area">
                {messages.map((msg, i) => {
                  const showDate = i === 0 || formatDate(messages[i-1].timestamp) !== formatDate(msg.timestamp);
                  return (
                    <div key={msg.id}>
                      {showDate && <div className="date-divider"><span>{formatDate(msg.timestamp)}</span></div>}
                      {renderMessage(msg)}
                    </div>
                  );
                })}
                {partnerTyping && (
                  <div className="typing-indicator">
                    <div className="typing-dots"><span/><span/><span/></div>
                    <span>{activeChat.displayName} печатает...</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="input-area">
                {mediaFiles.length > 0 && (
                  <div className="media-preview">
                    {mediaFiles.map((f, i) => (
                      <div key={i} className="media-preview-item">
                        {f.type === 'image' ? <img src={f.preview} alt="" /> : <div style={{width:60,height:60,background:'var(--surface3)',borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',fontSize:24}}>📎</div>}
                        <button className="remove-media" onClick={() => setMediaFiles([])}>×</button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="input-row">
                  <label htmlFor="file-input" className="attach-btn" style={{cursor:'pointer'}}>📎
                    <input id="file-input" type="file" accept="image/*,video/*,*" style={{display:'none'}} onChange={handleFileAttach} />
                  </label>
                  <textarea
                    rows={1}
                    placeholder="Написать сообщение..."
                    value={input}
                    onChange={handleInputChange}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                  />
                  <button className="send-btn" onClick={sendMessage} disabled={!input.trim() && mediaFiles.length === 0}>➤</button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ACTIVE CALL */}
      {activeCall && (
        <CallOverlay
          call={activeCall}
          onEnd={endCall}
          onMute={toggleMute}
          onCam={toggleCam}
          muted={callMuted}
          camOff={camOff}
          isVideo={activeCall.type === 'video'}
        />
      )}

      {/* INCOMING CALL */}
      {incomingCall && (
        <div className="incoming-call">
          <h4>📲 Входящий {incomingCall.type === 'video' ? 'видео' : 'аудио'}звонок</h4>
          <p>{incomingCall.fromUser.displayName}</p>
          <div className="incoming-btns">
            <button className="btn-accept" onClick={acceptCall}>✅ Принять</button>
            <button className="btn-reject" onClick={rejectCall}>❌ Отклонить</button>
          </div>
        </div>
      )}
    </>
  );
}
