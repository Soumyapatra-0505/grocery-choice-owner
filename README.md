# Grocery Choice - Store Owner & Management Portal

This directory contains the independent **Owner Portal** application for **Grocery Choice**, built with React 19, Vite 8, React Router v7, and Vanilla CSS.

## Features

- **Owner Authentication**: Secure sign-in workflow with one-click demo credentials for quick evaluation.
- **Store KPI Dashboard**: Live metrics for Total Products, Total Orders, Today's Sales, and Low Stock Alerts.
- **Product Catalog Management**:
  - Full catalog listing with image previews, pricing, units, and search/category filters.
  - **Add Product**: Publish new products with categories, MRP, discount price, units, stock, and descriptions.
  - **Edit Product**: Update existing items and change storefront placement tags (*Popular*, *Deals*, *Household*).
  - **Delete Product**: Modal confirmation to remove products.
  - **Quick Stock Stepper**: Increment or decrement stock units directly from the table.
- **Inventory & Stock Control**:
  - Real-time stock counts with healthy, low stock (≤ 10), and out-of-stock highlights.
  - One-click quick restock buttons (+10, +25, +50 units).
- **Categories & Departments**:
  - Department overview with linked product counts.
  - Add new category dialog with custom emoji icon support.
- **Customer Orders Management**:
  - Orders table with customer contact details and exact delivery location addresses.
  - Interactive status dropdown (`Placed`, `Processing`, `Out for Delivery`, `Delivered`, `Cancelled`).
- **Customer Directory**: Registered customer accounts with order counts and lifetime spend.
- **Reports & Analytics**: Category revenue distribution and fulfillment speed indicators.

## Running the Owner Application

Inside `owner/`:

```bash
# Start Owner Portal development server on http://localhost:5174
npm run dev

# Build production bundle
npm run build

# Run linter
npm run lint

# Preview production build
npm run preview
```
