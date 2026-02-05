# Contributing to Xpert Moto Fleet Availability Dashboard

Thank you for your interest in contributing! This document provides guidelines for developers who want to understand, modify, or extend this project.

## 🏗️ Architecture Overview

### Tech Stack

- **Frontend**: React 19.2 + Vite 7.3
- **Styling**: Tailwind CSS v4
- **Data Sources**: 
  - Shopify Products API (`products.json`)
  - Izyrent Booking API (`get_bookings`)
  - Local `example.json` (product catalog)

### Data Flow

```
┌─────────────────┐
│  Shopify API    │──┐
│ (products.json) │  │
└─────────────────┘  │
                     │
┌─────────────────┐  ├──▶ dataFetcher.js (browser) ──▶ React State
│  Izyrent API    │──┤
│ (get_bookings)  │  │
└─────────────────┘  │
                     │
┌─────────────────┐  │
│ example.json    │──┘
│ (public folder) │
└─────────────────┘
```

**No backend server required!** All API calls happen directly from the browser thanks to CORS support.

## 🛠️ Development Setup

### 1. Clone and Install

```bash
git clone https://github.com/yourusername/xpertmoto-bike-rent-helper.git
cd xpertmoto-bike-rent-helper
npm install
```

### 2. Required Files

You'll need `example.json` in the `public/` folder. This file contains:
- Shopify product data
- Metafields with pricing tiers (`newMetafields.value`)
- Variant stock information

**Structure**:
```json
{
  "data": {
    "product0": {
      "handle": "yamaha-nmax155-rental",
      "id": "gid://shopify/Product/...",
      "newMetafields": {
        "value": "{\"stock\":\"product\",\"variantStock\":{...}}"
      }
    }
  }
}
```

### 3. Start Development

```bash
npm run dev
```

This runs Vite dev server on port 5173. The app will fetch data directly from Shopify and Izyrent APIs in the browser.

## 📂 Key Files Explained

### `src/utils/dataFetcher.js`

**Purpose**: Fetches and aggregates data from multiple sources (runs in browser).

**Key Functions**:
- `fetchAvailabilityData(exampleData)` - Main orchestrator
  - Fetches product images from Shopify
  - Parses `example.json` for pricing and variants
  - Queries Izyrent API for each bike's bookings
  - Returns aggregated data object

**Izyrent API Payload**:
```javascript
{
  shop: "7f13fc-4d.myshopify.com",
  idProduct: 8012345678,
  interval: {
    stock: "product",
    variantStock: { /* variant-specific data */ }
  },
  countLastRangeDay: false,
  timeRange: false,
  expiration: 15
}
```

**Response Format**:
```javascript
{
  "2026/02/05": true,           // Fully booked
  "2026/02/06_start": true,     // Booked at start of day
  "2026/02/07_end": true        // Booked at end of day
}
```

### `src/App.jsx`

**Purpose**: Root component that loads data and manages state.

**Key Logic**:
- Fetches `example.json` from public folder
- Calls `fetchAvailabilityData()` to aggregate all data
- Manages `duration` and `sortOrder` state

### `src/components/AvailabilityTable.jsx`

**Purpose**: Main table component displaying availability grid.

**Key Functions**:

1. **`getStatus(bike, date)`** - Determines cell status
   - Checks global closures (Sundays, holidays)
   - Checks bookings from Izyrent
   - Returns: `'available'`, `'booked'`, `'closed'`, or `'half'`

2. **`getPriceForDuration(bike, days)`** - Calculates pricing
   - For 1-6 days: Uses total price from tier
   - For 7+ days: Uses per-week rate × number of weeks
   
   **Example**:
   ```javascript
   // Tier: { days: 8, to: 14, price: 148 }
   // For 14 days: 148 (per week) × 2 weeks = $296
   ```

3. **`sortedBikes`** - Memoized sorted array
   - Sorts by price (asc/desc) or alphabetically

### `src/App.jsx`

**Purpose**: Root component with state management.

**State**:
- `duration` - Selected rental duration (1, 2, 3, 7, 14, 21, 28 days)
- `sortOrder` - Price sorting direction (`'asc'` or `'desc'`)

## 🎨 Styling Guide

### Tailwind CSS v4

This project uses Tailwind CSS v4 with custom design tokens:

**Status Colors** (defined in `index.css`):
```css
.status-available { @apply bg-emerald-500/20; }
.status-booked { @apply bg-red-500/20; }
.status-closed { @apply bg-orange-500/20; }
.status-half { @apply bg-yellow-500/20; }
```

**Glass Morphism**:
```css
.glass-card {
  @apply bg-slate-900/30 backdrop-blur-xl border border-white/10;
}
```

## 🧪 Testing Locally

### Check Browser Console

Open DevTools and watch the console for:
```
[Fetch] Starting data aggregation...
[Fetch] Fetching product images from Shopify...
[Fetch] Found 17 bike variants
[Fetch] Fetching bookings for YAMAHA NMAX155...
[Fetch] Data aggregation complete!
```

### Inspect Data in Browser

Open DevTools Console and run:
```javascript
// Check loaded data
console.log(window.__REACT_DEVTOOLS_GLOBAL_HOOK__);

// Or add a debug log in App.jsx:
useEffect(() => {
  console.log('Loaded data:', data);
}, [data]);
```

## 🐛 Common Issues

### 1. "Failed to load data" error

**Cause**: `example.json` not found in public folder.

**Fix**: Ensure `public/example.json` exists and is valid JSON.

### 2. Pricing shows $0.00

**Cause**: Missing or malformed pricing data in `example.json`.

**Fix**: Verify `newMetafields.value` contains valid JSON with `variantStock[variantId].prices` array.

### 3. Images not loading

**Cause**: Shopify `products.json` endpoint unreachable or bike handle mismatch.

**Fix**: Check browser console for fetch errors. Verify handles match between `example.json` and Shopify.

### 4. CORS errors

**Cause**: Browser blocking cross-origin requests (shouldn't happen with Shopify/Izyrent).

**Fix**: Check that you're running on `localhost` or a proper domain. File:// protocol won't work.

## 📝 Code Style

- **ES Modules**: Use `import/export` syntax
- **Async/Await**: Preferred over `.then()` chains
- **Error Handling**: Always wrap API calls in try/catch
- **Console Logging**: Use descriptive prefixes (`[Sync]`, `[API]`, etc.)

## 🚀 Adding New Features

### Example: Add a "Favorites" Feature

1. **Update State** (`App.jsx`):
   ```javascript
   const [favorites, setFavorites] = useState([]);
   ```

2. **Modify Table** (`AvailabilityTable.jsx`):
   ```javascript
   <button onClick={() => onToggleFavorite(bike.variantId)}>
     ⭐
   </button>
   ```

3. **Persist** (localStorage):
   ```javascript
   useEffect(() => {
     localStorage.setItem('favorites', JSON.stringify(favorites));
   }, [favorites]);
   ```

## 🔄 Pull Request Process

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📚 Resources

- [Vite Documentation](https://vite.dev)
- [React Documentation](https://react.dev)
- [Tailwind CSS v4](https://tailwindcss.com/docs)
- [Izyrent API](https://izyrent.speaz.com) (reverse-engineered)

## 🤖 AI Generation Note

This project was generated using **Google Antigravity** with:
- **Gemini 2.0 Flash** (initial scaffolding, data fetching logic)
- **Claude 4.5 Sonnet** (UI refinements, pricing calculations)

The AI handled:
- API reverse engineering (Izyrent)
- React component architecture
- Tailwind CSS styling
- Express backend setup
- Documentation

## 📧 Questions?

Open an issue on GitHub or contact the maintainers.

---

Happy coding! 🏍️✨
