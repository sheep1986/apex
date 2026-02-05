import React, { useEffect, useRef, useState } from 'react';

interface MatrixTransitionProps {
  isVisible: boolean;
  onComplete?: () => void;
  duration?: number;
}

export const MatrixTransition: React.FC<MatrixTransitionProps> = ({
  isVisible,
  onComplete,
  duration = 6000,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [showText, setShowText] = useState(false);

  useEffect(() => {
    if (!isVisible) return;

    // Play epic futuristic sound effect
    const playMatrixSound = () => {
      // Create audio context for web audio API
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

      // Create epic orchestral-style buildup
      const createEpicBuildup = () => {
        // Deep cinematic bass
        const bass = audioContext.createOscillator();
        const bassGain = audioContext.createGain();
        const bassFilter = audioContext.createBiquadFilter();

        bass.connect(bassFilter);
        bassFilter.connect(bassGain);
        bassGain.connect(audioContext.destination);

        bass.type = 'sine';
        bass.frequency.setValueAtTime(55, audioContext.currentTime);
        bass.frequency.exponentialRampToValueAtTime(110, audioContext.currentTime + 3);
        bass.frequency.exponentialRampToValueAtTime(220, audioContext.currentTime + 6);

        bassFilter.type = 'lowpass';
        bassFilter.frequency.setValueAtTime(400, audioContext.currentTime);
        bassFilter.frequency.exponentialRampToValueAtTime(800, audioContext.currentTime + 6);

        bassGain.gain.setValueAtTime(0, audioContext.currentTime);
        bassGain.gain.exponentialRampToValueAtTime(0.3, audioContext.currentTime + 0.5);
        bassGain.gain.setValueAtTime(0.3, audioContext.currentTime + 5);
        bassGain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 6);

        bass.start(audioContext.currentTime);
        bass.stop(audioContext.currentTime + 6);
      };

      // Add swooshing digital atmosphere
      const createDigitalSwoosh = () => {
        const noise = audioContext.createBufferSource();
        const buffer = audioContext.createBuffer(
          1,
          audioContext.sampleRate * 3,
          audioContext.sampleRate
        );
        const data = buffer.getChannelData(0);

        // Generate filtered noise for swoosh
        for (let i = 0; i < data.length; i++) {
          data[i] = (Math.random() * 2 - 1) * Math.sin(i * 0.001);
        }
        noise.buffer = buffer;

        const filterNode = audioContext.createBiquadFilter();
        const gainNode = audioContext.createGain();
        const delayNode = audioContext.createDelay();

        noise.connect(filterNode);
        filterNode.connect(delayNode);
        delayNode.connect(gainNode);
        gainNode.connect(audioContext.destination);

        filterNode.type = 'highpass';
        filterNode.frequency.setValueAtTime(1000, audioContext.currentTime);
        filterNode.frequency.exponentialRampToValueAtTime(4000, audioContext.currentTime + 2);

        delayNode.delayTime.setValueAtTime(0.1, audioContext.currentTime);

        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.15, audioContext.currentTime + 0.5);
        gainNode.gain.linearRampToValueAtTime(0.05, audioContext.currentTime + 4.5);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 5);

        noise.start(audioContext.currentTime + 0.2);
        noise.stop(audioContext.currentTime + 5);
      };

      // Create inspiring digital arpeggios
      const createDigitalArpeggio = () => {
        const notes = [440, 554, 659, 880, 1109, 1319]; // A major arpeggio
        notes.forEach((freq, index) => {
          setTimeout(() => {
            const osc = audioContext.createOscillator();
            const gain = audioContext.createGain();
            const filter = audioContext.createBiquadFilter();

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(audioContext.destination);

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, audioContext.currentTime);

            filter.type = 'bandpass';
            filter.frequency.setValueAtTime(freq * 2, audioContext.currentTime);
            filter.Q.setValueAtTime(10, audioContext.currentTime);

            gain.gain.setValueAtTime(0, audioContext.currentTime);
            gain.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);

            osc.start(audioContext.currentTime);
            osc.stop(audioContext.currentTime + 0.4);
          }, index * 150);
        });
      };

      // Subtle finish tone
      const createSubtleFinish = () => {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        const filter = audioContext.createBiquadFilter();

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(audioContext.destination);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, audioContext.currentTime); // Simple A note

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1000, audioContext.currentTime);

        gain.gain.setValueAtTime(0, audioContext.currentTime);
        gain.gain.linearRampToValueAtTime(0.08, audioContext.currentTime + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.8);

        osc.start(audioContext.currentTime);
        osc.stop(audioContext.currentTime + 0.8);
      };

      // Create the epic soundscape
      createEpicBuildup();
      setTimeout(() => createDigitalSwoosh(), 200);
      setTimeout(() => createDigitalArpeggio(), 2500);
      setTimeout(() => createSubtleFinish(), 5200);
    };

    // Play sound with user interaction check
    try {
      playMatrixSound();
    } catch (error) {
      console.log('Audio context creation failed:', error);
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Matrix characters including our words
    const matrixWords = [
      'TRINITY',
      'ARTIFICIAL',
      'MEDIA',
      'AI',
      'DATA',
      'NEURAL',
      'DIGITAL',
      'PLATFORM',
      'CODE',
      'CYBER',
    ];
    const matrixChars =
      '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン';
    const chars = matrixChars.split('');

    const fontSize = 12;
    const columns = Math.floor(canvas.width / fontSize);
    const drops: number[] = [];
    const wordDrops: { x: number; y: number; word: string; opacity: number }[] = [];

    // Initialize character drops
    for (let i = 0; i < columns; i++) {
      drops[i] = Math.floor((Math.random() * canvas.height) / fontSize);
    }

    // Show text immediately
    setShowText(true);

    const draw = () => {
      // Black background with stronger fade effect for faster animation
      ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw matrix characters
      ctx.fillStyle = '#e91e63';
      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        const text = chars[Math.floor(Math.random() * chars.length)];
        const x = i * fontSize;
        const y = drops[i] * fontSize;

        // Add glow effect
        ctx.shadowColor = '#e91e63';
        ctx.shadowBlur = 10;
        ctx.fillText(text, x, y);
        ctx.shadowBlur = 0;

        if (y > canvas.height && Math.random() > 0.95) {
          drops[i] = 0;
        }
        drops[i] += 2; // Faster falling speed
      }

      // Add random word drops
      if (Math.random() > 0.92) {
        wordDrops.push({
          x: Math.random() * (canvas.width - 100),
          y: -20,
          word: matrixWords[Math.floor(Math.random() * matrixWords.length)],
          opacity: 1,
        });
      }

      // Draw and update word drops
      ctx.font = `bold ${fontSize + 4}px monospace`;
      wordDrops.forEach((wordDrop, index) => {
        ctx.fillStyle = `rgba(233, 30, 99, ${wordDrop.opacity})`;
        ctx.shadowColor = '#e91e63';
        ctx.shadowBlur = 15;
        ctx.fillText(wordDrop.word, wordDrop.x, wordDrop.y);
        ctx.shadowBlur = 0;

        wordDrop.y += 3; // Word falling speed
        wordDrop.opacity -= 0.005;

        if (wordDrop.y > canvas.height || wordDrop.opacity <= 0) {
          wordDrops.splice(index, 1);
        }
      });
    };

    const interval = setInterval(draw, 20); // Faster refresh rate

    // Complete transition after duration
    const completeTimer = setTimeout(() => {
      clearInterval(interval);
      setShowText(false);
      onComplete?.();
    }, duration);

    return () => {
      clearInterval(interval);
      clearTimeout(completeTimer);
    };
  }, [isVisible, duration, onComplete]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black">
      <canvas ref={canvasRef} className="absolute inset-0" style={{ background: 'black' }} />

      {showText && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="relative mb-8">
              <div className="mb-4 animate-pulse bg-gradient-to-r from-gray-200 to-gray-400 bg-clip-text font-mono text-7xl font-black tracking-wider text-gray-300 text-transparent drop-shadow-[0_0_40px_rgba(156,163,175,1)]">
                ARTIFICIAL
              </div>
              <div className="absolute inset-0 mb-4 animate-pulse font-mono text-7xl font-black tracking-wider text-gray-400 opacity-50 blur-sm">
                ARTIFICIAL
              </div>
              <div className="absolute inset-0 mb-4 animate-ping font-mono text-7xl font-black tracking-wider text-white opacity-10">
                ARTIFICIAL
              </div>
            </div>
            <div className="relative">
              <div className="mb-6 animate-pulse bg-gradient-to-r from-green-300 to-green-500 bg-clip-text font-mono text-9xl font-black tracking-wider text-green-400 text-transparent drop-shadow-[0_0_40px_rgba(0,255,0,1)]">
                TRINITY
              </div>
              <div className="absolute inset-0 mb-6 animate-pulse font-mono text-9xl font-black tracking-wider text-green-500 opacity-50 blur-sm">
                TRINITY
              </div>
              <div className="absolute inset-0 mb-6 animate-ping font-mono text-9xl font-black tracking-wider text-white opacity-10">
                TRINITY
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
