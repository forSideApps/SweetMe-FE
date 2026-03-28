import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { createPost } from '../api/community'
import { getMe } from '../api/auth'
import { getThemes } from '../api/themes'
import Alert from '../components/Alert'
import LockedField from '../components/LockedField'
import ThemeLogo from '../components/ThemeLogo'

const CATEGORIES = [
  { value: 'FREE', label: '자유게시판' },
  { value: 'SUGGESTION', label: '건의 기능 요청' },
  { value: 'COMPANY_SCHEDULE', label: '채용 발표일' },
]

const HIRE_TYPES = ['신입공채', '경력공채', '인턴']
const STAGES = ['서류', '코딩테스트', '1차 면접', '최종 면접']
const WEEK_DAYS = ['일', '월', '화', '수', '목', '금', '토']

function buildScheduleTitle(schedule) {
  return `${schedule.company} ${schedule.hireType} ${schedule.stage}`
}

function buildScheduleContent(schedule) {
  let dateStr = ''
  if (schedule.date) {
    const d = new Date(schedule.date + (schedule.time ? `T${schedule.time}` : ''))
    const y = d.getFullYear()
    const mo = d.getMonth() + 1
    const day = d.getDate()
    const wd = WEEK_DAYS[d.getDay()]
    const timeStr = schedule.time ? ` ${schedule.time.slice(0, 5)}` : ''
    dateStr = `${y}년 ${mo}월 ${day}일 (${wd})${timeStr}`
  }
  return [
    `📅 결과 공개: ${dateStr}`,
    `🏢 기업명: ${schedule.company}`,
    `📋 채용 유형: ${schedule.hireType}`,
    `🎯 전형 단계: ${schedule.stage}`,
    schedule.memo ? `📝 메모: ${schedule.memo}` : null,
  ].filter(Boolean).join('\n')
}

export default function CommunityCreate() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [alert, setAlert] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState({})
  const [user, setUser] = useState(null)
  const [themes, setThemes] = useState([])
  const [selectedTheme, setSelectedTheme] = useState(null) // null | theme object | { custom: true }
  const [customCompany, setCustomCompany] = useState('')
  const monthRef = useRef(null)
  const dayRef = useRef(null)

  const prefillTitle = searchParams.get('prefillTitle') || ''
  const prefillContent = searchParams.get('prefillContent') || ''
  const prefillCategory = searchParams.get('prefillCategory') || 'FREE'

  const [form, setForm] = useState({
    category: CATEGORIES.find(c => c.value === prefillCategory) ? prefillCategory : 'FREE',
    title: prefillTitle,
    content: prefillContent,
    authorName: '',
  })

  const _now = new Date()
  const [schedule, setSchedule] = useState({
    company: '',
    hireType: HIRE_TYPES[0],
    stage: STAGES[0],
    date: _now.toISOString().slice(0, 10),
    time: `${String(_now.getHours()).padStart(2, '0')}:00`,
    memo: '',
  })

  useEffect(() => {
    getMe().then(data => {
      setUser(data)
      setForm(f => ({ ...f, authorName: data.username }))
    }).catch(() => {})
    getThemes().then(setThemes).catch(() => {})
  }, [])

  const isSchedule = form.category === 'COMPANY_SCHEDULE'
  const companyChosen = isSchedule && schedule.company.trim()

  function selectTheme(theme) {
    setSelectedTheme(theme)
    setSchedule(s => ({ ...s, company: theme.name }))
    setErrors(e => ({ ...e, company: undefined }))
  }

  function selectCustom() {
    setSelectedTheme({ custom: true })
    setSchedule(s => ({ ...s, company: '' }))
  }

  function resetCompany() {
    setSelectedTheme(null)
    setCustomCompany('')
    setSchedule(s => ({ ...s, company: '' }))
  }

  function validate() {
    const errs = {}
    if (!form.category) errs.category = '카테고리를 선택해주세요.'
    if (isSchedule) {
      if (!schedule.company.trim()) errs.company = '기업명을 입력해주세요.'
      if (!schedule.date) errs.date = '결과 공개 날짜를 입력해주세요.'
    } else {
      if (!form.title.trim()) errs.title = '제목을 입력해주세요.'
      if (!form.content.trim()) errs.content = '내용을 입력해주세요.'
    }
    if (!user && !form.authorName.trim()) errs.authorName = '작성자명을 입력해주세요.'
    return errs
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setErrors({})
    setSubmitting(true)
    try {
      const payload = isSchedule
        ? { ...form, title: buildScheduleTitle(schedule), content: buildScheduleContent(schedule) }
        : form
      const result = await createPost(payload)
      navigate(`/community/${result.id}`)
    } catch (err) {
      const msg = err?.response?.data?.message || '글 작성에 실패했습니다.'
      setAlert({ type: 'error', message: msg })
    } finally {
      setSubmitting(false)
    }
  }

  // ── 기업 선택 화면 (채용 발표일 + 기업 미선택) ──
  if (isSchedule && !companyChosen && !selectedTheme?.custom) {
    return (
      <div className="container-sm">
        <div className="page-header">
          <div className="breadcrumb">
            <Link to="/">홈</Link>
            <span>/</span>
            <Link to="/community">커뮤니티</Link>
            <span>/</span>
            <span>글쓰기</span>
          </div>
          <h1>기업 선택</h1>
          <p>어떤 기업의 채용 발표일을 공유하시겠어요?</p>
        </div>

        <div className="section-sm">
          <div className="room-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            {themes.map(t => (
              <button
                key={t.id}
                className="room-card"
                style={{ textAlign: 'left', border: '1.5px solid var(--border)', cursor: 'pointer', background: 'var(--bg)' }}
                onClick={() => selectTheme(t)}
              >
                <div style={{ marginBottom: 8 }}>
                  <ThemeLogo logoUrl={t.logoUrl} slug={t.slug} size={32} />
                </div>
                <div className="room-title">{t.name}</div>
              </button>
            ))}
            <button
              className="room-card"
              style={{ textAlign: 'left', border: '1.5px dashed var(--border)', cursor: 'pointer', background: 'var(--bg)' }}
              onClick={selectCustom}
            >
              <div style={{ marginBottom: 8, fontSize: 28 }}>✏️</div>
              <div className="room-title">직접 입력</div>
              <div className="room-desc">목록에 없는 기업</div>
            </button>
          </div>
          <div style={{ marginTop: 16 }}>
            <button
              className="btn btn-ghost btn-sm"
              type="button"
              onClick={() => setForm(f => ({ ...f, category: 'FREE' }))}
            >← 카테고리 변경</button>
          </div>
        </div>
      </div>
    )
  }

  // ── 직접 입력 화면 ──
  if (isSchedule && selectedTheme?.custom && !schedule.company.trim()) {
    return (
      <div className="container-sm">
        <div className="page-header">
          <div className="breadcrumb">
            <Link to="/">홈</Link><span>/</span>
            <Link to="/community">커뮤니티</Link><span>/</span>
            <span>글쓰기</span>
          </div>
          <h1>기업명 입력</h1>
        </div>
        <div className="section-sm">
          <div className="form-card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-group">
              <label className="form-label req">기업명</label>
              <input
                className={`form-input${errors.company ? ' is-error' : ''}`}
                value={customCompany}
                onChange={e => setCustomCompany(e.target.value)}
                placeholder="예: 현대자동차"
                autoFocus
              />
              {errors.company && <span className="form-err">{errors.company}</span>}
            </div>
            <div className="form-actions">
              <button
                className="btn btn-accent"
                type="button"
                onClick={() => {
                  if (!customCompany.trim()) { setErrors(e => ({ ...e, company: '기업명을 입력해주세요.' })); return }
                  setSchedule(s => ({ ...s, company: customCompany.trim() }))
                }}
              >다음</button>
              <button className="btn btn-ghost" type="button" onClick={resetCompany}>← 기업 선택으로</button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── 폼 화면 ──
  return (
    <div className="container-sm">
      <div className="page-header">
        <div className="breadcrumb">
          <Link to="/">홈</Link>
          <span>/</span>
          <Link to="/community">커뮤니티</Link>
          <span>/</span>
          <span>글쓰기</span>
        </div>
        {isSchedule && (
          <div className="page-company">
            {selectedTheme && !selectedTheme.custom
              ? <ThemeLogo logoUrl={selectedTheme.logoUrl} slug={selectedTheme.slug} size={48} />
              : <span style={{ fontSize: 40 }}>✏️</span>
            }
          </div>
        )}
        <h1>{isSchedule ? `${schedule.company} 채용 발표일 등록` : '글쓰기'}</h1>
        {isSchedule && (
          <button className="btn btn-ghost btn-sm" type="button" onClick={resetCompany} style={{ marginTop: 8 }}>
            기업 변경
          </button>
        )}
      </div>

      {alert && (
        <div className="alerts-container" style={{ marginTop: 16 }}>
          <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />
        </div>
      )}

      <div className="section-sm">
        <form className="form-card" onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-group">
              <label className="form-label req">카테고리</label>
              <select
                className={`form-select${errors.category ? ' is-error' : ''}`}
                value={form.category}
                onChange={e => {
                  setForm(f => ({ ...f, category: e.target.value }))
                  resetCompany()
                }}
              >
                {CATEGORIES.filter(c => c.value !== 'COMPANY_SCHEDULE' || (user?.role === 'ADMIN')).map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
              {errors.category && <span className="form-err">{errors.category}</span>}
            </div>

            {isSchedule ? (
              <div className="schedule-form-grid">
                <div className="form-group">
                  <label className="form-label req">채용 유형</label>
                  <select
                    className="form-select"
                    value={schedule.hireType}
                    onChange={e => setSchedule(s => ({ ...s, hireType: e.target.value }))}
                  >
                    {HIRE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label req">전형 단계</label>
                  <select
                    className="form-select"
                    value={schedule.stage}
                    onChange={e => setSchedule(s => ({ ...s, stage: e.target.value }))}
                  >
                    {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div className="form-group full-width">
                  <label className="form-label req">발표 일시</label>
                  <div className={`sdt-card${errors.date ? ' is-error' : ''}`}>

                    {/* ── 날짜 영역 ── */}
                    <div className="sdt-section">
                      <div className="sdt-seg-row" style={{ justifyContent: 'center' }}>
                        <div className="toss-dt-seg">
                          <input
                            type="text" inputMode="numeric"
                            className="toss-dt-input toss-dt-year"
                            placeholder="2026" maxLength={4}
                            value={schedule.date ? schedule.date.split('-')[0] : ''}
                            onChange={e => {
                              const val = e.target.value.replace(/\D/g, '').slice(0, 4)
                              const parts = (schedule.date || '--').split('-')
                              parts[0] = val
                              setSchedule(s => ({ ...s, date: parts.join('-') }))
                              if (val.length === 4) monthRef.current?.focus()
                            }}
                          />
                          <span className="toss-dt-unit">년</span>
                        </div>
                        <span className="toss-dt-dot">.</span>
                        <div className="toss-dt-seg">
                          <input
                            ref={monthRef}
                            type="text" inputMode="numeric"
                            className="toss-dt-input toss-dt-md"
                            placeholder="01" maxLength={2}
                            value={schedule.date ? schedule.date.split('-')[1] : ''}
                            onChange={e => {
                              const val = e.target.value.replace(/\D/g, '').slice(0, 2)
                              const parts = (schedule.date || '--').split('-')
                              parts[1] = val
                              setSchedule(s => ({ ...s, date: parts.join('-') }))
                              if (val.length === 2) dayRef.current?.focus()
                            }}
                          />
                          <span className="toss-dt-unit">월</span>
                        </div>
                        <span className="toss-dt-dot">.</span>
                        <div className="toss-dt-seg">
                          <input
                            ref={dayRef}
                            type="text" inputMode="numeric"
                            className="toss-dt-input toss-dt-md"
                            placeholder="01" maxLength={2}
                            value={schedule.date ? schedule.date.split('-')[2] : ''}
                            onChange={e => {
                              const val = e.target.value.replace(/\D/g, '').slice(0, 2)
                              const parts = (schedule.date || '--').split('-')
                              parts[2] = val
                              setSchedule(s => ({ ...s, date: parts.join('-') }))
                            }}
                          />
                          <span className="toss-dt-unit">일</span>
                        </div>
                      </div>
                      <div className="sdt-quick-row" style={{ marginTop: 12, marginBottom: 0, justifyContent: 'center' }}>
                        <button type="button" className="sdt-quick-btn" onClick={() => {
                          const d = new Date(schedule.date)
                          d.setDate(d.getDate() - 1)
                          setSchedule(s => ({ ...s, date: d.toISOString().slice(0, 10) }))
                        }}>−1일</button>
                        <button type="button" className="sdt-quick-btn" onClick={() => {
                          const d = new Date(schedule.date)
                          d.setDate(d.getDate() + 1)
                          setSchedule(s => ({ ...s, date: d.toISOString().slice(0, 10) }))
                        }}>+1일</button>
                      </div>
                    </div>

                    <div className="sdt-hdivider" />

                    {/* ── 시간 영역 ── */}
                    <div className="sdt-section">
                      {(() => {
                        const hour = schedule.time ? parseInt(schedule.time.split(':')[0], 10) : null
                        function shiftHour(delta) {
                          const cur = hour ?? new Date().getHours()
                          const next = Math.min(23, Math.max(0, cur + delta))
                          setSchedule(s => ({ ...s, time: `${String(next).padStart(2, '0')}:00` }))
                        }
                        return (
                          <>
                            <div className="sdt-time-display" style={{ marginBottom: 12, textAlign: 'center' }}>
                              {hour !== null ? `${String(hour).padStart(2, '0')}:00` : '--:--'}
                            </div>
                            <div className="sdt-quick-row" style={{ marginBottom: 0, justifyContent: 'center' }}>
                              <button type="button" className="sdt-quick-btn" onClick={() => shiftHour(-1)}>−1시간</button>
                              <button type="button" className="sdt-quick-btn" onClick={() => shiftHour(1)}>+1시간</button>
                            </div>
                          </>
                        )
                      })()}
                    </div>

                  </div>
                  {errors.date && <span className="form-err">{errors.date}</span>}
                </div>

                <div className="form-group full-width">
                  <label className="form-label">메모 (선택)</label>
                  <textarea
                    className="form-textarea"
                    value={schedule.memo}
                    onChange={e => setSchedule(s => ({ ...s, memo: e.target.value }))}
                    placeholder="추가 메모를 입력해주세요"
                    rows={3}
                  />
                </div>
              </div>
            ) : (
              <>
                <div className="form-group">
                  <label className="form-label req">제목</label>
                  <input
                    className={`form-input${errors.title ? ' is-error' : ''}`}
                    value={form.title}
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="제목을 입력해주세요"
                  />
                  {errors.title && <span className="form-err">{errors.title}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label req">내용</label>
                  <textarea
                    className={`form-textarea${errors.content ? ' is-error' : ''}`}
                    value={form.content}
                    onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                    placeholder="내용을 입력해주세요"
                    rows={8}
                    style={{ minHeight: 200 }}
                  />
                  {errors.content && <span className="form-err">{errors.content}</span>}
                </div>
              </>
            )}

            <div className="form-group">
              <label className="form-label req">작성자명</label>
              {user ? (
                user.role === 'ADMIN'
                  ? <LockedField value="👑 운영자" />
                  : <LockedField value={user.username} />
              ) : (
                <>
                  <input
                    className={`form-input${errors.authorName ? ' is-error' : ''}`}
                    value={form.authorName}
                    onChange={e => setForm(f => ({ ...f, authorName: e.target.value }))}
                    placeholder="닉네임을 입력해주세요"
                  />
                  {errors.authorName && <span className="form-err">{errors.authorName}</span>}
                </>
              )}
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-accent btn-lg" disabled={submitting}>
                {submitting ? '작성 중...' : '글 작성하기'}
              </button>
              <Link to="/community" className="btn btn-ghost">취소</Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
