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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  Settings,
  Bot,
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { api, ApiError } from '../../lib/api';

type ProviderConfig = {
  id: string;
  capability: string;
  provider: string;
  model_key: string;
  display_name: string | null;
  is_active: boolean;
  is_default: boolean;
};

type Assignment = {
  feature_key: string;
  capability: string;
  provider_config_id: string | null;
  ai_provider_configs?: { provider: string; model_key: string; display_name: string | null } | null;
};

type HealthRow = {
  provider: string;
  capability: string;
  calls: number;
  errorRate: number;
  fallbackRate: number;
  p50: number | null;
  p95: number | null;
  totalTokens: number;
};

const CAPABILITIES = ['chat', 'embeddings', 'moderation', 'stt', 'tts'];

export default function AdminPage() {
  const [configs, setConfigs] = useState<ProviderConfig[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [health, setHealth] = useState<HealthRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [healthLoading, setHealthLoading] = useState(true);

  // Add-model dialog state
  const [addOpen, setAddOpen] = useState(false);
  const [addCapability, setAddCapability] = useState('chat');
  const [addProvider, setAddProvider] = useState('');
  const [addModelKey, setAddModelKey] = useState('');
  const [addDisplayName, setAddDisplayName] = useState('');
  const [addActive, setAddActive] = useState(true);
  const [addDefault, setAddDefault] = useState(false);
  const [adding, setAdding] = useState(false);

  const reloadModels = async () => {
    setLoading(true);
    try {
      const res = await api.adminListModels();
      setConfigs((res.configs ?? []) as ProviderConfig[]);
      setAssignments((res.assignments ?? []) as Assignment[]);
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Failed to load models';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const reloadHealth = async () => {
    setHealthLoading(true);
    try {
      const res = await api.adminProviderHealth(24);
      setHealth((res.summary ?? []) as HealthRow[]);
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Failed to load health';
      toast.error(msg);
    } finally {
      setHealthLoading(false);
    }
  };

  useEffect(() => {
    void reloadModels();
    void reloadHealth();
  }, []);

  const handleToggle = async (id: string, field: 'isActive' | 'isDefault', value: boolean) => {
    try {
      await api.adminToggleModel({ id, [field]: value });
      toast.success('Model updated');
      await reloadModels();
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Update failed';
      toast.error(msg);
    }
  };

  const handleAdd = async () => {
    if (!addProvider.trim() || !addModelKey.trim()) {
      toast.error('Provider and model key required');
      return;
    }
    setAdding(true);
    try {
      await api.adminCreateModel({
        capability: addCapability,
        provider: addProvider.trim(),
        modelKey: addModelKey.trim(),
        displayName: addDisplayName.trim() || undefined,
        isActive: addActive,
        isDefault: addDefault,
      });
      toast.success('Model added');
      setAddOpen(false);
      setAddProvider('');
      setAddModelKey('');
      setAddDisplayName('');
      setAddActive(true);
      setAddDefault(false);
      await reloadModels();
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Create failed';
      toast.error(msg);
    } finally {
      setAdding(false);
    }
  };

  const handleSetFeatureModel = async (
    featureKey: string,
    capability: string,
    providerConfigId: string,
  ) => {
    try {
      await api.adminSetFeatureModel({ featureKey, capability, providerConfigId });
      toast.success('Feature assignment saved');
      await reloadModels();
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Update failed';
      toast.error(msg);
    }
  };

  const activeCount = configs.filter((c) => c.is_active).length;
  const overallErrorRate = health.length
    ? (health.reduce((s, h) => s + h.errorRate, 0) / health.length) * 100
    : 0;
  const avgP50 = health.length
    ? Math.round(
        health.reduce((s, h) => s + (h.p50 ?? 0), 0) / Math.max(1, health.filter((h) => h.p50 !== null).length),
      )
    : 0;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Admin Panel</h1>
            <p className="text-muted-foreground">Manage AI models and platform configuration</p>
          </div>
          <Badge variant="secondary" className="gap-1">
            <Settings className="h-3 w-3" />
            Admin Access
          </Badge>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Models</CardTitle>
              <Bot className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeCount}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg p50 Latency</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{avgP50}ms</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Error Rate (24h)</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overallErrorRate.toFixed(1)}%</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Health Status</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-400">
                {overallErrorRate < 5 ? 'Healthy' : 'Degraded'}
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="providers">
          <TabsList>
            <TabsTrigger value="providers">Model Registry</TabsTrigger>
            <TabsTrigger value="features">Feature Assignments</TabsTrigger>
            <TabsTrigger value="health">Provider Health</TabsTrigger>
          </TabsList>

          <TabsContent value="providers" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Model Registry</CardTitle>
                    <CardDescription>
                      Configure available AI models for each capability
                    </CardDescription>
                  </div>
                  <Dialog open={addOpen} onOpenChange={setAddOpen}>
                    <DialogTrigger asChild>
                      <Button>Add New Model</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Provider Model</DialogTitle>
                        <DialogDescription>
                          Register a new model in <code>ai_provider_configs</code>.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Label>Capability</Label>
                          <Select value={addCapability} onValueChange={setAddCapability}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {CAPABILITIES.map((c) => (
                                <SelectItem key={c} value={c}>
                                  {c}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Provider</Label>
                          <Input
                            placeholder="e.g. openai, gemini, mistral"
                            value={addProvider}
                            onChange={(e) => setAddProvider(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Model Key</Label>
                          <Input
                            placeholder="e.g. gpt-4o-mini"
                            value={addModelKey}
                            onChange={(e) => setAddModelKey(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Display Name (optional)</Label>
                          <Input
                            value={addDisplayName}
                            onChange={(e) => setAddDisplayName(e.target.value)}
                          />
                        </div>
                        <div className="flex gap-4 pt-2">
                          <label className="inline-flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={addActive}
                              onChange={(e) => setAddActive(e.target.checked)}
                            />
                            Active
                          </label>
                          <label className="inline-flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={addDefault}
                              onChange={(e) => setAddDefault(e.target.checked)}
                            />
                            Default
                          </label>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setAddOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={() => void handleAdd()} disabled={adding} className="gap-2">
                          {adding && <Loader2 className="h-4 w-4 animate-spin" />}
                          Add Model
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-12 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading…
                  </div>
                ) : configs.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-8 text-center">No models registered.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Capability</TableHead>
                        <TableHead>Provider</TableHead>
                        <TableHead>Model</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Default</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {configs.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell className="font-medium capitalize">{p.capability}</TableCell>
                          <TableCell>{p.provider}</TableCell>
                          <TableCell className="font-mono text-sm">
                            {p.display_name ? `${p.display_name} (${p.model_key})` : p.model_key}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="secondary"
                              className={
                                p.is_active
                                  ? 'bg-green-500/10 text-green-400 border-green-500/20'
                                  : 'bg-gray-500/10 text-gray-400 border-gray-500/20'
                              }
                            >
                              {p.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell>{p.is_default && <Badge variant="secondary">Default</Badge>}</TableCell>
                          <TableCell className="text-right space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggle(p.id, 'isActive', !p.is_active)}
                            >
                              {p.is_active ? 'Disable' : 'Enable'}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={p.is_default}
                              onClick={() => handleToggle(p.id, 'isDefault', true)}
                            >
                              Make Default
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="features" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Feature Model Assignments</CardTitle>
                <CardDescription>Assign specific models to each platform feature</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {loading ? (
                  <div className="flex items-center justify-center py-8 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading…
                  </div>
                ) : assignments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No assignments yet.</p>
                ) : (
                  assignments.map((a) => (
                    <div
                      key={`${a.feature_key}-${a.capability}`}
                      className="flex items-center justify-between p-4 rounded-lg border"
                    >
                      <div className="space-y-1">
                        <p className="font-medium">{a.feature_key}</p>
                        <p className="text-sm text-muted-foreground capitalize">
                          Capability: {a.capability}
                        </p>
                      </div>
                      <Select
                        value={a.provider_config_id ?? ''}
                        onValueChange={(v) => void handleSetFeatureModel(a.feature_key, a.capability, v)}
                      >
                        <SelectTrigger className="w-[260px]">
                          <SelectValue placeholder="(use default)" />
                        </SelectTrigger>
                        <SelectContent>
                          {configs
                            .filter((c) => c.capability === a.capability && c.is_active)
                            .map((c) => (
                              <SelectItem key={c.id} value={c.id}>
                                {c.provider} — {c.display_name ?? c.model_key}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="health" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Provider Health Dashboard</CardTitle>
                    <CardDescription>Last 24 hours of AI provider call metrics</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => void reloadHealth()}>
                    Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {healthLoading ? (
                  <div className="flex items-center justify-center py-12 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading…
                  </div>
                ) : health.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-8 text-center">
                    No provider call logs in the last 24h.
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Provider</TableHead>
                        <TableHead>Capability</TableHead>
                        <TableHead>Calls</TableHead>
                        <TableHead>p50</TableHead>
                        <TableHead>p95</TableHead>
                        <TableHead>Error Rate</TableHead>
                        <TableHead>Fallback Rate</TableHead>
                        <TableHead>Tokens</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {health.map((h) => (
                        <TableRow key={`${h.provider}-${h.capability}`}>
                          <TableCell className="font-medium">{h.provider}</TableCell>
                          <TableCell className="capitalize">{h.capability}</TableCell>
                          <TableCell>{h.calls}</TableCell>
                          <TableCell>{h.p50 ?? '—'}ms</TableCell>
                          <TableCell>{h.p95 ?? '—'}ms</TableCell>
                          <TableCell>
                            <span className={h.errorRate < 0.05 ? 'text-green-400' : 'text-orange-400'}>
                              {(h.errorRate * 100).toFixed(1)}%
                            </span>
                          </TableCell>
                          <TableCell>{(h.fallbackRate * 100).toFixed(1)}%</TableCell>
                          <TableCell>{h.totalTokens.toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
