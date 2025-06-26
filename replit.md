# Investment Research Platform

## Overview

This is a comprehensive investment research platform built with a modern full-stack architecture. The application provides macroeconomic indicators, financial calendar events, AI-powered news analysis, and automated data collection services to help investors make informed decisions. The platform is designed with a clean, professional interface supporting both English and Traditional Chinese content.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized production builds
- **UI Framework**: Tailwind CSS with shadcn/ui component library
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query for server state management
- **Styling**: Radix UI primitives with custom Tailwind configuration

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **API Design**: RESTful endpoints with JSON responses

### Development Environment
- **Bundling**: ESBuild for server-side bundling
- **Development Server**: Vite dev server with HMR
- **Process Manager**: TSX for TypeScript execution in development
- **Environment**: Replit-optimized with specific configurations

## Key Components

### Data Collection Services
- **News Service**: Web scraping with Puppeteer for Reuters and Bloomberg
- **Economic Data Service**: Alpha Vantage API integration for macroeconomic indicators
- **Calendar Service**: Predefined financial events with date-based filtering
- **Scheduler Service**: Cron-based automation for periodic data updates

### AI Integration
- **AI Service**: OpenAI GPT-4 integration for news summarization
- **Content Analysis**: Automated generation of market insights in Traditional Chinese
- **Categorization**: News classification by market sectors and importance

### Storage Layer
- **Database Schema**: Five main tables for economic indicators, calendar events, news articles, AI summaries, and system configuration
- **ORM**: Drizzle with Zod validation schemas
- **Storage Interface**: Abstract storage interface with in-memory fallback implementation

### User Interface Components
- **Dashboard**: Comprehensive overview with real-time data updates
- **Economic Indicators**: Interactive cards showing key metrics with trend indicators
- **Financial Calendar**: Event timeline with category-based filtering
- **News Panel**: Tabbed interface for news articles and AI summaries
- **Configuration Panel**: System settings and service status monitoring

## Data Flow

1. **Data Collection**: Automated services collect data from external APIs and web scraping
2. **Data Processing**: Raw data is cleaned, categorized, and stored in PostgreSQL
3. **AI Analysis**: News articles are processed by OpenAI for generating market summaries
4. **API Layer**: Express.js serves processed data through RESTful endpoints
5. **Frontend Consumption**: React components fetch and display data using TanStack Query
6. **Real-time Updates**: Scheduled tasks ensure data freshness with configurable intervals

## External Dependencies

### Required Services
- **OpenAI API**: For AI-powered news analysis and summarization
- **Alpha Vantage API**: For real-time economic indicators and market data
- **Neon Database**: PostgreSQL hosting with serverless architecture

### Development Tools
- **Puppeteer**: For web scraping financial news sources
- **Node-cron**: For scheduling automated data collection
- **Drizzle Kit**: For database migrations and schema management

### UI Libraries
- **Radix UI**: Accessible component primitives
- **Lucide React**: Icon library for consistent visual design
- **TanStack Query**: Server state synchronization
- **React Hook Form**: Form handling with validation

## Deployment Strategy

### Production Build
- **Frontend**: Vite builds optimized static assets to `dist/public`
- **Backend**: ESBuild bundles server code to `dist/index.js`
- **Database**: Drizzle migrations applied via `npm run db:push`

### Environment Configuration
- **Replit Deployment**: Configured for autoscale deployment target
- **Port Configuration**: Server runs on port 5000, external port 80
- **Environment Variables**: Database URL and API keys via environment variables

### Scaling Considerations
- **Database**: Serverless PostgreSQL scales automatically
- **Caching**: TanStack Query provides client-side caching
- **API Rate Limiting**: External API calls are throttled to prevent quota exhaustion

## Changelog
- June 26, 2025. Initial setup
- June 26, 2025. Enhanced platform with:
  - Local file storage system for markdown summaries (storage/summaries/YYYY-MM-DD/關鍵字.md)
  - Raw news data storage in JSON format for backup and analysis
  - Comprehensive macroeconomic indicators including:
    - 消費物價指數 (CPI)
    - 勞動市場數據 (失業率)
    - 主要避險貨幣 (美元/日圓, 美元/瑞士法郎)
    - 央行及聯準會利率 (Fed, ECB, BOJ, 台灣央行)
    - 商品期貨 (黃金, 原油, 玉米等農產品)
  - Streamlit integration API endpoints for external data access
  - File cleanup and export functionality for data management

## User Preferences

Preferred communication style: Simple, everyday language.