import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, MessageCircle, Share2, Pencil, Trash2, Check, X, Send } from 'lucide-react';
import { api, mediaUrl } from '../api';
import { useAuth } from '../auth.jsx';
import Avatar from './Avatar.jsx';
import RichText from './RichText.jsx';

const ago = (d) => {
  const s = (Date.now() - new Date(d)) / 1000;
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
  return new Date(d).toLocaleDateString();
};

function Media({ media }) {
  if (!media?.length) return null;
  return (
    <div className={`media m${Math.min(media.length, 3)}`}>
      {media.map((m, i) => m.kind === 'video'
        ? <video key={i} src={mediaUrl(m.file)} controls preload="metadata" />
        : <img key={i} src={mediaUrl(m.file)} loading="lazy" alt="" />)}
    </div>
  );
}

function Head({ post, children }) {
  const same = post.author._id === post.wall._id;
  return (
    <div className="row head">
      <Link to={`/u/${post.author._id}`}><Avatar u={post.author} /></Link>
      <div className="grow">
        <Link className="name" to={`/u/${post.author._id}`}>{post.author.displayName}</Link>
        {!same && <> posted on <Link className="name" to={`/u/${post.wall._id}`}>{post.wall.displayName}</Link>&rsquo;s wall</>}
        <Link className="muted small when" to={`/post/${post._id}`}>{ago(post.createdAt)}</Link>
      </div>
      {children}
    </div>
  );
}

export default function PostCard({ post, onUpdate, onDelete, onShare }) {
  const { user } = useAuth();
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(post.text);
  const [comment, setComment] = useState('');
  const [allComments, setAll] = useState(false);
  const input = useRef();
  const me = user._id;
  const liked = post.likes.includes(me);
  const mine = post.author._id === me;
  const canDelete = mine || post.wall._id === me || user.role === 'admin';
  const comments = allComments ? post.comments : post.comments.slice(-3);
  const removed = !post.text && !post.media.length && !post.sharedFrom;

  const run = async (fn) => { try { return await fn(); } catch (e) { alert(e.message); } };
  const update = (fn) => run(async () => onUpdate(await fn()));

  const saveEdit = () => update(async () => { const p = await api.put(`/posts/${post._id}`, { text }); setEditing(false); return p; });
  const remove = () => confirm('Delete this post?') && run(async () => { await api.del(`/posts/${post._id}`); onDelete(post._id); });
  const share = () => confirm('Share this to your wall?') && run(async () => onShare(await api.post(`/posts/${post._id}/share`)));
  const send = (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    update(async () => { const p = await api.post(`/posts/${post._id}/comments`, { text: comment }); setComment(''); return p; });
  };

  return (
    <article className="card post">
      <Head post={post}>
        {mine && !editing && <button className="icon-btn" title="Edit" aria-label="Edit post" onClick={() => setEditing(true)}><Pencil size={17} /></button>}
        {canDelete && <button className="icon-btn danger" title="Delete" aria-label="Delete post" onClick={remove}><Trash2 size={17} /></button>}
      </Head>

      {editing ? (
        <div className="edit">
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} />
          <div className="row end">
            <button className="btn ghost sm" onClick={() => { setEditing(false); setText(post.text); }}><X size={16} /> Cancel</button>
            <button className="btn sm" onClick={saveEdit}><Check size={16} /> Save changes</button>
          </div>
        </div>
      ) : post.text && <p className="text"><RichText text={post.text} /></p>}

      <Media media={post.media} />

      {post.sharedFrom && (
        <div className="shared">
          <Head post={post.sharedFrom} />
          {post.sharedFrom.text && <p className="text"><RichText text={post.sharedFrom.text} /></p>}
          <Media media={post.sharedFrom.media} />
        </div>
      )}
      {removed && <p className="muted">The original post was deleted.</p>}

      <div className="actions">
        <button className={`act like ${liked ? 'on' : ''}`} onClick={() => update(() => api.post(`/posts/${post._id}/like`))}>
          <Heart size={19} /> {post.likes.length || ''} <span>Like</span>
        </button>
        <button className="act" onClick={() => input.current?.focus()}><MessageCircle size={19} /> {post.comments.length || ''} <span>Comment</span></button>
        <button className="act" onClick={share}><Share2 size={19} /> <span>Share</span></button>
      </div>

      {post.comments.length > 0 && (
        <div className="comments">
          {post.comments.length > 3 && !allComments && (
            <button className="link" onClick={() => setAll(true)}>View all {post.comments.length} comments</button>
          )}
          {comments.map((c) => (
            <div key={c._id} className="row comment">
              <Link to={`/u/${c.author._id}`}><Avatar u={c.author} size={30} /></Link>
              <div className="bubble">
                <Link className="name" to={`/u/${c.author._id}`}>{c.author.displayName}</Link>
                <span className="muted small"> {ago(c.createdAt)}</span>
                <p>{c.text}</p>
              </div>
              {(c.author._id === me || canDelete) && (
                <button className="icon-btn sm danger" aria-label="Delete comment" onClick={() => confirm('Delete this comment?') && update(() => api.del(`/posts/${post._id}/comments/${c._id}`))}><X size={15} /></button>
              )}
            </div>
          ))}
        </div>
      )}

      <form className="row cform" onSubmit={send}>
        <Avatar u={user} size={30} />
        <input ref={input} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Write a comment" maxLength={1000} />
        <button className="icon-btn go" aria-label="Send comment" disabled={!comment.trim()}><Send size={18} /></button>
      </form>
    </article>
  );
}
