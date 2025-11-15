# ERP-TV Codebase AI Agent Instructions

## Project Overview
**ERP-TV** is a Next.js 16 + React 19 production management system for tracking hourly production metrics, quality inspections, and media links. It separates **Production Users** (enter metrics) from **Quality Users** (review inspections) with dual authentication contexts.

**Key Tech Stack:**
- Next.js 16 (App Router), React 19, MongoDB, Mongoose, Tailwind CSS, Framer Motion

---

## Architecture & Data Flow

### 1. Dual Authentication System
- **ProductionAuthProvider** (`app/providers/ProductionAuthProvider.js`) — Production users (factory operators)
- **AuthProvider** (`app/providers/AuthProvider.js`) — Quality/admin users
- **Both use localStorage + context** with hydration guards to prevent blink/flash
- Sync across browser tabs via `storage` event listener
- Always check `ProductionAuth?.id` or `auth?.id` before making requests

**Pattern:** Import hooks `useProductionAuth()` and `useAuth()` in client components to access auth state.

### 2. Database Models & Snapshots
Three core models in `models/`:
- **ProductionHeaderModel** — Daily production planning data (SMV, target, efficiency, manpower)
  - Upsert by `{ "productionUser.id": userId, productionDate: "YYYY-MM-DD" }`
  - Stores **user snapshots** (no passwords) for audit trail
- **RegisterModel** — Static line configuration (buyer, building, floor, style, SMV)
- **Production-user-model.js** — Factory operator credentials

**Critical:** Models use Mongoose `.lean()` for read ops (no hydration overhead) and `.save()` for writes.

### 3. API Routes Pattern
- **GET** — Query by user ID + date (e.g., `/api/production-headers?productionUserId=...&date=YYYY-MM-DD`)
- **POST** — Create/Upsert new record; validate optional number fields
- **PATCH** (if needed) — Update specific record; use `.findOneAndUpdate()` for atomicity
- **DELETE** — Remove record and return success/data in response

**Error Handling:** Return `{ success: false, message: "...", errors: [...] }` with appropriate HTTP status.

### 4. Server Components & Data Fetching
Pages like `app/ProductionHomePage/page.js` are **async server components**:
```javascript
export default async function ProductionHomePage() {
  const productionHeaderData = await ProductionHeaderModel.find();
  // ✅ Safe to fetch during render, no hydration issues
  return <WorkingHourCard data={productionHeaderData} />;
}
```
- **Never use `useEffect` to fetch in server components** (contradiction in terms)
- Pass fetched data as props to client child components
- Use `"use client"` **only** in components that need interactivity (forms, state, hooks)

---

## File Organization & Conventions

### Directory Structure
- `app/api/` — Next.js route handlers (GET, POST, PATCH, DELETE)
- `app/components/` — Reusable React components (buttons, forms, cards)
- `app/ProductionComponents/` — Production-specific UI (e.g., `HourlyProductionInput.jsx`, `WorkingHourCard.jsx`)
- `app/providers/` — Context providers (auth, theme)
- `app/hooks/` — Custom hooks (e.g., `useProductionAuth()`, `useAuth()`)
- `models/` — Mongoose schemas (not traditional ORM models)
- `services/mongo.js` — Single `dbConnect()` export for all routes

### Naming & Code Style
- **Components:** PascalCase (`.jsx`), e.g., `HourlyProductionInput.jsx`
- **Pages:** kebab-case folders, e.g., `ProductionHomePage/page.js`
- **Fields:** camelCase for JS, use existing patterns (e.g., `operatorTo`, `manpowerPresent`, `smv`)
- **Comments:** Use emoji markers for clarity:
  - `🔹` = Key point/feature
  - `🔸` = API endpoint section
  - `✅` = New/updated field
  - `⚙️` = Formula/calculation

---

## Key Patterns & Workflows

### Production Header Flow (Typical CRUD)
1. **Read Today's Data:**
   ```javascript
   const res = await fetch(`/api/production-headers?productionUserId=${userId}`);
   const { data } = await res.json();
   ```
2. **Save/Update:**
   ```javascript
   const payload = { operatorTo: 32, manpowerPresent: 30, smv: 1.2, ... };
   const res = await fetch('/api/production-headers', {
     method: 'POST',
     body: JSON.stringify(payload)
   });
   ```
   - API auto-upserts by `productionUser.id + productionDate`
3. **Form State:** Keep `form` state in component, map header → form fields with `fillFormFromHeader()`

### Calculation Patterns (WorkingHourCard)
- **Hourly Target** = `workingHour × presentManpower ÷ smv × planEfficiency`
- **Variance Qty** = `hourlyTarget - achieved`
- **Hourly Efficiency %** = `(achieved × smv × 100) ÷ (presentManpower × 60)`
- Use `useMemo()` to avoid recalculating on every render

### Form Validation
- **Optional number fields:** Parse with `Number()`, check `isNaN()`, collect errors
- **Required fields:** Check existence before creating payload
- **User snapshots:** Extract from auth context, **never send passwords**
  ```javascript
  productionUser: {
    id: ProductionAuth.id,
    Production_user_name: ProductionAuth.Production_user_name,
    // NO password field
  }
  ```

---

## Common Tasks & Implementation Notes

### Adding a New Production Field
1. **Schema:** Add field to `ProductionHeaderSchema` in `models/ProductionHeader-model.js` (e.g., `newField: { type: Number }`)
2. **API:** Add to POST body parsing, validate with `parseOptionalNumber()`, include in upsert `doc` object
3. **Component:** Add to form state in `HourlyProductionInput.jsx`, add `<Field>` input element
4. **WorkingHourCard:** Pass via props if needed, use in calculations if applicable

### Creating a New API Endpoint
- Place in `app/api/[resource]/route.js`
- Always call `await dbConnect()` first
- Return `{ success: true/false, data: ..., message: ... }` structure
- Use `Response.json()` with status codes (200, 400, 500)

### Styling & Responsive Design
- **Tailwind CSS v4** with PostCSS configured
- **Dark mode:** CSS variables in `globals.css`, toggle via `localStorage` theme key
- **Responsive:** Use `sm:`, `md:`, `lg:` breakpoints; prefer grid for layouts
- **Icons:** Lucide React (`lucide-react`), react-icons, Material Symbols

---

## Build, Run & Debug

### Scripts
```bash
npm run dev      # Start Next.js dev server (http://localhost:3000)
npm run build    # Production build
npm run start    # Run production server
npm run lint     # ESLint check
```

### Debugging
- **Browser DevTools:** Check `localStorage` for `authUser` and `theme`
- **Server logs:** Watch terminal for errors during API calls
- **Mongoose:** Enable debug mode with `mongoose.set('debug', true)` if needed
- **Next.js:** Use `next/image` for optimization, `next/font` for fonts

### Environment
- **MongoDB:** Via `process.env.MONGO_URI` (set in `.env.local`)
- **Cloudinary:** Configured in package (for media links)
- **No build-time env vars:** Only runtime `.env.local` is used

---

## Gotchas & Best Practices

1. **Hydration Issues:** Always use hydration guard in providers (check `typeof window`)
2. **Date Strings:** Use `"YYYY-MM-DD"` format consistently (generated via `new Date().toISOString().slice(0, 10)`)
3. **Lean Queries:** Use `.lean()` for read-only operations in API handlers (better performance)
4. **User Snapshots:** Store immutable user data at creation time; never update fields in snapshot
5. **Client/Server Boundary:** Mark components with `"use client"` only if they use hooks, state, or event handlers
6. **Error Messages:** Chain them (`errors.push()`) and return array in API response
7. **Upsert Logic:** Check `findOne()` first to maintain document ID and audit history

---

## Quick Reference: File Locations

| Task | File(s) |
|------|---------|
| Add production field | `models/ProductionHeader-model.js`, `app/api/production-headers/route.js`, `ProductionComponents/HourlyProductionInput.jsx` |
| Fix auth flow | `providers/AuthProvider.js`, `providers/ProductionAuthProvider.js`, `hooks/useAuth.js`, `hooks/useProductionAuth.js` |
| Create new page | `app/[PageName]/page.js` + child components in `components/` or `[PageName]Components/` |
| Update styling | `globals.css` (theme vars), individual component files (Tailwind classes) |
| Add API endpoint | `app/api/[resource]/route.js` (GET, POST, PATCH, DELETE exports) |
| Connect to DB | Import model, call `dbConnect()`, use Mongoose methods (`.find()`, `.create()`, `.findOneAndUpdate()`) |
