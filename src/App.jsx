import { useState, useEffect, useRef } from "react";

const API_BASE = "https://nexus-v2-server.onrender.com";
const RTC_CONFIG = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    {
      urls: "turn:relay.metered.ca:80",
      username: "b4f3761dfa7a20233daba439",
      credential: "YIQ8G2ylBB5/VPUu"
    },
    {
      urls: "turn:relay.metered.ca:443",
      username: "b4f3761dfa7a20233daba439",
      credential: "YIQ8G2ylBB5/VPUu"
    },
    {
      urls: "turns:relay.metered.ca:443?transport=tcp",
      username: "b4f3761dfa7a20233daba439",
      credential: "YIQ8G2ylBB5/VPUu"
    }
  ]
};

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
*{margin:0;padding:0;box-sizing:border-box;-webkit-tap-highlight-color:transparent;font-family:'Inter',sans-serif;}
:root{
  --bg:#17212b;--s1:#232e3c;--s2:#2b3a4a;--s3:#354a5e;--s4:#3d566e;
  --accent:#2AABEE;--accent2:#1e96d4;--green:#4dcd5e;--red:#e53935;
  --text:#f5f5f5;--muted:#708fa0;--border:rgba(255,255,255,0.06);
  --my-bubble:#2b5278;--their-bubble:#182533;
}
html,body,#root{height:100%;overflow:hidden;background:var(--bg);color:var(--text);}
::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:var(--s3);border-radius:4px}

/* ── LAYOUT ── */
.app{display:flex;height:100vh;height:100dvh;}

/* ── SIDEBAR ── */
.sidebar{
  width:360px;min-width:360px;background:var(--s1);
  display:flex;flex-direction:column;border-right:1px solid var(--border);
  transition:transform .25s;
}
.sidebar-top{
  padding:12px 16px 10px;background:var(--s1);
  display:flex;align-items:center;gap:12px;border-bottom:1px solid var(--border);
}
.sidebar-title{font-size:20px;font-weight:700;color:var(--text);flex:1;}
.s-btn{
  width:36px;height:36px;border-radius:50%;border:none;background:transparent;
  color:var(--muted);cursor:pointer;font-size:20px;display:flex;align-items:center;
  justify-content:center;transition:all .15s;
}
.s-btn:hover{background:var(--s3);color:var(--text);}
.s-btn:active{transform:scale(.9);}

/* SEARCH */
.s-search{padding:8px 12px;border-bottom:1px solid var(--border);position:relative;}
.s-search input{
  width:100%;background:var(--s2);border:none;color:var(--text);
  padding:9px 14px 9px 38px;border-radius:20px;font-size:14px;outline:none;
  transition:background .2s;
}
.s-search input:focus{background:var(--s3);}
.s-search .si{position:absolute;left:22px;top:50%;transform:translateY(-50%);color:var(--muted);pointer-events:none;font-size:16px;}
.s-drop{
  position:absolute;left:12px;right:12px;top:calc(100% + 2px);
  background:var(--s2);border-radius:12px;z-index:100;overflow:hidden;
  box-shadow:0 8px 32px rgba(0,0,0,.5);border:1px solid var(--border);
}
.s-drop-item{display:flex;align-items:center;gap:10px;padding:10px 14px;cursor:pointer;transition:background .1s;}
.s-drop-item:hover{background:var(--s3);}
.s-drop-name{font-weight:600;font-size:14px;}
.s-drop-id{font-size:12px;color:var(--accent);}

/* CHAT LIST */
.chat-list{flex:1;overflow-y:auto;}
.cl-item{
  display:flex;align-items:center;gap:12px;padding:10px 16px;
  cursor:pointer;transition:background .1s;position:relative;
}
.cl-item:hover{background:var(--s2);}
.cl-item.act{background:var(--s2);}
.cl-item.act::after{
  content:'';position:absolute;right:0;top:15%;height:70%;
  width:3px;background:var(--accent);border-radius:3px 0 0 3px;
}
.cl-info{flex:1;min-width:0;}
.cl-name{font-weight:600;font-size:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.cl-sub{font-size:13px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:2px;}
.cl-meta{display:flex;flex-direction:column;align-items:flex-end;gap:4px;flex-shrink:0;}
.cl-time{font-size:12px;color:var(--muted);}
.cl-badge{background:var(--accent);color:#fff;font-size:11px;font-weight:700;padding:2px 7px;border-radius:10px;min-width:20px;text-align:center;}

/* AVATAR */
.av{position:relative;flex-shrink:0;}
.av img{border-radius:50%;object-fit:cover;background:var(--s3);display:block;}
.av.lg img{width:52px;height:52px;}
.av.md img{width:44px;height:44px;}
.av.sm img{width:38px;height:38px;}
.dot{position:absolute;bottom:1px;right:1px;border-radius:50%;border:2px solid var(--s1);}
.av.lg .dot{width:14px;height:14px;}
.av.md .dot{width:12px;height:12px;}
.av.sm .dot{width:10px;height:10px;}
.dot.on{background:var(--green);}
.dot.off{background:var(--muted);}

/* BOTTOM NAV */
.me-panel{padding:10px 14px;border-top:1px solid var(--border);display:flex;align-items:center;gap:10px;}
.me-name{font-weight:600;font-size:14px;}
.me-id{font-size:12px;color:var(--accent);}
.logout-btn{margin-left:auto;padding:6px 12px;background:transparent;border:1px solid var(--border);border-radius:8px;color:var(--muted);font-size:13px;cursor:pointer;transition:all .15s;}
.logout-btn:hover{background:var(--red);border-color:var(--red);color:#fff;}

/* ── MAIN ── */
.main{flex:1;display:flex;flex-direction:column;min-width:0;background:var(--bg);}

/* CHAT HEADER */
.chat-hdr{
  padding:10px 16px;background:var(--s1);border-bottom:1px solid var(--border);
  display:flex;align-items:center;gap:12px;min-height:62px;
}
.ch-info{flex:1;min-width:0;}
.ch-name{font-weight:700;font-size:16px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.ch-status{font-size:12.5px;color:var(--muted);}
.ch-status.on{color:var(--green);}
.ch-btns{display:flex;gap:4px;}
.ch-btn{
  width:40px;height:40px;border-radius:50%;border:none;cursor:pointer;
  display:flex;align-items:center;justify-content:center;font-size:19px;
  background:transparent;transition:all .2s;
}
.ch-btn.phone{color:var(--green);}
.ch-btn.phone:hover{background:rgba(77,205,94,.15);}
.ch-btn.cam{color:var(--accent);}
.ch-btn.cam:hover{background:rgba(42,171,238,.15);}
.ch-btn.back{color:var(--muted);display:none;}
.ch-btn:active{transform:scale(.88);}

/* MESSAGES AREA */
.msgs-area{
  flex:1;overflow-y:auto;padding:12px 10px 6px;
  display:flex;flex-direction:column;gap:2px;
  background:var(--bg);
}
.date-div{text-align:center;margin:10px 0;}
.date-div span{background:rgba(23,33,43,.8);color:var(--muted);font-size:12px;padding:4px 14px;border-radius:14px;border:1px solid var(--border);}
.mrow{display:flex;align-items:flex-end;gap:6px;padding:1px 4px;}
.mrow.me{flex-direction:row-reverse;}
.bubble{
  max-width:68%;padding:8px 12px 6px;border-radius:18px;
  font-size:14.5px;line-height:1.55;word-break:break-word;position:relative;
}
.bubble.them{background:var(--their-bubble);border-bottom-left-radius:4px;}
.bubble.me{background:var(--my-bubble);border-bottom-right-radius:4px;}
.btime{
  font-size:11px;opacity:.6;margin-top:3px;
  display:flex;align-items:center;justify-content:flex-end;gap:3px;
}
.bubble img{max-width:230px;border-radius:10px;display:block;margin-bottom:4px;cursor:pointer;width:100%;}
.bubble video{max-width:250px;border-radius:10px;display:block;margin-bottom:4px;width:100%;}
.fmsg{display:flex;align-items:center;gap:8px;padding:6px 8px;background:rgba(0,0,0,.25);border-radius:10px;font-size:13px;}
.typing-row{display:flex;align-items:center;gap:6px;padding:4px 8px 6px;color:var(--muted);font-size:13px;}
.dots span{width:6px;height:6px;background:var(--muted);border-radius:50%;display:inline-block;margin:0 1px;animation:bop 1.2s infinite;}
.dots span:nth-child(2){animation-delay:.2s}.dots span:nth-child(3){animation-delay:.4s}
@keyframes bop{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-5px)}}

/* INPUT */
.input-wrap{padding:8px 10px 12px;background:var(--s1);border-top:1px solid var(--border);}
.media-row{display:flex;gap:6px;margin-bottom:6px;flex-wrap:wrap;}
.mprev{position:relative;}
.mprev img{width:54px;height:54px;object-fit:cover;border-radius:8px;display:block;}
.mprev-rm{position:absolute;top:-4px;right:-4px;width:16px;height:16px;background:var(--red);border:none;border-radius:50%;color:#fff;font-size:9px;cursor:pointer;display:flex;align-items:center;justify-content:center;}
.irow{display:flex;align-items:flex-end;gap:8px;}
.attach-lbl{
  width:42px;height:42px;display:flex;align-items:center;justify-content:center;
  color:var(--muted);font-size:22px;cursor:pointer;flex-shrink:0;border-radius:50%;
  transition:all .15s;
}
.attach-lbl:hover{color:var(--accent);background:rgba(42,171,238,.1);}
.irow textarea{
  flex:1;background:var(--s2);border:none;color:var(--text);
  padding:10px 14px;border-radius:20px;font-size:14.5px;resize:none;outline:none;
  min-height:42px;max-height:120px;line-height:1.5;
}
.irow textarea::placeholder{color:var(--muted);}
.isend{
  width:42px;height:42px;border-radius:50%;border:none;cursor:pointer;
  background:var(--accent);color:#fff;font-size:18px;display:flex;
  align-items:center;justify-content:center;transition:all .2s;flex-shrink:0;
}
.isend:hover{background:var(--accent2);transform:scale(1.06);}
.isend:disabled{opacity:.4;transform:none;cursor:not-allowed;}
.isend:active{transform:scale(.9);}

/* EMPTY */
.empty-state{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;color:var(--muted);padding:20px;text-align:center;}
.empty-icon{font-size:72px;opacity:.15;}
.empty-state h2{font-size:22px;font-weight:700;color:var(--text);opacity:.6;}
.empty-state p{font-size:14px;line-height:1.7;max-width:280px;}

/* ── AUTH ── */
.auth-wrap{min-height:100vh;display:flex;align-items:center;justify-content:center;background:var(--bg);padding:20px;}
.auth-box{background:var(--s1);border:1px solid var(--border);border-radius:20px;padding:36px 32px;width:100%;max-width:400px;}
.auth-logo{font-size:30px;font-weight:800;color:var(--accent);margin-bottom:4px;letter-spacing:-.5px;}
.auth-desc{color:var(--muted);font-size:14px;margin-bottom:28px;line-height:1.5;}
.f-label{font-size:13px;color:var(--muted);font-weight:500;margin-bottom:6px;display:block;}
.f-wrap{margin-bottom:14px;}
.f-input{
  width:100%;background:var(--s2);border:2px solid transparent;color:var(--text);
  padding:12px 14px;border-radius:12px;font-size:15px;outline:none;transition:all .2s;
}
.f-input:focus{border-color:var(--accent);background:var(--s3);}
.a-btn{
  width:100%;padding:13px;border:none;border-radius:12px;cursor:pointer;
  background:var(--accent);color:#fff;font-weight:700;font-size:16px;
  transition:all .2s;margin-top:4px;
}
.a-btn:hover{background:var(--accent2);}
.a-btn:disabled{opacity:.5;cursor:not-allowed;}
.a-btn:active{transform:scale(.98);}
.a-sw{text-align:center;margin-top:16px;font-size:14px;color:var(--muted);}
.a-sw span{color:var(--accent);cursor:pointer;font-weight:600;}
.a-err{background:rgba(229,57,53,.12);border:1px solid rgba(229,57,53,.35);color:#ef9a9a;padding:10px 14px;border-radius:10px;font-size:13px;margin-bottom:14px;}

/* ── CALL OVERLAY ── */
.call-wrap{
  position:fixed;inset:0;background:rgba(13,20,28,.97);z-index:500;
  display:flex;flex-direction:column;align-items:center;justify-content:center;gap:20px;
  padding:24px;
}
.call-vids{position:relative;width:100%;max-width:760px;aspect-ratio:16/9;border-radius:16px;overflow:hidden;background:#0a0f14;}
video.v-remote{width:100%;height:100%;object-fit:cover;}
video.v-local{position:absolute;bottom:12px;right:12px;width:130px;height:88px;object-fit:cover;border-radius:10px;border:2.5px solid var(--accent);}
.call-ava{width:100px;height:100px;border-radius:50%;border:3px solid var(--accent);object-fit:cover;}
.call-name{font-size:28px;font-weight:700;}
.call-st{color:var(--muted);font-size:15px;}
.call-ctrls{display:flex;gap:16px;margin-top:6px;}
.cc{width:60px;height:60px;border-radius:50%;border:none;cursor:pointer;font-size:23px;display:flex;align-items:center;justify-content:center;transition:all .2s;}
.cc:active{transform:scale(.88);}
.cc.mute,.cc.cam{background:var(--s3);color:var(--text);}
.cc.mute:hover,.cc.cam:hover{background:var(--s4);}
.cc.end{background:var(--red);color:#fff;}
.cc.end:hover{background:#c62828;}

/* INCOMING CALL */
.inc-call{
  position:fixed;bottom:24px;right:24px;z-index:600;
  background:var(--s2);border:1px solid var(--border);border-radius:18px;
  padding:18px 20px;width:290px;box-shadow:0 12px 48px rgba(0,0,0,.6);
  animation:slup .3s ease;
}
@keyframes slup{from{transform:translateY(20px);opacity:0}to{transform:none;opacity:1}}
.inc-call h4{font-size:17px;font-weight:700;margin-bottom:2px;}
.inc-call p{color:var(--muted);font-size:13px;margin-bottom:14px;}
.inc-btns{display:flex;gap:8px;}
.inc-btns button{flex:1;padding:11px;border-radius:12px;border:none;font-weight:600;font-size:14px;cursor:pointer;transition:all .2s;}
.inc-btns button:active{transform:scale(.95);}
.bacc{background:var(--green);color:#fff;}
.brej{background:var(--s3);color:var(--text);}

/* RESPONSIVE MOBILE */
@media(max-width:700px){
  .sidebar{position:absolute;inset:0;z-index:50;width:100%;min-width:100%;}
  .sidebar.hidden{transform:translateX(-100%);pointer-events:none;}
  .ch-btn.back{display:flex!important;}
}
`;

const api = async (path, opts = {}, token = null) => {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...opts,
    body: opts.body ? JSON.stringify(opts.body) : undefined
  });
  return res.json();
};

const fmtTime = iso => new Date(iso).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' });
const fmtDate = iso => {
  const d = new Date(iso), t = new Date();
  if (d.toDateString() === t.toDateString()) return 'Сегодня';
  const y = new Date(t); y.setDate(t.getDate() - 1);
  if (d.toDateString() === y.toDateString()) return 'Вчера';
  return d.toLocaleDateString('ru', { day: 'numeric', month: 'long' });
};

// ══ AUTH ══
function Auth({ onAuth }) {
  const [mode, setMode] = useState('login');
  const [f, setF] = useState({ username: '', password: '', displayName: '' });
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setErr(''); setLoading(true);
    try {
      const body = mode === 'login'
        ? { username: f.username.trim(), password: f.password }
        : { username: f.username.trim(), password: f.password, displayName: f.displayName.trim() };
      const data = await api(mode === 'login' ? '/api/login' : '/api/register', { method: 'POST', body });
      if (data.error) { setErr(data.error); setLoading(false); return; }
      localStorage.setItem('nv2_token', data.token);
      localStorage.setItem('nv2_user', JSON.stringify(data.user));
      onAuth(data.token, data.user);
    } catch { setErr('Ошибка подключения. Проверьте сервер.'); }
    setLoading(false);
  };

  return (
    <div className="auth-wrap">
      <style>{CSS}</style>
      <div className="auth-box">
        <div className="auth-logo">Nexus-V2</div>
        <div className="auth-desc">Мессенджер с видеозвонками<br />Найди друга по @username</div>
        {err && <div className="a-err">{err}</div>}
        {mode === 'register' && (
          <div className="f-wrap">
            <label className="f-label">Ваше имя</label>
            <input className="f-input" placeholder="Иван Петров" value={f.displayName} onChange={e => setF(p => ({ ...p, displayName: e.target.value }))} />
          </div>
        )}
        <div className="f-wrap">
          <label className="f-label">Username (для поиска)</label>
          <input className="f-input" placeholder="ivan_99" value={f.username} onChange={e => setF(p => ({ ...p, username: e.target.value }))} />
        </div>
        <div className="f-wrap">
          <label className="f-label">Пароль</label>
          <input className="f-input" type="password" placeholder="••••••••" value={f.password}
            onChange={e => setF(p => ({ ...p, password: e.target.value }))}
            onKeyDown={e => e.key === 'Enter' && submit()} />
        </div>
        <button className="a-btn" onClick={submit} disabled={loading}>
          {loading ? 'Загрузка...' : mode === 'login' ? '→ Войти' : '→ Создать аккаунт'}
        </button>
        <div className="a-sw">
          {mode === 'login'
            ? <>Нет аккаунта? <span onClick={() => setMode('register')}>Зарегистрироваться</span></>
            : <>Есть аккаунт? <span onClick={() => setMode('login')}>Войти</span></>}
        </div>
      </div>
    </div>
  );
}

// ══ CALL ══
function CallView({ call, onEnd, onMute, onCam, muted, camOff }) {
  const localRef = useRef(null), remoteRef = useRef(null);
  useEffect(() => {
    if (call.localStream && localRef.current) localRef.current.srcObject = call.localStream;
    if (call.remoteStream && remoteRef.current) remoteRef.current.srcObject = call.remoteStream;
  }, [call.localStream, call.remoteStream]);
  return (
    <div className="call-wrap">
      {call.type === 'video'
        ? <div className="call-vids"><video className="v-remote" ref={remoteRef} autoPlay playsInline /><video className="v-local" ref={localRef} autoPlay playsInline muted /></div>
        : <img className="call-ava" src={call.avatar} alt="" />}
      <div className="call-name">{call.name}</div>
      <div className="call-st">{call.status}</div>
      <div className="call-ctrls">
        <button className="cc mute" onClick={onMute}>{muted ? '🔇' : '🎤'}</button>
        {call.type === 'video' && <button className="cc cam" onClick={onCam}>{camOff ? '📷' : '📹'}</button>}
        <button className="cc end" onClick={onEnd}>📵</button>
      </div>
    </div>
  );
}

// ══ MAIN ══
export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem('nv2_token'));
  const [me, setMe] = useState(() => { try { return JSON.parse(localStorage.getItem('nv2_user')); } catch { return null; } });
  const [socket, setSocket] = useState(null);
  const [chats, setChats] = useState([]);
  const [active, setActive] = useState(null);
  const [msgs, setMsgs] = useState([]);
  const [input, setInput] = useState('');
  const [searchQ, setSearchQ] = useState('');
  const [searchRes, setSearchRes] = useState([]);
  const [pTyping, setPTyping] = useState(false);
  const [media, setMedia] = useState([]);
  const [showSide, setShowSide] = useState(true);
  const [activeCall, setActiveCall] = useState(null);
  const [incoming, setIncoming] = useState(null);
  const [muted, setMuted] = useState(false);
  const [camOff, setCamOff] = useState(false);

  const endRef = useRef(null);
  const typRef = useRef(null);
  const pcRef = useRef(null);
  const lsRef = useRef(null);
  const activeRef = useRef(active);
  useEffect(() => { activeRef.current = active; }, [active]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs]);

  // load me from server to keep fresh
  useEffect(() => {
    if (!token) return;
    api('/api/me', {}, token).then(u => {
      if (!u.error) { setMe(u); localStorage.setItem('nv2_user', JSON.stringify(u)); }
      else { setToken(null); setMe(null); localStorage.removeItem('nv2_token'); localStorage.removeItem('nv2_user'); }
    });
  }, [token]);

  // socket
  useEffect(() => {
    if (!token || !me) return;
    let s;
    import('https://cdn.socket.io/4.7.4/socket.io.esm.min.js').then(({ io }) => {
      s = io(API_BASE, { auth: { token } });
      setSocket(s);

      s.on('message:receive', msg => {
        const cur = activeRef.current;
        const uid = msg.fromId === me.id ? msg.toId : msg.fromId;
        setMsgs(prev => {
          if (cur && (msg.fromId === cur.id || msg.toId === cur.id)) {
            return prev.find(m => m.id === msg.id) ? prev : [...prev, msg];
          }
          return prev;
        });
        setChats(prev => {
          const ex = prev.find(c => c.user.id === uid);
          if (ex) return prev.map(c => c.user.id === uid ? { ...c, lastMsg: msg, unread: (cur?.id === uid) ? 0 : (c.unread || 0) + 1 } : c);
          return prev;
        });
      });

      s.on('user:online', ({ userId, online }) => {
        setChats(prev => prev.map(c => c.user.id === userId ? { ...c, user: { ...c.user, online } } : c));
        setActive(prev => prev?.id === userId ? { ...prev, online } : prev);
      });

      s.on('typing:start', ({ fromUserId }) => { if (activeRef.current?.id === fromUserId) setPTyping(true); });
      s.on('typing:stop', ({ fromUserId }) => { if (activeRef.current?.id === fromUserId) setPTyping(false); });

      s.on('call:incoming', data => setIncoming(data));
      s.on('call:answer', ({ answer }) => {
        pcRef.current?.setRemoteDescription(new RTCSessionDescription(answer));
        setActiveCall(c => c ? { ...c, status: 'Разговор...' } : null);
      });
      s.on('call:ice', ({ candidate }) => pcRef.current?.addIceCandidate(new RTCIceCandidate(candidate)));
      s.on('call:rejected', () => { endCall(); });
      s.on('call:ended', () => endCall());
    });
    return () => s?.disconnect();
  }, [token, me?.id]);

  const openChat = async user => {
    setActive(user);
    setShowSide(false);
    setPTyping(false);
    const chatId = [me.id, user.id].sort().join('_');
    const m = await api(`/api/messages/${chatId}`, {}, token);
    setMsgs(Array.isArray(m) ? m : []);
    setChats(prev => {
      const ex = prev.find(c => c.user.id === user.id);
      if (ex) return prev.map(c => c.user.id === user.id ? { ...c, unread: 0 } : c);
      return [{ user, lastMsg: null, unread: 0 }, ...prev];
    });
    socket?.emit('message:read', { chatId });
  };

  // search
  useEffect(() => {
    if (!searchQ.trim() || !token) { setSearchRes([]); return; }
    const t = setTimeout(async () => {
      const r = await api(`/api/search?q=${encodeURIComponent(searchQ)}`, {}, token);
      setSearchRes(Array.isArray(r) ? r : []);
    }, 300);
    return () => clearTimeout(t);
  }, [searchQ, token]);

  const sendMsg = async () => {
    if (!input.trim() && !media.length) return;
    if (!active || !socket) return;
    let med = null;
    if (media.length) {
      const fd = new FormData(); fd.append('file', media[0].file);
      const r = await fetch(`${API_BASE}/api/upload`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd });
      med = await r.json();
    }
    socket.emit('message:send', { toUserId: active.id, text: input.trim(), media: med });
    setInput(''); setMedia([]);
    socket.emit('typing:stop', { toUserId: active.id });
  };

  const handleInput = e => {
    setInput(e.target.value);
    if (!socket || !active) return;
    socket.emit('typing:start', { toUserId: active.id });
    clearTimeout(typRef.current);
    typRef.current = setTimeout(() => socket.emit('typing:stop', { toUserId: active.id }), 1500);
    // auto resize
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
  };

  // calls
  const startCall = async type => {
    if (!active || !socket) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia(type === 'video' ? { video: true, audio: true } : { audio: true });
      lsRef.current = stream;
      const pc = new RTCPeerConnection(RTC_CONFIG); pcRef.current = pc;
      stream.getTracks().forEach(t => pc.addTrack(t, stream));
      const remote = new MediaStream();
      pc.ontrack = e => e.streams[0].getTracks().forEach(t => remote.addTrack(t));
      pc.onicecandidate = e => e.candidate && socket.emit('call:ice', { toUserId: active.id, candidate: e.candidate });
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit('call:offer', { toUserId: active.id, offer, type });
      setActiveCall({ name: active.displayName, avatar: active.avatar, status: 'Вызов...', localStream: stream, remoteStream: remote, type, toUserId: active.id });
    } catch (e) { alert('Нет доступа к микрофону/камере'); }
  };

  const acceptCall = async () => {
    if (!incoming || !socket) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia(incoming.type === 'video' ? { video: true, audio: true } : { audio: true });
      lsRef.current = stream;
      const pc = new RTCPeerConnection(RTC_CONFIG); pcRef.current = pc;
      stream.getTracks().forEach(t => pc.addTrack(t, stream));
      const remote = new MediaStream();
      pc.ontrack = e => e.streams[0].getTracks().forEach(t => remote.addTrack(t));
      pc.onicecandidate = e => e.candidate && socket.emit('call:ice', { toUserId: incoming.fromUserId, candidate: e.candidate });
      await pc.setRemoteDescription(new RTCSessionDescription(incoming.offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit('call:answer', { toUserId: incoming.fromUserId, answer });
      setActiveCall({ name: incoming.fromUser.displayName, avatar: incoming.fromUser.avatar, status: 'Разговор...', localStream: stream, remoteStream: remote, type: incoming.type, toUserId: incoming.fromUserId });
      setIncoming(null);
    } catch { alert('Нет доступа к микрофону/камере'); }
  };

  const endCall = () => {
    if (activeCall?.toUserId) socket?.emit('call:end', { toUserId: activeCall.toUserId });
    pcRef.current?.close(); pcRef.current = null;
    lsRef.current?.getTracks().forEach(t => t.stop()); lsRef.current = null;
    setActiveCall(null); setMuted(false); setCamOff(false);
  };

  const logout = () => {
    localStorage.removeItem('nv2_token');
    localStorage.removeItem('nv2_user');
    setToken(null); setMe(null); setSocket(null);
    setChats([]); setActive(null); setMsgs([]);
  };

  if (!token || !me) return <Auth onAuth={(t, u) => { setToken(t); setMe(u); }} />;

  const renderMsg = msg => {
    const mine = msg.fromId === me.id;
    return (
      <div key={msg.id} className={`mrow ${mine ? 'me' : ''}`}>
        <div className={`bubble ${mine ? 'me' : 'them'}`}>
          {msg.media?.type === 'image' && <img src={`${API_BASE}${msg.media.url}`} alt="" onClick={() => window.open(`${API_BASE}${msg.media.url}`)} />}
          {msg.media?.type === 'video' && <video src={`${API_BASE}${msg.media.url}`} controls />}
          {msg.media?.type === 'file' && <div className="fmsg">📎 <a href={`${API_BASE}${msg.media.url}`} target="_blank" rel="noreferrer" style={{ color: 'inherit' }}>{msg.media.name}</a></div>}
          {msg.text && <span>{msg.text}</span>}
          <div className="btime">{fmtTime(msg.timestamp)}{mine && <span style={{ fontSize: 13 }}>{msg.read ? ' ✓✓' : ' ✓'}</span>}</div>
        </div>
      </div>
    );
  };

  return (
    <>
      <style>{CSS}</style>
      <div className="app">

        {/* ══ SIDEBAR ══ */}
        <div className={`sidebar ${!showSide ? 'hidden' : ''}`}>
          <div className="sidebar-top">
            <div className="sidebar-title">Nexus-V2</div>
          </div>

          <div className="s-search">
            <span className="si">🔍</span>
            <input placeholder="Поиск людей..." value={searchQ} onChange={e => setSearchQ(e.target.value)} />
            {searchRes.length > 0 && (
              <div className="s-drop">
                {searchRes.map(u => (
                  <div key={u.id} className="s-drop-item" onClick={() => { openChat(u); setSearchQ(''); setSearchRes([]); }}>
                    <div className="av sm"><img src={u.avatar} alt="" /><div className={`dot ${u.online ? 'on' : 'off'}`} /></div>
                    <div><div className="s-drop-name">{u.displayName}</div><div className="s-drop-id">@{u.username}</div></div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="chat-list">
            {chats.length === 0 && (
              <div style={{ padding: '24px 16px', color: 'var(--muted)', fontSize: 14, textAlign: 'center', lineHeight: 1.7 }}>
                Найдите человека через поиск выше и начните общение 💬
              </div>
            )}
            {chats.map(({ user, lastMsg, unread = 0 }) => (
              <div key={user.id} className={`cl-item ${active?.id === user.id ? 'act' : ''}`} onClick={() => openChat(user)}>
                <div className="av lg"><img src={user.avatar} alt="" /><div className={`dot ${user.online ? 'on' : 'off'}`} /></div>
                <div className="cl-info">
                  <div className="cl-name">{user.displayName}</div>
                  <div className="cl-sub">{lastMsg?.text || `@${user.username}`}</div>
                </div>
                <div className="cl-meta">
                  {lastMsg && <span className="cl-time">{fmtTime(lastMsg.timestamp)}</span>}
                  {unread > 0 && <span className="cl-badge">{unread}</span>}
                </div>
              </div>
            ))}
          </div>

          <div className="me-panel">
            <div className="av sm"><img src={me.avatar} alt="" /><div className="dot on" /></div>
            <div><div className="me-name">{me.displayName}</div><div className="me-id">@{me.username}</div></div>
            <button className="logout-btn" onClick={logout}>Выйти</button>
          </div>
        </div>

        {/* ══ MAIN ══ */}
        <div className="main">
          {!active ? (
            <div className="empty-state">
              <div className="empty-icon">💬</div>
              <h2>Выберите чат</h2>
              <p>Найдите нужного человека через поиск и начните переписку или звонок</p>
            </div>
          ) : (
            <>
              <div className="chat-hdr">
                <button className="ch-btn back" onClick={() => setShowSide(true)}>←</button>
                <div className="av md"><img src={active.avatar} alt="" /><div className={`dot ${active.online ? 'on' : 'off'}`} /></div>
                <div className="ch-info">
                  <div className="ch-name">{active.displayName}</div>
                  <div className={`ch-status ${active.online ? 'on' : ''}`}>{active.online ? 'в сети' : `@${active.username}`}</div>
                </div>
                <div className="ch-btns">
                  <button className="ch-btn phone" onClick={() => startCall('audio')} title="Голосовой звонок">📞</button>
                  <button className="ch-btn cam" onClick={() => startCall('video')} title="Видеозвонок">📹</button>
                </div>
              </div>

              <div className="msgs-area">
                {msgs.map((msg, i) => {
                  const showDate = i === 0 || fmtDate(msgs[i - 1].timestamp) !== fmtDate(msg.timestamp);
                  return (
                    <div key={msg.id}>
                      {showDate && <div className="date-div"><span>{fmtDate(msg.timestamp)}</span></div>}
                      {renderMsg(msg)}
                    </div>
                  );
                })}
                {pTyping && (
                  <div className="typing-row">
                    <div className="dots"><span /><span /><span /></div>
                    <span>{active.displayName} печатает...</span>
                  </div>
                )}
                <div ref={endRef} />
              </div>

              <div className="input-wrap">
                {media.length > 0 && (
                  <div className="media-row">
                    {media.map((f, i) => (
                      <div key={i} className="mprev">
                        {f.type === 'image' ? <img src={f.preview} alt="" /> : <div style={{ width: 54, height: 54, background: 'var(--s3)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>📎</div>}
                        <button className="mprev-rm" onClick={() => setMedia([])}>×</button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="irow">
                  <label className="attach-lbl">
                    📎<input type="file" style={{ display: 'none' }} onChange={e => {
                      const f = e.target.files[0];
                      if (f) setMedia([{ file: f, preview: URL.createObjectURL(f), type: f.type.startsWith('image/') ? 'image' : 'file', name: f.name }]);
                    }} />
                  </label>
                  <textarea
                    rows={1}
                    placeholder="Сообщение..."
                    value={input}
                    onChange={handleInput}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMsg(); } }}
                  />
                  <button className="isend" onClick={sendMsg} disabled={!input.trim() && !media.length}>
                    ➤
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {activeCall && <CallView call={activeCall} onEnd={endCall} onMute={() => { lsRef.current?.getAudioTracks().forEach(t => { t.enabled = !t.enabled; }); setMuted(m => !m); }} onCam={() => { lsRef.current?.getVideoTracks().forEach(t => { t.enabled = !t.enabled; }); setCamOff(c => !c); }} muted={muted} camOff={camOff} />}

      {incoming && (
        <div className="inc-call">
          <h4>{incoming.type === 'video' ? '📹 Видеозвонок' : '📞 Звонок'}</h4>
          <p>{incoming.fromUser.displayName}</p>
          <div className="inc-btns">
            <button className="bacc" onClick={acceptCall}>✅ Принять</button>
            <button className="brej" onClick={() => { socket?.emit('call:reject', { toUserId: incoming.fromUserId }); setIncoming(null); }}>❌ Отклонить</button>
          </div>
        </div>
      )}
    </>
  );
}
