import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { ThemeProvider } from './components/theme-provider';
import { LanguageProvider } from './contexts/language-context';
import { Toaster } from './components/ui/sonner';

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

export default function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="profiley-theme">
      <LanguageProvider>
        <BrowserRouter>
          <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/uploads" element={<UploadsPage />} />
          <Route path="/knowledge" element={<KnowledgePage />} />
          <Route path="/chat-preview" element={<ChatPreviewPage />} />
          <Route path="/job-fit-preview" element={<JobFitPreviewPage />} />
          <Route path="/public/:username" element={<PublicProfilePage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/settings/ai" element={<SettingsAIPage />} />
          <Route path="/settings/avatar" element={<SettingsAvatarPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <Toaster />
        </BrowserRouter>
      </LanguageProvider>
    </ThemeProvider>
  );
}
