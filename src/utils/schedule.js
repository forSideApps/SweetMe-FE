import { WEEK_DAYS } from '../constants/community'

export function buildScheduleTitle(schedule) {
  return `${schedule.company} ${schedule.hireType} ${schedule.stage}`
}

export function buildScheduleContent(schedule) {
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

export function parseScheduleContent(content) {
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
    hireType: get(/📋 채용 유형: (.+)/),
    stage: get(/🎯 전형 단계: (.+)/),
    memo: get(/📝 메모: (.+)/),
    date,
    time,
  }
}
