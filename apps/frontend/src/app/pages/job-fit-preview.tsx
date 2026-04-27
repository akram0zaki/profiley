import { AppLayout } from '../components/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { Progress } from '../components/ui/progress';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { useState } from 'react';
import { Sparkles, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2 } from 'lucide-react';

const mockJobDescription = `Senior Full-Stack Engineer - AI Platform

TechCorp is looking for a Senior Full-Stack Engineer to join our AI Platform team. You'll be working on building scalable AI services that serve millions of users.

Requirements:
• 5+ years of full-stack development experience
• Expert knowledge of React, Node.js, and Python
• Experience with cloud platforms (AWS/GCP)
• Strong understanding of distributed systems
• Experience with Kubernetes and Docker
• AI/ML experience is a plus

Nice to have:
• Leadership and mentoring experience
• Healthcare domain knowledge
• Open source contributions`;

export default function JobFitPreviewPage() {
  const [jobDescription, setJobDescription] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleAnalyze = () => {
    setAnalyzing(true);
    setTimeout(() => {
      setResult({
        fitScore: 87,
        confidence: 'high',
        strengths: [
          '10+ years of full-stack development experience exceeds the 5-year requirement',
          'Expert in React, Node.js, and Python - exact match with core requirements',
          'Extensive cloud platform experience with both AWS and GCP certifications',
          'Strong distributed systems background from building platforms for 10M+ users',
          'Proven Kubernetes and Docker expertise in production environments',
          'Direct AI/ML experience building AI-powered features',
        ],
        gaps: [
          'No explicit healthcare domain knowledge mentioned in profile',
        ],
        transferableSkills: [
          'Leadership experience mentoring 15+ engineers',
          'Experience building scalable SaaS platforms (RepCue)',
          'Strong DevOps and infrastructure background',
        ],
        risks: [
          'Currently based in San Francisco, remote work preference not specified',
          'May be overqualified for a Senior role given 10+ years experience',
        ],
      });
      setAnalyzing(false);
    }, 2000);
  };

  const loadExample = () => {
    setJobDescription(mockJobDescription);
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Job-Fit Analyzer</h1>
          <p className="text-muted-foreground">
            See how AI analyzes job descriptions against your profile
          </p>
        </div>

        {/* Input Section */}
        <Card>
          <CardHeader>
            <CardTitle>Job Description</CardTitle>
            <CardDescription>
              Paste a job description to see how well it matches your profile
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Paste the job description here..."
              rows={12}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
            />
            <div className="flex gap-2">
              <Button onClick={handleAnalyze} disabled={!jobDescription.trim() || analyzing} className="gap-2">
                <Sparkles className="h-4 w-4" />
                {analyzing ? 'Analyzing...' : 'Analyze Job Fit'}
              </Button>
              <Button variant="outline" onClick={loadExample}>
                Load Example
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {result && (
          <div className="space-y-6">
            {/* Overall Fit Score */}
            <Card className="border-purple-500/50 bg-gradient-to-br from-purple-500/5 to-blue-500/5">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Overall Fit Score</CardTitle>
                    <CardDescription>Based on your profile and the job requirements</CardDescription>
                  </div>
                  <Badge variant="secondary" className="bg-green-500/10 text-green-400 border-green-500/20">
                    {result.confidence} confidence
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="text-6xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                    {result.fitScore}%
                  </div>
                  <div className="flex-1">
                    <Progress value={result.fitScore} className="h-3" />
                    <p className="text-sm text-muted-foreground mt-2">
                      {result.fitScore >= 80 && 'Excellent match'}
                      {result.fitScore >= 60 && result.fitScore < 80 && 'Good match with some gaps'}
                      {result.fitScore < 60 && 'Partial match'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Strengths */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-400" />
                  <CardTitle>Strengths</CardTitle>
                </div>
                <CardDescription>
                  Why you're a strong match for this role
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {result.strengths.map((strength: string, i: number) => (
                    <li key={i} className="flex gap-3">
                      <TrendingUp className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{strength}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Gaps */}
            {result.gaps.length > 0 && (
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <TrendingDown className="h-5 w-5 text-orange-400" />
                    <CardTitle>Gaps to Address</CardTitle>
                  </div>
                  <CardDescription>
                    Areas where the job requirements don't fully match your profile
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {result.gaps.map((gap: string, i: number) => (
                      <li key={i} className="flex gap-3">
                        <AlertTriangle className="h-5 w-5 text-orange-400 flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{gap}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Transferable Skills */}
            <Card>
              <CardHeader>
                <CardTitle>Transferable Strengths</CardTitle>
                <CardDescription>
                  Relevant skills and experiences that add value
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {result.transferableSkills.map((skill: string, i: number) => (
                    <li key={i} className="flex gap-3">
                      <div className="h-5 w-5 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <div className="h-2 w-2 rounded-full bg-blue-400" />
                      </div>
                      <span className="text-sm">{skill}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Risks */}
            {result.risks.length > 0 && (
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-400" />
                    <CardTitle>Potential Concerns</CardTitle>
                  </div>
                  <CardDescription>
                    Factors to consider or clarify during interviews
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {result.risks.map((risk: string, i: number) => (
                      <li key={i} className="flex gap-3">
                        <AlertTriangle className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{risk}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            <Separator />

            {/* Disclaimer */}
            <Card className="border-muted">
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">
                  <strong>Note:</strong> This AI-generated analysis is based solely on the candidate's submitted materials and is advisory only. It does not constitute a verified employment assessment. Actual job fit should be determined through comprehensive interviews and reference checks.
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
