


          
# Bakery Management System

A comprehensive web application for managing bakery operations, including production, delivery, and administration. This system connects bakeries, production laboratories, delivery personnel, and administrators in a unified platform.

## Overview

The Bakery Management System is built with Next.js and provides specialized dashboards for different user roles:

- **Admin**: Oversee all operations, manage users, products, orders, and deliveries
- **Bakery**: Place orders, track production, and manage bakery-specific operations
- **Laboratory**: Manage production schedules and track order fulfillment
- **Delivery**: Manage delivery routes and track deliveries

## Features

### Admin Dashboard
- User management
- Product catalog management
- Order tracking and management
- Delivery oversight
- System settings configuration

### Bakery Dashboard
- Order placement and tracking
- Product catalog browsing
- Profile management
- Production status monitoring

### Laboratory Dashboard
- Production queue management
- Order fulfillment tracking
- Production scheduling

### Delivery Dashboard
- Route planning and optimization
- Delivery status updates
- Delivery confirmation
- Route history and reporting

## Technology Stack

- **Frontend**: Next.js, React, TypeScript
- **UI Components**: Shadcn UI components
- **Styling**: Tailwind CSS
- **State Management**: React Hooks
- **Authentication**: Custom authentication system

## Project Structure

```
bakery/
├── app/                  # Next.js app directory
│   ├── admin/            # Admin role pages
│   ├── bakery/           # Bakery role pages
│   ├── delivery/         # Delivery role pages
│   ├── laboratory/       # Laboratory role pages
│   └── layout.tsx        # Root layout
├── components/           # Reusable components
│   ├── auth/             # Authentication components
│   ├── layout/           # Layout components
│   └── ui/               # UI components
├── hooks/                # Custom React hooks
├── lib/                  # Utility functions
└── public/               # Static assets
```

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or pnpm

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/bakery.git
cd bakery
```

2. Install dependencies
```bash
npm install
# or
pnpm install
```

3. Run the development server
```bash
npm run dev
# or
pnpm dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Demo Accounts

For demonstration purposes, the following accounts are available:

- **Admin**: admin@boulangerie.fr / admin123
- **Bakery**: bakery@boulangerie.fr / bakery123
- **Laboratory**: lab@boulangerie.fr / lab123
- **Delivery**: delivery@boulangerie.fr / delivery123

## License

This project is licensed under the MIT License - see the LICENSE file for details.

        