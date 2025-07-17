import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dna,
  Copy,
  TrendingUp,
  Target,
  Zap,
  Award,
  Clock,
  Users,
  MessageSquare,
  BarChart3,
  Lightbulb,
  RefreshCw,
  Download,
  Play,
  Settings,
} from 'lucide-react';

interface CampaignDNA {
  id: string;
  name: string;
  successScore: number;
  conversionRate: number;
  totalCalls: number;
  averageCallDuration: number;
  industry: string;
  patterns: {
    opening: string;
    voiceProfile: string;
    timing: string;
    objectionHandling: string[];
    closingTechnique: string;
    followUpStrategy: string;
  };
  keyFactors: string[];
  replicationCount: number;
  avgImprovementWhenReplicated: number;
}

interface PatternAnalysis {
  category: 'opening' | 'voice' | 'timing' | 'objection' | 'closing' | 'followup';
  pattern: string;
  successRate: number;
  frequency: number;
  industries: string[];
  bestTimeToUse: string;
  recommendation: string;
}

interface OptimizationOpportunity {
  campaignId: string;
  campaignName: string;
  currentPerformance: number;
  suggestedDNA: string;
  potentialImprovement: number;
  confidence: number;
  effort: 'low' | 'medium' | 'high';
  expectedOutcome: string;
}

export default function CampaignDNA() {
  const [campaignDNAs, setCampaignDNAs] = useState<CampaignDNA[]>([]);
  const [patternAnalysis, setPatternAnalysis] = useState<PatternAnalysis[]>([]);
  const [optimizationOpportunities, setOptimizationOpportunities] = useState<
    OptimizationOpportunity[]
  >([]);
  const [selectedIndustry, setSelectedIndustry] = useState('all');
  const [selectedMetric, setSelectedMetric] = useState('conversion_rate');

  useEffect(() => {
    // Mock Campaign DNA data
    const mockDNAs: CampaignDNA[] = [
      {
        id: '1',
        name: 'SaaS Golden Standard',
        successScore: 94,
        conversionRate: 42.8,
        totalCalls: 1247,
        averageCallDuration: 9.2,
        industry: 'SaaS',
        patterns: {
          opening: 'Industry-specific pain point + credibility statement',
          voiceProfile: 'Professional female, medium pace, confident tone',
          timing: 'Tuesday-Thursday, 10:30-11:30 AM local time',
          objectionHandling: ['ROI calculator', 'Case study comparison', 'Trial offer'],
          closingTechnique: 'Assumptive close with timeline confirmation',
          followUpStrategy: 'Email with demo link within 2 hours, call in 3 days',
        },
        keyFactors: [
          'Industry expertise demonstrated early',
          'Specific ROI metrics mentioned',
          'Social proof from similar companies',
          'Clear next steps provided',
        ],
        replicationCount: 23,
        avgImprovementWhenReplicated: 28.4,
      },
      {
        id: '2',
        name: 'E-commerce Conversion Machine',
        successScore: 87,
        conversionRate: 38.5,
        totalCalls: 892,
        averageCallDuration: 7.8,
        industry: 'E-commerce',
        patterns: {
          opening: 'Seasonal trend hook + competitive analysis',
          voiceProfile: 'Energetic male, fast pace, friendly tone',
          timing: 'Monday/Friday, 2:00-4:00 PM local time',
          objectionHandling: [
            'Revenue impact calculator',
            'Competitor comparison',
            'Pilot program',
          ],
          closingTechnique: 'Urgency close with limited-time offer',
          followUpStrategy: 'Text with proposal link immediately, follow-up call next day',
        },
        keyFactors: [
          'Seasonal urgency created',
          'Competitive advantage highlighted',
          'Quick decision timeline',
          'Revenue impact quantified',
        ],
        replicationCount: 18,
        avgImprovementWhenReplicated: 22.1,
      },
      {
        id: '3',
        name: 'Enterprise Relationship Builder',
        successScore: 91,
        conversionRate: 35.2,
        totalCalls: 2156,
        averageCallDuration: 12.4,
        industry: 'Enterprise',
        patterns: {
          opening: 'Executive referral + industry research mention',
          voiceProfile: 'Authoritative female, slow pace, consultative tone',
          timing: 'Wednesday, 9:00-10:00 AM or 3:00-4:00 PM local time',
          objectionHandling: ['Executive summary', 'Phased implementation', 'Risk mitigation plan'],
          closingTechnique: 'Consultative close with stakeholder meeting',
          followUpStrategy: 'Detailed proposal within 24 hours, executive briefing scheduled',
        },
        keyFactors: [
          'Executive-level positioning',
          'Long-term relationship focus',
          'Risk mitigation emphasized',
          'Stakeholder involvement ensured',
        ],
        replicationCount: 12,
        avgImprovementWhenReplicated: 31.7,
      },
    ];

    const mockPatterns: PatternAnalysis[] = [
      {
        category: 'opening',
        pattern: 'Pain point + credibility statement',
        successRate: 73.2,
        frequency: 342,
        industries: ['SaaS', 'Tech', 'Consulting'],
        bestTimeToUse: 'First 30 seconds of call',
        recommendation: 'Most effective for B2B technical products - increases engagement by 45%',
      },
      {
        category: 'voice',
        pattern: 'Professional female, confident tone',
        successRate: 68.7,
        frequency: 567,
        industries: ['Healthcare', 'Finance', 'SaaS'],
        bestTimeToUse: 'All industries except manufacturing',
        recommendation: 'Builds trust faster in professional services - 23% higher trust scores',
      },
      {
        category: 'timing',
        pattern: 'Tuesday-Thursday, 10:30-11:30 AM',
        successRate: 81.4,
        frequency: 1234,
        industries: ['All'],
        bestTimeToUse: 'B2B prospects in office environments',
        recommendation: 'Peak productivity window - 34% higher answer rates',
      },
      {
        category: 'objection',
        pattern: 'ROI calculator presentation',
        successRate: 76.9,
        frequency: 189,
        industries: ['SaaS', 'Marketing Tech', 'Business Tools'],
        bestTimeToUse: 'When price objections arise',
        recommendation: 'Converts 62% of price objections into discussions',
      },
    ];

    const mockOpportunities: OptimizationOpportunity[] = [
      {
        campaignId: 'camp_1',
        campaignName: 'Q1 SaaS Outreach',
        currentPerformance: 18.5,
        suggestedDNA: 'SaaS Golden Standard',
        potentialImprovement: 24.3,
        confidence: 89,
        effort: 'medium',
        expectedOutcome: '42.8% conversion rate (vs current 18.5%)',
      },
      {
        campaignId: 'camp_2',
        campaignName: 'Enterprise Lead Gen',
        currentPerformance: 12.2,
        suggestedDNA: 'Enterprise Relationship Builder',
        potentialImprovement: 23.0,
        confidence: 92,
        effort: 'high',
        expectedOutcome: '35.2% conversion rate (vs current 12.2%)',
      },
      {
        campaignId: 'camp_3',
        campaignName: 'E-commerce Holiday Push',
        currentPerformance: 28.1,
        suggestedDNA: 'E-commerce Conversion Machine',
        potentialImprovement: 10.4,
        confidence: 76,
        effort: 'low',
        expectedOutcome: '38.5% conversion rate (vs current 28.1%)',
      },
    ];

    setCampaignDNAs(mockDNAs);
    setPatternAnalysis(mockPatterns);
    setOptimizationOpportunities(mockOpportunities);
  }, []);

  const cloneCampaignDNA = (dnaId: string) => {
    const dna = campaignDNAs.find((d) => d.id === dnaId);
    if (dna) {
      console.log(`Cloning DNA: ${dna.name}`);
      // Implementation would create new campaign with DNA patterns
    }
  };

  const getSuccessColor = (score: number) => {
    if (score >= 90) return 'text-green-400';
    if (score >= 75) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getEffortColor = (effort: string) => {
    switch (effort) {
      case 'low':
        return 'text-green-400 bg-green-500/10 border-green-500/20';
      case 'medium':
        return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
      case 'high':
        return 'text-red-400 bg-red-500/10 border-red-500/20';
      default:
        return 'text-gray-400 bg-gray-500/10 border-gray-500/20';
    }
  };

  return (
    <div className="min-h-screen bg-black">
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Dna className="h-8 w-8 text-purple-500" />
            <div>
              <p className="text-gray-400">
                Analyze, clone, and optimize your highest-performing campaign patterns
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Select value={selectedIndustry} onValueChange={setSelectedIndustry}>
              <SelectTrigger className="w-[140px] border-gray-700 bg-gray-800 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-gray-700 bg-gray-800">
                <SelectItem value="all">All Industries</SelectItem>
                <SelectItem value="saas">SaaS</SelectItem>
                <SelectItem value="ecommerce">E-commerce</SelectItem>
                <SelectItem value="enterprise">Enterprise</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              className="border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Analyze New Patterns
            </Button>
          </div>
        </div>

        {/* DNA Overview Stats */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <Card className="border-gray-800 bg-gray-900">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-green-500/20 p-2">
                  <Dna className="h-5 w-5 text-green-400" />
                </div>
                <div>
                  <div className="text-xs text-gray-400">DNA Patterns</div>
                  <div className="text-lg font-semibold text-white">{campaignDNAs.length}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-800 bg-gray-900">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-blue-500/20 p-2">
                  <Copy className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <div className="text-xs text-gray-400">Successful Clones</div>
                  <div className="text-lg font-semibold text-white">
                    {campaignDNAs.reduce((sum, dna) => sum + dna.replicationCount, 0)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-800 bg-gray-900">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-emerald-500/20 p-2">
                  <TrendingUp className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <div className="text-xs text-gray-400">Avg Improvement</div>
                  <div className="text-lg font-semibold text-white">+27.4%</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-800 bg-gray-900">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-yellow-500/20 p-2">
                  <Target className="h-5 w-5 text-yellow-400" />
                </div>
                <div>
                  <div className="text-xs text-gray-400">Success Rate</div>
                  <div className="text-lg font-semibold text-white">91.2%</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* High-Performance DNA Patterns */}
        <Card className="border-gray-800 bg-gray-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl font-semibold text-white">
              <Award className="h-5 w-5 text-amber-400" />
              High-Performance DNA Patterns
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {campaignDNAs.map((dna) => (
                <div key={dna.id} className="rounded-lg bg-gray-800/50 p-4">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-purple-500/20 p-2">
                        <Dna className="h-5 w-5 text-purple-400" />
                      </div>
                      <div>
                        <h3 className="font-medium text-white">{dna.name}</h3>
                        <div className="mt-1 flex items-center gap-4">
                          <Badge className="bg-gray-700 text-xs">{dna.industry}</Badge>
                          <span className="text-xs text-gray-400">
                            {dna.totalCalls.toLocaleString()} calls analyzed
                          </span>
                          <span className="text-xs text-gray-400">
                            Cloned {dna.replicationCount} times
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div
                          className={`text-lg font-semibold ${getSuccessColor(dna.successScore)}`}
                        >
                          {dna.successScore}%
                        </div>
                        <div className="text-xs text-gray-400">Success Score</div>
                      </div>
                      <Button
                        size="sm"
                        className="bg-purple-600 text-white hover:bg-purple-700"
                        onClick={() => cloneCampaignDNA(dna.id)}
                      >
                        <Copy className="mr-1 h-3 w-3" />
                        Clone DNA
                      </Button>
                    </div>
                  </div>

                  <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="rounded-md bg-gray-700/50 p-3">
                      <div className="mb-1 text-xs text-gray-400">Conversion Rate</div>
                      <div className="text-lg font-semibold text-white">{dna.conversionRate}%</div>
                    </div>
                    <div className="rounded-md bg-gray-700/50 p-3">
                      <div className="mb-1 text-xs text-gray-400">Avg Call Duration</div>
                      <div className="text-lg font-semibold text-white">
                        {dna.averageCallDuration}m
                      </div>
                    </div>
                    <div className="rounded-md bg-gray-700/50 p-3">
                      <div className="mb-1 text-xs text-gray-400">Replication Impact</div>
                      <div className="text-lg font-semibold text-green-400">
                        +{dna.avgImprovementWhenReplicated}%
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <h4 className="mb-2 font-medium text-white">DNA Pattern Breakdown</h4>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-gray-400">Opening:</span>{' '}
                          <span className="text-white">{dna.patterns.opening}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Voice:</span>{' '}
                          <span className="text-white">{dna.patterns.voiceProfile}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Timing:</span>{' '}
                          <span className="text-white">{dna.patterns.timing}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Closing:</span>{' '}
                          <span className="text-white">{dna.patterns.closingTechnique}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="mb-2 font-medium text-white">Key Success Factors</h4>
                      <div className="space-y-1">
                        {dna.keyFactors.map((factor, index) => (
                          <div key={index} className="flex items-center gap-2 text-sm">
                            <Zap className="h-3 w-3 text-yellow-400" />
                            <span className="text-gray-300">{factor}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Optimization Opportunities */}
        <Card className="border-gray-800 bg-gray-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl font-semibold text-white">
              <Lightbulb className="h-5 w-5 text-yellow-400" />
              DNA-Based Optimization Opportunities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {optimizationOpportunities.map((opp) => (
                <div key={opp.campaignId} className="rounded-lg bg-gray-800/50 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-white">{opp.campaignName}</h4>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="text-xs text-gray-400">
                          Current: {opp.currentPerformance}%
                        </span>
                        <span className="text-xs text-green-400">
                          → Potential: {opp.expectedOutcome.split('(')[0]}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-lg font-semibold text-green-400">
                        +{opp.potentialImprovement}%
                      </div>
                      <div className="text-xs text-gray-400">{opp.confidence}% confidence</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="text-xs">
                        <span className="text-gray-400">Suggested DNA:</span>
                        <span className="ml-1 text-white">{opp.suggestedDNA}</span>
                      </div>
                      <Badge className={`text-xs ${getEffortColor(opp.effort)}`}>
                        {opp.effort.toUpperCase()} EFFORT
                      </Badge>
                    </div>
                    <Button size="sm" className="bg-green-600 hover:bg-green-600/90">
                      <Play className="mr-1 h-3 w-3" />
                      Apply DNA
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
