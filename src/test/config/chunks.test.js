import { describe, it, expect } from 'vitest'
import config from '../../../vite.config.js'

// The analytics screen and recharts must stay in a chunk that only the lazy
// import loads (odd/tasks/analytics-dashboard.md, T2). Naming a manual chunk for
// them makes rolldown pull their dependencies (react-dom) into it, and then
// every page preloads the charts.

const manualChunks = config.build.rollupOptions.output.manualChunks
const dep = (pkg, file = 'index.js') => `/repo/node_modules/.pnpm/${pkg}@1.0.0/node_modules/${pkg}/${file}`

describe('manualChunks', () => {
  it('leaves recharts and its own dependencies unassigned', () => {
    for (const pkg of ['recharts', 'd3-scale', 'victory-vendor', 'react-redux', '@reduxjs/toolkit', 'es-toolkit']) {
      expect(manualChunks(dep(pkg)), pkg).toBeUndefined()
    }
  })

  it('leaves the analytics screen unassigned', () => {
    expect(manualChunks('/repo/src/components/admin/Analytics.jsx')).toBeUndefined()
    expect(manualChunks('/repo/src/components/admin/analytics/KpiGrid.jsx')).toBeUndefined()
  })

  it('keeps react-dom in react-vendor and other admin screens in admin', () => {
    expect(manualChunks(dep('react-dom', 'cjs/react-dom.production.js'))).toBe('react-vendor')
    expect(manualChunks('/repo/src/components/admin/Dashboard.jsx')).toBe('admin')
  })
})
