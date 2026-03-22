import { useState, useEffect, useCallback } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { getManageApplications, approveApplication, rejectApplication, closeRoom, updateRoom, reopenRoom } from '../api/rooms'
import Alert from '../components/Alert'
import { JOB_ROLES } from '../constants/jobRoles'
import { formatDate } from '../utils/date'

const JOB_ROLE_LABELS = Object.fromEntries(JOB_ROLES.map(r => [r.value, r.label]))

const ALGO_GRADE_LABELS = {
  UNRATED: '언레이팅', BRONZE: '브론즈', SILVER: '실버', GOLD: '골드',
  PLATINUM: '플래티넘', DIAMOND: '다이아몬드', RUBY: '루비', MASTER: '마스터',
}

export default function ManageDashboard() {
  const { roomId } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [alert, setAlert] = useState(null)
  const [editOpen, setEditOpen] = useState(false)
  const [editForm, setEditForm] = useState(null)
  const [saving, setSaving] = useState(false)

  const password = sessionStorage.getItem(`room_${roomId}_password`)

  useEffect(() => {
    if (password === null) {
      navigate(`/study/${roomId}/manage`)
      return
    }
    fetchData()
  }, [roomId])

  const fetchData = useCallback(() => {
    setLoading(true)
    getManageApplications(roomId, password)
      .then(setData)
      .catch(() => {
        setAlert({ type: 'error', message: '데이터를 불러오지 못했습니다.' })
      })
      .finally(() => setLoading(false))
  }, [roomId, password])

  function openEdit(room) {
    setEditForm({
      title: room.title || '',
      description: room.description || '',
      maxMembers: room.maxMembers || 4,
      kakaoLink: room.kakaoLink || '',
      requirements: room.requirements || '',
      jobRole: room.jobRole || '',
    })
    setEditOpen(true)
  }

  async function handleSaveEdit(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await updateRoom(roomId, password, {
        ...editForm,
        maxMembers: Number(editForm.maxMembers),
        jobRole: editForm.jobRole || null,
      })
      setAlert({ type: 'success', message: '방 정보가 수정되었습니다.' })
      setEditOpen(false)
      fetchData()
    } catch {
      setAlert({ type: 'error', message: '수정에 실패했습니다.' })
    } finally {
      setSaving(false)
    }
  }

  async function handleApprove(appId) {
    if (!window.confirm('신청을 승인하시겠습니까?')) return
    try {
      await approveApplication(appId, roomId, password)
      setAlert({ type: 'success', message: '신청을 승인했습니다.' })
      fetchData()
    } catch {
      setAlert({ type: 'error', message: '승인에 실패했습니다.' })
    }
  }

  async function handleReject(appId) {
    if (!window.confirm('신청을 거절하시겠습니까?')) return
    try {
      await rejectApplication(appId, roomId, password)
      setAlert({ type: 'success', message: '신청을 거절했습니다.' })
      fetchData()
    } catch {
      setAlert({ type: 'error', message: '거절에 실패했습니다.' })
    }
  }

  async function handleClose() {
    if (!window.confirm('스터디 모집을 마감하시겠습니까?')) return
    try {
      await closeRoom(roomId, password)
      setAlert({ type: 'success', message: '모집이 마감되었습니다.' })
      fetchData()
    } catch {
      setAlert({ type: 'error', message: '마감에 실패했습니다.' })
    }
  }

  async function handleReopen() {
    if (!window.confirm('스터디 모집을 재개하시겠습니까?')) return
    try {
      await reopenRoom(roomId, password)
      setAlert({ type: 'success', message: '모집이 재개되었습니다.' })
      fetchData()
    } catch {
      setAlert({ type: 'error', message: '재개에 실패했습니다.' })
    }
  }

  if (loading) return <div className="container"><p className="text-muted" style={{ padding: '40px 0' }}>로딩 중...</p></div>

  const applications = data?.applications || []
  const room = data?.room || {}
  const pendingCount = applications.filter(a => a.status === 'PENDING').length
  const approvedCount = applications.filter(a => a.status === 'APPROVED').length

  return (
    <div className="container">
      <div className="page-header">
        <div className="breadcrumb">
          <Link to="/">홈</Link>
          <span>/</span>
          <Link to={`/study/${roomId}`}>{room.title || '스터디'}</Link>
          <span>/</span>
          <span>관리</span>
        </div>
        <h1>신청자 관리</h1>
        <p>{room.title}</p>
      </div>

      {alert && (
        <div className="alerts-container" style={{ marginTop: 16 }}>
          <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />
        </div>
      )}

      <div className="section-sm">
        <div className="manage-grid">
          <div className="mstat">
            <span className="mstat-num">{applications.length}</span>
            <div className="mstat-label">전체 신청</div>
          </div>
          <div className="mstat">
            <span className="mstat-num">{pendingCount}</span>
            <div className="mstat-label">대기중</div>
          </div>
          <div className="mstat">
            <span className="mstat-num">{approvedCount}</span>
            <div className="mstat-label">승인됨</div>
          </div>
          <div className="mstat">
            <span className="mstat-num">{room.maxMembers || '-'}</span>
            <div className="mstat-label">최대 인원</div>
          </div>

          <div className="manage-back">
            <Link to={`/study/${roomId}`} className="btn btn-ghost">← 방으로 돌아가기</Link>
          </div>
          <div className="manage-right-actions">
            <button className="btn btn-outline" onClick={() => openEdit(room)}>방 정보 수정</button>
            <button
              className={`btn ${room.status === 'OPEN' ? 'btn-danger' : 'btn-accent'}`}
              onClick={room.status === 'OPEN' ? handleClose : handleReopen}
            >
              {room.status === 'OPEN' ? '모집 마감하기' : '모집 재개하기'}
            </button>
          </div>
        </div>

        {/* 방 정보 수정 폼 */}
        {editOpen && editForm && (
          <div className="edit-room-card">
            <div className="edit-room-header">
              <span className="edit-room-title">방 정보 수정</span>
              <button className="btn-close-edit" onClick={() => setEditOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleSaveEdit}>
              <div className="edit-room-fields">
                <div className="form-group">
                  <label className="form-label req">제목</label>
                  <input
                    className="form-input"
                    value={editForm.title}
                    onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">설명</label>
                  <textarea
                    className="form-textarea"
                    value={editForm.description}
                    onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                    rows={3}
                    style={{ minHeight: 80 }}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label req">최대 인원</label>
                  <input
                    type="number"
                    className="form-input"
                    min={2} max={20}
                    value={editForm.maxMembers}
                    onChange={e => setEditForm(f => ({ ...f, maxMembers: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">카카오 오픈채팅 링크</label>
                  <input
                    className="form-input"
                    value={editForm.kakaoLink}
                    onChange={e => setEditForm(f => ({ ...f, kakaoLink: e.target.value }))}
                    placeholder="https://open.kakao.com/..."
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">직군</label>
                  <select
                    className="form-select"
                    value={editForm.jobRole}
                    onChange={e => setEditForm(f => ({ ...f, jobRole: e.target.value }))}
                  >
                    <option value="">선택 안 함</option>
                    {JOB_ROLES.map(r => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">지원 요건</label>
                  <input
                    className="form-input"
                    value={editForm.requirements}
                    onChange={e => setEditForm(f => ({ ...f, requirements: e.target.value }))}
                    placeholder="예: 주 2회 참여 가능한 분"
                  />
                </div>
              </div>
              <div className="edit-room-actions">
                <button type="submit" className="btn btn-accent" disabled={saving}>
                  {saving ? '저장 중...' : '저장하기'}
                </button>
                <button type="button" className="btn btn-ghost" onClick={() => setEditOpen(false)}>취소</button>
              </div>
            </form>
          </div>
        )}

        {applications.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <h3>아직 신청자가 없습니다</h3>
            <p>스터디 신청자가 생기면 여기서 관리할 수 있습니다.</p>
          </div>
        ) : (
          <div className="applications-list">
            {applications.map(app => (
              <div
                key={app.id}
                className={`app-card${app.status === 'APPROVED' ? ' approved' : app.status === 'REJECTED' ? ' rejected' : ''}`}
              >
                <div className="app-header">
                  <div>
                    <div className="app-name">{app.applicantName}</div>
                    <div className="app-tags">
                      <span className="tag tag-role">{JOB_ROLE_LABELS[app.jobRole] || app.jobRole}</span>
                      {app.algoGrade && (
                        <span className="tag tag-algo">{ALGO_GRADE_LABELS[app.algoGrade] || app.algoGrade}</span>
                      )}
                      {app.interviewCount != null && (
                        <span className="tag tag-exp">경험 {app.interviewCount}회</span>
                      )}
                    </div>
                    <span className="app-date">{formatDate(app.createdAt)}</span>
                  </div>
                  <span className={`app-status-badge ${app.status}`}>
                    {app.status === 'PENDING' ? '대기' : app.status === 'APPROVED' ? '승인' : '거절'}
                  </span>
                </div>

                {app.introduction && (
                  <div className="app-intro">{app.introduction}</div>
                )}

                {app.contactInfo && (
                  <div className="app-contact">
                    <span className="contact-label">연락처:</span>
                    {app.contactInfo}
                  </div>
                )}

                {app.status === 'PENDING' && (
                  <div className="app-actions">
                    <button className="btn btn-approve" onClick={() => handleApprove(app.id)}>승인</button>
                    <button className="btn btn-reject" onClick={() => handleReject(app.id)}>거절</button>
                  </div>
                )}

                {app.status === 'APPROVED' && (
                  <div className="app-approved-info">
                    <span className="approved-msg">✓ 승인됨</span>
                    {room.kakaoLink ? (
                      <span className="kakao-hint">
                        <a href={room.kakaoLink} target="_blank" rel="noopener noreferrer">오픈채팅 링크</a>를 공유했습니다
                      </span>
                    ) : (
                      <span className="kakao-hint warn">오픈채팅 링크가 없습니다</span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
