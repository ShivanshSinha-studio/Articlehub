# ArticleHub 📝

ArticleHub is a modern, full-stack content publishing and blogging platform built with the MERN stack (MongoDB, Express.js, React 19, Node.js). It offers a rich writing experience with Markdown support, seamless media management via Cloudinary, authentication (JWT + Google OAuth), email verification via SMTP, bookmarking, real-time search, and category-based article exploration.

---

## 🚀 Features

### 👤 Authentication & Security
- **Dual Authentication**: Local Email/Password authentication & **Google OAuth 2.0** Sign-In.
- **Email Verification**: OTP-based email confirmation powered by Nodemailer (SMTP).
- **Session Management**: Secure HttpOnly cookies with Access and Refresh Tokens.
- **Security Headers & Rate Limiting**: Protection powered by `helmet`, `cors`, and `express-rate-limit`.

### 📰 Article Management & Content Creation
- **Markdown Editor**: Write, preview, and publish rich articles supporting Markdown syntax (`react-markdown`).
- **Media Uploads**: Cloudinary integration with `multer` for cover image uploads.
- **Category & Search System**: Filter articles by categories or search keywords dynamically.
- **Interactive Engagement**: Like articles, leave comments, and manage personal bookmarks.

### 📊 User Dashboard & Moderation
- **Author Dashboard**: Manage published posts, draft articles, view metrics, and edit profiles.
- **Audit Logging**: Backend tracks critical system events with dedicated audit log schemas.

---

## 🛠️ Tech Stack

| Domain | Technology / Library |
| :--- | :--- |
| **Frontend** | React 19, Vite, Redux Toolkit, React Router v7, Tailwind CSS v4, Motion (Framer), Lucide Icons, React Hook Form + Zod |
| **Backend** | Node.js, Express.js (v5), Mongoose (v9), MongoDB |
| **Storage & Cloud** | Cloudinary (Image Hosting), MongoDB Atlas (Database) |
| **Authentication & Mail** | JWT (jsonwebtoken), Google OAuth Library, Nodemailer (SMTP) |
| **Hosting & Ops** | Render (`render.yaml` backend config), Firebase Hosting (`firebase.json`) |

---

## 📂 Project Structure

```text
articalhub/
├── Backend/
│   ├── config/             # DB & Cloudinary Configuration
│   ├── controllers/        # Route logic & Business handlers (Auth, Articles, Categories)
│   ├── Middleware/         # Auth verification & file upload middlewares
│   ├── Model/              # Mongoose schemas (User, Article, Comment, AuditLog)
│   ├── Routes/             # Express API routes (userRoute, articleRoute, categoryRoute)
│   ├── uploads/            # Local temporary upload directory
│   ├── utils/              # Helper functions (Mailers, Tokens, Formatters)
│   ├── .env.example        # Environment variable template
│   ├── index.js            # Server entry point
│   ├── package.json        # Backend dependencies & scripts
│   └── render.yaml         # Render deployment configuration
│
├── Frontend/
│   ├── public/             # Static public assets
│   ├── src/
│   │   ├── assets/         # App logos & media files
│   │   ├── components/     # Reusable UI components (ArticleCard, Modals, etc.)
│   │   ├── pages/          # Route views (Home, ArticleDetail, Editor, Dashboard, Search, Login)
│   │   ├── store/          # Redux toolkit store configuration
│   │   ├── authSlice.js    # Auth state slice
│   │   ├── App.jsx         # Router & main app layout
│   │   └── main.jsx        # App mounting point
│   ├── .env.example        # Frontend environment variable template
│   ├── firebase.json       # Firebase Hosting config
│   ├── package.json        # Frontend dependencies & scripts
│   └── vite.config.js      # Vite build setup
│
├── .gitignore              # Root Git ignore rules
└── README.md               # Project documentation
```

---

## 🔑 Environment Variables Setup

Before running the application, configure your environment files for both Backend and Frontend.

### 1. Backend Environment Variables (`Backend/.env`)

Copy `Backend/.env.example` to `Backend/.env` and update the values:

```env
DB_CONNECT_STRING=mongodb+srv://<username>:<password>@cluster.mongodb.net/articlehub
PORT=8000
FRONTEND_URL=http://localhost:5173

JWT_KEY=your_jwt_access_secret
JWT_REFRESH_KEY=your_jwt_refresh_secret
ACCESS_TOKEN_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d

# SMTP Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
MAIL_FROM="Article Hub <your-email@gmail.com>"

# Google OAuth
GOOGLE_CLIENT_ID=your-google-oauth-client-id.apps.googleusercontent.com

# Cloudinary
CLOUD_NAME=your_cloudinary_cloud_name
CLOUD_API_KEY=your_cloudinary_api_key
CLOUD_API_SECRET=your_cloudinary_api_secret

# Security Rate Limiter
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=60
```

### 2. Frontend Environment Variables (`Frontend/.env`)

Copy `Frontend/.env.example` to `Frontend/.env` and update the values:

```env
VITE_API_ORIGIN=http://localhost:8000
VITE_GOOGLE_CLIENT_ID=your-google-oauth-client-id.apps.googleusercontent.com
```

---

## 🚦 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [MongoDB](https://www.mongodb.com/) (Local instance or MongoDB Atlas URI)
- Cloudinary Account (for image uploads)

---

### Step 1: Clone & Initialize Git Repository

If you haven't initialized Git at the root folder yet, run:

```bash
git init
git remote add origin https://github.com/ShivanshSinha-studio/Articlehub.git
git branch -M main
```

---

### Step 2: Install Dependencies

#### Backend:
```bash
cd Backend
npm install
```

#### Frontend:
```bash
cd ../Frontend
npm install
```

---

### Step 3: Start Development Servers

#### Start Backend Server:
```bash
cd Backend
npm run dev
```
*(Runs server on `http://localhost:8000` with nodemon)*

#### Start Frontend Application:
```bash
cd Frontend
npm run dev
```
*(Runs application on `http://localhost:5173` with Vite HMR)*

---

## 🌐 API Overview

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `GET` | `/health` | Server Health Check | ❌ |
| `POST` | `/api/signup` | Register a new user | ❌ |
| `POST` | `/api/login` | User login | ❌ |
| `POST` | `/api/google-auth` | Google OAuth login/signup | ❌ |
| `POST` | `/api/verify-otp` | Verify email via OTP | ❌ |
| `GET` | `/api/articles` | Get published articles list | ❌ |
| `GET` | `/api/article/:id` | Get article details by ID | ❌ |
| `POST` | `/api/article` | Create a new article (With cover image) | ✅ |
| `PUT` | `/api/article/:id` | Edit/update article | ✅ |
| `DELETE` | `/api/article/:id` | Delete article | ✅ |
| `GET` | `/api/categories` | Fetch article categories | ❌ |

---

## 🚀 Deployment

- **Backend**: Pre-configured for deployment on **Render** via `render.yaml`.
- **Frontend**: Configured for **Firebase Hosting** (`firebase.json` / `.firebaserc`) or **Vercel** / **Netlify**.

---

## 🤝 Contributing

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the ISC License.
