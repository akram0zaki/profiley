import { AppLayout } from '../components/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Database, Search, FileText, Loader2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useCurrentProfile } from '../../lib/profile';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';

type Chunk = {
  id: string;
  content: string;
  source_kind: string | null;
  chunk_index: number | null;
  metadata: Record<string, unknown> | null;
  document_id: string | null;
  uploaded_documents: { original_filename: string | null } | null;
};

export default function KnowledgePage() {
  const { appUser, loading: authLoading } = useCurrentProfile();
  const [chunks, setChunks] = useState<Chunk[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!appUser) return;
    let cancelled = false;
    setLoading(true);
    void (async () => {
      const { data, error } = await supabase
        .from('knowledge_chunks')
        .select(
          'id, content, source_kind, chunk_index, metadata, document_id, uploaded_documents(original_filename)',
        )
        .eq('user_id', appUser.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(500);
      if (cancelled) return;
      if (error) {
        toast.error(error.message ?? 'Failed to load knowledge');
        setChunks([]);
      } else {
        setChunks((data ?? []) as unknown as Chunk[]);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [appUser]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return chunks;
    return chunks.filter(
      (c) =>
        c.content.toLowerCase().includes(q) ||
        (c.uploaded_documents?.original_filename ?? '').toLowerCase().includes(q),
    );
  }, [chunks, searchQuery]);

  const docCount = useMemo(
    () => new Set(chunks.map((c) => c.document_id).filter(Boolean)).size,
    [chunks],
  );

  const sectionCount = useMemo(() => {
    const sections = new Set<string>();
    for (const c of chunks) {
      const s = (c.metadata as any)?.section ?? c.source_kind ?? 'general';
      sections.add(String(s));
    }
    return sections.size;
  }, [chunks]);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Knowledge Base</h1>
          <p className="text-muted-foreground">
            Explore the structured knowledge chunks that power your AI persona
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Chunks</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{chunks.length}</div>
              <p className="text-xs text-muted-foreground">Across {docCount} documents</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Source Documents</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{docCount}</div>
              <p className="text-xs text-muted-foreground">Uploaded files</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sections</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{sectionCount}</div>
              <p className="text-xs text-muted-foreground">Different categories</p>
            </CardContent>
          </Card>
        </div>

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

        <Card>
          <CardHeader>
            <CardTitle>Knowledge Chunks</CardTitle>
            <CardDescription>
              Semantic chunks extracted from your documents for AI retrieval
            </CardDescription>
          </CardHeader>
          <CardContent>
            {authLoading || loading ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading…
              </div>
            ) : filtered.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                {chunks.length === 0
                  ? 'No knowledge chunks yet. Upload documents to populate your knowledge base.'
                  : 'No chunks match your search.'}
              </p>
            ) : (
              <div className="space-y-4">
                {filtered.map((chunk) => {
                  const section = (chunk.metadata as any)?.section ?? chunk.source_kind ?? 'general';
                  const filename = chunk.uploaded_documents?.original_filename ?? 'Unknown source';
                  return (
                    <div
                      key={chunk.id}
                      className="p-4 rounded-lg border border-border/50 hover:border-border transition-colors"
                    >
                      <div className="flex items-start gap-4">
                        <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                          <FileText className="h-5 w-5 text-blue-400" />
                        </div>
                        <div className="flex-1 space-y-3">
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">
                            {chunk.content}
                          </p>
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="secondary" className="text-xs">
                              {String(section)}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {filename}
                            </Badge>
                            {typeof chunk.chunk_index === 'number' && (
                              <Badge variant="outline" className="text-xs">
                                #{chunk.chunk_index}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
