
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useUserContext } from '@/services/MinimalUserProvider'; // Context
import { createClient } from '@supabase/supabase-js';
import { Loader2, Phone, Plus, Search, Settings } from 'lucide-react';
import { useEffect, useState } from 'react';

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY);

export default function PhoneNumbersPage() {
  const { userContext } = useUserContext();
  const [numbers, setNumbers] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [availableNumbers, setAvailableNumbers] = useState<any[]>([]);
  const [searchAreaCode, setSearchAreaCode] = useState('');

  useEffect(() => {
    if (userContext?.organization_id) {
      loadNumbers();
    }
  }, [userContext]);

  const loadNumbers = async () => {
    const { data } = await supabase
      .from('phone_numbers')
      .select('*, inbound_routes(name)')
      .eq('organization_id', userContext?.organization_id)
      .eq('status', 'active');
    setNumbers(data || []);
  };

  const [searchLoading, setSearchLoading] = useState(false);
  const [buyingNumber, setBuyingNumber] = useState<string | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  const getAuthToken = async () => {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token || '';
  };

  const handleSearch = async () => {
    if (!searchAreaCode || searchAreaCode.length < 3) {
      setSearchError('Please enter a valid area code (e.g. 415)');
      return;
    }
    setSearchError(null);
    setSearchLoading(true);
    try {
      const token = await getAuthToken();
      const response = await fetch(
        `/.netlify/functions/numbers-search?areaCode=${encodeURIComponent(searchAreaCode)}&organizationId=${userContext?.organization_id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to search numbers');
      }
      const data = await response.json();
      const nums = Array.isArray(data) ? data : data.numbers || [];
      setAvailableNumbers(nums.map((n: any) => ({
        e164: n.phoneNumber || n.e164 || n.number,
        friendly: n.friendlyName || n.friendly || n.phoneNumber || n.e164 || n.number,
      })));
      setIsSearching(true);
    } catch (err: any) {
      setSearchError(err.message || 'Search failed');
    } finally {
      setSearchLoading(false);
    }
  };

  const handleBuy = async (phoneNumber: string) => {
    setBuyingNumber(phoneNumber);
    try {
      const token = await getAuthToken();
      const response = await fetch('/.netlify/functions/numbers-purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          phoneNumber,
          organizationId: userContext?.organization_id,
        }),
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to purchase number');
      }
      setIsSearching(false);
      setAvailableNumbers([]);
      await loadNumbers();
    } catch (err: any) {
      setSearchError(err.message || 'Purchase failed');
    } finally {
      setBuyingNumber(null);
    }
  };

  return (
    <div className="p-8 space-y-8 bg-black min-h-screen text-white">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Phone Numbers</h1>
          <p className="text-gray-400">Manage your inbound and outbound lines.</p>
        </div>
        <Button onClick={() => setIsSearching(!isSearching)} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="mr-2 h-4 w-4" /> Buy Number
        </Button>
      </div>

      {isSearching && (
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Search Available Numbers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 mb-6">
              <Input 
                placeholder="Area Code (e.g. 415)" 
                className="bg-gray-800 border-gray-700 text-white w-48"
                value={searchAreaCode}
                onChange={(e) => setSearchAreaCode(e.target.value)}
              />
              <Button variant="secondary" onClick={handleSearch} disabled={searchLoading}>
                {searchLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                {searchLoading ? 'Searching...' : 'Search'}
              </Button>
            </div>
            
            {searchError && (
              <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
                {searchError}
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {availableNumbers.map((num) => (
                <div key={num.e164} className="p-4 border border-gray-700 rounded-lg flex justify-between items-center">
                  <div className="text-lg font-mono">{num.friendly}</div>
                  <Button size="sm" onClick={() => handleBuy(num.e164)} disabled={buyingNumber !== null}>
                    {buyingNumber === num.e164 ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Buy'}
                  </Button>
                </div>
              ))}
              {availableNumbers.length === 0 && !searchLoading && (
                <div className="col-span-3 text-center py-4 text-gray-500">
                  No numbers found for this area code. Try a different one.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4">
        {numbers.map((num) => (
          <Card key={num.id} className="bg-gray-900 border-gray-800 hover:border-gray-700 transition-all">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gray-800 rounded-lg">
                  <Phone className="h-6 w-6 text-emerald-500" />
                </div>
                <div>
                  <h3 className="text-xl font-mono text-white">{num.e164}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="border-emerald-900 text-emerald-400 bg-emerald-900/10">Active</Badge>
                    <span className="text-sm text-gray-500">
                        {num.inbound_routes?.name ? `Routed via: ${num.inbound_routes.name}` : 'No Route Assigned'}
                    </span>
                  </div>
                </div>
              </div>
              
              <Button variant="ghost" className="text-gray-400 hover:text-white">
                <Settings className="h-4 w-4 mr-2" /> Configure
              </Button>
            </CardContent>
          </Card>
        ))}

        {numbers.length === 0 && !isSearching && (
          <div className="text-center py-12 text-gray-500">
            No phone numbers found. Provision one to get started.
          </div>
        )}
      </div>
    </div>
  );
}
