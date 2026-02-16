import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { CheckCircle, Check, Users } from 'lucide-react';
import { OnboardingData } from '../../pages/ClientOnboarding';
import { OnboardingService } from '../../services/onboarding-service';
import { PLAN_TIERS } from '../../config/plans';

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
  const [selectedPlan, setSelectedPlan] = useState<string>(
    (data.selectedPlan?.tier as any) || 'employee_1'
  );
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

  const plans = OnboardingService.PLANS;

  const calculatePrice = (basePrice: number, cycle: 'monthly' | 'annual') => {
    return cycle === 'annual' ? Math.round(basePrice * 0.85) : basePrice;
  };

  const handleSubmit = () => {
    // Map new plan IDs to legacy keys for onboarding service
    const legacyKey = selectedPlan === 'employee_1' ? 'starter'
      : selectedPlan === 'employee_3' ? 'growth'
      : 'business';
    const plan = plans[legacyKey as keyof typeof plans];
    const finalPrice = calculatePrice(plan.price, billingCycle);

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

  // Get displayable plan tiers (exclude enterprise for self-service)
  const displayPlans = PLAN_TIERS.filter(p => !p.contactSales);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="mb-4 text-2xl font-bold text-white">Choose Your AI Workforce</h2>
        <p className="text-gray-400">Each AI Employee works 24/7, handles hundreds of calls daily, and costs less than minimum wage</p>
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
        {displayPlans.map((tier) => {
          const isSelected = selectedPlan === tier.id;
          const price = calculatePrice(tier.monthlyPriceGBP, billingCycle);

          return (
            <Card
              key={tier.id}
              className={`relative border-gray-700 bg-gray-800 transition-all ${
                isSelected ? 'ring-2 ring-emerald-500 border-emerald-500' : ''
              } ${tier.popular ? 'border-emerald-600/50' : ''}`}
            >
              {tier.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-emerald-600 text-white px-3">Most Popular</Badge>
                </div>
              )}
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-emerald-400" />
                  <CardTitle className="text-white">{tier.displayName}</CardTitle>
                </div>
                <CardDescription>
                  {tier.name} — {tier.aiEmployees} AI Employee{tier.aiEmployees > 1 ? 's' : ''}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <span className="text-3xl font-bold text-white">£{price.toLocaleString()}</span>
                  <span className="text-gray-400 text-sm">/mo</span>
                </div>
                <div className="mb-3 text-sm text-gray-400">
                  <p>{tier.includedCredits.toLocaleString()} credits included</p>
                  <p>≈ {tier.equivalentStandardMinutes.toLocaleString()} standard minutes</p>
                </div>
                <ul className="space-y-2 mb-4">
                  {tier.features.slice(0, 5).map((feature, i) => (
                    <li key={i} className="flex items-center text-sm text-gray-300">
                      <Check className="mr-2 h-4 w-4 text-emerald-400 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                  {tier.features.length > 5 && (
                    <li className="text-xs text-gray-500">+{tier.features.length - 5} more features</li>
                  )}
                </ul>
                <Button
                  onClick={() => setSelectedPlan(tier.id)}
                  className={`w-full ${
                    isSelected
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : ''
                  }`}
                  variant={isSelected ? 'default' : 'outline'}
                >
                  {isSelected ? 'Selected' : 'Select Plan'}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Pricing Breakdown */}
      <Card className="border-gray-700 bg-gray-800">
        <CardHeader>
          <CardTitle className="text-white">
            {displayPlans.find(p => p.id === selectedPlan)?.displayName || 'Plan'} — Pricing Breakdown
          </CardTitle>
          <CardDescription>Transparent pricing — credits are the billing engine, AI Employees are your workforce</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <h4 className="mb-3 font-medium text-white">What's Included:</h4>
              <ul className="space-y-2">
                {(displayPlans.find(p => p.id === selectedPlan)?.features || []).slice(0, 5).map((feature, index) => (
                  <li key={index} className="flex items-center text-emerald-400">
                    <CheckCircle className="mr-2 h-4 w-4" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="mb-3 font-medium text-white">Pricing Details:</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Monthly Plan:</span>
                  <span className="text-white">£{(displayPlans.find(p => p.id === selectedPlan)?.monthlyPriceGBP || 0).toLocaleString()}</span>
                </div>
                {billingCycle === 'annual' && (
                  <div className="flex justify-between text-emerald-400">
                    <span>Annual Discount (15%):</span>
                    <span>
                      -£{Math.round((displayPlans.find(p => p.id === selectedPlan)?.monthlyPriceGBP || 0) * 0.15).toLocaleString()}
                    </span>
                  </div>
                )}
                <div className="flex justify-between border-t border-gray-600 pt-2 font-medium">
                  <span className="text-white">Total Monthly:</span>
                  <span className="text-emerald-400">
                    £{calculatePrice(displayPlans.find(p => p.id === selectedPlan)?.monthlyPriceGBP || 0, billingCycle).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Overage rate:</span>
                  <span>
                    £{(displayPlans.find(p => p.id === selectedPlan)?.overageCreditPrice || 0.012).toFixed(3)}/credit
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
            <h3 className="mb-2 text-xl font-bold text-white">Less Than Minimum Wage Per AI Employee</h3>
            <p className="mb-4 text-gray-300">
              Each AI Employee replaces 3-5 human callers, works 24/7, and never calls in sick.
            </p>
            <div className="flex justify-center space-x-8 text-sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-400">24/7</div>
                <div className="text-gray-400">Always Available</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-400">500+</div>
                <div className="text-gray-400">Calls/Day Each</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-400">80%</div>
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
