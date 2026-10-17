import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Flame } from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../auth.jsx';
import Composer from '../components/Composer.jsx';
import PostList from '../components/PostList.jsx';

const PAGE = 15;

export default function Feed() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [trending, setTrending] = useState([]);
  const [more, setMore] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async (before) => {
    const d = await api.get('/posts/feed' + (before ? `?before=${encodeURIComponent(before)}` : ''));
    setPosts((p) => (before ? [...p, ...d] : d));
    setMore(d.length === PAGE);
    setLoading(false);
  };
  useEffect(() => { load(); api.get('/posts/trending').then(setTrending); }, []);

  return (
    <main className="wrap">
      {trending.length > 0 && (
        <section className="card trend">
          <h3><Flame size={18} /> Trending this week</h3>
          <div className="chips">
            {trending.map((t) => <Link key={t.tag} to={`/tag/${t.tag}`} className="chip">#{t.tag} <span>{t.count}</span></Link>)}
          </div>
        </section>
      )}
      <Composer wall={user._id} placeholder="What is on your mind? Add #hashtags so people can find it" onPosted={(p) => setPosts((all) => [p, ...all])} />
      <PostList
        posts={posts} setPosts={setPosts} loading={loading} more={more}
        onMore={() => load(posts[posts.length - 1].lastActivity)}
        empty="Your feed is quiet. Post something, or find friends on the Friends page."
      />
    </main>
  );
}
