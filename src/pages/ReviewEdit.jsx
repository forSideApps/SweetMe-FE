import { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { getReview, verifyReviewPassword, updateReview, getReviewLink } from '../api/review'
import Alert from '../components/Alert'
import { JOB_ROLES } from '../constants/jobRoles'

const TYPES = [
  { value: 'PORTFOLIO', label: '포트폴리오' },
  { value: 'RESUME', label: '이력서' },
]
const CAREER_LEVELS = [
  { value: 'JUNIOR', label: '신입' },
  { value: 'EXPERIENCED', label: '경력' },
]

const SESSION_KEY = (id) => `review_${id}_password`

export default function ReviewEdit() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [step, setStep] = useState('verify') // 'verify' | 'edit'
  const [password, setPassword] = useState('')
  const [pwError, setPwError] = useState('')
  const [pwLoading, setPwLoading] = useState(false)

  const [review, setReview] = useState(null)
  const [form, setForm] = useState({ type: 'PORTFOLIO', jobCategory: 'BACKEND', careerLevel: 'JUNIOR', title: '', content: '', portfolioLink: '', contactInfo: '' })
  const [errors, setErrors] = useState({})
  const [alert, setAlert] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  // sessionStorage에 이미 인증된 경우 바로 edit 단계로
  useEffect(() => {
    const saved = sessionStorage.getItem(SESSION_KEY(id))
    if (saved) {
      setPassword(saved)
      loadReview()
      setStep('edit')
    }
  }, [id])

  function loadReview() {
    const pw = sessionStorage.getItem(SESSION_KEY(id))
    const linkPromise = pw ? getReviewLink(id, pw).catch(() => null) : Promise.resolve(null)
    Promise.all([getReview(id), linkPromise]).then(([data, linkData]) => {
      setReview(data)
      setForm({
        type: data.type,
        jobCategory: data.jobCategory,
        careerLevel: data.careerLevel,
        title: data.title,
        content: data.content,
        portfolioLink: linkData?.link || '',
        contactInfo: data.contactInfo || '',
      })
    })
  }

  async function handleVerify(e) {
    e.preventDefault()
    if (!password) { setPwError('비밀번호를 입력해주세요.'); return }
    setPwError('')
    setPwLoading(true)
    try {
      await verifyReviewPassword(id, password)
      sessionStorage.setItem(SESSION_KEY(id), password)
      loadReview()
      setStep('edit')
    } catch (err) {
      if (err?.response?.status === 401) {
        setPwError('비밀번호가 올바르지 않습니다.')
      } else {
        setPwError('오류가 발생했습니다.')
      }
    } finally {
      setPwLoading(false)
    }
  }

  function validate() {
    const errs = {}
    if (!form.title.trim()) errs.title = '제목을 입력해주세요.'
    if (!form.content.trim()) errs.content = '내용을 입력해주세요.'
    return errs
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setErrors({})
    setSubmitting(true)
    try {
      await updateReview(id, form)
      sessionStorage.removeItem(SESSION_KEY(id))
      navigate(`/reviews/${id}`)
    } catch {
      setAlert({ type: 'error', message: '수정에 실패했습니다.' })
    } finally {
      setSubmitting(false)
    }
  }

  if (step === 'verify') {
    return (
      <div className="auth-wrap">
        <div className="auth-card">
          <div className="auth-icon">🔐</div>
          <div className="auth-title">비밀번호 확인</div>
          <div className="auth-sub">
            게시글 작성 시 설정한 비밀번호를 입력해주세요.
          </div>
          <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="form-group">
              <input
                type="password"
                className={`form-input${pwError ? ' is-error' : ''}`}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="비밀번호 입력"
                autoFocus
              />
              {pwError && <span className="form-err">{pwError}</span>}
            </div>
            <button type="submit" className="btn btn-accent w-full" disabled={pwLoading}>
              {pwLoading ? '확인 중...' : '확인'}
            </button>
          </form>
          <Link to={`/reviews/${id}`} className="auth-back">← 게시글로 돌아가기</Link>
        </div>
      </div>
    )
  }

  if (!review) return <div className="container"><p className="text-muted" style={{ padding: '40px 0' }}>로딩 중...</p></div>

  return (
    <div className="container-sm">
      <div className="page-header">
        <div className="breadcrumb">
          <Link to="/">홈</Link>
          <span>/</span>
          <Link to="/reviews">포폴 · 이력서 검토</Link>
          <span>/</span>
          <Link to={`/reviews/${id}`}>{review.title}</Link>
          <span>/</span>
          <span>수정</span>
        </div>
        <h1>게시글 수정</h1>
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
              <label className="form-label req">검토 유형</label>
              <select
                className="form-select"
                value={form.type}
                onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
              >
                {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label req">경력</label>
                <select
                  className="form-select"
                  value={form.careerLevel}
                  onChange={e => setForm(f => ({ ...f, careerLevel: e.target.value }))}
                >
                  {CAREER_LEVELS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label req">직군</label>
                <select
                  className="form-select"
                  value={form.jobCategory}
                  onChange={e => setForm(f => ({ ...f, jobCategory: e.target.value }))}
                >
                  {JOB_ROLES.map(j => <option key={j.value} value={j.value}>{j.label}</option>)}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label req">제목</label>
              <input
                className={`form-input${errors.title ? ' is-error' : ''}`}
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              />
              {errors.title && <span className="form-err">{errors.title}</span>}
            </div>

            <div className="form-group">
              <label className="form-label req">내용</label>
              <textarea
                className={`form-textarea${errors.content ? ' is-error' : ''}`}
                value={form.content}
                onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                rows={10}
                style={{ minHeight: 240 }}
              />
              {errors.content && <span className="form-err">{errors.content}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">포트폴리오/이력서 링크 <span style={{ color: 'var(--text-3)', fontWeight: 400 }}>(선택)</span></label>
              <input
                className="form-input"
                value={form.portfolioLink}
                onChange={e => setForm(f => ({ ...f, portfolioLink: e.target.value }))}
                placeholder="노션, GitHub, 구글 드라이브 등"
              />
            </div>

            <div className="form-group">
              <label className="form-label">연락처</label>
              <input
                className="form-input"
                value={form.contactInfo}
                onChange={e => setForm(f => ({ ...f, contactInfo: e.target.value }))}
                placeholder="카카오 오픈채팅, 이메일 등"
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-accent btn-lg" disabled={submitting}>
                {submitting ? '저장 중...' : '수정 완료'}
              </button>
              <Link to={`/reviews/${id}`} className="btn btn-ghost">취소</Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
