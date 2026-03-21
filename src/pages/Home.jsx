import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import _Marquee from 'react-fast-marquee'
const Marquee = _Marquee.default ?? _Marquee
import { getThemes } from '../api/themes'
import { getRecentRooms, getRoomsByTheme } from '../api/rooms'
import ThemeLogo from '../components/ThemeLogo'
import StatusBadge from '../components/StatusBadge'
import { formatDate } from '../utils/date'

function RoomCard({ room }) {
  return (
    <Link to={`/study/${room.id}`} className="room-card">
      <div className="room-card-top">
        <div className="room-company">
          <ThemeLogo logoUrl={room.themeLogoUrl} slug={room.themeSlug} size={28} />
          <span>{room.themeName}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {room.jobRoleDisplay && <span className="tag tag-role">{room.jobRoleDisplay}</span>}
          <StatusBadge status={room.status} />
        </div>
      </div>
      <div className="room-title">{room.title}</div>
      {room.description && (
        <div className="room-desc">{room.description.slice(0, 80)}{room.description.length > 80 ? '...' : ''}</div>
      )}
      <div className="room-footer">
        <span>👤 {room.creatorNickname}</span>
        <span>
          👥 {room.approvedCount ?? 0}/{room.maxMembers ?? '?'}명
          {room.pendingCount > 0 && ` (대기 ${room.pendingCount})`}
        </span>
        <span>📅 {formatDate(room.createdAt)}</span>
      </div>
    </Link>
  )
}

export default function Home() {
  const [themes, setThemes] = useState([])
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedTheme, setSelectedTheme] = useState(null)
  const [themeRooms, setThemeRooms] = useState([])
  const [themeLoading, setThemeLoading] = useState(false)
  const [showRecent, setShowRecent] = useState(true)

  useEffect(() => {
    Promise.all([getThemes(), getRecentRooms(6)])
      .then(([t, r]) => {
        setThemes(t)
        setRooms(r)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  function handleThemeClick(theme) {
    if (selectedTheme?.id === theme.id) {
      setSelectedTheme(null)
      setShowRecent(true)
      return
    }
    setShowRecent(false)
    setSelectedTheme(theme)
    setThemeLoading(true)
    getRoomsByTheme(theme.id, '', 0)
      .then(data => setThemeRooms(data.content || data))
      .catch(() => setThemeRooms([]))
      .finally(() => setThemeLoading(false))
  }

  return (
    <>
      <section className="hero">
        <div className="container">
          <h1 className="hero-title">
            <span className="brand-highlight">스</span>터디<span className="brand-highlight">위</span>드<span className="brand-highlight">미</span>
          </h1>
          <p className="hero-sub">
            관심 분야의 스터디를 찾고, 함께 성장할 동료를 만나보세요.
          </p>
        </div>
      </section>

      <div className="company-carousel-border">
        <Marquee pauseOnHover speed={40} gradient={false}>
          {themes.map(t => (
            <button
              key={t.id}
              className={`company-pill${selectedTheme?.id === t.id ? ' active' : ''}`}
              onClick={() => handleThemeClick(t)}
            >
              <ThemeLogo logoUrl={t.logoUrl} slug={t.slug} size={36} />
              {t.name}
            </button>
          ))}
        </Marquee>
      </div>

      <section className="section">
        <div className="container">
          {selectedTheme ? (
            <>
              <div className="theme-preview-header">
                <div className="theme-preview-title">
                  <ThemeLogo logoUrl={selectedTheme.logoUrl} slug={selectedTheme.slug} size={24} />
                  {selectedTheme.name}
                </div>
                <Link to={`/study/theme/${selectedTheme.id}`} className="btn btn-ghost btn-sm">
                  더보기 →
                </Link>
              </div>
              {themeLoading ? (
                <p className="text-muted" style={{ padding: '20px 0' }}>로딩 중...</p>
              ) : themeRooms.length === 0 ? (
                <div className="theme-preview-empty">
                  아직 개설된 스터디가 없습니다.
                  <Link to={`/study/new?themeId=${selectedTheme.id}`} className="btn btn-accent btn-sm" style={{ marginLeft: 12 }}>개설하기</Link>
                </div>
              ) : (
                <div className="room-grid">
                  {themeRooms.slice(0, 6).map(room => (
                    <RoomCard key={room.id} room={room} />
                  ))}
                </div>
              )}
            </>
          ) : showRecent ? (
            <>
              <div className="section-title">최근 스터디</div>
              <div className="section-sub">최근에 개설된 스터디 목록입니다.</div>
              {loading ? (
                <p className="text-muted">로딩 중...</p>
              ) : rooms.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📭</div>
                  <h3>아직 스터디가 없습니다</h3>
                  <p>첫 번째 스터디를 개설해보세요!</p>
                  <Link to="/study/new" className="btn btn-accent">스터디 개설하기</Link>
                </div>
              ) : (
                <div className="room-grid">
                  {rooms.map(room => (
                    <RoomCard key={room.id} room={room} />
                  ))}
                </div>
              )}
            </>
          ) : null}
        </div>
      </section>
    </>
  )
}
