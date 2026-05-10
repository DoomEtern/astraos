import { app } from 'electron'
import { join } from 'path'
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'fs'

const userDataPath = app.getPath('userData')
mkdirSync(userDataPath, { recursive: true })
const DB_PATH = join(userDataPath, 'astraos.db')

// ─── WASM path resolution (tries 4 locations) ─────────────────────
function getWasmPath(): string {
  const candidates = [
    // Packaged app
    join(process.resourcesPath ?? '', 'sql-wasm.wasm'),
    // Dev: dist-electron/ → project root → node_modules
    join(__dirname, '..', 'node_modules', 'sql.js', 'dist', 'sql-wasm.wasm'),
    // Running from project root directly
    join(process.cwd(), 'node_modules', 'sql.js', 'dist', 'sql-wasm.wasm'),
    // Absolute fallback: same dir as main.js
    join(__dirname, 'sql-wasm.wasm'),
  ]
  for (const p of candidates) {
    if (existsSync(p)) {
      console.log('[AstraOS] WASM found at:', p)
      return p
    }
  }
  throw new Error(
    `sql-wasm.wasm not found. Tried:\n${candidates.join('\n')}\n\n` +
    `Make sure you ran: npm install\n` +
    `__dirname = ${__dirname}\ncwd = ${process.cwd()}`
  )
}

// eslint-disable-next-line @typescript-eslint/no-var-requires
let db: import('sql.js').Database
let saveTimer: ReturnType<typeof setTimeout> | null = null

function scheduleSave() {
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    const data = db.export()
    writeFileSync(DB_PATH, Buffer.from(data))
  }, 300)
}

export function saveNow() {
  if (!db) return
  if (saveTimer) { clearTimeout(saveTimer); saveTimer = null }
  writeFileSync(DB_PATH, Buffer.from(db.export()))
}

type Row = Record<string, any>

function all(sql: string, params: any[] = []): Row[] {
  const stmt = db.prepare(sql)
  stmt.bind(params)
  const rows: Row[] = []
  while (stmt.step()) rows.push(stmt.getAsObject() as Row)
  stmt.free()
  return rows
}

function get(sql: string, params: any[] = []): Row | null {
  return all(sql, params)[0] ?? null
}

function run(sql: string, params: any[] = []): void {
  db.run(sql, params)
  scheduleSave()
}

// Convert @name → ? positional params
function namedRun(sql: string, obj: Row): void {
  const keys: string[] = []
  const replaced = sql.replace(/@(\w+)/g, (_, k) => { keys.push(k); return '?' })
  run(replaced, keys.map(k => (obj[k] !== undefined ? obj[k] : null)))
}

// ─── Init ─────────────────────────────────────────────────────────
export async function initDb(): Promise<void> {
  const wasmPath = getWasmPath()
  const wasmBinary = readFileSync(wasmPath)

  // Dynamically require sql.js so Vite doesn't try to bundle it
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const initSqlJs = require('sql.js')
  const SQL = await initSqlJs({ wasmBinary })

  if (existsSync(DB_PATH)) {
    console.log('[AstraOS] Loading existing DB from', DB_PATH)
    db = new SQL.Database(readFileSync(DB_PATH))
  } else {
    console.log('[AstraOS] Creating new DB at', DB_PATH)
    db = new SQL.Database()
  }

  db.run('PRAGMA foreign_keys = ON')
  createSchema()
  seedStats()
  seedAchievements()
  saveNow()
  console.log('[AstraOS] DB init complete.')
}

function createSchema() {
  db.run(`
    CREATE TABLE IF NOT EXISTS profile (
      id INTEGER PRIMARY KEY DEFAULT 1,
      name TEXT DEFAULT 'Commander',
      level INTEGER DEFAULT 1,
      xp_current INTEGER DEFAULT 0,
      total_xp INTEGER DEFAULT 0,
      title TEXT DEFAULT 'Initiate',
      theme TEXT DEFAULT 'purple'
    );
    CREATE TABLE IF NOT EXISTS life_stats (
      id TEXT PRIMARY KEY, name TEXT NOT NULL,
      val INTEGER DEFAULT 0, lvl INTEGER DEFAULT 1,
      xp INTEGER DEFAULT 0, cap INTEGER DEFAULT 1000, color TEXT DEFAULT '#8B5CF6'
    );
    CREATE TABLE IF NOT EXISTS habits (
      id TEXT PRIMARY KEY, name TEXT NOT NULL,
      color TEXT DEFAULT '#8B5CF6', xp INTEGER DEFAULT 25,
      frequency TEXT DEFAULT 'daily', is_positive INTEGER DEFAULT 1,
      sort_order INTEGER DEFAULT 0, created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS habit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      habit_id TEXT, date TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(habit_id, date)
    );
    CREATE TABLE IF NOT EXISTS quests (
      id TEXT PRIMARY KEY, title TEXT NOT NULL,
      type TEXT DEFAULT 'SIDE', xp INTEGER DEFAULT 500,
      deadline TEXT, progress INTEGER DEFAULT 0,
      notes TEXT DEFAULT '', created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS quest_tasks (
      id TEXT PRIMARY KEY, quest_id TEXT,
      title TEXT NOT NULL, done INTEGER DEFAULT 0, sort_order INTEGER DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS deep_work_sessions (
      id TEXT PRIMARY KEY, task TEXT NOT NULL,
      duration_mins INTEGER DEFAULT 25, type TEXT DEFAULT 'Focus',
      started_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS journal_entries (
      id TEXT PRIMARY KEY, date TEXT NOT NULL,
      mood INTEGER DEFAULT 5, content TEXT DEFAULT '',
      tags TEXT DEFAULT '', created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS finance_entries (
      id TEXT PRIMARY KEY, type TEXT DEFAULT 'expense',
      amount REAL DEFAULT 0, category TEXT DEFAULT 'Other',
      note TEXT DEFAULT '', date TEXT DEFAULT (date('now'))
    );
    CREATE TABLE IF NOT EXISTS health_logs (
      id TEXT PRIMARY KEY, date TEXT NOT NULL UNIQUE,
      steps INTEGER DEFAULT 0, calories INTEGER DEFAULT 0,
      sleep_hours REAL DEFAULT 0, sleep_quality INTEGER DEFAULT 5,
      water_ml INTEGER DEFAULT 0, workout INTEGER DEFAULT 0,
      workout_type TEXT DEFAULT '', weight_kg REAL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS achievements (
      id TEXT PRIMARY KEY, title TEXT NOT NULL, description TEXT,
      rarity TEXT DEFAULT 'COMMON', icon TEXT DEFAULT 'star',
      condition_type TEXT, condition_value INTEGER DEFAULT 0,
      earned INTEGER DEFAULT 0, earned_at TEXT
    );
  `)
  const p = get('SELECT id FROM profile WHERE id=1')
  if (!p) run('INSERT INTO profile (id) VALUES (1)')
}

function seedStats() {
  const c = (get('SELECT COUNT(*) as c FROM life_stats') as any)?.c ?? 0
  if (c > 0) return
  const stats: [string, string, string][] = [
    ['discipline','Discipline','#8B5CF6'], ['intelligence','Intelligence','#A78BFA'],
    ['strength','Strength','#FB7185'],     ['focus','Focus','#FBBF24'],
    ['creativity','Creativity','#F472B6'], ['social','Social','#34D399'],
    ['health','Health','#FB7185'],         ['consistency','Consistency','#FBBF24'],
    ['finance','Finance','#34D399'],       ['charisma','Charisma','#A78BFA'],
    ['knowledge','Knowledge','#8B5CF6'],   ['emotional','Emotional','#34D399'],
    ['spiritual','Spiritual','#F472B6'],
  ]
  stats.forEach(([id, name, color]) =>
    run('INSERT INTO life_stats VALUES (?,?,0,1,0,1000,?)', [id, name, color])
  )
}

function seedAchievements() {
  const c = (get('SELECT COUNT(*) as c FROM achievements') as any)?.c ?? 0
  if (c > 0) return
  const list: [string, string, string, string, string, string, number][] = [
    ['a1','First Step','Complete your first habit','COMMON','👣','habit_count',1],
    ['a2','7-Day Warrior','Maintain a 7-day streak','UNCOMMON','🔥','streak',7],
    ['a3','Century Club','Log 100 deep work sessions','RARE','💎','session_count',100],
    ['a4','Iron Will','30-day streak on any habit','EPIC','⚡','streak',30],
    ['a5','Quest Crusher','Complete 5 quests','RARE','📚','quest_count',5],
    ['a6','Financial Tier I','Log 30 finance entries','UNCOMMON','💰','finance_count',30],
    ['a7','The Architect','Reach Level 10','LEGENDARY','🏛️','level',10],
    ['a8','Mindmaster','Journal for 14 days','EPIC','🧠','journal_count',14],
    ['a9','Deep Diver','Log 50 deep work sessions','RARE','🎯','session_count',50],
    ['a10','Sovereign','Reach Level 25','LEGENDARY','👑','level',25],
    ['a11','Zenith','Meditate 21 days in a row','EPIC','🧘','streak',21],
    ['a12','Bookworm','Read habit for 30 days total','UNCOMMON','📖','habit_read',30],
  ]
  list.forEach(([id, title, desc, rarity, icon, ctype, cval]) =>
    run('INSERT INTO achievements VALUES (?,?,?,?,?,?,?,0,NULL)', [id, title, desc, rarity, icon, ctype, cval])
  )
}

// ─── Exported DB Operations ───────────────────────────────────────
export const dbHabits = {
  getAll: () => all('SELECT * FROM habits ORDER BY sort_order'),
  upsert: (h: Row) => namedRun(`
    INSERT INTO habits (id,name,color,xp,frequency,is_positive,sort_order)
    VALUES (@id,@name,@color,@xp,@frequency,@is_positive,@sort_order)
    ON CONFLICT(id) DO UPDATE SET name=@name,color=@color,xp=@xp,
    frequency=@frequency,is_positive=@is_positive,sort_order=@sort_order`, h),
  delete: (id: string) => run('DELETE FROM habits WHERE id=?', [id]),
}

export const dbHabitLogs = {
  getByDate: (date: string) => all('SELECT * FROM habit_logs WHERE date=?', [date]),
  toggle: (habit_id: string, date: string): { done: boolean } => {
    const ex = get('SELECT id FROM habit_logs WHERE habit_id=? AND date=?', [habit_id, date])
    if (ex) { run('DELETE FROM habit_logs WHERE habit_id=? AND date=?', [habit_id, date]); return { done: false } }
    run('INSERT INTO habit_logs (habit_id,date) VALUES (?,?)', [habit_id, date])
    return { done: true }
  },
  getAllDates: () => all('SELECT DISTINCT date FROM habit_logs ORDER BY date DESC LIMIT 300'),
  getByHabit: (habit_id: string) => all('SELECT date FROM habit_logs WHERE habit_id=? ORDER BY date DESC', [habit_id]),
}

export const dbQuests = {
  getAll: () => all('SELECT * FROM quests ORDER BY created_at DESC'),
  upsert: (q: Row) => namedRun(`
    INSERT INTO quests (id,title,type,xp,deadline,progress,notes)
    VALUES (@id,@title,@type,@xp,@deadline,@progress,@notes)
    ON CONFLICT(id) DO UPDATE SET title=@title,type=@type,xp=@xp,
    deadline=@deadline,progress=@progress,notes=@notes`, q),
  updateProgress: (id: string, progress: number) => run('UPDATE quests SET progress=? WHERE id=?', [progress, id]),
  delete: (id: string) => {
    run('DELETE FROM quest_tasks WHERE quest_id=?', [id])
    run('DELETE FROM quests WHERE id=?', [id])
  },
}

export const dbQuestTasks = {
  getAll: () => all('SELECT * FROM quest_tasks ORDER BY quest_id, sort_order'),
  getByQuest: (questId: string) => all('SELECT * FROM quest_tasks WHERE quest_id=? ORDER BY sort_order', [questId]),
  add: (t: Row) => namedRun('INSERT INTO quest_tasks (id,quest_id,title,done,sort_order) VALUES (@id,@quest_id,@title,0,@sort_order)', t),
  toggle: (id: string) => {
    run('UPDATE quest_tasks SET done=CASE WHEN done=1 THEN 0 ELSE 1 END WHERE id=?', [id])
    const task = get('SELECT quest_id FROM quest_tasks WHERE id=?', [id]) as any
    if (!task) return
    const tasks = all('SELECT done FROM quest_tasks WHERE quest_id=?', [task.quest_id])
    const pct = tasks.length ? Math.round((tasks.filter((t: any) => t.done).length / tasks.length) * 100) : 0
    run('UPDATE quests SET progress=? WHERE id=?', [pct, task.quest_id])
  },
  delete: (id: string) => run('DELETE FROM quest_tasks WHERE id=?', [id]),
}

export const dbSessions = {
  getAll: () => all('SELECT * FROM deep_work_sessions ORDER BY started_at DESC LIMIT 100'),
  add: (s: Row) => namedRun('INSERT INTO deep_work_sessions (id,task,duration_mins,type,started_at) VALUES (@id,@task,@duration_mins,@type,@started_at)', s),
  getByDate: (date: string) => all("SELECT * FROM deep_work_sessions WHERE date(started_at)=?", [date]),
  getLast7Days: () => all(`
    SELECT date(started_at) as day, SUM(duration_mins) as total_mins, COUNT(*) as count
    FROM deep_work_sessions WHERE started_at >= date('now','-7 days')
    GROUP BY date(started_at) ORDER BY day ASC`),
}

export const dbStats = {
  getAll: () => all('SELECT * FROM life_stats'),
  update: (id: string, xp_gain: number) => run('UPDATE life_stats SET xp=MIN(xp+?,cap),val=MIN(val+1,100) WHERE id=?', [xp_gain, id]),
}

export const dbJournal = {
  getAll: () => all('SELECT * FROM journal_entries ORDER BY date DESC LIMIT 50'),
  upsert: (e: Row) => namedRun(`
    INSERT INTO journal_entries (id,date,mood,content,tags)
    VALUES (@id,@date,@mood,@content,@tags)
    ON CONFLICT(id) DO UPDATE SET mood=@mood,content=@content,tags=@tags`, e),
}

export const dbFinance = {
  getAll: () => all('SELECT * FROM finance_entries ORDER BY date DESC LIMIT 200'),
  add: (e: Row) => namedRun('INSERT INTO finance_entries (id,type,amount,category,note,date) VALUES (@id,@type,@amount,@category,@note,@date)', e),
  delete: (id: string) => run('DELETE FROM finance_entries WHERE id=?', [id]),
}

export const dbHealth = {
  getAll: () => all('SELECT * FROM health_logs ORDER BY date DESC LIMIT 60'),
  upsert: (e: Row) => namedRun(`
    INSERT INTO health_logs (id,date,steps,calories,sleep_hours,sleep_quality,water_ml,workout,workout_type,weight_kg)
    VALUES (@id,@date,@steps,@calories,@sleep_hours,@sleep_quality,@water_ml,@workout,@workout_type,@weight_kg)
    ON CONFLICT(date) DO UPDATE SET steps=@steps,calories=@calories,sleep_hours=@sleep_hours,
    sleep_quality=@sleep_quality,water_ml=@water_ml,workout=@workout,workout_type=@workout_type,weight_kg=@weight_kg`, e),
}

export const dbAchievements = {
  getAll: () => all('SELECT * FROM achievements'),
  unlock: (id: string) => run("UPDATE achievements SET earned=1,earned_at=datetime('now') WHERE id=?", [id]),
}

export const dbProfile = {
  get: () => get('SELECT * FROM profile WHERE id=1'),
  addXP: (xp: number): { leveledUp: boolean; newLevel?: number } => {
    const p = get('SELECT * FROM profile WHERE id=1') as any
    if (!p) return { leveledUp: false }
    const needed = p.level * 1000
    const newXp = p.xp_current + xp
    run('UPDATE profile SET total_xp=total_xp+? WHERE id=1', [xp])
    if (newXp >= needed) {
      run('UPDATE profile SET level=level+1,xp_current=? WHERE id=1', [newXp - needed])
      const updated = get('SELECT level FROM profile WHERE id=1') as any
      const titles = ['Initiate','Apprentice','Adept','Journeyman','Specialist','Expert','Master','Grandmaster','Champion','Legend','Sovereign']
      run('UPDATE profile SET title=? WHERE id=1', [titles[Math.min(Math.floor((updated.level-1)/3), titles.length-1)]])
      return { leveledUp: true, newLevel: updated.level }
    }
    run('UPDATE profile SET xp_current=? WHERE id=1', [newXp])
    return { leveledUp: false }
  },
  updateName: (name: string) => run('UPDATE profile SET name=? WHERE id=1', [name]),
}
