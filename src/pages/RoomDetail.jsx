import { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { getRoomDetail, applyToRoom, deleteRoom } from '../api/rooms'
import { getMe } from '../api/auth'
import Alert from '../components/Alert'
import LockedField from '../components/LockedField'
import ThemeLogo from '../components/ThemeLogo'
import StatusBadge from '../components/StatusBadge'
import { JOB_ROLES } from '../constants/jobRoles'
import { formatDate } from '../utils/date'

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

export default function RoomDetail() {
  const { roomId } = useParams()
  const navigate = useNavigate()
  const [isAdmin, setIsAdmin] = useState(false)
  const [user, setUser] = useState(null)
  const [room, setRoom] = useState(null)
  const [loading, setLoading] = useState(true)
  const [alert, setAlert] = useState(null)

  const [form, setForm] = useState({
    applicantName: '',
    jobRole: '',
    algoGrade: '',
    interviewCount: '',
    introduction: '',
    contactInfo: '',
  })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    getRoomDetail(roomId)
      .then(setRoom)
      .catch(() => setAlert({ type: 'error', message: '스터디 정보를 불러오지 못했습니다.' }))
      .finally(() => setLoading(false))
    getMe().then(data => {
      setUser(data)
      if (data.role === 'ADMIN') setIsAdmin(true)
      setForm(f => ({ ...f, applicantName: data.username }))
    }).catch(() => {})
  }, [roomId])

  function validate() {
    const errs = {}
    if (!user && !form.applicantName.trim()) errs.applicantName = '닉네임을 입력해주세요.'
    if (!form.jobRole) errs.jobRole = '직군을 선택해주세요.'
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
        applicantName: form.applicantName,
        jobRole: form.jobRole,
        algoGrade: form.algoGrade || null,
        interviewCount: form.interviewCount !== '' ? Number(form.interviewCount) : null,
        introduction: form.introduction || null,
        contactInfo: form.contactInfo || null,
      }
      await applyToRoom(roomId, body)
      setAlert({ type: 'success', message: '신청이 완료되었습니다! 방장의 승인을 기다려주세요.' })
      setForm({ applicantName: '', jobRole: '', algoGrade: '', interviewCount: '', introduction: '', contactInfo: '' })
    } catch (err) {
      const msg = err?.response?.data?.message || '신청에 실패했습니다. 다시 시도해주세요.'
      setAlert({ type: 'error', message: msg })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="container"><p className="text-muted" style={{ padding: '40px 0' }}>로딩 중...</p></div>
  if (!room) return <div className="container"><p className="text-muted" style={{ padding: '40px 0' }}>스터디를 찾을 수 없습니다.</p></div>

  return (
    <div className="container">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="breadcrumb">
            <Link to="/">홈</Link>
            <span>/</span>
            {room.themeId && <Link to={`/study/theme/${room.themeId}`}>{room.themeName}</Link>}
            {room.themeId && <span>/</span>}
            <span>상세</span>
          </div>
          {isAdmin && (
            <button
              className="btn btn-sm"
              style={{ background: '#ef4444', color: '#fff' }}
              onClick={async () => {
                if (!confirm('이 스터디를 삭제하시겠습니까?')) return
                await deleteRoom(roomId)
                navigate(-1)
              }}
            >삭제</button>
          )}
        </div>
        <div className="page-company">
          <ThemeLogo logoUrl={room.themeLogoUrl} slug={room.themeSlug} size={48} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 8 }}>
          <StatusBadge status={room.status} />
        </div>
        <h1>{room.title}</h1>
        <p>방장: {room.creatorNickname}</p>
      </div>

      {alert && (
        <div className="alerts-container" style={{ marginTop: 16 }}>
          <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />
        </div>
      )}

      <div className="detail-layout">
        <div className="detail-main">
          <div className="card">
            <div className="card-title">스터디 소개</div>
            <div className="card-body">{room.description}</div>
          </div>

          {room.requirements && (
            <div className="card">
              <div className="card-title">참가 요건</div>
              <div className="card-body">{room.requirements}</div>
            </div>
          )}

          {room.status === 'OPEN' ? (
            <div className="card">
              <div className="card-title">스터디 신청</div>
              <form className="apply-form" onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label req">닉네임</label>
                  {user ? (
                    <LockedField value={user.username} />
                  ) : (
                    <>
                      <input
                        className={`form-input${errors.applicantName ? ' is-error' : ''}`}
                        value={form.applicantName}
                        onChange={e => setForm(f => ({ ...f, applicantName: e.target.value }))}
                        placeholder="닉네임을 입력해주세요"
                      />
                      {errors.applicantName && <span className="form-err">{errors.applicantName}</span>}
                    </>
                  )}
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label req">직군</label>
                    <select
                      className={`form-select${errors.jobRole ? ' is-error' : ''}`}
                      value={form.jobRole}
                      onChange={e => setForm(f => ({ ...f, jobRole: e.target.value }))}
                    >
                      <option value="">선택해주세요</option>
                      {JOB_ROLES.map(r => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                      ))}
                    </select>
                    {errors.jobRole && <span className="form-err">{errors.jobRole}</span>}
                  </div>

                  <div className="form-group">
                    <label className="form-label">알고리즘 등급</label>
                    <select
                      className="form-select"
                      value={form.algoGrade}
                      onChange={e => setForm(f => ({ ...f, algoGrade: e.target.value }))}
                    >
                      {ALGO_GRADES.map(g => (
                        <option key={g.value} value={g.value}>{g.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">면접 경험 횟수</label>
                  <input
                    type="number"
                    className="form-input"
                    min="0"
                    value={form.interviewCount}
                    onChange={e => setForm(f => ({ ...f, interviewCount: e.target.value }))}
                    placeholder="0"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">자기소개</label>
                  <textarea
                    className="form-textarea"
                    value={form.introduction}
                    onChange={e => setForm(f => ({ ...f, introduction: e.target.value }))}
                    placeholder="간단한 자기소개를 작성해주세요"
                    rows={4}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">연락처 (선택)</label>
                  <input
                    className="form-input"
                    value={form.contactInfo}
                    onChange={e => setForm(f => ({ ...f, contactInfo: e.target.value }))}
                    placeholder="오픈카톡, 이메일 등"
                  />
                </div>

                <div className="form-actions">
                  <button type="submit" className="btn btn-accent btn-lg w-full" disabled={submitting}>
                    {submitting ? '신청 중...' : '신청하기'}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="closed-box">
              <div style={{ fontSize: 36 }}>🔒</div>
              <h3>모집이 마감되었습니다</h3>
              <p>이 스터디는 현재 모집을 마감했습니다.</p>
              <Link to="/" className="btn btn-outline">다른 스터디 찾기</Link>
            </div>
          )}
        </div>

        <div className="detail-sidebar">
          <div className="card">
            <div className="sidebar-title">스터디 정보</div>
            <div className="info-rows">
              <div className="info-row">
                <span className="info-key">회사</span>
                <span className="info-val">{room.themeName}</span>
              </div>
              <div className="info-row">
                <span className="info-key">상태</span>
                <span className="info-val">{room.status === 'OPEN' ? '모집중' : '마감'}</span>
              </div>
              <div className="info-row">
                <span className="info-key">최대 인원</span>
                <span className="info-val">{room.maxMembers}명</span>
              </div>
              <div className="info-row">
                <span className="info-key">승인 인원</span>
                <span className="info-val">{room.approvedCount ?? 0}명</span>
              </div>
              {room.schedule && (
                <div className="info-row">
                  <span className="info-key">일정</span>
                  <span className="info-val">{room.schedule}</span>
                </div>
              )}
              <div className="info-row">
                <span className="info-key">개설일</span>
                <span className="info-val">{formatDate(room.createdAt)}</span>
              </div>
            </div>
            {room.kakaoLink && (
              <a href={room.kakaoLink} target="_blank" rel="noopener noreferrer" className="btn btn-outline w-full">
                카카오톡 오픈채팅
              </a>
            )}
          </div>

          {user && room.memberUsername && user.username === room.memberUsername ? (
            <div className="card">
              <div className="sidebar-title">방장이시군요 👋</div>
              <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 12 }}>
                신청자 관리 및 스터디 운영을 관리해보세요.
              </p>
              <Link to={`/study/${roomId}/manage/dashboard`} className="btn btn-accent w-full">
                스터디 관리
              </Link>
            </div>
          ) : (
            <div className="card">
              <div className="sidebar-title">방장이신가요?</div>
              <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 12 }}>
                신청자 관리 및 스터디 운영을 위해 로그인하세요.
              </p>
              <Link to={`/study/${roomId}/manage`} className="btn btn-outline w-full">
                방장 로그인
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
