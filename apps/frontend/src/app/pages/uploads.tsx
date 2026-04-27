import { AppLayout } from '../components/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { Upload, FileText, File, Check, Clock, AlertCircle, Trash2 } from 'lucide-react';
import { useState } from 'react';

const mockDocuments = [
  {
    id: 1,
    name: 'Akram_Fares_CV_2026.pdf',
    type: 'CV',
    size: '245 KB',
    uploadedAt: '2026-04-20',
    status: 'processed',
    chunks: 28,
  },
  {
    id: 2,
    name: 'Portfolio_Projects.pdf',
    type: 'Portfolio',
    size: '1.2 MB',
    uploadedAt: '2026-04-20',
    status: 'processed',
    chunks: 45,
  },
  {
    id: 3,
    name: 'Work_History.docx',
    type: 'Work History',
    size: '180 KB',
    uploadedAt: '2026-04-19',
    status: 'processed',
    chunks: 32,
  },
  {
    id: 4,
    name: 'Certifications.pdf',
    type: 'Certifications',
    size: '95 KB',
    uploadedAt: '2026-04-18',
    status: 'processed',
    chunks: 12,
  },
  {
    id: 5,
    name: 'Skills_Assessment.txt',
    type: 'Notes',
    size: '8 KB',
    uploadedAt: '2026-04-15',
    status: 'processing',
    chunks: 0,
  },
];

export default function UploadsPage() {
  const [documents, setDocuments] = useState(mockDocuments);
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    // Handle file upload
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const getStatusIcon = (status: string) => {
    if (status === 'processed') return <Check className="h-4 w-4 text-green-400" />;
    if (status === 'processing') return <Clock className="h-4 w-4 text-blue-400" />;
    return <AlertCircle className="h-4 w-4 text-red-400" />;
  };

  const getStatusBadge = (status: string) => {
    if (status === 'processed')
      return (
        <Badge variant="secondary" className="bg-green-500/10 text-green-400 border-green-500/20">
          Processed
        </Badge>
      );
    if (status === 'processing')
      return (
        <Badge variant="secondary" className="bg-blue-500/10 text-blue-400 border-blue-500/20">
          Processing
        </Badge>
      );
    return (
      <Badge variant="secondary" className="bg-red-500/10 text-red-400 border-red-500/20">
        Failed
      </Badge>
    );
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Document Uploads</h1>
          <p className="text-muted-foreground">
            Upload your CV, portfolio, and other professional documents to train your AI persona
          </p>
        </div>

        {/* Upload Zone */}
        <Card
          className={`border-2 border-dashed transition-colors ${
            dragOver
              ? 'border-purple-500 bg-purple-500/5'
              : 'border-border/50 bg-card/50 backdrop-blur'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <CardContent className="py-12">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="h-16 w-16 rounded-full bg-purple-500/10 flex items-center justify-center">
                <Upload className="h-8 w-8 text-purple-400" />
              </div>
              <div className="space-y-2">
                <h3 className="font-medium">Drag and drop files here</h3>
                <p className="text-sm text-muted-foreground">
                  or click to browse your computer
                </p>
              </div>
              <Button className="gap-2">
                <Upload className="h-4 w-4" />
                Choose Files
              </Button>
              <p className="text-xs text-muted-foreground">
                Supported formats: PDF, DOCX, TXT, MD. Max 10MB per file.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Processing Stats */}
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
              <div className="text-2xl font-bold">
                {documents.reduce((sum, doc) => sum + doc.chunks, 0)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Processing Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-400">
                {documents.filter((d) => d.status === 'processed').length}/
                {documents.length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Documents List */}
        <Card>
          <CardHeader>
            <CardTitle>Your Documents</CardTitle>
            <CardDescription>
              All uploaded files are processed and converted into knowledge chunks for your AI
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-start gap-4 p-4 rounded-lg border border-border/50 hover:border-border transition-colors"
                >
                  <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                    {doc.name.endsWith('.pdf') ? (
                      <FileText className="h-5 w-5 text-purple-400" />
                    ) : (
                      <File className="h-5 w-5 text-purple-400" />
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <p className="font-medium">{doc.name}</p>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span>{doc.type}</span>
                          <span>•</span>
                          <span>{doc.size}</span>
                          <span>•</span>
                          <span>Uploaded {doc.uploadedAt}</span>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-4">
                      {getStatusBadge(doc.status)}
                      {doc.status === 'processed' && (
                        <span className="text-sm text-muted-foreground">
                          {doc.chunks} knowledge chunks
                        </span>
                      )}
                      {doc.status === 'processing' && (
                        <div className="flex-1 max-w-xs">
                          <Progress value={65} className="h-1.5" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="border-blue-500/50 bg-blue-500/5">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <AlertCircle className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="space-y-2">
                <h3 className="font-medium">How Document Processing Works</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Your documents are extracted and converted to plain text</li>
                  <li>• Content is broken into semantic chunks for better AI retrieval</li>
                  <li>
                    • Embeddings are generated and stored in a vector database (pgvector)
                  </li>
                  <li>
                    • Your AI persona uses these chunks to answer recruiter questions accurately
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
