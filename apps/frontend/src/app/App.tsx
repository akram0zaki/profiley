import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { ThemeProvider } from './components/theme-provider';
import { LanguageProvider } from './contexts/language-context';
import { Toaster } from './components/ui/sonner';
import { RequireAuth, RequireAdmin } from './components/auth-guards';

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

export default function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="profiley-theme">
      <LanguageProvider>
        <BrowserRouter>
          <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="/onboarding" element={<RequireAuth><OnboardingPage /></RequireAuth>} />
          <Route path="/dashboard" element={<RequireAuth><DashboardPage /></RequireAuth>} />
          <Route path="/profile" element={<RequireAuth><ProfilePage /></RequireAuth>} />
          <Route path="/uploads" element={<RequireAuth><UploadsPage /></RequireAuth>} />
          <Route path="/knowledge" element={<RequireAuth><KnowledgePage /></RequireAuth>} />
          <Route path="/chat-preview" element={<RequireAuth><ChatPreviewPage /></RequireAuth>} />
          <Route path="/job-fit-preview" element={<RequireAuth><JobFitPreviewPage /></RequireAuth>} />
          <Route path="/public/:username" element={<PublicProfilePage />} />
          <Route path="/settings" element={<RequireAuth><SettingsPage /></RequireAuth>} />
          <Route path="/settings/ai" element={<RequireAuth><SettingsAIPage /></RequireAuth>} />
          <Route path="/settings/avatar" element={<RequireAuth><SettingsAvatarPage /></RequireAuth>} />
          <Route path="/admin" element={<RequireAdmin><AdminPage /></RequireAdmin>} />
          <Route path="/legal/terms" element={<TermsPage />} />
          <Route path="/legal/privacy" element={<PrivacyPage />} />
          <Route path="/legal/cookies" element={<CookiesPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <Toaster />
        </BrowserRouter>
      </LanguageProvider>
    </ThemeProvider>
  );
}
