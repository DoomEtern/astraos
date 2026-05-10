export {}
declare global {
  interface Window {
    electron: {
      minimize: () => void
      maximize: () => void
      close: () => void
      habits: {
        getAll: () => Promise<any[]>
        upsert: (h: any) => Promise<any>
        delete: (id: string) => Promise<any>
      }
      habitLogs: {
        getByDate: (date: string) => Promise<any[]>
        toggle: (d: { habit_id: string; date: string }) => Promise<{ done: boolean }>
        getAllDates: () => Promise<{ date: string }[]>
        getByHabit: (id: string) => Promise<any[]>
      }
      quests: {
        getAll: () => Promise<any[]>
        upsert: (q: any) => Promise<any>
        delete: (id: string) => Promise<any>
      }
      questTasks: {
        getAll: () => Promise<any[]>
        getByQuest: (id: string) => Promise<any[]>
        add: (t: any) => Promise<any>
        toggle: (id: string) => Promise<any>
        delete: (id: string) => Promise<any>
      }
      sessions: {
        getAll: () => Promise<any[]>
        add: (s: any) => Promise<any>
        getByDate: (date: string) => Promise<any[]>
        getLast7Days: () => Promise<any[]>
      }
      stats: {
        getAll: () => Promise<any[]>
        update: (d: { id: string; xp_gain: number }) => Promise<any>
      }
      journal: {
        getAll: () => Promise<any[]>
        upsert: (e: any) => Promise<any>
      }
      finance: {
        getAll: () => Promise<any[]>
        add: (e: any) => Promise<any>
        delete: (id: string) => Promise<any>
      }
      health: {
        getAll: () => Promise<any[]>
        upsert: (e: any) => Promise<any>
      }
      achievements: {
        getAll: () => Promise<any[]>
        unlock: (id: string) => Promise<any>
      }
      profile: {
        get: () => Promise<any>
        addXP: (xp: number) => Promise<{ leveledUp: boolean; newLevel?: number }>
        updateName: (name: string) => Promise<any>
      }
      notify: (d: { title: string; body: string }) => Promise<void>
    }
  }
}
