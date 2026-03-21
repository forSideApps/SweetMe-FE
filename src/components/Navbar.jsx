import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTheme } from '../hooks/useTheme'

export default function Navbar() {
  const { theme, toggleTheme } = useTheme()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <nav className="navbar">
      <div className="container">
        <Link to="/" className="navbar-brand">
          <span className="brand-dot"></span>
          STUDY WITH ME
        </Link>
        <div className="navbar-links">
          <Link to="/" className="nav-link">홈</Link>
          <Link to="/study" className="nav-link">스터디</Link>
          <Link to="/reviews" className="nav-link">포폴 · 이력서</Link>
          <Link to="/community" className="nav-link">커뮤니티</Link>
        </div>
        <button className="theme-toggle navbar-theme-btn" onClick={toggleTheme} aria-label="테마 변경">
          <span className="theme-icon">{theme === 'dark' ? '🌙' : '☀️'}</span>
        </button>
        <div className="navbar-right-mobile">
          <button className="theme-toggle" onClick={toggleTheme} aria-label="테마 변경">
            <span className="theme-icon">{theme === 'dark' ? '🌙' : '☀️'}</span>
          </button>
          <button
            className="navbar-toggle"
            onClick={() => setMobileOpen(o => !o)}
            aria-label="메뉴 열기"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </div>
      <div className={`mobile-menu${mobileOpen ? ' open' : ''}`}>
        <Link to="/" className="nav-link" onClick={() => setMobileOpen(false)}>홈</Link>
        <Link to="/study" className="nav-link" onClick={() => setMobileOpen(false)}>스터디</Link>
        <Link to="/reviews" className="nav-link" onClick={() => setMobileOpen(false)}>포폴 · 이력서</Link>
        <Link to="/community" className="nav-link" onClick={() => setMobileOpen(false)}>커뮤니티</Link>
      </div>
    </nav>
  )
}
