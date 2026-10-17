import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api';
import PostList from '../components/PostList.jsx';

const PAGE = 15;

export default function Tag() {
  const { tag } = useParams();
  const [posts, setPosts] = useState([]);
  const [more, setMore] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async (before) => {
    const d = await api.get(`/posts/tag/${encodeURIComponent(tag)}` + (before ? `?before=${encodeURIComponent(before)}` : ''));
    setPosts((p) => (before ? [...p, ...d] : d));
    setMore(d.length === PAGE);
    setLoading(false);
  };
  useEffect(() => { setPosts([]); setLoading(true); load(); }, [tag]);

  return (
    <main className="wrap">
      <h1 className="title tagtitle">#{tag}</h1>
      <PostList
        posts={posts} setPosts={setPosts} loading={loading} more={more}
        onMore={() => load(posts[posts.length - 1].lastActivity)}
        empty={`No posts use #${tag} yet.`}
      />
    </main>
  );
}
