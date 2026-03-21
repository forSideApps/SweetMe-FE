export const JOB_ROLES = [
  { value: 'BACKEND', label: '백엔드' },
  { value: 'FRONTEND', label: '프론트엔드' },
  { value: 'FULLSTACK', label: '풀스택' },
  { value: 'MOBILE', label: '모바일' },
  { value: 'AI_ML', label: 'AI·ML' },
  { value: 'DATA', label: '데이터' },
  { value: 'DEVOPS', label: 'DevOps' },
  { value: 'SECURITY', label: '보안' },
  { value: 'EMBEDDED', label: '임베디드' },
  { value: 'OTHER', label: '기타' },
]

export const JOB_ROLE_FILTER = [
  { value: '', label: '전체 직군' },
  ...JOB_ROLES,
]
