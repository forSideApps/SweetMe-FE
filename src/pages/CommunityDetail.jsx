import { useState, useEffect, useCallback, useRef } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { getPost, addComment, updateComment, deleteComment, incrementPostView, deletePost } from '../api/community'
import { getMe } from '../api/auth'
import Alert from '../components/Alert'
import { formatDateTime } from '../utils/date'

function renderWithLinks(text) {
  if (!text) return null
  const parts = text.split(/(https?:\/\/[^\s]+)/)
  return parts.map((part, i) =>
    i % 2 === 1
      ? <a key={i} href={part} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', textDecoration: 'underline', wordBreak: 'break-all' }}>{part}</a>
      : part
  )
}

const CATEGORY_LABELS = {
  REGIONAL: '지역 정보',
  SUGGESTION: '건의 기능 요청',
  FREE: '자유게시판',
  NOTICE: '공지사항',
  COMPANY_SCHEDULE: '채용 일정 정보',
}

export default function CommunityDetail() {
  const { postId } = useParams()
  const navigate = useNavigate()
  const [isAdmin, setIsAdmin] = useState(false)
  const [user, setUser] = useState(null)
  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)
  const [alert, setAlert] = useState(null)

  const [comment, setComment] = useState({ authorName: '', content: '' })
  const [commentErrors, setCommentErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editContent, setEditContent] = useState('')
  const [editError, setEditError] = useState('')
  const viewedRef = useRef(false)

  const fetchPost = useCallback(() => {
    getPost(postId)
      .then(setPost)
      .catch(() => setAlert({ type: 'error', message: '게시글을 불러오지 못했습니다.' }))
      .finally(() => setLoading(false))
  }, [postId])

  useEffect(() => {
    fetchPost()
    if (!viewedRef.current) {
      viewedRef.current = true
      incrementPostView(postId)
    }
    getMe().then(data => { setUser(data); if (data.role === 'ADMIN') setIsAdmin(true) }).catch(() => {})
  }, [postId])

  function validateComment() {
    const errs = {}
    if (!user) {
      if (!comment.authorName.trim()) errs.author = '작성자명을 입력해주세요.'
      if (comment.authorName.includes('방장') || comment.authorName.includes('운영자')) errs.author = '사용할 수 없는 닉네임입니다.'
    }
    if (!comment.content.trim()) errs.content = '내용을 입력해주세요.'
    return errs
  }

  async function handleEditSubmit() {
    if (!editContent.trim()) { setEditError('내용을 입력해주세요.'); return }
    try {
      await updateComment(postId, editingId, { content: editContent })
      setEditingId(null)
      fetchPost()
    } catch { setEditError('수정에 실패했습니다.') }
  }

  async function handleCommentSubmit(e) {
    e.preventDefault()
    const errs = validateComment()
    if (Object.keys(errs).length > 0) { setCommentErrors(errs); return }
    setCommentErrors({})
    setSubmitting(true)
    try {
      await addComment(postId, comment)
      setComment({ authorName: '', content: '' })
      setAlert({ type: 'success', message: '댓글이 작성되었습니다.' })
      fetchPost()
    } catch (err) {
      const msg = err?.response?.data?.message || '댓글 작성에 실패했습니다.'
      setAlert({ type: 'error', message: msg })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="container-sm"><p className="text-muted" style={{ padding: '40px 0' }}>로딩 중...</p></div>
  if (!post) return <div className="container-sm"><p className="text-muted" style={{ padding: '40px 0' }}>게시글을 찾을 수 없습니다.</p></div>

  const comments = post.comments || []

  return (
    <div className="container-sm">
      <div className="page-header">
        <div className="breadcrumb">
          <Link to="/">홈</Link>
          <span>/</span>
          <Link to="/community">커뮤니티</Link>
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
                <span className={`post-cat-badge ${post.category}`}>
                  {CATEGORY_LABELS[post.category] || post.category}
                </span>
                <div className="post-detail-title">{post.title}</div>
                <div className="post-detail-meta">
                  <span>{post.authorName}</span>
                  {post.viewCount != null && <span>조회 {post.viewCount}</span>}
                  <span>{formatDateTime(post.createdAt)}</span>
                </div>
              </div>
              {(isAdmin || (user && post.memberUsername && post.memberUsername === user.username)) && (
                <button
                  className="btn btn-sm"
                  style={{ background: '#ef4444', color: '#fff', flexShrink: 0 }}
                  onClick={async () => {
                    if (!confirm('이 게시글을 삭제하시겠습니까?')) return
                    await deletePost(postId)
                    navigate('/community', { replace: true })
                  }}
                >삭제</button>
              )}
            </div>
          </div>
          <div className="post-detail-body" style={{ whiteSpace: 'pre-wrap' }}>{renderWithLinks(post.content)}</div>
          <div className="post-detail-actions">
            <button onClick={() => navigate(-1)} className="btn btn-ghost btn-sm">← 목록으로</button>
          </div>
        </div>

        <div className="comments-section">
          <div className="comments-title">댓글 {comments.length}개</div>

          {comments.length === 0 ? (
            <p className="no-comments">아직 댓글이 없습니다. 첫 댓글을 남겨보세요!</p>
          ) : (
            <div className="comment-list">
              {comments.map(c => (
                <div key={c.id} className="comment-item">
                  <div className="comment-header">
                    <span className="comment-author">
                      {c.memberUsername ? (
                        <span className={user && c.memberUsername === user.username ? 'comment-member-badge--blink' : 'comment-member-badge'}>●</span>
                      ) : null}
                      {c.authorName}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span className="comment-date">{formatDateTime(c.createdAt)}</span>
                      {user && c.memberUsername === user.username && (
                        <button
                          className="btn btn-ghost btn-sm"
                          style={{ padding: '1px 6px', fontSize: 12 }}
                          onClick={() => { setEditingId(c.id); setEditContent(c.content); setEditError('') }}
                        >수정</button>
                      )}
                      {(isAdmin || (user && c.memberUsername === user.username)) && (
                        <button
                          className="btn btn-ghost btn-sm"
                          style={{ padding: '1px 6px', fontSize: 12, color: 'var(--danger, #ef4444)' }}
                          onClick={async () => {
                            if (!confirm('댓글을 삭제하시겠습니까?')) return
                            try {
                              await deleteComment(postId, c.id)
                              fetchPost()
                            } catch { setAlert({ type: 'error', message: '삭제에 실패했습니다.' }) }
                          }}
                        >삭제</button>
                      )}
                    </div>
                  </div>
                  {editingId === c.id ? (
                    <div style={{ marginTop: 6 }}>
                      <textarea
                        className="form-textarea"
                        value={editContent}
                        onChange={e => setEditContent(e.target.value)}
                        onKeyDown={e => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { e.preventDefault(); handleEditSubmit() } }}
                        rows={3}
                        style={{ minHeight: 70, width: '100%' }}
                      />
                      {editError && <span className="form-err">{editError}</span>}
                      <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                        <button
                          className="btn btn-accent btn-sm"
                          onClick={handleEditSubmit}
                        >저장</button>
                        <button className="btn btn-ghost btn-sm" onClick={() => setEditingId(null)}>취소</button>
                      </div>
                    </div>
                  ) : (
                    <div className="comment-body">{c.content}</div>
                  )}
                </div>
              ))}
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
                      className={`form-input${commentErrors.author ? ' is-error' : ''}`}
                      value={comment.authorName}
                      onChange={e => setComment(c => ({ ...c, authorName: e.target.value }))}
                      placeholder="작성자명"
                    />
                    {commentErrors.author && <span className="form-err">{commentErrors.author}</span>}
                  </div>
                )}
                <div className="form-group">
                  <textarea
                    className={`form-textarea${commentErrors.content ? ' is-error' : ''}`}
                    value={comment.content}
                    onChange={e => setComment(c => ({ ...c, content: e.target.value }))}
                    onKeyDown={e => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { e.preventDefault(); handleCommentSubmit(e) } }}
                    placeholder="댓글을 입력해주세요"
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
