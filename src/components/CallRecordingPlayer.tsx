import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Play, Pause, Download, Volume2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

interface TranscriptLine {
  timestamp: number;
  speaker: string;
  text: string;
}

interface CallRecordingPlayerProps {
  recordingUrl: string;
  duration?: number;
  transcript?: TranscriptLine[];
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

const PLAYBACK_SPEEDS = [0.5, 1, 1.5, 2];

export default function CallRecordingPlayer({
  recordingUrl,
  duration: initialDuration,
  transcript,
}: CallRecordingPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(initialDuration ?? 0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [activeTranscriptIndex, setActiveTranscriptIndex] = useState(-1);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onLoadedMetadata = () => {
      if (audio.duration && isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const onEnded = () => {
      setIsPlaying(false);
    };

    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('ended', onEnded);
    };
  }, []);

  // Track active transcript line
  useEffect(() => {
    if (!transcript || transcript.length === 0) return;
    let active = -1;
    for (let i = transcript.length - 1; i >= 0; i--) {
      if (currentTime >= transcript[i].timestamp) {
        active = i;
        break;
      }
    }
    setActiveTranscriptIndex(active);
  }, [currentTime, transcript]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  const handleSeek = useCallback((value: number[]) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = value[0];
    setCurrentTime(value[0]);
  }, []);

  const cycleSpeed = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const currentIndex = PLAYBACK_SPEEDS.indexOf(playbackSpeed);
    const nextIndex = (currentIndex + 1) % PLAYBACK_SPEEDS.length;
    const newSpeed = PLAYBACK_SPEEDS[nextIndex];
    audio.playbackRate = newSpeed;
    setPlaybackSpeed(newSpeed);
  }, [playbackSpeed]);

  const jumpToTimestamp = useCallback((timestamp: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = timestamp;
    setCurrentTime(timestamp);
    if (!isPlaying) {
      audio.play();
      setIsPlaying(true);
    }
  }, [isPlaying]);

  const handleDownload = useCallback(() => {
    const a = document.createElement('a');
    a.href = recordingUrl;
    a.download = 'recording.mp3';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, [recordingUrl]);

  return (
    <div className="w-full space-y-4">
      <audio ref={audioRef} src={recordingUrl} preload="metadata" />

      {/* Player Controls */}
      <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
        <div className="flex items-center gap-3">
          {/* Play/Pause */}
          <Button
            variant="ghost"
            size="icon"
            onClick={togglePlay}
            className="h-10 w-10 shrink-0 rounded-full bg-emerald-600 text-white hover:bg-emerald-700 hover:text-white"
          >
            {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
          </Button>

          {/* Time + Seek */}
          <div className="flex flex-1 items-center gap-3">
            <span className="min-w-[40px] text-xs text-gray-400 tabular-nums">
              {formatTime(currentTime)}
            </span>
            <Slider
              value={[currentTime]}
              max={duration || 1}
              step={0.1}
              onValueChange={handleSeek}
              className="flex-1"
            />
            <span className="min-w-[40px] text-xs text-gray-400 tabular-nums">
              {formatTime(duration)}
            </span>
          </div>

          {/* Volume icon (visual indicator) */}
          <Volume2 className="h-4 w-4 shrink-0 text-gray-500" />

          {/* Playback Speed */}
          <Button
            variant="ghost"
            size="sm"
            onClick={cycleSpeed}
            className="min-w-[48px] text-xs font-mono text-gray-300 hover:text-white"
          >
            {playbackSpeed}x
          </Button>

          {/* Download */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDownload}
            className="h-8 w-8 shrink-0 text-gray-400 hover:text-white"
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Synchronized Transcript */}
      {transcript && transcript.length > 0 && (
        <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
          <h4 className="mb-3 text-sm font-medium text-gray-300">Transcript</h4>
          <div className="max-h-64 space-y-1 overflow-y-auto pr-2">
            {transcript.map((line, index) => (
              <button
                key={index}
                onClick={() => jumpToTimestamp(line.timestamp)}
                className={cn(
                  'flex w-full items-start gap-3 rounded px-2 py-1.5 text-left text-sm transition-colors hover:bg-gray-800',
                  activeTranscriptIndex === index
                    ? 'bg-gray-800 text-white'
                    : 'text-gray-400'
                )}
              >
                <span className="mt-0.5 min-w-[40px] shrink-0 font-mono text-xs text-gray-600">
                  {formatTime(line.timestamp)}
                </span>
                <span className="min-w-[60px] shrink-0 font-medium text-emerald-500">
                  {line.speaker}
                </span>
                <span className="flex-1">{line.text}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
