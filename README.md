# ⚡ AstraOS v3 — Life Operating System

Deep purple. Real data only. Mini-step quests. Zero pre-loaded fake entries.

---

## 🚀 Run it (3 steps)

```bash
cd astraos-v3
npm install
npm run dev
```

### Build Windows .exe
```bash
npm run build:win
# → release/AstraOS Setup 3.0.0.exe
```

---

## ✅ What's fixed in v3

| Fix | Detail |
|-----|--------|
| `type: "commonjs"` in package.json | Fixes postcss warning |
| `require('sql.js')` instead of import | Fixes Electron bundling issue |
| 4-path WASM resolver | Finds sql-wasm.wasm in dev + packaged app |
| Error logging in main.ts | Now prints exact crash reason to console |
| DevTools auto-open in dev | See errors immediately in Chromium devtools |

---

## 🗄 Data location

| OS | Path |
|----|------|
| Windows | `%APPDATA%\astraos\astraos.db` |
| macOS | `~/Library/Application Support/astraos/astraos.db` |

**To reset everything:** delete `astraos.db` — it rebuilds on next launch.

---

## 🎮 Keyboard shortcuts

`Ctrl+1–0` navigate between all 10 views.

---

## 🟣 What's new in v3

- **Deep purple theme** — `#8B5CF6` throughout, dark `#06040F` background
- **Zero fake data** — everything starts empty, grows from real use
- **Quest mini-steps** — add checkboxes to quests, progress auto-calculates
- **Real heatmap** — pulls from actual `habit_logs` dates
- **Real charts** — Deep Work shows your actual logged session minutes
