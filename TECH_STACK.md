# Tech Stack Documentation

## Project Overview
Comprehensive expense management web application built with modern full-stack technologies, featuring role-based access control, OCR capabilities, and real-time processing.

---

## Frontend Architecture

### **Core Framework**
- **React 18.3.1** - Modern React with concurrent features
- **TypeScript 5.6.3** - Static type checking and enhanced development experience
- **Vite 5.4.19** - Lightning-fast build tool with Hot Module Replacement (HMR)

### **UI Framework & Styling**
- **shadcn/ui** - High-quality, accessible component library built on Radix UI
- **Radix UI Primitives** - Comprehensive suite of low-level UI primitives:
  - Dialog, Dropdown, Select, Navigation, Toast, Tabs, Switch, etc.
  - 22 different Radix UI components for consistent UX
- **Tailwind CSS 3.4.17** - Utility-first CSS framework
- **Tailwind CSS Animate 1.0.7** - Animation utilities
- **PostCSS 8.4.47** - CSS processing and transformation

### **State Management & Data Fetching**
- **TanStack Query 5.60.5** (React Query) - Powerful data fetching, caching, and synchronization
- **React Hook Form 7.55.0** - Performant forms with minimal re-renders
- **Zod 3.24.2** - TypeScript-first schema validation

### **Routing & Navigation**
- **Wouter 3.3.5** - Minimalist client-side routing (2KB gzipped)

### **Icons & Graphics**
- **Lucide React 0.453.0** - Beautiful & consistent icon library (1000+ icons)
- **React Icons 5.4.0** - Popular icon libraries (Font Awesome, Feather, etc.)

### **Specialized Components**
- **React Day Picker 8.10.1** - Date picker component
- **Recharts 2.15.2** - Data visualization and charting library
- **Embla Carousel React 8.6.0** - Lightweight carousel library
- **Framer Motion 11.13.1** - Production-ready motion library
- **Vaul 1.1.2** - Drawer/modal component
- **CMDK 1.1.1** - Command palette component

### **Utilities**
- **Class Variance Authority 0.7.1** - Creating variant-based component APIs
- **clsx 2.1.1** - Utility for constructing className strings
- **Tailwind Merge 2.6.0** - Merge Tailwind CSS classes
- **Date-fns 3.6.0** - Modern JavaScript date utility library

---

## Backend Architecture

### **Runtime & Framework**
- **Node.js** - JavaScript runtime environment
- **Express.js 4.21.2** - Fast, minimalist web framework
- **TypeScript 5.6.3** - Full backend type safety
- **ES Modules** - Modern JavaScript module system

### **Database & ORM**
- **PostgreSQL** - Primary database (via Neon serverless)
- **Drizzle ORM 0.39.3** - TypeScript-first ORM with zero-overhead type safety
- **Drizzle Kit 0.30.4** - Database migrations and schema management
- **Drizzle Zod 0.7.0** - Zod schema integration with Drizzle

### **Authentication & Security**
- **JWT (jsonwebtoken 9.0.2)** - Stateless authentication
- **Express Sessions 1.18.2** - Session management
- **connect-pg-simple 10.0.0** - PostgreSQL session store
- **Passport.js 0.7.0** - Authentication middleware
- **OpenID Client 6.7.1** - OpenID Connect integration

### **File Processing & OCR**
- **Multer 2.0.2** - Multipart/form-data handling for file uploads
- **Sharp 0.34.4** - High-performance image processing
- **Tesseract.js 6.0.1** - Pure JavaScript OCR engine
- **OpenAI 5.20.0** - AI integration for enhanced OCR processing

### **Utilities & Middleware**
- **dotenv 17.2.2** - Environment variable management
- **node-cache 5.1.2** - In-memory caching
- **memoizee 0.4.17** - Function memoization
- **nodemailer 7.0.6** - Email sending capabilities

---

## Development Tools

### **Build & Bundling**
- **Vite 5.4.19** - Frontend build tool with HMR
- **ESBuild 0.25.0** - Fast JavaScript bundler for production
- **TSX 4.19.1** - TypeScript execution environment

### **Development Environment**
- **@replit/vite-plugin-cartographer 0.3.0** - Replit integration
- **@replit/vite-plugin-runtime-error-modal 0.0.3** - Enhanced error handling
- **cross-env 10.0.0** - Cross-platform environment variables

### **Type Definitions**
Comprehensive TypeScript definitions for:
- Express.js, Node.js, React, DOM
- Authentication libraries (Passport, JWT)
- Database and session management
- File upload and processing libraries

---

## Database Design

### **Database Technology**
- **PostgreSQL** - Robust relational database
- **Neon Database** - Serverless PostgreSQL hosting with WebSocket support
- **Connection Pooling** - Optimized database connections

### **Key Entities**
- **Users** - Role-based access (employee, accountant, admin)
- **Companies** - Multi-tenant support
- **Expense Categories** - Classification and organization
- **Expense Claims** - Employee expense submissions
- **Expense Items** - Individual expense entries
- **Direct Expenses** - Company-level cost management
- **Expense Requests** - Pre-approval workflow system
- **Receipts** - File storage with OCR integration
- **Vendors** - Supplier and merchant management

---

## API & Integration

### **API Architecture**
- **RESTful APIs** - Standard HTTP methods and status codes
- **JSON Communication** - Structured data exchange
- **JWT Authentication** - Stateless API authentication
- **Role-based Authorization** - Granular permission system

### **External Integrations**
- **OpenAI API** - Enhanced OCR and AI processing
- **Replit Auth** - OpenID Connect authentication provider
- **Email Services** - SMTP-based communication

---

## File Processing

### **Upload Management**
- **File Types**: JPEG, PNG, PDF support
- **Size Limits**: 5MB maximum file size
- **Storage**: Local disk storage with unique timestamped filenames
- **Validation**: Comprehensive file type and size validation

### **OCR Processing**
- **Dual OCR Engine**: Tesseract.js (free) + OpenAI (enhanced)
- **Document Classification**: Invoice, receipt, and bill recognition
- **Smart Field Extraction**: Amount, date, vendor, invoice numbers
- **Confidence Scoring**: Accuracy assessment for extracted data
- **Multi-language Support**: Various document formats and languages

---

## Security & Authentication

### **Authentication Flow**
- **JWT-Only System** - No traditional login forms
- **localStorage Token Storage** - Client-side token management
- **Automatic Token Validation** - Every API request authenticated
- **Role-based Access Control** - Three-tier permission system

### **Security Features**
- **Token Expiration** - Automatic session timeout
- **CORS Protection** - Cross-origin request security
- **Input Validation** - Zod schema validation throughout
- **SQL Injection Prevention** - ORM-based query protection
- **File Upload Security** - Type validation and size limits

---

## Performance & Optimization

### **Frontend Optimization**
- **Code Splitting** - Automatic route-based splitting
- **Tree Shaking** - Dead code elimination
- **Bundle Optimization** - Minimal production bundles
- **Image Optimization** - Sharp-based image processing
- **Caching Strategy** - TanStack Query intelligent caching

### **Backend Optimization**
- **Connection Pooling** - Database connection efficiency
- **Memory Caching** - node-cache for frequently accessed data
- **Function Memoization** - Expensive operation caching
- **Async Processing** - Non-blocking I/O operations

---

## Development Workflow

### **Local Development**
```bash
npm run dev     # Start development server
npm run build   # Production build
npm run check   # TypeScript validation
npm run db:push # Database schema updates
```

### **Environment Management**
- **Development**: Full HMR with error overlays
- **Production**: Optimized builds with monitoring
- **Environment Variables**: Secure configuration management

---

## Monitoring & Logging

### **Development Tools**
- **Replit Integration** - Development environment optimization
- **Runtime Error Handling** - Development error overlays
- **Structured Logging** - Request/response monitoring
- **Performance Metrics** - Build time and bundle size tracking

### **Production Monitoring**
- **Error Tracking** - Comprehensive error logging
- **Performance Monitoring** - API response times
- **Database Monitoring** - Query performance tracking
- **File Processing Metrics** - OCR success rates and processing times

---

## Deployment Architecture

### **Frontend Deployment**
- **Static Asset Generation** - Optimized production builds
- **CDN Integration** - Fast asset delivery
- **Environment Configuration** - Production-ready settings

### **Backend Deployment**
- **Node.js Production** - Optimized server configuration
- **Database Migration** - Automated schema deployment
- **File Storage** - Persistent file system integration
- **Health Checks** - Application monitoring and recovery

---

This tech stack provides a robust, scalable, and maintainable foundation for the expense management application, with modern development practices, comprehensive type safety, and production-ready performance optimization.