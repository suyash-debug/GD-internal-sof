import { Link, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Layout.css';

const Layout = () => {
  const { currentUser, signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Failed to sign out:', error);
    }
  };

  return (
    <div className="layout">
      <header className="header">
        <div className="header-content">
          <h1 className="logo">Work Docs</h1>
          {currentUser && (
            <nav className="nav">
              <Link to="/daily-logs" className="nav-link">Daily Logs</Link>
              <Link to="/discussions" className="nav-link">Discussions</Link>
            </nav>
          )}
          {currentUser && (
            <div className="user-section">
              <span className="user-name">{currentUser.displayName}</span>
              <button onClick={handleSignOut} className="sign-out-btn">
                Sign Out
              </button>
            </div>
          )}
        </div>
      </header>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
