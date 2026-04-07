# React Style Guide

## Component Structure
- Server Components by default (Next.js App Router) — use `'use client'` only when needed
- One component per file
- Named function exports, not default exports
- Keep components focused — extract when a component exceeds ~150 lines

## Naming
- Components: PascalCase (`PatientCard`, `RiskGauge`)
- Hooks: camelCase, prefixed with `use` (`usePatientData`, `useOrganizationScope`)
- Props interface: `ComponentNameProps` (`PatientCardProps`)

## Hooks Rules
- Every `useEffect` must have proper cleanup — no missing cleanup functions
- Custom hooks return objects with consistent naming: `{ data, isLoading, error, refetch }`
- Never call hooks conditionally or inside loops
- Memoize expensive callbacks with `useCallback` and derived values with `useMemo` — but only when profiling shows it matters

## State Management
- Server state: fetch in Server Components or use data-fetching library — not React state
- Client state: `useState` for local UI state, `useContext` for truly global client state only
- No prop drilling past 2 levels — use composition or context
- Form state: React Hook Form + Zod validation — never manual state management for forms

## Styling
- Tailwind CSS utility classes — no CSS-in-JS, no styled-components
- Use `cn()` utility (clsx + tailwind-merge) for conditional classes
- Keep design tokens consistent — colors, spacing, typography defined in `tailwind.config.ts`
- shadcn/ui components as base — customize via className, don't fork the component library

## Performance
- `React.memo` on components that re-render frequently with same props
- Virtualize long lists (react-window or tanstack-virtual)
- Lazy-load below-the-fold components with `React.lazy` + `Suspense`
- Optimize images with `next/image` — always set width/height or use fill

## Accessibility
- Semantic HTML first — `button` for actions, `a` for navigation, proper heading hierarchy
- All interactive elements must be keyboard accessible
- ARIA labels only when semantic HTML is insufficient
- Color contrast must meet WCAG AA minimum (4.5:1 for text)
- Form inputs must have associated labels

## Error Boundaries
- Wrap feature sections with Error Boundary components
- Display user-friendly error messages — never expose stack traces to users
- Log errors server-side for debugging
