import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Info, Target, TrendingUp, Users, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WinningCriteriaStepProps {
  criteria: any;
  onChange: (criteria: any) => void;
}

export const WinningCriteriaStep: React.FC<WinningCriteriaStepProps> = ({
  criteria,
  onChange,
}) => {
  const handleChange = (field: string, value: any) => {
    onChange({
      ...criteria,
      [field]: value,
    });
  };

  const suggestedCriteria = [
    "Has budget authority or is decision maker",
    "Expressed specific pain points or challenges",
    "Asked about pricing or implementation timeline",
    "Currently using a competitor's solution",
    "Mentioned team size or company growth",
    "Showed interest in specific features",
    "Agreed to next steps (demo, meeting, trial)",
    "Provided contact information voluntarily"
  ];

  return (
    <div className="space-y-6">
      <Card className="border-gray-800 bg-gray-900">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Target className="h-5 w-5 text-emerald-500" />
            Define Your Ideal Lead
          </CardTitle>
          <CardDescription className="text-gray-400">
            Tell the AI what makes a prospect qualified for your campaign
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Main Criteria */}
          <div className="space-y-2">
            <Label className="text-white">Winning Criteria</Label>
            <Textarea
              value={criteria.mainCriteria || ''}
              onChange={(e) => handleChange('mainCriteria', e.target.value)}
              placeholder="Describe what makes a lead qualified for your product/service..."
              className="min-h-[120px] border-gray-700 bg-gray-800 text-white"
            />
            <p className="text-xs text-gray-400">
              Example: "Looking for businesses with 10+ employees who are currently using manual processes and have expressed frustration with their current solution."
            </p>
          </div>

          {/* Suggested Criteria */}
          <div className="space-y-2">
            <Label className="text-white">Quick Add Criteria</Label>
            <div className="flex flex-wrap gap-2">
              {suggestedCriteria.map((criterion, index) => (
                <Button
                  key={index}
                  type="button"
                  variant="outline"
                  size="sm"
                  className="border-gray-700 bg-gray-800 text-xs text-gray-300 hover:bg-gray-700"
                  onClick={() => {
                    const current = criteria.mainCriteria || '';
                    const newCriteria = current
                      ? `${current}\n• ${criterion}`
                      : `• ${criterion}`;
                    handleChange('mainCriteria', newCriteria);
                  }}
                >
                  + {criterion}
                </Button>
              ))}
            </div>
          </div>

          {/* Threshold Settings */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-white">Minimum Call Duration</Label>
              <div className="flex items-center space-x-2">
                <Input
                  type="number"
                  value={criteria.minDuration || 30}
                  onChange={(e) => handleChange('minDuration', parseInt(e.target.value))}
                  className="w-20 border-gray-700 bg-gray-800 text-white"
                />
                <span className="text-sm text-gray-400">seconds</span>
              </div>
              <p className="text-xs text-gray-400">
                Calls shorter than this won't be qualified
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-white">Auto-Accept Score</Label>
              <div className="flex items-center space-x-2">
                <Input
                  type="number"
                  value={criteria.autoAcceptScore || 80}
                  onChange={(e) => handleChange('autoAcceptScore', parseInt(e.target.value))}
                  min="0"
                  max="100"
                  className="w-20 border-gray-700 bg-gray-800 text-white"
                />
                <span className="text-sm text-gray-400">%</span>
              </div>
              <p className="text-xs text-gray-400">
                Leads above this score are auto-qualified
              </p>
            </div>
          </div>

          {/* Specific Requirements */}
          <div className="space-y-4">
            <Label className="text-white">Specific Requirements</Label>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-lg border border-gray-800 bg-gray-800/50 p-3">
                <div className="flex items-center gap-3">
                  <Users className="h-4 w-4 text-blue-400" />
                  <div>
                    <p className="text-sm font-medium text-white">Company Size</p>
                    <p className="text-xs text-gray-400">Require minimum employees</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={criteria.requireCompanySize || false}
                    onCheckedChange={(checked) => handleChange('requireCompanySize', checked)}
                  />
                  {criteria.requireCompanySize && (
                    <Input
                      type="number"
                      value={criteria.minCompanySize || 10}
                      onChange={(e) => handleChange('minCompanySize', parseInt(e.target.value))}
                      className="w-20 border-gray-700 bg-gray-700 text-white"
                      placeholder="10"
                    />
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-gray-800 bg-gray-800/50 p-3">
                <div className="flex items-center gap-3">
                  <DollarSign className="h-4 w-4 text-green-400" />
                  <div>
                    <p className="text-sm font-medium text-white">Budget Mentioned</p>
                    <p className="text-xs text-gray-400">Must discuss budget</p>
                  </div>
                </div>
                <Switch
                  checked={criteria.requireBudget || false}
                  onCheckedChange={(checked) => handleChange('requireBudget', checked)}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border border-gray-800 bg-gray-800/50 p-3">
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-4 w-4 text-emerald-400" />
                  <div>
                    <p className="text-sm font-medium text-white">Growth Intent</p>
                    <p className="text-xs text-gray-400">Looking to scale or grow</p>
                  </div>
                </div>
                <Switch
                  checked={criteria.requireGrowthIntent || false}
                  onCheckedChange={(checked) => handleChange('requireGrowthIntent', checked)}
                />
              </div>
            </div>
          </div>

          {/* Disqualifiers */}
          <div className="space-y-2">
            <Label className="text-white">Automatic Disqualifiers</Label>
            <Textarea
              value={criteria.disqualifiers || ''}
              onChange={(e) => handleChange('disqualifiers', e.target.value)}
              placeholder="List any automatic disqualifiers (one per line)..."
              className="min-h-[80px] border-gray-700 bg-gray-800 text-white"
            />
            <p className="text-xs text-gray-400">
              Example: Already a customer, Competitor employee, Outside service area
            </p>
          </div>

          {/* Info Box */}
          <div className="rounded-lg border border-blue-900/50 bg-blue-950/30 p-4">
            <div className="flex gap-3">
              <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-400" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-blue-300">How it works</p>
                <p className="text-xs text-blue-300/80">
                  The AI will analyze each call transcript against these criteria to determine lead quality. 
                  Be specific about what makes someone a good fit for your product or service. The AI will 
                  look for these signals in the conversation and score leads accordingly.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};