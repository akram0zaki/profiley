import { AppLayout } from '../components/app-layout';
import { Card, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { ChatInterface } from '../components/chat-interface';
import { AlertCircle } from 'lucide-react';

export default function ChatPreviewPage() {
  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Chat Preview</h1>
          <p className="text-muted-foreground">
            Test your AI persona and see how recruiters will interact with you
          </p>
        </div>

        {/* Info Card */}
        <Card className="border-blue-500/50 bg-blue-500/5">
          <CardHeader className="flex flex-row items-start gap-4">
            <AlertCircle className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="space-y-1">
              <CardTitle className="text-base">Testing Your AI Persona</CardTitle>
              <CardDescription>
                This is how your AI will respond to recruiter questions. The AI only answers using information from your uploaded documents and profile data. Try asking about your experience, skills, or specific projects.
              </CardDescription>
            </div>
          </CardHeader>
        </Card>

        {/* Chat Card */}
        <Card className="h-[600px] flex flex-col">
          <ChatInterface
            ownerMode
            userName="You (Testing)"
            botName="Your AI Persona"
            placeholder="Test a question (e.g., 'What is your experience with AI?')"
          />
        </Card>
      </div>
    </AppLayout>
  );
}
