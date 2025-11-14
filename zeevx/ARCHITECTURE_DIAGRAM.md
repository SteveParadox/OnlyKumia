# Header Component Architecture Diagram

Visual reference for the header structure and icon linking in OnlyKumia.

---

## Header Layout Structure

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            HEADER (Sticky, z-index: 1200)                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  [≡] [Logo] OnlyKumia  │  [HOME] [UPLOAD] [EXPLORE] [VIDEO] │ [🔍] [💬] [🌙] [👤] [🚪]
│                        │                                      │
│  .header__left         │        .header__nav                  │    .header__right
│                        │   (center icons)                     │   (right icons)
│
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Left Section: Brand & Menu

```
┌─────────────────┐
│  .header__left  │
├─────────────────┤
│                 │
│  [≡] Drawer     │  ← Menu button (hamburger), toggles drawer on mobile
│  Trigger        │
│                 │
│  [Logo]         │  ← App logo + brand name
│  "OnlyKumia"    │     Links to: /home
│                 │
└─────────────────┘
```

### Components
- **Menu Button** (`MenuRoundedIcon`)
  - Toggles mobile drawer
  - Contains: Home, Upload, Explore, Video Call, Messages, Theme toggle
  - Hidden on desktop (> 880px)

- **Brand Logo**
  - Clickable link to `/home`
  - Responsive: Logo visible on all screens, text hidden on mobile (< 480px)

---

## Center Section: Navigation Icons

```
┌──────────────────────────────────────┐
│        .header__nav                  │
├──────────────────────────────────────┤
│                                      │
│  [🏠 HOME] [📤 UPLOAD] [🔍 EXPLORE]   │
│  [📹 VIDEO CALL]                     │
│                                      │
│  Links to Protected Routes           │
│  (require header + content layout)   │
│                                      │
└──────────────────────────────────────┘
```

### Navigation Items (navItems array)
```javascript
[
  { to: "/home", icon: <HomeRoundedIcon />, label: "Home" },
  { to: "/upload", icon: <CloudUploadRoundedIcon />, label: "Upload" },
  { to: "/explore", icon: <ExploreRoundedIcon />, label: "Explore" },
  { to: "/videos/call", icon: <VideoCameraFrontRoundedIcon />, label: "Video Call" }
]
```

**Active State**: 
- Current route highlighted with blue background
- Active icon color: `var(--accent)` (#0ea5e9 sky blue)

**Responsive**:
- Hidden on tablets (< 880px)
- Shown in drawer menu instead

---

## Right Section: Action Icons

```
┌──────────────────────────────────────────────────────────┐
│              .header__right                              │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  [Search Box] [💬 Messages] [🌙 Theme] [👤 Profile] [🚪 Logout]
│   (expandable)   (with badge)  (toggle)  (avatar)  (button)
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### Right Section Items

#### 1. Search (Expandable)
```
Initial State:          Expanded State:
  [🔍]          →       [🔍 | Type search... | ✕]
```
- **Default**: Collapsed, shows only search icon
- **Clicked**: Expands to full width text input
- **On Submit**: Navigates to `/search?q=...`
- **Component**: Search.js

#### 2. Messages (with Badge)
```
  [💬]           ← Unread badge shows in corner
   (2)
```
- **Badge**: Shows unread count (0 = hidden)
- **Hover**: Tooltip "Messages"
- **Popover**: Click to show recent conversations preview
- **Full View**: Link to `/messages` (See all)
- **Component**: Messages.js

#### 3. Theme Toggle
```
  [🌞]    Dark Mode          [🌙]    Light Mode
  
  Click to toggle:
  localStorage.theme = 'dark' ↔ 'light'
```
- **Dark Mode** (default): Black bg, white text
- **Light Mode**: White bg, dark text
- **Persistence**: Saved in localStorage
- **CSS Hook**: `[data-theme="dark|light"]` attribute on HTML root

#### 4. Profile Avatar
```
  [👤]
  Avatar with border
  Click → Navigate to /creator/dashboard
```
- **Image**: User's profile picture (`auth.picture`)
- **Alt Text**: User display name
- **Border**: Sky blue (#0ea5e9)
- **Component**: CreatorDashboard.js

#### 5. Logout
```
  [🚪]
  Click → handleLogout()
       → Clear auth context
       → Navigate to /login
```
- **Handler**: `useAuth().handleLogout()`
- **Result**: Auth cleared, session terminated
- **Redirect**: `/login` page

---

## Header Conditional Rendering

```
App.js Logic:
┌─────────────────────────────────────────────────────────┐
│  const hideHeaderPaths = [                              │
│    '/',                  ← Landing page                 │
│    '/login',             ← Login page                   │
│    '/signup',            ← Signup page                  │
│    '/creator-signup',    ← Creator signup              │
│    '/entry'              ← Entry page                   │
│  ];                                                      │
│                                                          │
│  const hideHeader = hideHeaderPaths.includes(pathname); │
│                                                          │
│  {!hideHeader && <Header />}  ← Conditional render     │
└─────────────────────────────────────────────────────────┘
```

### Header Visibility Matrix

| Route | Path | Header | Layout |
|-------|------|--------|--------|
| Landing | `/` | ❌ Hidden | Centered container |
| Login | `/login` | ❌ Hidden | Centered form |
| Signup | `/signup` | ❌ Hidden | Centered form |
| Creator Signup | `/creator-signup` | ❌ Hidden | Centered form |
| Entry | `/entry` | ❌ Hidden | Centered container |
| Home | `/home` | ✅ Visible | Header + content below |
| Upload | `/upload` | ✅ Visible | Header + form |
| Explore | `/explore` | ✅ Visible | Header + grid |
| Video Call | `/videos/call` | ✅ Visible | Header + video |
| Messages | `/messages` | ✅ Visible | Header + two-panel |
| Search | `/search` | ✅ Visible | Header + results |
| Creator Profile | `/creator/:handle` | ✅ Visible | Header + profile |
| Dashboard | `/creator/dashboard` | ✅ Visible | Header + dashboard |
| 404 Error | `*` | ❌ Hidden | Centered error |

---

## CSS Class Hierarchy

```
.header (root)
├── .header__left
│   ├── .header__menu (hamburger button)
│   ├── .header__brand (logo + title link)
│   ├── .header__logo (image)
│   └── .header__title (text)
│
├── .header__nav (center icons)
│   ├── .header__nav-item (per icon, has .active state)
│   │   └── .header__icon (color + hover)
│
└── .header__right (right icons)
    ├── .search-form
    │   ├── .search-input (hidden until .open)
    │   ├── .search-icon-btn
    │   └── .search-close
    ├── .MuiBadge-root (messages badge)
    │   └── .header__icon (messages button)
    ├── .header__icon (theme button)
    ├── .profile-link (avatar link)
    │   └── .header__profile-img
    └── .header__icon (logout button)
```

---

## Responsive Behavior

### Desktop (> 880px)
```
[≡] [Logo] | [HOME] [UP] [EX] [VID] | [🔍input] [💬] [🌙] [👤] [🚪]
```
- All icons visible
- Center nav items shown
- Menu button hidden
- Search input full width

### Tablet (600 - 880px)
```
[≡] [Logo] |  | [🔍] [💬] [🌙] [👤] [🚪]
[← DRAWER MENU →]
```
- Center nav items hidden
- Menu button visible, shows drawer
- Search input narrower (160px when open)

### Mobile (< 600px)
```
[≡] [Logo] | [🔍] [💬] [🌙] [👤] [🚪]
[← DRAWER MENU →]
```
- Logo text hidden
- All center nav in drawer
- Very narrow search (120px when open)
- Avatar/buttons smaller

---

## Icon Color & Interaction States

### Default State
```css
.header__icon {
  color: var(--accent);  /* #0ea5e9 sky blue */
  cursor: pointer;
  transition: all 200ms ease;
}
```

### Hover State
```css
.header__icon:hover {
  background: rgba(14, 165, 233, 0.12);
  border-radius: 50%;
  padding: 8px;
}
```

### Active State (for nav items)
```css
.header__nav-item.active .header__icon {
  background: rgba(14, 165, 233, 0.12);
  border-radius: 50%;
  padding: 8px;
}
```

### Focus State (keyboard navigation)
```css
.header :focus {
  outline: 2px solid rgba(14, 165, 233, 0.12);
  outline-offset: 2px;
  border-radius: 8px;
}
```

---

## Data Flow: Icon Click → Navigation

### Example: Search Icon Click
```
User Click
    ↓
searchInputRef.current.focus()  ← Expand input
    ↓
User Types: "Fitness"
    ↓
onSubmit()
    ↓
navigate(`/search?q=Fitness`)
    ↓
<Route path="/search" element={<Search />} />
    ↓
<Search /> Component
    ↓
useSearchParams() → get query "Fitness"
    ↓
Display search results
```

### Example: Messages Icon Click
```
User Click
    ↓
setMessagesAnchor(e.currentTarget)  ← Show popover
    ↓
<Popover> displays mock conversations
    ↓
User clicks "See all" or conversation item
    ↓
<Link to="/messages" /> → navigate
    ↓
<Route path="/messages" element={<Messages />} />
    ↓
<Messages /> Component
    ↓
Display full messaging interface
```

---

## Theme Toggle Flow

```
User clicks theme button
    ↓
setTheme(t => t === 'dark' ? 'light' : 'dark')
    ↓
useEffect(() => {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
})
    ↓
CSS responds:
:root[data-theme="light"] {
  --bg: #ffffff;
  --text: #08101a;
}
    ↓
All components using CSS variables update instantly
```

---

## Component Integration Summary

```
Header.js
├── Uses: useLocation() → for active nav state
├── Uses: useNavigate() → for search/logout redirect
├── Uses: useAuth() → for profile/logout
├── Renders:
│   ├── NavItems (map from array)
│   ├── Search (expandable form)
│   ├── Messages (popover + link)
│   ├── Theme toggle
│   ├── Profile avatar (link)
│   ├── Logout button
│   └── Mobile drawer (all items)
│
└── Integrates with:
    ├── App.js (hideHeaderPaths logic)
    ├── Messages.js (route)
    ├── Search.js (route)
    ├── CreatorDashboard.js (profile route)
    ├── Auth.js (logout, auth state)
    └── All protected routes
```

---

**This diagram shows the complete architecture of the header component, its navigation flow, responsive behavior, and integration with other routes.**

For implementation details, see `IMPLEMENTATION_NOTES.md`
For quick reference, see `HEADER_ICON_MAPPING.md`
For testing procedures, see `HEADER_REFACTOR_SUMMARY.md`
