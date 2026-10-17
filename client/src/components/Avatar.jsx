import { mediaUrl } from '../api';

export default function Avatar({ u, size = 42 }) {
  const name = u?.displayName || u?.username || '?';
  const style = { width: size, height: size, fontSize: size * 0.42 };
  return u?.avatar
    ? <img className="avatar" style={style} src={mediaUrl(u.avatar)} alt={name} />
    : <span className="avatar ph" style={style}>{name[0].toUpperCase()}</span>;
}
