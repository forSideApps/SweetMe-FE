import { useState, useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { getMe, logout } from '../api/auth'

const ADMIN_LINKS = [
  { to: '/admin/visitors', label: '방문자 통계' },
  { to: '/admin/company',  label: '회사 관리' },
  { to: '/admin/review',   label: '포폴 · 이력서 검토' },
  { to: '/admin/notice',  label: '공지사항 관리' },
]

const USER_LINKS = [
  { to: '/',          label: '홈' },
  { to: '/study',     label: '스터디' },
  { to: '/schedule',  label: '채용 일정' },
  { to: '/reviews',   label: '포폴 · 이력서' },
  { to: '/community', label: '커뮤니티' },
]

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const isAdmin = location.pathname.startsWith('/admin')
  const links = isAdmin ? ADMIN_LINKS : USER_LINKS
  const [user, setUser] = useState(null)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    getMe().then(setUser).catch(() => setUser(null))
    setDropdownOpen(false)
  }, [location.pathname])

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function handleLogout() {
    await logout()
    setUser(null)
    setDropdownOpen(false)
    navigate('/')
  }

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
          {!isAdmin && user?.role === 'ADMIN' && (
            <Link to="/admin" className="nav-link" style={{ color: 'var(--accent)' }}>Admin</Link>
          )}
        </div>

        <div className="navbar-auth" ref={dropdownRef}>
          <button
            className={`navbar-avatar-btn${user ? ' has-user' : ''}`}
            onClick={() => setDropdownOpen(o => !o)}
            aria-label="계정 메뉴"
          >
            {user ? user.username.charAt(0).toUpperCase() : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
              </svg>
            )}
          </button>
          {dropdownOpen && (
            <div className="navbar-dropdown">
              {user ? (
                <>
                  <div className="navbar-dropdown-user">{user.username}</div>
                  <Link to="/mypage" className="navbar-dropdown-item" onClick={() => setDropdownOpen(false)}>마이페이지</Link>
                  <button className="navbar-dropdown-item danger" onClick={handleLogout}>로그아웃</button>
                </>
              ) : (
                <>
                  <Link to="/login" className="navbar-dropdown-item" onClick={() => setDropdownOpen(false)}>로그인</Link>
                  <Link to="/register" className="navbar-dropdown-item accent" onClick={() => setDropdownOpen(false)}>회원가입</Link>
                </>
              )}
            </div>
          )}
        </div>

        <div className="navbar-right-mobile">
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
        {!isAdmin && user?.role === 'ADMIN' && (
          <Link to="/admin" className="nav-link" style={{ color: 'var(--accent)' }} onClick={() => setMobileOpen(false)}>Admin</Link>
        )}
        <div style={{ borderTop: '1px solid var(--border)', marginTop: 14, paddingTop: 14 }}>
          {user ? (
            <>
              <Link to="/mypage" className="nav-link" style={{ paddingTop: 10, paddingBottom: 10 }} onClick={() => setMobileOpen(false)}>마이페이지</Link>
              <button className="nav-link" style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', paddingTop: 10, paddingBottom: 10 }} onClick={() => { handleLogout(); setMobileOpen(false) }}>
                로그아웃 ({user.username})
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link" style={{ paddingTop: 10, paddingBottom: 10 }} onClick={() => setMobileOpen(false)}>로그인</Link>
              <Link to="/register" className="nav-link" style={{ paddingTop: 10, paddingBottom: 10 }} onClick={() => setMobileOpen(false)}>회원가입</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
