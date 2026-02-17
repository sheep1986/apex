import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { VOICE_TIERS, type VoiceTier } from '@/config/credit-rates';
import { getPlanById } from '@/config/plans';
import { Phone, TrendingUp } from 'lucide-react';
import React, { useMemo, useState } from 'react';

interface InboundCapacityEstimatorProps {
  planId?: string;
  currentPhoneNumbers?: number;
}

export const InboundCapacityEstimator: React.FC<InboundCapacityEstimatorProps> = ({
  planId = 'employee_1',
  currentPhoneNumbers = 1,
}) => {
  const [dailyCalls, setDailyCalls] = useState(50);
  const [avgDuration, setAvgDuration] = useState(3);
  const [voiceTier, setVoiceTier] = useState<VoiceTier>('standard');
  const [peakPercent, setPeakPercent] = useState(30);

  const plan = getPlanById(planId);
  const creditsPerMinute = VOICE_TIERS[voiceTier].creditsPerMinute;

  const calc = useMemo(() => {
    const peakConcurrent = (dailyCalls * (peakPercent / 100)) / (60 / avgDuration);
    const recommendedBuffer = Math.ceil(peakConcurrent * 2);
    const dailyCredits = dailyCalls * avgDuration * creditsPerMinute;
    const monthlyCredits = dailyCredits * 22;
    return { peakConcurrent: Math.ceil(peakConcurrent), recommendedBuffer, dailyCredits, monthlyCredits };
  }, [dailyCalls, avgDuration, creditsPerMinute, peakPercent]);

  const maxConcurrent = plan?.maxConcurrentCalls ?? 5;
  const includedCredits = plan?.includedCredits ?? 200_000;
  const creditPct = Math.round((calc.monthlyCredits / includedCredits) * 100);

  const capacityStatus =
    calc.recommendedBuffer <= maxConcurrent
      ? 'green'
      : calc.peakConcurrent <= maxConcurrent
        ? 'amber'
        : 'red';

  const creditStatus = creditPct <= 60 ? 'green' : creditPct <= 85 ? 'amber' : 'red';

  const nextPlanName =
    planId === 'employee_1' ? 'Growth' : planId === 'employee_3' ? 'Business' : 'Enterprise';

  const statusColors = { green: 'text-emerald-400', amber: 'text-amber-400', red: 'text-red-400' };
  const statusBg = { green: 'bg-emerald-500/10', amber: 'bg-amber-500/10', red: 'bg-red-500/10' };

  return (
    <Card className="border-gray-800 bg-gray-900">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-white">
          <Phone className="h-5 w-5 text-emerald-400" />
          Inbound Capacity Estimator
        </CardTitle>
        <p className="text-sm text-gray-400">Estimate whether your plan handles your inbound call volume.</p>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Inputs */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm text-gray-400">Expected Daily Inbound Calls</label>
            <input
              type="number" min={10} max={1000} value={dailyCalls}
              onChange={(e) => setDailyCalls(Math.max(10, Math.min(1000, Number(e.target.value))))}
              className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-white focus:border-emerald-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-gray-400">Voice Tier</label>
            <select
              value={voiceTier}
              onChange={(e) => setVoiceTier(e.target.value as VoiceTier)}
              className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-white focus:border-emerald-500 focus:outline-none"
            >
              {Object.values(VOICE_TIERS).map((t) => (
                <option key={t.tier} value={t.tier}>{t.label} — {t.creditsPerMinute} cr/min</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm text-gray-400">Avg Call Duration: {avgDuration} min</label>
            <input
              type="range" min={1} max={10} value={avgDuration}
              onChange={(e) => setAvgDuration(Number(e.target.value))}
              className="w-full accent-emerald-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-gray-400">Peak Hour %: {peakPercent}%</label>
            <input
              type="range" min={20} max={50} value={peakPercent}
              onChange={(e) => setPeakPercent(Number(e.target.value))}
              className="w-full accent-emerald-500"
            />
            <p className="mt-0.5 text-xs text-gray-500">What % of daily calls happen in your busiest hour?</p>
          </div>
        </div>

        {/* Results */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'Peak Concurrent', value: calc.peakConcurrent },
            { label: 'Recommended Buffer (2x)', value: calc.recommendedBuffer },
            { label: 'Daily Credits', value: calc.dailyCredits.toLocaleString() },
            { label: 'Monthly Credits', value: calc.monthlyCredits.toLocaleString() },
          ].map((item) => (
            <div key={item.label} className="rounded-lg border border-gray-800 bg-gray-800/50 p-3 text-center">
              <p className="text-xs text-gray-400">{item.label}</p>
              <p className="mt-1 text-lg font-semibold text-white">{item.value}</p>
            </div>
          ))}
        </div>

        {/* Status Banners */}
        <div className="space-y-2">
          <div className={`flex items-start gap-2 rounded-lg p-3 ${statusBg[capacityStatus]}`}>
            <TrendingUp className={`mt-0.5 h-4 w-4 shrink-0 ${statusColors[capacityStatus]}`} />
            <p className={`text-sm ${statusColors[capacityStatus]}`}>
              {capacityStatus === 'green' &&
                `Your ${plan?.name ?? 'plan'} handles this comfortably (${calc.recommendedBuffer}/${maxConcurrent} concurrent slots used)`}
              {capacityStatus === 'amber' &&
                'Your plan can handle average load but may struggle during peaks'}
              {capacityStatus === 'red' &&
                `Your plan is undersized. Upgrade to ${nextPlanName} for reliable coverage`}
            </p>
          </div>
          <div className={`flex items-start gap-2 rounded-lg p-3 ${statusBg[creditStatus]}`}>
            <Phone className={`mt-0.5 h-4 w-4 shrink-0 ${statusColors[creditStatus]}`} />
            <p className={`text-sm ${statusColors[creditStatus]}`}>
              {creditStatus === 'green' &&
                `Monthly inbound usage: ${calc.monthlyCredits.toLocaleString()} credits (${creditPct}% of your ${includedCredits.toLocaleString()} included)`}
              {creditStatus === 'amber' &&
                `Inbound alone uses ${creditPct}% of your credits \u2014 consider outbound usage too`}
              {creditStatus === 'red' &&
                `Inbound alone uses ${creditPct}% of your credits \u2014 upgrade to ${nextPlanName} or reduce call volume`}
            </p>
          </div>
        </div>

        {currentPhoneNumbers > 0 && (
          <p className="text-xs text-gray-500">
            Currently using {currentPhoneNumbers} of {plan?.includedPhoneNumbers ?? 3} included phone numbers.
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default InboundCapacityEstimator;
