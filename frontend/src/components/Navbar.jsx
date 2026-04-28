import React from 'react';

const Navbar = ({ brand, menuItems, rightContent, onLogout }) => {
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
        {onLogout && (
          <div className="avatar" onClick={onLogout}>
            ?
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
