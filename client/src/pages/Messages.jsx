import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Send } from 'lucide-react';
import { api, refreshCounts } from '../api';
import { useAuth } from '../auth.jsx';
import Avatar from '../components/Avatar.jsx';

const clock = (d) => new Date(d).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

export default function Messages() {
  const { id } = useParams();
  const { user } = useAuth();
  const [convos, setConvos] = useState([]);
  const [thread, setThread] = useState(null);
  const [text, setText] = useState('');
  const [err, setErr] = useState('');
  const box = useRef();

  const loadConvos = () => api.get('/messages').then(setConvos).catch(() => {});
  const loadThread = () => api.get(`/messages/${id}`).then((d) => { setThread(d); refreshCounts(); loadConvos(); }).catch(() => setThread(false));

  // Messages refresh by polling every few seconds while this page is open
  useEffect(() => { loadConvos(); const t = setInterval(loadConvos, 8000); return () => clearInterval(t); }, []);
  useEffect(() => {
    setThread(null); setErr('');
    if (!id) return;
    loadThread();
    const t = setInterval(loadThread, 4000);
    return () => clearInterval(t);
  }, [id]);
  useEffect(() => { if (box.current) box.current.scrollTop = box.current.scrollHeight; }, [thread?.messages?.length]);

  const send = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    try {
      const m = await api.post(`/messages/${id}`, { text });
      setText(''); setErr('');
      setThread((t) => ({ ...t, messages: [...t.messages, m] }));
      loadConvos();
    } catch (e) { setErr(e.message); }
  };

  return (
    <main className={`wrap wide chat ${id ? 'open' : ''}`}>
      <aside className="card clist">
        <h3>Messages</h3>
        {convos.length === 0 && <p className="muted">No conversations yet. Open a friend&rsquo;s profile and choose Message.</p>}
        {convos.map((c) => (
          <Link key={c.user._id} to={`/messages/${c.user._id}`} className={`row crow ${c.user._id === id ? 'on' : ''}`}>
            <Avatar u={c.user} size={42} />
            <div className="grow">
              <div className="name">{c.user.displayName}</div>
              <div className="muted small clip1">{c.last.mine ? 'You: ' : ''}{c.last.text}</div>
            </div>
            {c.unread > 0 && <i className="dot static">{c.unread > 9 ? '9+' : c.unread}</i>}
          </Link>
        ))}
      </aside>

      <section className="card cthread">
        {!id && <div className="muted center pick">Pick a conversation to start chatting.</div>}
        {id && thread === false && <div className="center pick">This conversation could not be opened.</div>}
        {id && thread && (
          <>
            <div className="row chead">
              <Link to="/messages" className="icon-btn back" aria-label="Back to conversations"><ArrowLeft size={20} /></Link>
              <Link to={`/u/${thread.user._id}`}><Avatar u={thread.user} size={38} /></Link>
              <Link to={`/u/${thread.user._id}`} className="name">{thread.user.displayName}</Link>
            </div>
            <div className="msgs" ref={box}>
              {thread.messages.length === 0 && <p className="muted center">Say hello to {thread.user.displayName}.</p>}
              {thread.messages.map((m) => (
                <div key={m._id} className={`msg ${m.from === user._id ? 'mine' : ''}`}>
                  <p>{m.text}</p>
                  <small>{clock(m.createdAt)}</small>
                </div>
              ))}
            </div>
            {err && <p className="err">{err}</p>}
            <form className="row cform" onSubmit={send}>
              <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Write a message" maxLength={2000} />
              <button className="btn sm" disabled={!text.trim()}><Send size={16} /> Send</button>
            </form>
          </>
        )}
      </section>
    </main>
  );
}
