// Navbar component for RedRob AI Recruiter
import React from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { FiHome, FiUsers, FiBarChart2, FiCpu } from 'react-icons/fi';

const Navbar = () => {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session');

  const withSession = (path) =>
    sessionId ? `${path}?session=${sessionId}` : path;

  const navItems = [
    { path: '/', label: 'Home', icon: FiHome },
    { path: '/dashboard', label: 'Dashboard', icon: FiUsers },
    { path: '/comparison', label: 'Compare', icon: FiBarChart2 },
  ];

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to={withSession('/')} className="navbar-logo">
          <span className="logo-icon"><FiCpu /></span>
          <span className="logo-text">RedRob AI Recruiter</span>
        </Link>
        
        <div className="navbar-links">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={withSession(item.path)}
                className={`navbar-link ${isActive ? 'active' : ''}`}
              >
                <Icon className="nav-icon" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
