# Container Trade Tracker

A professional container trading inventory management system built with Node.js, Express, MongoDB, and React.

## 🚢 Overview

Container Trade Tracker is a full-stack web application designed for businesses that buy and sell shipping containers locally. Track your inventory, manage sales, monitor profits, and generate comprehensive reports - all in one place.

## ✨ Features

### Core Functionality
- **Container Management**: Add, edit, view, and delete container inventory
- **Sales Tracking**: Create sales transactions and track payments
- **Profit Analytics**: Automatic profit calculation and reporting
- **Payment Management**: Track payment status (Full, Partial, Pending)
- **Advanced Filtering**: Search and filter by status, size, type, location
- **Data Export**: Export to Excel (.xlsx) and PDF formats

### Business Rules
- One container = one sale (prevents duplicate sales)
- Automatic status updates (Available → Sold)
- Sold containers cannot be deleted
- Real-time profit calculations
- Payment tracking with amount received

## 🎨 Design

**Maritime Industrial Theme**
- Primary Color: International Orange (#FF4F00)
- Typography: Barlow Condensed (headings), Public Sans (body), JetBrains Mono (data)
- Clean, professional dashboard design
- Mobile-responsive layout
- High contrast for outdoor readability

## 🏗️ Tech Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Security**: bcryptjs for password hashing
- **Export**: xlsx for Excel, HTML for PDF

### Frontend
- **Framework**: React 19
- **Routing**: React Router v7
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI primitives
- **Forms**: React Hook Form + Zod validation
- **Notifications**: Sonner toasts
- **HTTP Client**: Axios

## 📦 Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or MongoDB Atlas)
- Yarn package manager

### Backend Setup

1. Navigate to backend directory:
```bash
cd /app/backend
```

2. Install dependencies:
```bash
yarn install
```

3. Configure environment variables in `.env`:
```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=container_trade
JWT_SECRET=your-secret-key-change-in-production
CORS_ORIGINS=*
```

4. Seed the database with sample data:
```bash
node seed.js
```

5. Start the backend server:
```bash
yarn start
# or for development with auto-reload:
yarn dev
```

Server will run on `http://0.0.0.0:8001`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd /app/frontend
```

2. Install dependencies:
```bash
yarn install
```

3. Configure environment variables in `.env`:
```env
REACT_APP_BACKEND_URL=http://localhost:8001
```

4. Start the development server:
```bash
yarn start
```

Application will open at `http://localhost:3000`

## 👤 Default Admin Credentials

```
Email: thelmhtrading@gmail.com
Password: 123456789
```

**⚠️ IMPORTANT**: Change these credentials in production!

## 📊 Database Models

### Container
```javascript
{
  containerNo: String (unique, uppercase)
  size: Enum ['20FT', '40FT']
  type: Enum ['Dry', 'Reefer']
  purchasePrice: Number
  purchaseDate: Date
  location: String
  status: Enum ['Available', 'Reserved', 'Sold']
  notes: String
}
```

### Sale
```javascript
{
  containerId: ObjectId (ref Container)
  buyerName: String
  buyerPhone: String
  sellingPrice: Number
  sellingDate: Date
  paymentStatus: Enum ['Full', 'Partial', 'Pending']
  amountReceived: Number
  profit: Number (auto-calculated)
  remarks: String
}
```

### User
```javascript
{
  email: String (unique)
  password: String (hashed)
  role: String (default: 'admin')
}
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/login` - Admin login

### Containers
- `GET /api/containers` - List containers (with filters)
- `POST /api/containers` - Create container
- `GET /api/containers/:id` - Get single container
- `PUT /api/containers/:id` - Update container
- `DELETE /api/containers/:id` - Delete container

### Sales
- `GET /api/sales` - List sales (with filters)
- `POST /api/sales` - Create sale
- `GET /api/sales/:id` - Get single sale
- `PUT /api/sales/:id` - Update payment details

### Reports
- `GET /api/reports/summary` - Get summary with filters
- `GET /api/reports/export/containers.xlsx` - Export containers
- `GET /api/reports/export/sales.xlsx` - Export sales
- `GET /api/reports/export/summary.pdf` - Export PDF report

## 🎯 Pages & Routes

| Route | Description |
|-------|-------------|
| `/login` | Admin authentication |
| `/dashboard` | KPI cards, recent sales, quick actions |
| `/containers` | Container inventory list with filters |
| `/containers/new` | Add new container |
| `/containers/edit/:id` | Edit existing container |
| `/sell` | Create new sale transaction |
| `/sales` | Sales list with payment tracking |
| `/reports` | Analytics, summaries, and exports |

## 🔒 Security Features

- JWT-based authentication
- Protected API routes
- Password hashing with bcryptjs
- Input validation and sanitization
- CORS configuration
- SQL injection prevention (MongoDB)

## 📱 Mobile Responsive

The application is fully responsive and works seamlessly on:
- Desktop (1920px+)
- Tablets (768px - 1024px)
- Mobile phones (320px - 767px)

## 🚀 Production Deployment

### Backend
1. Set secure JWT_SECRET
2. Use production MongoDB instance
3. Configure CORS_ORIGINS properly
4. Enable HTTPS
5. Set up process manager (PM2)

### Frontend
1. Update REACT_APP_BACKEND_URL to production API
2. Build for production: `yarn build`
3. Serve build folder with nginx or similar

## 📈 Sample Data

The seed script creates:
- 1 admin user
- 5 sample containers (various sizes and types)
- 2 sample sales transactions

## 🛠️ Development

### Project Structure
```
/app
├── backend/
│   ├── models/           # Mongoose models
│   ├── routes/           # Express route handlers
│   ├── middleware/       # Auth middleware
│   ├── server.js         # Main server file
│   ├── seed.js          # Database seeding
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── pages/        # Page components
│   │   ├── utils/        # API utilities
│   │   ├── context/      # Auth context
│   │   ├── App.js        # Main app component
│   │   └── index.js      # Entry point
│   ├── public/           # Static assets
│   └── package.json
└── README.md
```

## 🐛 Known Limitations

- PDF export opens as printable HTML (browser's "Save as PDF" feature required)
- Single admin user role (multi-user support can be added)
- No real-time updates (requires WebSocket implementation)

## 🎓 Future Enhancements

- [ ] Multi-user support with role-based access
- [ ] Email notifications for sales/payments
- [ ] Image upload for containers
- [ ] Advanced analytics dashboard
- [ ] Mobile app (React Native)
- [ ] Automated payment reminders
- [ ] Integration with accounting software

## 📄 License

Proprietary - All rights reserved

## 👨‍💻 Support

For support or questions, contact the development team.

---

**Built with ❤️ for container trading businesses**
