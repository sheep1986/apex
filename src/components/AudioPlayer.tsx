import { Button } from '@/components/ui/button';
import { AlertCircle, Download, Pause, Play, Volume2 } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

interface AudioPlayerProps {
  url: string;
  duration?: number;
  onTimeUpdate?: (currentTime: number) => void;
  className?: string;
  showSpeedControl?: boolean;
  showDownload?: boolean;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  url,
  duration = 0,
  onTimeUpdate,
  className = '',
  showSpeedControl = true,
  showDownload = true
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioDuration, setAudioDuration] = useState(duration);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadStart = () => {
      setIsLoading(true);
      setError(null);
    };

    const handleCanPlay = () => {
      setIsLoading(false);
    };

    const handleError = (e: Event) => {
      setIsLoading(false);
      const audioError = e.target as HTMLAudioElement;
      console.error('Audio error:', audioError.error);
      
      // Provide user-friendly error messages
      if (url.includes('vapi.ai')) {
        setError('Unable to load recording. The URL may have expired or requires authentication.');
      } else {
        setError('Unable to load audio file. Please check the URL.');
      }
      setIsPlaying(false);
    };

    const handleTimeUpdate = () => {
      const time = audio.currentTime;
      setCurrentTime(Math.floor(time));
      onTimeUpdate?.(time);
    };

    const handleLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        setAudioDuration(Math.floor(audio.duration));
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('error', handleError);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    // Preload the audio
    audio.load();

    return () => {
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [url, onTimeUpdate]);

  const handlePlayPause = async () => {
    if (!audioRef.current || error) return;

    try {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        // For Apex URLs, we might need to handle CORS differently
        if (url.includes('vapi.ai')) {
          // Try to play with crossOrigin set
          audioRef.current.crossOrigin = 'anonymous';
        }
        
        await audioRef.current.play();
        setIsPlaying(true);
      }
    } catch (err) {
      console.error('Playback error:', err);
      setError('Unable to play audio. The file may be corrupted or access is restricted.');
      setIsPlaying(false);
    }
  };

  const handleDownload = () => {
    if (!url) return;
    
    // For Apex URLs, open in new tab as download might be restricted
    if (url.includes('vapi.ai')) {
      window.open(url, '_blank');
    } else {
      const a = document.createElement('a');
      a.href = url;
      a.download = 'recording.wav';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const progressPercentage = audioDuration > 0 ? (currentTime / audioDuration) * 100 : 0;

  return (
    <div className={`audio-player ${className}`}>
      {/* Hidden audio element */}
      <audio 
        ref={audioRef} 
        src={url}
        preload="metadata"
      />

      {error ? (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-red-400 font-medium">Audio Loading Error</p>
              <p className="text-xs text-red-400/70 mt-1">{error}</p>
              {url.includes('vapi.ai') && (
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-3 border-red-500/20 text-red-400 hover:bg-red-500/10"
                  onClick={() => window.open(url, '_blank')}
                >
                  <Volume2 className="h-4 w-4 mr-2" />
                  Open in New Tab
                </Button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Controls */}
          <div className="flex items-center gap-4">
            <Button
              onClick={handlePlayPause}
              disabled={isLoading}
              size="lg"
              className="w-14 h-14 rounded-full bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : isPlaying ? (
                <Pause className="h-5 w-5 text-white" />
              ) : (
                <Play className="h-5 w-5 text-white ml-0.5" />
              )}
            </Button>

            {/* Progress bar with waveform visualization */}
            <div className="flex-1 space-y-2">
              <div 
                className="relative h-12 bg-gray-800 rounded-lg overflow-hidden cursor-pointer group"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = e.clientX - rect.left;
                  const percentage = x / rect.width;
                  const newTime = Math.floor(percentage * audioDuration);
                  
                  if (audioRef.current) {
                    audioRef.current.currentTime = newTime;
                    setCurrentTime(newTime);
                  }
                }}
              >
                {/* Waveform bars */}
                <div className="absolute inset-0 flex items-end justify-between gap-0.5 px-1">
                  {Array.from({ length: 40 }, (_, i) => {
                    const height = 30 + Math.sin(i * 0.3) * 20 + Math.random() * 20;
                    const isActive = (i / 40) * audioDuration <= currentTime;
                    
                    return (
                      <div
                        key={i}
                        className="flex-1 rounded-t transition-all duration-150"
                        style={{
                          height: `${height}%`,
                          backgroundColor: isActive ? '#10b981' : '#374151',
                          opacity: isActive ? 1 : 0.5,
                        }}
                      />
                    );
                  })}
                </div>
                
                {/* Progress indicator */}
                <div
                  className="absolute top-0 h-full w-0.5 bg-green-400 transition-all duration-100"
                  style={{ left: `${progressPercentage}%` }}
                />
                
                {/* Hover tooltip */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="bg-gray-900 px-2 py-1 rounded text-xs text-white">Click to seek</span>
                </div>
              </div>
              
              <div className="flex justify-between text-xs text-gray-400">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(audioDuration)}</span>
              </div>
            </div>

            {/* Speed control */}
            {showSpeedControl && (
              <select
                value={playbackSpeed}
                onChange={(e) => handleSpeedChange(Number(e.target.value))}
                className="rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-white focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              >
                <option value={0.5}>0.5x</option>
                <option value={0.75}>0.75x</option>
                <option value={1}>1x</option>
                <option value={1.25}>1.25x</option>
                <option value={1.5}>1.5x</option>
                <option value={1.75}>1.75x</option>
                <option value={2}>2x</option>
              </select>
            )}

            {/* Download button */}
            {showDownload && (
              <Button
                onClick={handleDownload}
                variant="outline"
                size="sm"
                className="border-gray-600 hover:bg-gray-700"
              >
                <Download className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* URL info for debugging */}
          {url.includes('vapi.ai') && (
            <div className="text-xs text-gray-500">
              <p>Recording - If playback fails, try opening in a new tab</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};