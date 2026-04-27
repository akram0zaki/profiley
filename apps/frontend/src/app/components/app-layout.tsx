import { ReactNode, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { SimpleDropdown, SimpleDropdownItem, SimpleDropdownLabel, SimpleDropdownSeparator } from './simple-dropdown';
import { useLanguage } from '../contexts/language-context';
import { useTheme } from './theme-provider';
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

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Profile', href: '/profile', icon: User },
  { name: 'Uploads', href: '/uploads', icon: Upload },
  { name: 'Knowledge', href: '/knowledge', icon: Database },
  { name: 'Chat Preview', href: '/chat-preview', icon: MessageSquare },
  { name: 'Job Fit', href: '/job-fit-preview', icon: Briefcase },
];

const languages = [
  { code: 'en' as const, name: 'English', nativeName: 'English' },
  { code: 'nl' as const, name: 'Nederlands', nativeName: 'Nederlands' },
  { code: 'ar' as const, name: 'العربية', nativeName: 'العربية' },
];

export function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { language, setLanguage, t } = useLanguage();
  const { theme, setTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    navigate('/login');
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 max-w-screen-2xl items-center px-4">
          <div className="flex items-center gap-6 flex-1">
            <Link to="/dashboard" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                <span className="font-bold text-white">P</span>
              </div>
              <span className="hidden font-semibold sm:inline-block">Profiley</span>
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
            >
              {theme === 'dark' ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>

            {/* Language Selector */}
            <div className="hidden sm:block">
              <SimpleDropdown
                trigger={
                  <Button variant="ghost" size="sm" className="gap-2">
                    <Languages className="h-4 w-4" />
                    <span className="text-sm">
                      {languages.find((l) => l.code === language)?.code.toUpperCase()}
                    </span>
                  </Button>
                }
                className="w-48"
              >
                <SimpleDropdownLabel>{t('nav.language')}</SimpleDropdownLabel>
                <SimpleDropdownSeparator />
                {languages.map((lang) => (
                  <SimpleDropdownItem
                    key={lang.code}
                    onClick={() => setLanguage(lang.code)}
                  >
                    <div className="flex flex-col flex-1">
                      <span>{lang.nativeName}</span>
                    </div>
                    {language === lang.code && (
                      <Check className="h-4 w-4 text-primary mx-2" />
                    )}
                  </SimpleDropdownItem>
                ))}
              </SimpleDropdown>
            </div>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>

            {/* User Menu */}
            <SimpleDropdown
              trigger={
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=Akram" alt="User" />
                    <AvatarFallback>AK</AvatarFallback>
                  </Avatar>
                </Button>
              }
              className="w-56"
            >
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium">Akram Fares</p>
                <p className="text-xs text-muted-foreground">akram@example.com</p>
              </div>
              <SimpleDropdownSeparator />
              <SimpleDropdownItem onClick={() => navigate('/dashboard')}>
                <LayoutDashboard className="mx-2 h-4 w-4" />
                {t('nav.dashboard')}
              </SimpleDropdownItem>
              <SimpleDropdownItem onClick={() => navigate('/settings')}>
                <Settings className="mx-2 h-4 w-4" />
                {t('nav.settings')}
              </SimpleDropdownItem>
              <SimpleDropdownItem onClick={() => navigate('/public/akram')}>
                <User className="mx-2 h-4 w-4" />
                {t('nav.viewPublicProfile')}
              </SimpleDropdownItem>
              <SimpleDropdownSeparator />
              {/* Language selector for mobile */}
              <div className="sm:hidden">
                <SimpleDropdownLabel className="text-xs text-muted-foreground">{t('nav.language')}</SimpleDropdownLabel>
                {languages.map((lang) => (
                  <SimpleDropdownItem
                    key={`mobile-${lang.code}`}
                    onClick={() => setLanguage(lang.code)}
                  >
                    <span className="flex-1">{lang.nativeName}</span>
                    {language === lang.code && (
                      <Check className="h-4 w-4 text-primary mx-2" />
                    )}
                  </SimpleDropdownItem>
                ))}
                <SimpleDropdownSeparator />
              </div>
              <SimpleDropdownItem onClick={handleLogout} variant="destructive">
                <LogOut className="mx-2 h-4 w-4" />
                {t('nav.signOut')}
              </SimpleDropdownItem>
            </SimpleDropdown>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border/40 bg-background/95 backdrop-blur">
            <nav className="container px-4 py-4 space-y-1">
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
      <main className="container max-w-screen-2xl px-4 py-6">{children}</main>
    </div>
  );
}
