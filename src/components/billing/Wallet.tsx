import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { useUserContext } from "@/services/MinimalUserProvider";
import { supabase } from "@/services/supabase-client";
import { format } from 'date-fns';
import { ArrowDownLeft, ArrowUpRight, DollarSign, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Transaction {
  id: string;
  amount: number;
  type: string;
  description: string;
  created_at: string;
}

export function Wallet() {
  const { userContext } = useUserContext();
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingTopUp, setProcessingTopUp] = useState(false);

  useEffect(() => {
    fetchData();
  }, [userContext?.organization_id]);

  const fetchData = async () => {
    if (!userContext?.organization_id) return;
    
    try {
      setLoading(true);
      // 1. Get Balance
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('credit_balance')
        .eq('id', userContext.organization_id)
        .single();
      
      const typedOrgData = orgData as { credit_balance: number } | null;
      if (orgError) throw orgError;
      if (typedOrgData) setBalance(typedOrgData.credit_balance || 0);

      // 2. Get Transactions
      const { data: txData, error: txError } = await supabase
        .from('credits_ledger')
        .select('*')
        .eq('organization_id', userContext.organization_id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (txError) throw txError;
      if (txData) setTransactions(txData);
      
    } catch (e) {
      console.error("Error fetching wallet data:", e);
      toast({
        title: "Error",
        description: "Failed to load wallet balance.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTopUp = async (amount: number) => {
    try {
      setProcessingTopUp(true);
      const response = await fetch('/.netlify/functions/billing-create-checkout', {
        method: 'POST',
        body: JSON.stringify({
          amount,
          organizationId: userContext?.organization_id,
          successUrl: window.location.href, // Redirect back here
          cancelUrl: window.location.href,
        }),
      });

      const { url, error } = await response.json();
      
      if (error) throw new Error(error);
      if (url) window.location.href = url;
      
    } catch (error) {
      toast({
        title: "Top-up Failed",
        description: "Could not initiate payment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setProcessingTopUp(false);
    }
  };

  return (
    <div className="space-y-6 text-white">
      <Card className="border-emerald-600/30 bg-gray-900/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-emerald-400">
            <DollarSign className="h-5 w-5" />
            Waitlist / Beta Access
          </CardTitle>
          <CardDescription>
            Billing features are currently in beta. Your credits are managed by Trinity Labs.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm text-gray-400">Current Balance</p>
              <h2 className="text-4xl font-bold tracking-tight text-white">
                {loading ? <Loader2 className="h-8 w-8 animate-spin" /> : `$${balance.toFixed(2)}`}
              </h2>
            </div>
            
            <div className="flex gap-2">
              {[20, 50, 100].map((amt) => (
                <Button 
                  key={amt}
                  disabled={processingTopUp}
                  onClick={() => handleTopUp(amt)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white"
                >
                  {processingTopUp ? <Loader2 className="h-4 w-4 animate-spin" /> : `Add $${amt}`}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-gray-800 bg-gray-900/30">
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {transactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between rounded-lg bg-gray-800/50 p-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${tx.amount > 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                    {tx.amount > 0 ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                  </div>
                  <div>
                    <p className="font-medium text-white">{tx.description}</p>
                    <p className="text-xs text-gray-400">{format(new Date(tx.created_at), 'MMM d, h:mm a')}</p>
                  </div>
                </div>
                <span className={`font-mono font-medium ${tx.amount > 0 ? 'text-emerald-400' : 'text-gray-300'}`}>
                  {tx.amount > 0 ? '+' : ''}${tx.amount.toFixed(2)}
                </span>
              </div>
            ))}
            {transactions.length === 0 && !loading && (
              <p className="text-center text-gray-500 py-4">No recent transactions.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
