import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { createPost } from '../api/community'
import { getMe } from '../api/auth'
import Alert from '../components/Alert'
import LockedField from '../components/LockedField'

const CATEGORIES = [
  { value: 'FREE', label: '자유게시판' },
  { value: 'SUGGESTION', label: '건의 기능 요청' },
  { value: 'COMPANY_SCHEDULE', label: '채용 일정 정보' },
]

const HIRE_TYPES = ['신입공채', '경력공채', '인턴']
const STAGES = ['서류', '코딩테스트', '1차 면접', '2차 면접', '최종 면접', '처우협의', '최종합격', '불합격']

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

  const prefillTitle = searchParams.get('prefillTitle') || ''
  const prefillContent = searchParams.get('prefillContent') || ''
  const prefillCategory = searchParams.get('prefillCategory') || 'FREE'

  const [form, setForm] = useState({
    category: CATEGORIES.find(c => c.value === prefillCategory) ? prefillCategory : 'FREE',
    title: prefillTitle,
    content: prefillContent,
    authorName: '',
  })

  const [schedule, setSchedule] = useState({
    company: '',
    hireType: HIRE_TYPES[0],
    stage: STAGES[0],
    date: '',
    time: '',
    memo: '',
  })

  useEffect(() => {
    getMe().then(data => {
      setUser(data)
      setForm(f => ({ ...f, authorName: data.username }))
    }).catch(() => {})
  }, [])

  const isSchedule = form.category === 'COMPANY_SCHEDULE'

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
        <h1>글쓰기</h1>
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
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
              >
                {CATEGORIES.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
              {errors.category && <span className="form-err">{errors.category}</span>}
            </div>

            {isSchedule ? (
              <div className="schedule-form-grid">
                <div className="form-group">
                  <label className="form-label req">기업명</label>
                  <input
                    className={`form-input${errors.company ? ' is-error' : ''}`}
                    value={schedule.company}
                    onChange={e => setSchedule(s => ({ ...s, company: e.target.value }))}
                    placeholder="예: 삼성전자"
                  />
                  {errors.company && <span className="form-err">{errors.company}</span>}
                </div>

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

                <div className="form-group">
                  <label className="form-label req">결과 공개 날짜</label>
                  <input
                    type="date"
                    className={`form-input${errors.date ? ' is-error' : ''}`}
                    value={schedule.date}
                    onChange={e => setSchedule(s => ({ ...s, date: e.target.value }))}
                  />
                  {errors.date && <span className="form-err">{errors.date}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">결과 공개 시간</label>
                  <input
                    type="time"
                    className="form-input"
                    value={schedule.time}
                    onChange={e => setSchedule(s => ({ ...s, time: e.target.value }))}
                  />
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
                <LockedField value={user.username} />
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
