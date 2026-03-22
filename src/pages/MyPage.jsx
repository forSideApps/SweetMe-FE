import { useState, useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getMe, updateProfile, getMyRooms, getMyReviews, getMyPosts, getMyApplications, getMyExchanges } from '../api/auth'
import { JOB_ROLES } from '../constants/jobRoles'
import Alert from '../components/Alert'
import StatusBadge from '../components/StatusBadge'
import { formatDate } from '../utils/date'

const CAREER_LEVELS = [
  { value: 'JUNIOR', label: '신입' },
  { value: 'EXPERIENCED', label: '경력' },
]

const ALGO_GRADES = [
  { value: '', label: '선택 안 함' },
  { value: 'UNRATED', label: '언레이팅' },
  { value: 'BRONZE', label: '브론즈' },
  { value: 'SILVER', label: '실버' },
  { value: 'GOLD', label: '골드' },
  { value: 'PLATINUM', label: '플래티넘' },
  { value: 'DIAMOND', label: '다이아몬드' },
  { value: 'RUBY', label: '루비' },
  { value: 'MASTER', label: '마스터' },
]

const TABS = [
  { key: 'profile', label: '프로필' },
  { key: 'rooms', label: '개설한 스터디' },
  { key: 'applications', label: '신청한 스터디' },
  { key: 'reviews', label: '포폴·이력서' },
  { key: 'exchanges', label: '서로보기' },
  { key: 'posts', label: '커뮤니티' },
]

export default function MyPage() {
  const navigate = useNavigate()
  const { tab = 'profile' } = useParams()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [alert, setAlert] = useState(null)
  const [form, setForm] = useState({ jobRole: '', careerLevel: '', algoGrade: '' })

  const [rooms, setRooms] = useState(null)
  const [applications, setApplications] = useState(null)
  const [reviews, setReviews] = useState(null)
  const [exchanges, setExchanges] = useState(null)
  const [posts, setPosts] = useState(null)

  useEffect(() => {
    getMe()
      .then(data => {
        setUser(data)
        setForm({
          jobRole: data.jobRole || '',
          careerLevel: data.careerLevel || '',
          algoGrade: data.algoGrade || '',
        })
      })
      .catch(() => navigate('/login', { replace: true }))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!user) return
    if (tab === 'rooms' && rooms === null) getMyRooms().then(setRooms).catch(() => setRooms([]))
    if (tab === 'applications' && applications === null) getMyApplications().then(setApplications).catch(() => setApplications([]))
    if (tab === 'reviews' && reviews === null) getMyReviews().then(setReviews).catch(() => setReviews([]))
    if (tab === 'exchanges' && exchanges === null) getMyExchanges().then(setExchanges).catch(() => setExchanges([]))
    if (tab === 'posts' && posts === null) getMyPosts().then(setPosts).catch(() => setPosts([]))
  }, [tab, user])

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await updateProfile(form)
      setAlert({ type: 'success', message: '프로필이 저장되었습니다.' })
    } catch {
      setAlert({ type: 'error', message: '저장에 실패했습니다.' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="container-sm"><p className="text-muted" style={{ padding: '40px 0' }}>로딩 중...</p></div>

  return (
    <div className="container-sm">
      <div className="page-header">
        <div className="breadcrumb">
          <Link to="/">홈</Link>
          <span>/</span>
          <span>마이페이지</span>
        </div>
        <h1>마이페이지</h1>
      </div>

      {alert && (
        <div className="alerts-container" style={{ marginTop: 16 }}>
          <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />
        </div>
      )}

      {/* 탭 네비게이션 */}
      <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--border)', marginBottom: 24 }}>
        {TABS.map(t => (
          <Link
            key={t.key}
            to={t.key === 'profile' ? '/mypage' : `/mypage/${t.key}`}
            style={{
              padding: '10px 18px',
              fontSize: 14,
              fontWeight: tab === t.key ? 600 : 400,
              color: tab === t.key ? 'var(--accent)' : 'var(--text-2)',
              borderBottom: tab === t.key ? '2px solid var(--accent)' : '2px solid transparent',
              textDecoration: 'none',
              marginBottom: -1,
            }}
          >{t.label}</Link>
        ))}
      </div>

      {/* 프로필 탭 */}
      {tab === 'profile' && (
        <div>
          <div className="form-card" style={{ marginBottom: 20 }}>
            <div className="form-section-label" style={{ marginBottom: 16 }}>계정 정보</div>
            <div className="info-rows">
              <div className="info-row">
                <span className="info-key">아이디</span>
                <span className="info-val" style={{ fontWeight: 600 }}>{user.username}</span>
              </div>
              <div className="info-row">
                <span className="info-key">이메일</span>
                <span className="info-val">{user.email || '—'}</span>
              </div>
              <div className="info-row">
                <span className="info-key">권한</span>
                <span className="info-val">{user.role === 'ADMIN' ? '관리자' : '일반 유저'}</span>
              </div>
            </div>
          </div>

          <form className="form-card" onSubmit={handleSave}>
            <div className="form-section-label" style={{ marginBottom: 8 }}>프로필 설정</div>
            <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 20 }}>
              설정한 정보는 스터디 개설·신청 및 포폴·이력서 검토 작성 시 자동으로 입력됩니다.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div className="form-group">
                <label className="form-label">직군</label>
                <div className="review-chip-group" style={{ marginTop: 6 }}>
                  <button
                    type="button"
                    className={`review-chip${form.jobRole === '' ? ' active' : ''}`}
                    onClick={() => setForm(f => ({ ...f, jobRole: '' }))}
                  >선택 안 함</button>
                  {JOB_ROLES.map(r => (
                    <button
                      key={r.value}
                      type="button"
                      className={`review-chip${form.jobRole === r.value ? ' active' : ''}`}
                      onClick={() => setForm(f => ({ ...f, jobRole: r.value }))}
                    >{r.label}</button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">경력</label>
                <div className="review-chip-group" style={{ marginTop: 6 }}>
                  <button
                    type="button"
                    className={`review-chip${form.careerLevel === '' ? ' active' : ''}`}
                    onClick={() => setForm(f => ({ ...f, careerLevel: '' }))}
                  >선택 안 함</button>
                  {CAREER_LEVELS.map(c => (
                    <button
                      key={c.value}
                      type="button"
                      className={`review-chip${form.careerLevel === c.value ? ' active' : ''}`}
                      onClick={() => setForm(f => ({ ...f, careerLevel: c.value }))}
                    >{c.label}</button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">알고리즘 등급 <span style={{ color: 'var(--text-3)', fontWeight: 400 }}>(선택)</span></label>
                <select
                  className="form-select"
                  value={form.algoGrade}
                  onChange={e => setForm(f => ({ ...f, algoGrade: e.target.value }))}
                >
                  {ALGO_GRADES.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
                </select>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn btn-accent" disabled={saving}>
                  {saving ? '저장 중...' : '저장하기'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* 스터디 탭 */}
      {tab === 'rooms' && (
        <div>
          {rooms === null ? (
            <p className="text-muted">로딩 중...</p>
          ) : rooms.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📚</div>
              <h3>개설한 스터디가 없습니다</h3>
              <Link to="/study/new" className="btn btn-accent" style={{ marginTop: 12 }}>스터디 개설하기</Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {rooms.map(r => (
                <Link key={r.id} to={`/study/${r.id}`} style={{ textDecoration: 'none' }}>
                  <div className="room-card" style={{ cursor: 'pointer' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div className="room-title">{r.title}</div>
                        <div className="room-meta" style={{ marginTop: 4 }}>
                          {r.themeName} · {formatDate(r.createdAt)}
                        </div>
                      </div>
                      <StatusBadge status={r.status} />
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 6 }}>
                      승인 {r.approvedCount}/{r.maxMembers}명 · 대기 {r.pendingCount}명
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 신청한 스터디 탭 */}
      {tab === 'applications' && (
        <div>
          {applications === null ? (
            <p className="text-muted">로딩 중...</p>
          ) : applications.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🙋</div>
              <h3>신청한 스터디가 없습니다</h3>
              <Link to="/study" className="btn btn-accent" style={{ marginTop: 12 }}>스터디 둘러보기</Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {applications.map(a => (
                <Link key={a.id} to={`/study/${a.roomId}`} style={{ textDecoration: 'none' }}>
                  <div className="room-card" style={{ cursor: 'pointer' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div className="room-title">{a.roomTitle}</div>
                        <div className="room-meta" style={{ marginTop: 4 }}>
                          {a.themeName} · {formatDate(a.createdAt)}
                        </div>
                      </div>
                      <span className={`app-status-badge ${a.status}`} style={{ fontSize: 12 }}>
                        {a.statusDisplay}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 포폴·이력서 탭 */}
      {tab === 'reviews' && (
        <div>
          {reviews === null ? (
            <p className="text-muted">로딩 중...</p>
          ) : reviews.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📄</div>
              <h3>작성한 검토 요청이 없습니다</h3>
              <Link to="/reviews/new" className="btn btn-accent" style={{ marginTop: 12 }}>검토 요청하기</Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {reviews.map(r => (
                <Link key={r.id} to={`/reviews/${r.id}`} style={{ textDecoration: 'none' }}>
                  <div className="room-card" style={{ cursor: 'pointer' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div className="room-title">{r.title}</div>
                        <div className="room-meta" style={{ marginTop: 4 }}>
                          {r.typeDisplayName} · {r.careerLevelDisplayName} · {formatDate(r.createdAt)}
                        </div>
                      </div>
                      <span className={`app-status-badge ${r.status}`} style={{ fontSize: 12 }}>
                        {r.statusDisplayName}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 서로보기 탭 */}
      {tab === 'exchanges' && (
        <div>
          {exchanges === null ? (
            <p className="text-muted">로딩 중...</p>
          ) : exchanges.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🔗</div>
              <h3>서로보기 내역이 없습니다</h3>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {exchanges.map(e => (
                <div key={e.id} className="room-card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <span style={{
                      fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 99,
                      background: e.direction === 'RECEIVED' ? 'var(--accent-bg, rgba(99,102,241,0.1))' : 'rgba(16,185,129,0.1)',
                      color: e.direction === 'RECEIVED' ? 'var(--accent)' : '#10b981',
                    }}>
                      {e.direction === 'RECEIVED' ? '받은 요청' : '보낸 요청'}
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{formatDate(e.createdAt)}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <Link to={`/reviews/${e.myReviewId}`} style={{ color: 'var(--text-1)', fontWeight: 500, fontSize: 14 }}>
                      {e.myReviewTitle}
                    </Link>
                    <span style={{ fontSize: 12, color: 'var(--text-3)' }}>↔</span>
                    <Link to={`/reviews/${e.theirReviewId}`} style={{ color: 'var(--accent)', fontWeight: 500, fontSize: 14 }}>
                      {e.theirReviewTitle}
                    </Link>
                    {e.theirUsername && (
                      <span style={{ fontSize: 12, color: 'var(--text-3)' }}>({e.theirUsername})</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 커뮤니티 탭 */}
      {tab === 'posts' && (
        <div>
          {posts === null ? (
            <p className="text-muted">로딩 중...</p>
          ) : posts.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">💬</div>
              <h3>작성한 게시글이 없습니다</h3>
              <Link to="/community/new" className="btn btn-accent" style={{ marginTop: 12 }}>글 작성하기</Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {posts.map(p => (
                <Link key={p.id} to={`/community/${p.id}`} style={{ textDecoration: 'none' }}>
                  <div className="room-card" style={{ cursor: 'pointer' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: 12, color: 'var(--accent)', marginBottom: 2 }}>{p.categoryDisplay}</div>
                        <div className="room-title">{p.title}</div>
                        <div className="room-meta" style={{ marginTop: 4 }}>
                          {formatDate(p.createdAt)} · 조회 {p.viewCount} · 댓글 {p.commentCount}
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
