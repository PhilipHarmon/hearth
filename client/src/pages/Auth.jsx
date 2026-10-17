import { useState } from 'react';
import { Flame } from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../auth.jsx';

export default function Auth() {
  const { login } = useAuth();
  const [mode, setMode] = useState('login');
  const [f, setF] = useState({ email: '', password: '', username: '', displayName: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setErr('');
    try { login(await api.post(`/auth/${mode === 'login' ? 'login' : 'register'}`, f)); }
    catch (e) { setErr(e.message); } finally { setBusy(false); }
  };

  return (
    <div className="auth">
      <div className="hero">
        <Flame className="flame big" size={64} />
        <h1>Hearth</h1>
        <p>Pull up a chair. Share photos, trade stories, and keep up with the people you care about.</p>
      </div>
      <form className="card authcard" onSubmit={submit}>
        <h2>{mode === 'login' ? 'Welcome back' : 'Create your account'}</h2>
        {mode === 'register' && (
          <>
            <input placeholder="Display name" value={f.displayName} onChange={set('displayName')} />
            <input placeholder="Username" value={f.username} onChange={set('username')} required />
          </>
        )}
        <input type="email" placeholder="Email" value={f.email} onChange={set('email')} required />
        <input type="password" placeholder="Password (6+ characters)" value={f.password} onChange={set('password')} required />
        {err && <p className="err">{err}</p>}
        <button className="btn wide" disabled={busy}>{busy ? 'One moment' : mode === 'login' ? 'Sign in' : 'Create account'}</button>
        <button type="button" className="link" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setErr(''); }}>
          {mode === 'login' ? 'New here? Create an account' : 'Have an account? Sign in'}
        </button>
      </form>
    </div>
  );
}
