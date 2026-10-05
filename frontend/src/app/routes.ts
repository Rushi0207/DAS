export const routePaths = {
  Dashboard: '/dashboard',
  Users: '/users',
  Teachers: '/teachers',
  Students: '/students',
  Classes: '/classes',
  Subjects: '/subjects',
  Assignments: '/assignments',
  Attendance: '/attendance',
  Reports: '/reports',
  Settings: '/settings',
} as const

export type AppRoute = keyof typeof routePaths

export const pathToView = Object.fromEntries(
  Object.entries(routePaths).map(([view, path]) => [path, view]),
) as Record<string, AppRoute>
