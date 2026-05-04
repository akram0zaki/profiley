import { ReactNode, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { useLanguage } from '../contexts/language-context';
import { useTheme } from './theme-provider';
import { signOutAndRedirect } from '../../lib/auth';
import { useCurrentProfile, avatarPublicUrl } from '../../lib/profile';
import {
  LayoutDashboard,
  User,
  Upload,
  Database,
  MessageSquare,
  Briefcase,
  Settings,
  LogOut,
  Menu,
  X,
  Languages,
  Check,
  Sun,
  Moon,
} from 'lucide-react';

interface AppLayoutProps {
  children: ReactNode;
}

const languages = [
  { code: 'en' as const, nativeName: 'English' },
  { code: 'nl' as const, nativeName: 'Nederlands' },
  { code: 'ar' as const, nativeName: 'العربية' },
];

export function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { language, setLanguage, t } = useLanguage();
  const { theme, setTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { appUser, profile } = useCurrentProfile();

  const handleLogout = () => {
    void signOutAndRedirect();
  };

  const navigation = [
    { name: t('nav.dashboard'), href: '/dashboard', icon: LayoutDashboard },
    { name: t('nav.profile'), href: '/profile', icon: User },
    { name: t('nav.uploads'), href: '/uploads', icon: Upload },
    { name: t('nav.knowledge'), href: '/knowledge', icon: Database },
    { name: t('nav.chatPreview'), href: '/chat-preview', icon: MessageSquare },
    { name: t('nav.jobFit'), href: '/job-fit-preview', icon: Briefcase },
  ];

  return (
    <div className="flex-1 flex flex-col bg-gradient-to-br from-background via-background to-accent/5">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-14 max-w-screen-2xl items-center px-4">
          <div className="flex items-center gap-6 flex-1">
            <Link to="/dashboard" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                <span className="font-bold text-white">P</span>
              </div>
              <span className="hidden font-semibold sm:inline-block">{t('layout.brand')}</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex gap-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                return (
                  <Link key={item.name} to={item.href}>
                    <Button
                      variant={isActive ? 'secondary' : 'ghost'}
                      size="sm"
                      className="gap-2"
                    >
                      <Icon className="h-4 w-4" />
                      {item.name}
                    </Button>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="hidden sm:flex"
              aria-label={t('a11y.toggleTheme')}
              aria-pressed={theme === 'dark'}
            >
              {theme === 'dark' ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>

            {/* Language Selector */}
            <div className="hidden sm:block">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2" aria-label={t('a11y.selectLanguage')}>
                    <Languages className="h-4 w-4" />
                    <span className="text-sm">
                      {languages.find((l) => l.code === language)?.code.toUpperCase()}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-48" align="end">
                  <DropdownMenuLabel>{t('nav.language')}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {languages.map((lang) => (
                    <DropdownMenuItem
                      key={lang.code}
                      onClick={() => setLanguage(lang.code)}
                    >
                      <span className="flex-1">{lang.nativeName}</span>
                      {language === lang.code && (
                        <Check className="h-4 w-4" />
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? t('a11y.closeMenu') : t('a11y.openMenu')}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full" aria-label={t('a11y.userMenu')}>
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={avatarPublicUrl(profile?.profile_photo_path) ?? "https://api.dicebear.com/7.x/avataaars/svg?seed=Akram"} alt="User" />
                    <AvatarFallback>{profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : 'U'}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <DropdownMenuLabel className="font-normal">
                  <p className="text-sm font-medium">{profile?.full_name || 'User'}</p>
                  <p className="text-xs text-muted-foreground">{appUser?.email || ''}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/dashboard')}>
                  <LayoutDashboard />
                  {t('nav.dashboard')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/settings')}>
                  <Settings />
                  {t('nav.settings')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/public/akram')}>
                  <User />
                  {t('nav.viewPublicProfile')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {/* Language selector for mobile */}
                <div className="sm:hidden">
                  <DropdownMenuLabel className="text-xs text-muted-foreground">{t('nav.language')}</DropdownMenuLabel>
                  {languages.map((lang) => (
                    <DropdownMenuItem
                      key={`mobile-${lang.code}`}
                      onClick={() => setLanguage(lang.code)}
                    >
                      <span className="flex-1">{lang.nativeName}</span>
                      {language === lang.code && (
                        <Check className="h-4 w-4" />
                      )}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                </div>
                <DropdownMenuItem onClick={handleLogout} variant="destructive">
                  <LogOut />
                  {t('nav.signOut')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border/40 bg-background/95 backdrop-blur">
            <nav className="container mx-auto px-4 py-4 space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Button
                      variant={isActive ? 'secondary' : 'ghost'}
                      className="w-full justify-start gap-2"
                    >
                      <Icon className="h-4 w-4" />
                      {item.name}
                    </Button>
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="container mx-auto max-w-screen-2xl px-4 py-6">{children}</main>
    </div>
  );
}
