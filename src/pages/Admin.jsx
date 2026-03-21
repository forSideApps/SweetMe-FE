import { useState, useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { getThemes } from '../api/themes'
import { getReviews, deleteReview, markReviewDone, markReviewPending, addReviewComment } from '../api/review'
import { getPosts, createNotice, deletePost as deleteCommunityPost } from '../api/community'
import client from '../api/client'
import ThemeLogo from '../components/ThemeLogo'

const TABS = [
  { key: 'visitors', path: '/admin/visitors', label: '방문자 통계' },
  { key: 'company', path: '/admin/company', label: '회사 관리' },
  { key: 'review', path: '/admin/review', label: '포폴 · 이력서 검토' },
  { key: 'notice', path: '/admin/notice', label: '공지사항 관리' },
]

export default function Admin() {
  const location = useLocation()
  const navigate = useNavigate()
  const activeTab = TABS.find(t => location.pathname === t.path)?.key ?? 'visitors'
  const [msg, setMsg] = useState(null)
  const [adminKey, setAdminKey] = useState(() => sessionStorage.getItem('adminKey') || '')
  const [keyInput, setKeyInput] = useState('')
  const [keyError, setKeyError] = useState('')

  function handleLogin(e) {
    e.preventDefault()
    if (!keyInput) { setKeyError('비밀번호를 입력해주세요.'); return }
    client.get('/admin/visitors', { headers: { 'X-Admin-Key': keyInput } })
      .then(() => {
        sessionStorage.setItem('adminKey', keyInput)
        setAdminKey(keyInput)
        setKeyError('')
        navigate('/admin/visitors')
      })
      .catch(() => setKeyError('비밀번호가 올바르지 않습니다.'))
  }

  if (!adminKey) {
    return (
      <div className="auth-wrap">
        <div className="auth-card">
          <div className="auth-icon">🔐</div>
          <div className="auth-title">어드민 인증</div>
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="form-group">
              <input
                type="password"
                className={`form-input${keyError ? ' is-error' : ''}`}
                value={keyInput}
                onChange={e => setKeyInput(e.target.value)}
                placeholder="어드민 비밀번호"
                autoFocus
              />
              {keyError && <span className="form-err">{keyError}</span>}
            </div>
            <button type="submit" className="btn btn-accent w-full">확인</button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="container-sm" style={{ padding: '40px 24px' }}>
{msg && (
        <div className={`alert ${msg.type === 'success' ? 'alert-success' : 'alert-error'}`} style={{ marginBottom: 20 }}>
          {msg.text}
          <button className="alert-close" onClick={() => setMsg(null)}>✕</button>
        </div>
      )}

{activeTab === 'visitors' && <VisitorTab adminKey={adminKey} onUnauthorized={() => { sessionStorage.removeItem('adminKey'); setAdminKey('') }} />}
      {activeTab === 'company'  && <CompanyTab setMsg={setMsg} adminKey={adminKey} />}
      {activeTab === 'review'   && <ReviewTab setMsg={setMsg} adminKey={adminKey} />}
      {activeTab === 'notice'   && <NoticeTab setMsg={setMsg} adminKey={adminKey} />}
    </div>
  )
}

/* ─── 방문자 통계 탭 ─── */
function VisitorTab({ adminKey, onUnauthorized }) {
  const [stats, setStats] = useState({ today: null, total: null })
  const [error, setError] = useState(null)

  function load() {
    setError(null)
    client.get('/admin/visitors', { headers: { 'X-Admin-Key': adminKey } })
      .then(r => setStats(r.data))
      .catch(err => {
        if (err?.response?.status === 401) { onUnauthorized(); return }
        setError('통계를 불러오지 못했습니다.')
      })
  }

  useEffect(() => { load() }, [adminKey])

  return (
    <>
      <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
        방문자 통계
        <button className="btn btn-ghost btn-sm" onClick={load} style={{ fontSize: 12 }}>새로고침</button>
      </div>
      {error && <p className="text-muted" style={{ marginBottom: 12 }}>{error}</p>}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ background: 'var(--bg)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius)', padding: '28px 24px', textAlign: 'center', flex: 1 }}>
          <div style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 12 }}>오늘 방문자</div>
          <div style={{ fontSize: 40, fontWeight: 800, color: 'var(--accent)' }}>{stats.today ?? '—'}</div>
        </div>
        <div style={{ background: 'var(--bg)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius)', padding: '28px 24px', textAlign: 'center', flex: 1 }}>
          <div style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 12 }}>누적 방문자</div>
          <div style={{ fontSize: 40, fontWeight: 800, color: 'var(--accent)' }}>{stats.total ?? '—'}</div>
        </div>
      </div>
    </>
  )
}

/* ─── 회사 관리 탭 ─── */
function CompanyTab({ setMsg, adminKey }) {
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ name: '', slug: '', accentColor: '#6366f1' })
  const [formErr, setFormErr] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [uploadingId, setUploadingId] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [savingId, setSavingId] = useState(null)
  const [savingOrder, setSavingOrder] = useState(false)
  const [editModal, setEditModal] = useState(null) // company object being edited in popup
  const fileInputs = useRef({})
  const createFileRef = useRef(null)
  const dragItem = useRef(null)
  const dragOver = useRef(null)

  useEffect(() => { load() }, [])

  function load() {
    setLoading(true)
    getThemes().then(setCompanies).finally(() => setLoading(false))
  }

  function validate() {
    const errs = {}
    if (!form.name.trim()) errs.name = '회사명을 입력하세요'
    if (!form.slug.trim()) errs.slug = 'slug를 입력하세요'
    else if (!/^[a-z0-9-]+$/.test(form.slug)) errs.slug = '영소문자, 숫자, 하이픈만 사용 가능'
    return errs
  }

  async function handleCreate(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setFormErr(errs); return }
    setSubmitting(true)
    try {
      const res = await client.post('/admin/companies', {
        name: form.name.trim(),
        slug: form.slug.trim(),
        accentColor: form.accentColor,
      }, { headers: { 'X-Admin-Key': adminKey } })
      // 파일 선택돼 있으면 바로 로고 업로드
      const file = createFileRef.current?.files?.[0]
      if (file && res.data?.id) {
        const fd = new FormData()
        fd.append('file', file)
        await client.post(`/admin/companies/${res.data.id}/logo`, fd, {
          headers: { 'Content-Type': 'multipart/form-data', 'X-Admin-Key': adminKey }
        })
      }
      setForm({ name: '', slug: '', accentColor: '#6366f1' })
      if (createFileRef.current) createFileRef.current.value = ''
      setFormErr({})
      setMsg({ type: 'success', text: '회사가 등록되었습니다.' })
      load()
    } catch (err) {
      const m = err.response?.data?.message || err.response?.data || '등록 실패'
      setMsg({ type: 'error', text: typeof m === 'string' ? m : JSON.stringify(m) })
    } finally {
      setSubmitting(false)
    }
  }

  function startEdit(c) {
    setEditingId(c.id)
    setEditForm({ name: c.name, slug: c.slug, accentColor: c.accentColor || '#6366f1' })
    setEditModal(c)
  }

  function cancelEdit() {
    setEditingId(null)
    setEditForm({})
    setEditModal(null)
  }

  async function handleUpdate(company) {
    if (!editForm.name?.trim()) { setMsg({ type: 'error', text: '회사명을 입력하세요.' }); return }
    setSavingId(company.id)
    try {
      await client.patch(`/admin/companies/${company.id}`, {
        name: editForm.name.trim(),
        slug: editForm.slug.trim(),
        accentColor: editForm.accentColor,
      }, { headers: { 'X-Admin-Key': adminKey } })
      setMsg({ type: 'success', text: '수정되었습니다.' })
      setEditModal(null)
      setEditingId(null)
      load()
    } catch (err) {
      const m = err.response?.data?.message || err.response?.data || '수정 실패'
      setMsg({ type: 'error', text: typeof m === 'string' ? m : JSON.stringify(m) })
    } finally {
      setSavingId(null)
    }
  }

  function handleDragStart(index) { dragItem.current = index }
  function handleDragEnter(index) { dragOver.current = index }
  function handleDragEnd() {
    const from = dragItem.current
    const to = dragOver.current
    if (from === null || to === null || from === to) return
    const next = [...companies]
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    setCompanies(next)
    dragItem.current = null
    dragOver.current = null
    // 서버에 순서 저장
    setSavingOrder(true)
    client.put('/admin/companies/order', next.map(c => c.id), { headers: { 'X-Admin-Key': adminKey } })
      .then(() => setMsg({ type: 'success', text: '순서가 저장되었습니다.' }))
      .catch(() => setMsg({ type: 'error', text: '순서 저장 실패' }))
      .finally(() => setSavingOrder(false))
  }

  async function handleLogoUpload(company) {
    const file = fileInputs.current[company.id]?.files?.[0]
    if (!file) return
    setUploadingId(company.id)
    const formData = new FormData()
    formData.append('file', file)
    try {
      await client.post(`/admin/companies/${company.id}/logo`, formData, {
        headers: { 'Content-Type': 'multipart/form-data', 'X-Admin-Key': adminKey }
      })
      setMsg({ type: 'success', text: `${company.name} 로고가 저장되었습니다. (새로고침 필요)` })
      if (fileInputs.current[company.id]) fileInputs.current[company.id].value = ''
    } catch {
      setMsg({ type: 'error', text: '로고 업로드 실패' })
    } finally {
      setUploadingId(null)
    }
  }

  return (
    <>
      <div className="form-card" style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 20 }}>회사 등록</div>
        <form onSubmit={handleCreate}>
          <div className="form-row" style={{ marginBottom: 14 }}>
            <div className="form-group">
              <label className="form-label req">회사명</label>
              <input
                className={`form-input${formErr.name ? ' is-error' : ''}`}
                placeholder="예: 카카오"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              />
              {formErr.name && <span className="form-err">{formErr.name}</span>}
            </div>
            <div className="form-group">
              <label className="form-label req">Slug</label>
              <input
                className={`form-input${formErr.slug ? ' is-error' : ''}`}
                placeholder="예: kakao"
                value={form.slug}
                onChange={e => setForm(f => ({ ...f, slug: e.target.value.toLowerCase() }))}
              />
              {formErr.slug && <span className="form-err">{formErr.slug}</span>}
              <span className="form-hint">로고 파일명으로 사용됩니다 ({form.slug || 'slug'}.png)</span>
            </div>
          </div>
          <div className="form-row" style={{ marginBottom: 20 }}>
            <div className="form-group">
              <label className="form-label">포인트 색상</label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  type="color"
                  value={form.accentColor}
                  onChange={e => setForm(f => ({ ...f, accentColor: e.target.value }))}
                  style={{ width: 44, height: 40, border: '1.5px solid var(--border)', borderRadius: 6, cursor: 'pointer', padding: 2, background: 'var(--bg)' }}
                />
                <input
                  className="form-input"
                  value={form.accentColor}
                  onChange={e => setForm(f => ({ ...f, accentColor: e.target.value }))}
                  placeholder="#6366f1"
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">로고 이미지</label>
              <input type="file" accept="image/*" ref={createFileRef} style={{ fontSize: 13, color: 'var(--text-2)' }} />
            </div>
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn-accent" disabled={submitting}>
              {submitting ? '등록 중...' : '+ 회사 등록'}
            </button>
          </div>
        </form>
      </div>

      <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
        등록된 회사 ({companies.length}개)
        {savingOrder && <span style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 400 }}>순서 저장 중...</span>}
      </div>
      {/* 수정 팝업 모달 */}
      {editModal && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={cancelEdit}
        >
          <div
            style={{ background: 'var(--bg)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius)', padding: '28px 24px', width: '100%', maxWidth: 480, margin: '0 16px' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 20 }}>회사 수정 — {editModal.name}</div>
            <div className="form-group" style={{ marginBottom: 14 }}>
              <label className="form-label req">회사명</label>
              <input className="form-input" value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="form-group" style={{ marginBottom: 14 }}>
              <label className="form-label req">Slug</label>
              <input className="form-input" value={editForm.slug} onChange={e => setEditForm(f => ({ ...f, slug: e.target.value.toLowerCase() }))} />
            </div>
            <div className="form-group" style={{ marginBottom: 20 }}>
              <label className="form-label">포인트 색상</label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input type="color" value={editForm.accentColor} onChange={e => setEditForm(f => ({ ...f, accentColor: e.target.value }))} style={{ width: 44, height: 40, border: '1.5px solid var(--border)', borderRadius: 6, cursor: 'pointer', padding: 2, background: 'var(--bg)' }} />
                <input className="form-input" value={editForm.accentColor} onChange={e => setEditForm(f => ({ ...f, accentColor: e.target.value }))} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-accent" style={{ flex: 1 }} disabled={savingId === editModal.id} onClick={() => handleUpdate(editModal)}>
                {savingId === editModal.id ? '저장 중...' : '저장'}
              </button>
              <button className="btn btn-ghost" style={{ flex: 1 }} onClick={cancelEdit}>취소</button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-muted">로딩 중...</p>
      ) : companies.length === 0 ? (
        <p className="text-muted">등록된 회사가 없습니다.</p>
      ) : (
        <div className="room-grid">
          {companies.map((c, index) => (
            <div
              key={c.id}
              className="room-card"
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragEnter={() => handleDragEnter(index)}
              onDragEnd={handleDragEnd}
              onDragOver={e => e.preventDefault()}
              onClick={() => startEdit(c)}
              style={{ cursor: 'pointer', userSelect: 'none', textAlign: 'left' }}
            >
              <div style={{ marginBottom: 8 }}>
                <ThemeLogo logoUrl={c.logoUrl} slug={c.slug} size={32} />
              </div>
              <div className="room-title">{c.name}</div>

              {/* 로고 업로드 버튼만 하단에 */}
              <div style={{ marginTop: 12 }} onClick={e => e.stopPropagation()} onMouseDown={e => e.stopPropagation()}>
                <label className="btn btn-outline btn-sm" style={{ width: '100%', textAlign: 'center', cursor: 'pointer', marginBottom: 0, display: 'block' }}>
                  {uploadingId === c.id ? '업로드 중...' : '로고 변경'}
                  <input type="file" accept="image/*" ref={el => fileInputs.current[c.id] = el} style={{ display: 'none' }} onChange={() => handleLogoUpload(c)} />
                </label>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}

/* ─── 포폴·이력서 검토 탭 ─── */
function ReviewTab({ setMsg, adminKey }) {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [commentingId, setCommentingId] = useState(null)
  const [commentText, setCommentText] = useState('')
  const [commentSubmitting, setCommentSubmitting] = useState(false)

  useEffect(() => { load() }, [])

  function load() {
    setLoading(true)
    getReviews({ page: 0 })
      .then(data => setReviews(data.content || data))
      .catch(() => setReviews([]))
      .finally(() => setLoading(false))
  }

  async function handleAdminComment(reviewId) {
    if (!commentText.trim()) return
    setCommentSubmitting(true)
    try {
      await addReviewComment(reviewId, { authorName: '방장', content: commentText, adminKey })
      setCommentText('')
      setCommentingId(null)
      setMsg({ type: 'success', text: '방장 댓글이 작성되었습니다.' })
    } catch {
      setMsg({ type: 'error', text: '댓글 작성에 실패했습니다.' })
    } finally {
      setCommentSubmitting(false)
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('정말 삭제하시겠습니까?')) return
    try {
      await deleteReview(id)
      setReviews(prev => prev.filter(r => r.id !== id))
      setMsg({ type: 'success', text: '삭제되었습니다.' })
    } catch {
      setMsg({ type: 'error', text: '삭제에 실패했습니다.' })
    }
  }

  async function handleToggleStatus(r) {
    try {
      if (r.status === 'PENDING') {
        await markReviewDone(r.id)
        setReviews(prev => prev.map(x => x.id === r.id ? { ...x, status: 'DONE', statusDisplayName: '완료' } : x))
      } else {
        await markReviewPending(r.id)
        setReviews(prev => prev.map(x => x.id === r.id ? { ...x, status: 'PENDING', statusDisplayName: '검토전' } : x))
      }
    } catch {
      setMsg({ type: 'error', text: '상태 변경에 실패했습니다.' })
    }
  }

  const filtered = statusFilter ? reviews.filter(r => r.status === statusFilter) : reviews

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ fontSize: 15, fontWeight: 700 }}>
          검토 요청 ({filtered.length}건)
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {[{ value: '', label: '전체' }, { value: 'PENDING', label: '검토전' }, { value: 'DONE', label: '완료' }].map(s => (
            <button
              key={s.value}
              className={`comm-tab${statusFilter === s.value ? ' active' : ''}`}
              style={{ fontSize: 13 }}
              onClick={() => setStatusFilter(s.value)}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="text-muted">로딩 중...</p>
      ) : filtered.length === 0 ? (
        <p className="text-muted">게시글이 없습니다.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map(r => (
            <div key={r.id} style={{
              background: 'var(--bg)', border: '1.5px solid var(--border)',
              borderRadius: 'var(--radius)', padding: '14px 18px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <Link to={`/reviews/${r.id}`} style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1, textDecoration: 'none', color: 'inherit' }}>
                  <span className={`post-cat-badge ${r.type}`}>{r.typeDisplayName}</span>
                  <span className={`post-cat-badge ${r.status}`}>{r.statusDisplayName}</span>
                  <span style={{ fontSize: 13, color: 'var(--text-3)', whiteSpace: 'nowrap' }}>
                    [{r.careerLevelDisplayName}·{r.jobCategoryDisplayName}]
                  </span>
                  <span style={{ fontWeight: 600, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {r.title}
                  </span>
                </Link>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{r.authorName}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{r.createdAt?.slice(0, 10)}</span>
                  <button
                    className="btn btn-outline btn-sm"
                    style={{ fontSize: 12 }}
                    onClick={() => handleToggleStatus(r)}
                  >
                    {r.status === 'PENDING' ? '완료 처리' : '검토전으로'}
                  </button>
                  <button
                    className="btn btn-outline btn-sm"
                    style={{ fontSize: 12 }}
                    onClick={() => { setCommentingId(commentingId === r.id ? null : r.id); setCommentText('') }}
                  >👑 댓글</button>
                  <button
                    className="btn btn-sm"
                    style={{ fontSize: 12, padding: '3px 10px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: 6, cursor: 'pointer' }}
                    onClick={() => handleDelete(r.id)}
                  >삭제</button>
                </div>
              </div>
              {commentingId === r.id && (
                <div style={{ marginTop: 10, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <textarea
                    className="form-textarea"
                    value={commentText}
                    onChange={e => setCommentText(e.target.value)}
                    placeholder="방장으로 댓글을 남겨보세요"
                    rows={2}
                    style={{ flex: 1, minHeight: 60, fontSize: 13 }}
                  />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <button className="btn btn-accent btn-sm" disabled={commentSubmitting} onClick={() => handleAdminComment(r.id)}>
                      {commentSubmitting ? '...' : '작성'}
                    </button>
                    <button className="btn btn-ghost btn-sm" onClick={() => setCommentingId(null)}>취소</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  )
}

/* ─── 공지사항 관리 탭 ─── */
function NoticeTab({ setMsg, adminKey }) {
  const [notices, setNotices] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ title: '', content: '' })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => { load() }, [])

  function load() {
    setLoading(true)
    getPosts('NOTICE', '', 0)
      .then(data => setNotices(data.content || data))
      .catch(() => setNotices([]))
      .finally(() => setLoading(false))
  }

  async function handleCreate(e) {
    e.preventDefault()
    if (!form.title.trim() || !form.content.trim()) {
      setMsg({ type: 'error', text: '제목과 내용을 입력해주세요.' })
      return
    }
    setSubmitting(true)
    try {
      await createNotice({ title: form.title.trim(), content: form.content.trim(), authorName: '방장' }, adminKey)
      setForm({ title: '', content: '' })
      setMsg({ type: 'success', text: '공지사항이 등록되었습니다.' })
      load()
    } catch {
      setMsg({ type: 'error', text: '등록 실패' })
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('공지사항을 삭제하시겠습니까?')) return
    try {
      await deleteCommunityPost(id, adminKey)
      setNotices(prev => prev.filter(n => n.id !== id))
      setMsg({ type: 'success', text: '삭제되었습니다.' })
    } catch {
      setMsg({ type: 'error', text: '삭제 실패' })
    }
  }

  return (
    <>
      <div className="form-card" style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 20 }}>공지사항 등록</div>
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="form-group">
            <label className="form-label req">제목</label>
            <input
              className="form-input"
              placeholder="공지사항 제목"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            />
          </div>
          <div className="form-group">
            <label className="form-label req">내용</label>
            <textarea
              className="form-textarea"
              placeholder="공지 내용을 입력해주세요"
              value={form.content}
              onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
              rows={5}
            />
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn-accent" disabled={submitting}>
              {submitting ? '등록 중...' : '+ 공지 등록'}
            </button>
          </div>
        </form>
      </div>

      <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>
        등록된 공지사항 ({notices.length}건)
      </div>
      {loading ? (
        <p className="text-muted">로딩 중...</p>
      ) : notices.length === 0 ? (
        <p className="text-muted">등록된 공지사항이 없습니다.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {notices.map(n => (
            <div key={n.id} style={{
              background: 'var(--bg)', border: '1.5px solid var(--border)',
              borderRadius: 'var(--radius)', padding: '14px 18px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.title}</div>
                <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>{n.createdAt?.slice(0, 10)}</div>
              </div>
              <button
                className="btn btn-sm"
                style={{ fontSize: 12, padding: '3px 10px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: 6, cursor: 'pointer', flexShrink: 0 }}
                onClick={() => handleDelete(n.id)}
              >삭제</button>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
