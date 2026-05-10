import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electron', {
  minimize: () => ipcRenderer.send('win:minimize'),
  maximize: () => ipcRenderer.send('win:maximize'),
  close: () => ipcRenderer.send('win:close'),

  habits: {
    getAll: () => ipcRenderer.invoke('db:habits:getAll'),
    upsert: (h: any) => ipcRenderer.invoke('db:habits:upsert', h),
    delete: (id: string) => ipcRenderer.invoke('db:habits:delete', id),
  },
  habitLogs: {
    getByDate: (date: string) => ipcRenderer.invoke('db:habit_logs:getByDate', date),
    toggle: (d: any) => ipcRenderer.invoke('db:habit_logs:toggle', d),
    getAllDates: () => ipcRenderer.invoke('db:habit_logs:getAllDates'),
    getByHabit: (id: string) => ipcRenderer.invoke('db:habit_logs:getByHabit', id),
  },
  quests: {
    getAll: () => ipcRenderer.invoke('db:quests:getAll'),
    upsert: (q: any) => ipcRenderer.invoke('db:quests:upsert', q),
    delete: (id: string) => ipcRenderer.invoke('db:quests:delete', id),
  },
  questTasks: {
    getAll: () => ipcRenderer.invoke('db:quest_tasks:getAll'),
    getByQuest: (id: string) => ipcRenderer.invoke('db:quest_tasks:getByQuest', id),
    add: (t: any) => ipcRenderer.invoke('db:quest_tasks:add', t),
    toggle: (id: string) => ipcRenderer.invoke('db:quest_tasks:toggle', id),
    delete: (id: string) => ipcRenderer.invoke('db:quest_tasks:delete', id),
  },
  sessions: {
    getAll: () => ipcRenderer.invoke('db:sessions:getAll'),
    add: (s: any) => ipcRenderer.invoke('db:sessions:add', s),
    getByDate: (date: string) => ipcRenderer.invoke('db:sessions:getByDate', date),
    getLast7Days: () => ipcRenderer.invoke('db:sessions:getLast7Days'),
  },
  stats: {
    getAll: () => ipcRenderer.invoke('db:stats:getAll'),
    update: (d: any) => ipcRenderer.invoke('db:stats:update', d),
  },
  journal: {
    getAll: () => ipcRenderer.invoke('db:journal:getAll'),
    upsert: (e: any) => ipcRenderer.invoke('db:journal:upsert', e),
  },
  finance: {
    getAll: () => ipcRenderer.invoke('db:finance:getAll'),
    add: (e: any) => ipcRenderer.invoke('db:finance:add', e),
    delete: (id: string) => ipcRenderer.invoke('db:finance:delete', id),
  },
  health: {
    getAll: () => ipcRenderer.invoke('db:health:getAll'),
    upsert: (e: any) => ipcRenderer.invoke('db:health:upsert', e),
  },
  achievements: {
    getAll: () => ipcRenderer.invoke('db:achievements:getAll'),
    unlock: (id: string) => ipcRenderer.invoke('db:achievements:unlock', id),
  },
  profile: {
    get: () => ipcRenderer.invoke('db:profile:get'),
    addXP: (xp: number) => ipcRenderer.invoke('db:profile:addXP', xp),
    updateName: (name: string) => ipcRenderer.invoke('db:profile:updateName', name),
  },
  notify: (d: any) => ipcRenderer.invoke('notify', d),
})
