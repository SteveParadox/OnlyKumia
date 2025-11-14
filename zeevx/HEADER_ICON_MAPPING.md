# Header Icon Mapping Reference

Quick reference for all header icon → component/route links in OnlyKumia.

## Navigation Icons (Center)

| Icon | Label | Route | Component | Status |
|------|-------|-------|-----------|--------|
| 🏠 | Home | `/home` | Home/Cards.js + Home/SwipeButtons.js | ✅ Working |
| 📤 | Upload | `/upload` | User/Upload.js | ✅ Working |
| 🔍 | Explore | `/explore` | User/NewExplore.js | ✅ Working |
| 📹 | Video Call | `/videos/call` | Service/VideoCall.js | ✅ Working |

## Action Icons (Right)

| Icon | Label | Action/Route | Component/Handler | Status |
|------|-------|-------|-----------|--------|
| 🔎 | Search | `/search?q=...` | Pages/Search.js | ✅ New (Click expands input, submit navigates) |
| 💬 | Messages | `/messages` or Popover | Pages/Messages.js | ✅ New (Badge shows unread count) |
| 🌞/🌙 | Theme Toggle | localStorage | Header.js `setTheme()` | ✅ Working (Dark/Light) |
| 👤 | Profile Avatar | `/creator/dashboard` | Pages/CreatorDashboard.js | ✅ Working |
| 🚪 | Logout | Auth clear | Auth/Auth.js `handleLogout()` | ✅ Working |

## File Structure

```
zeevx/src/
├── Home/
│   └── Header.js                 (Main header component)
├── Pages/
│   ├── Messages.js               (NEW: messaging interface)
│   └── Search.js                 (NEW: search results)
├── Css/
│   ├── Header.css                (Scoped to .header)
│   ├── Messages.css              (NEW: scoped to .messages-page)
│   ├── Search.css                (NEW: scoped to .search-page)
│   └── design-system.css         (Global tokens)
├── App.js                        (Routes + conditional header rendering)
└── App.css                       (NEW: global layout + MUI overrides)
```

## Search Implementation Example

**Frontend**: User clicks search icon → Input expands → Types query → Presses Enter or clicks search button
```javascript
onSearchSubmit = (e) => {
  navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
}
```

**Backend TODO**: `/search` endpoint should accept `?q=` parameter and return:
```json
{
  "creators": [...],
  "content": [...],
  "messages": [...]
}
```

## Messages Implementation Example

**Frontend**: User clicks messages icon → Shows popover with recent conversations → Clicks "See all" or conversation item
```javascript
<Tooltip title="Messages" arrow>
  <IconButton onClick={(e) => setMessagesAnchor(e.currentTarget)}>
    <Badge badgeContent={unreadCount} color="info">
      <ChatBubbleRoundedIcon />
    </Badge>
  </IconButton>
</Tooltip>
```

**Backend TODO**: 
- `GET /messages/history?conversationId=...` - fetch messages
- `POST /messages/send` - send new message
- WebSocket events: `message:new`, `message:read`, `typing:start`, `typing:stop`

## Quick Testing

### Test Navigation
```bash
# These routes should display header + content
http://localhost:3000/home       # ✅ Header visible
http://localhost:3000/upload     # ✅ Header visible
http://localhost:3000/explore    # ✅ Header visible
http://localhost:3000/videos/call # ✅ Header visible
http://localhost:3000/messages   # ✅ Header visible, NEW
http://localhost:3000/search     # ✅ Header visible, NEW

# These routes should NOT display header
http://localhost:3000/            # ✅ Landing page, no header
http://localhost:3000/login       # ✅ Login page, no header
http://localhost:3000/signup      # ✅ Signup page, no header
http://localhost:3000/creator-signup  # ✅ Creator signup, no header
```

### Test Icon Interactions
```javascript
// In browser console while on any protected route:

// 1. Test search navigation
document.querySelector('[aria-label="Open search"]').click();
// Type something and press Enter

// 2. Test messages
document.querySelector('[aria-label="Open messages preview"]').click();
// Should show popover

// 3. Test theme toggle
document.querySelector('[aria-label="Toggle theme"]').click();
// Should switch dark/light

// 4. Test profile link
document.querySelector('.profile-link').click();
// Should navigate to /creator/dashboard

// 5. Test logout
document.querySelector('[aria-label="Logout"]').click();
// Should redirect to /login
```

## CSS Isolation Verification

All Header styles are scoped to `.header` selector:

```css
.header { ... }                      /* Root element */
.header__left { ... }                /* Logo + menu button */
.header__nav { ... }                 /* Center navigation */
.header__icon { ... }                /* Icon styling */
.header__right { ... }               /* Right actions */
.search-form.open { ... }            /* Expandable search */
.messages-popover { ... }            /* Message preview */
```

**No global styles** like `html`, `body`, `*`, or tag selectors that could interfere with other pages.

---

## Status Summary

✅ All 9 header icons → linked to functional components
✅ 2 new routes created (Messages, Search)
✅ CSS properly scoped (no interference)
✅ Route paths consistent
✅ Ready for backend integration

See `HEADER_REFACTOR_SUMMARY.md` for detailed documentation.
