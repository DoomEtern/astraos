import { useState } from 'react'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import { useStore } from '../../store/useStore'
import { Card, SLabel, XPBar, Badge, EmptyState, MiniBarChart, RealHeatmap } from '../primitives'

const cv = { hidden:{ opacity:0 }, show:{ opacity:1, transition:{ staggerChildren:0.06 } } }
const it = { hidden:{ opacity:0, y:14 }, show:{ opacity:1, y:0 } }

const CATS = ['Food','Transport','Entertainment','Health','Education','Utilities','Clothing','Investment','Income','Other']
const CAT_COLORS: Record<string,string> = { Food:'#FB7185', Transport:'#60A5FA', Entertainment:'#A78BFA', Health:'#34D399', Education:'#8B5CF6', Utilities:'#FBBF24', Clothing:'#F472B6', Investment:'#34D399', Income:'#34D399', Other:'#94A3B8' }

export function FinanceView() {
  const { finance, addFinanceEntry, loadFinance } = useStore()
  const [form, setForm] = useState({ type:'expense', amount:'', category:'Food', note:'', date:format(new Date(),'yyyy-MM-dd') })
  const el = (window as any).electron

  const add = async () => {
    if (!form.amount) return
    await addFinanceEntry({ ...form, amount:parseFloat(form.amount) })
    setForm(f=>({...f,amount:'',note:''}))
  }
  const del = async (id: string) => { if (!el) return; await el.finance.delete(id); await loadFinance() }

  const totalIn = finance.filter(f=>f.type==='income').reduce((a,f)=>a+f.amount,0)
  const totalEx = finance.filter(f=>f.type==='expense').reduce((a,f)=>a+f.amount,0)
  const balance = totalIn-totalEx

  const byCat = CATS.map(cat=>({ cat, total:finance.filter(f=>f.category===cat&&f.type==='expense').reduce((a,f)=>a+f.amount,0) })).filter(c=>c.total>0)

  return (
    <motion.div variants={cv} initial="hidden" animate="show">
      <motion.div variants={it}>
        <h2 style={{ fontSize:22, fontWeight:900, color:'#E2E8F0', letterSpacing:'-0.03em', marginBottom:2 }}>Finance Tracker</h2>
        <p style={{ fontSize:11, color:'#4B5563', marginBottom:20 }}>Know where every dollar goes.</p>
      </motion.div>
      <motion.div variants={it} style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:12 }}>
        {[{ label:'Income', val:totalIn, color:'#34D399' },{ label:'Expenses', val:totalEx, color:'#FB7185' },{ label:'Balance', val:balance, color:balance>=0?'#34D399':'#FB7185' }].map(s=>(
          <Card key={s.label} style={{ padding:'14px 16px' }}>
            <div style={{ fontSize:9, color:'#4B5563', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.06em' }}>{s.label}</div>
            <div style={{ fontSize:22, fontWeight:700, color:s.color }}>${Math.abs(s.val).toFixed(2)}</div>
          </Card>
        ))}
      </motion.div>
      <motion.div variants={it} style={{ display:'grid', gridTemplateColumns:'340px 1fr', gap:12 }}>
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          <Card style={{ padding:'14px 15px' }}>
            <SLabel>Log Entry</SLabel>
            <div style={{ display:'flex', gap:6, marginBottom:8 }}>
              {['expense','income'].map(t=>(
                <button key={t} onClick={()=>setForm(f=>({...f,type:t}))} style={{ flex:1, padding:'6px', borderRadius:7, border:'1px solid', fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.05em', background:form.type===t?(t==='income'?'rgba(52,211,153,0.1)':'rgba(251,113,133,0.1)'):'transparent', borderColor:form.type===t?(t==='income'?'#34D399':'#FB7185'):'rgba(255,255,255,0.07)', color:form.type===t?(t==='income'?'#34D399':'#FB7185'):'#4B5563' }}>{t}</button>
              ))}
            </div>
            <div style={{ display:'flex', gap:6, marginBottom:8 }}>
              <input className="input-field" type="number" placeholder="Amount ($)" value={form.amount} onChange={e=>setForm(f=>({...f,amount:e.target.value}))} style={{ flex:1 }} />
              <select className="input-field" value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))} style={{ width:110 }}>
                {CATS.map(c=><option key={c}>{c}</option>)}
              </select>
            </div>
            <input className="input-field" placeholder="Note (optional)" value={form.note} onChange={e=>setForm(f=>({...f,note:e.target.value}))} style={{ marginBottom:8 }}
              onKeyDown={e=>e.key==='Enter'&&add()} />
            <button className="btn-primary" style={{ width:'100%', padding:'8px', fontSize:12 }} onClick={add}>Add Entry</button>
          </Card>
          {byCat.length>0 && (
            <Card style={{ padding:'14px 15px' }}>
              <SLabel>By Category</SLabel>
              {byCat.sort((a,b)=>b.total-a.total).map(c=>(
                <div key={c.cat} style={{ display:'flex', alignItems:'center', gap:8, padding:'5px 0', borderBottom:'1px solid rgba(255,255,255,0.03)' }}>
                  <div style={{ width:7, height:7, borderRadius:'50%', background:CAT_COLORS[c.cat]||'#94A3B8', flexShrink:0 }} />
                  <span style={{ flex:1, fontSize:11, color:'#94A3B8' }}>{c.cat}</span>
                  <span style={{ fontSize:11, fontWeight:700, color:'#FB7185' }}>${c.total.toFixed(2)}</span>
                </div>
              ))}
            </Card>
          )}
        </div>
        <Card style={{ padding:'14px 15px', overflowY:'auto' }}>
          <SLabel>Transactions</SLabel>
          {finance.length===0
            ? <EmptyState icon="◐" label="No entries yet" />
            : finance.slice(0,30).map(e=>(
              <div key={e.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 0', borderBottom:'1px solid rgba(255,255,255,0.03)' }}>
                <div style={{ width:7, height:7, borderRadius:'50%', background:CAT_COLORS[e.category]||'#94A3B8', flexShrink:0 }} />
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:12, color:'#CBD5E1', fontWeight:500 }}>{e.note||e.category}</div>
                  <div style={{ fontSize:9, color:'#374151' }}>{e.category} · {e.date}</div>
                </div>
                <div style={{ fontSize:13, fontWeight:700, color:e.type==='income'?'#34D399':'#FB7185' }}>
                  {e.type==='income'?'+':'-'}${e.amount.toFixed(2)}
                </div>
                <button onClick={()=>del(e.id)} style={{ fontSize:13, color:'#2D2D3A', background:'none', border:'none', cursor:'pointer', padding:'2px 5px' }}>×</button>
              </div>
            ))
          }
        </Card>
      </motion.div>
    </motion.div>
  )
}

const MOOD = ['','😭','😢','😞','😕','😐','🙂','😊','😄','🤩','🔥']
const MC = (m:number) => m>=8?'#34D399':m>=6?'#FBBF24':'#FB7185'

export function JournalView() {
  const { journal, upsertJournalEntry } = useStore()
  const [mood, setMood] = useState(7)
  const [content, setContent] = useState('')
  const [tags, setTags] = useState('')
  const save = async () => {
    if (!content.trim()) return
    await upsertJournalEntry({ date:format(new Date(),'yyyy-MM-dd'), mood, content, tags })
    setContent(''); setTags('')
  }
  const moodData = journal.slice(0,14).reverse().map(j=>({ label:j.date.slice(5), mood:j.mood }))

  return (
    <motion.div variants={cv} initial="hidden" animate="show">
      <motion.div variants={it}>
        <h2 style={{ fontSize:22, fontWeight:900, color:'#E2E8F0', letterSpacing:'-0.03em', marginBottom:2 }}>Journal & Mood</h2>
        <p style={{ fontSize:11, color:'#4B5563', marginBottom:20 }}>Reflect. Process. Grow.</p>
      </motion.div>
      <motion.div variants={it} style={{ display:'grid', gridTemplateColumns:'1.1fr 1fr', gap:12 }}>
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          <Card style={{ padding:'14px 16px' }}>
            <SLabel>New Entry — {format(new Date(),'MMMM d, yyyy')}</SLabel>
            <div style={{ marginBottom:12 }}>
              <div style={{ fontSize:9, color:'#4B5563', marginBottom:8 }}>MOOD</div>
              <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                {[1,2,3,4,5,6,7,8,9,10].map(m=>(
                  <button key={m} onClick={()=>setMood(m)} style={{ width:32, height:32, borderRadius:8, border:'1px solid', fontSize:14, background:mood===m?`${MC(m)}15`:'transparent', borderColor:mood===m?MC(m):'rgba(255,255,255,0.06)', cursor:'pointer', transition:'all 0.15s' }}>{MOOD[m]}</button>
                ))}
              </div>
              <div style={{ fontSize:10, color:'#4B5563', marginTop:6 }}>Mood: <span style={{ color:MC(mood), fontWeight:700 }}>{mood}/10 {MOOD[mood]}</span></div>
            </div>
            <textarea className="input-field" placeholder="What's on your mind? Reflect..." value={content} onChange={e=>setContent(e.target.value)}
              style={{ minHeight:130, resize:'vertical', lineHeight:1.6, marginBottom:8, userSelect:'text' }} />
            <input className="input-field" placeholder="Tags (e.g. win, grateful)" value={tags} onChange={e=>setTags(e.target.value)} style={{ marginBottom:10 }} />
            <button className="btn-primary" style={{ width:'100%', padding:'9px', fontSize:12 }} onClick={save}>Save Entry</button>
          </Card>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {moodData.length>0 && (
            <Card style={{ padding:'14px 15px' }}>
              <SLabel>Mood Timeline</SLabel>
              <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                {moodData.map((d,i)=>(
                  <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:5 }}>
                    <div style={{ width:28, height:28, borderRadius:'50%', background:`${MC(d.mood)}18`, border:`2px solid ${MC(d.mood)}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, color:MC(d.mood) }}>{d.mood}</div>
                    <span style={{ fontSize:8, color:'#374151' }}>{d.label}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
          <Card style={{ padding:'14px 15px', flex:1, overflowY:'auto' }}>
            <SLabel>Past Entries</SLabel>
            {journal.length===0
              ? <EmptyState icon="✦" label="Write your first entry" />
              : journal.slice(0,20).map(e=>(
                <div key={e.id} style={{ padding:'10px 0', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                    <span style={{ fontSize:10, color:'#4B5563' }}>{e.date}</span>
                    <span>{MOOD[e.mood]} <span style={{ fontSize:9, color:MC(e.mood), fontWeight:700 }}>{e.mood}/10</span></span>
                  </div>
                  <p style={{ fontSize:11, color:'#94A3B8', lineHeight:1.5, margin:0, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>{e.content}</p>
                  {e.tags && <div style={{ fontSize:9, color:'#374151', marginTop:4 }}>{e.tags}</div>}
                </div>
              ))
            }
          </Card>
        </div>
      </motion.div>
    </motion.div>
  )
}

export function AnalyticsView() {
  const { sessions, journal, habits, habitLogs, allHabitDates } = useStore()
  const totalMins = sessions.reduce((a,s)=>a+s.duration_mins,0)
  const avgMood = journal.length ? (journal.reduce((a,j)=>a+j.mood,0)/journal.length).toFixed(1) : '—'
  const habitDates = allHabitDates.map(r=>r.date)

  // Real last 7 days session data
  const last7 = Array.from({ length:7 }, (_,i) => {
    const d = new Date(); d.setDate(d.getDate()-6+i)
    const ds = d.toISOString().slice(0,10)
    return { label:d.toLocaleDateString('en',{ weekday:'short' }), mins:sessions.filter(s=>s.started_at.startsWith(ds)).reduce((a,s)=>a+s.duration_mins,0) }
  })

  const INSIGHTS = [
    { icon:'📊', text:'All charts show your real logged data — start tracking to see patterns.' },
    { icon:'🔗', text:'Habits with high streak rates tend to boost focus session quality.' },
    { icon:'🧠', text:'Journal regularly — mood trends reveal your performance cycles.' },
    { icon:'💡', text:'Deep work sessions > 45 mins drive the most XP and stat gains.' },
    { icon:'🎯', text:'Break quests into mini-steps — incremental progress sustains momentum.' },
    { icon:'🔋', text:'Log health data to identify sleep-productivity correlations.' },
  ]

  return (
    <motion.div variants={cv} initial="hidden" animate="show">
      <motion.div variants={it}>
        <h2 style={{ fontSize:22, fontWeight:900, color:'#E2E8F0', letterSpacing:'-0.03em', marginBottom:2 }}>Analytics</h2>
        <p style={{ fontSize:11, color:'#4B5563', marginBottom:20 }}>Real data only — every chart reflects what you've actually logged.</p>
      </motion.div>
      <motion.div variants={it} style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:9, marginBottom:12 }}>
        {[
          { label:'Total Sessions', val:sessions.length, color:'#8B5CF6' },
          { label:'Focus Hours', val:`${Math.round(totalMins/60)}h`, color:'#A78BFA' },
          { label:'Journal Entries', val:journal.length, color:'#34D399' },
          { label:'Avg Mood', val:avgMood, color:'#FBBF24' },
        ].map(s=>(
          <Card key={s.label} style={{ padding:'12px 14px' }}>
            <div style={{ fontSize:9, color:'#4B5563', marginBottom:5, textTransform:'uppercase', letterSpacing:'0.06em' }}>{s.label}</div>
            <div style={{ fontSize:22, fontWeight:700, color:s.color }}>{s.val}</div>
          </Card>
        ))}
      </motion.div>
      <motion.div variants={it} style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
        <Card style={{ padding:'14px 15px' }}>
          <SLabel>Focus Minutes — Last 7 Days</SLabel>
          {last7.every(d=>d.mins===0)
            ? <EmptyState icon="▦" label="No sessions yet — start the timer!" />
            : <MiniBarChart data={last7} dataKey="mins" color="#8B5CF6" maxH={100} />
          }
        </Card>
        <Card style={{ padding:'14px 15px' }}>
          <SLabel>AI Insights</SLabel>
          {INSIGHTS.map((ins,i)=>(
            <div key={i} style={{ display:'flex', gap:9, padding:'7px 0', borderBottom:i<INSIGHTS.length-1?'1px solid rgba(255,255,255,0.04)':'none', alignItems:'flex-start' }}>
              <span style={{ fontSize:13, flexShrink:0, marginTop:1 }}>{ins.icon}</span>
              <span style={{ fontSize:10.5, color:'#94A3B8', lineHeight:1.55 }}>{ins.text}</span>
            </div>
          ))}
        </Card>
      </motion.div>
      <motion.div variants={it}>
        <Card style={{ padding:'14px 15px' }}>
          <SLabel>Activity Heatmap — Real Habit Completion Data</SLabel>
          {habitDates.length===0
            ? <EmptyState icon="▦" label="Complete habits to fill in your heatmap" />
            : <RealHeatmap dates={habitDates} weeks={17} />
          }
        </Card>
      </motion.div>
    </motion.div>
  )
}

export function AchievementsView() {
  const { achievements } = useStore()
  const earned = achievements.filter(a=>a.earned)
  const locked = achievements.filter(a=>!a.earned)
  return (
    <motion.div variants={cv} initial="hidden" animate="show">
      <motion.div variants={it}>
        <h2 style={{ fontSize:22, fontWeight:900, color:'#E2E8F0', letterSpacing:'-0.03em', marginBottom:2 }}>Achievements</h2>
        <p style={{ fontSize:11, color:'#4B5563', marginBottom:20 }}>Unlock by actually using the app — no fake pre-earned trophies.</p>
      </motion.div>
      <motion.div variants={it} style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:9, marginBottom:14 }}>
        {[{ label:'Earned', val:earned.length, color:'#8B5CF6' },{ label:'Locked', val:locked.length, color:'#374151' },{ label:'Total', val:achievements.length, color:'#A78BFA' }].map(s=>(
          <Card key={s.label} style={{ padding:'12px 14px', textAlign:'center' }}>
            <div style={{ fontSize:24, fontWeight:700, color:s.color }}>{s.val}</div>
            <div style={{ fontSize:9, color:'#4B5563', marginTop:2, textTransform:'uppercase', letterSpacing:'0.06em' }}>{s.label}</div>
          </Card>
        ))}
      </motion.div>
      {earned.length>0 && (
        <motion.div variants={it} style={{ marginBottom:16 }}>
          <div className="section-label" style={{ marginBottom:10 }}>Earned</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10 }}>
            {earned.map(a=>(
              <motion.div key={a.id} initial={{ scale:0 }} animate={{ scale:1 }} transition={{ type:'spring', stiffness:200 }}>
                <Card style={{ padding:'16px 13px', textAlign:'center' }}>
                  <div style={{ fontSize:28, marginBottom:8 }}>{a.icon}</div>
                  <div style={{ fontSize:11, fontWeight:600, color:'#E2E8F0', marginBottom:6 }}>{a.title}</div>
                  <Badge label={a.rarity} />
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
      <motion.div variants={it}>
        <div className="section-label" style={{ marginBottom:10 }}>Locked</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10 }}>
          {locked.map(a=>(
            <Card key={a.id} style={{ padding:'16px 13px', textAlign:'center', opacity:0.32, filter:'saturate(0.15)' }}>
              <div style={{ fontSize:28, marginBottom:8 }}>{a.icon}</div>
              <div style={{ fontSize:11, fontWeight:600, color:'#E2E8F0', marginBottom:6 }}>{a.title}</div>
              <Badge label={a.rarity} />
              <div style={{ fontSize:9, color:'#374151', marginTop:6 }}>🔒 {a.description}</div>
            </Card>
          ))}
        </div>
      </motion.div>
    </motion.div>
  )
}

export function SettingsView() {
  const { profile, loadAll } = useStore()
  const [name, setName] = useState(profile?.name??'Commander')
  const el = (window as any).electron

  const saveName = async () => { if (el) { await el.profile.updateName(name); await loadAll() } }
  const exportData = () => {
    const blob = new Blob([JSON.stringify({ exportedAt:new Date().toISOString(), profile }, null, 2)], { type:'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href=url; a.download='astraos-backup.json'; a.click()
  }

  return (
    <motion.div variants={cv} initial="hidden" animate="show">
      <motion.div variants={it}>
        <h2 style={{ fontSize:22, fontWeight:900, color:'#E2E8F0', letterSpacing:'-0.03em', marginBottom:2 }}>Settings</h2>
        <p style={{ fontSize:11, color:'#4B5563', marginBottom:20 }}>Configure your AstraOS.</p>
      </motion.div>
      <motion.div variants={it} style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          <Card style={{ padding:'16px 17px' }}>
            <SLabel>Profile</SLabel>
            <div style={{ marginBottom:10 }}>
              <div style={{ fontSize:9, color:'#4B5563', marginBottom:4 }}>Display Name</div>
              <input className="input-field" value={name} onChange={e=>setName(e.target.value)} style={{ marginBottom:8 }} onKeyDown={e=>e.key==='Enter'&&saveName()} />
              <button className="btn-primary" onClick={saveName}>Save Name</button>
            </div>
            <div style={{ paddingTop:10, borderTop:'1px solid rgba(255,255,255,0.04)' }}>
              <div style={{ fontSize:9, color:'#4B5563', marginBottom:3 }}>Level</div>
              <div style={{ fontSize:22, fontWeight:700, color:'#8B5CF6' }}>{profile?.level??1}</div>
              <XPBar pct={profile?Math.round((profile.xp_current/(profile.level*1000))*100):0} height={4} />
            </div>
          </Card>
          <Card style={{ padding:'16px 17px' }}>
            <SLabel>Data</SLabel>
            <button className="btn-ghost" style={{ width:'100%', textAlign:'left', padding:'10px 12px', borderRadius:9, marginBottom:6 }} onClick={exportData}>
              <div style={{ fontSize:12, color:'#CBD5E1', fontWeight:500 }}>📤 Export Data</div>
              <div style={{ fontSize:9, color:'#374151', marginTop:2 }}>Download as JSON backup</div>
            </button>
            <button className="btn-ghost" style={{ width:'100%', textAlign:'left', padding:'10px 12px', borderRadius:9 }} onClick={loadAll}>
              <div style={{ fontSize:12, color:'#CBD5E1', fontWeight:500 }}>🔄 Reload Data</div>
              <div style={{ fontSize:9, color:'#374151', marginTop:2 }}>Refresh all from database</div>
            </button>
          </Card>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          <Card style={{ padding:'16px 17px' }}>
            <SLabel>About</SLabel>
            <div style={{ fontSize:13, fontWeight:700, color:'#8B5CF6', marginBottom:4 }}>AstraOS v3.0</div>
            <div style={{ fontSize:11, color:'#4B5563', lineHeight:1.65 }}>All data stored locally via SQLite (sql.js). No cloud, no tracking, fully private. Everything you see is from your real actions.</div>
            <div style={{ marginTop:12, display:'flex', gap:20 }}>
              {[['Stack','Electron+React'],['DB','SQLite/sql.js'],['Theme','Deep Purple']].map(([k,v])=>(
                <div key={k}>
                  <div style={{ fontSize:8, color:'#374151', marginBottom:1 }}>{k}</div>
                  <div style={{ fontSize:10, color:'#94A3B8', fontWeight:600 }}>{v}</div>
                </div>
              ))}
            </div>
          </Card>
          <Card style={{ padding:'16px 17px' }}>
            <SLabel>Keyboard Shortcuts</SLabel>
            {[['Ctrl+1','Command Center'],['Ctrl+2','Life Stats'],['Ctrl+3','Habits'],['Ctrl+4','Quests'],['Ctrl+5','Deep Work'],['Ctrl+6','Health'],['Ctrl+7','Finance'],['Ctrl+8','Journal'],['Ctrl+9','Analytics'],['Ctrl+0','Achievements']].map(([k,v])=>(
              <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'5px 0', borderBottom:'1px solid rgba(255,255,255,0.03)' }}>
                <code style={{ fontSize:10, color:'#8B5CF6', fontFamily:'monospace', background:'rgba(139,92,246,0.08)', padding:'2px 6px', borderRadius:4 }}>{k}</code>
                <span style={{ fontSize:10, color:'#4B5563' }}>{v}</span>
              </div>
            ))}
          </Card>
        </div>
      </motion.div>
    </motion.div>
  )
}
