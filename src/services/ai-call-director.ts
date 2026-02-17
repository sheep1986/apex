// AI Call Director Service - Smart Routing, Real-time Coaching, and Call Intelligence

export interface AgentProfile {
  id: string;
  name: string;
  email: string;
  specialties: string[];
  experience: 'junior' | 'mid' | 'senior';
  languages: string[];
  availability: 'available' | 'busy' | 'offline';
  currentCalls: number;
  maxCalls: number;
  performanceMetrics: {
    conversionRate: number;
    avgCallDuration: number;
    customerSatisfaction: number;
    totalCalls: number;
  };
}

export interface LeadProfile {
  id: string;
  name: string;
  company?: string;
  industry?: string;
  estimatedValue: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  previousInteractions: number;
  preferredLanguage: string;
  timezone: string;
  tags: string[];
}

export interface CallRoutingDecision {
  assignedAgent: AgentProfile;
  confidence: number;
  reasoning: string[];
  alternativeAgents: AgentProfile[];
  estimatedOutcome: 'high' | 'medium' | 'low';
}

export interface RealTimeCoaching {
  callId: string;
  timestamp: string;
  type: 'suggestion' | 'warning' | 'opportunity' | 'escalation';
  message: string;
  confidence: number;
  actionRequired: boolean;
  suggestedResponse?: string;
}

export interface CallPrediction {
  callId: string;
  predictedOutcome: 'conversion' | 'callback' | 'not_interested' | 'needs_followup';
  confidence: number;
  keyFactors: string[];
  recommendedActions: string[];
  estimatedValue: number;
  timeToDecision: number;
}

class AICallDirectorService {
  private baseUrl = ''; // All API calls go through Netlify Functions (relative paths)

  async routeCall(lead: LeadProfile, agents: AgentProfile[]): Promise<CallRoutingDecision> {
    const availableAgents = agents.filter(
      (agent) => agent.availability === 'available' && agent.currentCalls < agent.maxCalls
    );

    if (availableAgents.length === 0) {
      throw new Error('No available agents for call routing');
    }

    const scoredAgents = availableAgents.map((agent) => {
      let score = 0;

      if (lead.industry && agent.specialties.includes(lead.industry)) {
        score += 30;
      }

      if (agent.languages.includes(lead.preferredLanguage)) {
        score += 20;
      }

      if (lead.estimatedValue > 10000) {
        if (agent.experience === 'senior') score += 25;
        else if (agent.experience === 'mid') score += 15;
      }

      score += agent.performanceMetrics.conversionRate * 0.3;
      score += agent.performanceMetrics.customerSatisfaction * 0.2;
      score += (agent.maxCalls - agent.currentCalls) * 2;

      return { agent, score };
    });

    scoredAgents.sort((a, b) => b.score - a.score);

    const bestAgent = scoredAgents[0].agent;
    const alternativeAgents = scoredAgents.slice(1, 4).map((a) => a.agent);

    return {
      assignedAgent: bestAgent,
      confidence: Math.min(scoredAgents[0].score / 100, 0.95),
      reasoning: [
        `Best match based on ${lead.industry || 'general'} expertise`,
        `Language compatibility: ${lead.preferredLanguage}`,
        `Performance metrics: ${bestAgent.performanceMetrics.conversionRate}% conversion rate`,
      ],
      alternativeAgents,
      estimatedOutcome:
        scoredAgents[0].score > 70 ? 'high' : scoredAgents[0].score > 50 ? 'medium' : 'low',
    };
  }

  async getRealtimeCoaching(
    callId: string,
    transcript: string,
    callDuration: number
  ): Promise<RealTimeCoaching[]> {
    const coaching: RealTimeCoaching[] = [];
    const lowerTranscript = transcript.toLowerCase();

    const buyingSignals = ['budget', 'pricing', 'when can we start', 'move forward', 'next steps'];
    if (buyingSignals.some((signal) => lowerTranscript.includes(signal))) {
      coaching.push({
        callId,
        timestamp: new Date().toISOString(),
        type: 'opportunity',
        message: '🎯 BUYING SIGNAL DETECTED! Customer is showing purchase intent.',
        confidence: 0.85,
        actionRequired: true,
        suggestedResponse:
          'Great! I can help you move forward. Let me check what options would work best for your timeline and budget.',
      });
    }

    const objections = ['too expensive', 'not sure', 'think about it', 'other options'];
    if (objections.some((objection) => lowerTranscript.includes(objection))) {
      coaching.push({
        callId,
        timestamp: new Date().toISOString(),
        type: 'warning',
        message: '⚠️ OBJECTION DETECTED! Customer has concerns that need addressing.',
        confidence: 0.75,
        actionRequired: true,
        suggestedResponse: 'I understand your concerns. Let me address that specifically...',
      });
    }

    const competitors = ['salesforce', 'hubspot', 'pipedrive', 'zoho'];
    if (competitors.some((competitor) => lowerTranscript.includes(competitor))) {
      coaching.push({
        callId,
        timestamp: new Date().toISOString(),
        type: 'opportunity',
        message: '🏆 COMPETITOR MENTIONED! Perfect opportunity to highlight our advantages.',
        confidence: 0.8,
        actionRequired: true,
        suggestedResponse: "That's a great comparison! Here's what makes us different...",
      });
    }

    if (callDuration > 15) {
      coaching.push({
        callId,
        timestamp: new Date().toISOString(),
        type: 'suggestion',
        message: '⏰ Long call detected. Consider summarizing key points and moving to close.',
        confidence: 0.7,
        actionRequired: false,
      });
    }

    return coaching;
  }

  async predictCallOutcome(
    callId: string,
    transcript: string,
    callDuration: number,
    leadProfile: LeadProfile
  ): Promise<CallPrediction> {
    let conversionScore = 0;
    const lowerTranscript = transcript.toLowerCase();
    const keyFactors: string[] = [];
    const recommendedActions: string[] = [];

    if (lowerTranscript.includes('interested')) {
      conversionScore += 20;
      keyFactors.push('Expressed interest');
    }

    if (lowerTranscript.includes('budget')) {
      conversionScore += 15;
      keyFactors.push('Budget discussion');
    }

    if (callDuration > 10) {
      conversionScore += 10;
      keyFactors.push('Extended conversation');
    }

    if (leadProfile.priority === 'high' || leadProfile.priority === 'urgent') {
      conversionScore += 15;
      keyFactors.push('High priority lead');
    }

    if (lowerTranscript.includes('not interested')) {
      conversionScore -= 30;
      keyFactors.push('Stated not interested');
    }

    if (lowerTranscript.includes('too expensive')) {
      conversionScore -= 20;
      keyFactors.push('Price objection');
    }

    if (callDuration < 3) {
      conversionScore -= 15;
      keyFactors.push('Short call duration');
    }

    let predictedOutcome: 'conversion' | 'callback' | 'not_interested' | 'needs_followup';
    if (conversionScore >= 40) {
      predictedOutcome = 'conversion';
      recommendedActions.push('Send proposal immediately');
      recommendedActions.push('Schedule follow-up within 24 hours');
    } else if (conversionScore >= 20) {
      predictedOutcome = 'needs_followup';
      recommendedActions.push('Send additional information');
      recommendedActions.push('Schedule demo call');
    } else if (conversionScore >= 0) {
      predictedOutcome = 'callback';
      recommendedActions.push('Schedule callback in 1 week');
      recommendedActions.push('Send nurture sequence');
    } else {
      predictedOutcome = 'not_interested';
      recommendedActions.push('Add to long-term nurture');
      recommendedActions.push('Remove from active campaign');
    }

    return {
      callId,
      predictedOutcome,
      confidence: Math.min(Math.abs(conversionScore) / 50, 0.95),
      keyFactors,
      recommendedActions,
      estimatedValue: leadProfile.estimatedValue * (conversionScore / 100),
      timeToDecision:
        predictedOutcome === 'conversion' ? 1 : predictedOutcome === 'needs_followup' ? 7 : 30,
    };
  }

  async checkEscalation(callId: string, transcript: string, sentiment: number): Promise<boolean> {
    const escalationTriggers = [
      'speak to manager',
      'cancel my account',
      'this is ridiculous',
      'waste of time',
      'terrible service',
    ];

    const hasEscalationTrigger = escalationTriggers.some((trigger) =>
      transcript.toLowerCase().includes(trigger)
    );

    const negativeSentiment = sentiment < -0.7;

    return hasEscalationTrigger || negativeSentiment;
  }
}

export const aiCallDirector = new AICallDirectorService();
