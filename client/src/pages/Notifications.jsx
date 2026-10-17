import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, MessageCircle, Share2, UserPlus, UserCheck, Home } from 'lucide-react';
import { api, refreshCounts } from '../api';
import Avatar from '../components/Avatar.jsx';

const INFO = {
  like: [Heart, 'liked your post'],
  comment: [MessageCircle, 'commented on a post'],
  share: [Share2, 'shared your post'],
  wall_post: [Home, 'posted on your wall'],
  friend_request: [UserPlus, 'sent you a friend request'],
  friend_accept: [UserCheck, 'accepted your friend request'],
};
const ago = (d) => {
  const s = (Date.now() - new Date(d)) / 1000;
  return s < 60 ? 'just now' : s < 3600 ? `${Math.floor(s / 60)}m ago` : s < 86400 ? `${Math.floor(s / 3600)}h ago` : `${Math.floor(s / 86400)}d ago`;
};

export default function Notifications() {
  const [items, setItems] = useState(null);

  useEffect(() => {
    // Keep the unread highlight for this visit, but mark everything read on the server
    api.get('/notifications').then(setItems).then(() => api.post('/notifications/read')).then(refreshCounts);
  }, []);

  if (!items) return <main className="wrap"><div className="card center muted">Loading...</div></main>;
  return (
    <main className="wrap">
      <h1 className="title">Notifications</h1>
      {items.length === 0 && <div className="card muted center">Nothing yet. Likes, comments, shares and friend activity will show up here.</div>}
      {items.map((n) => {
        const [Icon, label] = INFO[n.type];
        const to = n.type === 'friend_request' ? '/friends' : n.post ? `/post/${n.post._id}` : `/u/${n.actor._id}`;
        const snippet = n.post?.text ? n.post.text.slice(0, 90) : n.post?.media?.length ? 'a photo or video' : '';
        return (
          <Link key={n._id} to={to} className={`card nrow ${n.read ? '' : 'unread'}`}>
            <span className="nicon"><Icon size={18} /></span>
            <Avatar u={n.actor} size={40} />
            <div className="grow">
              <span className="name">{n.actor.displayName}</span> {label}
              {snippet && <div className="muted small clip">&ldquo;{snippet}&rdquo;</div>}
              <div className="muted small">{ago(n.createdAt)}</div>
            </div>
          </Link>
        );
      })}
    </main>
  );
}
