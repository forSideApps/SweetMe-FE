import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { createReview } from '../api/review'
import Alert from '../components/Alert'

const TYPES = [
  { value: 'PORTFOLIO', label: '포트폴리오' },
  { value: 'RESUME', label: '이력서' },
]
const JOB_CATEGORIES = [
  { value: 'BACKEND', label: '백엔드' },
  { value: 'FRONTEND', label: '프론트' },
  { value: 'OTHER', label: '기타' },
]
const CAREER_LEVELS = [
  { value: 'JUNIOR', label: '신입' },
  { value: 'EXPERIENCED', label: '경력' },
]

export default function ReviewCreate() {
  const navigate = useNavigate()
  const [alert, setAlert] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState({})
  const [form, setForm] = useState({
    type: 'PORTFOLIO',
    jobCategory: 'BACKEND',
    careerLevel: 'JUNIOR',
    title: '',
    content: '',
    authorName: '',
    contactInfo: '',
    password: '',
  })

  function validate() {
    const errs = {}
    if (!form.title.trim()) errs.title = '제목을 입력해주세요.'
    if (!form.content.trim()) errs.content = '내용을 입력해주세요.'
    if (!form.authorName.trim()) errs.authorName = '작성자명을 입력해주세요.'
    if (!form.password.trim()) errs.password = '비밀번호를 입력해주세요.'
    return errs
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setErrors({})
    setSubmitting(true)
    try {
      const result = await createReview(form)
      navigate(`/reviews/${result.id}`)
    } catch {
      setAlert({ type: 'error', message: '작성에 실패했습니다.' })
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
          <Link to="/reviews">포폴 · 이력서 검토</Link>
          <span>/</span>
          <span>검토 요청하기</span>
        </div>
        <h1>검토 요청하기</h1>
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
                  {JOB_CATEGORIES.map(j => <option key={j.value} value={j.value}>{j.label}</option>)}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label req">제목</label>
              <input
                className={`form-input${errors.title ? ' is-error' : ''}`}
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="예: 이력서 피드백 부탁드립니다"
              />
              {errors.title && <span className="form-err">{errors.title}</span>}
            </div>

            <div className="form-group">
              <label className="form-label req">내용</label>
              <textarea
                className={`form-textarea${errors.content ? ' is-error' : ''}`}
                value={form.content}
                onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                placeholder={`포트폴리오/이력서 링크나 내용을 자유롭게 작성해주세요.\n\n예:\n- 노션 링크: https://...\n- 피드백 원하는 부분: 프로젝트 설명 방식, 기술 스택 표현 등`}
                rows={10}
                style={{ minHeight: 240 }}
              />
              {errors.content && <span className="form-err">{errors.content}</span>}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label req">작성자명</label>
                <input
                  className={`form-input${errors.authorName ? ' is-error' : ''}`}
                  value={form.authorName}
                  onChange={e => setForm(f => ({ ...f, authorName: e.target.value }))}
                  placeholder="닉네임"
                />
                {errors.authorName && <span className="form-err">{errors.authorName}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">연락처 <span style={{ color: 'var(--text-3)', fontWeight: 400 }}>(선택)</span></label>
                <input
                  className="form-input"
                  value={form.contactInfo}
                  onChange={e => setForm(f => ({ ...f, contactInfo: e.target.value }))}
                  placeholder="카카오 오픈채팅, 이메일 등"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label req">비밀번호</label>
              <input
                type="password"
                className={`form-input${errors.password ? ' is-error' : ''}`}
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                placeholder="나중에 수정 시 사용할 비밀번호"
              />
              {errors.password && <span className="form-err">{errors.password}</span>}
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-accent btn-lg" disabled={submitting}>
                {submitting ? '작성 중...' : '검토 요청하기'}
              </button>
              <Link to="/reviews" className="btn btn-ghost">취소</Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
