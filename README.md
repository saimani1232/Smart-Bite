# 🥗 SmartBite - Intelligent Food Inventory Manager

<div align="center">

![SmartBite Banner](https://img.shields.io/badge/SmartBite-Food_Inventory_Manager-10B981?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggZD0iTTExIDIwQTcgNyAwIDAgMSA5LjggNi4xQzE1LjUgNSAxNyA0LjQ4IDE5IDIuMWMuMy4zNS41LjcuNSAxLjEgMCAyLjE0LTIgNS4yLTIgNS4yLjUuNSAxIDYgMSA2LTEuNS03LTctOC02LjgtOC4zIi8+PHBhdGggZD0iTTUgMjFhMSAxIDAgMCAxLTEtMXYtOGEzIDMgMCAwIDEgMy01bDEwIDEwYTMgMyAwIDAgMSA1IDN2MWExIDEgMCAwIDEtMSAxWiIvPjwvc3ZnPg==)

[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-06B6D4?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat-square&logo=mongodb)](https://www.mongodb.com/)
[![Vercel](https://img.shields.io/badge/Vercel-Deployed-000000?style=flat-square&logo=vercel)](https://vercel.com/)

**Track your food inventory, reduce waste, and get smart recipe suggestions based on what's expiring soon.**

[Live Demo](https://smart-bite-beryl.vercel.app) • [Report Bug](https://github.com/saimani1232/SmartBite/issues) • [Request Feature](https://github.com/saimani1232/SmartBite/issues)

</div>

---

## ✨ Features

### 📦 Inventory Management
- **Add items** with name, quantity, unit, category, and expiry date
- **Barcode scanning** - scan products to auto-fill details
- **Camera capture** - take photos for visual reference
- **Smart categorization** - Dairy, Meat, Vegetables, Grains, and more

### ⏰ Expiry Tracking
- **Visual status indicators** - Good, Expiring Soon, Expired
- **Opened item tracking** - automatic expiry adjustment when items are opened
- **Smart notifications** - never forget about expiring items

### 📧 Email Reminders
- **Customizable reminder days** - get notified before items expire
- **Recipe suggestions** - receive recipes using your expiring ingredients
- **Powered by EmailJS** - reliable email delivery

### 🍳 Recipe Integration
- **TheMealDB API** - discover recipes based on your inventory
- **Ingredient matching** - prioritizes recipes using your existing items
- **Step-by-step instructions** - complete cooking guides

### 👤 User Authentication
- **Username/password login** - secure authentication with JWT
- **Cloud sync** - access your inventory from any device
- **MongoDB Atlas** - reliable data persistence

### 🎨 Premium UI/UX
- **Dark/Light mode** - comfortable viewing any time
- **Glassmorphism design** - modern, elegant interface
- **Responsive layout** - works on desktop, tablet, and mobile
- **Smooth animations** - delightful micro-interactions

---

## 🛠️ Tech Stack

| Category | Technologies |
|----------|-------------|
| **Frontend** | React 19, TypeScript, Tailwind CSS, Vite |
| **Backend** | Vercel Serverless Functions |
| **Database** | Firebase Firestore (Permanent / Never-Expiring) + Resilient Local-First Store |
| **Authentication** | JWT, bcryptjs, Google OAuth 2.0 |
| **APIs** | TheMealDB, Open Food Facts, EmailJS, Twilio WhatsApp, Google Cloud Vision |
| **Deployment** | Vercel |
| **Icons** | Lucide React |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Firebase account (Free Spark Plan) or run in Zero-Config Local Mode
- EmailJS account (for email reminders)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/saimani1232/Smart-Bite.git
   cd Smart-Bite
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables (Optional)**
   
   The app works **out-of-the-box in Local-First Mode** without any configuration!
   To connect cloud synchronization, copy `.env.example` to `.env`:
   ```env
   # Permanent Cloud Database (Firebase Firestore)
   FIREBASE_PROJECT_ID=your-firebase-project-id
   FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
   
   # JWT Secret
   JWT_SECRET=your-super-secret-key
   
   # EmailJS (for email reminders)
   VITE_EMAILJS_SERVICE_ID=your_service_id
   VITE_EMAILJS_TEMPLATE_ID=your_template_id
   VITE_EMAILJS_PUBLIC_KEY=your_public_key
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open in browser**
   ```
   http://localhost:5173
   ```

---

## 📁 Project Structure

```
SmartBite/
├── api/                      # Vercel Serverless Functions
│   ├── auth/
│   │   ├── login.js         # User login
│   │   └── register.js      # User registration
│   ├── items/
│   │   ├── index.js         # GET/POST items
│   │   └── [id].js          # PUT/DELETE items
│   ├── lib/
│   │   ├── auth.js          # JWT utilities
│   │   └── mongodb.js       # Database connection
│   └── health.js            # Health check endpoint
├── src/
│   ├── components/          # React components
│   ├── context/             # React context providers
│   ├── pages/               # Page components
│   ├── services/            # API services
│   ├── types.ts             # TypeScript types
│   └── utils/               # Utility functions
├── public/                  # Static assets
└── index.html               # Entry point
```

---

## 🔌 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create new user |
| POST | `/api/auth/login` | Login user |

### Inventory
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/items` | Get all user items |
| POST | `/api/items` | Add new item |
| PUT | `/api/items/:id` | Update item |
| DELETE | `/api/items/:id` | Delete item |

### Utility
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |

---

## 🌐 Deployment

### Deploy to Vercel

1. **Push to GitHub**
   ```bash
   git add -A
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Import to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Add environment variables in Settings

3. **Done!** Your app is live 🎉

---

## 🔮 Future Improvements

- [ ] Shopping list generation
- [ ] Pantry analytics & insights
- [ ] Multi-language support
- [ ] PWA with offline support
- [ ] Share recipes with friends
- [ ] Integration with grocery delivery apps

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**Sai Mani**

- GitHub: [@saimani1232](https://github.com/saimani1232)

---

<div align="center">

**⭐ Star this repo if you found it helpful! ⭐**

Made with ❤️ and React

</div>
