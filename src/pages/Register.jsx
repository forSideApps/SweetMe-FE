import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { register } from '../api/auth'
import { JOB_ROLES } from '../constants/jobRoles'

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

export default function Register() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    username: '', password: '', passwordConfirm: '', email: '',
    jobRole: '', careerLevel: '', algoGrade: '',
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  function validate() {
    const errs = {}
    if (!form.username || form.username.length < 3) errs.username = '아이디는 3자 이상이어야 합니다.'
    if (!form.password || form.password.length < 4) errs.password = '비밀번호는 4자 이상이어야 합니다.'
    if (form.password !== form.passwordConfirm) errs.passwordConfirm = '비밀번호가 일치하지 않습니다.'
    if (!form.email || !form.email.includes('@')) errs.email = '올바른 이메일을 입력해주세요.'
    return errs
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({})
    setLoading(true)
    try {
      await register({
        username: form.username,
        password: form.password,
        email: form.email,
        jobRole: form.jobRole || null,
        careerLevel: form.careerLevel || null,
        algoGrade: form.algoGrade || null,
      })
      navigate('/login')
    } catch (err) {
      const msg = err?.response?.data?.message || '회원가입에 실패했습니다.'
      setErrors({ submit: msg })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card" style={{ maxWidth: 500 }}>
        <div className="auth-title" style={{ marginBottom: 24 }}>회원가입</div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

          <div className="reg-row">
            <label className="reg-label req">아이디</label>
            <div className="reg-field">
              <input
                className={`form-input${errors.username ? ' is-error' : ''}`}
                value={form.username}
                onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                placeholder="3자 이상"
                autoFocus
                autoComplete="username"
              />
              {errors.username && <span className="form-err">{errors.username}</span>}
            </div>
          </div>

          <div className="reg-row">
            <label className="reg-label req">비밀번호</label>
            <div className="reg-field">
              <input
                type="password"
                className={`form-input${errors.password ? ' is-error' : ''}`}
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                placeholder="4자 이상"
                autoComplete="new-password"
              />
              {errors.password && <span className="form-err">{errors.password}</span>}
            </div>
          </div>

          <div className="reg-row">
            <label className="reg-label req">비밀번호 확인</label>
            <div className="reg-field">
              <input
                type="password"
                className={`form-input${errors.passwordConfirm ? ' is-error' : ''}`}
                value={form.passwordConfirm}
                onChange={e => setForm(f => ({ ...f, passwordConfirm: e.target.value }))}
                placeholder="비밀번호 재입력"
                autoComplete="new-password"
              />
              {errors.passwordConfirm && <span className="form-err">{errors.passwordConfirm}</span>}
            </div>
          </div>

          <div className="reg-row">
            <label className="reg-label req">이메일</label>
            <div className="reg-field">
              <input
                type="email"
                className={`form-input${errors.email ? ' is-error' : ''}`}
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="example@email.com"
                autoComplete="email"
              />
              {errors.email && <span className="form-err">{errors.email}</span>}
            </div>
          </div>

          {/* 선택 프로필 */}
          <div style={{ margin: '12px 0', paddingTop: 12 }}>
            <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 10 }}>
              프로필 정보 <span style={{ fontWeight: 400 }}>(선택 · 나중에 마이페이지에서 변경 가능)</span>
            </div>

            <div className="reg-row">
              <label className="reg-label">직군</label>
              <div className="reg-field">
                <select
                  className="form-select"
                  value={form.jobRole}
                  onChange={e => setForm(f => ({ ...f, jobRole: e.target.value }))}
                >
                  <option value="">선택 안 함</option>
                  {JOB_ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
            </div>

            <div className="reg-row">
              <label className="reg-label">경력</label>
              <div className="reg-field">
                <div className="review-chip-group" style={{ padding: '6px 0' }}>
                  {[{ value: '', label: '선택 안 함' }, { value: 'JUNIOR', label: '신입' }, { value: 'EXPERIENCED', label: '경력' }].map(c => (
                    <button
                      key={c.value}
                      type="button"
                      className={`review-chip${form.careerLevel === c.value ? ' active' : ''}`}
                      onClick={() => setForm(f => ({ ...f, careerLevel: c.value }))}
                    >{c.label}</button>
                  ))}
                </div>
              </div>
            </div>

            <div className="reg-row">
              <label className="reg-label">알고리즘 등급</label>
              <div className="reg-field">
                <select
                  className="form-select"
                  value={form.algoGrade}
                  onChange={e => setForm(f => ({ ...f, algoGrade: e.target.value }))}
                >
                  {ALGO_GRADES.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
                </select>
              </div>
            </div>
          </div>

          {errors.submit && (
            <div style={{ padding: '0 0 12px' }}>
              <span className="form-err">{errors.submit}</span>
            </div>
          )}

          <button type="submit" className="btn btn-accent w-full" style={{ marginTop: 8 }} disabled={loading}>
            {loading ? '가입 중...' : '회원가입'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: 'var(--text-3)' }}>
          이미 계정이 있으신가요?{' '}
          <Link to="/login" style={{ color: 'var(--accent)' }}>로그인</Link>
        </div>
      </div>
    </div>
  )
}
