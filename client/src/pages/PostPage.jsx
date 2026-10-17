import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';
import PostCard from '../components/PostCard.jsx';

export default function PostPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const [post, setPost] = useState(null);
  useEffect(() => { setPost(null); api.get(`/posts/${id}`).then(setPost).catch(() => setPost(false)); }, [id]);

  return (
    <main className="wrap">
      {post === false && <div className="card center">This post is no longer available.</div>}
      {post === null && <div className="card center muted">Loading...</div>}
      {post && <PostCard post={post} onUpdate={setPost} onDelete={() => nav('/')} onShare={() => nav('/')} />}
    </main>
  );
}
