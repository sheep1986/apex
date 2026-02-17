import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Clock, CalendarDays, CalendarRange, CheckCircle2,
  AlertTriangle, XCircle, Zap, ArrowUpRight,
} from 'lucide-react';
import { VOICE_TIERS, type VoiceTier } from '@/config/credit-rates';
import { getPlanById, PLAN_TIERS, type PlanTier } from '@/config/plans';

// ── Types ────────────────────────────────────────────────────────────────────

export interface ScheduleConfig {
  timeframe: 'today' | 'this_week' | 'custom';
  workingHoursEnabled: boolean;
  workingHoursStart: string;
  workingHoursEnd: string;
  workingDays: boolean[];
  timezone: string;
  startDate?: string;
  endDate?: string;
}

interface CampaignCapacityPlannerProps {
  leadCount: number;
  assistantTier?: VoiceTier;
  planId?: string;
  creditsUsedThisPeriod?: number;
  creditBalance?: number;
  autoRechargeEnabled?: boolean;
  onDurationChange?: (avgMinutes: number) => void;
  onScheduleChange?: (schedule: ScheduleConfig) => void;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DEFAULT_DAYS = [false, true, true, true, true, true, false];

function parseHour(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h + m / 60;
}

function fmt(n: number): string {
  return n.toLocaleString('en-GB', { maximumFractionDigits: 1 });
}

function gbp(n: number): string {
  return `\u00a3${n.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// ── Component ────────────────────────────────────────────────────────────────

export default function CampaignCapacityPlanner({
  leadCount,
  assistantTier = 'standard',
  planId = 'employee_1',
  creditsUsedThisPeriod = 0,
  creditBalance = 0,
  autoRechargeEnabled = false,
  onDurationChange,
  onScheduleChange,
}: CampaignCapacityPlannerProps) {
  const [avgDuration, setAvgDuration] = useState(2);
  const [timeframe, setTimeframe] = useState<ScheduleConfig['timeframe']>('this_week');
  const [workingHoursEnabled, setWorkingHoursEnabled] = useState(true);
  const [workingStart, setWorkingStart] = useState('09:00');
  const [workingEnd, setWorkingEnd] = useState('18:00');
  const [workingDays, setWorkingDays] = useState<boolean[]>(DEFAULT_DAYS);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const plan = getPlanById(planId) ?? PLAN_TIERS[0];
  const tierConfig = VOICE_TIERS[assistantTier];

  // ── Live calculations ────────────────────────────────────────────────────

  const calc = useMemo(() => {
    const totalMinutes = leadCount * avgDuration;
    const creditsNeeded = Math.ceil(totalMinutes * tierConfig.creditsPerMinute);
    const concurrent = plan.maxConcurrentCalls;
    const throughput = concurrent * (60 / avgDuration); // calls per hour
    const completionHours = leadCount > 0 ? leadCount / throughput : 0;

    const hoursPerDay = workingHoursEnabled
      ? parseHour(workingEnd) - parseHour(workingStart)
      : 24;
    const activeDaysPerWeek = workingDays.filter(Boolean).length;

    let calendarDays: number;
    if (timeframe === 'today') {
      calendarDays = 1;
    } else if (timeframe === 'this_week') {
      calendarDays = Math.ceil(completionHours / hoursPerDay);
    } else {
      calendarDays = Math.ceil(completionHours / hoursPerDay);
    }

    const creditsRemaining = Math.max(0, plan.includedCredits - creditsUsedThisPeriod);

    return {
      totalMinutes,
      creditsNeeded,
      concurrent,
      throughput,
      completionHours,
      hoursPerDay,
      activeDaysPerWeek,
      calendarDays,
      creditsRemaining,
    };
  }, [leadCount, avgDuration, tierConfig, plan, workingHoursEnabled, workingStart, workingEnd, workingDays, timeframe, creditsUsedThisPeriod]);

  // ── Credit sufficiency ───────────────────────────────────────────────────

  const creditStatus = useMemo(() => {
    const { creditsNeeded, creditsRemaining } = calc;
    if (creditsNeeded <= creditsRemaining) return 'covered' as const;
    if (creditBalance > 0 && creditsNeeded <= creditsRemaining + creditBalance / plan.overageCreditPrice)
      return 'overage' as const;
    return 'insufficient' as const;
  }, [calc, creditBalance, plan.overageCreditPrice]);

  // ── Plan recommendation ──────────────────────────────────────────────────

  const upgrade = useMemo(() => {
    const targetHours = timeframe === 'today' ? calc.hoursPerDay : timeframe === 'this_week' ? calc.hoursPerDay * 5 : calc.hoursPerDay * calc.calendarDays;
    if (calc.completionHours <= targetHours) return null;

    const currentIdx = PLAN_TIERS.findIndex((p) => p.id === plan.id);
    const next = PLAN_TIERS[currentIdx + 1];
    if (!next || next.contactSales) return null;

    const nextThroughput = next.maxConcurrentCalls * (60 / avgDuration);
    const speedup = (nextThroughput / calc.throughput).toFixed(1);
    return { plan: next, speedup };
  }, [calc, plan, avgDuration, timeframe]);

  // ── Callbacks ────────────────────────────────────────────────────────────

  function handleDuration(val: number) {
    setAvgDuration(val);
    onDurationChange?.(val);
  }

  function emitSchedule(patch: Partial<ScheduleConfig>) {
    const config: ScheduleConfig = {
      timeframe, workingHoursEnabled, workingHoursStart: workingStart,
      workingHoursEnd: workingEnd, workingDays,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      startDate, endDate, ...patch,
    };
    onScheduleChange?.(config);
  }

  function toggleDay(i: number) {
    const next = [...workingDays];
    next[i] = !next[i];
    setWorkingDays(next);
    emitSchedule({ workingDays: next });
  }

  // ── Timeframe options ────────────────────────────────────────────────────

  const timeframes: { key: ScheduleConfig['timeframe']; label: string; icon: React.ReactNode }[] = [
    { key: 'today', label: 'Today', icon: <Clock className="h-4 w-4" /> },
    { key: 'this_week', label: 'This Week (5 days)', icon: <CalendarDays className="h-4 w-4" /> },
    { key: 'custom', label: 'Custom Date Range', icon: <CalendarRange className="h-4 w-4" /> },
  ];

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Average Call Duration */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-sm font-medium">Average Call Duration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <input type="range" min={0.5} max={5} step={0.5} value={avgDuration}
              onChange={(e) => handleDuration(Number(e.target.value))}
              className="flex-1 accent-emerald-500" />
            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
              {avgDuration} min
            </Badge>
          </div>
          <p className="text-gray-400 text-xs mt-2">
            {tierConfig.label} tier: {tierConfig.creditsPerMinute} credits/min
          </p>
        </CardContent>
      </Card>

      {/* Campaign Timeframe */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-sm font-medium">Campaign Timeframe</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            {timeframes.map((tf) => (
              <button key={tf.key} onClick={() => { setTimeframe(tf.key); emitSchedule({ timeframe: tf.key }); }}
                className={`flex flex-col items-center gap-1 rounded-lg border p-3 text-xs transition-colors ${
                  timeframe === tf.key
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                    : 'border-gray-700 bg-gray-800/50 text-gray-400 hover:border-gray-600'
                }`}>
                {tf.icon}
                <span>{tf.label}</span>
              </button>
            ))}
          </div>
          {timeframe === 'custom' && (
            <div className="flex gap-2">
              <input type="date" value={startDate}
                onChange={(e) => { setStartDate(e.target.value); emitSchedule({ startDate: e.target.value }); }}
                className="flex-1 rounded-md border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-white" />
              <input type="date" value={endDate}
                onChange={(e) => { setEndDate(e.target.value); emitSchedule({ endDate: e.target.value }); }}
                className="flex-1 rounded-md border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-white" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Working Hours */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white text-sm font-medium">Working Hours</CardTitle>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={workingHoursEnabled}
                onChange={(e) => { setWorkingHoursEnabled(e.target.checked); emitSchedule({ workingHoursEnabled: e.target.checked }); }}
                className="accent-emerald-500" />
              <span className="text-gray-400 text-xs">Restrict hours</span>
            </label>
          </div>
        </CardHeader>
        {workingHoursEnabled && (
          <CardContent className="space-y-3">
            <div className="flex gap-2 items-center">
              <input type="time" value={workingStart}
                onChange={(e) => { setWorkingStart(e.target.value); emitSchedule({ workingHoursStart: e.target.value }); }}
                className="rounded-md border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-white" />
              <span className="text-gray-400 text-xs">to</span>
              <input type="time" value={workingEnd}
                onChange={(e) => { setWorkingEnd(e.target.value); emitSchedule({ workingHoursEnd: e.target.value }); }}
                className="rounded-md border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-white" />
            </div>
            <div className="flex gap-1">
              {DAY_LABELS.map((d, i) => (
                <button key={d} onClick={() => toggleDay(i)}
                  className={`flex-1 rounded-md py-1.5 text-xs font-medium transition-colors ${
                    workingDays[i]
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-gray-800 text-gray-500 border border-gray-700'
                  }`}>
                  {d}
                </button>
              ))}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Live Calculation Panel */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-sm font-medium flex items-center gap-2">
            <Zap className="h-4 w-4 text-emerald-400" /> Capacity Estimate
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-y-3 gap-x-6 text-sm">
            <div className="text-gray-400">Total call minutes</div>
            <div className="text-white text-right font-mono">{fmt(calc.totalMinutes)}</div>
            <div className="text-gray-400">Credits needed</div>
            <div className="text-white text-right font-mono">{fmt(calc.creditsNeeded)}</div>
            <div className="text-gray-400">Concurrent slots</div>
            <div className="text-white text-right font-mono">{calc.concurrent}</div>
            <div className="text-gray-400">Throughput</div>
            <div className="text-white text-right font-mono">{fmt(calc.throughput)} calls/hr</div>
            <div className="text-gray-400">Est. completion</div>
            <div className="text-white text-right font-mono">{fmt(calc.completionHours)} hrs</div>
            <div className="text-gray-400">Calendar days</div>
            <div className="text-white text-right font-mono">{calc.calendarDays}</div>
          </div>
        </CardContent>
      </Card>

      {/* Credit Sufficiency */}
      {creditStatus === 'covered' && (
        <Alert className="bg-emerald-500/10 border-emerald-500/30 text-emerald-400">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <AlertTitle className="text-emerald-400">Fully covered by your plan</AlertTitle>
          <AlertDescription className="text-emerald-400/80">
            {fmt(calc.creditsRemaining)} credits remaining after this campaign.
          </AlertDescription>
        </Alert>
      )}
      {creditStatus === 'overage' && (
        <Alert className="bg-amber-500/10 border-amber-500/30 text-amber-400">
          <AlertTriangle className="h-4 w-4 text-amber-400" />
          <AlertTitle className="text-amber-400">Will use overage credits</AlertTitle>
          <AlertDescription className="text-amber-400/80">
            ~{gbp((calc.creditsNeeded - calc.creditsRemaining) * plan.overageCreditPrice)} overage
            at {gbp(plan.overageCreditPrice)}/credit.
          </AlertDescription>
        </Alert>
      )}
      {creditStatus === 'insufficient' && (
        <Alert className="bg-red-500/10 border-red-500/30 text-red-400">
          <XCircle className="h-4 w-4 text-red-400" />
          <AlertTitle className="text-red-400">Insufficient credits</AlertTitle>
          <AlertDescription className="text-red-400/80">
            {autoRechargeEnabled
              ? 'Auto-recharge will cover the shortfall.'
              : 'Enable Auto-Recharge or top up your credit balance to proceed.'}
          </AlertDescription>
        </Alert>
      )}

      {/* Plan Recommendation */}
      {upgrade && (
        <Card className="bg-gray-900 border-emerald-500/30">
          <CardContent className="flex items-center justify-between py-4">
            <div>
              <p className="text-white text-sm font-medium flex items-center gap-1">
                <ArrowUpRight className="h-4 w-4 text-emerald-400" />
                Upgrade to {upgrade.plan.name}
              </p>
              <p className="text-gray-400 text-xs mt-0.5">
                Complete {upgrade.speedup}x faster with {upgrade.plan.maxConcurrentCalls} concurrent slots
              </p>
            </div>
            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
              {gbp(upgrade.plan.monthlyPriceGBP)}/mo
            </Badge>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
