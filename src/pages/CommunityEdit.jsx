import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getPost, updatePost } from '../api/community'
import { getThemes } from '../api/themes'
import Alert from '../components/Alert'
import ThemeLogo from '../components/ThemeLogo'

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

function parseContent(content) {
  const get = (re) => { const m = content?.match(re); return m ? m[1].trim() : '' }
  const dateRaw = get(/📅 결과 공개: (.+)/)
  let date = '', time = ''
  if (dateRaw) {
    const dm = dateRaw.match(/(\d+)년\s*(\d+)월\s*(\d+)일/)
    const tm = dateRaw.match(/(\d{1,2}:\d{2})$/)
    if (dm) date = `${dm[1]}-${String(dm[2]).padStart(2,'0')}-${String(dm[3]).padStart(2,'0')}`
    if (tm) time = tm[1]
  }
  return {
    company: get(/🏢 기업명: (.+)/),
    hireType: get(/📋 채용 유형: (.+)/) || HIRE_TYPES[0],
    stage: get(/🎯 전형 단계: (.+)/) || STAGES[0],
    memo: get(/📝 메모: (.+)/),
    date, time,
  }
}

export default function CommunityEdit() {
  const { postId } = useParams()
  const navigate = useNavigate()
  const [alert, setAlert] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [themes, setThemes] = useState([])
  const [selectedTheme, setSelectedTheme] = useState(null)
  const [schedule, setSchedule] = useState(null)
  const monthRef = useRef(null)
  const dayRef = useRef(null)

  useEffect(() => {
    getPost(postId).then(post => {
      const parsed = parseContent(post.content)
      setSchedule(parsed)
    }).catch(() => navigate(-1))
    getThemes().then(ts => setThemes(ts)).catch(() => {})
  }, [postId])

  useEffect(() => {
    if (schedule && themes.length > 0) {
      const found = themes.find(t => t.name === schedule.company)
      if (found) setSelectedTheme(found)
      else setSelectedTheme({ custom: true })
    }
  }, [schedule, themes])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!schedule?.date) { setAlert({ type: 'error', message: '날짜를 입력해주세요.' }); return }
    setSubmitting(true)
    try {
      await updatePost(postId, {
        title: buildScheduleTitle(schedule),
        content: buildScheduleContent(schedule),
      })
      navigate(`/community/${postId}`)
    } catch (err) {
      const msg = err?.response?.data?.message || '수정에 실패했습니다.'
      setAlert({ type: 'error', message: msg })
    } finally {
      setSubmitting(false)
    }
  }

  if (!schedule) return <div className="container-sm"><p className="text-muted" style={{ padding: '40px 0' }}>로딩 중...</p></div>

  const hour = schedule.time ? parseInt(schedule.time.split(':')[0], 10) : null

  function shiftHour(delta) {
    const cur = hour ?? new Date().getHours()
    const next = Math.min(23, Math.max(0, cur + delta))
    setSchedule(s => ({ ...s, time: `${String(next).padStart(2, '0')}:00` }))
  }

  return (
    <div className="container-sm">
      <div className="page-header">
        <div className="breadcrumb">
          <Link to="/">홈</Link><span>/</span>
          <Link to="/community?category=COMPANY_SCHEDULE">채용 발표일</Link><span>/</span>
          <span>수정</span>
        </div>
        <div className="page-company">
          {selectedTheme && !selectedTheme.custom
            ? <ThemeLogo logoUrl={selectedTheme.logoUrl} slug={selectedTheme.slug} size={48} />
            : <span style={{ fontSize: 40 }}>✏️</span>
          }
        </div>
        <h1>{schedule.company} 채용 발표일 수정</h1>
      </div>

      {alert && (
        <div className="alerts-container" style={{ marginTop: 16 }}>
          <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />
        </div>
      )}

      <div className="section-sm">
        <form className="form-card" onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="schedule-form-grid">
              <div className="form-group">
                <label className="form-label req">채용 유형</label>
                <select className="form-select" value={schedule.hireType}
                  onChange={e => setSchedule(s => ({ ...s, hireType: e.target.value }))}>
                  {HIRE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label req">전형 단계</label>
                <select className="form-select" value={schedule.stage}
                  onChange={e => setSchedule(s => ({ ...s, stage: e.target.value }))}>
                  {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div className="form-group full-width">
                <label className="form-label req">발표 일시</label>
                <div className="sdt-card">
                  <div className="sdt-section">
                    <div className="sdt-seg-row" style={{ justifyContent: 'center' }}>
                      <div className="toss-dt-seg">
                        <input type="text" inputMode="numeric" className="toss-dt-input toss-dt-year"
                          placeholder="2026" maxLength={4}
                          value={schedule.date ? schedule.date.split('-')[0] : ''}
                          onChange={e => {
                            const val = e.target.value.replace(/\D/g,'').slice(0,4)
                            const parts = (schedule.date||'--').split('-'); parts[0]=val
                            setSchedule(s=>({...s,date:parts.join('-')}))
                            if(val.length===4) monthRef.current?.focus()
                          }}/>
                        <span className="toss-dt-unit">년</span>
                      </div>
                      <span className="toss-dt-dot">.</span>
                      <div className="toss-dt-seg">
                        <input ref={monthRef} type="text" inputMode="numeric" className="toss-dt-input toss-dt-md"
                          placeholder="01" maxLength={2}
                          value={schedule.date ? schedule.date.split('-')[1] : ''}
                          onChange={e => {
                            const val = e.target.value.replace(/\D/g,'').slice(0,2)
                            const parts = (schedule.date||'--').split('-'); parts[1]=val
                            setSchedule(s=>({...s,date:parts.join('-')}))
                            if(val.length===2) dayRef.current?.focus()
                          }}/>
                        <span className="toss-dt-unit">월</span>
                      </div>
                      <span className="toss-dt-dot">.</span>
                      <div className="toss-dt-seg">
                        <input ref={dayRef} type="text" inputMode="numeric" className="toss-dt-input toss-dt-md"
                          placeholder="01" maxLength={2}
                          value={schedule.date ? schedule.date.split('-')[2] : ''}
                          onChange={e => {
                            const val = e.target.value.replace(/\D/g,'').slice(0,2)
                            const parts = (schedule.date||'--').split('-'); parts[2]=val
                            setSchedule(s=>({...s,date:parts.join('-')}))
                          }}/>
                        <span className="toss-dt-unit">일</span>
                      </div>
                    </div>
                    <div className="sdt-quick-row" style={{ marginTop:12, justifyContent:'center' }}>
                      <button type="button" className="sdt-quick-btn" onClick={() => {
                        const d = new Date(schedule.date); d.setDate(d.getDate()-1)
                        setSchedule(s=>({...s,date:d.toISOString().slice(0,10)}))
                      }}>−1일</button>
                      <button type="button" className="sdt-quick-btn" onClick={() => {
                        const d = new Date(schedule.date); d.setDate(d.getDate()+1)
                        setSchedule(s=>({...s,date:d.toISOString().slice(0,10)}))
                      }}>+1일</button>
                    </div>
                  </div>
                  <div className="sdt-hdivider" />
                  <div className="sdt-section">
                    <div className="sdt-time-display" style={{ marginBottom:12, textAlign:'center' }}>
                      {hour !== null ? `${String(hour).padStart(2,'0')}:00` : '--:--'}
                    </div>
                    <div className="sdt-quick-row" style={{ justifyContent:'center' }}>
                      <button type="button" className="sdt-quick-btn" onClick={() => shiftHour(-1)}>−1시간</button>
                      <button type="button" className="sdt-quick-btn" onClick={() => shiftHour(1)}>+1시간</button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="form-group full-width">
                <label className="form-label">메모 (선택)</label>
                <textarea className="form-textarea" value={schedule.memo}
                  onChange={e => setSchedule(s => ({ ...s, memo: e.target.value }))}
                  onKeyDown={e => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { e.preventDefault(); handleSubmit(e) } }}
                  placeholder="추가 메모를 입력해주세요" rows={3} />
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-accent btn-lg" disabled={submitting}>
                {submitting ? '수정 중...' : '수정 완료'}
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => navigate(-1)}>취소</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
