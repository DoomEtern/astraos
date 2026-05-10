import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { useStore, View } from '../store/useStore'
import { XPBar } from './primitives'

const NAV: { id: View; label: string; icon: string }[] = [
  { id:'home', label:'Command Center', icon:'⌘' },
  { id:'stats', label:'Life Stats', icon:'◈' },
  { id:'habits', label:'Habit Engine', icon:'◉' },
  { id:'quests', label:'Quest Board', icon:'◆' },
  { id:'deepwork', label:'Deep Work', icon:'◎' },
  { id:'health', label:'Health & Fitness', icon:'♥' },
  { id:'finance', label:'Finance', icon:'◐' },
  { id:'journal', label:'Journal & Mood', icon:'✦' },
  { id:'analytics', label:'Analytics', icon:'▦' },
  { id:'achievements', label:'Achievements', icon:'★' },
  { id:'settings', label:'Settings', icon:'⚙' },
]

function Particles() {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const c = ref.current!; const ctx = c.getContext('2d')!
    c.width = 210; c.height = window.innerHeight
    const ps = Array.from({ length: 25 }, () => ({
      x: Math.random()*210, y: Math.random()*c.height,
      r: Math.random()*1.1+0.2, vy: -Math.random()*0.25-0.04,
      vx: (Math.random()-0.5)*0.1, a: Math.random()*0.25,
    }))
    let raf: number
    const draw = () => {
      ctx.clearRect(0,0,210,c.height)
      ps.forEach(p => {
        ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2)
        ctx.fillStyle = `rgba(139,92,246,${p.a})`; ctx.fill()
        p.x+=p.vx; p.y+=p.vy
        if (p.y < -4) { p.y = c.height+4; p.x = Math.random()*210 }
      })
      raf = requestAnimationFrame(draw)
    }
    draw()
    return () => cancelAnimationFrame(raf)
  }, [])
  return <canvas ref={ref} style={{ position:'absolute', inset:0, pointerEvents:'none', zIndex:0 }} />
}

export default function Sidebar() {
  const { view, setView, profile, habits, habitLogs } = useStore()
  const el = (window as any).electron
  const xpPct = profile ? Math.round((profile.xp_current / (profile.level * 1000)) * 100) : 0

  return (
    <div style={{ width:210, flexShrink:0, background:'rgba(4,2,12,0.98)', borderRight:'1px solid rgba(139,92,246,0.07)', display:'flex', flexDirection:'column', position:'relative', overflow:'hidden' }}>
      <Particles />
      <div style={{ position:'relative', zIndex:1, display:'flex', flexDirection:'column', height:'100%', padding:'0 8px 12px' }}>

        {/* Titlebar */}
        <div className="titlebar" style={{ padding:'12px 8px 10px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div>
            <div style={{ fontSize:15, fontWeight:900, letterSpacing:'-0.01em', color:'#E2E8F0' }}>
              ASTRA<span style={{ color:'#8B5CF6' }}>OS</span>
            </div>
            <div style={{ fontSize:7.5, color:'#1a1a2e', letterSpacing:'0.12em', fontWeight:700 }}>LIFE OPERATING SYSTEM</div>
          </div>
          {el && (
            <div style={{ display:'flex', gap:5 }}>
              {[['#FBBF24', 'win:minimize'], ['#34D399', 'win:maximize'], ['#FB7185', 'win:close']].map(([color, ev]) => (
                <button key={ev} onClick={() => ev==='win:minimize'?el.minimize():ev==='win:maximize'?el.maximize():el.close()}
                  style={{ width:10, height:10, borderRadius:'50%', background:color, border:'none', padding:0, opacity:0.7, transition:'opacity 0.15s' }}
                  onMouseEnter={e=>(e.currentTarget.style.opacity='1')}
                  onMouseLeave={e=>(e.currentTarget.style.opacity='0.7')} />
              ))}
            </div>
          )}
        </div>

        {/* Profile chip */}
        <div style={{ padding:'8px 10px', marginBottom:10, borderRadius:10, background:'rgba(139,92,246,0.06)', border:'1px solid rgba(139,92,246,0.1)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:7 }}>
            <div style={{ width:30, height:30, borderRadius:8, background:'linear-gradient(135deg,rgba(139,92,246,0.28),rgba(76,29,149,0.28))', border:'1px solid rgba(139,92,246,0.35)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:800, color:'#A78BFA', flexShrink:0 }}>
              {profile?.level ?? 1}
            </div>
            <div>
              <div style={{ fontSize:11, fontWeight:600, color:'#E2E8F0' }}>{profile?.name ?? 'Commander'}</div>
              <div style={{ fontSize:8, color:'#4B5563' }}>{profile?.title ?? 'Initiate'}</div>
            </div>
          </div>
          <XPBar pct={xpPct} height={3} />
          <div style={{ fontSize:8, color:'#2D2D3A', marginTop:3 }}>{profile?.xp_current??0} / {(profile?.level??1)*1000} XP</div>
        </div>

        {/* Nav */}
        <nav style={{ flex:1, display:'flex', flexDirection:'column', gap:1, overflowY:'auto' }}>
          {NAV.map(item => (
            <motion.div key={item.id} onClick={() => setView(item.id)}
              whileHover={{ x:2 }} whileTap={{ scale:0.97 }}
              className={`nav-item ${view===item.id?'active':''}`}>
              <span style={{ fontSize:10, width:14, textAlign:'center', flexShrink:0 }}>{item.icon}</span>
              <span style={{ fontSize:11.5 }}>{item.label}</span>
            </motion.div>
          ))}
        </nav>

        {/* Footer */}
        <div style={{ paddingTop:10, borderTop:'1px solid rgba(255,255,255,0.03)', marginTop:8 }}>
          <div style={{ fontSize:8, color:'#1a1a2e', marginBottom:5, letterSpacing:'0.08em', fontWeight:700 }}>TODAY'S HABITS</div>
          <XPBar pct={habits.length ? Math.round((habitLogs.length/habits.length)*100) : 0} height={4} />
          <div style={{ fontSize:9, color:'#4B5563', marginTop:4 }}>
            Done: <span style={{ color:'#8B5CF6', fontWeight:700 }}>{habitLogs.length}/{habits.length}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
