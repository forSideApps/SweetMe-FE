export const JOB_ROLES = [
  { value: 'FRONTEND', label: '프론트엔드' },
  { value: 'BACKEND', label: '백엔드' },
  { value: 'MOBILE', label: '모바일' },
  { value: 'OTHER', label: '기타' },
]

export const JOB_ROLE_FILTER = [
  { value: '', label: '전체 직군' },
  ...JOB_ROLES,
]
