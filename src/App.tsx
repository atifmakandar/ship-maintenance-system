import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Anchor,
  ArrowUpRight,
  BarChart3,
  Bell,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  Clock3,
  Download,
  FileText,
  Gauge,
  HardHat,
  LayoutDashboard,
  Menu,
  MoreHorizontal,
  PackageCheck,
  Plus,
  Play,
  RotateCcw,
  Search,
  Settings2,
  Ship,
  ShieldCheck,
  SlidersHorizontal,
  Users,
  Wrench,
  X,
} from 'lucide-react';

type JobStatus = 'Scheduled' | 'In progress' | 'Overdue' | 'Completed';
type Priority = 'Critical' | 'High' | 'Routine';
type Section = 'Dashboard' | 'Work orders' | 'Equipment' | 'Crew' | 'Reports';

type MaintenanceJob = {
  id: string;
  title: string;
  equipment: string;
  equipmentTag: string;
  department: string;
  dueDate: string;
  interval: string;
  status: JobStatus;
  priority: Priority;
  assignedTo: string;
  completion: number;
  lastServiced: string;
  notes: string;
};

type Equipment = {
  id: string;
  name: string;
  tag: string;
  department: string;
  health: number;
  runtime: string;
  nextService: string;
  status: 'Operational' | 'Watch' | 'Maintenance';
  accent: string;
};

const dayFromToday = (offset: number) => {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + offset);
  return date.toISOString().slice(0, 10);
};

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
  }).format(new Date(`${value}T12:00:00`));

const relativeDue = (value: string) => {
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const target = new Date(`${value}T12:00:00`);
  const days = Math.round((target.getTime() - today.getTime()) / 86400000);
  if (days < 0) return `${Math.abs(days)}d overdue`;
  if (days === 0) return 'Due today';
  if (days === 1) return 'Due tomorrow';
  return `Due in ${days}d`;
};

const initialJobs: MaintenanceJob[] = [
  {
    id: 'WO-2481',
    title: 'Main engine lube oil analysis',
    equipment: 'Main engine',
    equipmentTag: 'ME-001',
    department: 'Engine',
    dueDate: dayFromToday(-2),
    interval: '500 running hours',
    status: 'Overdue',
    priority: 'Critical',
    assignedTo: 'M. Dsouza',
    completion: 0,
    lastServiced: '18 Sep 2026',
    notes: 'Send sample to the approved laboratory and attach report.',
  },
  {
    id: 'WO-2484',
    title: 'Emergency generator load test',
    equipment: 'Emergency generator',
    equipmentTag: 'EG-003',
    department: 'Engine',
    dueDate: dayFromToday(0),
    interval: 'Monthly',
    status: 'In progress',
    priority: 'High',
    assignedTo: 'A. Khan',
    completion: 55,
    lastServiced: '08 Sep 2026',
    notes: 'Run under 75% load for 30 minutes and log voltage stability.',
  },
  {
    id: 'WO-2487',
    title: 'Lifeboat engine visual inspection',
    equipment: 'Port lifeboat',
    equipmentTag: 'LS-002',
    department: 'Deck',
    dueDate: dayFromToday(2),
    interval: 'Weekly',
    status: 'Scheduled',
    priority: 'High',
    assignedTo: 'R. Menon',
    completion: 0,
    lastServiced: '01 Oct 2026',
    notes: 'Check fuel, cooling water, starting battery and helm movement.',
  },
  {
    id: 'WO-2491',
    title: 'Fire pump pressure verification',
    equipment: 'Fire pump no. 1',
    equipmentTag: 'FP-001',
    department: 'Safety',
    dueDate: dayFromToday(4),
    interval: 'Weekly',
    status: 'Scheduled',
    priority: 'Routine',
    assignedTo: 'S. Patel',
    completion: 0,
    lastServiced: '02 Oct 2026',
    notes: 'Confirm pressure at the most remote hydrant and record the result.',
  },
  {
    id: 'WO-2470',
    title: 'Purifier bowl cleaning',
    equipment: 'Fuel oil purifier',
    equipmentTag: 'PU-004',
    department: 'Engine',
    dueDate: dayFromToday(-5),
    interval: '1,000 running hours',
    status: 'Completed',
    priority: 'Routine',
    assignedTo: 'M. Dsouza',
    completion: 100,
    lastServiced: '03 Oct 2026',
    notes: 'Bowl cleaned and vibration readings within normal range.',
  },
  {
    id: 'WO-2496',
    title: 'Bridge navigation light test',
    equipment: 'Navigation lights',
    equipmentTag: 'EL-011',
    department: 'Deck',
    dueDate: dayFromToday(7),
    interval: 'Monthly',
    status: 'Scheduled',
    priority: 'Routine',
    assignedTo: 'R. Menon',
    completion: 0,
    lastServiced: '09 Sep 2026',
    notes: 'Test all masthead, sidelights, stern and towing lights before dusk.',
  },
];

const equipment: Equipment[] = [
  {
    id: 'ME-001',
    name: 'Main engine',
    tag: 'Wärtsilä 6L46F',
    department: 'Engine department',
    health: 92,
    runtime: '18,420 h',
    nextService: '11 Oct 2026',
    status: 'Operational',
    accent: '#16b8a6',
  },
  {
    id: 'EG-003',
    name: 'Emergency generator',
    tag: 'Caterpillar C9',
    department: 'Engine department',
    health: 76,
    runtime: '4,812 h',
    nextService: '08 Oct 2026',
    status: 'Watch',
    accent: '#e2a64e',
  },
  {
    id: 'PU-004',
    name: 'Fuel oil purifier',
    tag: 'Alfa Laval MIB 503',
    department: 'Engine department',
    health: 88,
    runtime: '9,670 h',
    nextService: '17 Oct 2026',
    status: 'Operational',
    accent: '#5c88bd',
  },
  {
    id: 'LS-002',
    name: 'Port lifeboat',
    tag: 'Norsafe Magnum 650',
    department: 'Deck department',
    health: 98,
    runtime: '—',
    nextService: '10 Oct 2026',
    status: 'Operational',
    accent: '#9676d3',
  },
];

const crew = [
  { initials: 'MD', name: 'M. Dsouza', role: 'Chief Engineer', shift: 'Engine', color: '#16b8a6' },
  { initials: 'AK', name: 'A. Khan', role: '2nd Engineer', shift: 'Engine', color: '#e2a64e' },
  { initials: 'RM', name: 'R. Menon', role: '2nd Officer', shift: 'Deck', color: '#9676d3' },
  { initials: 'SP', name: 'S. Patel', role: 'Bosun', shift: 'Deck', color: '#5c88bd' },
];

const navItems: { label: Section; icon: typeof LayoutDashboard }[] = [
  { label: 'Dashboard', icon: LayoutDashboard },
  { label: 'Work orders', icon: ClipboardCheck },
  { label: 'Equipment', icon: Settings2 },
  { label: 'Crew', icon: Users },
  { label: 'Reports', icon: BarChart3 },
];

function App() {
  const [activeSection, setActiveSection] = useState<Section>('Dashboard');
  const [equipmentItems, setEquipmentItems] = useState<Equipment[]>(equipment);
  const [jobs, setJobs] = useState<MaintenanceJob[]>(() => {
    const saved = localStorage.getItem('decklog-maintenance-jobs');
    return saved ? JSON.parse(saved) : initialJobs;
  });
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'All' | JobStatus>('All');
  const [showNewJob, setShowNewJob] = useState(false);
  const [showNewEquipment, setShowNewEquipment] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('decklog-maintenance-jobs', JSON.stringify(jobs));
  }, [jobs]);

  useEffect(() => {
    if (!toast) return undefined;
    const timeout = window.setTimeout(() => setToast(null), 2800);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const stats = useMemo(() => ({
    open: jobs.filter((job) => job.status !== 'Completed').length,
    overdue: jobs.filter((job) => job.status === 'Overdue').length,
    dueSoon: jobs.filter((job) => job.status === 'Scheduled' || job.status === 'In progress').length,
    completed: jobs.filter((job) => job.status === 'Completed').length,
  }), [jobs]);

  const visibleJobs = useMemo(() => {
    const query = search.trim().toLowerCase();
    return jobs.filter((job) => {
      const matchesFilter = filter === 'All' || job.status === filter;
      const matchesSearch = !query || [job.id, job.title, job.equipment, job.equipmentTag, job.assignedTo]
        .join(' ')
        .toLowerCase()
        .includes(query);
      return matchesFilter && matchesSearch;
    });
  }, [filter, jobs, search]);

  const updateJobStatus = (id: string, status: JobStatus) => {
    const job = jobs.find((item) => item.id === id);
    setJobs((current) => current.map((item) => item.id === id
      ? { ...item, status, completion: status === 'Completed' ? 100 : status === 'In progress' ? Math.max(item.completion, 45) : item.completion }
      : item));
    if (job) setToast(`${job.id} marked ${status.toLowerCase()}.`);
  };

  const exportReport = () => {
    const headers = ['Work order', 'Task', 'Equipment', 'Department', 'Due date', 'Priority', 'Assigned to', 'Status'];
    const rows = jobs.map((job) => [job.id, job.title, job.equipment, job.department, job.dueDate, job.priority, job.assignedTo, job.status]);
    const csv = [headers, ...rows]
      .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `decklog-work-orders-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setToast('Work order report exported.');
  };

  const resetDemoData = () => {
    setJobs(initialJobs);
    setSelectedJobId(null);
    setToast('Demo data restored.');
  };

  const selectedJob = selectedJobId ? jobs.find((job) => job.id === selectedJobId) : undefined;

  const addJob = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const equipmentValue = String(form.get('equipment') || 'Main engine');
    const selectedEquipment = equipmentItems.find((item) => item.name === equipmentValue) || equipmentItems[0];
    const nextNumber = 2500 + jobs.length;
    const newJob: MaintenanceJob = {
      id: `WO-${nextNumber}`,
      title: String(form.get('title') || 'New maintenance task'),
      equipment: selectedEquipment.name,
      equipmentTag: selectedEquipment.id,
      department: String(form.get('department') || 'Engine'),
      dueDate: String(form.get('dueDate') || dayFromToday(7)),
      interval: String(form.get('interval') || 'As required'),
      status: 'Scheduled',
      priority: String(form.get('priority') || 'Routine') as Priority,
      assignedTo: String(form.get('assignedTo') || 'Unassigned'),
      completion: 0,
      lastServiced: '—',
      notes: String(form.get('notes') || 'New task added from the onboard maintenance desk.'),
    };
    setJobs((current) => [newJob, ...current]);
    setShowNewJob(false);
    setToast(`${newJob.id} created and added to the queue.`);
  };

  const addEquipment = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const newEquipment: Equipment = {
      id: `AS-${String(equipmentItems.length + 5).padStart(3, '0')}`,
      name: String(form.get('name') || 'New equipment'),
      tag: String(form.get('tag') || 'Asset record'),
      department: `${String(form.get('department') || 'Engine')} department`,
      health: Number(form.get('health') || 100),
      runtime: String(form.get('runtime') || '—'),
      nextService: String(form.get('nextService') || dayFromToday(30)),
      status: String(form.get('status') || 'Operational') as Equipment['status'],
      accent: '#5c88bd',
    };
    setEquipmentItems((current) => [newEquipment, ...current]);
    setShowNewEquipment(false);
    setToast(`${newEquipment.name} added to the asset register.`);
  };

  const pageTitle = activeSection === 'Dashboard' ? 'Good morning, Chief.' : activeSection;
  const pageDescription = activeSection === 'Dashboard'
    ? 'Here is the maintenance picture for MV Ardent Horizon.'
    : activeSection === 'Work orders'
      ? 'Plan, assign and close maintenance work across the vessel.'
      : activeSection === 'Equipment'
        ? 'Monitor the health and service readiness of critical equipment.'
        : activeSection === 'Crew'
          ? 'See the crew members currently assigned to maintenance tasks.'
          : 'Review maintenance performance and vessel readiness trends.';

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileMenu ? 'sidebar-open' : ''}`}>
        <div className="brand-lockup">
          <div className="brand-mark"><Anchor size={19} strokeWidth={2.5} /></div>
          <div>
            <div className="brand-name">DeckLog<span>PMS</span></div>
            <div className="brand-caption">Vessel maintenance</div>
          </div>
          <button className="mobile-close" onClick={() => setMobileMenu(false)} aria-label="Close navigation"><X size={18} /></button>
        </div>

        <div className="sidebar-label">Workspace</div>
        <nav className="main-nav">
          {navItems.map(({ label, icon: Icon }) => (
            <button
              key={label}
              className={`nav-item ${activeSection === label ? 'active' : ''}`}
              onClick={() => { setActiveSection(label); setMobileMenu(false); }}
            >
              <Icon size={17} strokeWidth={activeSection === label ? 2.4 : 1.8} />
              <span>{label}</span>
              {label === 'Work orders' && <span className="nav-count">{stats.open}</span>}
            </button>
          ))}
        </nav>

        <div className="sidebar-label vessel-label">Active vessel</div>
        <div className="vessel-card">
          <div className="vessel-icon"><Ship size={18} /></div>
          <div className="vessel-details">
            <strong>MV Ardent Horizon</strong>
            <span>IMO 9824512 · On passage</span>
          </div>
          <span className="live-dot" />
        </div>

        <div className="sidebar-spacer" />
        <div className="sync-card">
          <div className="sync-icon"><Activity size={15} /></div>
          <div><strong>Last synced</strong><span>Today, 10:42 UTC</span></div>
          <Check size={14} className="sync-check" />
        </div>
        <div className="user-card">
          <div className="avatar avatar-teal">CO</div>
          <div className="user-copy"><strong>C. Osei</strong><span>Chief Officer</span></div>
          <MoreHorizontal size={17} className="muted-icon" />
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <button className="mobile-menu" onClick={() => setMobileMenu(true)} aria-label="Open navigation"><Menu size={20} /></button>
          <div className="breadcrumbs"><span>DeckLog PMS</span><span className="crumb-separator">/</span><strong>{activeSection}</strong></div>
          <div className="topbar-actions">
            <div className="global-search"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search work orders..." /><kbd>⌘ K</kbd></div>
            <div className="notification-wrap">
              <button className="icon-button notification-button" onClick={() => setShowNotifications((value) => !value)} aria-label="Notifications"><Bell size={18} /><span className="notification-dot" /></button>
              {showNotifications && <div className="notification-popover"><div className="popover-heading"><strong>Notifications</strong><span>3 new</span></div><p><AlertTriangle size={14} /> Main engine analysis is overdue.</p><p><Clock3 size={14} /> Generator load test is due today.</p><p><CheckCircle2 size={14} /> Purifier job was completed.</p></div>}
            </div>
            <button className="avatar avatar-teal desktop-avatar">CO</button>
          </div>
        </header>

        <div className="page-content">
          <section className="page-heading">
            <div><div className="eyebrow"><span className="status-pulse" /> VESSEL STATUS · ON PASSAGE</div><h1>{pageTitle}</h1><p>{pageDescription}</p></div>
            <div className="heading-actions"><button className="secondary-button" onClick={exportReport}><Download size={15} /> Export report</button><button className="primary-button" onClick={() => setShowNewJob(true)}><Plus size={16} /> New work order</button></div>
          </section>

          {activeSection === 'Dashboard' && (
            <Dashboard
              jobs={jobs}
              stats={stats}
              visibleJobs={visibleJobs}
              filter={filter}
              setFilter={setFilter}
              updateJobStatus={updateJobStatus}
              setActiveSection={setActiveSection}
              onSelectJob={setSelectedJobId}
            />
          )}
          {activeSection === 'Work orders' && (
            <WorkOrders jobs={visibleJobs} filter={filter} setFilter={setFilter} updateJobStatus={updateJobStatus} onSelectJob={setSelectedJobId} />
          )}
          {activeSection === 'Equipment' && <EquipmentView items={equipmentItems} onAdd={() => setShowNewEquipment(true)} />}
          {activeSection === 'Crew' && <CrewView jobs={jobs} />}
          {activeSection === 'Reports' && <ReportsView jobs={jobs} stats={stats} onReset={resetDemoData} />}
        </div>
      </main>

      {selectedJob && <JobDetailModal job={selectedJob} onClose={() => setSelectedJobId(null)} onUpdateStatus={updateJobStatus} />}
      {showNewEquipment && <NewEquipmentModal onClose={() => setShowNewEquipment(false)} onSubmit={addEquipment} />}
      {showNewJob && <NewJobModal equipmentOptions={equipmentItems} onClose={() => setShowNewJob(false)} onSubmit={addJob} />}
      {toast && <div className="toast"><CheckCircle2 size={16} /><span>{toast}</span></div>}
    </div>
  );
}

type DashboardProps = {
  jobs: MaintenanceJob[];
  stats: { open: number; overdue: number; dueSoon: number; completed: number };
  visibleJobs: MaintenanceJob[];
  filter: 'All' | JobStatus;
  setFilter: (value: 'All' | JobStatus) => void;
  updateJobStatus: (id: string, status: JobStatus) => void;
  setActiveSection: (section: Section) => void;
  onSelectJob: (id: string) => void;
};

function Dashboard({ jobs, stats, visibleJobs, filter, setFilter, updateJobStatus, setActiveSection, onSelectJob }: DashboardProps) {
  const upcoming = jobs.filter((job) => job.status !== 'Completed').slice(0, 4);
  return (
    <>
      <section className="metrics-grid">
        <MetricCard label="Open work orders" value={stats.open} change="3 this week" trend="up" icon={ClipboardCheck} accent="teal" />
        <MetricCard label="Overdue tasks" value={stats.overdue} change="Needs attention" trend="alert" icon={AlertTriangle} accent="orange" />
        <MetricCard label="Due this week" value={stats.dueSoon} change="Across 3 departments" trend="neutral" icon={CalendarDays} accent="blue" />
        <MetricCard label="Fleet readiness" value="94%" change="+2.4% vs last month" trend="up" icon={ShieldCheck} accent="purple" />
      </section>

      <section className="dashboard-grid">
        <div className="panel maintenance-panel">
          <div className="panel-heading"><div><span className="section-kicker">ACTION REQUIRED</span><h2>Maintenance queue</h2></div><button className="text-button" onClick={() => setActiveSection('Work orders')}>View all <ArrowUpRight size={14} /></button></div>
          <div className="queue-list">
            {upcoming.map((job) => <QueueItem key={job.id} job={job} updateJobStatus={updateJobStatus} onSelectJob={onSelectJob} />)}
          </div>
        </div>

        <div className="panel readiness-panel">
          <div className="panel-heading"><div><span className="section-kicker">SYSTEM HEALTH</span><h2>Equipment readiness</h2></div><button className="icon-button" onClick={() => setActiveSection('Equipment')} aria-label="Open equipment readiness"><MoreHorizontal size={18} /></button></div>
          <div className="readiness-summary"><div className="readiness-ring"><div><strong>94</strong><span>/ 100</span></div></div><div><strong className="readiness-title">Vessel ready</strong><p>All critical systems operational</p><div className="readiness-legend"><span><i className="legend-dot teal-dot" /> Operational <b>3</b></span><span><i className="legend-dot amber-dot" /> Watch <b>1</b></span></div></div></div>
          <div className="health-bar"><span style={{ width: '76%' }} /></div><div className="health-foot"><span>Fleet health score</span><strong>+2.4%</strong></div>
        </div>
      </section>

      <section className="panel work-orders-panel">
        <div className="panel-heading panel-heading-table"><div><span className="section-kicker">WORK MANAGEMENT</span><h2>Recent work orders</h2></div><div className="table-actions"><div className="filter-pills">{(['All', 'Overdue', 'In progress', 'Scheduled'] as const).map((value) => <button key={value} className={filter === value ? 'selected' : ''} onClick={() => setFilter(value)}>{value}</button>)}</div><button className="icon-button"><SlidersHorizontal size={16} /></button></div></div>
         <WorkOrderTable jobs={visibleJobs} updateJobStatus={updateJobStatus} onSelectJob={onSelectJob} />
      </section>

      <section className="insight-banner"><div className="insight-symbol"><Gauge size={21} /></div><div><strong>Maintenance efficiency is trending up.</strong><p>Vessel completion rate increased by <b>8.2%</b> over the last 30 days.</p></div><div className="insight-meter"><span style={{ width: '82%' }} /></div><button className="text-button" onClick={() => setActiveSection('Reports')}>View report <ArrowUpRight size={14} /></button></section>
    </>
  );
}

function MetricCard({ label, value, change, trend, icon: Icon, accent }: { label: string; value: number | string; change: string; trend: 'up' | 'alert' | 'neutral'; icon: typeof Activity; accent: string }) {
  return <article className={`metric-card metric-${accent}`}><div className="metric-top"><span>{label}</span><div className="metric-icon"><Icon size={17} /></div></div><div className="metric-value">{value}</div><div className={`metric-change ${trend}`}><span>{trend === 'up' ? '↗' : trend === 'alert' ? '!' : '—'}</span>{change}</div></article>;
}

function QueueItem({ job, updateJobStatus, onSelectJob }: { job: MaintenanceJob; updateJobStatus: (id: string, status: JobStatus) => void; onSelectJob: (id: string) => void }) {
  const isOverdue = job.status === 'Overdue';
  return <div className="queue-item" onClick={() => onSelectJob(job.id)} role="button" tabIndex={0} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') onSelectJob(job.id); }}><div className={`queue-status ${isOverdue ? 'queue-alert' : job.status === 'In progress' ? 'queue-progress' : 'queue-scheduled'}`}>{isOverdue ? <AlertTriangle size={14} /> : job.status === 'In progress' ? <Activity size={14} /> : <Clock3 size={14} />}</div><div className="queue-copy"><strong>{job.title}</strong><span>{job.equipmentTag} · {job.assignedTo}</span></div><div className="queue-date"><strong className={isOverdue ? 'danger-text' : ''}>{relativeDue(job.dueDate)}</strong><span>{formatDate(job.dueDate)}</span></div><button className="row-menu" onClick={(event) => { event.stopPropagation(); updateJobStatus(job.id, job.status === 'Completed' ? 'Scheduled' : 'Completed'); }} aria-label={`Complete ${job.title}`}>{job.status === 'Completed' ? <Check size={15} /> : <MoreHorizontal size={17} />}</button></div>;
}

function WorkOrders({ jobs, filter, setFilter, updateJobStatus, onSelectJob }: { jobs: MaintenanceJob[]; filter: 'All' | JobStatus; setFilter: (value: 'All' | JobStatus) => void; updateJobStatus: (id: string, status: JobStatus) => void; onSelectJob: (id: string) => void }) {
  return <section className="panel full-panel"><div className="panel-heading panel-heading-table"><div><span className="section-kicker">PLANNED MAINTENANCE</span><h2>All work orders</h2><p className="panel-description">{jobs.length} work orders match the current view.</p></div><div className="filter-pills">{(['All', 'Overdue', 'In progress', 'Scheduled', 'Completed'] as const).map((value) => <button key={value} className={filter === value ? 'selected' : ''} onClick={() => setFilter(value)}>{value}</button>)}</div></div><WorkOrderTable jobs={jobs} updateJobStatus={updateJobStatus} onSelectJob={onSelectJob} /></section>;
}

function WorkOrderTable({ jobs, updateJobStatus, onSelectJob }: { jobs: MaintenanceJob[]; updateJobStatus: (id: string, status: JobStatus) => void; onSelectJob: (id: string) => void }) {
  return <div className="table-wrap"><table><thead><tr><th>Work order</th><th>Equipment</th><th>Due date</th><th>Priority</th><th>Assigned to</th><th>Status</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>{jobs.map((job) => <tr key={job.id} onClick={() => onSelectJob(job.id)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') onSelectJob(job.id); }} tabIndex={0}><td><div className="work-title"><span className="job-id">{job.id}</span><strong>{job.title}</strong><small>{job.interval}</small></div></td><td><div className="equipment-cell"><span className="equipment-badge"><Wrench size={14} /></span><span><strong>{job.equipment}</strong><small>{job.equipmentTag} · {job.department}</small></span></div></td><td><div className={`date-cell ${job.status === 'Overdue' ? 'date-danger' : ''}`}><strong>{formatDate(job.dueDate)}</strong><small>{relativeDue(job.dueDate)}</small></div></td><td><span className={`priority-badge priority-${job.priority.toLowerCase()}`}>{job.priority}</span></td><td><div className="assignee"><span className="mini-avatar">{job.assignedTo.split(' ').map((part) => part[0]).join('').slice(0, 2)}</span>{job.assignedTo}</div></td><td><button className={`status-badge status-${job.status.toLowerCase().replace(' ', '-')}`} onClick={(event) => { event.stopPropagation(); updateJobStatus(job.id, job.status === 'Completed' ? 'Scheduled' : 'Completed'); }} title="Toggle completion"><i />{job.status}</button></td><td><button className="row-menu" onClick={(event) => { event.stopPropagation(); onSelectJob(job.id); }} aria-label={`Open ${job.id}`}><MoreHorizontal size={17} /></button></td></tr>)}</tbody></table>{jobs.length === 0 && <div className="empty-state"><Search size={22} /><strong>No work orders found</strong><span>Try a different search or filter.</span></div>}</div>;
}

function EquipmentView({ items, onAdd }: { items: Equipment[]; onAdd: () => void }) {
  return <section className="equipment-view"><div className="equipment-intro"><div className="panel equipment-summary-card"><div className="panel-heading"><div><span className="section-kicker">ASSET REGISTER</span><h2>Critical equipment</h2></div><button className="secondary-button small-button" onClick={onAdd}><Plus size={14} /> Add equipment</button></div><div className="equipment-grid">{items.map((item) => <EquipmentCard key={item.id} item={item} />)}</div></div><div className="panel fleet-map-card"><div className="map-glow" /><Ship size={34} /><span className="map-label">MV ARDENT HORIZON</span><strong>18° 34.2′ N<br />062° 11.8′ W</strong><span className="map-route">North Atlantic passage</span><div className="map-lines"><i /><i /><i /></div></div></div><div className="panel maintenance-calendar"><div className="panel-heading"><div><span className="section-kicker">SERVICE OUTLOOK</span><h2>Next 30 days</h2></div><button className="text-button" onClick={onAdd}>Add service item <Plus size={14} /></button></div><div className="calendar-bar"><span className="calendar-day"><b>08</b><small>OCT</small></span><i /><span className="calendar-day"><b>10</b><small>OCT</small></span><i /><span className="calendar-day active"><b>11</b><small>OCT</small></span><i /><span className="calendar-day"><b>17</b><small>OCT</small></span><i /><span className="calendar-day"><b>22</b><small>OCT</small></span></div><div className="calendar-events"><span><i className="event-amber" /> Generator load test <b>Today</b></span><span><i className="event-teal" /> Main engine inspection <b>11 Oct</b></span><span><i className="event-purple" /> Purifier service <b>17 Oct</b></span></div></div></section>;
}

function EquipmentCard({ item }: { item: Equipment }) {
  return <article className="equipment-card"><div className="equipment-card-top"><div className="equipment-symbol" style={{ background: `${item.accent}18`, color: item.accent }}><Settings2 size={18} /></div><span className={`equipment-status equipment-${item.status.toLowerCase()}`}><i />{item.status}</span></div><h3>{item.name}</h3><p>{item.tag}</p><div className="equipment-health"><div><span>Health score</span><strong>{item.health}%</strong></div><div className="progress-track"><span style={{ width: `${item.health}%`, background: item.accent }} /></div></div><div className="equipment-meta"><span><Clock3 size={12} /> {item.runtime}</span><span><CalendarDays size={12} /> {item.nextService}</span></div></article>;
}

function CrewView({ jobs }: { jobs: MaintenanceJob[] }) {
  return <section className="crew-view"><div className="panel crew-header"><div className="crew-header-copy"><span className="section-kicker">ONBOARD TEAM</span><h2>Maintenance crew</h2><p>Four crew members are currently assigned to planned maintenance tasks.</p></div><div className="crew-availability"><strong>4 / 4</strong><span>Available for duty</span><div className="crew-dots"><i /><i /><i /><i /></div></div></div><div className="crew-grid">{crew.map((member) => <article className="panel crew-card" key={member.name}><div className="crew-card-top"><div className="crew-avatar" style={{ background: member.color }}>{member.initials}</div><span className="available-badge"><i /> On duty</span><MoreHorizontal size={17} className="muted-icon" /></div><h3>{member.name}</h3><p>{member.role}</p><div className="crew-meta"><span>{member.shift} department</span><strong>{jobs.filter((job) => job.assignedTo === member.name && job.status !== 'Completed').length} open tasks</strong></div><button className="outline-button">View profile <ArrowUpRight size={14} /></button></article>)}</div></section>;
}

function ReportsView({ jobs, stats, onReset }: { jobs: MaintenanceJob[]; stats: { open: number; overdue: number; dueSoon: number; completed: number }; onReset: () => void }) {
  const completed = jobs.filter((job) => job.status === 'Completed').length;
  const completionRate = jobs.length ? Math.round((completed / jobs.length) * 100) : 0;
  return <section className="reports-view"><div className="report-hero panel"><div><span className="section-kicker">MONTHLY PERFORMANCE · OCTOBER 2026</span><h2>Maintenance performance</h2><p>Use the operational picture to keep the vessel ready for the next port call.</p></div><div className="report-score"><strong>94%</strong><span>readiness score</span><small><ArrowUpRight size={12} /> 2.4% from Sep</small></div></div><div className="report-cards"><ReportCard icon={CheckCircle2} label="Completion rate" value={`${completionRate}%`} detail={`${stats.completed} closed · target 90%`} color="teal" /><ReportCard icon={Clock3} label="Average close time" value="2.4d" detail={`${stats.open} open tasks`} color="blue" /><ReportCard icon={PackageCheck} label="Spare parts ready" value="87%" detail={`${stats.overdue} overdue task`} color="orange" /></div><div className="panel report-chart"><div className="panel-heading"><div><span className="section-kicker">COMPLETION TREND</span><h2>Jobs closed over time</h2></div><button className="secondary-button small-button" onClick={onReset}><RotateCcw size={13} /> Reset demo data</button></div><div className="chart-area"><div className="y-axis"><span>100%</span><span>75%</span><span>50%</span><span>25%</span><span>0</span></div><div className="chart-body"><div className="chart-grid-lines"><i /><i /><i /><i /><i /></div><svg className="chart-line" viewBox="0 0 720 230" preserveAspectRatio="none" aria-label="Completion trend chart"><defs><linearGradient id="areaFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#16b8a6" stopOpacity=".28" /><stop offset="100%" stopColor="#16b8a6" stopOpacity="0" /></linearGradient></defs><path d="M0 190 C55 176 63 145 112 154 S169 175 216 128 S271 118 320 136 S382 109 430 103 S488 123 535 78 S603 56 640 68 S686 44 720 34 L720 230 L0 230 Z" fill="url(#areaFill)" /><path d="M0 190 C55 176 63 145 112 154 S169 175 216 128 S271 118 320 136 S382 109 430 103 S488 123 535 78 S603 56 640 68 S686 44 720 34" fill="none" stroke="#16b8a6" strokeWidth="3" strokeLinecap="round" /></svg><div className="x-axis"><span>09 Sep</span><span>16 Sep</span><span>23 Sep</span><span>30 Sep</span><span>08 Oct</span></div></div></div></div></section>;
}

function ReportCard({ icon: Icon, label, value, detail, color }: { icon: typeof Activity; label: string; value: string; detail: string; color: string }) {
  return <article className={`report-card report-${color}`}><div className="report-icon"><Icon size={18} /></div><span>{label}</span><strong>{value}</strong><small>{detail}</small></article>;
}

function JobDetailModal({ job, onClose, onUpdateStatus }: { job: MaintenanceJob; onClose: () => void; onUpdateStatus: (id: string, status: JobStatus) => void }) {
  const canStart = job.status !== 'Completed' && job.status !== 'In progress';
  const isCompleted = job.status === 'Completed';
  return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><div className="modal-card detail-modal"><div className="modal-header"><div><span className="section-kicker">{job.id} · {job.department.toUpperCase()}</span><h2>{job.title}</h2><p>{job.equipment} · {job.equipmentTag}</p></div><button className="icon-button" onClick={onClose} aria-label="Close work order"><X size={18} /></button></div><div className="detail-body"><div className="detail-summary"><span className={`status-badge status-${job.status.toLowerCase().replace(' ', '-')}`}><i />{job.status}</span><span className={`priority-badge priority-${job.priority.toLowerCase()}`}>{job.priority} priority</span><span className="detail-due"><CalendarDays size={13} /> {relativeDue(job.dueDate)} · {formatDate(job.dueDate)}</span></div><div className="detail-progress"><div><span>Completion</span><strong>{job.completion}%</strong></div><div className="progress-track"><span style={{ width: `${job.completion}%` }} /></div></div><div className="detail-grid"><div><span>Assigned to</span><strong>{job.assignedTo}</strong></div><div><span>Service interval</span><strong>{job.interval}</strong></div><div><span>Last serviced</span><strong>{job.lastServiced}</strong></div><div><span>Equipment tag</span><strong>{job.equipmentTag}</strong></div></div><div className="job-notes"><FileText size={16} /><div><span>Maintenance instruction</span><p>{job.notes}</p></div></div></div><div className="modal-footer"><button type="button" className="secondary-button" onClick={onClose}>Close</button>{canStart && <button type="button" className="secondary-button" onClick={() => onUpdateStatus(job.id, 'In progress')}><Play size={14} /> Start job</button>}<button type="button" className="primary-button" onClick={() => onUpdateStatus(job.id, isCompleted ? 'Scheduled' : 'Completed')}><Check size={15} /> {isCompleted ? 'Reopen task' : 'Mark complete'}</button></div></div></div>;
}

function NewJobModal({ equipmentOptions, onClose, onSubmit }: { equipmentOptions: Equipment[]; onClose: () => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><div className="modal-card"><div className="modal-header"><div><span className="section-kicker">NEW TASK</span><h2>Create work order</h2><p>Add a planned maintenance job to the vessel queue.</p></div><button className="icon-button" onClick={onClose} aria-label="Close modal"><X size={18} /></button></div><form onSubmit={onSubmit}><div className="form-grid"><label>Task title<input name="title" required placeholder="e.g. Inspect seawater pump" /></label><label>Equipment<select name="equipment" defaultValue={equipmentOptions[0]?.name}>{equipmentOptions.map((item) => <option key={item.id}>{item.name}</option>)}</select></label><label>Department<select name="department" defaultValue="Engine"><option>Engine</option><option>Deck</option><option>Safety</option><option>Electrical</option></select></label><label>Due date<input name="dueDate" type="date" defaultValue={dayFromToday(7)} required /></label><label>Priority<select name="priority" defaultValue="Routine"><option>Routine</option><option>High</option><option>Critical</option></select></label><label>Assign to<select name="assignedTo" defaultValue="M. Dsouza">{crew.map((member) => <option key={member.name}>{member.name}</option>)}</select></label><label>Service interval<input name="interval" placeholder="e.g. Monthly" defaultValue="Monthly" /></label><label>Notes<input name="notes" placeholder="Add a short instruction" /></label></div><div className="modal-footer"><button type="button" className="secondary-button" onClick={onClose}>Cancel</button><button type="submit" className="primary-button"><Plus size={16} /> Create work order</button></div></form></div></div>;
}

function NewEquipmentModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><div className="modal-card"><div className="modal-header"><div><span className="section-kicker">ASSET REGISTER</span><h2>Add equipment</h2><p>Create a tracked vessel asset for planned maintenance.</p></div><button className="icon-button" onClick={onClose} aria-label="Close modal"><X size={18} /></button></div><form onSubmit={onSubmit}><div className="form-grid"><label>Equipment name<input name="name" required placeholder="e.g. Sewage treatment plant" /></label><label>Equipment tag<input name="tag" required placeholder="e.g. STP-001" /></label><label>Department<select name="department" defaultValue="Engine"><option>Engine</option><option>Deck</option><option>Safety</option><option>Electrical</option></select></label><label>Health score<input name="health" type="number" min="0" max="100" defaultValue="100" /></label><label>Runtime<input name="runtime" placeholder="e.g. 1,240 h" defaultValue="—" /></label><label>Next service<input name="nextService" type="date" defaultValue={dayFromToday(30)} /></label><label>Status<select name="status" defaultValue="Operational"><option>Operational</option><option>Watch</option><option>Maintenance</option></select></label></div><div className="modal-footer"><button type="button" className="secondary-button" onClick={onClose}>Cancel</button><button type="submit" className="primary-button"><Plus size={16} /> Add equipment</button></div></form></div></div>;
}

export default App;
