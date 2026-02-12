import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, AlertTriangle, FileText, Lock, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function GovernanceDashboard() {
  const navigate = useNavigate();

  const cards = [
    {
      title: 'Audit Logs',
      description: 'Review immutable system logs and actor history.',
      icon: FileText,
      action: () => navigate('/audit-logs'),
      color: 'text-blue-400',
    },
    {
      title: 'Workflow Hooks',
      description: 'Monitor post-call webhook triggers and failures.',
      icon: Activity,
      action: () => navigate('/governance/hooks'),
      color: 'text-purple-400',
    },
    {
      title: 'Access Control',
      description: 'Manage roles, permissions, and emergency access.',
      icon: Lock,
      action: () => navigate('/settings/team'),
      color: 'text-emerald-400',
    },
    {
      title: 'Security Policies',
      description: 'Configure shadow mode, kill switches, and compliance.',
      icon: Shield,
      action: () => navigate('/settings'),
      color: 'text-amber-400',
    },
  ];

  return (
    <div className="min-h-screen bg-black p-6">
       <div className="mx-auto max-w-7xl space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <Shield className="h-8 w-8 text-emerald-500" />
                Governance & Compliance
            </h1>
            <p className="text-gray-400 mt-2">Enterprise control plane for visibility and security.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cards.map((card) => (
                <Card key={card.title} className="bg-gray-900 border-gray-800 hover:bg-gray-800/80 transition-colors cursor-pointer" onClick={card.action}>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3 text-white">
                            <card.icon className={`h-6 w-6 ${card.color}`} />
                            {card.title}
                        </CardTitle>
                        <CardDescription>{card.description}</CardDescription>
                    </CardHeader>
                </Card>
            ))}
          </div>

          <Card className="bg-slate-900 border-red-900/50">
             <CardHeader>
                <CardTitle className="text-red-400 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Emergency Controls
                </CardTitle>
             </CardHeader>
             <CardContent>
                <p className="text-gray-400 mb-4">
                    In the event of a security breach or runaway AI, use the Kill Switch to immediately halt all outbound telephony.
                </p>
                <Button variant="destructive" className="w-full sm:w-auto" onClick={() => navigate('/settings')}>
                    Manage Kill Switches
                </Button>
             </CardContent>
          </Card>
       </div>
    </div>
  );
}
