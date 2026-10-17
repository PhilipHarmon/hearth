import { Link } from 'react-router-dom';

// Plain text with #hashtags turned into links to the tag page
export default function RichText({ text }) {
  const parts = text.split(/(#[\p{L}\p{N}_]{2,30})/gu);
  return <>{parts.map((s, i) => (i % 2
    ? <Link key={i} className="tag" to={`/tag/${s.slice(1).toLowerCase()}`}>{s}</Link>
    : s))}</>;
}
