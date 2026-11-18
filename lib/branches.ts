export const BRANCHES = [
  'Computer Engineering',
  'Information Technology',
  'Electronics & Telecommunication',
  'Electronics & Communication',
  'Electronics & Computer Engineering',
  'Artificial Intelligence & Machine Learning',
  'Mechanical Engineering',
  'Civil Engineering',
  'Electrical Engineering',
  'Artificial Intelligence & Data Science',
] as const

export type Branch = (typeof BRANCHES)[number]
