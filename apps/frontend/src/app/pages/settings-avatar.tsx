import { AppLayout } from '../components/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Badge } from '../components/ui/badge';
import { Link } from 'react-router';
import { ArrowLeft, Upload, Video, Sparkles } from 'lucide-react';

export default function SettingsAvatarPage() {
  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link to="/settings">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Avatar Settings</h1>
            <p className="text-muted-foreground">
              Configure your AI avatar for future live sessions
            </p>
          </div>
        </div>

        {/* Coming Soon Banner */}
        <Card className="border-purple-500/50 bg-gradient-to-br from-purple-500/10 to-blue-500/10">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-start gap-6">
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                <Sparkles className="h-8 w-8 text-white" />
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-semibold">Live AI Avatar - Coming Soon</h3>
                  <Badge variant="secondary">Phase 3</Badge>
                </div>
                <p className="text-muted-foreground">
                  Soon you'll be able to create a live AI avatar that can join video calls and represent
                  you in real-time conversations with recruiters. Your avatar will use your uploaded
                  photo, synthesized voice, and knowledge base to conduct natural conversations.
                </p>
                <div className="pt-2">
                  <h4 className="font-medium mb-2">Planned Features:</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• Photo-realistic avatar generation from your uploaded photo</li>
                    <li>• Real-time voice synthesis with your chosen voice model</li>
                    <li>• Live video streaming via HeyGen or Synthesia</li>
                    <li>• Natural conversation flow with lip-sync</li>
                    <li>• Session recording and transcripts</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Avatar Photo */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Video className="h-5 w-5 text-blue-400" />
              <CardTitle>Avatar Source Photo</CardTitle>
            </div>
            <CardDescription>
              Upload a high-quality photo for your AI avatar
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-6">
              <Avatar className="h-32 w-32 border-2 border-border">
                <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=Akram" alt="Avatar" />
                <AvatarFallback>AK</AvatarFallback>
              </Avatar>
              <div className="space-y-3">
                <div>
                  <Button variant="outline" className="gap-2" disabled>
                    <Upload className="h-4 w-4" />
                    Upload Avatar Photo
                  </Button>
                  <Badge variant="secondary" className="ml-2">Coming Soon</Badge>
                </div>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Use a clear, front-facing photo</li>
                  <li>• Recommended: Professional headshot</li>
                  <li>• High resolution (at least 1024x1024px)</li>
                  <li>• Good lighting and neutral background</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Avatar Provider */}
        <Card>
          <CardHeader>
            <CardTitle>Avatar Provider</CardTitle>
            <CardDescription>
              Choose the platform for generating your live avatar
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="p-4 rounded-lg border border-border/50 opacity-50">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">HeyGen</h4>
                  <Badge variant="outline">Planned</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  High-quality AI avatars with real-time streaming capabilities
                </p>
              </div>
              <div className="p-4 rounded-lg border border-border/50 opacity-50">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">Synthesia</h4>
                  <Badge variant="outline">Planned</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Professional AI avatar generation for enterprise use
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Voice Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Avatar Voice</CardTitle>
            <CardDescription>
              Your avatar will use the voice settings configured in AI Settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-4 rounded-lg border border-border/50 bg-muted/50">
              <p className="text-sm">
                Current TTS Model: <strong>ElevenLabs</strong>
                <br />
                Voice Style: <strong>Professional</strong>
              </p>
              <Link to="/settings/ai" className="inline-block mt-3">
                <Button variant="outline" size="sm">
                  Configure Voice Settings
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Future Sessions */}
        <Card>
          <CardHeader>
            <CardTitle>Session Management</CardTitle>
            <CardDescription>
              Future avatar sessions will appear here
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-muted-foreground">
              <Video className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No avatar sessions yet</p>
              <p className="text-sm">This feature will be available in Phase 3</p>
            </div>
          </CardContent>
        </Card>

        {/* Back Button */}
        <div className="flex justify-start">
          <Link to="/settings">
            <Button variant="outline">Back to Settings</Button>
          </Link>
        </div>
      </div>
    </AppLayout>
  );
}
