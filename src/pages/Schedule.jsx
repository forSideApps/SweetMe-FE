import { useState, useEffect, useMemo } from 'react'
import { getMe } from '../api/auth'
import { getSchedules, createSchedule, deleteSchedule } from '../api/schedule'
import Alert from '../components/Alert'
import LockedField from '../components/LockedField'

const HIRE_TYPES = ['신입공채', '경력공채', '인턴']
const STAGES = ['서류', '코딩테스트', '1차 면접', '2차 면접', '최종 면접', '처우협의', '최종합격', '불합격']
const STAGE_FILTERS = ['전체', '서류', '코딩테스트', '면접', '합격']

function getDday(announceDate) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(announceDate)
  target.setHours(0, 0, 0, 0)
  const diff = Math.round((target - today) / (1000 * 60 * 60 * 24))
  if (diff === 0) return { label: 'D-Day', cls: 'dday-today' }
  if (diff > 0) return { label: `D-${diff}`, cls: diff <= 7 ? 'dday-soon' : 'dday-future' }
  return { label: `D+${Math.abs(diff)}`, cls: 'dday-past' }
}

function getStageBadgeCls(stage) {
  if (stage.includes('서류')) return 'stage-doc'
  if (stage.includes('코딩')) return 'stage-code'
  if (stage.includes('면접')) return 'stage-interview'
  if (stage.includes('합격')) return 'stage-pass'
  return 'stage-default'
}

function parseDateParts(dateStr) {
  const d = new Date(dateStr)
  const wds = ['일', '월', '화', '수', '목', '금', '토']
  return {
    month: d.getMonth() + 1,
    day: d.getDate(),
    weekday: wds[d.getDay()],
  }
}

const EMPTY_FORM = {
  company: '',
  hireType: HIRE_TYPES[0],
  stage: STAGES[0],
  announceDate: '',
  announceTime: '',
  notes: '',
  submitterName: '',
}

export default function Schedule() {
  const [schedules, setSchedules] = useState([])
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [alert, setAlert] = useState(null)
  const [stageFilter, setStageFilter] = useState('전체')
  const [companyFilter, setCompanyFilter] = useState('')
  const [showPast, setShowPast] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState({})
  const [form, setForm] = useState(EMPTY_FORM)

  useEffect(() => {
    getMe().then(u => {
      setUser(u)
      setForm(f => ({ ...f, submitterName: u.username }))
    }).catch(() => {})
  }, [])

  function fetchSchedules() {
    setLoading(true)
    getSchedules()
      .then(data => setSchedules(data))
      .catch(() => setSchedules([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchSchedules() }, [])

  const today = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  }, [])

  const upcomingCount = useMemo(() =>
    schedules.filter(s => new Date(s.announceDate) >= today).length,
    [schedules, today]
  )

  const thisWeekCount = useMemo(() =>
    schedules.filter(s => {
      const d = new Date(s.announceDate)
      const diff = (d - today) / 86400000
      return diff >= 0 && diff <= 7
    }).length,
    [schedules, today]
  )

  const filtered = useMemo(() => {
    let list = schedules
    if (!showPast) {
      list = list.filter(s => new Date(s.announceDate) >= today)
    }
    if (stageFilter !== '전체') {
      list = list.filter(s => s.stage.includes(stageFilter))
    }
    if (companyFilter.trim()) {
      list = list.filter(s => s.company.toLowerCase().includes(companyFilter.toLowerCase()))
    }
    return list
  }, [schedules, stageFilter, companyFilter, showPast, today])

  function validate() {
    const errs = {}
    if (!form.company.trim()) errs.company = '기업명을 입력해주세요.'
    if (!form.announceDate) errs.announceDate = '날짜를 입력해주세요.'
    if (!user && !form.submitterName.trim()) errs.submitterName = '작성자명을 입력해주세요.'
    return errs
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setErrors({})
    setSubmitting(true)
    try {
      await createSchedule({
        company: form.company.trim(),
        hireType: form.hireType,
        stage: form.stage,
        announceDate: form.announceDate,
        announceTime: form.announceTime || null,
        notes: form.notes || null,
        submitterName: user ? user.username : form.submitterName,
      })
      setShowForm(false)
      setForm(f => ({ ...EMPTY_FORM, submitterName: f.submitterName }))
      fetchSchedules()
      setAlert({ type: 'success', message: '일정이 등록되었습니다!' })
    } catch (err) {
      setAlert({ type: 'error', message: err?.response?.data?.message || '등록에 실패했습니다.' })
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('이 일정을 삭제하시겠습니까?')) return
    try {
      await deleteSchedule(id)
      fetchSchedules()
    } catch {
      setAlert({ type: 'error', message: '삭제에 실패했습니다.' })
    }
  }

  return (
    <div className="container">
      <div className="sched-page-header">
        <div>
          <h1 className="sched-page-title">채용 일정 정보</h1>
          <p className="sched-page-desc">서류·코테·면접 결과 발표 일정을 함께 공유해요</p>
        </div>
        <button className="btn btn-accent" onClick={() => setShowForm(s => !s)}>
          {showForm ? '닫기' : '+ 일정 등록'}
        </button>
      </div>

      <div className="sched-stats">
        <div className="sched-stat-card">
          <span className="sched-stat-num">{schedules.length}</span>
          <span className="sched-stat-label">전체 일정</span>
        </div>
        <div className="sched-stat-card accent">
          <span className="sched-stat-num">{upcomingCount}</span>
          <span className="sched-stat-label">예정 일정</span>
        </div>
        <div className="sched-stat-card hot">
          <span className="sched-stat-num">{thisWeekCount}</span>
          <span className="sched-stat-label">이번 주 발표</span>
        </div>
      </div>

      {alert && (
        <div style={{ marginBottom: 16 }}>
          <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />
        </div>
      )}

      {showForm && (
        <div className="sched-form-wrap">
          <h3 className="sched-form-title">새 일정 등록</h3>
          <form onSubmit={handleSubmit}>
            <div className="schedule-form-grid">
              <div className="form-group">
                <label className="form-label req">기업명</label>
                <input
                  className={`form-input${errors.company ? ' is-error' : ''}`}
                  value={form.company}
                  onChange={e => setForm(f => ({ ...f, company: e.target.value }))}
                  placeholder="예: 삼성전자"
                />
                {errors.company && <span className="form-err">{errors.company}</span>}
              </div>

              <div className="form-group">
                <label className="form-label req">채용 유형</label>
                <select className="form-select" value={form.hireType} onChange={e => setForm(f => ({ ...f, hireType: e.target.value }))}>
                  {HIRE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label req">전형 단계</label>
                <select className="form-select" value={form.stage} onChange={e => setForm(f => ({ ...f, stage: e.target.value }))}>
                  {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label req">결과 발표 날짜</label>
                <input
                  type="date"
                  className={`form-input${errors.announceDate ? ' is-error' : ''}`}
                  value={form.announceDate}
                  onChange={e => setForm(f => ({ ...f, announceDate: e.target.value }))}
                />
                {errors.announceDate && <span className="form-err">{errors.announceDate}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">결과 발표 시간</label>
                <input
                  type="time"
                  className="form-input"
                  value={form.announceTime}
                  onChange={e => setForm(f => ({ ...f, announceTime: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label className="form-label req">작성자명</label>
                {user ? (
                  <LockedField value={user.username} />
                ) : (
                  <>
                    <input
                      className={`form-input${errors.submitterName ? ' is-error' : ''}`}
                      value={form.submitterName}
                      onChange={e => setForm(f => ({ ...f, submitterName: e.target.value }))}
                      placeholder="닉네임"
                    />
                    {errors.submitterName && <span className="form-err">{errors.submitterName}</span>}
                  </>
                )}
              </div>

              <div className="form-group full-width">
                <label className="form-label">메모 (선택)</label>
                <textarea
                  className="form-textarea"
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="추가 메모를 입력해주세요"
                  rows={2}
                />
              </div>
            </div>

            <div className="form-actions" style={{ marginTop: 16 }}>
              <button type="submit" className="btn btn-accent" disabled={submitting}>
                {submitting ? '등록 중...' : '등록하기'}
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>취소</button>
            </div>
          </form>
        </div>
      )}

      <div className="sched-filter-bar">
        <div className="sched-stage-filters">
          {STAGE_FILTERS.map(f => (
            <button
              key={f}
              className={`comm-tab${stageFilter === f ? ' active' : ''}`}
              onClick={() => setStageFilter(f)}
            >{f}</button>
          ))}
        </div>
        <div className="sched-filter-right">
          <div className="review-search-wrap" style={{ marginBottom: 0, flex: '0 0 auto' }}>
            <svg className="review-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              className="review-search-input"
              placeholder="기업 검색"
              value={companyFilter}
              onChange={e => setCompanyFilter(e.target.value)}
              style={{ minWidth: 130 }}
            />
          </div>
          <label className="sched-past-toggle">
            <input type="checkbox" checked={showPast} onChange={e => setShowPast(e.target.checked)} />
            <span>지난 일정 포함</span>
          </label>
        </div>
      </div>

      <div className="sched-list">
        {loading ? (
          <p className="text-muted">로딩 중...</p>
        ) : filtered.length === 0 ? (
          <div className="sched-empty">
            <span className="sched-empty-icon">📅</span>
            <p>등록된 일정이 없습니다.</p>
            <p style={{ fontSize: 13, marginTop: 4 }}>서류·코테·면접 발표 일정을 공유해보세요!</p>
          </div>
        ) : (
          filtered.map(sched => {
            const dday = getDday(sched.announceDate)
            const dp = parseDateParts(sched.announceDate)
            const isPast = dday.cls === 'dday-past'
            const canDelete = user && (user.role === 'ADMIN' || user.username === sched.submittedBy)
            return (
              <div key={sched.id} className={`sched-item${isPast ? ' past' : ''}`}>
                <div className="sched-item-date">
                  <span className="sched-item-month">{dp.month}월</span>
                  <span className="sched-item-day">{dp.day}</span>
                  <span className="sched-item-wd">{dp.weekday}</span>
                  <span className={`sched-dday ${dday.cls}`}>{dday.label}</span>
                </div>
                <div className="sched-item-body">
                  <div className="sched-item-top">
                    <span className="sched-item-company">{sched.company}</span>
                    <span className={`schedule-stage-badge ${getStageBadgeCls(sched.stage)}`}>{sched.stage}</span>
                    <span className="sched-item-hire">{sched.hireType}</span>
                  </div>
                  {sched.announceTime && (
                    <div className="sched-item-time">🕐 {sched.announceTime} 발표</div>
                  )}
                  {sched.notes && (
                    <div className="sched-item-notes">{sched.notes}</div>
                  )}
                  <div className="sched-item-footer">작성: {sched.submitterName}</div>
                </div>
                {canDelete && (
                  <button
                    className="sched-item-del"
                    onClick={() => handleDelete(sched.id)}
                    aria-label="삭제"
                  >✕</button>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
