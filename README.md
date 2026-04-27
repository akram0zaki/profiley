# Profiley - AI Interactive CV Platform

A modern, futuristic web application for creating AI-powered professional profiles that replace traditional CVs with interactive, conversational experiences.

## Overview

Profiley enables professionals to create an AI persona that recruiters can chat with, analyze job fit, and explore their experience conversationally. All responses are evidence-based, grounded in uploaded documents and profile data.

## Features

### Core Features (MVP)
- ✅ **Unified Authentication** - Google, Apple, and email magic link
- ✅ **Profile Management** - Create and edit professional identity
- ✅ **Document Upload** - CV, portfolio, and supporting files
- ✅ **Knowledge Base** - Structured chunks with vector embeddings (UI only)
- ✅ **AI Chat Interface** - Conversational AI persona (mock data)
- ✅ **Job-Fit Analyzer** - Structured job matching analysis (mock data)
- ✅ **Public Profile** - Recruiter-facing profile page
- ✅ **Dashboard** - Analytics and activity tracking
- ✅ **Settings** - Privacy, preferences, and AI configuration
- ✅ **Admin Panel** - Model registry and feature assignments

### Future Features
- 🔜 **Live AI Avatar** - Video-based AI representation (Phase 3)
- 🔜 **Voice Conversations** - Real-time voice chat with AI
- 🔜 **Supabase Integration** - Backend, auth, storage, edge functions
- 🔜 **Vector Search** - pgvector-powered RAG retrieval
- 🔜 **AI Model Switching** - Pluggable providers per feature

## Technology Stack

### Frontend (Current)
- **React 18.3** - UI library
- **React Router 7** - Client-side routing
- **TypeScript** - Type safety
- **Tailwind CSS v4** - Styling
- **Radix UI** - Accessible component primitives
- **Lucide React** - Icon library
- **Sonner** - Toast notifications

### Backend (Planned - Not Implemented Yet)
- **Supabase** - Postgres, Auth, Storage, Edge Functions
- **pgvector** - Vector embeddings storage
- **Cloudflare Pages** - Static hosting
- **AI Providers** - OpenAI, Anthropic, Gemini (pluggable)
- **Avatar Providers** - HeyGen, Synthesia (future)

## Project Structure

```
src/
├── app/
│   ├── components/
│   │   ├── ui/              # shadcn/ui components
│   │   ├── app-layout.tsx   # Main app layout wrapper
│   │   ├── chat-interface.tsx  # Reusable chat component
│   │   └── theme-provider.tsx  # Dark mode provider
│   ├── pages/
│   │   ├── landing.tsx      # Public landing page
│   │   ├── login.tsx        # Authentication
│   │   ├── onboarding.tsx   # Multi-step onboarding
│   │   ├── dashboard.tsx    # User dashboard
│   │   ├── profile.tsx      # Profile editor
│   │   ├── uploads.tsx      # Document manager
│   │   ├── knowledge.tsx    # Knowledge base viewer
│   │   ├── chat-preview.tsx # Test AI chat
│   │   ├── job-fit-preview.tsx  # Test job analyzer
│   │   ├── public-profile.tsx   # Recruiter view
│   │   ├── settings.tsx     # General settings
│   │   ├── settings-ai.tsx  # AI model config
│   │   ├── settings-avatar.tsx  # Avatar settings
│   │   └── admin.tsx        # Admin panel
│   └── App.tsx              # Root component with router
├── styles/
│   ├── index.css            # Global styles
│   ├── theme.css            # Design tokens
│   ├── fonts.css            # Font imports
│   └── tailwind.css         # Tailwind directives
└── imports/
    └── profiley-prd.md      # Product requirements

DESIGN_SYSTEM.md             # Complete design system guide
README.md                    # This file
```

## Pages & Routes

| Route | Page | Description |
|-------|------|-------------|
| `/` | Landing | Public landing page with features |
| `/login` | Auth | Unified sign-in/sign-up |
| `/onboarding` | Onboarding | Multi-step profile setup |
| `/dashboard` | Dashboard | User home with analytics |
| `/profile` | Profile Editor | Edit professional identity |
| `/uploads` | Upload Manager | Document upload and processing |
| `/knowledge` | Knowledge Base | View extracted chunks |
| `/chat-preview` | Chat Preview | Test AI persona |
| `/job-fit-preview` | Job Fit | Test job analyzer |
| `/public/:username` | Public Profile | Recruiter-facing profile |
| `/settings` | Settings | Account and preferences |
| `/settings/ai` | AI Config | Model and persona settings |
| `/settings/avatar` | Avatar | Future avatar setup |
| `/admin` | Admin Panel | Model registry and health |

## Design System

The complete design system is documented in `DESIGN_SYSTEM.md`. Key highlights:

### Visual Style
- **Modern & Futuristic** - Clean with subtle tech aesthetics
- **Dark Mode First** - Optimized for dark theme
- **Gradient Accents** - Purple → Blue → Cyan gradients
- **Glassmorphism** - Backdrop blur and transparency
- **Mobile-First** - Responsive from 320px upward

### Color Palette
- **Primary Gradient**: Purple 500 → Blue 500
- **Secondary Gradient**: Blue 500 → Cyan 500
- **Success**: Green 400
- **Warning**: Orange 400
- **Error**: Destructive red
- **AI Theme**: Purple 400

### Component Library
- Based on shadcn/ui with Radix UI primitives
- Fully accessible and keyboard navigable
- Consistent spacing and sizing
- Dark mode support throughout

## Current State (Static UI)

This is a **frontend-only prototype** with:
- ✅ Complete UI for all planned pages
- ✅ Mock data for all features
- ✅ Responsive design (mobile to desktop)
- ✅ Dark mode support
- ✅ Component library
- ✅ Design system documentation

**Not Yet Implemented:**
- ❌ Supabase backend integration
- ❌ Real authentication
- ❌ Document processing pipeline
- ❌ Vector database and RAG
- ❌ AI model integration
- ❌ Edge functions
- ❌ Storage buckets with RLS

## Next Steps (Backend Integration)

To make this production-ready:

1. **Connect Supabase**
   - Set up Supabase project
   - Configure authentication providers
   - Create database schema (see PRD for full schema)
   - Set up storage buckets with RLS

2. **Implement Edge Functions**
   - Document processing pipeline
   - Embedding generation
   - Chat persona endpoint
   - Job-fit analyzer endpoint
   - Knowledge retrieval

3. **Add AI Providers**
   - Chat: OpenAI GPT-4 or Claude
   - Embeddings: OpenAI text-embedding-3-large
   - STT: OpenAI Whisper
   - TTS: ElevenLabs or OpenAI TTS

4. **Vector Database**
   - Enable pgvector extension
   - Create vector storage tables
   - Implement semantic search

5. **Production Deployment**
   - Deploy frontend to Cloudflare Pages
   - Configure environment variables
   - Set up CI/CD pipeline
   - Monitor performance and errors

## Development

### Running Locally
The Vite dev server is already running in the Make environment.

### Key Files to Edit
- `src/app/pages/*.tsx` - Page components
- `src/app/components/*.tsx` - Reusable components
- `src/styles/theme.css` - Design tokens
- `DESIGN_SYSTEM.md` - Design documentation

### Adding New Pages
1. Create page component in `src/app/pages/`
2. Add route in `src/app/App.tsx`
3. Add navigation link in `src/app/components/app-layout.tsx`

### Styling Guidelines
- Use Tailwind utility classes
- Reference design tokens from `theme.css`
- Follow patterns in `DESIGN_SYSTEM.md`
- Mobile-first responsive approach

## Mock Data

All current data is static and defined in component files:

- **Users**: `Akram Fares` (example user)
- **Documents**: 5 mock uploaded files
- **Knowledge Chunks**: Sample extracted content
- **Analytics**: Simulated metrics
- **Activities**: Mock recruiter interactions
- **Job Fit**: Pre-defined analysis results

Replace with real data once Supabase is integrated.

## Privacy & Security Notes

⚠️ **Important**: This prototype is designed for **demonstration purposes only**.

For production use with real user data:
- Implement proper authentication
- Enforce Row-Level Security (RLS)
- Use signed URLs for storage
- Validate all user inputs
- Implement rate limiting
- Add CSRF protection
- Encrypt sensitive data
- Follow GDPR/privacy regulations

## Design Inspirations

- **Linear** - Clean SaaS aesthetic
- **Vercel** - Gradient usage, typography
- **Notion AI** - AI feature presentation
- **Raycast** - Search-focused UI
- **Arc Browser** - Futuristic touches

## License

This is a prototype for demonstration purposes.

## Credits

- **Product Design**: Based on comprehensive PRD in `src/imports/profiley-prd.md`
- **UI Components**: shadcn/ui with Radix UI
- **Icons**: Lucide React
- **Styling**: Tailwind CSS v4

---

**Version**: 1.0 (UI Prototype)
**Last Updated**: April 27, 2026
**Status**: Ready for backend integration
