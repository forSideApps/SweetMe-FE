import { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { getRoomDetail, deleteRoom } from '../api/rooms'
import { getMe } from '../api/auth'
import Alert from '../components/Alert'
import ThemeLogo from '../components/ThemeLogo'
import StatusBadge from '../components/StatusBadge'
import { formatDate } from '../utils/date'

export default function RoomDetail() {
  const { roomId } = useParams()
  const navigate = useNavigate()
  const [isAdmin, setIsAdmin] = useState(false)
  const [user, setUser] = useState(null)
  const [room, setRoom] = useState(null)
  const [loading, setLoading] = useState(true)
  const [alert, setAlert] = useState(null)

  useEffect(() => {
    getRoomDetail(roomId)
      .then(setRoom)
      .catch(() => setAlert({ type: 'error', message: '스터디 정보를 불러오지 못했습니다.' }))
      .finally(() => setLoading(false))
    getMe().then(data => {
      setUser(data)
      if (data.role === 'ADMIN') setIsAdmin(true)
    }).catch(() => {})
  }, [roomId])

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
          {(isAdmin || (user && room.memberUsername && user.username === room.memberUsername)) && (
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

          {room.status === 'OPEN' ? (
            <div className="card">
              <div className="card-title">스터디 참여하기</div>
              {room.kakaoLink ? (
                <>
                  <p className="card-body" style={{ marginBottom: 16 }}>
                    아래 링크를 통해 오픈채팅방에 바로 참여할 수 있습니다.
                  </p>
                  <a
                    href={room.kakaoLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-accent"
                  >
                    카카오톡 오픈채팅 참여하기
                  </a>
                </>
              ) : (
                <p className="text-muted">참여 링크가 아직 등록되지 않았습니다.</p>
              )}
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
                스터디 정보 수정 및 운영을 관리해보세요.
              </p>
              <Link to={`/study/${roomId}/manage/dashboard`} className="btn btn-accent w-full">
                스터디 관리
              </Link>
            </div>
          ) : (
            <div className="card">
              <div className="sidebar-title">방장이신가요?</div>
              <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 12 }}>
                스터디 정보 수정 및 운영을 위해 로그인하세요.
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
