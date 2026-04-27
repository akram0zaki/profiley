import { AppLayout } from '../components/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Badge } from '../components/ui/badge';
import { Switch } from '../components/ui/switch';
import { useEffect, useState } from 'react';
import { Save, Upload, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  useCurrentProfile,
  updateProfile,
  updatePreferences,
  avatarPublicUrl,
} from '../../lib/profile';
import { api, ApiError } from '../../lib/api';
import { supabase } from '../../lib/supabase';

const SKILLS_QUESTION_KEY = 'skills';

export default function ProfilePage() {
  const { appUser, profile, preferences, loading, error, reload } = useCurrentProfile();

  const [form, setForm] = useState({
    fullName: '',
    headline: '',
    shortBio: '',
    longBio: '',
    location: '',
    photoPath: null as string | null,
  });
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  useEffect(() => {
    if (profile) {
      setForm({
        fullName: profile.full_name ?? '',
        headline: profile.headline ?? '',
        shortBio: profile.short_bio ?? '',
        longBio: profile.long_bio ?? '',
        location: profile.current_location ?? '',
        photoPath: profile.profile_photo_path,
      });
    }
  }, [profile]);

  useEffect(() => {
    let cancelled = false;
    if (!appUser) return;
    void (async () => {
      const { data, error } = await supabase
        .from('onboarding_answers')
        .select('answer_json,answer_text')
        .eq('user_id', appUser.id)
        .eq('question_key', SKILLS_QUESTION_KEY)
        .maybeSingle();
      if (cancelled || error) return;
      if (data) {
        const json = data.answer_json as unknown;
        if (Array.isArray(json)) {
          setSkills(json.filter((s) => typeof s === 'string') as string[]);
        } else if (typeof data.answer_text === 'string' && data.answer_text) {
          setSkills(data.answer_text.split(',').map((s) => s.trim()).filter(Boolean));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [appUser]);

  const photoUrl = avatarPublicUrl(form.photoPath);
  const initials = (form.fullName || appUser?.email || '?')
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const addSkill = () => {
    const s = newSkill.trim();
    if (!s || skills.includes(s)) return;
    setSkills([...skills, s]);
    setNewSkill('');
  };

  const removeSkill = (s: string) => setSkills(skills.filter((x) => x !== s));

  const handlePhotoUpload = async (file: File) => {
    if (!appUser) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Photo must be 2MB or less');
      return;
    }
    setUploadingPhoto(true);
    try {
      const ext = file.name.split('.').pop() ?? 'png';
      const path = `${appUser.id}/avatar-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;
      await updateProfile(appUser.id, { profile_photo_path: path });
      setForm((f) => ({ ...f, photoPath: path }));
      toast.success('Photo updated');
    } catch (e: any) {
      toast.error(e?.message ?? 'Photo upload failed');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSave = async () => {
    if (!appUser) return;
    setSaving(true);
    try {
      await updateProfile(appUser.id, {
        full_name: form.fullName || appUser.email,
        headline: form.headline || null,
        short_bio: form.shortBio || null,
        long_bio: form.longBio || null,
        current_location: form.location || null,
      });
      await supabase.from('onboarding_answers').upsert(
        {
          user_id: appUser.id,
          question_key: SKILLS_QUESTION_KEY,
          answer_json: skills,
          answer_text: skills.join(', '),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,question_key' },
      );
      toast.success('Profile updated');
      await reload();
    } catch (e: any) {
      toast.error(e?.message ?? 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const togglePref = async (
    key: 'allow_public_chat' | 'allow_job_fit_analysis' | 'allow_contact_form' | 'allow_document_citation',
    value: boolean,
  ) => {
    if (!appUser) return;
    try {
      await updatePreferences(appUser.id, { [key]: value });
      await reload();
    } catch (e: any) {
      toast.error(e?.message ?? 'Update failed');
    }
  };

  const togglePublic = async (next: boolean) => {
    try {
      await api.publishProfile({ publicVisibility: next });
      toast.success(next ? 'Profile published' : 'Profile unpublished');
      await reload();
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Update failed';
      toast.error(msg);
    }
  };

  const copyShareLink = async () => {
    if (!profile?.slug) return;
    const url = `${window.location.origin}/public/${profile.slug}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Profile link copied');
    } catch {
      toast.error('Copy failed');
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-24 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading profile…
        </div>
      </AppLayout>
    );
  }

  if (error || !profile || !appUser) {
    return (
      <AppLayout>
        <div className="max-w-2xl mx-auto py-12 space-y-4">
          <h1 className="text-2xl font-bold">Profile not ready</h1>
          <p className="text-muted-foreground">
            {error ?? "We couldn't find your profile yet. Please complete onboarding first."}
          </p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Edit Profile</h1>
            <p className="text-muted-foreground">Manage your public professional identity</p>
          </div>
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Changes
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Profile Photo</CardTitle>
            <CardDescription>Your photo appears on your public profile</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-6">
              <Avatar className="h-24 w-24">
                {photoUrl ? <AvatarImage src={photoUrl} alt={form.fullName} /> : null}
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div className="space-y-2">
                <label>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/gif,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) void handlePhotoUpload(f);
                      e.target.value = '';
                    }}
                  />
                  <Button asChild variant="outline" className="gap-2" disabled={uploadingPhoto}>
                    <span>
                      {uploadingPhoto ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4" />
                      )}
                      Upload New Photo
                    </span>
                  </Button>
                </label>
                <p className="text-xs text-muted-foreground">
                  JPG, PNG or GIF. Max 2MB. Recommended 400x400px.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

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
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="headline">Professional Headline</Label>
              <Input
                id="headline"
                value={form.headline}
                onChange={(e) => setForm({ ...form, headline: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="shortBio">Short Bio</Label>
              <Textarea
                id="shortBio"
                rows={3}
                value={form.shortBio}
                onChange={(e) => setForm({ ...form, shortBio: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="longBio">Bio</Label>
              <Textarea
                id="longBio"
                rows={6}
                value={form.longBio}
                onChange={(e) => setForm({ ...form, longBio: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

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
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addSkill();
                  }
                }}
              />
              <Button onClick={addSkill}>Add</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {skills.map((s) => (
                <Badge key={s} variant="secondary" className="gap-1 py-1 px-3">
                  {s}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => removeSkill(s)} />
                </Badge>
              ))}
              {skills.length === 0 && (
                <p className="text-sm text-muted-foreground">No skills yet. Add a few above.</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Public Profile Settings</CardTitle>
            <CardDescription>Control what recruiters can see and do</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Profile URL</Label>
                <p className="text-sm text-muted-foreground">
                  {window.location.origin}/public/{profile.slug}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={copyShareLink}>
                Copy Link
              </Button>
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div className="space-y-0.5">
                <p className="font-medium">Public Profile Visibility</p>
                <p className="text-sm text-muted-foreground">Anyone with the link can view your profile</p>
              </div>
              <Switch checked={profile.public_visibility} onCheckedChange={togglePublic} />
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div className="space-y-0.5">
                <p className="font-medium">Allow AI Chat</p>
                <p className="text-sm text-muted-foreground">Let recruiters chat with your AI persona</p>
              </div>
              <Switch
                checked={preferences?.allow_public_chat ?? true}
                onCheckedChange={(v) => togglePref('allow_public_chat', v)}
              />
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div className="space-y-0.5">
                <p className="font-medium">Allow Job-Fit Analysis</p>
                <p className="text-sm text-muted-foreground">
                  Let recruiters analyze job descriptions against your profile
                </p>
              </div>
              <Switch
                checked={preferences?.allow_job_fit_analysis ?? true}
                onCheckedChange={(v) => togglePref('allow_job_fit_analysis', v)}
              />
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div className="space-y-0.5">
                <p className="font-medium">Allow Contact Form</p>
                <p className="text-sm text-muted-foreground">Let recruiters send you direct messages</p>
              </div>
              <Switch
                checked={preferences?.allow_contact_form ?? true}
                onCheckedChange={(v) => togglePref('allow_contact_form', v)}
              />
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div className="space-y-0.5">
                <p className="font-medium">Show Document Citations</p>
                <p className="text-sm text-muted-foreground">Display source references in AI responses</p>
              </div>
              <Switch
                checked={preferences?.allow_document_citation ?? true}
                onCheckedChange={(v) => togglePref('allow_document_citation', v)}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={handleSave} size="lg" disabled={saving} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save All Changes
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
