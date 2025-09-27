# Client name

## Overview

Client name is a comprehensive expense management web application designed to replace outdated expense systems. The platform digitizes and streamlines the entire expense workflow from employee submission to accountant approval and payment processing. Built with a modern tech stack, it features role-based access control for employees, accountants, and administrators, supporting the complete expense lifecycle including pre-approval requests, expense claims with receipt uploads, direct company expenses, payment processing, and comprehensive reporting.

## User Preferences

Preferred communication style: Simple, everyday language.

**Date Format Requirements:**
- All dates must display in DD-MM-YYYY format using 'en-GB' locale
- Currency displays must use Indian Rupees (₹) instead of US Dollars ($)
- Date inputs (HTML) continue to use YYYY-MM-DD format for API compatibility
- Use utility functions from `/lib/utils.ts` for consistent date handling in future features

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **UI Framework**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Authentication**: Replit Auth with OpenID Connect (OIDC) integration
- **Session Management**: Express sessions with PostgreSQL store
- **File Uploads**: Multer middleware for receipt and document handling

### Layout Standards
**CRITICAL**: All pages must use consistent flexbox layout structure - NO pages should be "moved down" with excessive white space:

```tsx
// CORRECT Layout Structure (use this for all pages)
<div className="flex h-screen bg-gray-50">
  <Sidebar />
  <div className="flex-1 flex flex-col min-h-0">
    <Header />
    <main className="flex-1 overflow-y-auto p-6">
      {/* Page content */}
    </main>
  </div>
</div>

// INCORRECT Layout Structure (DO NOT USE)
<div className="min-h-screen bg-gray-50">
  <Sidebar />
  <div className="ml-60">  {/* This causes excessive white space */}
    <Header />
    <main className="p-6">
      {/* Page content */}
    </main>
  </div>
</div>
```

### Database Design
- **Primary Database**: PostgreSQL via Neon serverless
- **Schema Management**: Drizzle Kit for migrations and schema management
- **Key Entities**:
  - Users with role-based access (employee, accountant, admin)
  - Companies for multi-tenant support
  - Expense categories for classification
  - Expense claims with associated items
  - Direct expenses for company-level costs
  - Expense requests for pre-approval workflows
  - Receipts with file storage integration

### Authentication & Authorization
- **CRITICAL**: System uses JWT tokens from localStorage ONLY - NO login pages, token generation, or Replit authentication
- **JWT Token Standard**: ALL APIs must use `jwt_token` from localStorage for authentication
- **Implementation Requirements**: 
  - Frontend: Always send `Authorization: Bearer {jwt_token}` header from localStorage
  - Backend: ALL routes must validate JWT tokens - no authentication fallbacks or bypasses
  - Token Storage: `localStorage.getItem('jwt_token')` is the ONLY authentication method
- **Role-Based Access**: Three-tier permission system (employee, accountant, admin) from JWT payload
- **Security**: JWT token validation with expiration checks and role-based permissions
- **Future Development**: ALL new APIs must follow this JWT-only authentication pattern

### File Storage & Processing
- **Upload Handler**: Multer with local disk storage
- **File Types**: Support for JPEG, PNG, and PDF formats
- **Size Limits**: 5MB maximum file size with validation
- **Organization**: Timestamped unique filenames in dedicated upload directory

## External Dependencies

### Database Services
- **Neon Database**: Serverless PostgreSQL hosting
- **Connection Pooling**: @neondatabase/serverless with WebSocket support

### Authentication Services
- **Replit Auth**: OpenID Connect provider for user authentication
- **Session Store**: connect-pg-simple for PostgreSQL session persistence

### UI Component Libraries
- **Radix UI**: Comprehensive set of accessible components including dialogs, dropdowns, forms, and navigation
- **Lucide React**: Icon library for consistent iconography
- **Font Awesome**: Additional icon support via CDN

### Development Tools
- **TypeScript**: Static type checking across frontend and backend
- **Vite**: Development server and build tooling with HMR
- **ESBuild**: Production bundling for server-side code
- **Tailwind CSS**: Utility-first styling with PostCSS processing

### Monitoring & Development
- **Replit Integration**: Development banner and cartographer for Replit environment
- **Error Handling**: Runtime error overlays in development mode
- **Logging**: Structured request/response logging for API endpoints