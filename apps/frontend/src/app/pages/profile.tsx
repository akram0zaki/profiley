import { AppLayout } from '../components/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Badge } from '../components/ui/badge';
import { useState } from 'react';
import { Save, Upload, X } from 'lucide-react';
import { toast } from 'sonner';

export default function ProfilePage() {
  const [formData, setFormData] = useState({
    fullName: 'Akram Fares',
    headline: 'Senior Software Engineer | AI & Cloud Architecture',
    bio: 'Passionate about building scalable AI systems and cloud infrastructure. 10+ years of experience in full-stack development with expertise in React, Node.js, Python, and distributed systems.',
    location: 'San Francisco, CA',
    profilePhoto: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Akram',
  });

  const [skills, setSkills] = useState([
    'React',
    'Node.js',
    'Python',
    'AI/ML',
    'Cloud Architecture',
    'System Design',
  ]);
  const [newSkill, setNewSkill] = useState('');

  const addSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill('');
    }
  };

  const removeSkill = (skill: string) => {
    setSkills(skills.filter((s) => s !== skill));
  };

  const handleSave = () => {
    toast.success('Profile updated successfully!');
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Edit Profile</h1>
            <p className="text-muted-foreground">
              Manage your public professional identity
            </p>
          </div>
          <Button onClick={handleSave} className="gap-2">
            <Save className="h-4 w-4" />
            Save Changes
          </Button>
        </div>

        {/* Profile Photo */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Photo</CardTitle>
            <CardDescription>Your photo appears on your public profile</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src={formData.profilePhoto} alt={formData.fullName} />
                <AvatarFallback>AK</AvatarFallback>
              </Avatar>
              <div className="space-y-2">
                <Button variant="outline" className="gap-2">
                  <Upload className="h-4 w-4" />
                  Upload New Photo
                </Button>
                <p className="text-xs text-muted-foreground">
                  JPG, PNG or GIF. Max 2MB. Recommended 400x400px.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Your core professional details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="headline">Professional Headline</Label>
              <Input
                id="headline"
                value={formData.headline}
                onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                This appears prominently on your public profile
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                rows={6}
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Tell recruiters about your background, experience, and what makes you unique
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Skills */}
        <Card>
          <CardHeader>
            <CardTitle>Skills & Expertise</CardTitle>
            <CardDescription>Key skills that define your professional identity</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Add a skill (e.g., React, Python, AI/ML)"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
              />
              <Button onClick={addSkill}>Add</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {skills.map((skill) => (
                <Badge key={skill} variant="secondary" className="gap-1 py-1 px-3">
                  {skill}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => removeSkill(skill)} />
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Public Profile Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Public Profile Settings</CardTitle>
            <CardDescription>Control what recruiters can see and do</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Profile URL</Label>
                <p className="text-sm text-muted-foreground">profiley.ai/akram</p>
              </div>
              <Button variant="outline" size="sm">
                Copy Link
              </Button>
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div className="space-y-0.5">
                <p className="font-medium">Public Profile Visibility</p>
                <p className="text-sm text-muted-foreground">
                  Your profile is visible to anyone with the link
                </p>
              </div>
              <Badge variant="default" className="bg-green-500">
                Active
              </Badge>
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div className="space-y-0.5">
                <p className="font-medium">Allow AI Chat</p>
                <p className="text-sm text-muted-foreground">
                  Let recruiters chat with your AI persona
                </p>
              </div>
              <Badge variant="default" className="bg-green-500">
                Enabled
              </Badge>
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div className="space-y-0.5">
                <p className="font-medium">Allow Job-Fit Analysis</p>
                <p className="text-sm text-muted-foreground">
                  Let recruiters analyze job descriptions against your profile
                </p>
              </div>
              <Badge variant="default" className="bg-green-500">
                Enabled
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Save Button (Bottom) */}
        <div className="flex justify-end">
          <Button onClick={handleSave} size="lg" className="gap-2">
            <Save className="h-4 w-4" />
            Save All Changes
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
