# CURSOR PROMPT — Dashboard Layout (Sidebar + Topbar)
# Wklej to do Cursor Composer jako prompt. Dodaj do kontekstu: .cursorrules, tailwind.config.ts, app/globals.css, lib/utils.ts

---

Build the main dashboard layout for "Kurs na LDEK" learning platform. This layout wraps all authenticated pages (everything except login/register).

## File structure to create:

```
app/(dashboard)/layout.tsx          — Dashboard layout with sidebar + topbar + main area
features/shared/components/Sidebar.tsx      — Left sidebar navigation
features/shared/components/TopBar.tsx       — Top navigation bar
features/shared/components/SidebarLink.tsx  — Individual nav link component
```

## Design specs:

### Sidebar (left, 260px wide, collapsible to 64px):
- Background: bg-brand-bg with a right border of rgba(255,255,255,0.06)
- Top section: "Kurs na LDEK" wordmark in font-heading text-brand-gold, 16px
- Below: user avatar circle (40px, bg-brand-accent-2, text-brand-gold, font-body font-semibold) showing initials "MN" + name "Marek Nowak" + subtitle "ROK 2 · STOMATOLOGIA" in text-body-xs text-secondary
- Navigation items, each with a lucide-react icon (20px) + label:
  - Pulpit (LayoutDashboard icon)
  - Moje przedmioty (BookOpen icon)
  - Sesja nauki (Brain icon)
  - Statystyki (BarChart3 icon)
  - Streak i cel dzienny (Flame icon)
  - Ustawienia (Settings icon)
- Active state: gold left border (3px), text-brand-gold, icon color brand-gold
- Hover state: bg-white/[0.04] transition-colors duration-200
- Bottom of sidebar: tagline "Kazdę pytanie przybliza Cie do celu." in font-body text-body-xs italic text-muted
- Sidebar is collapsible: a small chevron toggle button at the top-right. When collapsed, show only icons (64px width), tooltips on hover.
- Use Zustand store for sidebar collapsed state, persist to localStorage.

### TopBar (sticky top, 56px height):
- Background: bg-brand-bg with bottom border rgba(255,255,255,0.06)
- Left: breadcrumb text "Rok 2 > Biochemia" in font-body text-body-sm text-secondary. Separator: ChevronRight icon, 12px, text-muted.
- Right cluster:
  - Search trigger: Search icon + "Szukaj..." + kbd "Ctrl+K" badge, bg-brand-card-1, rounded-btn, text-secondary, ~200px wide
  - Notification bell icon (Bell from lucide), with optional gold dot
  - Streak: Flame icon (text-brand-gold) + "14 dni" in font-body text-brand-gold
  - User avatar circle (32px, same style as sidebar but smaller)

### Main content area:
- Takes remaining width after sidebar
- Padding: p-8
- Scrollable (overflow-y-auto, full height minus topbar)
- Background: bg-brand-bg

### General rules:
- Use the cn() helper from lib/utils.ts for all conditional classes
- Use lucide-react for ALL icons, monoline style
- Font classes: font-heading for titles, font-body for all other text
- All text in Polish
- Use "use client" only where truly needed (sidebar collapse state, click handlers)
- Dashboard layout should be a server component that imports client components
- Responsive: on screens < 1024px, sidebar auto-collapses
- Transitions: all hover/state changes use duration-200 ease

### DO NOT:
- Use emoji anywhere
- Use Inter, Poppins, or system fonts
- Add decorative gradients or blobs
- Use inline styles
- Put everything in one file — split into the components listed above
