import { supabase } from '@/services/supabase-client';
import { format } from 'date-fns';
import { ArrowRight, CheckCircle, Circle, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

interface CallTransition {
  id: string;
  created_at: string;
  from_state: string;
  to_state: string;
  trigger_source: string;
  metadata: any;
}

export function CallTimeline({ callId }: { callId: string }) {
  const [transitions, setTransitions] = useState<CallTransition[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTransitions() {
        if (!callId) return;
        try {
            const { data, error } = await supabase
                .from('call_state_transitions')
                .select('*')
                .eq('call_id', callId)
                .order('created_at', { ascending: true });
            
            if (error) throw error;
            setTransitions(data || []);
        } catch (e) {
            console.error('Failed to load transitions', e);
        } finally {
            setLoading(false);
        }
    }
    loadTransitions();
  }, [callId]);

  if (loading) return <div className="text-gray-400 p-4">Loading timeline...</div>;
  if (transitions.length === 0) return <div className="text-gray-500 p-4">No state transitions recorded for this call.</div>;

  return (
    <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:h-full before:w-0.5 before:-translate-x-px before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
        {transitions.map((t, idx) => (
            <div key={t.id} className="relative flex items-center justify-between gap-x-4">
                 <div className="absolute left-0 flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 border border-slate-700 ring-8 ring-slate-950">
                    {t.to_state === 'completed' ? <CheckCircle className="h-5 w-5 text-emerald-500" /> :
                     t.to_state === 'failed' ? <XCircle className="h-5 w-5 text-red-500" /> :
                     <Circle className="h-4 w-4 text-slate-400" />}
                 </div>
                 <div className="flex-auto rounded-md bg-slate-900 border border-slate-800 p-4 ml-12 shadow-sm">
                    <div className="flex justify-between items-start">
                        <div>
                            <div className="flex items-center gap-2 text-sm font-medium text-slate-200">
                                <span className="uppercase tracking-wider text-xs font-mono text-slate-500">{t.from_state || 'START'}</span>
                                <ArrowRight className="h-3 w-3 text-slate-600" />
                                <span className="uppercase tracking-wider text-xs font-mono text-blue-400">{t.to_state}</span>
                            </div>
                            <p className="mt-1 text-xs text-slate-400">
                                Trigger: <span className="text-slate-300">{t.trigger_source}</span>
                            </p>
                        </div>
                        <time className="flex-none py-0.5 text-xs leading-5 text-slate-500 font-mono">
                            {format(new Date(t.created_at), 'HH:mm:ss.SSS')}
                        </time>
                    </div>
                </div>
            </div>
        ))}
    </div>
  );
}
