import React from 'react'
import { motion } from 'framer-motion'

const P = '#8B5CF6'

export function XPBar({ pct, color = P, height = 5 }: { pct: number; color?: string; height?: number }) {
  return (
    <div className="xp-bar" style={{ height }}>
      <motion.div className="xp-fill" initial={{ width: 0 }} animate={{ width: `${Math.min(pct, 100)}%` }}
        transition={{ duration: 1.2, ease: [0.4,0,0.2,1] }}
        style={{ background: `linear-gradient(90deg,${color},${color}88)`, boxShadow: `0 0 10px ${color}44` }} />
    </div>
  )
}

export function Card({ children, className='', style={}, onClick }: {
  children: React.ReactNode; className?: string; style?: React.CSSProperties; onClick?: () => void
}) {
  return (
    <motion.div whileHover={{ y: -1, borderColor: 'rgba(139,92,246,0.2)' }} onClick={onClick}
      className={`card ${className}`} style={style}>{children}</motion.div>
  )
}

export function SLabel({ children }: { children: React.ReactNode }) {
  return <div className="section-label">{children}</div>
}

export function Badge({ label }: { label: string }) {
  const map: Record<string,string> = {
    MAIN:'quest-type-main', SIDE:'quest-type-side', DAILY:'quest-type-daily', WEEKLY:'quest-type-weekly',
    COMMON:'badge-common', UNCOMMON:'badge-uncommon', RARE:'badge-rare', EPIC:'badge-epic', LEGENDARY:'badge-legendary',
  }
  return <span className={`badge ${map[label]||'badge-common'}`}>{label}</span>
}

export function StatRow({ name, val, lvl, xp, cap, color }: { name:string; val:number; lvl:number; xp:number; cap:number; color:string }) {
  return (
    <div className="flex items-center gap-3 py-[7px] border-b border-white/[0.03]">
      <div className="w-[96px] text-[11px] text-[#94A3B8] font-medium flex-shrink-0">{name}</div>
      <div className="flex-1">
        <div style={{ height: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 99, overflow: 'hidden' }}>
          <motion.div initial={{ width: 0 }} animate={{ width: `${val}%` }} transition={{ duration: 1 }}
            style={{ height: '100%', background: color, boxShadow: `0 0 6px ${color}55`, borderRadius: 99 }} />
        </div>
      </div>
      <div className="text-xs font-bold w-6 text-right" style={{ color }}>{val}</div>
      <div className="text-[9px] text-[#374151] w-8 text-right">Lv{lvl}</div>
      <div className="w-14"><XPBar pct={Math.round((xp/cap)*100)} color={color} height={3} /></div>
    </div>
  )
}

export function RadarChart({ stats, size=200 }: { stats: { name:string; val:number; color:string }[]; size?: number }) {
  const sel = stats.slice(0,8)
  const cx=size/2, cy=size/2, r=size*0.37, n=sel.length
  const ang = (i:number) => (2*Math.PI/n)*i - Math.PI/2
  const pt = (i:number, f:number) => ({ x: cx+r*f*Math.cos(ang(i)), y: cy+r*f*Math.sin(ang(i)) })
  const poly = sel.map((s,i) => { const p=pt(i,s.val/100); return `${p.x},${p.y}` }).join(' ')
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {[0.25,0.5,0.75,1].map(v => (
        <polygon key={v} points={sel.map((_,i) => { const p=pt(i,v); return `${p.x},${p.y}` }).join(' ')}
          fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
      ))}
      {sel.map((_,i) => { const e=pt(i,1); return <line key={i} x1={cx} y1={cy} x2={e.x} y2={e.y} stroke="rgba(255,255,255,0.04)" strokeWidth="1" /> })}
      <polygon points={poly} fill="rgba(139,92,246,0.08)" stroke="#8B5CF6" strokeWidth="1.5" />
      {sel.map((s,i) => { const p=pt(i,s.val/100); return <circle key={i} cx={p.x} cy={p.y} r="4" fill={s.color} style={{ filter:`drop-shadow(0 0 4px ${s.color}88)` }} /> })}
      {sel.map((s,i) => { const lp=pt(i,1.26); return (
        <text key={i} x={lp.x} y={lp.y} textAnchor="middle" dominantBaseline="middle"
          style={{ fontSize:8, fill:'#4B5563', fontFamily:'inherit', fontWeight:600 }}>{s.name.slice(0,5).toUpperCase()}</text>
      )})}
    </svg>
  )
}

// Real heatmap — takes actual date strings
export function RealHeatmap({ dates, weeks=17 }: { dates: string[]; weeks?: number }) {
  const dateSet = new Set(dates)
  const today = new Date()
  const cells: { date: string; val: number }[] = []
  for (let i = weeks * 7 - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const ds = d.toISOString().slice(0,10)
    cells.push({ date: ds, val: dateSet.has(ds) ? 1 : 0 })
  }
  // group into columns of 7
  const cols: typeof cells[] = []
  for (let i = 0; i < cells.length; i += 7) cols.push(cells.slice(i, i+7))
  return (
    <div className="flex gap-[3px]">
      {cols.map((col, ci) => (
        <div key={ci} className="flex flex-col gap-[3px]">
          {col.map((c, di) => (
            <div key={di} className="heat-cell" title={c.date}
              style={{ width:11, height:11, background: c.val ? 'rgba(139,92,246,0.85)' : 'rgba(139,92,246,0.06)' }} />
          ))}
        </div>
      ))}
    </div>
  )
}

export function MiniBarChart({ data, dataKey, color, maxH=100 }: {
  data: Record<string,any>[]; dataKey: string; color: string; maxH?: number
}) {
  const max = Math.max(...data.map(d => d[dataKey]||0), 1)
  return (
    <div className="flex items-end gap-1" style={{ height: maxH+20 }}>
      {data.map((d,i) => {
        const h = Math.round((d[dataKey]/max)*maxH)
        return (
          <div key={i} className="flex flex-col items-center gap-1 flex-1">
            <motion.div initial={{ height:0 }} animate={{ height:h }} transition={{ duration:0.8, delay:i*0.04 }}
              style={{ width:'100%', borderRadius:'3px 3px 0 0', background:`linear-gradient(180deg,${color}CC,${color}22)`, border:`1px solid ${color}28` }} />
            <span className="text-[9px] text-[#374151] font-medium">{d.label||d.day}</span>
          </div>
        )
      })}
    </div>
  )
}

export function PomodoroCircle({ progress, size=180, children }: { progress:number; size?:number; children?: React.ReactNode }) {
  const r=(size-14)/2, circ=2*Math.PI*r
  return (
    <div style={{ position:'relative', width:size, height:size, flexShrink:0 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={7} />
        <motion.circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#8B5CF6" strokeWidth={7} strokeLinecap="round"
          strokeDasharray={circ} animate={{ strokeDashoffset: circ*(1-progress) }} transition={{ duration:0.4 }}
          style={{ transform:'rotate(-90deg)', transformOrigin:'center', filter:'drop-shadow(0 0 8px rgba(139,92,246,0.6))' }} />
      </svg>
      <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
        {children}
      </div>
    </div>
  )
}

export function EmptyState({ icon, label }: { icon:string; label:string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 gap-3 text-[#2D2D3A]">
      <div className="text-3xl opacity-40">{icon}</div>
      <div className="text-xs font-medium">{label}</div>
    </div>
  )
}

export function LevelUpToast({ level, onDismiss }: { level:number; onDismiss:()=>void }) {
  return (
    <motion.div initial={{ y:80, opacity:0, scale:0.8 }} animate={{ y:0, opacity:1, scale:1 }} exit={{ y:-40, opacity:0 }}
      className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50"
      style={{ background:'linear-gradient(135deg,rgba(139,92,246,0.18),rgba(76,29,149,0.18))', border:'1px solid rgba(139,92,246,0.35)', backdropFilter:'blur(14px)', borderRadius:16, padding:'18px 32px', textAlign:'center', boxShadow:'0 0 40px rgba(139,92,246,0.25)' }}>
      <div className="text-3xl mb-1">⚡</div>
      <div className="text-base font-bold text-[#A78BFA] glow-text">LEVEL UP!</div>
      <div className="text-xs text-[#94A3B8] mt-0.5">You reached Level {level}</div>
      <button className="mt-3 btn-ghost text-[10px]" onClick={onDismiss}>Dismiss</button>
    </motion.div>
  )
}
