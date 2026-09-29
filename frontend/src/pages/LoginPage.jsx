import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export default function LoginPage() {
  const { currentUser, login, signup } = useApp();
  const navigate = useNavigate();

  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (currentUser) {
    return <Navigate to="/projects" replace />;
  }

  function handleSubmit(e) {
    e.preventDefault();
    setError('');

    const result = mode === 'login' ? login(username, password) : signup(username, password);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    navigate('/projects');
  }

  function toggleMode() {
    setMode((m) => (m === 'login' ? 'signup' : 'login'));
    setError('');
  }

  return (
    <div className="auth-page">
      <div className="card auth-card">
        <h1>HaaS Kitchen</h1>
        <p className="subtitle">Hardware-as-a-Service for bakers, pastry chefs &amp; baristas</p>

        <h2>{mode === 'login' ? 'Log in' : 'Create an account'}</h2>

        <form onSubmit={handleSubmit}>
          <label className="field">
            <span>Username</span>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
            />
          </label>

          <label className="field">
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              required
            />
          </label>

          {error && <p className="error-text">{error}</p>}

          <button type="submit" className="btn btn-primary btn-block">
            {mode === 'login' ? 'Log in' : 'Sign up'}
          </button>
        </form>

        <p className="auth-toggle">
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button type="button" className="link-button" onClick={toggleMode}>
            {mode === 'login' ? 'Sign up' : 'Log in'}
          </button>
        </p>
      </div>
    </div>
  );
}
