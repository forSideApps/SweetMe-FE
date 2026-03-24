import { useState, useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getMe, updateProfile, getMyRooms, getMyReviews, getMyPosts, getMyApplications, getMyExchanges } from '../api/auth'
import { acceptExchange, rejectExchange, deleteReview } from '../api/review'
import { deletePost } from '../api/community'
import { deleteRoom } from '../api/rooms'
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
  const [exchangeFilter, setExchangeFilter] = useState('ALL')
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
      <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--border)', marginBottom: 24, overflowX: 'auto', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}>
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
              flexShrink: 0,
              whiteSpace: 'nowrap',
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
                <div key={r.id} className="room-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Link to={`/study/${r.id}`} draggable={false} style={{ textDecoration: 'none', flex: 1 }}>
                      <div className="room-title">{r.title}</div>
                      <div className="room-meta" style={{ marginTop: 4 }}>
                        {r.themeName} · {formatDate(r.createdAt)}
                      </div>
                    </Link>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                      <StatusBadge status={r.status} />
                      <button
                        className="btn btn-sm"
                        style={{ background: '#ef4444', color: '#fff', padding: '2px 10px', fontSize: 12 }}
                        onClick={async () => {
                          if (!confirm('이 스터디를 삭제하시겠습니까?')) return
                          try {
                            await deleteRoom(r.id)
                            setRooms(prev => prev.filter(x => x.id !== r.id))
                            setAlert({ type: 'success', message: '스터디가 삭제되었습니다.' })
                          } catch { setAlert({ type: 'error', message: '삭제에 실패했습니다.' }) }
                        }}
                      >삭제</button>
                    </div>
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 6 }}>
                    승인 {r.approvedCount}/{r.maxMembers}명 · 대기 {r.pendingCount}명
                  </div>
                </div>
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
                <div key={r.id} className="room-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Link to={`/reviews/${r.id}`} draggable={false} style={{ textDecoration: 'none', flex: 1 }}>
                      <div className="room-title">{r.title}</div>
                      <div className="room-meta" style={{ marginTop: 4 }}>
                        {r.typeDisplayName} · {r.careerLevelDisplayName} · {formatDate(r.createdAt)}
                      </div>
                    </Link>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                      <span className={`app-status-badge ${r.status}`} style={{ fontSize: 12 }}>{r.statusDisplayName}</span>
                      <Link to={`/reviews/${r.id}/edit`} className="btn btn-outline btn-sm" style={{ fontSize: 12, padding: '2px 10px' }}>수정</Link>
                      <button
                        className="btn btn-sm"
                        style={{ background: '#ef4444', color: '#fff', padding: '2px 10px', fontSize: 12 }}
                        onClick={async () => {
                          if (!confirm('이 글을 삭제하시겠습니까?')) return
                          try {
                            await deleteReview(r.id)
                            setReviews(prev => prev.filter(x => x.id !== r.id))
                            setAlert({ type: 'success', message: '글이 삭제되었습니다.' })
                          } catch { setAlert({ type: 'error', message: '삭제에 실패했습니다.' }) }
                        }}
                      >삭제</button>
                    </div>
                  </div>
                </div>
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
            <>
              {/* 필터 */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                {[['ALL', '전체'], ['RECEIVED', '받은 요청'], ['SENT', '보낸 요청']].map(([val, label]) => (
                  <button
                    key={val}
                    className={`btn btn-sm ${exchangeFilter === val ? 'btn-accent' : 'btn-ghost'}`}
                    onClick={() => setExchangeFilter(val)}
                  >{label}</button>
                ))}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {exchanges
                  .filter(e => exchangeFilter === 'ALL' || e.direction === exchangeFilter)
                  .map(e => (
                  <div key={e.id} className="room-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                      <span style={{
                        fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 99,
                        background: e.direction === 'RECEIVED' ? 'var(--accent-bg, rgba(99,102,241,0.1))' : 'rgba(16,185,129,0.1)',
                        color: e.direction === 'RECEIVED' ? 'var(--accent)' : '#10b981',
                      }}>
                        {e.direction === 'RECEIVED' ? '받은 요청' : '보낸 요청'}
                      </span>
                      <span style={{
                        fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 99,
                        background: e.status === 'ACCEPTED' ? 'var(--green-bg)' : e.status === 'REJECTED' ? 'rgba(239,68,68,0.1)' : 'var(--amber-bg)',
                        color: e.status === 'ACCEPTED' ? 'var(--green)' : e.status === 'REJECTED' ? '#ef4444' : 'var(--amber)',
                      }}>
                        {e.status === 'ACCEPTED' ? '수락됨' : e.status === 'REJECTED' ? '거절됨' : '대기 중'}
                      </span>
                      <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{formatDate(e.createdAt)}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
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
                    {/* 받은 요청 + 대기 중일 때 수락/거절 버튼 */}
                    {e.direction === 'RECEIVED' && e.status === 'PENDING' && (
                      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                        <button
                          className="btn btn-accent btn-sm"
                          onClick={async () => {
                            try {
                              await acceptExchange(e.id)
                              setExchanges(prev => prev.map(x => x.id === e.id ? { ...x, status: 'ACCEPTED' } : x))
                              setAlert({ type: 'success', message: '서로보기 요청을 수락했습니다.' })
                            } catch { setAlert({ type: 'error', message: '수락에 실패했습니다.' }) }
                          }}
                        >수락</button>
                        <button
                          className="btn btn-ghost btn-sm"
                          style={{ color: '#ef4444' }}
                          onClick={async () => {
                            try {
                              await rejectExchange(e.id)
                              setExchanges(prev => prev.map(x => x.id === e.id ? { ...x, status: 'REJECTED' } : x))
                              setAlert({ type: 'success', message: '서로보기 요청을 거절했습니다.' })
                            } catch { setAlert({ type: 'error', message: '거절에 실패했습니다.' }) }
                          }}
                        >거절</button>
                      </div>
                    )}
                    {/* 받은 요청이고 수락 전일 때만 운영자 문의 */}
                    {e.direction === 'RECEIVED' && e.status !== 'ACCEPTED' && (
                      <div style={{ marginTop: 6 }}>
                        <Link
                          to={`/community/new?prefillTitle=${encodeURIComponent('[포폴 정상 여부 문의] ' + e.theirUsername)}&prefillContent=${encodeURIComponent('상대방 아이디: ' + e.theirUsername + '\n상대방 글: ' + e.theirReviewTitle + '\n상대방 글 링크: ' + window.location.origin + '/reviews/' + e.theirReviewId + '\n\n정상 여부 확인 부탁드립니다.')}&prefillCategory=SUGGESTION`}
                          style={{ fontSize: 12, color: 'var(--text-3)', textDecoration: 'underline' }}
                        >
                          포폴/이력서 정상 여부 운영자 문의
                        </Link>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
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
                <div key={p.id} className="room-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Link to={`/community/${p.id}`} draggable={false} style={{ textDecoration: 'none', flex: 1 }}>
                      <div style={{ fontSize: 12, color: 'var(--accent)', marginBottom: 2 }}>{p.categoryDisplay}</div>
                      <div className="room-title">{p.title}</div>
                      <div className="room-meta" style={{ marginTop: 4 }}>
                        {formatDate(p.createdAt)} · 조회 {p.viewCount} · 댓글 {p.commentCount}
                      </div>
                    </Link>
                    <button
                      className="btn btn-sm"
                      style={{ background: '#ef4444', color: '#fff', padding: '2px 10px', fontSize: 12, flexShrink: 0, marginLeft: 8 }}
                      onClick={async () => {
                        if (!confirm('이 글을 삭제하시겠습니까?')) return
                        try {
                          await deletePost(p.id)
                          setPosts(prev => prev.filter(x => x.id !== p.id))
                          setAlert({ type: 'success', message: '글이 삭제되었습니다.' })
                        } catch { setAlert({ type: 'error', message: '삭제에 실패했습니다.' }) }
                      }}
                    >삭제</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
