import { useEffect, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useStore } from './store/useStore'
import Sidebar from './components/Sidebar'
import HomeView from './components/views/HomeView'
import { StatsView, HabitsView, QuestsView, DeepWorkView, HealthView } from './components/views/Views1'
import { FinanceView, JournalView, AnalyticsView, AchievementsView, SettingsView } from './components/views/Views2'
import { LevelUpToast } from './components/primitives'

const VIEWS: Record<string, React.ComponentType> = {
  home: HomeView, stats: StatsView, habits: HabitsView, quests: QuestsView,
  deepwork: DeepWorkView, health: HealthView, finance: FinanceView,
  journal: JournalView, analytics: AnalyticsView, achievements: AchievementsView, settings: SettingsView,
}

export default function App() {
  const { view, setView, loadAll, levelUpToast, dismissLevelUp } = useStore()

  useEffect(() => { loadAll() }, [])

  const handleKey = useCallback((e: KeyboardEvent) => {
    if (e.metaKey || e.ctrlKey) {
      const map: Record<string, string> = {
        '1':'home','2':'stats','3':'habits','4':'quests','5':'deepwork',
        '6':'health','7':'finance','8':'journal','9':'analytics','0':'achievements',
      }
      if (map[e.key]) { e.preventDefault(); setView(map[e.key] as any) }
    }
  }, [setView])

  useEffect(() => { window.addEventListener('keydown', handleKey); return () => window.removeEventListener('keydown', handleKey) }, [handleKey])

  const CurrentView = VIEWS[view] ?? HomeView

  return (
    <div style={{ display:'flex', height:'100vh', background:'#06040F', position:'relative', overflow:'hidden' }}>
      {/* Ambient glow blobs */}
      <div style={{ position:'fixed', top:'-15%', left:'25%', width:500, height:500, background:'radial-gradient(circle,rgba(139,92,246,0.03) 0%,transparent 70%)', pointerEvents:'none', zIndex:0 }} />
      <div style={{ position:'fixed', bottom:'-10%', right:'15%', width:400, height:400, background:'radial-gradient(circle,rgba(76,29,149,0.025) 0%,transparent 70%)', pointerEvents:'none', zIndex:0 }} />
      {/* Grid */}
      <div style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:0, backgroundImage:'linear-gradient(rgba(139,92,246,0.015) 1px,transparent 1px),linear-gradient(90deg,rgba(139,92,246,0.015) 1px,transparent 1px)', backgroundSize:'38px 38px' }} />

      <div style={{ position:'relative', zIndex:10 }}><Sidebar /></div>

      <main style={{ flex:1, overflowY:'auto', position:'relative', zIndex:1, padding:'22px 26px' }}>
        <AnimatePresence mode="wait">
          <motion.div key={view} initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-6 }} transition={{ duration:0.22, ease:'easeOut' }}>
            <CurrentView />
          </motion.div>
        </AnimatePresence>
      </main>

      <AnimatePresence>
        {levelUpToast.visible && <LevelUpToast level={levelUpToast.level} onDismiss={dismissLevelUp} />}
      </AnimatePresence>
    </div>
  )
}
