# WebWaka Suite POS

## Overview
Point of Sale suite for retail and commerce. This module is part of the WebWaka Modular Rebuild initiative.

**Current State:** Governance setup phase with placeholder landing page.

## Project Structure
```
/
├── index.js          # Express server (port 5000)
├── public/           # Static frontend assets
│   ├── index.html    # Landing page
│   ├── styles.css    # Styling
│   └── favicon.svg   # Favicon
├── package.json      # Node.js dependencies
├── module.manifest.json  # WebWaka module specification
├── module.contract.md    # Module API contract
└── README.md         # Project documentation
```

## Technical Stack
- **Runtime:** Node.js 20
- **Framework:** Express.js
- **Frontend:** Static HTML/CSS/JS

## Running the Application
```bash
npm start
```
Server runs on `http://0.0.0.0:5000`

## API Endpoints
- `GET /` - Landing page
- `GET /api/manifest` - Returns module manifest as JSON

## Recent Changes
- 2026-01-18: Initial Replit setup with Express server and landing page
