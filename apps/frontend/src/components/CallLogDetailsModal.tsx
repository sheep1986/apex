import React, { useState, useRef, useEffect } from 'react';
import { X, Play, Pause, Download, Trash2, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface CallLogDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  callData?: {
    id: string;
    duration: number;
    transcript: Array<{
      speaker: 'user' | 'ai';
      text: string;
      timestamp?: number;
    }>;
    recording?: string;
    analysis?: {
      sentiment: number;
      keywords: string[];
      summary: string;
    };
    cost?: number;
    messages?: Array<{
      type: string;
      content: string;
      timestamp: number;
    }>;
  };
}

export const CallLogDetailsModal: React.FC<CallLogDetailsModalProps> = ({
  isOpen,
  onClose,
  callData,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Mock data if none provided
  const mockCallData = {
    id: 'call_123456789',
    duration: 456, // 7:36 in seconds
    transcript: [
      { speaker: 'user' as const, text: 'Hello? Alright.' },
      { speaker: 'ai' as const, text: 'Hello. Is it possible to speak to Harris, please?' },
      { speaker: 'user' as const, text: 'Speaking.' },
      {
        speaker: 'ai' as const,
        text: 'Hi, Harris. This is Joanne calling from Emerald Green Energy. You spoke to 1 of our reps who was in your area about solar energy for your property. Does that',
      },
      { speaker: 'user' as const, text: 'Yes. That sounds familiar.' },
      {
        speaker: 'ai' as const,
        text: "Great. Thanks for confirming. I hope you've been enjoying the nice weather. So just to check, was solar something you'd considered before our rep visit? Or was it more of a new idea when they spoke to you?",
      },
      { speaker: 'user' as const, text: "It's more in Charleston. It's a new idea for me." },
      {
        speaker: 'ai' as const,
        text: "Completely understandable, Harris. A lot of folks are just starting to look into it, especially with energy prices being what they are. We install tier 1 panels and battery systems with built in finance so you can start saving from day 1 without a big deposit. The good news is you've qualified for 1 of our free no pressure consultations with a solar adviser. They'll inspect inspect your roof, review your energy usage, and prepare a custom quote, no obligation at all. Looking at my calendar, we could schedule you for Wednesday at 6 PM. Does that work for you?",
      },
      {
        speaker: 'user' as const,
        text: "I can't work. I can't do Wednesday at 6 PM, but could you do another time?",
      },
      {
        speaker: 'ai' as const,
        text: 'No problem at all, Harris. What day or time would suit you better? This week? We can be quite flexible. Mornings, afternoons, or even a bit later in the evening if that helps',
      },
      { speaker: 'user' as const, text: 'How long how long will how long will this take?' },
      {
        speaker: 'ai' as const,
        text: "Great question, Harris. The consultation itself usually takes about 30 to 45 minutes. Our adviser will have a quick look at your roof, chat through your energy usage, and answer any questions you might have. There's no obligation, just a friendly, informative visit. Is there a particular day or time that would be most convenient for you?",
      },
      { speaker: 'user' as const, text: 'How much is it gonna cost me?' },
      {
        speaker: 'ai' as const,
        text: "Good question, Harris. The consultation is completely free. There's no cost at all for the visit or the quote. If you decide to go ahead with solar, we offer a plan with 0 dollars upfront monthly payments starting from 75 pounds. That covers everything. The panels, battery installation, and even 24 7 monitoring and maintenance. You only pay if you choose to move forward, and most customers start saving on their energy bills straight away. Does that help clear things up? And is there a day or time that works best for your free consultation?",
      },
      { speaker: 'user' as const, text: "How about, say, Friday at 10 o'clock?" },
      {
        speaker: 'ai' as const,
        text: "Friday at 10 o'clock works perfectly, Harris. I'll get you booked in for then. And just so I don't send our adviser to the wrong address, could you please confirm the first line of your address and your postcode for me?",
      },
      {
        speaker: 'user' as const,
        text: 'What do you have on the on the file? What address do you have?',
      },
      {
        speaker: 'ai' as const,
        text: "Of course, Harris, I just want to make sure everything's accurate and up to date. For security and privacy, I can't read your address out over the phone, but if you could just confirm",
      },
      {
        speaker: 'user' as const,
        text: "This is have you heard this? This is the AR caller thing that I'm on the phone to right now. Yeah. It's 34 Roadwood Drive. It's brilliant.",
      },
      {
        speaker: 'ai' as const,
        text: "Thank you, Harris. I've got Thanks for confirming, Harris. 34 Roadwood Drive And you're right. I am an AI caller, but I'm here to make things easy and answer any questions you've got just like a real person would. Glad you think it's brilliant. Just to double check, could you also confirm your postcode for me? That way, I can make sure our adviser gets to the right place on",
      },
      { speaker: 'user' as const, text: 'Yeah.' },
      { speaker: 'ai' as const, text: "Friday at 10 o'clock." },
      { speaker: 'user' as const, text: "Yes. Of course. It's b 96 0 q f. This I don't" },
      {
        speaker: 'ai' as const,
        text: "Perfect. Thank you, Harris. So that's 34 Roadwood Drive, b 96 0 q f. You're all set for your free solar consultation this Friday at 10 o'clock. I'll send you a",
      },
      {
        speaker: 'user' as const,
        text: "Who's the rep who's the rep that's gonna be coming out to see me?",
      },
      {
        speaker: 'ai' as const,
        text: 'Great question, Harris. The adviser assigned to your visit will be 1 of',
      },
      { speaker: 'user' as const, text: 'Yes, sir.' },
      {
        speaker: 'ai' as const,
        text: "great question, Harris. The adviser who'll be coming out is 1 of our local solar specialists from Emerald Green Energy. I don't have their exact name assigned, yet, but as soon as it's confirmed, I'll send you their name and contact details in your confirm confirmation message so you'll know exactly who to expect. Is there anything else you'd like to know about the visit or about solar in general?",
      },
      {
        speaker: 'user' as const,
        text: 'Yeah. I just want to just wanted to make sure that this is legitimate.',
      },
      {
        speaker: 'ai' as const,
        text: "Absolutely, Harris. That's a really sensible question. Emerald Green Energy is a fully accredited UK based solar company where MCS certified, which means we meet the highest industry standards for solar installation. All our advisors carry company ID, and you'll get their name and details in your confirmation message. Before your appointment. If you'd like, you can also check",
      },
      { speaker: 'user' as const, text: 'Where is your head office based?' },
      {
        speaker: 'ai' as const,
        text: 'Great question, Harris. Our head office is based in Birmingham right here in the UK. We work with homeowners all across the country, but our main operations and',
      },
      { speaker: 'user' as const, text: "What's the postcode?" },
      {
        speaker: 'ai' as const,
        text: "Sure thing, Harris. Our head office postcode is b 3 2 b j right in central Birmingham if you'd like, I can send you our full address and company details in your confirmation message as well. Just let me know. Is there anything else I can help with before your appointment on Friday?",
      },
      {
        speaker: 'user' as const,
        text: "Yeah. If you could send me the full company details just so I can check about that, that'd be much appreciated because I know someone just randomly turning up with the address.",
      },
      {
        speaker: 'ai' as const,
        text: "Absolutely, Harris. That's no problem at all. I'll include our full company name, head of address, and contact details in your confirmation message so you can check everything before your appointment. We want you to feel completely comfortable and confident. If you have any other questions,",
      },
      { speaker: 'user' as const, text: 'Yes.' },
      { speaker: 'ai' as const, text: 'Brilliant, Harris.' },
      {
        speaker: 'user' as const,
        text: "This is this isn't a fraud, fraudulent pull. This isn't a fraudulent call, is it? Because I'll be getting a few calls like this. I know some of the reps have been in the area.",
      },
      {
        speaker: 'ai' as const,
        text: "I completely understand your concern, Harris. And it's really good to be cautious these days. I can assure you this is a genuine call from Emerald Green Energy. We're a fully accredited UK based solar company, and all our reps are MCS certified and carry official company ID when they visit. You'll receive a confirmation message with",
      },
      {
        speaker: 'user' as const,
        text: "Thank you. We'll be respective. What can I take your number down? You have a really attractive voice. Can I take your number down? Ask the question. It's",
      },
      {
        speaker: 'ai' as const,
        text: "Thank you for the kind words, Harris. That's really appreciated. I'm actually actually an automated assistant, so I don't have a direct phone number you can call back on. But you'll get our official company contact details, including a phone number and email in your confirmation message. That way, if you have any questions or want to double check anything, you can always reach out to our team directly. Is there anything else I can help with before your appointment on Friday?",
      },
      {
        speaker: 'user' as const,
        text: "I'm happy to go ahead with the appointment. I was asking for your number because I'm struggling to find love these days. That's all. Just wanted to know if any feedback for me. Let's check. Couple. You know him and Ryan? Are you stuck?",
      },
      {
        speaker: 'ai' as const,
        text: "Uh, Harris, I appreciate your honest and your sense of humor. I'm here to help with solar and saving you money on your energy bills, but I'm a I'm afraid I'm not much help in the romance department unless you want to impress someone with your new eco friendly home. But honestly, you sound like a gen",
      },
      {
        speaker: 'user' as const,
        text: 'This is. No. Look. I really appreciate your time, Joanna. Thank you so much for calling. Get get that booked',
      },
      { speaker: 'ai' as const, text: 'No worries.' },
      {
        speaker: 'user' as const,
        text: "in for me Friday at 10 o'clock. All good. Happy to see you. How we end it, Charles?",
      },
      { speaker: 'ai' as const, text: 'Brilliant Harris' },
      {
        speaker: 'user' as const,
        text: "Go for the bolter. So for a demo with him. I was speaking to him last week. Thank you, Joanna. Appreciate it. Yeah. So I asked him to send it out. Send him, like, all the that we needed. So he's uploaded it. So now this demo will do it. He's given me some data so we'll see what comes off that day. Then we got a demo in the next couple of days. And if that goes well,",
      },
    ],
    recording: '/mock-audio.wav',
    analysis: {
      sentiment: 0.75,
      keywords: ['solar energy', 'property', 'rep visit'],
      summary: 'Customer confirmed interest in solar energy consultation.',
    },
    cost: 0.47,
    messages: [],
  };

  const data = callData || mockCallData;

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(Math.floor(audioRef.current.currentTime));
    }
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
  };

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.addEventListener('timeupdate', handleTimeUpdate);
      return () => {
        if (audioRef.current) {
          audioRef.current.removeEventListener('timeupdate', handleTimeUpdate);
        }
      };
    }
  }, []);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-end bg-black/60 p-0 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="h-full w-[50%] overflow-hidden border-l border-gray-700/50 bg-[#1a1a1a] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-700/50 bg-[#1a1a1a] p-6">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center rounded-xl border border-blue-500/30 bg-gradient-to-br from-blue-500/20 to-purple-500/20 p-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="1em"
                  height="1em"
                  fill="currentColor"
                  viewBox="0 0 256 256"
                  className="h-6 w-6 text-blue-400"
                >
                  <path d="M237.2,151.87v0a47.1,47.1,0,0,0-2.35-5.45L193.26,51.8a7.82,7.82,0,0,0-1.66-2.44,32,32,0,0,0-45.26,0A8,8,0,0,0,144,55V80H112V55a8,8,0,0,0-2.34-5.66,32,32,0,0,0-45.26,0,7.82,7.82,0,0,0-1.66,2.44L21.15,146.4a47.1,47.1,0,0,0-2.35,5.45v0A48,48,0,1,0,112,168V96h32v72a48,48,0,1,0,93.2-16.13ZM76.71,59.75a16,16,0,0,1,19.29-1v73.51a47.9,47.9,0,0,0-46.79-9.92ZM64,200a32,32,0,1,1,32-32A32,32,0,0,1,64,200ZM160,58.74a16,16,0,0,1,19.29,1l27.5,62.58A47.9,47.9,0,0,0,160,132.25ZM192,200a32,32,0,1,1,32-32A32,32,0,0,1,192,200Z"></path>
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white">Call Log Details</h3>
            </div>
            <button
              onClick={onClose}
              className="rounded-xl p-2 text-gray-400 transition-all duration-200 hover:bg-gray-700/50 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Call Details Section */}
          <div className="border-b border-gray-700/50 bg-[#1a1a1a] p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-medium text-white">Call Details</h3>
              <div className="flex items-center gap-3">
                <select
                  value={playbackSpeed}
                  onChange={(e) => handleSpeedChange(Number(e.target.value))}
                  className="rounded-lg border border-gray-600/50 bg-gray-800/50 px-2 py-1 text-xs text-white transition-all focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/50"
                >
                  <option value={0.5}>0.5x</option>
                  <option value={1}>1.0x</option>
                  <option value={1.5}>1.5x</option>
                  <option value={2}>2.0x</option>
                </select>
                <div className="rounded bg-gray-800/30 px-2 py-1 font-mono text-sm text-xs text-gray-400">
                  {formatDuration(data.duration)}
                </div>
              </div>
            </div>

            {/* Recording Section - Clean Modern */}
            <div className="mb-5">
              {/* Clean Audio Player */}
              <div className="overflow-hidden rounded-2xl border border-gray-700/50 bg-gradient-to-b from-gray-900/50 to-gray-800/30">
                <div className="p-6">
                  {/* Clean Header */}
                  <div className="mb-6 flex items-center justify-between">
                    <h4 className="text-lg font-medium text-white">Recording</h4>
                    <div className="rounded-lg bg-gray-800/50 px-3 py-1.5">
                      <span className="font-mono text-sm text-gray-300">
                        {formatDuration(data.duration)}
                      </span>
                    </div>
                  </div>

                  {/* Main Controls */}
                  <div className="space-y-6">
                    {/* Waveform and Controls Row */}
                    <div className="flex items-center gap-6">
                      {/* Clean Play Button */}
                      <button onClick={handlePlayPause} className="group relative flex-shrink-0">
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-green-600 shadow-lg transition-all duration-200 group-hover:scale-105 group-hover:shadow-green-500/30">
                          {isPlaying ? (
                            <Pause className="h-5 w-5 text-white" strokeWidth={2} />
                          ) : (
                            <Play className="ml-0.5 h-5 w-5 text-white" strokeWidth={2} />
                          )}
                        </div>
                      </button>

                      {/* Clean Waveform Visualization */}
                      <div className="relative flex-1 overflow-hidden rounded-xl bg-gray-900/50 p-4">
                        <div className="relative flex h-14 items-end justify-between gap-0.5">
                          {Array.from({ length: 100 }).map((_, i) => {
                            const height = 20 + Math.random() * 80;
                            const isActive = (i / 100) * data.duration <= currentTime;

                            return (
                              <div
                                key={i}
                                className="flex-1 rounded-t bg-gray-600 transition-all duration-150"
                                style={{
                                  height: `${height}%`,
                                  backgroundColor: isActive ? '#10b981' : '#4b5563',
                                  opacity: isActive ? 1 : 0.5,
                                }}
                              />
                            );
                          })}
                        </div>

                        {/* Progress Overlay */}
                        <div
                          className="absolute left-0 top-0 h-full w-1 bg-green-400 opacity-50"
                          style={{ left: `${(currentTime / data.duration) * 100}%` }}
                        />
                      </div>

                      {/* Download Button */}
                      <button className="group flex flex-shrink-0 items-center gap-2.5 rounded-xl border border-gray-600/50 bg-gray-800/50 px-5 py-3 transition-all duration-200 hover:border-gray-500/50 hover:bg-gray-700/50">
                        <Download
                          className="h-4 w-4 text-gray-400 group-hover:text-gray-300"
                          strokeWidth={2}
                        />
                        <span className="text-sm font-medium text-gray-300 group-hover:text-gray-200">
                          Audio
                        </span>
                      </button>
                    </div>

                    {/* Time and Progress */}
                    <div className="space-y-3">
                      {/* Time Display */}
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-mono text-gray-400">
                          {formatDuration(currentTime)}
                        </span>
                        <span className="font-mono text-gray-500">
                          -{formatDuration(data.duration - currentTime)}
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="relative">
                        <div className="h-1.5 overflow-hidden rounded-full bg-gray-700/50">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-green-500 to-green-400 transition-all duration-100"
                            style={{ width: `${(currentTime / data.duration) * 100}%` }}
                          />
                        </div>

                        {/* Progress Dot */}
                        <div
                          className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 transform rounded-full bg-green-400 shadow-lg transition-all duration-100"
                          style={{
                            left: `${(currentTime / data.duration) * 100}%`,
                            boxShadow: '0 0 0 3px rgba(34, 197, 94, 0.2)',
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <audio ref={audioRef} src={data.recording} />
            </div>
          </div>

          {/* Tabs Section */}
          <Tabs defaultValue="transcripts" className="flex flex-1 flex-col bg-[#1a1a1a]">
            <div className="border-b border-gray-700/50 bg-[#1a1a1a] px-6">
              <TabsList className="h-14 space-x-8 bg-transparent p-0">
                <TabsTrigger
                  value="transcripts"
                  className="flex items-center gap-2 rounded-none border-b-2 border-transparent bg-transparent px-0 pb-4 text-gray-400 transition-all duration-200 hover:text-white data-[state=active]:border-green-500 data-[state=active]:bg-transparent data-[state=active]:text-green-400 data-[state=active]:shadow-none"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="1em"
                    height="1em"
                    fill="currentColor"
                    viewBox="0 0 256 256"
                    className="h-4 w-4"
                  >
                    <path d="M232,48H160a40,40,0,0,0-32,16A40,40,0,0,0,96,48H24a8,8,0,0,0-8,8V200a8,8,0,0,0,8,8H96a24,24,0,0,1,24,24,8,8,0,0,0,16,0,24,24,0,0,1,24-24h72a8,8,0,0,0,8-8V56A8,8,0,0,0,232,48ZM96,192H32V64H96a24,24,0,0,1,24,24V200A39.81,39.81,0,0,0,96,192Zm128,0H160a39.81,39.81,0,0,0-24,8V88a24,24,0,0,1,24-24h64Z"></path>
                  </svg>
                  Transcripts
                </TabsTrigger>
                <TabsTrigger
                  value="logs"
                  className="flex items-center gap-2 rounded-none border-b-2 border-transparent bg-transparent px-0 pb-4 text-gray-400 transition-all duration-200 hover:text-white data-[state=active]:border-green-500 data-[state=active]:bg-transparent data-[state=active]:text-green-400 data-[state=active]:shadow-none"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="1em"
                    height="1em"
                    fill="currentColor"
                    viewBox="0 0 256 256"
                    className="h-4 w-4"
                  >
                    <path d="M88,64a8,8,0,0,1,8-8H216a8,8,0,0,1,0,16H96A8,8,0,0,1,88,64Zm128,56H96a8,8,0,0,0,0,16H216a8,8,0,0,0,0-16Zm0,64H96a8,8,0,0,0,0,16H216a8,8,0,0,0,0-16ZM56,56H40a8,8,0,0,0,0,16H56a8,8,0,0,0,0-16Zm0,64H40a8,8,0,0,0,0,16H56a8,8,0,0,0,0-16Zm0,64H40a8,8,0,0,0,0,16H56a8,8,0,0,0,0-16Z"></path>
                  </svg>
                  Logs
                </TabsTrigger>
                <TabsTrigger
                  value="analysis"
                  className="flex items-center gap-2 rounded-none border-b-2 border-transparent bg-transparent px-0 pb-4 text-gray-400 transition-all duration-200 hover:text-white data-[state=active]:border-green-500 data-[state=active]:bg-transparent data-[state=active]:text-green-400 data-[state=active]:shadow-none"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="1em"
                    height="1em"
                    fill="currentColor"
                    viewBox="0 0 256 256"
                    className="h-4 w-4"
                  >
                    <path d="M232,208a8,8,0,0,1-8,8H32a8,8,0,0,1-8-8V48a8,8,0,0,1,16,0v94.37L90.73,98a8,8,0,0,1,10.07-.38l58.81,44.11L218.73,90a8,8,0,1,1,10.54,12l-64,56a8,8,0,0,1-10.07.38L96.39,114.29,40,163.63V200H224A8,8,0,0,1,232,208Z"></path>
                  </svg>
                  Analysis
                </TabsTrigger>
                <TabsTrigger
                  value="messages"
                  className="flex items-center gap-2 rounded-none border-b-2 border-transparent bg-transparent px-0 pb-4 text-gray-400 transition-all duration-200 hover:text-white data-[state=active]:border-green-500 data-[state=active]:bg-transparent data-[state=active]:text-green-400 data-[state=active]:shadow-none"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="1em"
                    height="1em"
                    fill="currentColor"
                    viewBox="0 0 256 256"
                    className="h-4 w-4"
                  >
                    <path d="M93.31,70,28,128l65.27,58a8,8,0,1,1-10.62,12l-72-64a8,8,0,0,1,0-12l72-64A8,8,0,1,1,93.31,70Zm152,52-72-64a8,8,0,0,0-10.62,12L228,128l-65.27,58a8,8,0,1,0,10.62,12l72-64a8,8,0,0,0,0-12Z"></path>
                  </svg>
                  Messages
                </TabsTrigger>
                <TabsTrigger
                  value="cost"
                  className="flex items-center gap-2 rounded-none border-b-2 border-transparent bg-transparent px-0 pb-4 text-gray-400 transition-all duration-200 hover:text-white data-[state=active]:border-green-500 data-[state=active]:bg-transparent data-[state=active]:text-green-400 data-[state=active]:shadow-none"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="1em"
                    height="1em"
                    fill="currentColor"
                    viewBox="0 0 256 256"
                    className="h-4 w-4"
                  >
                    <path d="M232,208a8,8,0,0,1-8,8H32a8,8,0,0,1-8-8V48a8,8,0,0,1,16,0V200H224A8,8,0,0,1,232,208ZM132,160a12,12,0,1,0-12-12A12,12,0,0,0,132,160Zm-24-56A12,12,0,1,0,96,92,12,12,0,0,0,108,104ZM76,176a12,12,0,1,0-12-12A12,12,0,0,0,76,176Zm96-48a12,12,0,1,0-12-12A12,12,0,0,0,172,128Zm24-40a12,12,0,1,0-12-12A12,12,0,0,0,196,88Zm-20,76a12,12,0,1,0,12-12A12,12,0,0,0,176,164Z"></path>
                  </svg>
                  Call Cost
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="mx-6 mb-6 mt-6 flex max-h-[calc(100vh-40vh)] w-auto flex-1 flex-col overflow-y-auto rounded-2xl border border-gray-700/30 bg-gray-900/40 px-6 py-4 backdrop-blur-sm">
              <TabsContent
                value="transcripts"
                data-state="active"
                data-orientation="horizontal"
                role="tabpanel"
                tabIndex={0}
                className="mt-2 box-border flex h-full flex-1 flex-col ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                data-testid="transcriber-tab-content"
              >
                <div
                  data-testid="session-viewer-transcript"
                  className="flex h-full flex-1 flex-col"
                >
                  {/* Sticky Header */}
                  <div className="sticky top-0 z-10 mb-4 border-b border-gray-700/30 bg-gray-900/40 pb-3 backdrop-blur-sm">
                    <div className="flex flex-row items-center gap-3">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="1em"
                        height="1em"
                        fill="currentColor"
                        viewBox="0 0 256 256"
                        className="h-5 w-5 text-gray-400"
                      >
                        <path d="M232,48H160a40,40,0,0,0-32,16A40,40,0,0,0,96,48H24a8,8,0,0,0-8,8V200a8,8,0,0,0,8,8H96a24,24,0,0,1,24,24,8,8,0,0,0,16,0,24,24,0,0,1,24-24h72a8,8,0,0,0,8-8V56A8,8,0,0,0,232,48ZM96,192H32V64H96a24,24,0,0,1,24,24V200A39.81,39.81,0,0,0,96,192Zm128,0H160a39.81,39.81,0,0,0-24,8V88a24,24,0,0,1,24-24h64Z"></path>
                      </svg>
                      <span className="text-lg font-semibold text-white">Transcript</span>
                    </div>
                  </div>

                  {/* Scrollable Content */}
                  <div
                    className="flex-1 space-y-4 overflow-y-auto pr-2"
                    style={{
                      scrollbarWidth: 'thin',
                      scrollbarColor: '#4a5568 #2d3748',
                    }}
                  >
                    {data.transcript.map((item, index) => (
                      <div
                        key={index}
                        className="flex flex-col space-y-2"
                        data-testid={`session-viewer-transcript-${item.speaker === 'user' ? 'user' : 'ai'}`}
                      >
                        <strong
                          className={`text-sm font-bold ${item.speaker === 'user' ? 'text-blue-400' : 'text-green-400'}`}
                        >
                          {item.speaker === 'user' ? 'User' : 'AI'}
                        </strong>
                        <div className="rounded-lg border border-gray-700/10 bg-gray-800/20 p-3 text-sm leading-relaxed text-gray-300 transition-colors hover:bg-gray-800/30">
                          {item.text}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent
                value="logs"
                data-state="inactive"
                data-orientation="horizontal"
                role="tabpanel"
                tabIndex={0}
                className="mt-2 box-border flex h-full flex-1 flex-col ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                data-testid="logs-tab-content"
                hidden
              >
                {/* Sticky Header */}
                <div className="sticky top-0 z-10 mb-4 border-b border-gray-700/30 bg-gray-900/40 pb-3 backdrop-blur-sm">
                  <div className="flex flex-row items-center gap-3">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="1em"
                      height="1em"
                      fill="currentColor"
                      viewBox="0 0 256 256"
                      className="h-5 w-5 text-gray-400"
                    >
                      <path d="M88,64a8,8,0,0,1,8-8H216a8,8,0,0,1,0,16H96A8,8,0,0,1,88,64Zm128,56H96a8,8,0,0,0,0,16H216a8,8,0,0,0,0-16Zm0,64H96a8,8,0,0,0,0,16H216a8,8,0,0,0,0-16ZM56,56H40a8,8,0,0,0,0,16H56a8,8,0,0,0,0-16Zm0,64H40a8,8,0,0,0,0,16H56a8,8,0,0,0,0-16Zm0,64H40a8,8,0,0,0,0,16H56a8,8,0,0,0,0-16Z"></path>
                    </svg>
                    <span className="text-lg font-semibold text-white">Logs</span>
                  </div>
                </div>

                {/* Scrollable Logs */}
                <div
                  className="flex-1 space-y-1 overflow-y-auto pr-2"
                  style={{
                    scrollbarWidth: 'thin',
                    scrollbarColor: '#4a5568 #2d3748',
                  }}
                >
                  <div className="flex items-center space-x-3 rounded px-2 py-1.5 transition-colors hover:bg-gray-800/20">
                    <span className="rounded bg-gray-800/30 px-1.5 py-0.5 font-mono text-[10px] text-xs text-gray-500">
                      11:53:22:883
                    </span>
                    <span className="rounded bg-green-400/10 px-1.5 py-0.5 text-[10px] text-xs font-medium text-green-400">
                      [CHECKPOINT]
                    </span>
                    <p className="flex-1 text-xs text-gray-300">User speech possibly starting</p>
                  </div>

                  <div className="flex items-center space-x-3 rounded px-2 py-1.5 transition-colors hover:bg-gray-800/20">
                    <span className="rounded bg-gray-800/30 px-1.5 py-0.5 font-mono text-[10px] text-xs text-gray-500">
                      11:53:22:963
                    </span>
                    <span className="rounded bg-green-400/10 px-1.5 py-0.5 text-[10px] text-xs font-medium text-green-400">
                      [CHECKPOINT]
                    </span>
                    <p className="flex-1 text-xs text-gray-300">User speech possibly starting</p>
                  </div>

                  <div className="flex items-center space-x-3 rounded px-2 py-1.5 transition-colors hover:bg-gray-800/20">
                    <span className="rounded bg-gray-800/30 px-1.5 py-0.5 font-mono text-[10px] text-xs text-gray-500">
                      11:53:23:162
                    </span>
                    <span className="rounded bg-green-400/10 px-1.5 py-0.5 text-[10px] text-xs font-medium text-green-400">
                      [CHECKPOINT]
                    </span>
                    <p className="flex-1 text-xs text-gray-300">User speech started</p>
                  </div>

                  <div className="flex items-center space-x-3 rounded px-2 py-1.5 transition-colors hover:bg-gray-800/20">
                    <span className="rounded bg-gray-800/30 px-1.5 py-0.5 font-mono text-[10px] text-xs text-gray-500">
                      11:53:23:442
                    </span>
                    <span className="rounded bg-green-400/10 px-1.5 py-0.5 text-[10px] text-xs font-medium text-green-400">
                      [CHECKPOINT]
                    </span>
                    <p className="flex-1 text-xs text-gray-300">User speech possibly stopping</p>
                  </div>

                  <div className="flex items-center space-x-3 rounded px-2 py-1.5 transition-colors hover:bg-gray-800/20">
                    <span className="rounded bg-gray-800/30 px-1.5 py-0.5 font-mono text-[10px] text-xs text-gray-500">
                      11:53:24:200
                    </span>
                    <span className="rounded bg-cyan-400/10 px-1.5 py-0.5 text-[10px] text-xs font-medium text-cyan-400">
                      [LOG]
                    </span>
                    <p className="flex-1 text-xs text-gray-300">
                      Endpointing timeout 600ms (rule: `heuristic`)
                    </p>
                  </div>

                  <div className="flex items-center space-x-3 rounded px-2 py-1.5 transition-colors hover:bg-gray-800/20">
                    <span className="rounded bg-gray-800/30 px-1.5 py-0.5 font-mono text-[10px] text-xs text-gray-500">
                      11:53:24:200
                    </span>
                    <span className="rounded bg-cyan-400/10 px-1.5 py-0.5 text-[10px] text-xs font-medium text-cyan-400">
                      [LOG]
                    </span>
                    <p className="flex-1 text-xs text-gray-300">Transcriber output: Hello?</p>
                  </div>

                  <div className="flex items-center space-x-3 rounded px-2 py-1.5 transition-colors hover:bg-gray-800/20">
                    <span className="rounded bg-gray-800/30 px-1.5 py-0.5 font-mono text-[10px] text-xs text-gray-500">
                      11:53:24:923
                    </span>
                    <span className="rounded bg-green-400/10 px-1.5 py-0.5 text-[10px] text-xs font-medium text-green-400">
                      [CHECKPOINT]
                    </span>
                    <p className="flex-1 text-xs text-gray-300">User speech stopped</p>
                  </div>

                  <div className="flex items-center space-x-3 rounded px-2 py-1.5 transition-colors hover:bg-gray-800/20">
                    <span className="rounded bg-gray-800/30 px-1.5 py-0.5 font-mono text-[10px] text-xs text-gray-500">
                      11:53:24:963
                    </span>
                    <span className="rounded bg-green-400/10 px-1.5 py-0.5 text-[10px] text-xs font-medium text-green-400">
                      [CHECKPOINT]
                    </span>
                    <p className="flex-1 text-xs text-gray-300">Model request started</p>
                  </div>

                  <div className="flex items-center space-x-3 rounded px-2 py-1.5 transition-colors hover:bg-gray-800/20">
                    <span className="rounded bg-gray-800/30 px-1.5 py-0.5 font-mono text-[10px] text-xs text-gray-500">
                      11:53:24:964
                    </span>
                    <span className="rounded bg-cyan-400/10 px-1.5 py-0.5 text-[10px] text-xs font-medium text-cyan-400">
                      [LOG]
                    </span>
                    <p className="flex-1 text-xs text-gray-300">
                      Model request started (attempt #1, gpt-4.1-2025-04-14, azure-openai, westus)
                    </p>
                  </div>

                  <div className="flex items-center space-x-3 rounded px-2 py-1.5 transition-colors hover:bg-gray-800/20">
                    <span className="rounded bg-gray-800/30 px-1.5 py-0.5 font-mono text-[10px] text-xs text-gray-500">
                      11:53:25:333
                    </span>
                    <span className="rounded bg-cyan-400/10 px-1.5 py-0.5 text-[10px] text-xs font-medium text-cyan-400">
                      [LOG]
                    </span>
                    <p className="flex-1 text-xs text-gray-300">
                      Model request active (attempt #1, 0 buffered outputs)
                    </p>
                  </div>

                  <div className="flex items-center space-x-3 rounded px-2 py-1.5 transition-colors hover:bg-gray-800/20">
                    <span className="rounded bg-gray-800/30 px-1.5 py-0.5 font-mono text-[10px] text-xs text-gray-500">
                      11:53:25:334
                    </span>
                    <span className="rounded bg-green-400/10 px-1.5 py-0.5 text-[10px] text-xs font-medium text-green-400">
                      [CHECKPOINT]
                    </span>
                    <p className="flex-1 text-xs text-gray-300">Model sent start token</p>
                  </div>

                  <div className="flex items-center space-x-3 rounded px-2 py-1.5 transition-colors hover:bg-gray-800/20">
                    <span className="rounded bg-gray-800/30 px-1.5 py-0.5 font-mono text-[10px] text-xs text-gray-500">
                      11:53:25:336
                    </span>
                    <span className="rounded bg-cyan-400/10 px-1.5 py-0.5 text-[10px] text-xs font-medium text-cyan-400">
                      [LOG]
                    </span>
                    <p className="flex-1 text-xs text-gray-300">Model output: Hello</p>
                  </div>

                  <div className="flex items-center space-x-3 rounded px-2 py-1.5 transition-colors hover:bg-gray-800/20">
                    <span className="rounded bg-gray-800/30 px-1.5 py-0.5 font-mono text-[10px] text-xs text-gray-500">
                      11:53:25:380
                    </span>
                    <span className="rounded bg-cyan-400/10 px-1.5 py-0.5 text-[10px] text-xs font-medium text-cyan-400">
                      [LOG]
                    </span>
                    <p className="flex-1 text-xs text-gray-300">
                      Model output: , is it possible to speak to Harris please?
                    </p>
                  </div>

                  <div className="flex items-center space-x-3 rounded px-2 py-1.5 transition-colors hover:bg-gray-800/20">
                    <span className="rounded bg-gray-800/30 px-1.5 py-0.5 font-mono text-[10px] text-xs text-gray-500">
                      11:53:25:827
                    </span>
                    <span className="rounded bg-cyan-400/10 px-1.5 py-0.5 text-[10px] text-xs font-medium text-cyan-400">
                      [LOG]
                    </span>
                    <p className="flex-1 text-xs text-gray-300">
                      Model request cost (attempt #1, $0.004544, 2228 prompt, 11 completion)
                    </p>
                  </div>

                  <div className="flex items-center space-x-3 rounded px-2 py-1.5 transition-colors hover:bg-gray-800/20">
                    <span className="rounded bg-gray-800/30 px-1.5 py-0.5 font-mono text-[10px] text-xs text-gray-500">
                      11:53:26:090
                    </span>
                    <span className="rounded bg-blue-400/10 px-1.5 py-0.5 text-[10px] text-xs font-medium text-blue-400">
                      [INFO]
                    </span>
                    <p className="flex-1 text-xs text-gray-300">
                      Turn latency: 1889ms (transcriber: 0ms, endpointing: 762ms, kb: n/a, model:
                      374ms, voice: 727ms)
                    </p>
                  </div>

                  <div className="flex items-center space-x-3 rounded px-2 py-1.5 transition-colors hover:bg-gray-800/20">
                    <span className="rounded bg-gray-800/30 px-1.5 py-0.5 font-mono text-[10px] text-xs text-gray-500">
                      11:53:26:090
                    </span>
                    <span className="rounded bg-green-400/10 px-1.5 py-0.5 text-[10px] text-xs font-medium text-green-400">
                      [CHECKPOINT]
                    </span>
                    <p className="flex-1 text-xs text-gray-300">Assistant speech started</p>
                  </div>

                  <div className="flex items-center space-x-3 rounded px-2 py-1.5 transition-colors hover:bg-gray-800/20">
                    <span className="rounded bg-gray-800/30 px-1.5 py-0.5 font-mono text-[10px] text-xs text-gray-500">
                      11:53:28:489
                    </span>
                    <span className="rounded bg-green-400/10 px-1.5 py-0.5 text-[10px] text-xs font-medium text-green-400">
                      [CHECKPOINT]
                    </span>
                    <p className="flex-1 text-xs text-gray-300">Assistant speech stopped</p>
                  </div>

                  <div className="rounded-lg border border-gray-700/10 bg-gray-800/20 transition-colors hover:bg-gray-800/30">
                    <div className="flex items-start space-x-3 p-3">
                      <span className="w-20 rounded bg-gray-800/50 px-2 py-1 font-mono text-xs text-gray-500">
                        11:53:30:321
                      </span>
                      <span className="flex-shrink-0 rounded bg-cyan-400/10 px-2 py-1 text-xs font-medium text-cyan-400">
                        [LOG]
                      </span>
                      <p className="flex-1 text-sm text-gray-300">Transcriber output: Speaking.</p>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent
                value="analysis"
                data-state="inactive"
                data-orientation="horizontal"
                role="tabpanel"
                tabIndex={0}
                className="mt-2 box-border flex h-full flex-1 flex-col ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                data-testid="analysis-tab-content"
                hidden
              >
                <div className="space-y-4">
                  <h4 className="font-medium text-white">Call Analysis</h4>

                  <div className="rounded-lg bg-gray-700/50 p-4">
                    <h5 className="mb-3 font-medium text-white">Sentiment Analysis</h5>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Overall Sentiment:</span>
                        <span
                          className={`${data.analysis?.sentiment && data.analysis.sentiment > 0.6 ? 'text-green-400' : 'text-yellow-400'}`}
                        >
                          {data.analysis?.sentiment && data.analysis.sentiment > 0.6
                            ? 'Positive'
                            : 'Neutral'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Confidence:</span>
                        <span className="text-white">
                          {((data.analysis?.sentiment || 0) * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg bg-gray-700/50 p-4">
                    <h5 className="mb-3 font-medium text-white">Call Summary</h5>
                    <div className="text-sm text-gray-300">{data.analysis?.summary}</div>
                  </div>

                  <div className="rounded-lg bg-gray-700/50 p-4">
                    <h5 className="mb-3 font-medium text-white">Keywords</h5>
                    <div className="flex flex-wrap gap-2">
                      {data.analysis?.keywords.map((keyword, index) => (
                        <span
                          key={index}
                          className="rounded border border-gray-600 bg-gray-800 px-2 py-1 text-xs text-gray-300"
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent
                value="messages"
                data-state="inactive"
                data-orientation="horizontal"
                role="tabpanel"
                tabIndex={0}
                className="mt-2 box-border flex h-full flex-1 flex-col ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                data-testid="messages-tab-content"
                hidden
              >
                <div className="space-y-4">
                  <h4 className="font-medium text-white">Messages</h4>
                  <div className="text-sm text-gray-400">
                    <p>Messages and notifications related to this call.</p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent
                value="cost"
                data-state="inactive"
                data-orientation="horizontal"
                role="tabpanel"
                tabIndex={0}
                className="mt-2 box-border flex h-full flex-1 flex-col ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                data-testid="cost-breakdown-tab-content"
                hidden
              >
                <div className="space-y-4">
                  <h4 className="font-medium text-white">Call Cost</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Call Duration:</span>
                      <span className="text-white">{formatDuration(data.duration)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Cost per Minute:</span>
                      <span className="text-white">$0.037</span>
                    </div>
                    <div className="flex justify-between border-t border-gray-700 pt-3">
                      <span className="font-medium text-gray-400">Total Cost:</span>
                      <span className="font-medium text-emerald-400">${data.cost?.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
};
