import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import { useStore } from '../../store/useStore'
import { Card, XPBar, SLabel, RealHeatmap, EmptyState } from '../primitives'

const c = { hidden:{ opacity:0 }, show:{ opacity:1, transition:{ staggerChildren:0.06 } } }
const i = { hidden:{ opacity:0, y:14 }, show:{ opacity:1, y:0 } }

export default function HomeView() {
  const { habits, habitLogs, allHabitDates, quests, sessions, profile, toggleHabit } = useStore()
  const [time, setTime] = useState(new Date())
  useEffect(() => { const t = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(t) }, [])

  const h = time.getHours()
  const greet = h < 5 ? 'Late night' : h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
  const today = format(new Date(), 'yyyy-MM-dd')
  const todaySessions = sessions.filter(s => s.started_at.startsWith(today))
  const focusMins = todaySessions.reduce((a,s) => a+s.duration_mins, 0)
  const xpPct = profile ? Math.round((profile.xp_current / (profile.level*1000))*100) : 0
  const habitDates = allHabitDates.map(r => r.date)

  return (
    <motion.div variants={c} initial="hidden" animate="show">
      {/* Header */}
      <motion.div variants={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20 }}>
        <div>
          <p style={{ fontSize:11, color:'#4B5563', marginBottom:3 }}>{greet}, Commander</p>
          <h1 style={{ fontSize:24, fontWeight:900, color:'#E2E8F0', letterSpacing:'-0.03em', lineHeight:1.1 }}>Command Center</h1>
          <p style={{ fontSize:11, color:'#2D2D3A', marginTop:2 }}>{time.toLocaleDateString('en-US',{ weekday:'long', month:'long', day:'numeric' })}</p>
        </div>
        <div style={{ textAlign:'right' }}>
          <div className="glow-text" style={{ fontSize:30, fontWeight:700, color:'#8B5CF6', fontVariantNumeric:'tabular-nums', letterSpacing:'-0.03em', lineHeight:1 }}>
            {time.toLocaleTimeString([],{ hour:'2-digit', minute:'2-digit', second:'2-digit' })}
          </div>
          <div style={{ fontSize:9, color:'#4B5563', marginTop:3 }}>LOCAL TIME</div>
        </div>
      </motion.div>

      {/* Level bar */}
      <motion.div variants={i}>
        <Card style={{ padding:'13px 16px', marginBottom:12 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ width:38, height:38, borderRadius:9, background:'linear-gradient(135deg,rgba(139,92,246,0.22),rgba(76,29,149,0.22))', border:'1px solid rgba(139,92,246,0.35)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, fontWeight:900, color:'#A78BFA' }}>
                {profile?.level??1}
              </div>
              <div>
                <div style={{ fontSize:13, fontWeight:700, color:'#E2E8F0' }}>{profile?.title??'Initiate'}</div>
                <div style={{ fontSize:9, color:'#4B5563' }}>Level {profile?.level??1} · {(profile?.total_xp??0).toLocaleString()} Total XP</div>
              </div>
            </div>
            <div style={{ textAlign:'right' }}>
              <div style={{ fontSize:9, color:'#4B5563', marginBottom:1 }}>NEXT LEVEL</div>
              <div style={{ fontSize:13, color:'#8B5CF6', fontWeight:700 }}>{profile?.xp_current??0} / {(profile?.level??1)*1000} XP</div>
            </div>
          </div>
          <XPBar pct={xpPct} height={6} />
        </Card>
      </motion.div>

      {/* Stat chips */}
      <motion.div variants={i} style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:9, marginBottom:12 }}>
        {[
          { label:'Habits Done', val:`${habitLogs.length}/${habits.length}`, color:'#8B5CF6' },
          { label:'Focus Today', val:`${Math.floor(focusMins/60)}h ${focusMins%60}m`, color:'#A78BFA' },
          { label:'Active Quests', val:`${quests.length}`, color:'#FBBF24' },
          { label:'Daily Score', val:`${habits.length ? Math.round((habitLogs.length/habits.length)*100) : 0}`, sub:'/100', color:'#34D399' },
        ].map(s => (
          <Card key={s.label} style={{ padding:'12px 14px' }}>
            <div style={{ fontSize:9, color:'#4B5563', marginBottom:5, textTransform:'uppercase', letterSpacing:'0.06em' }}>{s.label}</div>
            <div style={{ fontSize:21, fontWeight:700, color:s.color, lineHeight:1 }}>{s.val}<span style={{ fontSize:9, color:'#374151' }}>{s.sub}</span></div>
          </Card>
        ))}
      </motion.div>

      {/* Habits + Quests */}
      <motion.div variants={i} style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
        <Card style={{ padding:'14px 15px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
            <SLabel>Today's Habits</SLabel>
            <span style={{ fontSize:9, color:'#8B5CF6', fontWeight:700 }}>{habitLogs.length}/{habits.length}</span>
          </div>
          {habits.length === 0
            ? <EmptyState icon="◉" label="Add habits to get started" />
            : habits.slice(0,7).map(hab => {
              const done = habitLogs.some(l => l.habit_id === hab.id)
              return (
                <motion.div key={hab.id} whileTap={{ scale:0.97 }} onClick={() => toggleHabit(hab.id)}
                  style={{ display:'flex', alignItems:'center', gap:9, padding:'7px 9px', borderRadius:8, marginBottom:4, cursor:'pointer', background:done?`${hab.color}08`:'transparent', border:`1px solid ${done?hab.color+'28':'rgba(255,255,255,0.04)'}`, transition:'all 0.15s' }}>
                  <motion.div animate={done?{ scale:[1.25,1] }:{}} style={{ width:20, height:20, borderRadius:'50%', border:`2px solid ${hab.color}`, background:done?hab.color:'transparent', display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, color:'#fff', flexShrink:0, transition:'all 0.15s' }}>
                    {done ? '✓' : ''}
                  </motion.div>
                  <span style={{ flex:1, fontSize:11.5, color:done?'#E2E8F0':'#4B5563', transition:'color 0.15s' }}>{hab.name}</span>
                  <span style={{ fontSize:9, color:'#6D28D9', fontWeight:600 }}>+{hab.xp}xp</span>
                </motion.div>
              )
            })
          }
        </Card>

        <Card style={{ padding:'14px 15px' }}>
          <SLabel>Active Quests</SLabel>
          {quests.length === 0
            ? <EmptyState icon="◆" label="No quests yet — add one!" />
            : quests.slice(0,4).map(q => {
              const clr: Record<string,string> = { MAIN:'#A78BFA', SIDE:'#FB7185', DAILY:'#34D399', WEEKLY:'#FBBF24' }
              const qc = clr[q.type]||'#94A3B8'
              return (
                <div key={q.id} style={{ padding:'8px 10px', borderRadius:9, background:'rgba(255,255,255,0.015)', border:'1px solid rgba(255,255,255,0.04)', marginBottom:6 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                    <span style={{ fontSize:11.5, fontWeight:500, color:'#CBD5E1' }}>{q.title}</span>
                    <span style={{ fontSize:8, color:qc, fontWeight:700 }}>{q.type}</span>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                    <div style={{ flex:1, height:3, background:'rgba(255,255,255,0.05)', borderRadius:99, overflow:'hidden' }}>
                      <motion.div initial={{ width:0 }} animate={{ width:`${q.progress}%` }} transition={{ duration:1 }}
                        style={{ height:'100%', background:qc, borderRadius:99 }} />
                    </div>
                    <span style={{ fontSize:9, color:'#4B5563', minWidth:24 }}>{q.progress}%</span>
                  </div>
                </div>
              )
            })
          }
        </Card>
      </motion.div>

      {/* Heatmap — real data */}
      <motion.div variants={i}>
        <Card style={{ padding:'14px 15px' }}>
          <SLabel>Activity Heatmap — Past {17} Weeks</SLabel>
          <RealHeatmap dates={habitDates} weeks={17} />
          <div style={{ display:'flex', justifyContent:'flex-end', alignItems:'center', gap:4, marginTop:8 }}>
            <span style={{ fontSize:8, color:'#374151' }}>No activity</span>
            <div style={{ width:9, height:9, borderRadius:2, background:'rgba(139,92,246,0.06)' }} />
            <div style={{ width:9, height:9, borderRadius:2, background:'rgba(139,92,246,0.85)' }} />
            <span style={{ fontSize:8, color:'#374151' }}>Active</span>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  )
}
