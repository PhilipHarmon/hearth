import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Camera, UserPlus, UserCheck, UserX, Pencil, Check, X, MessageCircle } from 'lucide-react';
import { api, upload, mediaUrl } from '../api';
import { useAuth } from '../auth.jsx';
import Avatar from '../components/Avatar.jsx';
import Composer from '../components/Composer.jsx';
import PostList from '../components/PostList.jsx';

const PAGE = 15;

function EditProfile({ p, onClose, onSaved }) {
  const [f, setF] = useState({ displayName: p.displayName, bio: p.bio || '' });
  const [avatar, setAvatar] = useState(null);
  const [cover, setCover] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const save = async () => {
    setBusy(true); setErr('');
    try {
      const body = { ...f };
      if (avatar) body.avatar = (await upload(avatar)).file;
      if (cover) body.cover = (await upload(cover)).file;
      onSaved(await api.put('/users/me', body));
    } catch (e) { setErr(e.message); setBusy(false); }
  };

  return (
    <div className="modal" onClick={onClose}>
      <div className="card sheet" onClick={(e) => e.stopPropagation()}>
        <h2>Edit your wall</h2>
        <label>Display name<input value={f.displayName} maxLength={40} onChange={(e) => setF({ ...f, displayName: e.target.value })} /></label>
        <label>Bio<textarea rows={3} maxLength={300} value={f.bio} onChange={(e) => setF({ ...f, bio: e.target.value })} /></label>
        <label className="btn ghost sm"><Camera size={17} /> {avatar ? avatar.name : 'Change profile photo'}<input hidden type="file" accept="image/*" onChange={(e) => setAvatar(e.target.files[0])} /></label>
        <label className="btn ghost sm"><Camera size={17} /> {cover ? cover.name : 'Change cover photo'}<input hidden type="file" accept="image/*" onChange={(e) => setCover(e.target.files[0])} /></label>
        {err && <p className="err">{err}</p>}
        <div className="row end">
          <button className="btn ghost sm" onClick={onClose}><X size={16} /> Cancel</button>
          <button className="btn sm" onClick={save} disabled={busy}><Check size={16} /> {busy ? 'Saving' : 'Save changes'}</button>
        </div>
      </div>
    </div>
  );
}

export default function Profile() {
  const { id } = useParams();
  const { user, setUser } = useAuth();
  const [p, setP] = useState(null);
  const [posts, setPosts] = useState([]);
  const [more, setMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  const load = async (before) => {
    const d = await api.get(`/posts/wall/${id}` + (before ? `?before=${encodeURIComponent(before)}` : ''));
    setPosts((x) => (before ? [...x, ...d] : d));
    setMore(d.length === PAGE);
    setLoading(false);
  };

  useEffect(() => {
    setP(null); setPosts([]); setLoading(true);
    api.get(`/users/${id}`).then(setP).catch(() => setP(false));
    load();
  }, [id]);

  if (p === false) return <main className="wrap"><div className="card center">This person could not be found.</div></main>;
  if (!p) return <main className="wrap"><div className="card center muted">Loading...</div></main>;

  const setStatus = (r) => setP({ ...p, status: r.status });
  const add = () => api.post(`/users/${id}/friend`).then(setStatus);
  const remove = () => api.del(`/users/${id}/friend`).then(setStatus);
  const self = p.status === 'self';
  const canPost = self || p.status === 'friends' || user.role === 'admin';

  return (
    <main className="wrap wide">
      <section className="card profile">
        <div className="cover" style={p.cover ? { backgroundImage: `url(${mediaUrl(p.cover)})` } : undefined} />
        <div className="pinfo">
          <div className="ring"><Avatar u={p} size={104} /></div>
          <div className="grow">
            <h1>{p.displayName}{p.role === 'admin' && <span className="badge">Admin</span>}</h1>
            <div className="muted">@{p.username}</div>
            {p.bio && <p className="bio">{p.bio}</p>}
          </div>
          <div className="row">
            {self && <button className="btn ghost" onClick={() => setEditing(true)}><Pencil size={17} /> Edit wall</button>}
            {p.status === 'none' && <button className="btn" onClick={add}><UserPlus size={17} /> Add friend</button>}
            {p.status === 'received' && <><button className="btn" onClick={add}><UserCheck size={17} /> Accept</button><button className="btn ghost" onClick={remove}>Decline</button></>}
            {p.status === 'sent' && <button className="btn ghost" onClick={remove}><X size={17} /> Cancel request</button>}
            {p.status === 'friends' && <><Link className="btn" to={`/messages/${p._id}`}><MessageCircle size={17} /> Message</Link><button className="btn ghost" onClick={() => confirm('Remove this friend?') && remove()}><UserX size={17} /> Unfriend</button></>}
          </div>
        </div>
      </section>

      <div className="wrap inner">
        {canPost
          ? <Composer wall={id} placeholder={self ? 'Post to your wall' : `Write on ${p.displayName}\u2019s wall`} onPosted={(n) => setPosts((all) => [n, ...all])} />
          : <div className="card muted center">Become friends to post on {p.displayName}&rsquo;s wall.</div>}
        <PostList
          posts={posts} setPosts={setPosts} loading={loading} more={more} wallId={id}
          onMore={() => load(posts[posts.length - 1].lastActivity)}
          empty="Nothing on this wall yet."
        />
      </div>

      {editing && <EditProfile p={p} onClose={() => setEditing(false)} onSaved={(u) => { setP({ ...p, ...u }); setUser(u); setEditing(false); }} />}
    </main>
  );
}
