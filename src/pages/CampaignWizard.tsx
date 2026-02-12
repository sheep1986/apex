import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/services/supabase-client';
import { AlertTriangle, CheckCircle, FileText, Loader2, Upload } from 'lucide-react';
// @ts-ignore
import Papa from 'papaparse';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export const CampaignWizard = () => {
    const { organization } = useSupabaseAuth();
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form Stats
    const [name, setName] = useState('');
    const [script, setScript] = useState('');
    const [csvFile, setCsvFile] = useState<File | null>(null);
    const [parsedContacts, setParsedContacts] = useState<any[]>([]);
    const [validationStats, setValidationStats] = useState({ valid: 0, invalid: 0 });

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setCsvFile(file);
        
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                const contacts = results.data.map((row: any) => {
                    // Try to find phone column
                    const phone = row.phone || row.Phone || row.PHONE || row.mobile || row.Mobile || '';
                    const name = row.name || row.Name || row.NAME || '';
                    
                    // Simple Validation (E.164-ish)
                    const isValid = phone.replace(/[^0-9+]/g, '').length >= 10;
                    return { ...row, phone, name, isValid };
                });

                setValidationStats({
                    valid: contacts.filter(c => c.isValid).length,
                    invalid: contacts.filter(c => !c.isValid).length
                });
                setParsedContacts(contacts);
            },
            error: (err) => setError('Failed to parse CSV: ' + err.message)
        });
    };

    const handleSubmit = async () => {
        if (!organization?.id) return;
        setLoading(true);
        setError(null);

        try {
            // 1. Create Campaign
            const { data: campaign, error: campError } = await supabase
                .from('campaigns')
                .insert({
                    organization_id: organization?.id,
                    name,
                    status: 'draft',
                    type: 'voice_broadcast',
                    script_config: { prompt: script },
                    concurrency_limit: 1 // Safety default
                } as any)
                .select()
                .single();

            if (campError) throw campError;
            if (!campaign) throw new Error('Failed to create campaign');

            // 2. Process Contacts & Items
            // In a real app, this should be chunked or handled backend for large files.
            // For MVP (Phase 3.3), we do client-side batching.
            
            const validContacts = parsedContacts.filter(c => c.isValid);
            const batchSize = 50;
            
            for (let i = 0; i < validContacts.length; i += batchSize) {
                const batch = validContacts.slice(i, i + batchSize);
                
                // Upsert Contacts first (to get IDs) behavior:
                // We actually need IDs. If they exist, get them. If not, create.
                // This is complex client-side. 
                // Simplified Strategy: Insert into 'contacts' with ON CONFLICT DO NOTHING (if e164 unique).
                // But we don't have e164 unique constraint on contacts yet?
                // Let's assume we create items directly if we don't care about persistent CRM contact linkage yet,
                // BUT the schema requires contact_id.
                
                // FAST PATH: Just insert into campaign_items with raw data if we relax schema?
                // NO, Schema requires contact_id.
                
                // Correct Path: Sequential Upsert.
                const contactsToUpsert = batch.map(c => ({
                    organization_id: organization?.id,
                    name: c.name, // Use 'name' not 'first_name' per schema
                    phone_e164: c.phone
                } as any));

                const itemPromises = batch.map(async (c) => {
                    // Try find by E.164
                    let { data: existing } = await supabase
                        .from('contacts')
                        .select('id')
                        .eq('organization_id', organization.id)
                        .eq('phone_e164', c.phone) // Correct column
                        .maybeSingle();
                        
                    if (!existing) {
                        const { data: newContact, error: createErr } = await supabase
                            .from('contacts')
                            .insert({
                                organization_id: organization.id,
                                name: c.name,
                                phone_e164: c.phone
                            } as any)
                            .select('id')
                            .single();
                        if (createErr) console.error('Contact Create Fail', createErr);
                        existing = newContact;
                    }

                     if (existing?.id) {
                         return {
                             organization_id: organization.id,
                             campaign_id: (campaign as any).id,
                             contact_id: (existing as any).id,
                             status: 'pending'
                         };
                    }
                    return null;
                });

                const items = (await Promise.all(itemPromises)).filter(Boolean);
                
                if (items.length > 0) {
                    const { error: itemError } = await supabase
                        .from('campaign_items')
                        .insert(items as any);
                    if (itemError) throw itemError;
                }
            }

            navigate(`/campaigns/${(campaign as any).id}`);

        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Failed to create campaign');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-8">
            <div>
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400">
                    New Campaign
                </h1>
                <p className="text-gray-400">Launch a high-volume outbound voice campaign.</p>
            </div>

            {/* Steps Visual */}
            <div className="flex gap-4 border-b border-gray-800 pb-4">
                <div onClick={() => setStep(1)} className={`cursor-pointer ${step === 1 ? 'text-emerald-400 font-bold' : 'text-gray-500'}`}>1. Configuration</div>
                <div onClick={() => step > 1 && setStep(2)} className={`cursor-pointer ${step === 2 ? 'text-emerald-400 font-bold' : 'text-gray-500'}`}>2. Audience</div>
                <div className={`text-gray-600`}>3. Review</div>
            </div>

            {error && (
                <Alert variant="destructive" className="bg-red-900/20 border-red-900">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {step === 1 && (
                <Card className="bg-gray-900 border-gray-800">
                    <CardHeader>
                        <CardTitle>Campaign Details</CardTitle>
                        <CardDescription>Configure the voice agent's behavior.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Campaign Name</Label>
                            <Input 
                                placeholder="e.g. Q1 Sales Outreach" 
                                value={name} 
                                onChange={e => setName(e.target.value)} 
                                className="bg-gray-950 border-gray-800"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Agent Script / Instructions</Label>
                            <Textarea 
                                placeholder="You are calling to confirm an appointment..." 
                                value={script}
                                onChange={e => setScript(e.target.value)}
                                className="bg-gray-950 border-gray-800 min-h-[150px]"
                            />
                        </div>
                        <Button 
                            className="w-full bg-emerald-600 hover:bg-emerald-700"
                            onClick={() => { if(name && script) setStep(2); }}
                            disabled={!name || !script}
                        >
                            Next: Upload Contacts
                        </Button>
                    </CardContent>
                </Card>
            )}

            {step === 2 && (
                <Card className="bg-gray-900 border-gray-800">
                    <CardHeader>
                        <CardTitle>Upload Audience</CardTitle>
                        <CardDescription>Upload a CSV with 'name' and 'phone' columns.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="border-2 border-dashed border-gray-700 rounded-xl p-8 text-center hover:border-emerald-500 transition-colors">
                            <input 
                                type="file" 
                                accept=".csv"
                                onChange={handleFileUpload}
                                className="hidden"
                                id="csv-upload"
                            />
                            <label htmlFor="csv-upload" className="cursor-pointer flex flex-col items-center gap-2">
                                <Upload className="h-8 w-8 text-gray-400" />
                                <span className="text-gray-200 font-medium">Click to upload CSV</span>
                                <span className="text-gray-500 text-sm">Required columns: name, phone</span>
                            </label>
                        </div>

                        {csvFile && (
                            <div className="bg-gray-950 p-4 rounded-lg flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <FileText className="text-blue-400" />
                                    <div>
                                        <div className="font-medium">{csvFile.name}</div>
                                        <div className="text-xs text-gray-500">{(csvFile.size / 1024).toFixed(1)} KB</div>
                                    </div>
                                </div>
                                <div className="flex gap-4 text-sm">
                                    <span className="text-emerald-400 flex items-center gap-1">
                                        <CheckCircle className="h-3 w-3" /> {validationStats.valid} Valid
                                    </span>
                                    {validationStats.invalid > 0 && (
                                        <span className="text-red-400 flex items-center gap-1">
                                            <AlertTriangle className="h-3 w-3" /> {validationStats.invalid} Invalid
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="flex gap-2">
                             <Button variant="outline" onClick={() => setStep(1)} className="w-1/3">Back</Button>
                             <Button 
                                className="w-2/3 bg-emerald-600 hover:bg-emerald-700" 
                                disabled={!parsedContacts.length || loading}
                                onClick={handleSubmit}
                            >
                                {loading ? <Loader2 className="animate-spin" /> : `Launch Campaign (${validationStats.valid} contacts)`}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};
