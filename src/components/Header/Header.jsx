// Header.jsx
import { NavLink } from "react-router-dom";

import "./Header.css";

const Header = () => {
  return (
    <header className="top-nav">
      <div className="logo">
        <span className="logo-chip">CXW</span>
        <div className="logo-text">
          <span className="logo-title">CashXWin</span>
          <span className="logo-subtitle">Play. Win. Repeat.</span>
        </div>
      </div>

      <nav className="nav-links">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            "nav-link" + (isActive ? " nav-link--active" : "")
          }
        >
          Home
        </NavLink>
        <NavLink
          to="/about"
          className={({ isActive }) =>
            "nav-link" + (isActive ? " nav-link--active" : "")
          }
        >
          About Us
        </NavLink>
        <NavLink
          to="/privacy"
          className={({ isActive }) =>
            "nav-link" + (isActive ? " nav-link--active" : "")
          }
        >
          Privacy
        </NavLink>
        <NavLink
          to="/contact"
          className={({ isActive }) =>
            "nav-link" + (isActive ? " nav-link--active" : "")
          }
        >
          Contact
        </NavLink>
      </nav>
    </header>
  );
};

export default Header;
