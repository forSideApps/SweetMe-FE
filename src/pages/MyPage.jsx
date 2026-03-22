import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getMe, updateProfile } from '../api/auth'
import { JOB_ROLES } from '../constants/jobRoles'
import Alert from '../components/Alert'

const CAREER_LEVELS = [
  { value: 'JUNIOR', label: '신입' },
  { value: 'EXPERIENCED', label: '경력' },
]

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

export default function MyPage() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [alert, setAlert] = useState(null)
  const [form, setForm] = useState({ jobRole: '', careerLevel: '', algoGrade: '' })

  useEffect(() => {
    getMe()
      .then(data => {
        setUser(data)
        setForm({
          jobRole: data.jobRole || '',
          careerLevel: data.careerLevel || '',
          algoGrade: data.algoGrade || '',
        })
      })
      .catch(() => navigate('/login', { replace: true }))
      .finally(() => setLoading(false))
  }, [])

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await updateProfile(form)
      setAlert({ type: 'success', message: '프로필이 저장되었습니다.' })
    } catch {
      setAlert({ type: 'error', message: '저장에 실패했습니다.' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="container-sm"><p className="text-muted" style={{ padding: '40px 0' }}>로딩 중...</p></div>

  return (
    <div className="container-sm">
      <div className="page-header">
        <div className="breadcrumb">
          <Link to="/">홈</Link>
          <span>/</span>
          <span>마이페이지</span>
        </div>
        <h1>마이페이지</h1>
      </div>

      {alert && (
        <div className="alerts-container" style={{ marginTop: 16 }}>
          <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />
        </div>
      )}

      <div className="section-sm">
        {/* 계정 정보 */}
        <div className="form-card" style={{ marginBottom: 20 }}>
          <div className="form-section-label" style={{ marginBottom: 16 }}>계정 정보</div>
          <div className="info-rows">
            <div className="info-row">
              <span className="info-key">아이디</span>
              <span className="info-val" style={{ fontWeight: 600 }}>{user.username}</span>
            </div>
            <div className="info-row">
              <span className="info-key">이메일</span>
              <span className="info-val">{user.email || '—'}</span>
            </div>
            <div className="info-row">
              <span className="info-key">권한</span>
              <span className="info-val">{user.role === 'ADMIN' ? '관리자' : '일반 유저'}</span>
            </div>
          </div>
        </div>

        {/* 프로필 설정 */}
        <form className="form-card" onSubmit={handleSave}>
          <div className="form-section-label" style={{ marginBottom: 16 }}>프로필 설정</div>
          <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 20 }}>
            설정한 정보는 스터디 개설·신청 및 포폴·이력서 검토 작성 시 자동으로 입력됩니다.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div className="form-group">
              <label className="form-label">직군</label>
              <select
                className="form-select"
                value={form.jobRole}
                onChange={e => setForm(f => ({ ...f, jobRole: e.target.value }))}
              >
                <option value="">선택 안 함</option>
                {JOB_ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">경력</label>
              <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 14 }}>
                  <input
                    type="radio"
                    name="careerLevel"
                    value=""
                    checked={form.careerLevel === ''}
                    onChange={() => setForm(f => ({ ...f, careerLevel: '' }))}
                  />
                  선택 안 함
                </label>
                {CAREER_LEVELS.map(c => (
                  <label key={c.value} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 14 }}>
                    <input
                      type="radio"
                      name="careerLevel"
                      value={c.value}
                      checked={form.careerLevel === c.value}
                      onChange={() => setForm(f => ({ ...f, careerLevel: c.value }))}
                    />
                    {c.label}
                  </label>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">알고리즘 등급 <span style={{ color: 'var(--text-3)', fontWeight: 400 }}>(선택)</span></label>
              <select
                className="form-select"
                value={form.algoGrade}
                onChange={e => setForm(f => ({ ...f, algoGrade: e.target.value }))}
              >
                {ALGO_GRADES.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
              </select>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-accent" disabled={saving}>
                {saving ? '저장 중...' : '저장하기'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
