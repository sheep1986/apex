import { Button } from '@/components/ui/button';
import {
  Loader2,
  Mic,
  MicOff,
  Phone,
  PhoneOff,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

interface TranscriptEntry {
  role: 'user' | 'assistant';
  text: string;
  timestamp: number;
}

interface WebCallWidgetProps {
  assistantId: string;
  assistantName: string;
  onClose: () => void;
}

export default function WebCallWidget({ assistantId, assistantName, onClose }: WebCallWidgetProps) {
  const [status, setStatus] = useState<'connecting' | 'active' | 'ended' | 'error'>('connecting');
  const [isMuted, setIsMuted] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [errorMessage, setErrorMessage] = useState('');
  const vapiRef = useRef<any>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  // Format elapsed time
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Start the call
  const startCall = useCallback(async () => {
    try {
      // Dynamically import to avoid SSR issues
      const { default: Vapi } = await import('@vapi-ai/web');

      // Get the public key from our credentials endpoint
      const tokenRes = await fetch('/api/voice/credentials');
      const tokenData = await tokenRes.json();

      if (!tokenData.publicKey) {
        setStatus('error');
        setErrorMessage('No public key available for web calls. Contact your administrator.');
        return;
      }

      const vapi = new Vapi(tokenData.publicKey);
      vapiRef.current = vapi;

      vapi.on('call-start', () => {
        setStatus('active');
        // Start timer
        timerRef.current = setInterval(() => {
          setElapsed(prev => prev + 1);
        }, 1000);
      });

      vapi.on('call-end', () => {
        setStatus('ended');
        if (timerRef.current) clearInterval(timerRef.current);
      });

      vapi.on('message', (msg: any) => {
        if (msg.type === 'transcript' && msg.transcriptType === 'final') {
          setTranscript(prev => [...prev, {
            role: msg.role === 'user' ? 'user' : 'assistant',
            text: msg.transcript,
            timestamp: Date.now(),
          }]);
        }
      });

      vapi.on('error', (err: any) => {
        console.error('Web call error:', err);
        setStatus('error');
        setErrorMessage(err?.message || 'Call failed. Please try again.');
        if (timerRef.current) clearInterval(timerRef.current);
      });

      // Start the call
      await vapi.start(assistantId);
    } catch (err: any) {
      console.error('Failed to start web call:', err);
      setStatus('error');
      setErrorMessage(err?.message || 'Failed to initialize call. Check microphone permissions.');
    }
  }, [assistantId]);

  useEffect(() => {
    startCall();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      vapiRef.current?.stop();
    };
  }, [startCall]);

  // Auto-scroll transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);

  const handleEndCall = () => {
    vapiRef.current?.stop();
    setStatus('ended');
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const handleToggleMute = () => {
    if (vapiRef.current) {
      vapiRef.current.setMuted(!isMuted);
      setIsMuted(!isMuted);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 w-80 rounded-2xl border border-gray-700 bg-gray-950 shadow-2xl shadow-black/50">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-800 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className={`h-2.5 w-2.5 rounded-full ${
            status === 'active' ? 'animate-pulse bg-emerald-500' :
            status === 'connecting' ? 'animate-pulse bg-yellow-500' :
            status === 'error' ? 'bg-red-500' :
            'bg-gray-500'
          }`} />
          <span className="text-sm font-medium text-white">
            {status === 'connecting' ? 'Connecting...' :
             status === 'active' ? 'Call Active' :
             status === 'error' ? 'Error' :
             'Call Ended'}
          </span>
        </div>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-300 transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Call Info */}
      <div className="px-4 py-3 text-center">
        <p className="text-xs text-gray-500">Testing Assistant</p>
        <p className="text-sm font-medium text-white">{assistantName}</p>
        <p className="mt-1 font-mono text-2xl font-bold text-white">{formatTime(elapsed)}</p>
      </div>

      {/* Error Message */}
      {status === 'error' && (
        <div className="mx-4 mb-3 rounded-lg border border-red-900/50 bg-red-950/30 p-2 text-xs text-red-400">
          {errorMessage}
        </div>
      )}

      {/* Transcript */}
      {transcript.length > 0 && (
        <div className="mx-4 mb-3 max-h-40 overflow-y-auto rounded-lg border border-gray-800 bg-black/50 p-2 space-y-1.5">
          {transcript.map((entry, i) => (
            <div key={i}>
              <span className={`text-[10px] font-semibold ${
                entry.role === 'user' ? 'text-blue-400' : 'text-emerald-400'
              }`}>
                {entry.role === 'user' ? 'You' : 'AI'}
              </span>
              <p className="text-xs text-gray-300 leading-relaxed">{entry.text}</p>
            </div>
          ))}
          <div ref={transcriptEndRef} />
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center justify-center gap-3 border-t border-gray-800 px-4 py-4">
        {status === 'connecting' && (
          <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
        )}

        {status === 'active' && (
          <>
            <Button
              size="sm"
              variant="outline"
              onClick={handleToggleMute}
              className={`rounded-full h-10 w-10 p-0 ${
                isMuted
                  ? 'border-red-500/50 bg-red-500/10 text-red-400 hover:bg-red-500/20'
                  : 'border-gray-700 bg-gray-900 text-gray-300 hover:bg-gray-800'
              }`}
            >
              {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>
            <Button
              size="sm"
              onClick={handleEndCall}
              className="rounded-full h-12 w-12 p-0 bg-red-600 hover:bg-red-700 text-white"
            >
              <PhoneOff className="h-5 w-5" />
            </Button>
          </>
        )}

        {status === 'ended' && (
          <p className="text-sm text-gray-500">Call ended — {formatTime(elapsed)}</p>
        )}

        {status === 'error' && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => { setStatus('connecting'); setElapsed(0); setTranscript([]); startCall(); }}
            className="border-gray-700 text-gray-300"
          >
            <Phone className="mr-2 h-4 w-4" /> Retry
          </Button>
        )}
      </div>
    </div>
  );
}
