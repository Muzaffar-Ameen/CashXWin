// src/components/Footer/Footer.jsx
import { Link } from "react-router-dom";
import "./Footer.css";

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-columns">
        <div>
          <h3>CashXWin</h3>
          <p>Built as a frontend practice project for modern casino UIs.</p>
        </div>

        <div>
          <h3>Quick Links</h3>
          <ul className="footer-links">
            <li>
              <Link to="/">Home</Link>
            </li>
            <li>
              <Link to="/about">About Us</Link>
            </li>
            <li>
              <Link to="/privacy">Privacy</Link>
            </li>
            <li>
              <Link to="/contact">Contact</Link>
            </li>
          </ul>
        </div>

        <div>
          <h3>Stay Connected</h3>
          <p>support@CashXWin.example</p>
          <div className="footer-social">
            <span>𝕏</span>
            <span>in</span>
            <span>▶</span>
          </div>
        </div>
      </div>
      <p className="footer-bottom">© 2026 CashXWin. All rights reserved.</p>
    </footer>
  );
};

export default Footer;
