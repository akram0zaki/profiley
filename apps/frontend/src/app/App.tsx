import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { ThemeProvider } from './components/theme-provider';
import { LanguageProvider } from './contexts/language-context';
import { Toaster } from './components/ui/sonner';
import { ScrollToTop } from './components/scroll-to-top';
import { SkipLink } from './components/skip-link';
import { RequireAppAccess, RequireAuth, RequireAdmin, RequireLegalAcceptance } from './components/auth-guards';
import { Footer } from './components/footer';

// Pages
import LandingPage from './pages/landing';
import LoginPage from './pages/login';
import OnboardingPage from './pages/onboarding';
import DashboardPage from './pages/dashboard';
import ProfilePage from './pages/profile';
import UploadsPage from './pages/uploads';
import KnowledgePage from './pages/knowledge';
import ChatPreviewPage from './pages/chat-preview';
import JobFitPreviewPage from './pages/job-fit-preview';
import PublicProfilePage from './pages/public-profile';
import SettingsPage from './pages/settings';
import SettingsAIPage from './pages/settings-ai';
import SettingsAvatarPage from './pages/settings-avatar';
import AdminPage from './pages/admin';
import AuthCallbackPage from './pages/auth-callback';
import TermsPage from './pages/terms';
import PrivacyPage from './pages/privacy';
import CookiesPage from './pages/cookies';
import LegalAcceptancePage from './pages/legal-acceptance';

export default function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="profiley-theme">
      <LanguageProvider>
        <BrowserRouter>
          <SkipLink />
          <ScrollToTop />
          <div className="flex flex-col min-h-screen w-full">
            <main id="main-content" className="flex-1 flex flex-col" tabIndex={-1}>
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/auth/callback" element={<AuthCallbackPage />} />
                <Route path="/legal/acceptance" element={<RequireAuth><LegalAcceptancePage /></RequireAuth>} />
                <Route path="/onboarding" element={<RequireLegalAcceptance><OnboardingPage /></RequireLegalAcceptance>} />
                <Route path="/dashboard" element={<RequireAppAccess><DashboardPage /></RequireAppAccess>} />
                <Route path="/profile" element={<RequireAppAccess><ProfilePage /></RequireAppAccess>} />
                <Route path="/uploads" element={<RequireAppAccess><UploadsPage /></RequireAppAccess>} />
                <Route path="/knowledge" element={<RequireAppAccess><KnowledgePage /></RequireAppAccess>} />
                <Route path="/chat-preview" element={<RequireAppAccess><ChatPreviewPage /></RequireAppAccess>} />
                <Route path="/job-fit-preview" element={<RequireAppAccess><JobFitPreviewPage /></RequireAppAccess>} />
                <Route path="/public/:username" element={<PublicProfilePage />} />
                <Route path="/settings" element={<RequireAppAccess><SettingsPage /></RequireAppAccess>} />
                <Route path="/settings/ai" element={<RequireAppAccess><SettingsAIPage /></RequireAppAccess>} />
                <Route path="/settings/avatar" element={<RequireAppAccess><SettingsAvatarPage /></RequireAppAccess>} />
                <Route path="/admin" element={<RequireAdmin><AdminPage /></RequireAdmin>} />
                <Route path="/legal/terms" element={<TermsPage />} />
                <Route path="/legal/privacy" element={<PrivacyPage />} />
                <Route path="/legal/cookies" element={<CookiesPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
            <Footer />
          </div>
          <Toaster />
        </BrowserRouter>
      </LanguageProvider>
    </ThemeProvider>
  );
}
