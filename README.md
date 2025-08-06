# Hypixel SkyBlock Shard Fusion Profit Calculator (OUTDATED AS  PER THE LAST FORAGING UPDATE)

A modern web application for calculating the most profitable shard fusion recipes in Hypixel SkyBlock, featuring real-time bazaar data and an intuitive interface.

## Features

- **Real-time Profit Calculations**: Automatically calculates profit margins for all shard fusion recipes using live bazaar data
- **Interactive Web Interface**: Modern Next.js frontend with responsive design
- **Price History Tracking**: Monitor price trends over time for better trading decisions
- **Automatic Data Updates**: Background refresh of bazaar prices and profit calculations
- **Comprehensive Recipe Database**: All fusion recipes from community-sourced data
- **Sorting & Filtering**: Find the most profitable recipes quickly

## Architecture

### Frontend (Active Development)

- **Next.js 14** with TypeScript
- **Tailwind CSS** for styling
- **SQLite** database with better-sqlite3
- Real-time API endpoints for data fetching
- Responsive design with modern UI components

### Backend (Legacy/Utilities)

- **Python scripts** for data processing and database initialization
- Original calculation logic (now ported to TypeScript)
- Utility scripts for data migration and batch processing

## Installation & Setup

### Prerequisites

- Node.js 18+
- Python 3.9+ (for legacy scripts)

### Frontend Setup (Recommended)

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at `http://localhost:3000`

### Database Initialization (First Time Setup)

If you need to initialize the database from scratch:

```bash
# Install Python dependencies
pip install -r requirements.txt

# Run the database builder (creates shard_recipes.db)
python build_database.py
```

## Project Structure

```
hypixel-fusion-project/
├── frontend/                   # Next.js application (main)
│   ├── app/
│   │   ├── api/               # API endpoints
│   │   │   ├── items/         # Get recipe data
│   │   │   ├── update-data/   # Refresh bazaar data
│   │   │   └── price-history/ # Historical pricing
│   │   ├── components/        # React components
│   │   ├── lib/              # Utility functions
│   │   └── page.tsx          # Main page
│   ├── data/                 # SQLite database
│   └── public/               # Static assets (shard icons)
│
├── backend/ (legacy)         # Python scripts
│   ├── build_database.py    # Database initialization
│   ├── calculate_profits.py # Profit calculations
│   ├── fetch_info.py        # Bazaar data fetching
│   └── main.py              # Legacy orchestrator
│
├── data/                    # Source data files
│   ├── Full Fusion List.csv # Community fusion recipes
│   └── shards_cleaned.json  # Shard metadata
│
└── README.md
```

## Usage

1. **Start the application**: `cd frontend && npm run dev` (or `cd frontend; npm run dev` in Windows)
2. **View recipes**: Browse all available fusion recipes sorted by profit
3. **Update data**: Click the refresh button or use the `/api/update-data` endpoint
4. **Monitor trends**: Check price history for market timing

### COPE Mode Toggle

The application features a **Boring/Cope** toggle switch that affects profit calculations:

- **Boring Mode** (Default): Standard profit calculations using current bazaar prices
- **Cope Mode**: Enhanced calculations that account for the 20% chance of reptile shards to double fusion output

When **Cope Mode** is enabled, recipes containing reptile family shards will show increased revenue (multiplied by 1.2) to reflect the expected value from the doubling chance. This helps you make more informed decisions when working with reptile shards like those from the Reptile family.

_Toggle between modes using the switch in the top-left corner of the interface._

## 📊 API Endpoints

- `GET /api/items` - Fetch all recipes with profit calculations
- `POST /api/update-data` - Refresh bazaar data and recalculate profits
- `GET /api/last-update` - Get timestamp of last data update
- `GET /api/price-history/:productId` - Get price history for a specific item

## Development

### Adding New Features

1. Frontend development in `frontend/app/`
2. API endpoints in `frontend/app/api/`
3. Utility functions in `frontend/app/lib/`

### Database Schema

- `shard_recipes` - Raw fusion recipes from CSV
- `shard_to_productid` - Shard metadata and bazaar IDs
- `shard_recipes_processed` - Recipes with bazaar IDs for calculations
- `bazaar_info` - Current bazaar prices
- `shard_profit_data` - Calculated profit data
- `product_price_history` - Historical pricing data

## Environment Variables

Create a `.env.local` file in the frontend directory:

```env
HYPIXEL_TOKEN=your_hypixel_api_key_here  # Optional but recommended
```

## Credits & Data Sources

- **Fusion Recipes**: [Community Spreadsheet](https://docs.google.com/spreadsheets/d/1yI5CLNYY2h_yzKaB0cFDUZQ_BdKQg8UUsjEDYCqV7Po/edit?usp=sharing)
  - Credit to HsFearless, MaxLunar & WhatYouThing for data collection
  - Sheet created by @lunaynx
- **Shard Metadata**: [HypixelShardOptimizer](https://github.com/Dazzlepuff/HypixelShardOptimizer) by Dazzlepuff (Check this fork for an updated version of the data [here](https://github.com/Lukasaurus11/HypixelShardOptimizer))
- **Bazaar Data**: [Hypixel SkyBlock API](https://api.hypixel.net)
- **Price History**: [Coflnet API](https://sky.coflnet.com)

## 🔧 Legacy Python Scripts

The Python scripts in the root directory are legacy tools that have been ported to TypeScript in the frontend. They can still be used for:

- Database initialization from scratch
- Batch data processing
- Development and testing

To use legacy scripts:

```bash
pip install -r requirements.txt
python main.py
```

## Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---
