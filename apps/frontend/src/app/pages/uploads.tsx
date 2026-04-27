import { AppLayout } from '../components/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { Upload, FileText, File as FileIcon, Check, Clock, AlertCircle, Trash2, Loader2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { api, ApiError } from '../../lib/api';
import { supabase } from '../../lib/supabase';

type DocRow = {
  id: string;
  original_filename: string;
  mime_type: string | null;
  file_size: number | null;
  processing_status: string;
  extracted_text_status: string;
  retry_count: number;
  last_error: string | null;
  created_at: string;
  updated_at: string;
};

const ACCEPTED_MIMES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'text/markdown',
]);

const MAX_BYTES = 10 * 1024 * 1024;

function formatBytes(n: number | null): string {
  if (!n) return '—';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString();
  } catch {
    return iso.slice(0, 10);
  }
}

async function sha256Hex(buf: ArrayBuffer): Promise<string> {
  const hash = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export default function UploadsPage() {
  const [documents, setDocuments] = useState<DocRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [chunkCounts, setChunkCounts] = useState<Record<string, number>>({});
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const reload = async () => {
    setLoading(true);
    try {
      const res = await api.listUserDocuments();
      const docs = (res.documents ?? []) as DocRow[];
      setDocuments(docs);
      // Fetch chunk counts (RLS lets owner read their own).
      const ids = docs.map((d) => d.id);
      if (ids.length) {
        const { data, error } = await supabase
          .from('knowledge_chunks')
          .select('document_id')
          .in('document_id', ids)
          .is('deleted_at', null);
        if (!error && data) {
          const counts: Record<string, number> = {};
          for (const row of data as { document_id: string | null }[]) {
            if (!row.document_id) continue;
            counts[row.document_id] = (counts[row.document_id] ?? 0) + 1;
          }
          setChunkCounts(counts);
        }
      } else {
        setChunkCounts({});
      }
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Failed to load documents';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void reload();
    // Poll while there are pending/running docs.
    const interval = setInterval(() => {
      setDocuments((curr) => {
        const hasInFlight = curr.some((d) =>
          ['pending', 'running'].includes(d.processing_status),
        );
        if (hasInFlight) void reload();
        return curr;
      });
    }, 5000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const uploadFile = async (file: File) => {
    if (file.size > MAX_BYTES) {
      toast.error(`${file.name}: too large (max 10MB)`);
      return;
    }
    if (file.type && !ACCEPTED_MIMES.has(file.type)) {
      toast.error(`${file.name}: unsupported type (${file.type})`);
      return;
    }
    setUploading(file.name);
    try {
      const created = await api.createUploadUrl({
        filename: file.name,
        mimeType: file.type || 'application/octet-stream',
        bucket: 'user_uploads',
      });
      const { error: upErr } = await supabase.storage
        .from(created.bucket)
        .uploadToSignedUrl(created.path, created.token, file, {
          contentType: file.type,
          upsert: true,
        });
      if (upErr) throw upErr;
      const buf = await file.arrayBuffer();
      const checksum = await sha256Hex(buf);
      await api.finalizeUpload({
        bucket: created.bucket,
        path: created.path,
        originalFilename: file.name,
        mimeType: file.type,
        fileSize: file.size,
        checksumSha256: checksum,
      });
      toast.success(`${file.name} uploaded — processing in background`);
      await reload();
    } catch (e: any) {
      const msg = e instanceof ApiError ? e.message : (e?.message ?? 'Upload failed');
      toast.error(`${file.name}: ${msg}`);
    } finally {
      setUploading(null);
    }
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    for (const f of Array.from(files)) {
      // sequential upload to keep things simple
      // eslint-disable-next-line no-await-in-loop
      await uploadFile(f);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    void handleFiles(e.dataTransfer.files);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this document and its chunks?')) return;
    try {
      await api.deleteDocument({ documentId: id });
      toast.success('Document deleted');
      setDocuments((curr) => curr.filter((d) => d.id !== id));
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Delete failed';
      toast.error(msg);
    }
  };

  const getStatusBadge = (s: string) => {
    if (s === 'completed')
      return (
        <Badge variant="secondary" className="bg-green-500/10 text-green-400 border-green-500/20">
          Processed
        </Badge>
      );
    if (s === 'pending' || s === 'running')
      return (
        <Badge variant="secondary" className="bg-blue-500/10 text-blue-400 border-blue-500/20">
          {s === 'running' ? 'Processing' : 'Queued'}
        </Badge>
      );
    if (s === 'quarantined')
      return (
        <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20">
          Quarantined
        </Badge>
      );
    return (
      <Badge variant="secondary" className="bg-red-500/10 text-red-400 border-red-500/20">
        Failed
      </Badge>
    );
  };

  const getStatusIcon = (s: string) => {
    if (s === 'completed') return <Check className="h-4 w-4 text-green-400" />;
    if (s === 'pending' || s === 'running') return <Clock className="h-4 w-4 text-blue-400" />;
    return <AlertCircle className="h-4 w-4 text-red-400" />;
  };

  const totalChunks = Object.values(chunkCounts).reduce((a, b) => a + b, 0);
  const processedCount = documents.filter((d) => d.processing_status === 'completed').length;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Document Uploads</h1>
          <p className="text-muted-foreground">
            Upload your CV, portfolio, and other professional documents to train your AI persona
          </p>
        </div>

        <Card
          className={`border-2 border-dashed transition-colors ${
            dragOver
              ? 'border-purple-500 bg-purple-500/5'
              : 'border-border/50 bg-card/50 backdrop-blur'
          }`}
          onDrop={handleDrop}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
        >
          <CardContent className="py-12">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="h-16 w-16 rounded-full bg-purple-500/10 flex items-center justify-center">
                <Upload className="h-8 w-8 text-purple-400" />
              </div>
              <div className="space-y-2">
                <h3 className="font-medium">Drag and drop files here</h3>
                <p className="text-sm text-muted-foreground">or click to browse your computer</p>
              </div>
              <input
                ref={inputRef}
                type="file"
                accept=".pdf,.docx,.txt,.md,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/markdown"
                multiple
                className="hidden"
                onChange={(e) => {
                  void handleFiles(e.target.files);
                  e.target.value = '';
                }}
              />
              <Button
                className="gap-2"
                disabled={Boolean(uploading)}
                onClick={() => inputRef.current?.click()}
              >
                {uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                {uploading ? `Uploading ${uploading}…` : 'Choose Files'}
              </Button>
              <p className="text-xs text-muted-foreground">
                Supported: PDF, DOCX, TXT, MD. Max 10MB per file.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{documents.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Knowledge Chunks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalChunks}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Processing Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-400">
                {processedCount}/{documents.length}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Your Documents</CardTitle>
            <CardDescription>
              All uploaded files are processed and converted into knowledge chunks for your AI
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading…
              </div>
            ) : documents.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                No documents yet. Upload your CV to get started.
              </p>
            ) : (
              <div className="space-y-4">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-start gap-4 p-4 rounded-lg border border-border/50 hover:border-border transition-colors"
                  >
                    <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                      {doc.original_filename.toLowerCase().endsWith('.pdf') ? (
                        <FileText className="h-5 w-5 text-purple-400" />
                      ) : (
                        <FileIcon className="h-5 w-5 text-purple-400" />
                      )}
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <p className="font-medium">{doc.original_filename}</p>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <span>{doc.mime_type ?? 'unknown'}</span>
                            <span>•</span>
                            <span>{formatBytes(doc.file_size)}</span>
                            <span>•</span>
                            <span>Uploaded {formatDate(doc.created_at)}</span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => handleDelete(doc.id)}
                          aria-label="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex items-center gap-4">
                        {getStatusIcon(doc.processing_status)}
                        {getStatusBadge(doc.processing_status)}
                        {doc.processing_status === 'completed' && (
                          <span className="text-sm text-muted-foreground">
                            {chunkCounts[doc.id] ?? 0} knowledge chunks
                          </span>
                        )}
                        {(doc.processing_status === 'pending' ||
                          doc.processing_status === 'running') && (
                          <div className="flex-1 max-w-xs">
                            <Progress value={doc.processing_status === 'running' ? 65 : 25} className="h-1.5" />
                          </div>
                        )}
                        {doc.processing_status === 'failed' && doc.last_error && (
                          <span className="text-xs text-red-400 truncate max-w-md">
                            {doc.last_error}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-blue-500/50 bg-blue-500/5">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <AlertCircle className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="space-y-2">
                <h3 className="font-medium">How Document Processing Works</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Documents are extracted and converted to plain text</li>
                  <li>• Content is chunked semantically for better AI retrieval</li>
                  <li>• Embeddings are generated and stored in pgvector</li>
                  <li>• Your AI persona uses these chunks to answer recruiter questions accurately</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
