import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { CheckCircle, Crown, Zap, Star, ArrowRight, Check } from 'lucide-react';
import { OnboardingData } from '../../pages/ClientOnboarding';
import { OnboardingService } from '../../services/onboarding-service';

interface PlanSelectionProps {
  data: OnboardingData;
  onComplete: (data: any) => void;
  onPrevious?: () => void;
  loading?: boolean;
}

const PlanSelection: React.FC<PlanSelectionProps> = ({
  data,
  onComplete,
  onPrevious,
  loading = false,
}) => {
  const [selectedPlan, setSelectedPlan] = useState<'starter' | 'professional' | 'enterprise'>(
    data.selectedPlan?.tier || 'starter'
  );
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

  const plans = OnboardingService.PLANS;

  const calculatePrice = (basePlan: typeof plans.starter, cycle: 'monthly' | 'annual') => {
    const basePrice = basePlan.price + basePlan.markup;
    return cycle === 'annual' ? Math.round(basePrice * 0.85) : basePrice; // 15% discount for annual
  };

  const handlePlanSelect = (planTier: 'starter' | 'professional' | 'enterprise') => {
    setSelectedPlan(planTier);
  };

  const handleSubmit = () => {
    const plan = plans[selectedPlan];
    const finalPrice = calculatePrice(plan, billingCycle);

    const planData = {
      selectedPlan: {
        tier: selectedPlan,
        price: finalPrice,
        markup: plan.markup,
        features: plan.features,
        airtableIncluded: plan.airtableIncluded,
        setupAssistance: plan.setupAssistance,
        priority: plan.priority,
      },
      contract: {
        ...data.contract,
        billingCycle,
      },
    };

    onComplete(planData);
  };

  // Get recommendation from qualification if available
  const qualification = (data as any).qualification;
  const recommendedPlan = qualification?.suggestedPlan || 'starter';

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="mb-4 text-2xl font-bold text-white">Choose Your Plan</h2>
        <p className="text-gray-400">Select the perfect plan for your business needs</p>
      </div>

      {/* Billing Cycle Toggle */}
      <div className="flex justify-center">
        <div className="flex rounded-lg bg-gray-800 p-1">
          <Button
            variant={billingCycle === 'monthly' ? 'default' : 'ghost'}
            onClick={() => setBillingCycle('monthly')}
            className="px-6"
          >
            Monthly
          </Button>
          <Button
            variant={billingCycle === 'annual' ? 'default' : 'ghost'}
            onClick={() => setBillingCycle('annual')}
            className="px-6"
          >
            Annual
            <Badge className="ml-2 bg-emerald-500 text-white">Save 15%</Badge>
          </Button>
        </div>
      </div>

      {/* Plan Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card className="border-gray-700 bg-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Starter</CardTitle>
            <CardDescription>Perfect for small businesses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 text-3xl font-bold text-white">$299</div>
            <Button
              onClick={() => handlePlanSelect('starter')}
              className="w-full"
              variant={selectedPlan === 'starter' ? 'default' : 'outline'}
            >
              Select Plan
            </Button>
          </CardContent>
        </Card>

        <Card className="border-gray-700 bg-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Professional</CardTitle>
            <CardDescription>Advanced features for growth</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 text-3xl font-bold text-white">$599</div>
            <Button
              onClick={() => handlePlanSelect('professional')}
              className="w-full"
              variant={selectedPlan === 'professional' ? 'default' : 'outline'}
            >
              Select Plan
            </Button>
          </CardContent>
        </Card>

        <Card className="border-gray-700 bg-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Enterprise</CardTitle>
            <CardDescription>Complete solution for large teams</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 text-3xl font-bold text-white">$1,299</div>
            <Button
              onClick={() => handlePlanSelect('enterprise')}
              className="w-full"
              variant={selectedPlan === 'enterprise' ? 'default' : 'outline'}
            >
              Select Plan
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Plan Comparison */}
      <Card className="border-gray-700 bg-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Why {plans[selectedPlan].name}?</CardTitle>
          <CardDescription>Perfect fit based on your requirements</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <h4 className="mb-3 font-medium text-white">What's Included:</h4>
              <ul className="space-y-2">
                {plans[selectedPlan].features.slice(0, 4).map((feature, index) => (
                  <li key={index} className="flex items-center text-emerald-400">
                    <CheckCircle className="mr-2 h-4 w-4" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="mb-3 font-medium text-white">Pricing Breakdown:</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Base Plan Cost:</span>
                  <span className="text-white">${plans[selectedPlan].price}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Agency Services:</span>
                  <span className="text-white">${plans[selectedPlan].markup}</span>
                </div>
                {billingCycle === 'annual' && (
                  <div className="flex justify-between text-emerald-400">
                    <span>Annual Discount (15%):</span>
                    <span>
                      -$
                      {Math.round((plans[selectedPlan].price + plans[selectedPlan].markup) * 0.15)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between border-t border-gray-600 pt-2 font-medium">
                  <span className="text-white">Total Monthly:</span>
                  <span className="text-emerald-400">
                    ${calculatePrice(plans[selectedPlan], billingCycle)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Value Proposition */}
      <Card className="border-emerald-500/20 bg-gradient-to-r from-emerald-500/10 to-blue-500/10">
        <CardContent className="pt-6">
          <div className="text-center">
            <h3 className="mb-2 text-xl font-bold text-white">🚀 Ready to Scale Your Calling?</h3>
            <p className="mb-4 text-gray-300">
              Join 500+ businesses already using AI to make {data.prospect.callVolume || '1000+'}{' '}
              calls per month
            </p>
            <div className="flex justify-center space-x-8 text-sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-400">24/7</div>
                <div className="text-gray-400">AI Availability</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-400">3x</div>
                <div className="text-gray-400">Faster Response</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-400">60%</div>
                <div className="text-gray-400">Cost Savings</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-between">
        {onPrevious && (
          <Button variant="outline" onClick={onPrevious}>
            Previous
          </Button>
        )}

        <Button
          onClick={handleSubmit}
          disabled={loading}
          className="ml-auto bg-emerald-600 text-white hover:bg-emerald-700"
        >
          Continue to Contract
        </Button>
      </div>
    </div>
  );
};

export default PlanSelection;
