import { useMemo, useState } from 'react';
import { Image as ImageIcon, Send, X } from 'lucide-react';
import { api, upload } from '../api';
import { useAuth } from '../auth.jsx';
import Avatar from './Avatar.jsx';

export default function Composer({ wall, placeholder, onPosted }) {
  const { user } = useAuth();
  const [text, setText] = useState('');
  const [files, setFiles] = useState([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const previews = useMemo(() => files.map((f) => ({ url: URL.createObjectURL(f), video: f.type.startsWith('video') })), [files]);

  const pick = (e) => { setFiles((f) => [...f, ...e.target.files].slice(0, 6)); e.target.value = ''; };

  const post = async () => {
    setBusy(true); setErr('');
    try {
      const media = [];
      for (const f of files) media.push(await upload(f));
      onPosted(await api.post('/posts', { text, media, wall }));
      setText(''); setFiles([]);
    } catch (e) { setErr(e.message); } finally { setBusy(false); }
  };

  return (
    <div className="card composer">
      <div className="row top">
        <Avatar u={user} />
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={2} placeholder={placeholder || 'What is on your mind?'} />
      </div>
      {previews.length > 0 && (
        <div className="previews">
          {previews.map((p, i) => (
            <div key={i} className="prev">
              {p.video ? <video src={p.url} muted /> : <img src={p.url} alt="" />}
              <button className="x" onClick={() => setFiles(files.filter((_, j) => j !== i))} aria-label="Remove"><X size={14} /></button>
            </div>
          ))}
        </div>
      )}
      {err && <p className="err">{err}</p>}
      <div className="row between">
        <label className="btn ghost sm">
          <ImageIcon size={18} /> Photo or video
          <input type="file" accept="image/*,video/*" multiple hidden onChange={pick} />
        </label>
        <button className="btn" disabled={busy || (!text.trim() && !files.length)} onClick={post}>
          <Send size={17} /> {busy ? 'Posting' : 'Post'}
        </button>
      </div>
    </div>
  );
}
