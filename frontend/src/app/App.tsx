import { useEffect, useState } from 'react'
import { create } from 'zustand'
import { useLocation, useNavigate } from 'react-router-dom'
import { navItems, type View } from './navigation'
import { routePaths, pathToView } from './routes'
import { useAuthStore } from '@/stores/auth-store'
import {
  Activity, ArrowUpRight, Bell, BookOpen, CalendarCheck, ChevronDown, ClipboardList,
  FileBarChart, GraduationCap, LayoutDashboard, Menu, MoreVertical, Plus, Search, ChevronLeft,
  Settings, ShieldCheck, Sparkles, Users, X, CheckCircle2, Clock3, UserRound, LogOut,
} from 'lucide-react'

// ── Feature screens (real API) ──────────────────────────────────────────────
import DashboardScreen   from '@/features/Dashboard'
import UsersScreen       from '@/features/Users'
import TeachersScreen    from '@/features/Teachers'
import StudentsScreen    from '@/features/Students'
import ClassesScreen     from '@/features/Classes'
import SubjectsScreen    from '@/features/Subjects'
import AssignmentsScreen from '@/features/Assignments'
import AttendanceScreen  from '@/features/Attendance'
import ReportsScreen     from '@/features/Reports'

type AppState = {
  view: View
  sidebarOpen: boolean
  sidebarCollapsed: boolean
  modal: string | null
  setView: (view: View) => void
  toggleSidebar: () => void
  toggleSidebarCollapsed: () => void
  openModal: (modal: string) => void
  closeModal: () => void
}

const useAppStore = create<AppState>((set) => ({
  view: 'Dashboard', sidebarOpen: false, sidebarCollapsed: false, modal: null,
  setView: (view) => set({ view, sidebarOpen: false }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  toggleSidebarCollapsed: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  openModal: (modal) => set({ modal }),
  closeModal: () => set({ modal: null }),
}))

const students = [
  ['Rahul Kumar', '101', '10-A', 'Active'], ['Anjali Singh', '102', '10-A', 'Active'],
  ['Vikram Patel', '103', '10-A', 'Active'], ['Sneha Gupta', '104', '10-B', 'Active'], ['Arjun Malhotra', '105', '10-B', 'Inactive'],
]
const users = [['admin', 'admin@school.com', 'Administrator', 'Active'], ['priya', 'priya@school.com', 'Class Advisor', 'Active'], ['teacher1', 'teacher1@school.com', 'Subject Teacher', 'Active'], ['amit', 'amit@school.com', 'Subject Teacher', 'Inactive'], ['neha', 'neha@school.com', 'Class Advisor', 'Active']]

function Login() {
  const { login, isLoading, error, clearError } = useAuthStore()
  const navigate = useNavigate()
  const [loginValue, setLoginValue] = useState('')
  const [password, setPassword] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    clearError()
    try {
      await login({ login: loginValue, password })
      navigate(routePaths.Dashboard, { replace: true })
    } catch {
      // error is already set in the store
    }
  }

  return <div className="login-page">
    <section className="login-visual"><div className="orb orb-one"/><div className="orb orb-two"/><div className="login-brand"><span className="brand-mark"><ShieldCheck size={20}/></span><span>DAS</span></div><div className="login-copy"><p className="eyebrow">SMART EDUCATION PLATFORM</p><h1>Daily Attendance<br/><em>System</em></h1><p>Simple. Smart. Reliable.</p></div><div className="login-perks"><span><CalendarCheck size={16}/> Manage attendance</span><span><Activity size={16}/> Track performance</span><span><FileBarChart size={16}/> Generate reports</span></div></section>
    <section className="login-form"><div className="form-inner">
      <div className="mobile-logo"><span className="brand-mark"><ShieldCheck size={18}/></span>DAS</div>
      <p className="eyebrow">WELCOME BACK</p>
      <h2>Sign in to your account</h2>
      <p className="muted">Enter your credentials to access the portal.</p>
      {error && <div className="form-error" role="alert">{error}</div>}
      <form onSubmit={handleSubmit}>
        <label>Username or Email
          <input
            value={loginValue}
            onChange={e => setLoginValue(e.target.value)}
            autoComplete="username"
            placeholder="Enter username or email"
            required
          />
        </label>
        <label>Password
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoComplete="current-password"
            placeholder="Enter your password"
            required
          />
        </label>
        <button className="primary-button" type="submit" disabled={isLoading}>
          {isLoading ? 'Signing in…' : 'Sign In'} <ArrowUpRight size={16}/>
        </button>
      </form>
    </div></section>
  </div>
}

function Sidebar() {
  const { view, setView, sidebarOpen, sidebarCollapsed, toggleSidebarCollapsed } = useAppStore()
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  // Filter nav items by role
  const visibleNav = navItems.filter(({ label }) => {
    if (user?.role === 'Administrator') return true
    if (user?.role === 'Class Advisor') {
      return !['Users', 'Teachers', 'Settings'].includes(label)
    }
    if (user?.role === 'Subject Teacher') {
      return ['Dashboard', 'Attendance', 'Reports'].includes(label)
    }
    return false
  })

  return <aside className={`sidebar ${sidebarOpen ? 'open' : ''} ${sidebarCollapsed ? 'collapsed' : ''}`}><div className="sidebar-top"><div className="brand"><span className="brand-mark"><ShieldCheck size={17}/></span><div><strong>DAS</strong><small>{user?.role ?? 'Loading…'}</small></div></div><button className="sidebar-collapse" onClick={toggleSidebarCollapsed} aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'} title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}><ChevronLeft size={17}/></button><button className="close-mobile" onClick={() => useAppStore.getState().toggleSidebar()} aria-label="Close navigation"><X size={18}/></button></div><nav>{visibleNav.map(({ label, icon: Icon }) => <button key={label} className={view === label ? 'active' : ''} onClick={() => { setView(label); navigate(routePaths[label]) }}><Icon size={16}/><span>{label}</span>{label === 'Attendance' && <span className="nav-dot"/>}</button>)}</nav><div className="sidebar-bottom"><div className="help-card"><Sparkles size={18}/><strong>Need help?</strong><span>Visit the admin guide</span></div><button className="settings-link"><Settings size={16}/> Settings</button><button className="settings-link logout-link" onClick={() => { logout(); navigate('/') }}><LogOut size={16}/> Sign out</button></div></aside>
}

function Header() {
  const { toggleSidebar } = useAppStore()
  const { user } = useAuthStore()
  return <header className="topbar"><button className="menu-button" onClick={toggleSidebar}><Menu size={20}/></button><div className="search"><Search size={15}/><input placeholder="Search anything..."/></div><div className="top-actions"><button className="icon-button"><Bell size={18}/><span className="notification-dot"/></button><div className="profile"><div className="avatar">{user?.username?.[0]?.toUpperCase() ?? 'U'}</div><div><strong>{user?.username ?? '…'}</strong><small>{user?.role ?? '…'}</small></div><ChevronDown size={15}/></div></div></header>
}

function StatCard({ icon: Icon, label, value, change, tone }: { icon: typeof Users; label: string; value: string; change: string; tone: string }) {
  return <div className="stat-card"><div className={`stat-icon ${tone}`}><Icon size={19}/></div><div className="stat-copy"><span>{label}</span><strong>{value}</strong><small className={change === 'No change' ? 'neutral' : ''}>{change === 'No change' ? change : `↗ ${change}`}</small></div></div>
}

function Dashboard() {
  return <><PageHeading title="Dashboard" subtitle="Good morning, Admin! Here's what's happening today." action="View Reports"/><div className="stats-grid"><StatCard icon={Users} label="Total Users" value="12" change="2 this month" tone="blue"/><StatCard icon={GraduationCap} label="Teachers" value="8" change="1 this month" tone="green"/><StatCard icon={UserRound} label="Students" value="248" change="12 this month" tone="purple"/><StatCard icon={BookOpen} label="Classes" value="12" change="No change" tone="orange"/><StatCard icon={ClipboardList} label="Subjects" value="18" change="3 this month" tone="red"/><StatCard icon={ShieldCheck} label="Assignments" value="36" change="5 this month" tone="amber"/><StatCard icon={Activity} label="Sessions" value="124" change="16 this month" tone="violet"/><StatCard icon={CalendarCheck} label="Attendance Rate" value="86%" change="4% from last month" tone="teal"/></div><div className="dashboard-grid"><section className="panel chart-panel"><div className="panel-heading"><div><h3>Attendance Trend</h3><span>Last 7 days</span></div><div className="legend"><span><i className="present"/>Present</span><span><i className="absent"/>Absent</span></div></div><div className="bar-chart">{[52, 68, 59, 78, 48, 44, 63].map((height, index) => <div className="bar-day" key={index}><div className="bars"><i className="bar absent" style={{height: `${height * .38}px`}}/><i className="bar present" style={{height: `${height}px`}}/></div><small>{['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][index]}</small></div>)}</div></section><section className="panel sessions"><div className="panel-heading"><div><h3>Recent Attendance Sessions</h3><span>Latest activity from your institution</span></div><button className="text-button">View all <ArrowUpRight size={14}/></button></div>{[['TYCS-A · Data Structures','John Doe','52/60','86.7%'],['TYCS-A · Mathematics','Priya Sharma','48/60','80.0%'],['TYIT-A · DBMS','Amit Kumar','50/55','90.9%']].map((row, i) => <div className="session-row" key={row[0]}><div className={`session-icon s${i}`}><CalendarCheck size={16}/></div><div><strong>{row[0]}</strong><span>{row[1]} · {i === 0 ? 'Today, 09:00 AM' : i === 1 ? 'Today, 11:00 AM' : 'Yesterday'}</span></div><div className="session-score"><strong>{row[2]}</strong><span>{row[3]}</span></div></div>)}</section></div></>
}

function PageHeading({ title, subtitle, action }: { title: string; subtitle: string; action?: string }) { const navigate = useNavigate(); return <div className="page-heading"><div><h1>{title}</h1><p>{subtitle}</p></div>{action && <button className="outline-button" onClick={() => action.includes('Report') && navigate(routePaths.Reports)}>{action} <ArrowUpRight size={15}/></button>}</div> }
function Toolbar({ placeholder, button }: { placeholder: string; button: string }) { const openModal = useAppStore((state) => state.openModal); return <div className="toolbar"><div className="table-search"><Search size={15}/><input placeholder={placeholder}/></div><select defaultValue="all"><option value="all">All Roles</option><option>Administrator</option><option>Teacher</option></select><select defaultValue="status"><option value="status">All Status</option><option>Active</option><option>Inactive</option></select><button className="primary-button compact" onClick={() => openModal(button)}><Plus size={15}/>{button}</button></div> }
function DataTable({ type }: { type: 'Users' | 'Students' | 'Teachers' }) {
  const rows = type === 'Users' ? users : students
  return <div className="panel table-panel"><Toolbar placeholder={`Search ${type.toLowerCase()}...`} button={`Add ${type.slice(0, -1)}`} /><div className="table-wrap"><table><thead><tr><th>#</th><th>Name</th><th>{type === 'Users' ? 'Email' : type === 'Teachers' ? 'Employee ID' : 'Roll No.'}</th><th>{type === 'Users' ? 'Role' : 'Class'}</th><th>Status</th><th>Actions</th></tr></thead><tbody>{rows.map((row, i) => <tr key={row[0]}><td>{i + 1}</td><td><span className="name-cell"><span className="mini-avatar">{row[0][0]}</span>{row[0]}</span></td><td>{row[1]}</td><td>{row[2]}</td><td><span className={`status ${row[3].toLowerCase()}`}>{row[3]}</span></td><td><button className="row-action"><Settings size={14}/></button><button className="row-action danger"><X size={14}/></button></td></tr>)}</tbody></table></div><div className="table-footer"><span>Showing 1–{rows.length} of {type === 'Users' ? '12' : '248'} {type.toLowerCase()}</span><div className="pagination"><button>‹</button><button className="selected">1</button><button>2</button><button>3</button><button>›</button></div></div></div>
}
function CardsView({ type }: { type: 'Classes' | 'Subjects' | 'Assignments' }) { const openModal = useAppStore((state) => state.openModal); const cards = type === 'Classes' ? [['TYCS-A','60 students','6 subjects','blue'],['TYCS-B','58 students','6 subjects','green'],['TYIT-A','55 students','5 subjects','purple'],['SYCS-A','62 students','6 subjects','orange'],['SYIT-A','50 students','5 subjects','blue'],['SYCS-B','65 students','6 subjects','green']] : [['Data Structures','CS301','Priya Sharma','blue'],['Database Management','CS302','Amit Kumar','purple'],['Artificial Intelligence','CS303','Neha Singh','red'],['Mathematics','MATH101','Rajesh Verma','orange'],['English','ENG101','John Doe','blue'],['Operating Systems','CS401','Priya Sharma','green']]; return <><PageHeading title={type} subtitle={type === 'Classes' ? 'Manage classes and their subjects.' : `Manage ${type.toLowerCase()} across the institution.`}/><div className="cards-toolbar"><div className="table-search"><Search size={15}/><input placeholder={`Search ${type.toLowerCase()}...`}/></div><button className="primary-button compact" onClick={() => openModal(`Add ${type.slice(0,-1)}`)}><Plus size={15}/> Add {type.slice(0,-1)}</button></div><div className="cards-grid">{cards.map((card) => <div className="class-card" key={card[0]}><div className={`class-icon ${card[3]}`}><BookOpen size={18}/></div><button className="more"><MoreVertical size={16}/></button><h3>{card[0]}</h3><p>{card[1]}</p><p>{card[2]}</p><button className="view-link">View Details <ArrowUpRight size={13}/></button></div>)}</div></> }
function SettingsView() { return <><PageHeading title="Settings" subtitle="Manage your institution profile and administrator preferences."/><div className="settings-grid"><section className="panel settings-card"><div className="panel-heading"><div><h3>Institution profile</h3><span>These details appear across your reports.</span></div><span className="status active">Saved</span></div><div className="settings-fields"><label>Institution name<input defaultValue="DAS Academy"/></label><label>Academic year<select defaultValue="2025-26"><option>2025-26</option><option>2026-27</option></select></label><label>Administrator email<input defaultValue="admin@school.com" type="email"/></label><label>Timezone<select defaultValue="Asia/Kolkata"><option>Asia/Kolkata</option><option>UTC</option></select></label></div><button className="primary-button">Save changes <CheckCircle2 size={15}/></button></section><section className="panel settings-card"><div className="panel-heading"><div><h3>Notifications</h3><span>Choose what appears in your admin workspace.</span></div></div><label className="setting-toggle"><span><strong>Attendance reminders</strong><small>Notify advisors about incomplete sessions.</small></span><input type="checkbox" defaultChecked/></label><label className="setting-toggle"><span><strong>Weekly reports</strong><small>Receive a summary every Monday morning.</small></span><input type="checkbox" defaultChecked/></label><label className="setting-toggle"><span><strong>New enrollments</strong><small>Show a notification when students are added.</small></span><input type="checkbox"/></label></section></div></> }
function Reports() { return <><PageHeading title="Attendance Reports" subtitle="Generate and review attendance performance across your institution." action="Export Report"/><div className="report-filters panel"><label>Class<select><option>All classes</option><option>TYCS-A</option><option>TYCS-B</option></select></label><label>Subject<select><option>All subjects</option><option>Data Structures</option><option>Mathematics</option></select></label><label>Date range<select><option>Last 7 days</option><option>This month</option><option>Academic year</option></select></label><button className="primary-button compact"><FileBarChart size={15}/> Generate Report</button></div><div className="stats-grid report-stats"><StatCard icon={BookOpen} label="Total Classes" value="42" change="3 this month" tone="blue"/><StatCard icon={CheckCircle2} label="Present" value="36" change="86% attendance" tone="green"/><StatCard icon={X} label="Absent" value="6" change="14% of records" tone="red"/></div><section className="panel table-panel report-table"><div className="panel-heading"><div><h3>Student-wise attendance</h3><span>Current reporting period</span></div><button className="text-button">Export CSV <ArrowUpRight size={14}/></button></div><div className="table-wrap"><table><thead><tr><th>#</th><th>Student Name</th><th>Class</th><th>Present</th><th>Absent</th><th>Percentage</th></tr></thead><tbody>{[['Rahul Kumar','TYCS-A','38','4','90%'],['Anjali Singh','TYCS-A','36','6','86%'],['Vikram Patel','TYCS-A','34','8','81%'],['Sneha Gupta','TYCS-B','38','4','90%'],['Arjun Malhotra','TYCS-B','35','7','83%']].map((row, i) => <tr key={row[0]}><td>{i + 1}</td><td>{row[0]}</td><td>{row[1]}</td><td>{row[2]}</td><td>{row[3]}</td><td><span className="status active">{row[4]}</span></td></tr>)}</tbody></table></div></section></> }

function Attendance() { const [started, setStarted] = useState(false); const [submitted, setSubmitted] = useState(false); const [present, setPresent] = useState<number[]>([1,2,3,4]); const roster = ['Rahul Kumar','Anjali Singh','Vikram Patel','Sneha Gupta','Arjun Malhotra']; const toggle = (index: number) => setPresent((current) => current.includes(index) ? current.filter((item) => item !== index) : [...current, index]); if (submitted) return <><PageHeading title="Attendance Saved" subtitle="The attendance session was submitted successfully." action="Attendance Reports"/><section className="panel attendance-success"><div className="success-icon"><CheckCircle2 size={34}/></div><h2>Attendance submitted</h2><p>TYCS-A · Data Structures · October 04, 2026</p><div className="success-metrics"><div><strong>{present.length}</strong><span>Present</span></div><div><strong>{60 - present.length}</strong><span>Absent</span></div><div><strong>{Math.round((present.length / 60) * 100)}%</strong><span>Attendance</span></div></div><div className="success-actions"><button className="outline-button" onClick={() => setSubmitted(false)}>View Records</button><button className="primary-button" onClick={() => { setSubmitted(false); setPresent([1,2,3,4]) }}>Mark Another Session</button></div></section></>; return <><PageHeading title="Mark Attendance" subtitle="Create a new attendance session and record student presence." action="Attendance Reports"/><div className="attendance-layout"><section className="panel attendance-form"><div className="form-title"><div className="step-number">01</div><div><h3>Session details</h3><p>Select a class, subject and date to begin.</p></div></div><label>Class<select><option>TYCS-A</option><option>TYCS-B</option></select></label><label>Subject<select><option>Data Structures</option><option>Mathematics</option></select></label><label>Date<input type="date" defaultValue="2026-10-04"/></label><button className="primary-button full" onClick={() => setStarted(true)}>Start Attendance <ArrowUpRight size={16}/></button></section><section className="panel attendance-preview"><div className="panel-heading"><div><h3>Today&apos;s overview</h3><span>TYCS-A · Data Structures</span></div><span className={`status ${started ? 'active' : 'pending'}`}>{started ? 'In progress' : 'Ready'}</span></div><div className="attendance-summary"><div><Users size={18}/><strong>60</strong><span>Total students</span></div><div><CheckCircle2 size={18}/><strong>{started ? present.length : 52}</strong><span>Present</span></div><div><X size={18}/><strong>{started ? 60 - present.length : 8}</strong><span>Absent</span></div></div>{started ? <div className="roster"><div className="roster-heading"><strong>Student roster</strong><button className="text-button" onClick={() => setPresent([1,2,3,4,5])}>Mark all present</button></div>{roster.map((name, index) => <div className="roster-row" key={name}><span className="mini-avatar">{name[0]}</span><div><strong>{name}</strong><small>STU00{index + 1} · TYCS-A</small></div><button className={`attendance-toggle ${present.includes(index + 1) ? 'is-present' : 'is-absent'}`} onClick={() => toggle(index + 1)}>{present.includes(index + 1) ? <><CheckCircle2 size={14}/> Present</> : <><X size={14}/> Absent</>}</button></div>)}<button className="primary-button full" onClick={() => { setStarted(false); setSubmitted(true) }}>Submit Attendance <CheckCircle2 size={16}/></button></div> : <div className="attendance-note"><Clock3 size={18}/><p><strong>Tip:</strong> You can mark all students present and adjust individual records before submitting.</p></div>}</section></div>{started && <div className="toast"><CheckCircle2 size={17}/> Attendance session started <button onClick={() => setStarted(false)}><X size={14}/></button></div>}</> }
function CrudModal({ title }: { title: string }) { const closeModal = useAppStore((state) => state.closeModal); const [saved, setSaved] = useState(false); return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && closeModal()}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div className="modal-header"><div><p className="eyebrow">DIRECTORY MANAGEMENT</p><h2 id="modal-title">{title}</h2></div><button className="icon-button" onClick={closeModal} aria-label="Close dialog"><X size={18}/></button></div>{saved ? <div className="modal-success"><CheckCircle2 size={34}/><h3>{title} created</h3><p>The new record has been added to the directory.</p><button className="primary-button" onClick={closeModal}>Done</button></div> : <><div className="modal-fields"><label>Full name<input placeholder={`e.g. ${title.replace('Add ', '')} name`}/></label><label>Email address<input type="email" placeholder="name@school.com"/></label>{title === 'Add User' && <label>Password<input type="password" placeholder="Minimum 8 characters" minLength={8}/></label>}<label>Role<select><option>Administrator</option><option>Class Advisor</option><option>Subject Teacher</option></select></label><label>Status<select><option>Active</option><option>Inactive</option></select></label></div><div className="modal-footer"><button className="outline-button" onClick={closeModal}>Cancel</button><button className="primary-button" onClick={() => setSaved(true)}>Create {title.replace('Add ', '')}</button></div></>}</section></div> }

function App() {
  const { view, modal, sidebarOpen, sidebarCollapsed, setView } = useAppStore()
  const { user, isHydrated, hydrate } = useAuthStore()
  const location = useLocation()
  const navigate = useNavigate()

  // Restore session from localStorage token on first load
  useEffect(() => { hydrate() }, [hydrate])

  // Sync URL → active view
  useEffect(() => {
    const routeView = pathToView[location.pathname]
    if (routeView) setView(routeView)
    else if (user) navigate(routePaths.Dashboard, { replace: true })
  }, [location.pathname, user, navigate, setView])

  // Prevent flash of login screen while hydrating
  if (!isHydrated) return null

  // Not logged in — show login
  if (!user) return <Login />

  const content = (
    view === 'Dashboard'   ? <DashboardScreen/>   :
    view === 'Users'       ? <UsersScreen/>        :
    view === 'Teachers'    ? <TeachersScreen/>     :
    view === 'Students'    ? <StudentsScreen/>     :
    view === 'Classes'     ? <ClassesScreen/>      :
    view === 'Subjects'    ? <SubjectsScreen/>     :
    view === 'Assignments' ? <AssignmentsScreen/>  :
    view === 'Attendance'  ? <AttendanceScreen/>   :
    view === 'Reports'     ? <ReportsScreen/>      :
    view === 'Settings'    ? <SettingsView/>       :
    <DashboardScreen/>
  )
  return <div className={`app-shell ${sidebarCollapsed ? 'sidebar-is-collapsed' : ''}`}><Sidebar/>{sidebarOpen && <button className="sidebar-overlay" aria-label="Close navigation" onClick={() => useAppStore.getState().toggleSidebar()} />}<div className="main-area"><Header/><main className="content">{content}</main></div>{modal && <CrudModal title={modal}/>}</div>
}
export default App
