import React from 'react';

const Navbar = ({ brand, menuItems, rightContent, onLogout, theme, onToggleTheme }) => {
  return (
    <nav className="navbar">
      <div className="navbar-brand">{brand}</div>
      <div className="nav-menu">
        {menuItems.map((item) => (
          <div
            key={item.id}
            className={`nav-item ${item.active ? 'active' : ''}`}
            onClick={item.onClick}
          >
            {item.label}
          </div>
        ))}
      </div>
      <div className="navbar-right">
        {rightContent}

        {onToggleTheme && (
          <button className="theme-toggle" onClick={onToggleTheme} title="Mavzuni o'zgartirish">
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        )}

        {onLogout && (
          <div className="avatar" onClick={onLogout} title="Chiqish">
            🚪
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
