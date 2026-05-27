# MCG AI Booking System — Dashboard

React + Vite frontend for the MCG AI Booking System.
Dark-themed, production-grade dashboard for landscaping & hardscaping companies.

## Quick Start

```bash
npm install
npm run dev
```

Open http://localhost:5173

## Stack
- React 18
- Vite 5
- CSS Modules (no Tailwind dependency)
- Lucide React icons
- DM Sans + DM Mono fonts (Google Fonts)

## Project Structure

```
src/
  components/
    layout/        Sidebar
    dashboard/     MetricCards, ActivityLog, ScheduleWidget
    leads/         LeadList
    pipeline/      PipelineFunnel
    approvals/     ApprovalQueue
    ui.jsx         Shared primitives (Badge, Card, Button, Avatar)
  data/
    mockData.js    All mock leads, approvals, pipeline, metrics
  pages/
    Dashboard.jsx  Main dashboard layout
    Placeholder.jsx  Stub pages for other nav items
  App.jsx          Root with tab routing
  index.css        Global tokens + base styles
```

## Next Steps (Claude Code suggestions)

1. **Customer Profile page** — photo gallery, conversation history, job timeline
2. **Kanban Pipeline** — drag-and-drop cards across all 9 stages
3. **Approval detail modal** — full photo viewer + estimate editor before approving
4. **Real GHL webhook integration** — replace mockData with live API calls
5. **SMS conversation thread** — view the AI ↔ customer SMS history per lead
# mcg-dashboard
