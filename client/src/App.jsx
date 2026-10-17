import { useEffect, useMemo, useState } from 'react';
import { Routes, Route, Navigate, NavLink, Link, useLocation } from 'react-router-dom';
import { Flame, Home, Users, ShieldCheck, LogOut, Bell, MessageCircle } from 'lucide-react';
import { useAuth } from './auth.jsx';
import { api } from './api';
import Avatar from './components/Avatar.jsx';
import Auth from './pages/Auth.jsx';
import Feed from './pages/Feed.jsx';
import Profile from './pages/Profile.jsx';
import Friends from './pages/Friends.jsx';
import Admin from './pages/Admin.jsx';
import Tag from './pages/Tag.jsx';
import PostPage from './pages/PostPage.jsx';
import Notifications from './pages/Notifications.jsx';
import Messages from './pages/Messages.jsx';

const LEAVES = ['🍂', '🍁', '🍂', '🍁', '🍃'];

function Leaves() {
  const leaves = useMemo(() => Array.from({ length: 12 }, (_, i) => ({
    ch: LEAVES[i % LEAVES.length],
    style: {
      left: `${(i * 8.3 + Math.random() * 6) % 100}%`,
      fontSize: `${16 + Math.random() * 18}px`,
      animationDuration: `${16 + Math.random() * 14}s`,
      animationDelay: `-${Math.random() * 30}s`,
      '--drift': `${-80 + Math.random() * 160}px`,
    },
  })), []);
  return <div className="leaves" aria-hidden="true">{leaves.map((l, i) => <span key={i} style={l.style}>{l.ch}</span>)}</div>;
}

function Badge({ n }) {
  return n > 0 ? <i className="dot">{n > 9 ? '9+' : n}</i> : null;
}

function Nav() {
  const { user, logout } = useAuth();
  const [counts, setCounts] = useState({ notifications: 0, messages: 0 });
  const { pathname } = useLocation();

  useEffect(() => {
    const load = () => api.get('/notifications/count').then(setCounts).catch(() => {});
    load();
    const t = setInterval(load, 15000);
    window.addEventListener('hearth:counts', load);
    return () => { clearInterval(t); window.removeEventListener('hearth:counts', load); };
  }, [pathname]);

  return (
    <header className="nav">
      <div className="nav-in">
        <Link to="/" className="logo"><Flame className="flame" size={26} /><span>Hearth</span></Link>
        <nav>
          <NavLink to="/" end title="Feed"><Home size={20} /><b>Feed</b></NavLink>
          <NavLink to="/friends" title="Friends"><Users size={20} /><b>Friends</b></NavLink>
          <NavLink to="/messages" title="Messages"><span className="ico"><MessageCircle size={20} /><Badge n={counts.messages} /></span><b>Messages</b></NavLink>
          <NavLink to="/notifications" title="Notifications"><span className="ico"><Bell size={20} /><Badge n={counts.notifications} /></span><b>Notifications</b></NavLink>
          {user.role === 'admin' && <NavLink to="/admin" title="Admin"><ShieldCheck size={20} /><b>Admin</b></NavLink>}
          <NavLink to={`/u/${user._id}`} title="My wall"><Avatar u={user} size={26} /><b>My wall</b></NavLink>
          <button className="icon-btn" onClick={logout} title="Sign out" aria-label="Sign out"><LogOut size={20} /></button>
        </nav>
      </div>
    </header>
  );
}

export default function App() {
  const { user, ready } = useAuth();
  if (!ready) return <div className="splash">🍂</div>;
  const guard = (el) => (user ? el : <Navigate to="/login" />);
  return (
    <>
      <Leaves />
      {user && <Nav />}
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" /> : <Auth />} />
        <Route path="/" element={guard(<Feed />)} />
        <Route path="/u/:id" element={guard(<Profile />)} />
        <Route path="/friends" element={guard(<Friends />)} />
        <Route path="/tag/:tag" element={guard(<Tag />)} />
        <Route path="/post/:id" element={guard(<PostPage />)} />
        <Route path="/notifications" element={guard(<Notifications />)} />
        <Route path="/messages" element={guard(<Messages />)} />
        <Route path="/messages/:id" element={guard(<Messages />)} />
        <Route path="/admin" element={user?.role === 'admin' ? <Admin /> : <Navigate to="/" />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
}
