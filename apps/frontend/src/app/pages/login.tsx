import { Link } from 'react-router';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Separator } from '../components/ui/separator';
import { Mail, Chrome, Github } from 'lucide-react';
import { useState } from 'react';
import { signInWithEmail, signInWithProvider } from '../../lib/auth';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const { error } = await signInWithEmail(email);
      if (error) throw error;
      setMagicLinkSent(true);
    } catch (err) {
      setError((err as Error).message ?? 'Failed to send magic link');
    } finally {
      setBusy(false);
    }
  };

  const handleProvider = async (provider: 'google' | 'github') => {
    setError(null);
    setBusy(true);
    try {
      const { error } = await signInWithProvider(provider);
      if (error) throw error;
    } catch (err) {
      setError((err as Error).message ?? 'OAuth sign-in failed');
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-purple-500/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
              <span className="text-2xl font-bold text-white">P</span>
            </div>
          </Link>
          <h1 className="text-2xl font-bold">Welcome to Profiley</h1>
          <p className="text-muted-foreground">
            Sign in to create your AI professional identity
          </p>
        </div>

        {/* Auth Card */}
        <Card className="border-border/50 bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle>Sign in or Create Account</CardTitle>
            <CardDescription>
              Choose your preferred authentication method
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Social Login Buttons */}
            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full gap-2"
                disabled={busy}
                onClick={() => handleProvider('google')}
              >
                <Chrome className="h-5 w-5" />
                Continue with Google
              </Button>
              <Button
                variant="outline"
                className="w-full gap-2"
                disabled={busy}
                onClick={() => handleProvider('github')}
              >
                <Github className="h-5 w-5" />
                Continue with GitHub
              </Button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or continue with email</span>
              </div>
            </div>

            {/* Magic Link Form */}
            <form onSubmit={handleMagicLink} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full gap-2" disabled={busy || magicLinkSent}>
                <Mail className="h-4 w-4" />
                {magicLinkSent ? 'Check your email!' : 'Send Magic Link'}
              </Button>
            </form>

            {magicLinkSent && (
              <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-sm text-green-400">
                We've sent a sign-in link to {email}. Check your inbox!
              </div>
            )}
            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">
                {error}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-sm text-muted-foreground">
          By continuing, you agree to our Terms of Service and Privacy Policy.
          <br />
          First time signing in? Your account will be created automatically.
        </p>

        <div className="text-center">
          <Link to="/">
            <Button variant="ghost" size="sm">
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
