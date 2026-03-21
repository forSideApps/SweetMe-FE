import { useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { verifyManagePassword } from '../api/rooms'

export default function ManageLogin() {
  const { roomId } = useParams()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!password) { setError('비밀번호를 입력해주세요.'); return }
    setError('')
    setLoading(true)
    try {
      await verifyManagePassword(roomId, password)
      sessionStorage.setItem(`room_${roomId}_password`, password)
      navigate(`/study/${roomId}/manage/dashboard`)
    } catch (err) {
      if (err?.response?.status === 401) {
        setError('비밀번호가 올바르지 않습니다')
      } else {
        setError('오류가 발생했습니다. 다시 시도해주세요.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-icon">🔐</div>
        <div className="auth-title">방장 로그인</div>
        <div className="auth-sub">
          신청자 관리를 위해 비밀번호를 입력해주세요.<br />
          스터디 개설 시 설정한 비밀번호입니다.
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="form-group">
            <input
              type="password"
              className={`form-input${error ? ' is-error' : ''}`}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="비밀번호 입력"
              autoFocus
            />
            {error && <span className="form-err">{error}</span>}
          </div>
          <button type="submit" className="btn btn-accent w-full" disabled={loading}>
            {loading ? '확인 중...' : '로그인'}
          </button>
        </form>

        <Link to={`/study/${roomId}`} className="auth-back">← 스터디로 돌아가기</Link>
      </div>
    </div>
  )
}
