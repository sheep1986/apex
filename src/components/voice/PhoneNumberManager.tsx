import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { voiceService } from '@/services/voice-service';
import { Loader2, Phone, Plus, Search } from 'lucide-react';
import { useEffect, useState } from 'react';

// Types
interface PhoneNumber {
  e164: string;
  friendlyName: string;
  location: string;
  cost: number;
  vanity?: boolean;
}

interface OwnedNumber {
  id: string;
  number: string;
  name: string;
  provider: string;
  status: string;
}

export function PhoneNumberManager() {
  const [activeTab, setActiveTab] = useState<'owned' | 'buy'>('owned');
  const [ownedNumbers, setOwnedNumbers] = useState<OwnedNumber[]>([]);
  const [searchResults, setSearchResults] = useState<PhoneNumber[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchAreaCode, setSearchAreaCode] = useState('415');
  const [purchasingNumber, setPurchasingNumber] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadOwnedNumbers();
  }, []);

  const loadOwnedNumbers = async () => {
    setIsLoading(true);
    try {
      // Assuming getPhoneNumbers returns owned numbers
      const numbers = await voiceService.getPhoneNumbers();
      setOwnedNumbers(numbers as any);
    } catch (error) {
      console.error("Failed to load numbers", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchAreaCode) return;
    setIsLoading(true);
    try {
      const results = await voiceService.searchAvailableNumbers(searchAreaCode);
      setSearchResults(results);
    } catch (error) {
      toast({
        title: "Search Failed",
        description: "Could not find numbers in that area code.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBuy = async (number: PhoneNumber) => {
    setPurchasingNumber(number.e164);
    try {
      await voiceService.buyPhoneNumber(number.e164, `New Number ${number.friendlyName}`);
      toast({
        title: "Success! 🎉",
        description: `You now own ${number.friendlyName}.`,
      });
      // Switch back to owned list and reload
      setActiveTab('owned');
      setSearchResults([]);
      loadOwnedNumbers();
    } catch (error) {
      toast({
        title: "Purchase Failed",
        description: "Could not acquire this number. Please try again.",
        variant: "destructive"
      });
    } finally {
      setPurchasingNumber(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white mb-2">Phone System</h2>
          <p className="text-gray-400">Manage your virtual fleet of phone numbers.</p>
        </div>
        <div className="flex gap-2">
            <Button 
                variant={activeTab === 'owned' ? 'default' : 'outline'} 
                onClick={() => setActiveTab('owned')}
                className={activeTab === 'owned' ? 'bg-[#00FF94] text-black hover:bg-[#00CC76]' : 'border-white/20 text-white'}
            >
                My Numbers
            </Button>
            <Button 
                variant={activeTab === 'buy' ? 'default' : 'outline'} 
                onClick={() => setActiveTab('buy')}
                className={activeTab === 'buy' ? 'bg-[#00FF94] text-black hover:bg-[#00CC76]' : 'border-white/20 text-white'}
            >
                <Plus className="mr-2 h-4 w-4" />
                Buy New Number
            </Button>
        </div>
      </div>

      {activeTab === 'owned' ? (
        <Card className="border-white/10 bg-black/50 backdrop-blur-xl">
            <CardHeader>
                <CardTitle className="text-xl text-white">Active Numbers</CardTitle>
                <CardDescription>Numbers currently assigned to your AI Assistants.</CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading && ownedNumbers.length === 0 ? (
                     <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-emerald-500" /></div>
                ) : ownedNumbers.length > 0 ? (
                    <Table>
                        <TableHeader>
                            <TableRow className="border-white/10 hover:bg-transparent">
                                <TableHead className="text-gray-400">Number</TableHead>
                                <TableHead className="text-gray-400">Name</TableHead>
                                <TableHead className="text-gray-400">Status</TableHead>
                                <TableHead className="text-gray-400">Provider</TableHead>
                                <TableHead className="text-right text-gray-400">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {ownedNumbers.map((num) => (
                                <TableRow key={num.id} className="border-white/10 hover:bg-white/5">
                                    <TableCell className="font-mono text-white">{num.number}</TableCell>
                                    <TableCell className="text-white">{num.name || 'Unnamed'}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="border-[#00FF94]/50 text-[#00FF94] bg-[#00FF94]/10">
                                            Active
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-gray-400 capitalize">{num.provider}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">Configure</Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                ) : (
                    <div className="text-center py-12">
                         <Phone className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                         <h3 className="text-lg font-medium text-white">No Numbers Yet</h3>
                         <p className="text-gray-400 mb-6">Get started by purchasing your first phone number.</p>
                         <Button onClick={() => setActiveTab('buy')} className="bg-[#00FF94] text-black">Buy Number</Button>
                    </div>
                )}
            </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-3">
             {/* Search Panel */}
             <Card className="col-span-1 border-white/10 bg-black/50 backdrop-blur-xl h-fit">
                <CardHeader>
                    <CardTitle className="text-white">Search Inventory</CardTitle>
                    <CardDescription>Find a local number for your business.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Area Code</label>
                        <Input 
                            placeholder="e.g. 415" 
                            value={searchAreaCode}
                            onChange={(e) => setSearchAreaCode(e.target.value)}
                            className="bg-black/40 border-white/10 text-white"
                        />
                    </div>
                    <Button 
                        onClick={handleSearch} 
                        className="w-full bg-white text-black hover:bg-gray-200"
                        disabled={isLoading}
                    >
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                        Search Numbers
                    </Button>
                </CardContent>
             </Card>

             {/* Results Panel */}
             <Card className="col-span-2 border-white/10 bg-black/50 backdrop-blur-xl">
                 <CardHeader>
                    <CardTitle className="text-white">Available Numbers</CardTitle>
                    <CardDescription>Select a number to provision instantly.</CardDescription>
                 </CardHeader>
                 <CardContent>
                    {searchResults.length > 0 ? (
                        <div className="grid gap-4 sm:grid-cols-2">
                            {searchResults.map((num) => (
                                <div key={num.e164} className="p-4 rounded-xl border border-white/10 bg-white/5 flex justify-between items-center hover:border-[#00FF94]/50 transition-colors cursor-pointer group">
                                    <div>
                                        <div className="text-lg font-mono font-bold text-white group-hover:text-[#00FF94]">{num.friendlyName}</div>
                                        <div className="text-sm text-gray-400">{num.location}</div>
                                        {num.vanity && <Badge className="mt-2 bg-purple-500/20 text-purple-300 border-purple-500/50">💎 Premier</Badge>}
                                    </div>
                                    <Button 
                                        size="sm"
                                        className="bg-white text-black group-hover:bg-[#00FF94]"
                                        onClick={() => handleBuy(num)}
                                        disabled={!!purchasingNumber}
                                    >
                                        {purchasingNumber === num.e164 ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <>
                                                Buy ${num.cost}
                                            </>
                                        )}
                                    </Button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center p-12 text-gray-500 border-2 border-dashed border-white/5 rounded-xl">
                            <Search className="h-8 w-8 mb-2 opacity-50" />
                            <p>Enter an area code to verify availability.</p>
                        </div>
                    )}
                 </CardContent>
             </Card>
        </div>
      )}
    </div>
  );
}
