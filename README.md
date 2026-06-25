# AI Job Application Tracker

![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=flat&logo=express&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat&logo=postgresql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=flat&logo=prisma&logoColor=white)
![JWT](https://img.shields.io/badge/Auth-JWT-orange?style=flat)
![Stars](https://img.shields.io/github/stars/SudharshanGeddam/ai-job-application-tracker?style=social)

> A backend API that helps job seekers manage their search — upload a resume, get it parsed automatically, see how well it matches a job description, and generate a tailored cover letter and interview tips, all powered by AI.

⭐ If this looks useful to you, consider starring the repo!

## ✨ Features

- 🔐 **Secure Authentication** — JWT-based auth with bcrypt password hashing
- 📄 **AI Resume Parsing** — Upload a PDF resume and have key data (skills, experience, education) extracted automatically
- 🎯 **AI Job-Match Scoring** — Compares a parsed resume against a job description and scores how well they align
- ✍️ **AI Cover Letter Generation** — Generates a tailored cover letter for a specific job application
- 💡 **AI Interview Tips** — Produces interview prep tips based on the target job description
- ☁️ **Cloud File Storage** — Resumes and documents stored via Cloudinary
- 📧 **Email Notifications** — Automated reminders via Nodemailer, scheduled with node-cron
- 🛡️ **Production-grade security** — Helmet, rate limiting, and schema validation (Zod)
- 🗄️ **Type-safe data layer** — PostgreSQL with Prisma ORM

## 🧠 How the AI Pipeline Works

```
Resume Upload (PDF)
       │
       ▼
  pdf-parse extracts raw text
       │
       ▼
  AI model (Gemini / Groq / OpenAI) structures the data
       │
       ▼
 ┌─────────────┬──────────────────┬────────────────────┐
 │ Resume Data │ Job Match Score  │ Cover Letter +      │
 │ (skills,    │ (resume vs. job  │ Interview Tips      │
 │ experience) │ description)     │ (tailored per job)  │
 └─────────────┴──────────────────┴────────────────────┘
```

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js, Express 5 |
| Database | PostgreSQL, Prisma ORM |
| AI Providers | Google Gemini, Groq, OpenAI |
| Authentication | JWT, bcrypt |
| File Handling | Multer, Cloudinary, pdf-parse |
| Validation & Security | Zod, Helmet, express-rate-limit |
| Scheduling & Email | node-cron, Nodemailer |

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- A PostgreSQL database
- API keys for at least one AI provider (Gemini, Groq, or OpenAI)
- A Cloudinary account (for resume/document storage)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/SudharshanGeddam/ai-job-application-tracker.git
   cd ai-job-application-tracker
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory:
   ```env
   DATABASE_URL=postgresql://user:password@localhost:5432/job_tracker
   JWT_SECRET=your_jwt_secret
   GEMINI_API_KEY=your_gemini_key
   GROQ_API_KEY=your_groq_key
   OPENAI_API_KEY=your_openai_key
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_cloudinary_key
   CLOUDINARY_API_SECRET=your_cloudinary_secret
   ```

4. Run database migrations:
   ```bash
   npx prisma migrate dev
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

   For production:
   ```bash
   npm run start:prod
   ```

## 📦 Project Structure

```
.
├── prisma/          # Database schema & migrations
├── src/             # Application source (routes, controllers, services)
├── index.js         # Entry point
└── package.json
```

## 🗺️ Roadmap

- [ ] Frontend client (this repo is currently backend/API only)
- [ ] API documentation (Mintlify)
- [ ] - [ ] Automated tests
