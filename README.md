# 🎯 Lead Management System

A comprehensive lead management system built with React, TypeScript, Node.js, and MongoDB. Features role-based access control, Excel import, lead assignment, and comprehensive analytics.

## 🌟 Features

### 🔐 **Authentication & Authorization**
- **Two User Roles**: Admin and User with different permissions
- **Secure JWT Authentication** with automatic token refresh
- **Protected Routes** based on user roles
- **Password Security** with bcrypt hashing

### 👥 **User Management** (Admin Only)
- Create, read, update, and delete users
- Role assignment and management
- User activity tracking
- Account activation/deactivation

### 📊 **Lead Management**
- **Full CRUD Operations** for leads
- **Advanced Filtering** by status, source, priority, assigned user
- **Lead Assignment** system for distributing leads to users
- **Lead Status Tracking** with 10 different statuses
- **Notes System** for tracking interactions
- **Lead Scoring** based on status progression

### 📈 **Analytics & Reporting**
- **Dashboard Statistics** for both admin and users
- **Conversion Rate Tracking**
- **Lead Source Analytics**
- **Performance Metrics** by user
- **Growth Tracking** month-over-month

### 📁 **Excel Import/Export**
- **Bulk Lead Import** from Excel/CSV files
- **Import Template** generation
- **Validation & Error Reporting** during import
- **Duplicate Detection** and prevention

### 🎨 **Modern UI/UX**
- **Responsive Design** with Tailwind CSS v4
- **Clean Interface** inspired by modern SaaS applications
- **Role-based Navigation** with different sidebar menus
- **Real-time Notifications** with toast messages
- **Loading States** and error handling

## 🏗️ **Tech Stack**

### **Frontend**
- **React 19** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS v4** for styling
- **React Router** for navigation
- **Axios** for API communication
- **React Hot Toast** for notifications
- **Lucide React** for icons

### **Backend**
- **Node.js** with Express and TypeScript
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **Multer** for file uploads
- **XLSX** for Excel processing
- **bcryptjs** for password hashing
- **Helmet** for security headers
- **Rate Limiting** for API protection

## 🚀 **Quick Start**

### **Prerequisites**
- Node.js (v16 or higher)
- MongoDB (local or cloud)
- Git

### **1. Clone and Setup**
```bash
# Clone the repository
git clone <your-repo-url>
cd lead-management-system

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### **2. Environment Configuration**

**Backend Environment (.env)**
```env
NODE_ENV=development
PORT=8000
MONGODB_URI=mongodb://localhost:27017/lead-manager
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
UPLOAD_MAX_SIZE=10mb
FRONTEND_URL=http://localhost:5175
```

**Frontend Environment (.env)**
```env
VITE_API_URL=http://localhost:8000/api
VITE_APP_NAME=Lead Manager
VITE_APP_VERSION=1.0.0
```

### **3. Database Setup**
```bash
# Make sure MongoDB is running
# Then seed the database with demo data
cd backend
npm run seed:all
```

### **4. Start the Application**

**Terminal 1 - Backend**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend**
```bash
cd frontend
npm run dev
```

### **5. Access the Application**
- **Frontend**: http://localhost:5175
- **Backend API**: http://localhost:8000/api
- **Health Check**: http://localhost:8000/health

## 🔑 **Demo Credentials**

### **Admin Account**
- **Email**: admin@leadmanager.com
- **Password**: admin123456
- **Permissions**: Full system access

### **User Account**
- **Email**: user@leadmanager.com
- **Password**: user123456
- **Permissions**: Limited to assigned leads

### **Additional Test Users**
- john@leadmanager.com / password123
- sarah@leadmanager.com / password123 (admin)
- mike@leadmanager.com / password123

## 📊 **API Endpoints**

### **Authentication**
```
POST /api/auth/login          # User login
POST /api/auth/logout         # User logout
GET  /api/auth/me             # Get current user
PUT  /api/auth/profile        # Update profile
PUT  /api/auth/change-password # Change password
POST /api/auth/register       # Register user (admin only)
```

### **User Management** (Admin Only)
```
GET    /api/users             # Get all users
GET    /api/users/:id         # Get user by ID
POST   /api/users             # Create user
PUT    /api/users/:id         # Update user
DELETE /api/users/:id         # Delete user
GET    /api/users/stats       # User statistics
```

### **Lead Management**
```
GET    /api/leads             # Get leads (filtered by role)
GET    /api/leads/my-leads    # Get user's assigned leads
GET    /api/leads/:id         # Get single lead
POST   /api/leads             # Create lead
PUT    /api/leads/:id         # Update lead
DELETE /api/leads/:id         # Delete lead (admin only)
POST   /api/leads/assign      # Assign leads (admin only)
POST   /api/leads/notes       # Add note to lead
```

### **Excel Import** (Admin Only)
```
GET  /api/leads/import/template  # Download import template
POST /api/leads/import/excel     # Import leads from Excel
```

### **Dashboard & Analytics**
```
GET /api/dashboard/stats         # User dashboard stats
GET /api/dashboard/admin-stats   # Admin dashboard stats
GET /api/dashboard/leads/by-status # Leads by status
GET /api/dashboard/leads/by-source # Leads by source
GET /api/dashboard/recent-activity # Recent activity
GET /api/dashboard/metrics       # Lead metrics
```

## 📋 **Lead Status Workflow**

1. **New** - Freshly imported or created leads
2. **Contacted** - Initial contact made
3. **Interested** - Lead showed interest
4. **Not Interested** - Lead not interested
5. **Follow-up** - Requires follow-up
6. **Qualified** - Meets qualification criteria
7. **Proposal Sent** - Proposal/quote sent
8. **Negotiating** - In negotiation phase
9. **Closed-Won** - Successfully converted
10. **Closed-Lost** - Lost opportunity

## 📁 **Excel Import Format**

The system accepts Excel (.xlsx, .xls) and CSV files with the following columns:

| Column | Required | Description | Valid Values |
|--------|----------|-------------|--------------|
| Name | Yes | Lead's full name | Any string |
| Email | Yes | Lead's email address | Valid email format |
| Phone | Yes | Lead's phone number | Any phone format |
| Company | Yes | Company name | Any string |
| Position | Yes | Job title/position | Any string |
| Source | No | Lead source | Website, Social Media, Referral, Import, Manual, Cold Call, Email Campaign |
| Priority | No | Lead priority | High, Medium, Low |

**Download Template**: Use the "Download Template" button in the Import Leads page.

## 🔧 **Development**

### **Available Scripts**

**Backend**
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run seed:users   # Seed demo users
npm run seed:leads   # Seed demo leads
npm run seed:all     # Seed all demo data
```

**Frontend**
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### **Project Structure**

```
lead-management-system/
├── frontend/
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── contexts/       # React contexts
│   │   ├── hooks/          # Custom hooks
│   │   ├── lib/            # Utilities and API client
│   │   ├── pages/          # Page components
│   │   ├── types/          # TypeScript types
│   │   └── utils/          # Helper functions
│   ├── public/             # Static assets
│   └── package.json
├── backend/
│   ├── src/
│   │   ├── controllers/    # Route handlers
│   │   ├── middleware/     # Express middleware
│   │   ├── models/         # Mongoose models
│   │   ├── routes/         # API routes
│   │   ├── scripts/        # Database seeders
│   │   ├── types/          # TypeScript types
│   │   └── utils/          # Utilities
│   ├── uploads/            # File upload directory
│   └── package.json
└── README.md
```

## 🛡️ **Security Features**

- **JWT Authentication** with secure token storage
- **Password Hashing** with bcrypt
- **Rate Limiting** to prevent abuse
- **Input Validation** on all endpoints
- **CORS Configuration** for cross-origin requests
- **Security Headers** with Helmet.js
- **File Upload Validation** for Excel imports
- **SQL Injection Protection** with Mongoose
- **XSS Protection** with input sanitization

## 🎯 **User Roles & Permissions**

### **Admin Role**
- ✅ View all leads and analytics
- ✅ Create, edit, and delete any lead
- ✅ Assign leads to users
- ✅ Import leads from Excel
- ✅ Manage users (create, edit, delete)
- ✅ Access admin dashboard
- ✅ View team performance metrics

### **User Role**
- ✅ View assigned leads only
- ✅ Update status of assigned leads
- ✅ Add notes to assigned leads
- ✅ Create new leads
- ✅ View personal dashboard
- ❌ Cannot delete leads
- ❌ Cannot assign leads
- ❌ Cannot import leads
- ❌ Cannot manage users

## 📱 **Responsive Design**

The application is fully responsive and works on:
- 💻 **Desktop** (1024px and above)
- 📱 **Tablet** (768px - 1023px)
- 📱 **Mobile** (Below 768px)

## 🐛 **Troubleshooting**

### **Common Issues**

**Database Connection Failed**
```bash
# Make sure MongoDB is running
sudo systemctl start mongod  # Linux
brew services start mongodb  # macOS
```

**Port Already in Use**
```bash
# Kill process on port 8000 or 5175
npx kill-port 8000
npx kill-port 5175
```

**JWT Secret Not Set**
```bash
# Make sure JWT_SECRET is set in backend/.env
JWT_SECRET=your-secret-key-here
```

**File Upload Issues**
```bash
# Make sure uploads directory exists
mkdir backend/uploads
chmod 755 backend/uploads
```

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 **License**

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 🙏 **Acknowledgments**

- Built with inspiration from modern CRM systems
- UI/UX inspired by leading SaaS applications
- Icons provided by [Lucide](https://lucide.dev/)
- Styling powered by [Tailwind CSS](https://tailwindcss.com/)

---

**Happy Lead Managing! 🎯**
