import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTheme } from '../hooks/useTheme'

const ADMIN_LINKS = [
  { to: '/admin/visitors', label: '방문자 통계' },
  { to: '/admin/company',  label: '회사 관리' },
  { to: '/admin/review',   label: '포폴 · 이력서 검토' },
  { to: '/admin/notice',  label: '공지사항 관리' },
]

const USER_LINKS = [
  { to: '/',         label: '홈' },
  { to: '/study',    label: '스터디' },
  { to: '/reviews',  label: '포폴 · 이력서' },
  { to: '/community',label: '커뮤니티' },
]

export default function Navbar() {
  const { theme, toggleTheme } = useTheme()
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()
  const isAdmin = location.pathname.startsWith('/admin')
  const links = isAdmin ? ADMIN_LINKS : USER_LINKS

  return (
    <nav className="navbar">
      <div className="container">
        <Link to="/" className="navbar-brand">
          <span className="brand-dot"></span>
          STUDY WITH ME
        </Link>
        <div className="navbar-links">
          {links.map(l => (
            <Link key={l.to} to={l.to} className="nav-link">{l.label}</Link>
          ))}
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
        {links.map(l => (
          <Link key={l.to} to={l.to} className="nav-link" onClick={() => setMobileOpen(false)}>{l.label}</Link>
        ))}
      </div>
    </nav>
  )
}
