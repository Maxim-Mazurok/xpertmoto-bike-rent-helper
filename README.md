# Xpert Moto Fleet Availability Dashboard

A real-time bike availability tracker for [Xpert Moto](https://xpertmoto.com.au), Sydney's premier motorcycle rental service. This dashboard provides a comprehensive view of fleet availability, pricing, and booking status across all motorcycles.

![Dashboard Preview](https://img.shields.io/badge/Status-Live-brightgreen) ![React](https://img.shields.io/badge/React-19.2-blue) ![Vite](https://img.shields.io/badge/Vite-7.3-purple)

## ✨ Features

- **Progressive Loading** - Table appears immediately with bike info while availability loads in background with animated skeleton states
- **Real-time Availability Tracking** - Live synchronization with Izyrent booking system
- **Interactive Date Filtering** - Click date headers to filter bikes available on specific dates (supports multiple selections with OR logic)
- **30-Day Calendar View** - Visual grid showing availability status for the next month
- **Dynamic Pricing Calculator** - Select rental duration (1 day to 4+ weeks) with automatic bulk pricing
- **Price Sorting** - Sort fleet by price (ascending/descending) for any duration
- **Bike Thumbnails** - Visual identification with motorcycle images
- **Direct Booking Links** - Click any bike name to open its booking page on xpertmoto.com.au
- **Status Indicators**
  - 🟢 **Available** - Ready to rent
  - 🔴 **Booked** - Currently reserved
  - 🟠 **Shop Closed** - Sundays and holidays
  - 🟡 **Half Day** - Saturdays (limited hours)

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Internet connection (for fetching live data from Xpert Moto APIs)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/xpertmoto-bike-rent-helper.git
   cd xpertmoto-bike-rent-helper
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Add product data**
   
   Place your `example.json` file (containing Shopify product data) in the `public/` folder. This file should contain the product catalog with metafields for pricing and variant information.

4. **Start the development server**
   ```bash
   npm run dev
   ```

   The app will be available at [http://localhost:5173](http://localhost:5173).

5. **Build for production**
   ```bash
   npm run build
   ```

## 📁 Project Structure

```
xpertmoto-bike-rent-helper/
├── public/
│   └── example.json         # Shopify product catalog (you provide this)
├── src/
│   ├── components/
│   │   └── AvailabilityTable.jsx  # Main table component
│   ├── utils/
│   │   └── dataFetcher.js   # Fetches data from Shopify & Izyrent APIs
│   ├── App.jsx              # Root component with duration selector
│   └── index.css            # Tailwind CSS styles
└── package.json
```

## 🎯 How It Works

**100% Frontend - No Backend Required!**

1. **Data Fetching** (`src/utils/dataFetcher.js`)
   - Fetches product images from Shopify's `products.json` endpoint
   - Loads `example.json` from the public folder
   - Extracts pricing tiers and variant metadata
   - Queries Izyrent API for real-time booking data (CORS-enabled)
   - Aggregates everything in the browser

2. **Frontend** (`src/`)
   - React + Vite for fast development
   - Tailwind CSS v4 for styling
   - Dynamic pricing calculation based on selected duration
   - Sortable table with sticky columns

## 🔧 Configuration

### Pricing Structure

The dashboard automatically handles Xpert Moto's tiered pricing:
- **Daily rates** (1-6 days): Total price for the period
- **Weekly rates** (7+ days): Per-week pricing with bulk discounts

Example for YAMAHA NMAX155:
- 1 day: $110
- 7 days: $160/week = $160 total
- 14 days: $148/week × 2 = $296 total

## 🌐 Deployment

### GitHub Pages (Automated Guide)
 
 This repository is configured to automatically deploy to GitHub Pages using GitHub Actions.
 
 1. **Commit & Push**
    Simply push your code to the `main` or `master` branch.
 
 2. **Configure Repository Settings**
    - Go to your repository on GitHub.
    - Navigate to **Settings** > **Pages**.
    - Under **Build and deployment**, select **GitHub Actions** as the source.
 
 3. **Verify Deployment**
    - The `Deploy to GitHub Pages` workflow will run automatically.
    - Once completed, your site will be live at `https://yourusername.github.io/xpertmoto-bike-rent-helper/`.
 
 ### Vercel / Netlify / Other Static Hosts
 
 Since this is a pure static site, it can be deployed anywhere:
 
 1. Connect your repository to Vercel/Netlify.
 2. Framework preset: **Vite**
 3. Build command: `npm run build`
 4. Output directory: `dist`
 5. Deploy!
 
 **Note:** Ensure `public/example.json` is included in the deployment.

### Alternative: Any Static Host

```bash
npm run build
# Deploy the `dist/` folder to:
# - Netlify
# - GitHub Pages
# - Cloudflare Pages
# - Any static hosting service
```

## 📊 API Endpoints Used

### External APIs (called from browser)

- `GET https://xpertmoto.com.au/products.json?limit=250` - Product images
- `POST https://izyrent.speaz.com/front/get_bookings` - Real-time bookings

Both APIs support CORS (`Access-Control-Allow-Origin: *`), so no proxy needed!

## 🤝 Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development guidelines and how to contribute to this project.

## ⚠️ Disclaimer

This project was AI-generated using **Google Antigravity** with the following AI models:
- **Gemini 2.0 Flash** (Google)
- **Claude 4.5 Sonnet** (Anthropic)

While functional, the code may require human review and optimization for production use. This is an independent project and is not officially affiliated with Xpert Moto.

## 📄 License

ISC

## 🙏 Acknowledgments

- [Xpert Moto](https://xpertmoto.com.au) - Sydney's best motorcycle rental service
- [Izyrent](https://izyrent.com) - Booking system integration
- [Shopify](https://shopify.com) - Product catalog API
