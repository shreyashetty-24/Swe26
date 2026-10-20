import { NavLink, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export default function NavBar() {
  const { currentUser, logout } = useApp();
  const navigate = useNavigate();

  if (!currentUser) return null;

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <header className="navbar">
      <div className="navbar-brand">HaaS</div>
      <nav className="navbar-links">
        <NavLink to="/projects" className={({ isActive }) => (isActive ? 'active' : '')}>
          Projects
        </NavLink>
        <NavLink to="/inventory" className={({ isActive }) => (isActive ? 'active' : '')}>
          Inventory
        </NavLink>
      </nav>
      <div className="navbar-user">
        <span>{currentUser.username}</span>
        <button type="button" className="btn btn-secondary" onClick={handleLogout}>
          Log out
        </button>
      </div>
    </header>
  );
}
