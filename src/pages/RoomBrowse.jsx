import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { getAllRooms, getRoomsByTheme } from '../api/rooms'
import { getThemes } from '../api/themes'
import { JOB_ROLE_FILTER } from '../constants/jobRoles'
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

export default function RoomBrowse() {
  const [rooms, setRooms] = useState([])
  const [themes, setThemes] = useState([])
  const [themeId, setThemeId] = useState('')
  const [status, setStatus] = useState('')
  const [jobRole, setJobRole] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [keyword, setKeyword] = useState('')
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getThemes().then(setThemes).catch(() => {})
  }, [])

  const fetchRooms = useCallback(() => {
    setLoading(true)
    const promise = themeId
      ? getRoomsByTheme(themeId, status, page, jobRole, keyword)
      : getAllRooms(status, jobRole, keyword, page)
    promise
      .then(data => {
        setRooms(data.content || data)
        setTotalPages(data.totalPages || 1)
      })
      .catch(() => setRooms([]))
      .finally(() => setLoading(false))
  }, [status, jobRole, keyword, page, themeId])

  useEffect(() => { fetchRooms() }, [fetchRooms])

  function handleStatus(s) { setStatus(s); setPage(0) }
  function handleJobRole(r) { setJobRole(r); setPage(0) }
  function handleTheme(id) { setThemeId(id); setPage(0) }
  function handleSearch(e) { e.preventDefault(); setKeyword(searchInput.trim()); setPage(0) }

  return (
    <div className="container">
      <div className="community-header">
        <div>
          <h1 className="community-title">스터디</h1>
          <p className="community-desc">관심 분야의 스터디를 찾고 함께 성장할 동료를 만나보세요.</p>
        </div>
        <Link to="/study/new" className="btn btn-accent">스터디 개설하기</Link>
      </div>

      {/* 검색 */}
      <form className="room-search-form" onSubmit={handleSearch}>
        <input
          className="form-input room-search-input"
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
          placeholder="스터디 제목 검색..."
        />
        <button type="submit" className="btn btn-outline">검색</button>
        {keyword && (
          <button type="button" className="btn btn-ghost" onClick={() => { setKeyword(''); setSearchInput(''); setPage(0) }}>
            초기화
          </button>
        )}
      </form>

      {/* 상태 필터 + 회사 선택 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div className="filter-tabs">
          <button className={`filter-tab${status === '' ? ' active' : ''}`} onClick={() => handleStatus('')}>전체</button>
          <button className={`filter-tab${status === 'OPEN' ? ' active' : ''}`} onClick={() => handleStatus('OPEN')}>모집중</button>
          <button className={`filter-tab${status === 'CLOSED' ? ' active' : ''}`} onClick={() => handleStatus('CLOSED')}>마감</button>
        </div>
        <select
          className="form-input"
          value={themeId}
          onChange={e => handleTheme(e.target.value)}
          style={{ minWidth: 120, maxWidth: 160 }}
        >
          <option value="">전체 회사</option>
          {themes.map(t => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      </div>

      {/* 직군 필터 */}
      <div className="filter-tabs" style={{ flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
        {JOB_ROLE_FILTER.map(r => (
          <button
            key={r.value}
            className={`filter-tab${jobRole === r.value ? ' active' : ''}`}
            onClick={() => handleJobRole(r.value)}
          >
            {r.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-muted">로딩 중...</p>
      ) : rooms.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <h3>스터디가 없습니다</h3>
          <p>첫 번째 스터디를 개설해보세요!</p>
          <Link to="/study/new" className="btn btn-accent">스터디 개설하기</Link>
        </div>
      ) : (
          <div className="room-grid">
            {rooms.map(room => (
              <Link key={room.id} to={`/study/${room.id}`} className="room-card">
                <div className="room-card-top">
                  <div className="room-company">
                    <ThemeLogo logoUrl={room.themeLogoUrl} slug={room.themeSlug} size={28} />
                    <span>{room.themeName}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {room.jobRoleDisplay && (
                      <span className="tag tag-role">{room.jobRoleDisplay}</span>
                    )}
                    {statusBadge(room.status)}
                  </div>
                </div>
                <div className="room-title">{room.title}</div>
                {room.description && (
                  <div className="room-desc">{room.description.slice(0, 80)}{room.description.length > 80 ? '...' : ''}</div>
                )}
                <div className="room-footer">
                  <span>👤 {room.creatorNickname}</span>
                  <span>👥 {room.approvedCount ?? 0}/{room.maxMembers ?? '?'}명
                    {room.pendingCount > 0 && ` (대기 ${room.pendingCount})`}
                  </span>
                  <span>📅 {formatDate(room.createdAt)}</span>
                </div>
              </Link>
            ))}
          </div>
        )}

      {totalPages > 1 && (
        <div className="pagination">
          <button className="page-btn" disabled={page === 0} onClick={() => setPage(p => p - 1)}>이전</button>
          <span className="page-info">{page + 1} / {totalPages}</span>
          <button className="page-btn" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>다음</button>
        </div>
      )}
    </div>
  )
}
