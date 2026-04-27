import { useState } from 'react';
import { useParams, Link } from 'react-router';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Textarea } from '../components/ui/textarea';
import { ChatInterface } from '../components/chat-interface';
import { Separator } from '../components/ui/separator';
import {
  MapPin,
  Mail,
  Linkedin,
  Github,
  Globe,
  MessageSquare,
  Briefcase,
  Shield,
  Sparkles,
} from 'lucide-react';

export default function PublicProfilePage() {
  const { username } = useParams();
  const [activeTab, setActiveTab] = useState('about');

  const mockProfile = {
    name: 'Akram Fares',
    headline: 'Senior Software Engineer | AI & Cloud Architecture',
    location: 'San Francisco, CA',
    photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Akram',
    bio: 'Passionate about building scalable AI systems and cloud infrastructure. 10+ years of experience in full-stack development with expertise in React, Node.js, Python, and distributed systems. Led the development of platforms serving 10M+ users with 99.99% uptime.',
    skills: [
      'React',
      'Node.js',
      'Python',
      'AI/ML',
      'Cloud Architecture',
      'System Design',
      'Kubernetes',
      'TypeScript',
    ],
    highlights: [
      'AWS Certified Solutions Architect - Professional',
      'Google Cloud Professional Cloud Architect',
      'Led development of RepCue healthcare platform',
      'Mentored 15+ junior engineers',
    ],
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-purple-500/5">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between px-4 max-w-screen-xl">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
              <span className="font-bold text-white">P</span>
            </div>
            <span className="font-semibold hidden sm:inline-block">Profiley</span>
          </Link>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="gap-1">
              <Shield className="h-3 w-3" />
              AI-Verified Profile
            </Badge>
            <Link to="/login">
              <Button variant="outline" size="sm">
                Create Your Profile
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="border-b border-border/40 bg-gradient-to-b from-purple-500/5 to-transparent">
        <div className="container px-4 py-12 max-w-screen-xl">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            <Avatar className="h-32 w-32 border-4 border-background shadow-xl">
              <AvatarImage src={mockProfile.photo} alt={mockProfile.name} />
              <AvatarFallback>AK</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold">{mockProfile.name}</h1>
                <p className="text-lg text-muted-foreground mt-1">{mockProfile.headline}</p>
                <div className="flex items-center gap-2 mt-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{mockProfile.location}</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {mockProfile.skills.slice(0, 6).map((skill) => (
                  <Badge key={skill} variant="secondary">
                    {skill}
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Button className="gap-2">
                  <Mail className="h-4 w-4" />
                  Contact
                </Button>
                <Button variant="outline" className="gap-2">
                  <Linkedin className="h-4 w-4" />
                </Button>
                <Button variant="outline" className="gap-2">
                  <Github className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="container px-4 py-8 max-w-screen-xl">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="about">About</TabsTrigger>
            <TabsTrigger value="chat" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              AI Chat
            </TabsTrigger>
            <TabsTrigger value="job-fit" className="gap-2">
              <Briefcase className="h-4 w-4" />
              Job Fit
            </TabsTrigger>
          </TabsList>

          {/* About Tab */}
          <TabsContent value="about" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>About</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="leading-relaxed">{mockProfile.bio}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Key Highlights</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {mockProfile.highlights.map((highlight, i) => (
                    <li key={i} className="flex gap-3">
                      <div className="h-6 w-6 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                        <div className="h-2 w-2 rounded-full bg-green-400" />
                      </div>
                      <span>{highlight}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>All Skills</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {mockProfile.skills.map((skill) => (
                    <Badge key={skill} variant="outline">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Chat Tab */}
          <TabsContent value="chat" className="space-y-6 mt-6">
            <Card className="border-blue-500/50 bg-blue-500/5">
              <CardHeader className="flex flex-row items-start gap-4">
                <Sparkles className="h-5 w-5 text-blue-400 mt-1 flex-shrink-0" />
                <div className="space-y-1">
                  <CardTitle className="text-base">Chat with {mockProfile.name}'s AI</CardTitle>
                  <CardDescription>
                    This AI can answer questions about {mockProfile.name.split(' ')[0]}'s experience,
                    skills, and projects. All responses are based on verified profile data and uploaded
                    documents.
                  </CardDescription>
                </div>
              </CardHeader>
            </Card>

            <Card className="h-[600px] flex flex-col">
              <ChatInterface
                profileSlug={username}
                userName="You"
                botName={`${mockProfile.name.split(' ')[0]} AI`}
                placeholder="Ask about experience, skills, projects, or qualifications..."
              />
            </Card>
          </TabsContent>

          {/* Job Fit Tab */}
          <TabsContent value="job-fit" className="space-y-6 mt-6">
            <Card className="border-purple-500/50 bg-purple-500/5">
              <CardHeader className="flex flex-row items-start gap-4">
                <Briefcase className="h-5 w-5 text-purple-400 mt-1 flex-shrink-0" />
                <div className="space-y-1">
                  <CardTitle className="text-base">Job-Fit Analysis</CardTitle>
                  <CardDescription>
                    Paste a job description below to get an instant AI-powered analysis of how well{' '}
                    {mockProfile.name.split(' ')[0]} matches the role, including strengths, gaps, and
                    transferable skills.
                  </CardDescription>
                </div>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Paste Job Description</CardTitle>
                <CardDescription>
                  AI will analyze the match and provide a detailed assessment
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="Paste the job description here..."
                  rows={12}
                  className="font-mono text-sm"
                />
                <Button className="gap-2">
                  <Sparkles className="h-4 w-4" />
                  Analyze Job Fit
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-8 mt-12">
        <div className="container px-4 max-w-screen-xl">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                This profile is powered by Profiley AI. All responses are evidence-based and verified.
              </p>
            </div>
            <Link to="/login">
              <Button variant="outline" size="sm">
                Create Your AI Profile
              </Button>
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
