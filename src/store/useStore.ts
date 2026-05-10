import { create } from 'zustand'
import { format } from 'date-fns'

export type View = 'home'|'stats'|'habits'|'quests'|'deepwork'|'health'|'finance'|'journal'|'analytics'|'achievements'|'settings'

export interface Habit { id:string; name:string; color:string; xp:number; frequency:string; is_positive:number; sort_order:number }
export interface HabitLog { habit_id:string; date:string }
export interface Quest { id:string; title:string; type:string; xp:number; deadline:string; progress:number; notes:string }
export interface QuestTask { id:string; quest_id:string; title:string; done:number; sort_order:number }
export interface Session { id:string; task:string; duration_mins:number; type:string; started_at:string }
export interface LifeStat { id:string; name:string; val:number; lvl:number; xp:number; cap:number; color:string }
export interface JournalEntry { id:string; date:string; mood:number; content:string; tags:string }
export interface FinanceEntry { id:string; type:string; amount:number; category:string; note:string; date:string }
export interface HealthLog { id:string; date:string; steps:number; calories:number; sleep_hours:number; sleep_quality:number; water_ml:number; workout:number; workout_type:string; weight_kg:number }
export interface Achievement { id:string; title:string; description:string; rarity:string; icon:string; earned:number; earned_at:string|null }
export interface Profile { id:number; name:string; level:number; xp_current:number; total_xp:number; title:string }

interface AppState {
  view: View
  setView: (v: View) => void
  habits: Habit[]
  habitLogs: HabitLog[]
  allHabitDates: { date: string }[]
  quests: Quest[]
  questTasks: QuestTask[]
  sessions: Session[]
  stats: LifeStat[]
  journal: JournalEntry[]
  finance: FinanceEntry[]
  health: HealthLog[]
  achievements: Achievement[]
  profile: Profile | null
  levelUpToast: { level: number; visible: boolean }

  loadAll: () => Promise<void>
  loadHabits: () => Promise<void>
  loadQuests: () => Promise<void>
  loadSessions: () => Promise<void>
  loadJournal: () => Promise<void>
  loadFinance: () => Promise<void>
  loadHealth: () => Promise<void>
  loadProfile: () => Promise<void>

  toggleHabit: (id: string) => Promise<void>
  addSession: (s: Omit<Session,'id'>) => Promise<void>
  addFinanceEntry: (e: Omit<FinanceEntry,'id'>) => Promise<void>
  upsertHealthLog: (e: Omit<HealthLog,'id'>) => Promise<void>
  upsertJournalEntry: (e: Omit<JournalEntry,'id'>) => Promise<void>
  toggleQuestTask: (taskId: string) => Promise<void>
  addQuestTask: (questId: string, title: string) => Promise<void>
  deleteQuestTask: (taskId: string) => Promise<void>
  gainXP: (amount: number) => Promise<void>
  dismissLevelUp: () => void
}

const el = () => (window as any).electron
function uid() { return Math.random().toString(36).slice(2) + Date.now().toString(36) }

export const useStore = create<AppState>((set, get) => ({
  view: 'home', setView: (v) => set({ view: v }),
  habits: [], habitLogs: [], allHabitDates: [], quests: [], questTasks: [],
  sessions: [], stats: [], journal: [], finance: [], health: [],
  achievements: [], profile: null,
  levelUpToast: { level: 0, visible: false },

  loadAll: async () => {
    const e = el()
    if (!e) return
    const today = format(new Date(), 'yyyy-MM-dd')
    const [habits, logs, allDates, quests, questTasks, sessions, stats, journal, finance, health, achievements, profile] = await Promise.all([
      e.habits.getAll(), e.habitLogs.getByDate(today), e.habitLogs.getAllDates(),
      e.quests.getAll(), e.questTasks.getAll(),
      e.sessions.getAll(), e.stats.getAll(),
      e.journal.getAll(), e.finance.getAll(), e.health.getAll(),
      e.achievements.getAll(), e.profile.get(),
    ])
    set({ habits, habitLogs: logs, allHabitDates: allDates, quests, questTasks, sessions, stats, journal, finance, health, achievements, profile })
  },

  loadHabits: async () => {
    const e = el(); if (!e) return
    const today = format(new Date(), 'yyyy-MM-dd')
    const [habits, logs, allDates] = await Promise.all([e.habits.getAll(), e.habitLogs.getByDate(today), e.habitLogs.getAllDates()])
    set({ habits, habitLogs: logs, allHabitDates: allDates })
  },

  loadQuests: async () => {
    const e = el(); if (!e) return
    const [quests, questTasks] = await Promise.all([e.quests.getAll(), e.questTasks.getAll()])
    set({ quests, questTasks })
  },

  loadSessions: async () => { const e = el(); if (!e) return; set({ sessions: await e.sessions.getAll() }) },
  loadJournal: async () => { const e = el(); if (!e) return; set({ journal: await e.journal.getAll() }) },
  loadFinance: async () => { const e = el(); if (!e) return; set({ finance: await e.finance.getAll() }) },
  loadHealth: async () => { const e = el(); if (!e) return; set({ health: await e.health.getAll() }) },
  loadProfile: async () => { const e = el(); if (!e) return; set({ profile: await e.profile.get() }) },

  toggleHabit: async (habitId) => {
    const e = el(); if (!e) return
    const today = format(new Date(), 'yyyy-MM-dd')
    const result = await e.habitLogs.toggle({ habit_id: habitId, date: today })
    const habit = get().habits.find(h => h.id === habitId)
    if (result.done && habit) await get().gainXP(habit.xp)
    await get().loadHabits()
  },

  addSession: async (session) => {
    const e = el(); if (!e) return
    const id = uid()
    await e.sessions.add({ id, ...session })
    await get().gainXP(session.duration_mins * 2)
    set(s => ({ sessions: [{ id, ...session } as Session, ...s.sessions] }))
  },

  addFinanceEntry: async (entry) => {
    const e = el(); if (!e) return
    const id = uid()
    await e.finance.add({ id, ...entry })
    set(s => ({ finance: [{ id, ...entry } as FinanceEntry, ...s.finance] }))
  },

  upsertHealthLog: async (entry) => {
    const e = el(); if (!e) return
    await e.health.upsert({ id: uid(), ...entry })
    await get().loadHealth()
  },

  upsertJournalEntry: async (entry) => {
    const e = el(); if (!e) return
    await e.journal.upsert({ id: uid(), ...entry })
    await get().loadJournal()
  },

  toggleQuestTask: async (taskId) => {
    const e = el(); if (!e) return
    await e.questTasks.toggle(taskId)
    await get().loadQuests()
  },

  addQuestTask: async (questId, title) => {
    const e = el(); if (!e) return
    const tasks = get().questTasks.filter(t => t.quest_id === questId)
    await e.questTasks.add({ id: uid(), quest_id: questId, title, done: 0, sort_order: tasks.length })
    await get().loadQuests()
  },

  deleteQuestTask: async (taskId) => {
    const e = el(); if (!e) return
    await e.questTasks.delete(taskId)
    await get().loadQuests()
  },

  gainXP: async (amount) => {
    const e = el(); if (!e) return
    const result = await e.profile.addXP(amount)
    set({ profile: await e.profile.get() })
    if (result?.leveledUp) {
      set({ levelUpToast: { level: result.newLevel, visible: true } })
      setTimeout(() => set({ levelUpToast: { level: 0, visible: false } }), 4500)
    }
  },

  dismissLevelUp: () => set({ levelUpToast: { level: 0, visible: false } }),
}))
