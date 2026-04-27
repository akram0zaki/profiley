import { AppLayout } from '../components/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Settings, Bot, TrendingUp, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { toast } from 'sonner';

const mockProviders = [
  { id: 1, capability: 'chat', provider: 'OpenAI', model: 'gpt-4', isDefault: true, isActive: true, latency: 1200, errorRate: 0.2 },
  { id: 2, capability: 'chat', provider: 'Anthropic', model: 'claude-3.5-sonnet', isDefault: false, isActive: true, latency: 1400, errorRate: 0.1 },
  { id: 3, capability: 'embeddings', provider: 'OpenAI', model: 'text-embedding-3-large', isDefault: true, isActive: true, latency: 400, errorRate: 0.1 },
  { id: 4, capability: 'stt', provider: 'OpenAI', model: 'whisper-1', isDefault: true, isActive: true, latency: 2100, errorRate: 0.5 },
  { id: 5, capability: 'tts', provider: 'ElevenLabs', model: 'eleven_multilingual_v2', isDefault: true, isActive: true, latency: 1800, errorRate: 0.3 },
];

const mockFeatureAssignments = [
  { feature: 'persona_chat', capability: 'chat', model: 'gpt-4' },
  { feature: 'job_fit_analysis', capability: 'chat', model: 'gpt-4' },
  { feature: 'document_processing', capability: 'embeddings', model: 'text-embedding-3-large' },
];

export default function AdminPage() {
  const handleSaveConfig = () => {
    toast.success('Model configuration updated successfully!');
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Admin Panel</h1>
            <p className="text-muted-foreground">
              Manage AI models and platform configuration
            </p>
          </div>
          <Badge variant="secondary" className="gap-1">
            <Settings className="h-3 w-3" />
            Admin Access
          </Badge>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Models</CardTitle>
              <Bot className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockProviders.filter(p => p.isActive).length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Latency</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round(mockProviders.reduce((sum, p) => sum + p.latency, 0) / mockProviders.length)}ms
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(mockProviders.reduce((sum, p) => sum + p.errorRate, 0) / mockProviders.length).toFixed(1)}%
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Health Status</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-400">Healthy</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="providers">
          <TabsList>
            <TabsTrigger value="providers">Model Registry</TabsTrigger>
            <TabsTrigger value="features">Feature Assignments</TabsTrigger>
            <TabsTrigger value="health">Provider Health</TabsTrigger>
          </TabsList>

          {/* Model Registry */}
          <TabsContent value="providers" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Model Registry</CardTitle>
                <CardDescription>
                  Configure available AI models for each capability
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Capability</TableHead>
                      <TableHead>Provider</TableHead>
                      <TableHead>Model</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Default</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockProviders.map((provider) => (
                      <TableRow key={provider.id}>
                        <TableCell className="font-medium capitalize">{provider.capability}</TableCell>
                        <TableCell>{provider.provider}</TableCell>
                        <TableCell className="font-mono text-sm">{provider.model}</TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={
                              provider.isActive
                                ? 'bg-green-500/10 text-green-400 border-green-500/20'
                                : 'bg-gray-500/10 text-gray-400 border-gray-500/20'
                            }
                          >
                            {provider.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {provider.isDefault && (
                            <Badge variant="secondary">Default</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">
                            Edit
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="flex justify-end mt-4">
                  <Button>Add New Model</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Feature Assignments */}
          <TabsContent value="features" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Feature Model Assignments</CardTitle>
                <CardDescription>
                  Assign specific models to each platform feature
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {mockFeatureAssignments.map((assignment, i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-lg border">
                    <div className="space-y-1">
                      <p className="font-medium capitalize">{assignment.feature.replace('_', ' ')}</p>
                      <p className="text-sm text-muted-foreground">
                        Capability: {assignment.capability}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <Select defaultValue={assignment.model}>
                        <SelectTrigger className="w-[200px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {mockProviders
                            .filter((p) => p.capability === assignment.capability)
                            .map((p) => (
                              <SelectItem key={p.id} value={p.model}>
                                {p.provider} - {p.model}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))}
                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline">Reset to Defaults</Button>
                  <Button onClick={handleSaveConfig}>Save Configuration</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Provider Health */}
          <TabsContent value="health" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Provider Health Dashboard</CardTitle>
                <CardDescription>
                  Monitor performance and reliability of AI providers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Provider</TableHead>
                      <TableHead>Model</TableHead>
                      <TableHead>Avg Latency</TableHead>
                      <TableHead>Error Rate</TableHead>
                      <TableHead>Last Success</TableHead>
                      <TableHead>Health</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockProviders.map((provider) => (
                      <TableRow key={provider.id}>
                        <TableCell className="font-medium">{provider.provider}</TableCell>
                        <TableCell className="font-mono text-sm">{provider.model}</TableCell>
                        <TableCell>{provider.latency}ms</TableCell>
                        <TableCell>
                          <span className={provider.errorRate < 1 ? 'text-green-400' : 'text-orange-400'}>
                            {provider.errorRate}%
                          </span>
                        </TableCell>
                        <TableCell className="text-muted-foreground">2 minutes ago</TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={
                              provider.errorRate < 1
                                ? 'bg-green-500/10 text-green-400 border-green-500/20'
                                : 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                            }
                          >
                            {provider.errorRate < 1 ? 'Healthy' : 'Degraded'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
