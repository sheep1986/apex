import React, { createContext, useContext, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserContext } from '@/services/MinimalUserProvider';
import { AlertTriangle, CreditCard, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

// ── Subscription Gate Hook ──────────────────────────────────────────────────
// Consumed by pages/components to disable action buttons in degraded states

interface SubscriptionGate {
  /** Subscription is active or trialing — full access */
  isActive: boolean;
  /** Subscription is past_due — read-only mode (show data, disable mutations) */
  isReadOnly: boolean;
  /** Subscription is canceled — only billing/settings accessible */
  isSuspended: boolean;
  /** The raw subscription_status string */
  subscriptionStatus: string;
}

const SubscriptionGateContext = createContext<SubscriptionGate>({
  isActive: true,
  isReadOnly: false,
  isSuspended: false,
  subscriptionStatus: 'active',
});

export const useSubscriptionGate = (): SubscriptionGate => {
  return useContext(SubscriptionGateContext);
};

// ── Subscription Banner ─────────────────────────────────────────────────────

const PastDueBanner: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-amber-900/40 border-b border-amber-700/50 px-4 py-3 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 min-w-0">
        <AlertTriangle className="h-5 w-5 text-amber-400 flex-shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-medium text-amber-200">Payment Failed</p>
          <p className="text-xs text-amber-300/70 truncate">
            Your subscription payment could not be processed. Update your billing to continue using all features.
          </p>
        </div>
      </div>
      <Button
        size="sm"
        onClick={() => navigate('/billing')}
        className="bg-amber-600 hover:bg-amber-500 text-white flex-shrink-0"
      >
        <CreditCard className="h-4 w-4 mr-1.5" />
        Update Payment
      </Button>
    </div>
  );
};

const CanceledBanner: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-red-900/40 border-b border-red-700/50 px-4 py-3 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 min-w-0">
        <XCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-medium text-red-200">Subscription Canceled</p>
          <p className="text-xs text-red-300/70 truncate">
            Your subscription has been canceled. Reactivate to regain access to all platform features.
          </p>
        </div>
      </div>
      <Button
        size="sm"
        onClick={() => navigate('/billing')}
        className="bg-red-600 hover:bg-red-500 text-white flex-shrink-0"
      >
        <CreditCard className="h-4 w-4 mr-1.5" />
        Reactivate
      </Button>
    </div>
  );
};

// ── Main Guard Component ────────────────────────────────────────────────────
// Wraps page content. Renders banner and provides gate context.

interface SubscriptionGuardProps {
  children: React.ReactNode;
}

export const SubscriptionGuard: React.FC<SubscriptionGuardProps> = ({ children }) => {
  const { userContext } = useUserContext();

  const gate = useMemo<SubscriptionGate>(() => {
    const status = userContext?.subscription_status || 'active';
    return {
      isActive: status === 'active' || status === 'trialing',
      isReadOnly: status === 'past_due',
      isSuspended: status === 'canceled',
      subscriptionStatus: status,
    };
  }, [userContext?.subscription_status]);

  return (
    <SubscriptionGateContext.Provider value={gate}>
      {gate.isReadOnly && <PastDueBanner />}
      {gate.isSuspended && <CanceledBanner />}
      {children}
    </SubscriptionGateContext.Provider>
  );
};

export default SubscriptionGuard;
