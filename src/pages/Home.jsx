import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import _Marquee from 'react-fast-marquee'
const Marquee = _Marquee.default ?? _Marquee
import { getThemes } from '../api/themes'
import { getRecentRooms, getRoomsByTheme } from '../api/rooms'
import ThemeLogo from '../components/ThemeLogo'

function statusBadge(status) {
  if (status === 'OPEN') return <span className="badge badge-green">모집중</span>
  if (status === 'CLOSED') return <span className="badge badge-gray">마감</span>
  return <span className="badge badge-amber">{status}</span>
}

function formatDate(str) {
  if (!str) return ''
  return str.slice(0, 10)
}

function RoomCard({ room }) {
  return (
    <Link to={`/rooms/${room.id}`} className="room-card">
      <div className="room-card-top">
        <div className="room-company">
          <ThemeLogo logoUrl={room.themeLogoUrl} slug={room.themeSlug} size={28} />
          <span>{room.themeName}</span>
        </div>
        {statusBadge(room.status)}
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
    if (selectedTheme?.id === theme.id) return
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
          <div className="hero-label">스윗미 · sweetme.kro.kr</div>
          <h1 className="hero-title">
            공부가 달콤해지는<br /><em>스터디 매칭</em>
          </h1>
          <p className="hero-sub">
            관심 분야의 스터디를 찾고, 함께 성장할 동료를 만나보세요.
          </p>
        </div>
      </section>

      {/* 전체 슬라이드 (최근 스터디 포함) */}
      <div className="company-carousel-border">
        <Marquee pauseOnHover speed={40} gradient={false}>
          <button
            className={`company-pill${selectedTheme === null ? ' active' : ''}`}
            onClick={() => setSelectedTheme(null)}
          >
            <span style={{ fontSize: 36, lineHeight: 1 }}>🕐</span>
            최근 스터디
          </button>
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
                <Link to={`/rooms/theme/${selectedTheme.id}`} className="btn btn-ghost btn-sm">
                  더보기 →
                </Link>
              </div>
              {themeLoading ? (
                <p className="text-muted" style={{ padding: '20px 0' }}>로딩 중...</p>
              ) : themeRooms.length === 0 ? (
                <div className="theme-preview-empty">
                  아직 개설된 스터디가 없습니다.
                  <Link to={`/rooms/new?themeId=${selectedTheme.id}`} className="btn btn-accent btn-sm" style={{ marginLeft: 12 }}>개설하기</Link>
                </div>
              ) : (
                <div className="room-grid">
                  {themeRooms.slice(0, 6).map(room => (
                    <RoomCard key={room.id} room={room} />
                  ))}
                </div>
              )}
            </>
          ) : (
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
                  <Link to="/rooms/new" className="btn btn-accent">스터디 개설하기</Link>
                </div>
              ) : (
                <div className="room-grid">
                  {rooms.map(room => (
                    <RoomCard key={room.id} room={room} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </>
  )
}
