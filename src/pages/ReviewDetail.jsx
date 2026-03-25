import { useState, useEffect, useCallback, useRef } from 'react'
import { Link, useParams, useNavigate, useLocation } from 'react-router-dom'
import { getReview, incrementReviewView, addReviewComment, updateReviewComment, deleteReviewComment, getReviewLink, deleteReview, createExchange } from '../api/review'
import { getMe, getMyReviews } from '../api/auth'
import Alert from '../components/Alert'
import { formatDateTime } from '../utils/date'

const STATUS_STYLE = {
  PENDING: { background: 'var(--amber-bg)', color: 'var(--amber)' },
  DONE:    { background: '#dcfce7', color: '#16a34a' },
}

export default function ReviewDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [review, setReview] = useState(null)
  const [loading, setLoading] = useState(true)
  const [alert, setAlert] = useState(location.state?.errorMsg ? { type: 'error', message: location.state.errorMsg } : null)
  const [comment, setComment] = useState({ authorName: '', content: '', password: '' })
  const [commentErrors, setCommentErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const viewedRef = useRef(false)
  const [user, setUser] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [adminComment, setAdminComment] = useState('')
  const [adminSubmitting, setAdminSubmitting] = useState(false)
  const [linkPw, setLinkPw] = useState('')
  const [linkPwError, setLinkPwError] = useState('')
  const [revealedLink, setRevealedLink] = useState(null)
  const [linkLoading, setLinkLoading] = useState(false)
  const [showLinkPwForm, setShowLinkPwForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editingIsAdmin, setEditingIsAdmin] = useState(false)
  const [editingIsMine, setEditingIsMine] = useState(false)
  const [editForm, setEditForm] = useState({ content: '', password: '' })
  const [editError, setEditError] = useState('')
  const [deleteId, setDeleteId] = useState(null)
  const [deleteIsAdmin, setDeleteIsAdmin] = useState(false)
  const [deleteIsMine, setDeleteIsMine] = useState(false)
  const [deletePw, setDeletePw] = useState('')
  const [deleteError, setDeleteError] = useState('')
  const [exchangeOpen, setExchangeOpen] = useState(false)
  const [myReviews, setMyReviews] = useState(null)
  const [selectedMyReview, setSelectedMyReview] = useState(null)
  const [exchangeLoading, setExchangeLoading] = useState(false)
  const [exchangeRequested, setExchangeRequested] = useState(false)
  const [exchangeError, setExchangeError] = useState('')

  const fetchReview = useCallback(() => {
    getReview(id).then(setReview).finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    fetchReview()
    if (!viewedRef.current) {
      viewedRef.current = true
      incrementReviewView(id).catch(() => {})
    }
    getMe()
      .then(data => {
        setUser(data)
        if (data.role === 'ADMIN') {
          setIsAdmin(true)
          getReviewLink(id)
            .then(d => setRevealedLink(d.link))
            .catch(() => {})
        }
      })
      .catch(() => {})
  }, [id])

  // 로그인 유저가 review 작성자면 포폴 링크 자동 노출
  useEffect(() => {
    if (user && review && !isAdmin && review.memberUsername && review.memberUsername === user.username && !revealedLink) {
      getReviewLink(id).then(d => setRevealedLink(d.link)).catch(() => {})
    }
  }, [user, review])

  function validateComment() {
    const errs = {}
    if (!user) {
      if (!comment.authorName.trim()) errs.authorName = '작성자명을 입력해주세요.'
      if (comment.authorName.includes('방장') || comment.authorName.includes('운영자')) errs.authorName = '사용할 수 없는 닉네임입니다.'
    }
    if (!comment.content.trim()) errs.content = '내용을 입력해주세요.'
    return errs
  }

  async function handleAdminCommentSubmit(e) {
    e.preventDefault()
    if (!adminComment.trim()) return
    setAdminSubmitting(true)
    try {
      await addReviewComment(id, { authorName: '운영자', content: adminComment })
      setAdminComment('')
      setAlert({ type: 'success', message: '운영자 댓글이 작성되었습니다.' })
      fetchReview()
    } catch {
      setAlert({ type: 'error', message: '댓글 작성에 실패했습니다.' })
    } finally {
      setAdminSubmitting(false)
    }
  }

  function startEdit(c) {
    setEditingId(c.id)
    setEditingIsAdmin(c.admin || false)
    setEditingIsMine(!!(user && c.memberUsername === user.username))
    setEditForm({ content: c.content, password: '' })
    setEditError('')
  }

  async function handleEditSubmit(e) {
    e.preventDefault()
    if (!editingIsAdmin && !editingIsMine && !editForm.password.trim()) { setEditError('비밀번호를 입력해주세요.'); return }
    try {
      await updateReviewComment(id, editingId, editForm)
      setEditingId(null)
      fetchReview()
    } catch (err) {
      setEditError(err?.response?.status === 401 ? '비밀번호가 올바르지 않습니다.' : '수정에 실패했습니다.')
    }
  }

  function startDelete(commentId, isAdminComment, isMineComment) {
    setDeleteId(commentId)
    setDeleteIsAdmin(isAdminComment || false)
    setDeleteIsMine(isMineComment || false)
    setDeletePw('')
    setDeleteError('')
  }

  async function handleDeleteSubmit(e) {
    e.preventDefault()
    if (!deleteIsAdmin && !deleteIsMine && !deletePw.trim()) { setDeleteError('비밀번호를 입력해주세요.'); return }
    try {
      await deleteReviewComment(id, deleteId, deletePw || undefined)
      setDeleteId(null)
      fetchReview()
    } catch (err) {
      setDeleteError(err?.response?.status === 401 ? '비밀번호가 올바르지 않습니다.' : '삭제에 실패했습니다.')
    }
  }

  async function openExchangeModal() {
    setExchangeOpen(true)
    setExchangeRequested(false)
    setExchangeError('')
    setSelectedMyReview(null)
    if (!myReviews) {
      getMyReviews().then(data => setMyReviews(data.filter(r => r.id !== review.id))).catch(() => setMyReviews([]))
    }
  }

  async function handleExchange() {
    if (!selectedMyReview) { setExchangeError('내 글을 선택해주세요.'); return }
    setExchangeLoading(true)
    setExchangeError('')
    try {
      await createExchange(review.id, selectedMyReview)
      setExchangeRequested(true)
    } catch (err) {
      setExchangeError(err?.response?.data?.message || '서로보기에 실패했습니다.')
    } finally {
      setExchangeLoading(false)
    }
  }

  async function handleRevealLink(e) {
    e.preventDefault()
    if (!linkPw) { setLinkPwError('비밀번호를 입력해주세요.'); return }
    setLinkPwError('')
    setLinkLoading(true)
    try {
      const data = await getReviewLink(id, linkPw)
      setRevealedLink(data.link)
      setShowLinkPwForm(false)
    } catch (err) {
      setLinkPwError(err?.response?.status === 401 ? '비밀번호가 올바르지 않습니다.' : '오류가 발생했습니다.')
    } finally {
      setLinkLoading(false)
    }
  }

  async function handleCommentSubmit(e) {
    e.preventDefault()
    const errs = validateComment()
    if (Object.keys(errs).length > 0) { setCommentErrors(errs); return }
    setCommentErrors({})
    setSubmitting(true)
    try {
      await addReviewComment(id, comment)
      setComment({ authorName: '', content: '', password: '' })
      setAlert({ type: 'success', message: '댓글이 작성되었습니다.' })
      fetchReview()
    } catch {
      setAlert({ type: 'error', message: '댓글 작성에 실패했습니다.' })
    } finally {
      setSubmitting(false)
    }
  }

  const isNotOwner = user && review && review.memberUsername && review.memberUsername !== user.username

  if (loading) return <div className="container"><p className="text-muted" style={{ padding: '40px 0' }}>로딩 중...</p></div>
  if (!review) return <div className="container"><p className="text-muted" style={{ padding: '40px 0' }}>게시글을 찾을 수 없습니다.</p></div>

  const comments = review.comments || []

  return (
    <div className="container-sm">
      <div className="page-header">
        <div className="breadcrumb">
          <Link to="/">홈</Link>
          <span>/</span>
          <Link to="/reviews">포폴 · 이력서 검토</Link>
          <span>/</span>
          <span>상세</span>
        </div>
      </div>

      {alert && (
        <div className="alerts-container" style={{ marginTop: 16 }}>
          <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />
        </div>
      )}

      <div className="section-sm">
        <div className="post-detail-card">
          <div className="post-detail-header">
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <span className={`post-cat-badge ${review.type}`}>{review.typeDisplayName}</span>
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 50,
                    ...STATUS_STYLE[review.status]
                  }}>{review.statusDisplayName}</span>
                </div>
                <div className="post-detail-title">
                  <span style={{ color: 'var(--text-3)', fontWeight: 600, marginRight: 6 }}>
                    [{review.careerLevelDisplayName}·{review.jobCategoryDisplayName}]
                  </span>
                  {review.title}
                </div>
                <div className="post-detail-meta">
                  <span>{review.authorName}</span>
                  <span>조회 {review.viewCount}</span>
                  <span>{formatDateTime(review.createdAt)}</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                {(isAdmin || (user && review.memberUsername && review.memberUsername === user.username)) && (
                  <Link to={`/reviews/${review.id}/edit`} className="btn btn-outline btn-sm">수정하기</Link>
                )}
                {(isAdmin || (user && review.memberUsername && review.memberUsername === user.username)) && (
                  <button
                    className="btn btn-sm"
                    style={{ background: '#ef4444', color: '#fff' }}
                    onClick={async () => {
                      if (!confirm('이 게시글을 삭제하시겠습니까?')) return
                      await deleteReview(review.id)
                      navigate('/reviews', { replace: true })
                    }}
                  >삭제</button>
                )}
              </div>
            </div>
          </div>

          <div className="post-detail-body">{review.content}</div>

          {review.hasPortfolioLink && (
            <div style={{
              margin: '0 24px 20px',
              padding: '16px',
              background: 'var(--bg-2)', borderRadius: 'var(--radius)',
              border: '1px solid var(--border)'
            }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>포트폴리오/이력서 링크</div>
              {revealedLink ? (
                <a href={revealedLink} target="_blank" rel="noopener noreferrer"
                  style={{ color: 'var(--accent)', fontSize: 14, wordBreak: 'break-all' }}>
                  {revealedLink}
                </a>
              ) : (
                <>
                  <div style={{
                    fontSize: 14, color: 'var(--text-3)',
                    filter: 'blur(6px)', userSelect: 'none', letterSpacing: 1,
                    marginBottom: 12, pointerEvents: 'none'
                  }}>https://notion.so/abcdefghijklmnopqrstuvwxyz</div>

                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                    {/* 비밀번호로 보기 */}
                    {showLinkPwForm ? (
                      <form onSubmit={handleRevealLink} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                        <div style={{ flex: 1, minWidth: 180 }}>
                          <input
                            type="password"
                            className={`form-input${linkPwError ? ' is-error' : ''}`}
                            value={linkPw}
                            onChange={e => setLinkPw(e.target.value)}
                            placeholder="게시글 비밀번호 입력"
                            autoFocus
                            style={{ fontSize: 13 }}
                          />
                          {linkPwError && <span className="form-err">{linkPwError}</span>}
                        </div>
                        <button type="submit" className="btn btn-accent btn-sm" disabled={linkLoading}>
                          {linkLoading ? '확인 중...' : '확인'}
                        </button>
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowLinkPwForm(false)}>취소</button>
                      </form>
                    ) : (
                      <button className="btn btn-outline btn-sm" onClick={() => setShowLinkPwForm(true)}>
                        🔒 링크 보기
                      </button>
                    )}

                    {/* 서로보기 버튼 (로그인 유저 + 타인 글) */}
                    {user && review.memberUsername && review.memberUsername !== user.username && (
                      <div className="tooltip-wrap">
                        <button className="btn btn-accent btn-sm" onClick={openExchangeModal}>
                          🔄 서로보기
                        </button>
                        <div className="tooltip-box">
                          내 포폴·이력서 링크를 공유하고<br />상대방의 링크를 볼 수 있어요
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          <div className="post-detail-actions">
            <button onClick={() => navigate(-1)} className="btn btn-ghost btn-sm">← 목록으로</button>
          </div>
        </div>

        <div className="comments-section">
          <div className="comments-title">댓글 {comments.length}개</div>

          {comments.length === 0 ? (
            <p className="no-comments">아직 댓글이 없습니다. 첫 번째 리뷰를 남겨보세요!</p>
          ) : (
            <div className="comment-list">
              {comments.map(c => (
                <div key={c.id} className="comment-item">
                  <div className="comment-header">
                    <span className="comment-author">
                      {c.admin && <span style={{ marginRight: 3 }}>👑</span>}
                      {!c.admin && c.memberUsername && (
                        <span className={user && c.memberUsername === user.username ? 'comment-member-badge--blink' : 'comment-member-badge'}>●</span>
                      )}
                      {c.authorName}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span className="comment-date">{formatDateTime(c.createdAt)}</span>
                      {(isAdmin || (user && c.memberUsername === user.username)) && (
                        <>
                          <button className="btn btn-ghost btn-sm" style={{ padding: '1px 6px', fontSize: 12 }} onClick={() => startEdit(c)}>수정</button>
                          <button className="btn btn-ghost btn-sm" style={{ padding: '1px 6px', fontSize: 12, color: 'var(--danger, #ef4444)' }} onClick={() => startDelete(c.id, c.admin, !!(user && c.memberUsername === user.username))}>삭제</button>
                        </>
                      )}
                    </div>
                  </div>
                  {editingId === c.id ? (
                    <form onSubmit={handleEditSubmit} style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <textarea
                        className="form-textarea"
                        value={editForm.content}
                        onChange={e => setEditForm(f => ({ ...f, content: e.target.value }))}
                        onKeyDown={e => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { e.preventDefault(); handleEditSubmit(e) } }}
                        rows={3}
                        style={{ minHeight: 70 }}
                      />
                      {editError && <span className="form-err">{editError}</span>}
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button type="submit" className="btn btn-accent btn-sm">저장</button>
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditingId(null)}>취소</button>
                      </div>
                    </form>
                  ) : deleteId === c.id ? (
                    <form onSubmit={handleDeleteSubmit} style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div style={{ fontSize: 13, color: 'var(--text-2)' }}>댓글을 삭제하시겠습니까?</div>
                      {deleteError && <span className="form-err">{deleteError}</span>}
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button type="submit" className="btn btn-sm" style={{ background: '#ef4444', color: '#fff' }}>삭제</button>
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setDeleteId(null)}>취소</button>
                      </div>
                    </form>
                  ) : (
                    <div className="comment-body">{c.content}</div>
                  )}
                </div>
              ))}
            </div>
          )}

          {isAdmin && (
            <div style={{ marginBottom: 20, padding: '16px', background: 'var(--bg-2)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius)' }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>👑 운영자 댓글 남기기</div>
              <form onSubmit={handleAdminCommentSubmit}>
                <textarea
                  className="form-textarea"
                  value={adminComment}
                  onChange={e => setAdminComment(e.target.value)}
                  onKeyDown={e => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { e.preventDefault(); handleAdminCommentSubmit(e) } }}
                  placeholder="운영자로 댓글을 남겨보세요"
                  rows={3}
                  style={{ minHeight: 80, marginBottom: 8 }}
                />
                <button type="submit" className="btn btn-accent btn-sm" disabled={adminSubmitting}>
                  {adminSubmitting ? '작성 중...' : '운영자 댓글 작성'}
                </button>
              </form>
            </div>
          )}

          <div className="comment-form">
            <form onSubmit={handleCommentSubmit}>
              <div className="comment-inputs">
                {user ? (
                  <div className="comment-author-label">
                    <span className="comment-member-badge">●</span> {user.username}으로 작성됩니다
                  </div>
                ) : (
                  <div className="form-group">
                    <input
                      className={`form-input${commentErrors.authorName ? ' is-error' : ''}`}
                      value={comment.authorName}
                      onChange={e => setComment(c => ({ ...c, authorName: e.target.value }))}
                      placeholder="작성자명"
                    />
                    {commentErrors.authorName && <span className="form-err">{commentErrors.authorName}</span>}
                  </div>
                )}
                <div className="form-group">
                  <textarea
                    className={`form-textarea${commentErrors.content ? ' is-error' : ''}`}
                    value={comment.content}
                    onChange={e => setComment(c => ({ ...c, content: e.target.value }))}
                    onKeyDown={e => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { e.preventDefault(); handleCommentSubmit(e) } }}
                    placeholder="리뷰를 남겨보세요"
                    rows={3}
                    style={{ minHeight: 80 }}
                  />
                  {commentErrors.content && <span className="form-err">{commentErrors.content}</span>}
                </div>
              </div>
              <div className="comment-submit">
                <button type="submit" className="btn btn-accent" disabled={submitting}>
                  {submitting ? '작성 중...' : '댓글 작성'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* 서로보기 모달 */}
      {exchangeOpen && (
        <div className="modal-overlay" onClick={() => setExchangeOpen(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">🔄 서로보기</span>
              <button className="btn-close-edit" onClick={() => setExchangeOpen(false)}>✕</button>
            </div>
            {exchangeRequested ? (
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: 'var(--green)' }}>✅ 서로보기 신청 완료!</div>
                <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 16 }}>
                  상대방이 수락하면 마이페이지 &gt; 서로보기 탭에서 링크를 확인할 수 있습니다.
                </p>
                <button className="btn btn-ghost btn-sm" onClick={() => setExchangeOpen(false)}>닫기</button>
              </div>
            ) : myReviews === null ? (
              <p className="text-muted">내 글을 불러오는 중...</p>
            ) : myReviews.length === 0 ? (
              <div>
                <p style={{ fontSize: 14, color: 'var(--text-2)', marginBottom: 16 }}>
                  서로보기를 하려면 먼저 포폴·이력서 검토 요청 글을 작성해야 합니다.
                </p>
                <Link to="/reviews/new" className="btn btn-accent btn-sm" onClick={() => setExchangeOpen(false)}>
                  검토 요청 글 작성하기
                </Link>
              </div>
            ) : (
              <div>
                <p style={{ fontSize: 14, color: 'var(--text-2)', marginBottom: 16 }}>
                  내 포폴·이력서 글을 선택하고 서로보기를 신청하세요.<br />
                  상대방이 수락하면 서로의 링크를 확인할 수 있습니다.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16, maxHeight: 260, overflowY: 'auto' }}>
                  {myReviews.map(r => (
                    <label key={r.id} style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '10px 12px', borderRadius: 8, cursor: 'pointer',
                      border: selectedMyReview === r.id ? '1.5px solid var(--accent)' : '1px solid var(--border)',
                      background: selectedMyReview === r.id ? 'var(--accent-bg, rgba(99,102,241,0.07))' : 'var(--bg)',
                    }}>
                      <input
                        type="radio"
                        name="myReview"
                        value={r.id}
                        checked={selectedMyReview === r.id}
                        onChange={() => setSelectedMyReview(r.id)}
                        style={{ accentColor: 'var(--accent)' }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ fontSize: 14, fontWeight: 500 }}>{r.title}</div>
                          <span className={`app-status-badge ${r.status}`} style={{ fontSize: 11 }}>{r.statusDisplayName}</span>
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{r.typeDisplayName} · {r.careerLevelDisplayName}</div>
                      </div>
                    </label>
                  ))}
                </div>
                {exchangeError && <div className="form-err" style={{ marginBottom: 8 }}>{exchangeError}</div>}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-accent" onClick={handleExchange} disabled={exchangeLoading}>
                    {exchangeLoading ? '처리 중...' : '서로 링크 확인하기'}
                  </button>
                  <button className="btn btn-ghost" onClick={() => setExchangeOpen(false)}>취소</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
