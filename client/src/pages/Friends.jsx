import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, UserPlus, Check, X, MessageCircle } from 'lucide-react';
import { api } from '../api';
import Avatar from '../components/Avatar.jsx';

function Row({ u, children }) {
  return (
    <div className="row urow">
      <Link to={`/u/${u._id}`}><Avatar u={u} /></Link>
      <Link to={`/u/${u._id}`} className="grow"><span className="name">{u.displayName}</span><div className="muted small">@{u.username}</div></Link>
      {children}
    </div>
  );
}

export default function Friends() {
  const [net, setNet] = useState({ friends: [], requests: [] });
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);
  const refresh = () => api.get('/users/me/network').then(setNet);
  useEffect(() => { refresh(); }, []);

  const search = () => (q.trim() ? api.get(`/users/search?q=${encodeURIComponent(q)}`).then(setResults) : setResults([]));
  useEffect(() => { const t = setTimeout(search, 250); return () => clearTimeout(t); }, [q]);

  const act = async (fn) => { await fn(); refresh(); search(); };
  const add = (id) => act(() => api.post(`/users/${id}/friend`));
  const del = (id) => act(() => api.del(`/users/${id}/friend`));

  return (
    <main className="wrap">
      <div className="card search">
        <Search size={19} />
        <input placeholder="Find people by name or username" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      {q.trim() && (
        <section className="card">
          <h3>Search results</h3>
          {results.length === 0 && <p className="muted">No one found.</p>}
          {results.map((u) => (
            <Row key={u._id} u={u}>
              {u.status === 'none' && <button className="btn sm" onClick={() => add(u._id)}><UserPlus size={16} /> Add friend</button>}
              {u.status === 'received' && <button className="btn sm" onClick={() => add(u._id)}><Check size={16} /> Accept</button>}
              {u.status === 'sent' && <span className="muted small">Request sent</span>}
              {u.status === 'friends' && <span className="muted small">Friends</span>}
            </Row>
          ))}
        </section>
      )}
      {net.requests.length > 0 && (
        <section className="card">
          <h3>Friend requests</h3>
          {net.requests.map((u) => (
            <Row key={u._id} u={u}>
              <button className="btn sm" onClick={() => add(u._id)}><Check size={16} /> Accept</button>
              <button className="btn ghost sm" onClick={() => del(u._id)}><X size={16} /> Decline</button>
            </Row>
          ))}
        </section>
      )}
      <section className="card">
        <h3>Your friends ({net.friends.length})</h3>
        {net.friends.length === 0 && <p className="muted">Search above to find people you know.</p>}
        {net.friends.map((u) => <Row key={u._id} u={u}><Link className="btn ghost sm" to={`/messages/${u._id}`}><MessageCircle size={16} /> Message</Link></Row>)}
      </section>
    </main>
  );
}
