import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { login } from '../api/auth'

export default function Login() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const returnUrl = searchParams.get('from') || '/'
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.username || !form.password) { setError('아이디와 비밀번호를 입력해주세요.'); return }
    setError('')
    setLoading(true)
    try {
      const data = await login(form)
      if (data.role === 'ADMIN') {
        navigate('/admin/visitors')
      } else {
        navigate(returnUrl)
      }
    } catch (err) {
      setError(err?.response?.data?.message || '로그인에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-icon">🔑</div>
        <div className="auth-title">로그인</div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="form-group">
            <input
              className="form-input"
              value={form.username}
              onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
              placeholder="아이디"
              autoFocus
              autoComplete="username"
            />
          </div>
          <div className="form-group">
            <input
              type="password"
              className={`form-input${error ? ' is-error' : ''}`}
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              placeholder="비밀번호"
              autoComplete="current-password"
            />
            {error && <span className="form-err">{error}</span>}
          </div>
          <button type="submit" className="btn btn-accent w-full" disabled={loading}>
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: 'var(--text-3)' }}>
          아직 계정이 없으신가요?{' '}
          <Link to="/register" style={{ color: 'var(--accent)' }}>회원가입</Link>
        </div>
      </div>
    </div>
  )
}
