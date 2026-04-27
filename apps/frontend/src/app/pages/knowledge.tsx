import { AppLayout } from '../components/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Database, Search, FileText } from 'lucide-react';
import { useState } from 'react';

const mockKnowledgeChunks = [
  {
    id: 1,
    content:
      'Led the development of a distributed AI platform serving 10M+ users with 99.99% uptime. Implemented microservices architecture using Kubernetes and Docker.',
    source: 'Akram_Fares_CV_2026.pdf',
    section: 'Work Experience',
    confidence: 0.95,
  },
  {
    id: 2,
    content:
      'Expert in React, Node.js, Python, and TypeScript. Built multiple full-stack applications with real-time features using WebSockets and Server-Sent Events.',
    source: 'Skills_Assessment.txt',
    section: 'Technical Skills',
    confidence: 0.98,
  },
  {
    id: 3,
    content:
      'Designed and implemented RepCue, a comprehensive healthcare SaaS platform. Features include video consultations, appointment scheduling, and AI-powered symptom checking.',
    source: 'Portfolio_Projects.pdf',
    section: 'Projects',
    confidence: 0.92,
  },
  {
    id: 4,
    content:
      'AWS Certified Solutions Architect - Professional. Google Cloud Professional Cloud Architect. Deep expertise in cloud infrastructure and DevOps practices.',
    source: 'Certifications.pdf',
    section: 'Certifications',
    confidence: 0.97,
  },
  {
    id: 5,
    content:
      'Successfully mentored 15+ junior engineers. Led code reviews and established engineering best practices across the team. Strong believer in documentation and knowledge sharing.',
    source: 'Work_History.docx',
    section: 'Leadership',
    confidence: 0.91,
  },
];

export default function KnowledgePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const filteredChunks = mockKnowledgeChunks.filter(
    (chunk) =>
      chunk.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chunk.section.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Knowledge Base</h1>
          <p className="text-muted-foreground">
            Explore the structured knowledge chunks that power your AI persona
          </p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Chunks</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">342</div>
              <p className="text-xs text-muted-foreground">Across 8 documents</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Confidence</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">94%</div>
              <p className="text-xs text-muted-foreground">Extraction quality</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Categories</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground">Different sections</p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search your knowledge base..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Knowledge Chunks */}
        <Card>
          <CardHeader>
            <CardTitle>Knowledge Chunks</CardTitle>
            <CardDescription>
              Semantic chunks extracted from your documents for AI retrieval
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredChunks.map((chunk) => (
                <div
                  key={chunk.id}
                  className="p-4 rounded-lg border border-border/50 hover:border-border transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                      <FileText className="h-5 w-5 text-blue-400" />
                    </div>
                    <div className="flex-1 space-y-3">
                      <p className="text-sm leading-relaxed">{chunk.content}</p>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {chunk.section}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {chunk.source}
                        </Badge>
                        <Badge
                          variant="secondary"
                          className="text-xs bg-green-500/10 text-green-400 border-green-500/20"
                        >
                          {Math.round(chunk.confidence * 100)}% confidence
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
