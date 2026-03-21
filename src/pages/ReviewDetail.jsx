import { useState, useEffect, useCallback, useRef } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getReview, incrementReviewView, addReviewComment, getReviewLink } from '../api/review'
import Alert from '../components/Alert'

const STATUS_STYLE = {
  PENDING: { background: 'var(--amber-bg)', color: 'var(--amber)' },
  DONE:    { background: '#dcfce7', color: '#16a34a' },
}

function formatDate(str) {
  if (!str) return ''
  return str.slice(0, 16).replace('T', ' ')
}

export default function ReviewDetail() {
  const { id } = useParams()
  const [review, setReview] = useState(null)
  const [loading, setLoading] = useState(true)
  const [alert, setAlert] = useState(null)
  const [comment, setComment] = useState({ authorName: '', content: '' })
  const [commentErrors, setCommentErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const viewedRef = useRef(false)
  const [linkPw, setLinkPw] = useState('')
  const [linkPwError, setLinkPwError] = useState('')
  const [revealedLink, setRevealedLink] = useState(null)
  const [linkLoading, setLinkLoading] = useState(false)
  const [showLinkPwForm, setShowLinkPwForm] = useState(false)

  const fetchReview = useCallback(() => {
    getReview(id).then(setReview).finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    fetchReview()
    if (!viewedRef.current) {
      viewedRef.current = true
      incrementReviewView(id).catch(() => {})
    }
  }, [id])

  function validateComment() {
    const errs = {}
    if (!comment.authorName.trim()) errs.authorName = '작성자명을 입력해주세요.'
    if (!comment.content.trim()) errs.content = '내용을 입력해주세요.'
    return errs
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
      setComment({ authorName: '', content: '' })
      setAlert({ type: 'success', message: '댓글이 작성되었습니다.' })
      fetchReview()
    } catch {
      setAlert({ type: 'error', message: '댓글 작성에 실패했습니다.' })
    } finally {
      setSubmitting(false)
    }
  }

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
                  <span>{formatDate(review.createdAt)}</span>
                </div>
              </div>
              <Link to={`/reviews/${review.id}/edit`} className="btn btn-outline btn-sm" style={{ flexShrink: 0 }}>수정하기</Link>
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
              ) : showLinkPwForm ? (
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
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    flex: 1, fontSize: 14, color: 'var(--text-3)',
                    filter: 'blur(5px)', userSelect: 'none', letterSpacing: 2
                  }}>https://notion.so/••••••••••••••</div>
                  <button className="btn btn-outline btn-sm" onClick={() => setShowLinkPwForm(true)}>
                    🔒 링크 보기
                  </button>
                </div>
              )}
            </div>
          )}

          {review.contactInfo && (
            <div style={{
              margin: '0 24px 20px',
              padding: '12px 16px',
              background: 'var(--bg-2)', borderRadius: 'var(--radius)',
              border: '1px solid var(--border)', fontSize: 14
            }}>
              <span style={{ fontWeight: 600, marginRight: 8 }}>연락처</span>
              <span style={{ color: 'var(--text-2)' }}>{review.contactInfo}</span>
            </div>
          )}

          <div className="post-detail-actions">
            <Link to="/reviews" className="btn btn-ghost btn-sm">← 목록으로</Link>
          </div>
        </div>

        {/* 댓글 섹션 */}
        <div className="comments-section">
          <div className="comments-title">댓글 {comments.length}개</div>

          {comments.length === 0 ? (
            <p className="no-comments">아직 댓글이 없습니다. 첫 번째 리뷰를 남겨보세요!</p>
          ) : (
            <div className="comment-list">
              {comments.map(c => (
                <div key={c.id} className="comment-item">
                  <div className="comment-header">
                    <span className="comment-author">{c.authorName}</span>
                    <span className="comment-date">{formatDate(c.createdAt)}</span>
                  </div>
                  <div className="comment-body">{c.content}</div>
                </div>
              ))}
            </div>
          )}

          <div className="comment-form">
            <form onSubmit={handleCommentSubmit}>
              <div className="comment-inputs">
                <div className="form-group">
                  <input
                    className={`form-input${commentErrors.authorName ? ' is-error' : ''}`}
                    value={comment.authorName}
                    onChange={e => setComment(c => ({ ...c, authorName: e.target.value }))}
                    placeholder="작성자명"
                  />
                  {commentErrors.authorName && <span className="form-err">{commentErrors.authorName}</span>}
                </div>
                <div className="form-group">
                  <textarea
                    className={`form-textarea${commentErrors.content ? ' is-error' : ''}`}
                    value={comment.content}
                    onChange={e => setComment(c => ({ ...c, content: e.target.value }))}
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
    </div>
  )
}
