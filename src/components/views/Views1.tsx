import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import { useStore } from '../../store/useStore'
import { Card, SLabel, XPBar, StatRow, RadarChart, RealHeatmap, PomodoroCircle, EmptyState, MiniBarChart } from '../primitives'

function uid() { return Math.random().toString(36).slice(2) + Date.now().toString(36) }
const c = { hidden:{ opacity:0 }, show:{ opacity:1, transition:{ staggerChildren:0.06 } } }
const it = { hidden:{ opacity:0, y:14 }, show:{ opacity:1, y:0 } }

// ─── Stats ────────────────────────────────────────────────────────
export function StatsView() {
  const { stats, profile } = useStore()
  const xpPct = profile ? Math.round((profile.xp_current/(profile.level*1000))*100) : 0
  return (
    <motion.div variants={c} initial="hidden" animate="show">
      <motion.div variants={it}>
        <h2 style={{ fontSize:22, fontWeight:900, color:'#E2E8F0', letterSpacing:'-0.03em', marginBottom:2 }}>Life Stats</h2>
        <p style={{ fontSize:11, color:'#4B5563', marginBottom:20 }}>Every action shapes your character. Start logging to see growth.</p>
      </motion.div>
      <motion.div variants={it} style={{ display:'grid', gridTemplateColumns:'220px 1fr', gap:12 }}>
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          <Card style={{ padding:18, textAlign:'center' }}>
            <div style={{ width:56, height:56, borderRadius:14, margin:'0 auto 10px', background:'linear-gradient(135deg,rgba(139,92,246,0.22),rgba(76,29,149,0.22))', border:'2px solid rgba(139,92,246,0.35)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24 }}>⚡</div>
            <div style={{ fontSize:18, fontWeight:700, color:'#E2E8F0', marginBottom:2 }}>Level {profile?.level??1}</div>
            <div style={{ fontSize:11, color:'#8B5CF6', fontWeight:600, marginBottom:12 }}>{profile?.title??'Initiate'}</div>
            <XPBar pct={xpPct} height={5} />
            <div style={{ fontSize:9, color:'#4B5563', marginTop:5 }}>{profile?.xp_current??0} / {(profile?.level??1)*1000} XP</div>
            <div style={{ marginTop:12, paddingTop:10, borderTop:'1px solid rgba(255,255,255,0.04)', fontSize:10, color:'#374151' }}>
              Total XP: <span style={{ color:'#8B5CF6', fontWeight:700 }}>{(profile?.total_xp??0).toLocaleString()}</span>
            </div>
          </Card>
          <Card style={{ padding:14, textAlign:'center' }}>
            <div style={{ fontSize:9, color:'#4B5563', marginBottom:8, textTransform:'uppercase', letterSpacing:'0.08em', fontWeight:700 }}>Stat Radar</div>
            <RadarChart stats={stats} size={185} />
          </Card>
        </div>
        <Card style={{ padding:'15px 16px' }}>
          <SLabel>All Life Stats</SLabel>
          {stats.length === 0
            ? <EmptyState icon="◈" label="Stats will grow as you log habits & sessions" />
            : stats.map(s => <StatRow key={s.id} {...s} />)
          }
        </Card>
      </motion.div>
    </motion.div>
  )
}

// ─── Habits ───────────────────────────────────────────────────────
export function HabitsView() {
  const { habits, habitLogs, allHabitDates, toggleHabit, loadHabits } = useStore()
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ name:'', color:'#8B5CF6', xp:25 })
  const el = (window as any).electron
  const COLORS = ['#8B5CF6','#A78BFA','#FB7185','#34D399','#FBBF24','#F472B6','#60A5FA','#FFA07A']

  const addHabit = async () => {
    if (!form.name.trim() || !el) return
    await el.habits.upsert({ id:uid(), name:form.name, color:form.color, xp:form.xp, frequency:'daily', is_positive:1, sort_order:habits.length })
    await loadHabits()
    setForm({ name:'', color:'#8B5CF6', xp:25 }); setShowAdd(false)
  }

  const deleteHabit = async (id: string) => {
    if (!el) return
    await el.habits.delete(id)
    await loadHabits()
  }

  const habitDates = allHabitDates.map(r => r.date)

  return (
    <motion.div variants={c} initial="hidden" animate="show">
      <motion.div variants={it} style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20 }}>
        <div>
          <h2 style={{ fontSize:22, fontWeight:900, color:'#E2E8F0', letterSpacing:'-0.03em', marginBottom:2 }}>Habit Engine</h2>
          <p style={{ fontSize:11, color:'#4B5563' }}>Build systems. Become the machine.</p>
        </div>
        <button className="btn-primary" onClick={() => setShowAdd(s=>!s)}>+ New Habit</button>
      </motion.div>

      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }} exit={{ opacity:0, height:0 }}>
            <Card style={{ padding:14, marginBottom:12 }}>
              <SLabel>New Habit</SLabel>
              <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                <input className="input-field" placeholder="Habit name..." value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} style={{ flex:1 }}
                  onKeyDown={e => e.key==='Enter' && addHabit()} />
                <input type="number" className="input-field" value={form.xp} onChange={e=>setForm(f=>({...f,xp:+e.target.value}))} style={{ width:70 }} placeholder="XP" />
                <div style={{ display:'flex', gap:4 }}>
                  {COLORS.map(col => <div key={col} onClick={()=>setForm(f=>({...f,color:col}))} style={{ width:18, height:18, borderRadius:'50%', background:col, cursor:'pointer', border:form.color===col?'2px solid #fff':'2px solid transparent', transition:'all 0.15s' }} />)}
                </div>
                <button className="btn-primary" onClick={addHabit}>Add</button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div variants={it} style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        <Card style={{ padding:'14px 15px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:10 }}>
            <SLabel>Today's Habits</SLabel>
            <span style={{ fontSize:9, color:'#8B5CF6', fontWeight:700 }}>{habitLogs.length}/{habits.length}</span>
          </div>
          {habits.length === 0
            ? <EmptyState icon="◉" label="Add your first habit above" />
            : habits.map(hab => {
              const done = habitLogs.some(l => l.habit_id===hab.id)
              return (
                <motion.div key={hab.id} whileTap={{ scale:0.97 }}
                  style={{ display:'flex', alignItems:'center', gap:9, padding:'8px 10px', borderRadius:9, marginBottom:5, background:done?`${hab.color}08`:'rgba(255,255,255,0.01)', border:`1px solid ${done?hab.color+'26':'rgba(255,255,255,0.04)'}`, transition:'all 0.15s' }}>
                  <div onClick={() => toggleHabit(hab.id)} style={{ display:'contents', cursor:'pointer' }}>
                    <motion.div animate={done?{ scale:[1.3,1] }:{}}
                      style={{ width:22, height:22, borderRadius:'50%', border:`2px solid ${hab.color}`, background:done?hab.color:'transparent', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, color:'#fff', flexShrink:0, cursor:'pointer' }}>
                      {done?'✓':''}
                    </motion.div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:12, fontWeight:500, color:done?'#E2E8F0':'#4B5563' }}>{hab.name}</div>
                      <div style={{ fontSize:9, color:'#2D2D3A' }}>+{hab.xp} XP</div>
                    </div>
                  </div>
                  <button onClick={() => deleteHabit(hab.id)} style={{ fontSize:14, color:'#2D2D3A', background:'none', border:'none', cursor:'pointer', padding:'0 4px', lineHeight:1 }}>×</button>
                </motion.div>
              )
            })
          }
        </Card>

        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          <Card style={{ padding:'14px 15px' }}>
            <SLabel>Activity Heatmap</SLabel>
            <RealHeatmap dates={habitDates} weeks={15} />
            <div style={{ display:'flex', justifyContent:'flex-end', alignItems:'center', gap:4, marginTop:8 }}>
              <span style={{ fontSize:8, color:'#374151' }}>None</span>
              <div style={{ width:9, height:9, borderRadius:2, background:'rgba(139,92,246,0.06)' }} />
              <div style={{ width:9, height:9, borderRadius:2, background:'rgba(139,92,246,0.85)' }} />
              <span style={{ fontSize:8, color:'#374151' }}>Active</span>
            </div>
          </Card>
          <Card style={{ padding:'14px 15px' }}>
            <SLabel>Habit Summary</SLabel>
            {habits.length === 0
              ? <EmptyState icon="◉" label="No habits yet" />
              : habits.map(h => (
                <div key={h.id} style={{ display:'flex', alignItems:'center', gap:8, padding:'5px 0', borderBottom:'1px solid rgba(255,255,255,0.03)' }}>
                  <div style={{ width:6, height:6, borderRadius:'50%', background:h.color, flexShrink:0 }} />
                  <span style={{ flex:1, fontSize:11, color:'#94A3B8' }}>{h.name}</span>
                  <span style={{ fontSize:9, color:'#6D28D9', fontWeight:600 }}>+{h.xp}xp</span>
                </div>
              ))
            }
          </Card>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── Quests ───────────────────────────────────────────────────────
export function QuestsView() {
  const { quests, questTasks, loadQuests, toggleQuestTask, addQuestTask, deleteQuestTask } = useStore()
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ title:'', type:'MAIN', xp:1000, deadline:'', notes:'' })
  const [expandedQuest, setExpandedQuest] = useState<string|null>(null)
  const [newTaskInputs, setNewTaskInputs] = useState<Record<string,string>>({})
  const el = (window as any).electron
  const TYPES = ['MAIN','SIDE','DAILY','WEEKLY']
  const QC: Record<string,string> = { MAIN:'#A78BFA', SIDE:'#FB7185', DAILY:'#34D399', WEEKLY:'#FBBF24' }

  const addQuest = async () => {
    if (!form.title.trim() || !el) return
    await el.quests.upsert({ id:uid(), ...form, progress:0 })
    await loadQuests()
    setForm({ title:'', type:'MAIN', xp:1000, deadline:'', notes:'' }); setShowAdd(false)
  }

  const deleteQuest = async (id: string) => {
    if (!el) return
    await el.quests.delete(id)
    await loadQuests()
  }

  const handleAddTask = async (questId: string) => {
    const title = (newTaskInputs[questId]||'').trim()
    if (!title) return
    await addQuestTask(questId, title)
    setNewTaskInputs(p => ({ ...p, [questId]:'' }))
  }

  return (
    <motion.div variants={c} initial="hidden" animate="show">
      <motion.div variants={it} style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20 }}>
        <div>
          <h2 style={{ fontSize:22, fontWeight:900, color:'#E2E8F0', letterSpacing:'-0.03em', marginBottom:2 }}>Quest Board</h2>
          <p style={{ fontSize:11, color:'#4B5563' }}>Goals with mini-steps. Progress auto-calculated from tasks.</p>
        </div>
        <button className="btn-primary" onClick={() => setShowAdd(s=>!s)}>+ New Quest</button>
      </motion.div>

      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }} exit={{ opacity:0, height:0 }}>
            <Card style={{ padding:14, marginBottom:14 }}>
              <SLabel>New Quest</SLabel>
              <div style={{ display:'grid', gridTemplateColumns:'1fr auto auto', gap:8, marginBottom:8 }}>
                <input className="input-field" placeholder="Quest title..." value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))}
                  onKeyDown={e=>e.key==='Enter'&&addQuest()} />
                <select className="input-field" value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))} style={{ width:95 }}>
                  {TYPES.map(t=><option key={t}>{t}</option>)}
                </select>
                <input type="number" className="input-field" value={form.xp} onChange={e=>setForm(f=>({...f,xp:+e.target.value}))} style={{ width:80 }} placeholder="XP" />
              </div>
              <div style={{ display:'flex', gap:8 }}>
                <input className="input-field" type="date" value={form.deadline} onChange={e=>setForm(f=>({...f,deadline:e.target.value}))} style={{ flex:1 }} />
                <button className="btn-primary" onClick={addQuest}>Add Quest</button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {quests.length === 0 && !showAdd && (
        <Card style={{ padding:40, textAlign:'center' }}>
          <EmptyState icon="◆" label="No quests yet. Add your first quest above!" />
        </Card>
      )}

      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {quests.map(q => {
          const qc = QC[q.type]||'#94A3B8'
          const tasks = questTasks.filter(t => t.quest_id===q.id)
          const doneTasks = tasks.filter(t => t.done)
          const isExpanded = expandedQuest === q.id

          return (
            <motion.div key={q.id} variants={it} layout>
              <Card style={{ padding:'14px 16px' }}>
                {/* Quest header */}
                <div style={{ display:'flex', alignItems:'flex-start', gap:10, marginBottom:10 }}>
                  <div style={{ flex:1 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:5 }}>
                      <span className={`badge quest-type-${q.type.toLowerCase()}`}>{q.type}</span>
                      {q.deadline && <span style={{ fontSize:9, color:'#374151' }}>Due {q.deadline}</span>}
                      <span style={{ fontSize:9, color:'#FBBF24', fontWeight:700, marginLeft:'auto' }}>+{q.xp.toLocaleString()} XP</span>
                    </div>
                    <div style={{ fontSize:14, fontWeight:600, color:'#E2E8F0', marginBottom:8 }}>{q.title}</div>
                    {/* Progress bar — auto from tasks */}
                    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                      <div style={{ flex:1, height:5, background:'rgba(255,255,255,0.05)', borderRadius:99, overflow:'hidden' }}>
                        <motion.div initial={{ width:0 }} animate={{ width:`${q.progress}%` }} transition={{ duration:0.8 }}
                          style={{ height:'100%', background:`linear-gradient(90deg,${qc},${qc}88)`, borderRadius:99, boxShadow:`0 0 6px ${qc}55` }} />
                      </div>
                      <span style={{ fontSize:11, fontWeight:700, color:qc, minWidth:30 }}>{q.progress}%</span>
                      <span style={{ fontSize:9, color:'#374151' }}>{doneTasks.length}/{tasks.length} steps</span>
                    </div>
                  </div>
                  <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                    <button onClick={() => setExpandedQuest(isExpanded ? null : q.id)}
                      style={{ fontSize:11, padding:'4px 10px', borderRadius:7, border:'1px solid rgba(139,92,246,0.2)', background:'rgba(139,92,246,0.07)', color:'#A78BFA', cursor:'pointer', transition:'all 0.15s' }}>
                      {isExpanded ? 'Hide' : 'Steps'}
                    </button>
                    <button onClick={() => deleteQuest(q.id)} className="btn-danger" style={{ padding:'4px 8px', fontSize:11 }}>×</button>
                  </div>
                </div>

                {/* Mini-steps panel */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }} exit={{ opacity:0, height:0 }}
                      style={{ borderTop:'1px solid rgba(255,255,255,0.05)', paddingTop:12, marginTop:4 }}>
                      <div style={{ fontSize:9, color:'#4B5563', marginBottom:8, textTransform:'uppercase', letterSpacing:'0.07em', fontWeight:700 }}>Mini-Steps</div>

                      {tasks.length === 0
                        ? <div style={{ fontSize:11, color:'#2D2D3A', marginBottom:10 }}>No steps yet — add the first one below.</div>
                        : tasks.map(task => (
                          <motion.div key={task.id} layout
                            style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 0', borderBottom:'1px solid rgba(255,255,255,0.03)' }}>
                            <motion.div whileTap={{ scale:0.9 }} onClick={() => toggleQuestTask(task.id)}
                              style={{ width:18, height:18, borderRadius:4, border:`1.5px solid ${task.done?qc:'rgba(255,255,255,0.12)'}`, background:task.done?qc:'transparent', display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, color:'#fff', flexShrink:0, cursor:'pointer', transition:'all 0.15s' }}>
                              {task.done ? '✓' : ''}
                            </motion.div>
                            <span style={{ flex:1, fontSize:11, color:task.done?'#4B5563':'#CBD5E1', textDecoration:task.done?'line-through':'none', transition:'all 0.15s' }}>{task.title}</span>
                            <button onClick={() => deleteQuestTask(task.id)} style={{ fontSize:13, color:'#2D2D3A', background:'none', border:'none', cursor:'pointer', padding:'0 4px', lineHeight:1 }}>×</button>
                          </motion.div>
                        ))
                      }

                      {/* Add step input */}
                      <div style={{ display:'flex', gap:6, marginTop:10 }}>
                        <input className="input-field" placeholder="Add a new step..." style={{ flex:1 }}
                          value={newTaskInputs[q.id]||''}
                          onChange={e => setNewTaskInputs(p=>({...p,[q.id]:e.target.value}))}
                          onKeyDown={e => e.key==='Enter' && handleAddTask(q.id)} />
                        <button className="btn-primary" style={{ padding:'6px 12px', fontSize:11 }} onClick={() => handleAddTask(q.id)}>Add</button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}

// ─── Deep Work ────────────────────────────────────────────────────
export function DeepWorkView() {
  const { sessions, addSession } = useStore()
  const [running, setRunning] = useState(false)
  const [secs, setSecs] = useState(25*60)
  const [mode, setMode] = useState<'focus'|'break'>('focus')
  const [sessCount, setSessCount] = useState(0)
  const [task, setTask] = useState('')
  const [type, setType] = useState('Deep Work')
  const timerRef = useRef<NodeJS.Timeout|null>(null)
  const el = (window as any).electron

  const today = format(new Date(), 'yyyy-MM-dd')
  const todaySessions = sessions.filter(s => s.started_at.startsWith(today))
  const totalMins = todaySessions.reduce((a,s) => a+s.duration_mins, 0)

  // Build last 7 days chart from real sessions
  const last7 = Array.from({ length:7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate()-6+i)
    const ds = d.toISOString().slice(0,10)
    const label = d.toLocaleDateString('en',{ weekday:'short' })
    const mins = sessions.filter(s=>s.started_at.startsWith(ds)).reduce((a,s)=>a+s.duration_mins,0)
    return { label, mins }
  })

  const total = mode==='focus'?25*60:5*60
  const progress = 1-(secs/total)

  useEffect(() => {
    if (!running) return
    timerRef.current = setInterval(() => {
      setSecs(s => {
        if (s <= 1) {
          setRunning(false)
          if (mode==='focus') {
            setSessCount(n=>n+1)
            addSession({ task:task||'Focus Session', duration_mins:25, type, started_at:new Date().toISOString() })
            setMode('break'); return 5*60
          } else { setMode('focus'); return 25*60 }
        }
        return s-1
      })
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [running, mode, task, type])

  const mm = String(Math.floor(secs/60)).padStart(2,'0')
  const ss2 = String(secs%60).padStart(2,'0')

  const logManual = async () => {
    if (!task.trim() || !el) return
    await addSession({ task, duration_mins:25, type, started_at:new Date().toISOString() })
    setTask('')
  }

  return (
    <motion.div variants={c} initial="hidden" animate="show">
      <motion.div variants={it}>
        <h2 style={{ fontSize:22, fontWeight:900, color:'#E2E8F0', letterSpacing:'-0.03em', marginBottom:2 }}>Deep Work</h2>
        <p style={{ fontSize:11, color:'#4B5563', marginBottom:20 }}>Enter flow state. Every logged session builds real data.</p>
      </motion.div>
      <motion.div variants={it} style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        <Card style={{ padding:22, display:'flex', flexDirection:'column', alignItems:'center' }}>
          <div style={{ display:'flex', gap:6, marginBottom:20 }}>
            {(['focus','break'] as const).map(m => (
              <button key={m} onClick={() => { setMode(m); setRunning(false); setSecs(m==='focus'?25*60:5*60) }}
                style={{ padding:'5px 14px', borderRadius:7, border:'1px solid', fontSize:10, fontWeight:700, letterSpacing:'0.05em', textTransform:'uppercase', background:mode===m?'rgba(139,92,246,0.12)':'transparent', borderColor:mode===m?'rgba(139,92,246,0.35)':'rgba(255,255,255,0.07)', color:mode===m?'#A78BFA':'#4B5563' }}>
                {m==='focus'?'Focus':'Break'}
              </button>
            ))}
          </div>
          <PomodoroCircle progress={progress} size={168}>
            <div style={{ fontSize:34, fontWeight:700, color:running?'#8B5CF6':'#E2E8F0', letterSpacing:'-0.02em', fontVariantNumeric:'tabular-nums' }}>{mm}:{ss2}</div>
            <div style={{ fontSize:9, color:'#4B5563', textTransform:'uppercase', letterSpacing:'0.08em', marginTop:3 }}>{mode}</div>
          </PomodoroCircle>
          <div style={{ width:'100%', marginTop:16 }}>
            <input className="input-field" placeholder="What are you working on?" value={task} onChange={e=>setTask(e.target.value)} style={{ marginBottom:8 }} />
            <select className="input-field" value={type} onChange={e=>setType(e.target.value)} style={{ marginBottom:12 }}>
              {['Deep Work','Study','Coding','Writing','Design','Research','Reading'].map(t=><option key={t}>{t}</option>)}
            </select>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button className="btn-primary" style={{ padding:'9px 24px', fontSize:13 }} onClick={() => setRunning(r=>!r)}>{running?'⏸ Pause':'▶ Start'}</button>
            <button className="btn-ghost" style={{ padding:'9px 14px', fontSize:13 }} onClick={() => { setRunning(false); setSecs(mode==='focus'?25*60:5*60) }}>↺</button>
            <button className="btn-ghost" style={{ padding:'9px 14px', fontSize:11 }} onClick={logManual} title="Log session manually">✓ Log</button>
          </div>
          <div style={{ display:'flex', gap:24, marginTop:20, paddingTop:16, borderTop:'1px solid rgba(255,255,255,0.05)', width:'100%', justifyContent:'center' }}>
            {[['Sessions',sessCount,'#A78BFA'],['Today Mins',totalMins,'#8B5CF6']].map(([l,v,col])=>(
              <div key={l as string} style={{ textAlign:'center' }}>
                <div style={{ fontSize:26, fontWeight:700, color:col as string }}>{v as number}</div>
                <div style={{ fontSize:9, color:'#4B5563', marginTop:2, textTransform:'uppercase', letterSpacing:'0.06em' }}>{l as string}</div>
              </div>
            ))}
          </div>
        </Card>

        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          <Card style={{ padding:'14px 15px' }}>
            <SLabel>Focus Minutes — Last 7 Days (Real Data)</SLabel>
            {last7.every(d=>d.mins===0)
              ? <EmptyState icon="◎" label="Log sessions to see real chart data" />
              : <MiniBarChart data={last7} dataKey="mins" color="#8B5CF6" maxH={90} />
            }
          </Card>
          <Card style={{ padding:'14px 15px' }}>
            <SLabel>Today's Sessions</SLabel>
            {todaySessions.length===0
              ? <EmptyState icon="◎" label="No sessions today yet" />
              : todaySessions.slice(0,5).map(s=>(
                <div key={s.id} style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 0', borderBottom:'1px solid rgba(255,255,255,0.03)' }}>
                  <div style={{ width:33, height:33, borderRadius:7, background:'rgba(139,92,246,0.07)', border:'1px solid rgba(139,92,246,0.15)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, color:'#8B5CF6', fontWeight:700, flexShrink:0 }}>{s.duration_mins}m</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:12, color:'#E2E8F0', fontWeight:500 }}>{s.task}</div>
                    <div style={{ fontSize:9, color:'#4B5563' }}>{s.type}</div>
                  </div>
                </div>
              ))
            }
          </Card>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── Health ───────────────────────────────────────────────────────
export function HealthView() {
  const { health, upsertHealthLog } = useStore()
  const [form, setForm] = useState({ date:format(new Date(),'yyyy-MM-dd'), steps:0, calories:0, sleep_hours:7, sleep_quality:7, water_ml:0, workout:0, workout_type:'', weight_kg:0 })

  const recent = health.slice(0,7).reverse()
  const sleepData = recent.map(h=>({ label:h.date.slice(5), sleep_hours:h.sleep_hours }))
  const stepsData = recent.map(h=>({ label:h.date.slice(5), steps:h.steps }))

  return (
    <motion.div variants={c} initial="hidden" animate="show">
      <motion.div variants={it}>
        <h2 style={{ fontSize:22, fontWeight:900, color:'#E2E8F0', letterSpacing:'-0.03em', marginBottom:2 }}>Health & Fitness</h2>
        <p style={{ fontSize:11, color:'#4B5563', marginBottom:20 }}>Track your body. Build the baseline.</p>
      </motion.div>
      <motion.div variants={it} style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        <Card style={{ padding:'14px 16px' }}>
          <SLabel>Log Today</SLabel>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:10 }}>
            {[
              { label:'Steps', key:'steps' },{ label:'Calories', key:'calories' },
              { label:'Sleep (hrs)', key:'sleep_hours' },{ label:'Sleep Quality /10', key:'sleep_quality' },
              { label:'Water (ml)', key:'water_ml' },{ label:'Weight (kg)', key:'weight_kg' },
            ].map(f=>(
              <div key={f.key}>
                <div style={{ fontSize:9, color:'#4B5563', marginBottom:3 }}>{f.label}</div>
                <input className="input-field" type="number" value={(form as any)[f.key]} onChange={e=>setForm(p=>({...p,[f.key]:+e.target.value}))} />
              </div>
            ))}
          </div>
          <div style={{ display:'flex', gap:8, marginBottom:10 }}>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:9, color:'#4B5563', marginBottom:3 }}>Workout Type</div>
              <input className="input-field" placeholder="e.g. Chest, Run..." value={form.workout_type} onChange={e=>setForm(p=>({...p,workout_type:e.target.value}))} />
            </div>
            <div>
              <div style={{ fontSize:9, color:'#4B5563', marginBottom:3 }}>Worked out?</div>
              <button onClick={()=>setForm(p=>({...p,workout:p.workout?0:1}))} style={{ padding:'7px 14px', borderRadius:8, border:'1px solid', fontSize:11, fontWeight:600, background:form.workout?'rgba(52,211,153,0.1)':'transparent', borderColor:form.workout?'#34D399':'rgba(255,255,255,0.07)', color:form.workout?'#34D399':'#4B5563' }}>
                {form.workout?'✓ Yes':'No'}
              </button>
            </div>
          </div>
          <button className="btn-primary" style={{ width:'100%', padding:'9px', fontSize:12 }} onClick={()=>upsertHealthLog(form)}>Save Today's Log</button>
        </Card>
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {health.length===0
            ? <Card style={{ padding:40 }}><EmptyState icon="♥" label="Log your first health entry to see charts" /></Card>
            : (
              <>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:9 }}>
                  {[
                    { label:'Avg Sleep', val:(health.slice(0,7).reduce((a,h)=>a+h.sleep_hours,0)/Math.max(health.slice(0,7).length,1)).toFixed(1)+'h', color:'#A78BFA' },
                    { label:'Avg Steps', val:Math.round(health.slice(0,7).reduce((a,h)=>a+h.steps,0)/Math.max(health.slice(0,7).length,1)).toLocaleString(), color:'#34D399' },
                    { label:'Workouts', val:health.slice(0,7).filter(h=>h.workout).length+'', color:'#FB7185' },
                    { label:'Avg Water', val:Math.round(health.slice(0,7).reduce((a,h)=>a+h.water_ml,0)/Math.max(health.slice(0,7).length,1))+'ml', color:'#60A5FA' },
                  ].map(s=>(
                    <Card key={s.label} style={{ padding:'11px 13px' }}>
                      <div style={{ fontSize:9, color:'#4B5563', marginBottom:4, textTransform:'uppercase', letterSpacing:'0.06em' }}>{s.label}</div>
                      <div style={{ fontSize:20, fontWeight:700, color:s.color }}>{s.val}</div>
                    </Card>
                  ))}
                </div>
                {sleepData.some(d=>d.sleep_hours>0) && <Card style={{ padding:'14px 15px' }}><SLabel>Sleep (hrs)</SLabel><MiniBarChart data={sleepData} dataKey="sleep_hours" color="#A78BFA" maxH={80} /></Card>}
                {stepsData.some(d=>d.steps>0) && <Card style={{ padding:'14px 15px' }}><SLabel>Steps</SLabel><MiniBarChart data={stepsData} dataKey="steps" color="#34D399" maxH={80} /></Card>}
              </>
            )
          }
        </div>
      </motion.div>
    </motion.div>
  )
}
