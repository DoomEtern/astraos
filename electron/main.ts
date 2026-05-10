import { app, BrowserWindow, ipcMain, shell, Notification } from 'electron'
import { join } from 'path'
import {
  initDb, saveNow,
  dbHabits, dbHabitLogs, dbQuests, dbQuestTasks,
  dbSessions, dbStats, dbJournal, dbFinance, dbHealth,
  dbAchievements, dbProfile
} from './database'

const isDev = process.env.NODE_ENV === 'development'
let win: BrowserWindow | null = null

function createWindow() {
  win = new BrowserWindow({
    width: 1400, height: 900, minWidth: 1100, minHeight: 700,
    frame: false, titleBarStyle: 'hidden', backgroundColor: '#06040F',
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    show: false,
  })
  win.once('ready-to-show', () => win?.show())
  if (isDev) {
    win.loadURL('http://localhost:5173')
    win.webContents.openDevTools({ mode: 'detach' })
  } else {
    win.loadFile(join(__dirname, '../dist/index.html'))
  }
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })
}

app.whenReady().then(async () => {
  try {
    console.log('[AstraOS] Initializing database...')
    await initDb()
    console.log('[AstraOS] Database ready.')
  } catch (err) {
    console.error('[AstraOS] DATABASE INIT FAILED:', err)
    app.quit()
    return
  }
  createWindow()
})

app.on('window-all-closed', () => { saveNow(); if (process.platform !== 'darwin') app.quit() })

ipcMain.on('win:minimize', () => win?.minimize())
ipcMain.on('win:maximize', () => win?.isMaximized() ? win?.unmaximize() : win?.maximize())
ipcMain.on('win:close', () => { saveNow(); win?.close() })

ipcMain.handle('db:habits:getAll', () => dbHabits.getAll())
ipcMain.handle('db:habits:upsert', (_, h) => dbHabits.upsert(h))
ipcMain.handle('db:habits:delete', (_, id) => dbHabits.delete(id))

ipcMain.handle('db:habit_logs:getByDate', (_, date) => dbHabitLogs.getByDate(date))
ipcMain.handle('db:habit_logs:toggle', (_, { habit_id, date }) => dbHabitLogs.toggle(habit_id, date))
ipcMain.handle('db:habit_logs:getAllDates', () => dbHabitLogs.getAllDates())
ipcMain.handle('db:habit_logs:getByHabit', (_, habit_id) => dbHabitLogs.getByHabit(habit_id))

ipcMain.handle('db:quests:getAll', () => dbQuests.getAll())
ipcMain.handle('db:quests:upsert', (_, q) => dbQuests.upsert(q))
ipcMain.handle('db:quests:delete', (_, id) => dbQuests.delete(id))

ipcMain.handle('db:quest_tasks:getAll', () => dbQuestTasks.getAll())
ipcMain.handle('db:quest_tasks:getByQuest', (_, id) => dbQuestTasks.getByQuest(id))
ipcMain.handle('db:quest_tasks:add', (_, t) => dbQuestTasks.add(t))
ipcMain.handle('db:quest_tasks:toggle', (_, id) => dbQuestTasks.toggle(id))
ipcMain.handle('db:quest_tasks:delete', (_, id) => dbQuestTasks.delete(id))

ipcMain.handle('db:sessions:getAll', () => dbSessions.getAll())
ipcMain.handle('db:sessions:add', (_, s) => dbSessions.add(s))
ipcMain.handle('db:sessions:getByDate', (_, date) => dbSessions.getByDate(date))
ipcMain.handle('db:sessions:getLast7Days', () => dbSessions.getLast7Days())

ipcMain.handle('db:stats:getAll', () => dbStats.getAll())
ipcMain.handle('db:stats:update', (_, { id, xp_gain }) => dbStats.update(id, xp_gain))

ipcMain.handle('db:journal:getAll', () => dbJournal.getAll())
ipcMain.handle('db:journal:upsert', (_, e) => dbJournal.upsert(e))

ipcMain.handle('db:finance:getAll', () => dbFinance.getAll())
ipcMain.handle('db:finance:add', (_, e) => dbFinance.add(e))
ipcMain.handle('db:finance:delete', (_, id) => dbFinance.delete(id))

ipcMain.handle('db:health:getAll', () => dbHealth.getAll())
ipcMain.handle('db:health:upsert', (_, e) => dbHealth.upsert(e))

ipcMain.handle('db:achievements:getAll', () => dbAchievements.getAll())
ipcMain.handle('db:achievements:unlock', (_, id) => dbAchievements.unlock(id))

ipcMain.handle('db:profile:get', () => dbProfile.get())
ipcMain.handle('db:profile:addXP', (_, xp) => dbProfile.addXP(xp))
ipcMain.handle('db:profile:updateName', (_, name) => dbProfile.updateName(name))

ipcMain.handle('notify', (_, { title, body }) => {
  if (Notification.isSupported()) new Notification({ title, body }).show()
})
