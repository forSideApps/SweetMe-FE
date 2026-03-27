import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { getAllRooms, getRoomsByTheme } from '../api/rooms'
import { getThemes } from '../api/themes'
import { JOB_ROLE_FILTER } from '../constants/jobRoles'
import ThemeLogo from '../components/ThemeLogo'
import StatusBadge from '../components/StatusBadge'
import Pagination from '../components/Pagination'
import EmptyState from '../components/EmptyState'
import FilterTab from '../components/FilterTab'
import { formatDate } from '../utils/date'

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
          <FilterTab value="" activeValue={status} onClick={handleStatus}>전체</FilterTab>
          <FilterTab value="OPEN" activeValue={status} onClick={handleStatus}>모집중</FilterTab>
          <FilterTab value="CLOSED" activeValue={status} onClick={handleStatus}>마감</FilterTab>
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
          <FilterTab key={r.value} value={r.value} activeValue={jobRole} onClick={handleJobRole}>
            {r.label}
          </FilterTab>
        ))}
      </div>

      {loading ? (
        <p className="text-muted">로딩 중...</p>
      ) : rooms.length === 0 ? (
        <EmptyState icon="📭" title="아직 스터디가 없습니다" description="조건을 바꿔보거나 새 스터디를 개설해보세요" />
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
                    <StatusBadge status={room.status} />
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

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  )
}
