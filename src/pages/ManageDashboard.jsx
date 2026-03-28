import { useState, useEffect, useCallback } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { getManageApplications, closeRoom, updateRoom, reopenRoom } from '../api/rooms'
import Alert from '../components/Alert'
import { JOB_ROLES } from '../constants/jobRoles'

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
      kakaoLink: room.kakaoLink || '',
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

  const room = data?.room || {}

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
        <h1>스터디 관리</h1>
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
            <span className="mstat-num">{room.status === 'OPEN' ? '모집중' : '마감'}</span>
            <div className="mstat-label">모집 상태</div>
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
      </div>
    </div>
  )
}
