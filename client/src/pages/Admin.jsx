import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Ban, Crown, Trash2, RotateCcw } from 'lucide-react';
import { api } from '../api';

export default function Admin() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [tab, setTab] = useState('users');
  const refresh = () => {
    api.get('/admin/stats').then(setStats);
    api.get('/admin/users').then(setUsers);
    api.get('/admin/posts').then(setPosts);
  };
  useEffect(refresh, []);
  const run = (fn, msg) => async () => { if (!msg || confirm(msg)) { try { await fn(); refresh(); } catch (e) { alert(e.message); } } };

  return (
    <main className="wrap wide">
      <h1 className="title">Admin</h1>
      {stats && (
        <div className="stats">
          {[['Members', stats.users], ['Posts', stats.posts], ['Comments', stats.comments], ['Suspended', stats.banned]].map(([k, v]) => (
            <div className="card stat" key={k}><b>{v}</b><span className="muted">{k}</span></div>
          ))}
        </div>
      )}
      <div className="tabs">
        <button className={tab === 'users' ? 'on' : ''} onClick={() => setTab('users')}>Members</button>
        <button className={tab === 'posts' ? 'on' : ''} onClick={() => setTab('posts')}>Recent posts</button>
      </div>

      {tab === 'users' && (
        <div className="card scroll">
          <table>
            <thead><tr><th>Member</th><th>Email</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id}>
                  <td><Link to={`/u/${u._id}`} className="name">{u.displayName || u.username}</Link><div className="muted small">@{u.username}</div></td>
                  <td>{u.email}</td>
                  <td>{u.role === 'admin' ? <span className="badge">Admin</span> : u.banned ? <span className="badge bad">Suspended</span> : 'Active'}</td>
                  <td className="row">
                    {u.role !== 'admin' && (
                      <button className="btn ghost sm" onClick={run(() => api.patch(`/admin/users/${u._id}/ban`))}>
                        {u.banned ? <><RotateCcw size={15} /> Restore</> : <><Ban size={15} /> Suspend</>}
                      </button>
                    )}
                    <button className="btn ghost sm" onClick={run(() => api.patch(`/admin/users/${u._id}/role`), `Change ${u.username}'s admin access?`)}><Crown size={15} /> {u.role === 'admin' ? 'Remove admin' : 'Make admin'}</button>
                    {u.role !== 'admin' && <button className="btn danger sm" onClick={run(() => api.del(`/admin/users/${u._id}`), `Delete ${u.username} and everything they posted?`)}><Trash2 size={15} /> Delete</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'posts' && (
        <div className="card">
          {posts.length === 0 && <p className="muted">No posts yet.</p>}
          {posts.map((p) => (
            <div className="row urow" key={p._id}>
              <div className="grow">
                <span className="name">{p.author?.displayName}</span>
                {p.author?._id !== p.wall?._id && <span className="muted"> on {p.wall?.displayName}&rsquo;s wall</span>}
                <p className="text clip">{p.text || (p.media?.length ? `${p.media.length} photo/video` : 'Shared post')}</p>
                <div className="muted small">{new Date(p.createdAt).toLocaleString()} &middot; {p.comments?.length || 0} comments</div>
              </div>
              <button className="btn danger sm" onClick={run(() => api.del(`/posts/${p._id}`), 'Delete this post?')}><Trash2 size={15} /> Delete</button>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
