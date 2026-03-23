import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { getThemes } from '../api/themes'
import { createRoom } from '../api/rooms'
import { getMe } from '../api/auth'
import Alert from '../components/Alert'
import LockedField from '../components/LockedField'
import ThemeLogo from '../components/ThemeLogo'
import { JOB_ROLES } from '../constants/jobRoles'

export default function RoomCreate() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const initialThemeId = searchParams.get('themeId')

  const [themes, setThemes] = useState([])
  const [selectedTheme, setSelectedTheme] = useState(null)
  const [user, setUser] = useState(null)
  const [alert, setAlert] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState({})
  const [showEventPopup, setShowEventPopup] = useState(true)

  const [form, setForm] = useState({
    title: '',
    description: '',
    maxMembers: 4,
    creatorNickname: '',
    password: '',
    kakaoLink: '',
    schedule: '',
    requirements: '',
    jobRole: '',
  })

  useEffect(() => {
    getThemes().then(ts => {
      setThemes(ts)
      if (initialThemeId) {
        const found = ts.find(t => String(t.id) === String(initialThemeId))
        if (found) setSelectedTheme(found)
      }
    }).catch(() => {})
    getMe().then(data => {
      setUser(data)
      if (data.jobRole) setForm(f => ({ ...f, jobRole: data.jobRole }))
    }).catch(() => {})
  }, [initialThemeId])

  function validate() {
    const errs = {}
    if (!form.title.trim()) errs.title = '스터디명을 입력해주세요.'
    if (!form.maxMembers || form.maxMembers < 2 || form.maxMembers > 10) errs.maxMembers = '최대 인원은 2~10명이어야 합니다.'
    if (!form.jobRole) errs.jobRole = '직군을 선택해주세요.'
    if (!form.kakaoLink.trim()) errs.kakaoLink = '카카오 오픈채팅 링크를 입력해주세요.'
    if (!user && !form.creatorNickname.trim()) errs.creatorNickname = '방장 닉네임을 입력해주세요.'
    if (!user && (!form.password || form.password.length < 4)) errs.password = '비밀번호는 4자 이상이어야 합니다.'
    return errs
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setErrors({})
    setSubmitting(true)
    try {
      const body = {
        title: form.title,
        description: form.description,
        maxMembers: Number(form.maxMembers),
        creatorNickname: form.creatorNickname,
        password: form.password,
        jobRole: form.jobRole || null,
        kakaoLink: form.kakaoLink,
        schedule: form.schedule || null,
        requirements: form.requirements || null,
      }
      const result = await createRoom(selectedTheme.id, body)
      navigate(`/study/${result.id}`)
    } catch (err) {
      const msg = err?.response?.data?.message || '스터디 개설에 실패했습니다.'
      setAlert({ type: 'error', message: msg })
    } finally {
      setSubmitting(false)
    }
  }

  if (!selectedTheme) {
    return (
      <div className="container">
        <div className="page-header">
          <div className="breadcrumb">
            <Link to="/">홈</Link>
            <span>/</span>
            <span>스터디 개설</span>
          </div>
          <h1>스터디 개설</h1>
          <p>어떤 분야의 스터디를 개설하시겠어요?</p>
        </div>

        <div className="section-sm">
          <div className="room-grid">
            {themes.map(t => (
              <button
                key={t.id}
                className="room-card"
                style={{ textAlign: 'left', border: '1.5px solid var(--border)', cursor: 'pointer', background: 'var(--bg)' }}
                onClick={() => setSelectedTheme(t)}
              >
                <div style={{ marginBottom: 8 }}><ThemeLogo logoUrl={t.logoUrl} slug={t.slug} size={32} /></div>
                <div className="room-title">{t.name}</div>
                {t.description && <div className="room-desc">{t.description}</div>}
              </button>
            ))}
          </div>
        </div>

        {/* 이벤트 팝업 */}
        {showEventPopup && (
          <div className="modal-overlay" onClick={() => setShowEventPopup(false)}>
            <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 420, textAlign: 'center' }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>🎉</div>
              <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 8, color: 'var(--accent)' }}>스터디 개설 이벤트</div>
              <div style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.7, marginBottom: 20 }}>
                스터디를 개설하면<br />
                <strong style={{ color: 'var(--text)' }}>포폴 · 이력서 무료 검토</strong> 혜택을 드립니다!<br />
                <span style={{ fontSize: 12, color: 'var(--text-3)' }}>스터디 개설 후 운영자에게 문의하세요.</span>
              </div>
              <button className="btn btn-accent" style={{ width: '100%' }} onClick={() => setShowEventPopup(false)}>
                확인하고 개설하기
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="container-sm">
      <div className="page-header">
        <div className="breadcrumb">
          <Link to="/">홈</Link>
          <span>/</span>
          <span>스터디 개설</span>
        </div>
        <div className="page-company">
          <ThemeLogo logoUrl={selectedTheme.logoUrl} slug={selectedTheme.slug} size={48} />
        </div>
        <h1>{selectedTheme.name} 스터디 개설</h1>
      </div>

      {alert && (
        <div className="alerts-container" style={{ marginTop: 16 }}>
          <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />
        </div>
      )}

      <div className="section-sm">
        <form className="form-card" onSubmit={handleSubmit}>
          <div className="form-section">
            <div className="form-section-label">기본 정보</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-group">
                <label className="form-label req">스터디명</label>
                <input
                  className={`form-input${errors.title ? ' is-error' : ''}`}
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="스터디 이름을 입력해주세요"
                />
                {errors.title && <span className="form-err">{errors.title}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">스터디 소개</label>
                <textarea
                  className="form-textarea"
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="스터디에 대한 소개를 작성해주세요"
                  rows={4}
                />
              </div>

              <div className="form-group">
                <label className="form-label req">최대 인원</label>
                <input
                  type="number"
                  className={`form-input${errors.maxMembers ? ' is-error' : ''}`}
                  min={2}
                  max={10}
                  value={form.maxMembers}
                  onChange={e => setForm(f => ({ ...f, maxMembers: e.target.value }))}
                />
                {errors.maxMembers && <span className="form-err">{errors.maxMembers}</span>}
              </div>

              <div className="form-group">
                <label className="form-label req">직군</label>
                <select
                  className={`form-select${errors.jobRole ? ' is-error' : ''}`}
                  value={form.jobRole}
                  onChange={e => setForm(f => ({ ...f, jobRole: e.target.value }))}
                >
                  <option value="">직군을 선택해주세요</option>
                  {JOB_ROLES.map(r => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
                {errors.jobRole && <span className="form-err">{errors.jobRole}</span>}
              </div>

              <div className="form-group">
                <label className="form-label req">카카오톡 오픈채팅 링크</label>
                <input
                  className={`form-input${errors.kakaoLink ? ' is-error' : ''}`}
                  value={form.kakaoLink}
                  onChange={e => setForm(f => ({ ...f, kakaoLink: e.target.value }))}
                  placeholder="https://open.kakao.com/..."
                />
                {errors.kakaoLink && <span className="form-err">{errors.kakaoLink}</span>}
              </div>
            </div>
          </div>

          <div className="form-section">
            <div className="form-section-label">방장 정보</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {user ? (
                <div className="form-group">
                  <label className="form-label">방장 닉네임</label>
                  <LockedField value={user.username} />
                </div>
              ) : (
                <>
                  <div className="form-group">
                    <label className="form-label req">방장 닉네임</label>
                    <input
                      className={`form-input${errors.creatorNickname ? ' is-error' : ''}`}
                      value={form.creatorNickname}
                      onChange={e => setForm(f => ({ ...f, creatorNickname: e.target.value }))}
                      placeholder="닉네임을 입력해주세요"
                    />
                    {errors.creatorNickname && <span className="form-err">{errors.creatorNickname}</span>}
                  </div>
                  <div className="form-group">
                    <label className="form-label req">비밀번호</label>
                    <input
                      type="password"
                      className={`form-input${errors.password ? ' is-error' : ''}`}
                      value={form.password}
                      onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                      placeholder="관리자 접근용 비밀번호 (4자 이상)"
                    />
                    {errors.password && <span className="form-err">{errors.password}</span>}
                    <span className="form-hint">신청자 관리 페이지에 접근할 때 사용됩니다.</span>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="form-section">
            <div className="form-section-label">추가 정보 (선택)</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-group">
                <label className="form-label">일정</label>
                <input
                  className="form-input"
                  value={form.schedule}
                  onChange={e => setForm(f => ({ ...f, schedule: e.target.value }))}
                  placeholder="예: 매주 토요일 오후 2시"
                />
              </div>

              <div className="form-group">
                <label className="form-label">참가 요건</label>
                <textarea
                  className="form-textarea"
                  value={form.requirements}
                  onChange={e => setForm(f => ({ ...f, requirements: e.target.value }))}
                  placeholder="참가 요건이나 우대 사항을 적어주세요"
                  rows={3}
                />
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setSelectedTheme(null)}
            >회사 다시 선택</button>
            <button type="submit" className="btn btn-accent btn-lg" disabled={submitting}>
              {submitting ? '개설 중...' : '스터디 개설하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
