import PostCard from './PostCard.jsx';

// Shared by the feed and wall pages. `wallId` limits where a freshly shared post may appear.
export default function PostList({ posts, setPosts, more, onMore, loading, empty, wallId }) {
  if (loading) return <div className="card muted center">Gathering posts...</div>;
  if (!posts.length) return <div className="card muted center">{empty}</div>;
  return (
    <>
      {posts.map((p) => (
        <PostCard
          key={p._id} post={p}
          onUpdate={(n) => setPosts((all) => all.map((x) => (x._id === n._id ? n : x)))}
          onDelete={(id) => setPosts((all) => all.filter((x) => x._id !== id))}
          onShare={(n) => (!wallId || n.wall._id === wallId) && setPosts((all) => [n, ...all])}
        />
      ))}
      {more && <button className="btn ghost wide" onClick={onMore}>Load older posts</button>}
    </>
  );
}
