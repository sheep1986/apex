// Onboarding Service - Handles complete prospect to client conversion
export interface ProspectData {
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  phone: string;
  industry: string;
  website: string;
  employees: string;
  currentSolution: string;
  callVolume: string;
  budget: string;
  timeline: string;
  painPoints: string[];
  goals: string[];
}

export interface PlanData {
  tier: 'starter' | 'professional' | 'enterprise';
  price: number;
  markup: number;
  features: string[];
  airtableIncluded: boolean;
  setupAssistance: boolean;
  priority: string;
}

export interface ContractData {
  signed: boolean;
  signedDate?: Date;
  contractId?: string;
  paymentMethodId?: string;
  billingCycle: 'monthly' | 'annual';
}

export interface ProvisioningData {
  subdomain: string;
  airtableWorkspace?: string;
  initialCampaign?: string;
  welcomeEmailSent: boolean;
  setupCallScheduled?: Date;
}

export interface OnboardingData {
  prospect: ProspectData;
  selectedPlan: PlanData;
  contract: ContractData;
  provisioning: ProvisioningData;
  currentStep: number;
  completed: boolean;
  agencyId: string;
  createdAt: Date;
  updatedAt: Date;
}

export class OnboardingService {
  private static readonly STORAGE_KEY = 'apex-onboarding-data';
  private static readonly API_BASE = 'http://localhost:3001/api';

  // Plan configurations
  static readonly PLANS = {
    starter: {
      name: 'Starter',
      price: 299,
      markup: 100, // Agency markup
      features: [
        '1,000 AI calls/month',
        'Basic voice assistant',
        'Email support',
        'Standard integrations',
        'Basic analytics',
      ],
      airtableIncluded: false,
      setupAssistance: false,
      priority: 'standard',
    },
    professional: {
      name: 'Professional',
      price: 599,
      markup: 200,
      features: [
        '5,000 AI calls/month',
        'Advanced voice assistant',
        'Priority support',
        'Premium integrations',
        'Advanced analytics',
        'Custom workflows',
        'A/B testing',
      ],
      airtableIncluded: true,
      setupAssistance: true,
      priority: 'priority',
    },
    enterprise: {
      name: 'Enterprise',
      price: 1299,
      markup: 400,
      features: [
        'Unlimited AI calls',
        'Custom voice assistant',
        'Dedicated support',
        'All integrations',
        'Full analytics suite',
        'Custom development',
        'White-label options',
        'Multi-user access',
      ],
      airtableIncluded: true,
      setupAssistance: true,
      priority: 'enterprise',
    },
  };

  // Save onboarding progress
  static async saveOnboardingProgress(data: Partial<OnboardingData>): Promise<void> {
    try {
      const existingData = this.loadOnboardingProgress(data.agencyId!);
      const updatedData: OnboardingData = {
        ...existingData,
        ...data,
        updatedAt: new Date(),
      } as OnboardingData;

      // Save to localStorage
      localStorage.setItem(`${this.STORAGE_KEY}-${data.agencyId}`, JSON.stringify(updatedData));

      // Save to backend
      await fetch(`${this.API_BASE}/onboarding/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedData),
      });

      console.log('Onboarding progress saved:', updatedData);
    } catch (error) {
      console.error('Error saving onboarding progress:', error);
      throw error;
    }
  }

  // Load onboarding progress
  static loadOnboardingProgress(agencyId: string): OnboardingData | null {
    try {
      const data = localStorage.getItem(`${this.STORAGE_KEY}-${agencyId}`);
      if (data) {
        return JSON.parse(data);
      }
      return null;
    } catch (error) {
      console.error('Error loading onboarding progress:', error);
      return null;
    }
  }

  // Complete onboarding process
  static async completeOnboarding(data: OnboardingData): Promise<string> {
    try {
      // Create client account
      const clientId = await this.createClientAccount(data);

      // Setup workspace
      await this.setupClientWorkspace(data);

      // Send welcome email
      await this.sendWelcomeEmail(data);

      // Schedule setup call if needed
      if (data.selectedPlan.setupAssistance) {
        await this.scheduleSetupCall(data);
      }

      // Mark as completed
      const completedData = {
        ...data,
        completed: true,
        updatedAt: new Date(),
      };

      await this.saveOnboardingProgress(completedData);

      // Clean up temporary data
      localStorage.removeItem(`${this.STORAGE_KEY}-${data.agencyId}`);

      return clientId;
    } catch (error) {
      console.error('Error completing onboarding:', error);
      throw error;
    }
  }

  // Qualify prospect based on responses
  static qualifyProspect(prospect: ProspectData): {
    qualified: boolean;
    score: number;
    recommendations: string[];
    suggestedPlan: keyof typeof OnboardingService.PLANS;
  } {
    let score = 0;
    const recommendations: string[] = [];

    // Budget qualification
    const budgetRange = parseInt(prospect.budget.replace(/[^0-9]/g, ''));
    if (budgetRange >= 1000) score += 30;
    else if (budgetRange >= 500) score += 20;
    else if (budgetRange >= 200) score += 10;

    // Call volume
    const callVolume = parseInt(prospect.callVolume.replace(/[^0-9]/g, ''));
    if (callVolume >= 1000) score += 25;
    else if (callVolume >= 500) score += 20;
    else if (callVolume >= 100) score += 15;

    // Company size
    const employees = parseInt(prospect.employees.replace(/[^0-9]/g, ''));
    if (employees >= 50) score += 20;
    else if (employees >= 10) score += 15;
    else if (employees >= 5) score += 10;

    // Timeline urgency
    if (prospect.timeline.includes('immediate') || prospect.timeline.includes('1 month')) {
      score += 15;
    } else if (prospect.timeline.includes('3 months')) {
      score += 10;
    }

    // Pain point relevance
    const relevantPainPoints = [
      'manual calling',
      'lead response time',
      'scaling calls',
      'call quality',
      'cost reduction',
      'automation',
    ];
    const matchingPainPoints = prospect.painPoints.filter((point) =>
      relevantPainPoints.some((relevant) => point.toLowerCase().includes(relevant))
    ).length;
    score += matchingPainPoints * 5;

    // Generate recommendations
    if (score < 40) {
      recommendations.push('Consider nurturing this lead further before proposing a plan');
      recommendations.push('Focus on education about AI calling benefits');
    } else if (score < 70) {
      recommendations.push('Good fit for Starter plan');
      recommendations.push('Emphasize ROI and cost savings');
    } else {
      recommendations.push('Excellent fit for Professional or Enterprise plan');
      recommendations.push('Focus on advanced features and scalability');
    }

    // Suggest plan based on score and characteristics
    let suggestedPlan: keyof typeof OnboardingService.PLANS = 'starter';
    if (budgetRange >= 1000 && callVolume >= 1000) {
      suggestedPlan = 'enterprise';
    } else if (budgetRange >= 500 && callVolume >= 500) {
      suggestedPlan = 'professional';
    }

    return {
      qualified: score >= 40,
      score,
      recommendations,
      suggestedPlan,
    };
  }

  // Generate contract
  static generateContract(data: OnboardingData): string {
    const { prospect, selectedPlan } = data;
    const plan = this.PLANS[selectedPlan.tier];

    return `
SERVICE AGREEMENT

Client: ${prospect.company}
Contact: ${prospect.firstName} ${prospect.lastName}
Email: ${prospect.email}

Plan: ${plan.name}
Monthly Fee: $${selectedPlan.price}
Billing Cycle: ${data.contract.billingCycle}

Features Included:
${plan.features.map((feature) => `• ${feature}`).join('\n')}

Terms:
• Service begins upon contract signature and payment
• 30-day money-back guarantee
• Cancel anytime with 30-day notice
• Setup assistance included: ${plan.setupAssistance ? 'Yes' : 'No'}

Generated: ${new Date().toLocaleDateString()}
`;
  }

  // Private helper methods
  private static async createClientAccount(data: OnboardingData): Promise<string> {
    const response = await fetch(`${this.API_BASE}/clients/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prospect: data.prospect,
        plan: data.selectedPlan,
        agencyId: data.agencyId,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create client account');
    }

    const result = await response.json();
    return result.clientId;
  }

  private static async setupClientWorkspace(data: OnboardingData): Promise<void> {
    // Generate subdomain
    const subdomain = data.prospect.company
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .substring(0, 20);

    // Setup Airtable workspace if included
    if (data.selectedPlan.airtableIncluded) {
      await this.createAirtableWorkspace(data, subdomain);
    }

    // Update provisioning data
    data.provisioning.subdomain = subdomain;
  }

  private static async createAirtableWorkspace(
    data: OnboardingData,
    subdomain: string
  ): Promise<void> {
    // This would integrate with Airtable API to create workspace
    console.log(`Creating Airtable workspace for ${subdomain}`);
    data.provisioning.airtableWorkspace = `${subdomain}-workspace`;
  }

  private static async sendWelcomeEmail(data: OnboardingData): Promise<void> {
    await fetch(`${this.API_BASE}/email/welcome`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: data.prospect.email,
        name: data.prospect.firstName,
        company: data.prospect.company,
        plan: data.selectedPlan.tier,
        subdomain: data.provisioning.subdomain,
      }),
    });

    data.provisioning.welcomeEmailSent = true;
  }

  private static async scheduleSetupCall(data: OnboardingData): Promise<void> {
    // Integration with calendar scheduling service
    console.log(`Scheduling setup call for ${data.prospect.company}`);
    data.provisioning.setupCallScheduled = new Date(Date.now() + 24 * 60 * 60 * 1000); // Tomorrow
  }
}
