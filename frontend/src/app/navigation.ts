import {
  BookOpen,
  CalendarCheck,
  ClipboardList,
  FileBarChart,
  GraduationCap,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  UserRound,
  Users,
} from 'lucide-react'

export type View =
  | 'Dashboard'
  | 'Users'
  | 'Teachers'
  | 'Students'
  | 'Classes'
  | 'Subjects'
  | 'Assignments'
  | 'Attendance'
  | 'Reports'
  | 'Settings'

export const navItems: { label: View; icon: typeof LayoutDashboard }[] = [
  { label: 'Dashboard', icon: LayoutDashboard },
  { label: 'Users', icon: Users },
  { label: 'Teachers', icon: GraduationCap },
  { label: 'Students', icon: UserRound },
  { label: 'Classes', icon: BookOpen },
  { label: 'Subjects', icon: ClipboardList },
  { label: 'Assignments', icon: ShieldCheck },
  { label: 'Attendance', icon: CalendarCheck },
  { label: 'Reports', icon: FileBarChart },
  { label: 'Settings', icon: Settings },
]
