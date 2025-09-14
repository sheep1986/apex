import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import {
  CheckCircle,
  Circle,
  ArrowRight,
  ArrowLeft,
  Users,
  Zap,
  Crown,
  Phone,
  Target,
  BarChart3,
} from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { OnboardingService } from '../services/onboarding-service';
import ProspectQualification from '../components/onboarding/ProspectQualification';
import PlanSelection from '../components/onboarding/PlanSelection';
import ContractGeneration from '../components/onboarding/ContractGeneration';
import ClientProvisioning from '../components/onboarding/ClientProvisioning';
import WelcomeActivation from '../components/onboarding/WelcomeActivation';

export interface OnboardingData {
  // Lead Information
  prospect: {
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
  };

  // Plan Selection
  selectedPlan: {
    tier: 'starter' | 'professional' | 'enterprise';
    price: number;
    markup: number;
    features: string[];
    airtableIncluded: boolean;
    setupAssistance: boolean;
    priority: string;
  };

  // Contract & Payment
  contract: {
    signed: boolean;
    signedDate?: Date;
    contractId?: string;
    paymentMethodId?: string;
    billingCycle: 'monthly' | 'annual';
  };

  // Provisioning
  provisioning: {
    subdomain: string;
    airtableWorkspace?: string;
    initialCampaign?: string;
    welcomeEmailSent: boolean;
    setupCallScheduled?: Date;
  };

  // Status
  currentStep: number;
  completed: boolean;
  agencyId: string;
}

const ClientOnboarding: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    prospect: {
      firstName: '',
      lastName: '',
      email: '',
      company: '',
      phone: '',
      industry: '',
      website: '',
      employees: '',
      currentSolution: '',
      callVolume: '',
      budget: '',
      timeline: '',
      painPoints: [],
      goals: [],
    },
    selectedPlan: {
      tier: 'starter',
      price: 299,
      markup: 100,
      features: [],
      airtableIncluded: false,
      setupAssistance: false,
      priority: 'standard',
    },
    contract: {
      signed: false,
      billingCycle: 'monthly',
    },
    provisioning: {
      subdomain: '',
      welcomeEmailSent: false,
    },
    currentStep: 1,
    completed: false,
    agencyId: searchParams.get('agency') || 'demo-agency',
  });

  const steps = [
    {
      id: 1,
      title: 'Prospect Qualification',
      description: 'Gather lead information and qualify fit',
      icon: Users,
      component: ProspectQualification,
    },
    {
      id: 2,
      title: 'Plan Selection',
      description: 'Choose the perfect plan for their needs',
      icon: Crown,
      component: PlanSelection,
    },
    {
      id: 3,
      title: 'Contract & Payment',
      description: 'Sign agreement and setup billing',
      icon: Target,
      component: ContractGeneration,
    },
    {
      id: 4,
      title: 'Account Provisioning',
      description: 'Setup workspace and integrations',
      icon: Zap,
      component: ClientProvisioning,
    },
    {
      id: 5,
      title: 'Welcome & Activation',
      description: 'Onboard and launch first campaign',
      icon: BarChart3,
      component: WelcomeActivation,
    },
  ];

  useEffect(() => {
    // Load existing onboarding data if resuming
    const savedData = OnboardingService.loadOnboardingProgress(onboardingData.agencyId);
    if (savedData) {
      setOnboardingData(savedData);
      setCurrentStep(savedData.currentStep);
    }
  }, []);

  const handleStepComplete = async (stepData: any) => {
    setLoading(true);

    try {
      const updatedData = {
        ...onboardingData,
        ...stepData,
        currentStep: currentStep + 1,
      };

      await OnboardingService.saveOnboardingProgress(updatedData);
      setOnboardingData(updatedData);

      if (currentStep < steps.length) {
        setCurrentStep(currentStep + 1);
        toast({
          title: 'Step Completed!',
          description: `${steps[currentStep - 1].title} completed successfully.`,
        });
      } else {
        // Final step - mark as completed
        const finalData = { ...updatedData, completed: true };
        await OnboardingService.completeOnboarding(finalData);

        toast({
          title: '🎉 Client Onboarded Successfully!',
          description: `${updatedData.prospect.company} is now an active client.`,
        });

        navigate('/agency');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save progress. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const progressPercentage = ((currentStep - 1) / steps.length) * 100;
  const CurrentStepComponent = steps[currentStep - 1]?.component;

  return (
    <div className="min-h-screen bg-black p-4 lg:p-8">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mb-4 flex items-center justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500">
              <Users className="h-6 w-6 text-white" />
            </div>
          </div>
          <h1 className="mb-2 text-3xl font-bold text-white">Client Onboarding</h1>
          <p className="text-gray-400">
            Convert prospects into active clients with our streamlined onboarding process
          </p>
        </div>

        {/* Progress Bar */}
        <Card className="mb-8 border-gray-800 bg-gray-900">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white">Progress</CardTitle>
                <CardDescription>
                  Step {currentStep} of {steps.length}: {steps[currentStep - 1]?.title}
                </CardDescription>
              </div>
              <Badge variant="outline" className="border-emerald-500 text-emerald-400">
                {Math.round(progressPercentage)}% Complete
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <Progress value={progressPercentage} className="mb-4" />

            {/* Step Indicators */}
            <div className="flex justify-between">
              {steps.map((step, index) => {
                const StepIcon = step.icon;
                const isCompleted = index + 1 < currentStep;
                const isCurrent = index + 1 === currentStep;

                return (
                  <div key={step.id} className="flex flex-col items-center">
                    <div
                      className={`mb-2 flex h-10 w-10 items-center justify-center rounded-full ${
                        isCompleted
                          ? 'bg-emerald-500 text-white'
                          : isCurrent
                            ? 'border-2 border-emerald-500 bg-emerald-500/20 text-emerald-400'
                            : 'bg-gray-800 text-gray-500'
                      } `}
                    >
                      {isCompleted ? (
                        <CheckCircle className="h-5 w-5" />
                      ) : (
                        <StepIcon className="h-5 w-5" />
                      )}
                    </div>
                    <span
                      className={`max-w-20 text-center text-xs ${
                        isCurrent ? 'text-emerald-400' : 'text-gray-500'
                      }`}
                    >
                      {step.title}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Current Step Content */}
        <Card className="border-gray-800 bg-gray-900">
          <CardHeader>
            <CardTitle className="flex items-center text-white">
              <span className="mr-3 flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500">
                {React.createElement(steps[currentStep - 1]?.icon, {
                  className: 'w-4 h-4 text-white',
                })}
              </span>
              {steps[currentStep - 1]?.title}
            </CardTitle>
            <CardDescription>{steps[currentStep - 1]?.description}</CardDescription>
          </CardHeader>
          <CardContent>
            {CurrentStepComponent && (
              <CurrentStepComponent
                data={onboardingData}
                onComplete={handleStepComplete}
                onPrevious={currentStep > 1 ? handlePrevious : undefined}
                loading={loading}
              />
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Need help? Contact support at{' '}
            <a href="mailto:support@apex.ai" className="text-emerald-400 hover:text-emerald-300">
              support@apex.ai
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ClientOnboarding;
