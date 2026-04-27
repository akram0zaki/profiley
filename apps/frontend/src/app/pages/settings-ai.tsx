import { AppLayout } from '../components/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { Link } from 'react-router';
import { ArrowLeft, Bot, Mic, Volume2 } from 'lucide-react';
import { toast } from 'sonner';

export default function SettingsAIPage() {
  const handleSave = () => {
    toast.success('AI settings saved successfully!');
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link to="/settings">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">AI Configuration</h1>
            <p className="text-muted-foreground">
              Configure AI models and persona behavior
            </p>
          </div>
        </div>

        {/* Chat Model */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-purple-400" />
              <CardTitle>Chat Model</CardTitle>
            </div>
            <CardDescription>
              Select the AI model for your persona's conversations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="chatModel">Preferred Chat Model</Label>
              <Select defaultValue="gpt4">
                <SelectTrigger id="chatModel">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gpt4">
                    <div className="flex items-center justify-between w-full gap-4">
                      <span>GPT-4</span>
                      <Badge variant="secondary" className="text-xs">Recommended</Badge>
                    </div>
                  </SelectItem>
                  <SelectItem value="claude">Claude 3.5 Sonnet</SelectItem>
                  <SelectItem value="gemini">Gemini Pro</SelectItem>
                  <SelectItem value="mistral">Mistral Large</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                GPT-4 provides the best balance of accuracy and response quality
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Persona Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Persona Configuration</CardTitle>
            <CardDescription>
              Customize how your AI represents you
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="personaTone">Persona Tone</Label>
              <Select defaultValue="professional">
                <SelectTrigger id="personaTone">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">Professional & Precise</SelectItem>
                  <SelectItem value="friendly">Friendly & Approachable</SelectItem>
                  <SelectItem value="technical">Technical & Detailed</SelectItem>
                  <SelectItem value="concise">Concise & Direct</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="systemPrompt">Custom System Prompt (Advanced)</Label>
              <Textarea
                id="systemPrompt"
                rows={6}
                placeholder="Add custom instructions for your AI persona..."
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Advanced users can add custom instructions to guide AI behavior
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Speech Models */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Mic className="h-5 w-5 text-blue-400" />
              <CardTitle>Speech-to-Text (STT)</CardTitle>
            </div>
            <CardDescription>
              Model for transcribing recruiter voice input
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sttModel">STT Model</Label>
              <Select defaultValue="whisper">
                <SelectTrigger id="sttModel">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="whisper">OpenAI Whisper</SelectItem>
                  <SelectItem value="gemini-stt">Gemini Speech</SelectItem>
                  <SelectItem value="azure-stt">Azure Speech Services</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Volume2 className="h-5 w-5 text-cyan-400" />
              <CardTitle>Text-to-Speech (TTS)</CardTitle>
            </div>
            <CardDescription>
              Model for generating your AI's voice
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ttsModel">TTS Model</Label>
              <Select defaultValue="elevenlabs">
                <SelectTrigger id="ttsModel">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="elevenlabs">ElevenLabs</SelectItem>
                  <SelectItem value="openai-tts">OpenAI TTS</SelectItem>
                  <SelectItem value="gemini-tts">Gemini Voice</SelectItem>
                  <SelectItem value="azure-tts">Azure Neural TTS</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="voiceStyle">Voice Style</Label>
              <Select defaultValue="professional">
                <SelectTrigger id="voiceStyle">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="warm">Warm & Friendly</SelectItem>
                  <SelectItem value="energetic">Energetic</SelectItem>
                  <SelectItem value="calm">Calm & Measured</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Embedding Model */}
        <Card>
          <CardHeader>
            <CardTitle>Embedding Model</CardTitle>
            <CardDescription>
              Model for generating knowledge base embeddings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="embeddingModel">Embedding Model</Label>
              <Select defaultValue="ada">
                <SelectTrigger id="embeddingModel">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ada">OpenAI text-embedding-3-large</SelectItem>
                  <SelectItem value="voyage">Voyage AI</SelectItem>
                  <SelectItem value="cohere">Cohere Embed v3</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Changes require re-processing all documents
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end gap-2">
          <Link to="/settings">
            <Button variant="outline">Cancel</Button>
          </Link>
          <Button onClick={handleSave}>Save AI Settings</Button>
        </div>
      </div>
    </AppLayout>
  );
}
