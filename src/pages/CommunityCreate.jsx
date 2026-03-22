import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { createPost } from '../api/community'
import { getMe } from '../api/auth'
import Alert from '../components/Alert'
import LockedField from '../components/LockedField'

const CATEGORIES = [
  { value: 'FREE', label: '자유게시판' },
  { value: 'SUGGESTION', label: '건의 기능 요청' },
]

export default function CommunityCreate() {
  const navigate = useNavigate()
  const [alert, setAlert] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState({})
  const [user, setUser] = useState(null)

  const [form, setForm] = useState({
    category: 'FREE',
    title: '',
    content: '',
    authorName: '',
  })

  useEffect(() => {
    getMe().then(data => {
      setUser(data)
      setForm(f => ({ ...f, authorName: data.username }))
    }).catch(() => {})
  }, [])

  function validate() {
    const errs = {}
    if (!form.category) errs.category = '카테고리를 선택해주세요.'
    if (!form.title.trim()) errs.title = '제목을 입력해주세요.'
    if (!form.content.trim()) errs.content = '내용을 입력해주세요.'
    if (!user && !form.authorName.trim()) errs.authorName = '작성자명을 입력해주세요.'
    return errs
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setErrors({})
    setSubmitting(true)
    try {
      const result = await createPost(form)
      navigate(`/community/${result.id}`)
    } catch (err) {
      const msg = err?.response?.data?.message || '글 작성에 실패했습니다.'
      setAlert({ type: 'error', message: msg })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="container-sm">
      <div className="page-header">
        <div className="breadcrumb">
          <Link to="/">홈</Link>
          <span>/</span>
          <Link to="/community">커뮤니티</Link>
          <span>/</span>
          <span>글쓰기</span>
        </div>
        <h1>글쓰기</h1>
      </div>

      {alert && (
        <div className="alerts-container" style={{ marginTop: 16 }}>
          <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />
        </div>
      )}

      <div className="section-sm">
        <form className="form-card" onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-group">
              <label className="form-label req">카테고리</label>
              <select
                className={`form-select${errors.category ? ' is-error' : ''}`}
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
              >
                {CATEGORIES.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
              {errors.category && <span className="form-err">{errors.category}</span>}
            </div>

            <div className="form-group">
              <label className="form-label req">제목</label>
              <input
                className={`form-input${errors.title ? ' is-error' : ''}`}
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="제목을 입력해주세요"
              />
              {errors.title && <span className="form-err">{errors.title}</span>}
            </div>

            <div className="form-group">
              <label className="form-label req">내용</label>
              <textarea
                className={`form-textarea${errors.content ? ' is-error' : ''}`}
                value={form.content}
                onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                placeholder="내용을 입력해주세요"
                rows={8}
                style={{ minHeight: 200 }}
              />
              {errors.content && <span className="form-err">{errors.content}</span>}
            </div>

            <div className="form-group">
              <label className="form-label req">작성자명</label>
              {user ? (
                <LockedField value={user.username} />
              ) : (
                <>
                  <input
                    className={`form-input${errors.authorName ? ' is-error' : ''}`}
                    value={form.authorName}
                    onChange={e => setForm(f => ({ ...f, authorName: e.target.value }))}
                    placeholder="닉네임을 입력해주세요"
                  />
                  {errors.authorName && <span className="form-err">{errors.authorName}</span>}
                </>
              )}
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-accent btn-lg" disabled={submitting}>
                {submitting ? '작성 중...' : '글 작성하기'}
              </button>
              <Link to="/community" className="btn btn-ghost">취소</Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
