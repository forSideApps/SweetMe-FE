import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { createReview } from '../api/review'
import { getMe } from '../api/auth'
import Alert from '../components/Alert'
import LockedField from '../components/LockedField'
import { JOB_ROLES } from '../constants/jobRoles'

const TYPES = [
  { value: 'PORTFOLIO', label: '포트폴리오' },
  { value: 'RESUME', label: '이력서' },
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
  const [user, setUser] = useState(null)
  const [contacts, setContacts] = useState([''])
  const [form, setForm] = useState({
    type: 'PORTFOLIO',
    jobCategory: 'BACKEND',
    careerLevel: 'JUNIOR',
    title: '',
    content: '',
    portfolioLink: '',
    authorName: '',
    password: '',
  })

  useEffect(() => {
    getMe().then(data => {
      setUser(data)
      setForm(f => ({
        ...f,
        authorName: data.username,
        ...(data.jobRole && { jobCategory: data.jobRole }),
        ...(data.careerLevel && { careerLevel: data.careerLevel }),
      }))
      if (data.email) setContacts([data.email])
    }).catch(() => {})
  }, [])

  function validate() {
    const errs = {}
    if (!form.title.trim()) errs.title = '제목을 입력해주세요.'
    if (!form.content.trim()) errs.content = '내용을 입력해주세요.'
    if (!user && !form.authorName.trim()) errs.authorName = '작성자명을 입력해주세요.'
    if (!user && !form.password.trim()) errs.password = '비밀번호를 입력해주세요.'
    return errs
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setErrors({})
    setSubmitting(true)
    try {
      const result = await createReview({ ...form, contactInfo: contacts.filter(c => c.trim()).join('\n') || null })
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
                placeholder={`포트폴리오/이력서에서 피드백을 받고 싶은 내용을 자유롭게 작성해주세요.\n\n▪ 경력직이라면\n- 근무 산업군 키워드 나열 (예: SI, SM, 서비스, 금융, 스타트업 등)\n- 진행한 프로젝트 키워드 나열 (예: 물류 시스템 고도화, 결제 API 연동, ERP 개발 등)\n\n▪ 신입이라면\n- 주요 프로젝트 키워드 나열 (예: 팀 프로젝트 - 쇼핑몰 백엔드, 개인 프로젝트 - 일정 관리 앱 등)\n- 사용 기술 스택 (예: Java, Spring Boot, React, MySQL 등)\n\n▪ 피드백 원하는 부분\n- 구체적으로 궁금한 점 또는 개선이 필요한 부분을 적어주세요.`}
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
                placeholder="노션, GitHub, 구글 드라이브 등 링크"
              />
              {!user && <span className="form-hint">링크는 비밀번호를 입력한 사람만 볼 수 있습니다.</span>}
            </div>

            <div className="form-row">
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
                      placeholder="닉네임"
                    />
                    {errors.authorName && <span className="form-err">{errors.authorName}</span>}
                  </>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">연락처 <span style={{ color: 'var(--text-3)', fontWeight: 400 }}>(선택)</span></label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {contacts.map((c, i) => (
                    <div key={i} style={{ display: 'flex', gap: 6 }}>
                      <input
                        className="form-input"
                        value={c}
                        onChange={e => setContacts(prev => prev.map((v, idx) => idx === i ? e.target.value : v))}
                        placeholder="카카오 오픈채팅, 이메일 등"
                        style={{ flex: 1 }}
                      />
                      {contacts.length > 1 && (
                        <button
                          type="button"
                          className="btn btn-ghost"
                          style={{ padding: '0 10px', fontSize: 18, lineHeight: 1 }}
                          onClick={() => setContacts(prev => prev.filter((_, idx) => idx !== i))}
                        >×</button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    className="btn btn-ghost"
                    style={{ alignSelf: 'flex-start', fontSize: 13 }}
                    onClick={() => setContacts(prev => [...prev, ''])}
                  >+ 연락처 추가</button>
                </div>
              </div>
            </div>

            {!user && (
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
            )}

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
