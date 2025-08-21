# Verify Aura Backend

Secure backend for the Verify Aura certificate verification system.

## 🚀 Features

- **Certificate Verification**: Public API for verifying certificate validity
- **Admin Management**: Secure admin endpoints for certificate management
- **Activity Logging**: Comprehensive audit trail for all admin actions
- **Health Monitoring**: Real-time health checks for all services
- **Rate Limiting**: Protection against abuse
- **Input Validation**: Comprehensive validation and sanitization

## 🔧 Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Variables
Copy `env.example` to `.env` and fill in your values:
```env
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
CLERK_SECRET_KEY=your_clerk_secret_key_here
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 3. Development
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## 🔌 API Endpoints

### Public Endpoints
- `POST /api/certificates/verify` - Verify certificate validity
- `GET /api/certificates/health` - Certificate service health check

### Admin Endpoints
- `GET /api/admin/events` - Get all events with stats
- `GET /api/admin/participants` - Get all participants (paginated)
- `GET /api/admin/events/:event_id/participants` - Get participants by event
- `POST /api/admin/certificates/revoke` - Revoke a certificate
- `POST /api/admin/certificates/restore/:participant_id` - Restore a certificate
- `GET /api/admin/logs` - Get activity logs (paginated)
- `GET /api/admin/health` - Admin services health check

## 🔒 Security Features

- **Helmet**: Security headers
- **CORS**: Cross-origin resource sharing protection
- **Rate Limiting**: Protection against abuse
- **Input Validation**: Comprehensive validation
- **Error Handling**: Secure error responses 