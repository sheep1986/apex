import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/services/supabase-client';
import {
  Globe,
  Loader2,
  Palette,
  Save,
  Upload,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

interface BrandingSettings {
  logo_url: string;
  favicon_url: string;
  primary_color: string;
  accent_color: string;
  company_name: string;
  custom_domain: string;
  email_sender_name: string;
  login_background_url: string;
}

const DEFAULT_BRANDING: BrandingSettings = {
  logo_url: '',
  favicon_url: '',
  primary_color: '#10b981',
  accent_color: '#3b82f6',
  company_name: '',
  custom_domain: '',
  email_sender_name: '',
  login_background_url: '',
};

export default function AgencyBranding() {
  const { organization } = useSupabaseAuth();
  const { toast } = useToast();
  const [branding, setBranding] = useState<BrandingSettings>(DEFAULT_BRANDING);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const fetchBranding = useCallback(async () => {
    if (!organization?.id) return;
    setLoading(true);
    try {
      const { data } = await supabase
        .from('organizations')
        .select('settings, name')
        .eq('id', organization.id)
        .single();
      if (data?.settings?.branding) {
        setBranding({ ...DEFAULT_BRANDING, ...data.settings.branding, company_name: data.name || '' });
      } else {
        setBranding(prev => ({ ...prev, company_name: data?.name || '' }));
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to load branding settings.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [organization?.id, toast]);

  useEffect(() => {
    fetchBranding();
  }, [fetchBranding]);

  const saveBranding = async () => {
    if (!organization?.id) return;
    setSaving(true);
    try {
      const { data: org } = await supabase
        .from('organizations')
        .select('settings')
        .eq('id', organization.id)
        .single();

      const updatedSettings = {
        ...(org?.settings || {}),
        branding: {
          logo_url: branding.logo_url,
          favicon_url: branding.favicon_url,
          primary_color: branding.primary_color,
          accent_color: branding.accent_color,
          custom_domain: branding.custom_domain,
          email_sender_name: branding.email_sender_name,
          login_background_url: branding.login_background_url,
        },
      };

      const { error } = await supabase
        .from('organizations')
        .update({ settings: updatedSettings, name: branding.company_name })
        .eq('id', organization.id);

      if (error) throw error;
      toast({ title: 'Saved', description: 'Branding settings updated successfully.' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to save.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !organization?.id) return;
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: 'Error', description: 'Logo must be under 2MB.', variant: 'destructive' });
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `branding/${organization.id}/logo.${ext}`;
      const { error } = await supabase.storage.from('public').upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('public').getPublicUrl(path);
      setBranding(prev => ({ ...prev, logo_url: publicUrl }));
      toast({ title: 'Uploaded', description: 'Logo uploaded successfully.' });
    } catch {
      toast({ title: 'Error', description: 'Failed to upload logo.', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="w-full space-y-6 px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-purple-500/20 rounded-lg">
              <Palette className="h-8 w-8 text-purple-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Agency Branding</h1>
              <p className="text-gray-400">Customize the look and feel for your clients</p>
            </div>
          </div>
          <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={saveBranding} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Brand Identity */}
          <Card className="border-gray-800 bg-gray-900">
            <CardHeader>
              <CardTitle className="text-white">Brand Identity</CardTitle>
              <CardDescription>Your company name and logo</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-white">Company Name</Label>
                <Input
                  value={branding.company_name}
                  onChange={(e) => setBranding(prev => ({ ...prev, company_name: e.target.value }))}
                  className="mt-1 border-gray-700 bg-gray-800 text-white"
                  placeholder="Your Agency Name"
                />
              </div>

              <div>
                <Label className="text-white">Logo</Label>
                <div className="mt-1 flex items-center gap-4">
                  {branding.logo_url && (
                    <img src={branding.logo_url} alt="Logo" className="h-12 w-12 rounded-lg object-contain bg-gray-800 p-1" />
                  )}
                  <label className="cursor-pointer">
                    <div className="flex items-center gap-2 rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-sm text-gray-300 hover:bg-gray-700">
                      <Upload className="h-4 w-4" />
                      {uploading ? 'Uploading...' : 'Upload Logo'}
                    </div>
                    <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                  </label>
                </div>
                <p className="text-xs text-gray-500 mt-1">PNG, JPG, or SVG. Max 2MB. Recommended 200x200px.</p>
              </div>

              <div>
                <Label className="text-white">Email Sender Name</Label>
                <Input
                  value={branding.email_sender_name}
                  onChange={(e) => setBranding(prev => ({ ...prev, email_sender_name: e.target.value }))}
                  className="mt-1 border-gray-700 bg-gray-800 text-white"
                  placeholder="Your Agency"
                />
                <p className="text-xs text-gray-500 mt-1">Used as the "From" name in emails sent to clients.</p>
              </div>
            </CardContent>
          </Card>

          {/* Colors */}
          <Card className="border-gray-800 bg-gray-900">
            <CardHeader>
              <CardTitle className="text-white">Brand Colors</CardTitle>
              <CardDescription>Customize your color scheme</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-white">Primary Color</Label>
                <div className="mt-1 flex items-center gap-3">
                  <input
                    type="color"
                    value={branding.primary_color}
                    onChange={(e) => setBranding(prev => ({ ...prev, primary_color: e.target.value }))}
                    className="h-10 w-10 cursor-pointer rounded border border-gray-700 bg-gray-800"
                  />
                  <Input
                    value={branding.primary_color}
                    onChange={(e) => setBranding(prev => ({ ...prev, primary_color: e.target.value }))}
                    className="w-32 border-gray-700 bg-gray-800 text-white font-mono"
                    placeholder="#10b981"
                  />
                  <div className="h-10 flex-1 rounded-lg" style={{ backgroundColor: branding.primary_color }} />
                </div>
              </div>

              <div>
                <Label className="text-white">Accent Color</Label>
                <div className="mt-1 flex items-center gap-3">
                  <input
                    type="color"
                    value={branding.accent_color}
                    onChange={(e) => setBranding(prev => ({ ...prev, accent_color: e.target.value }))}
                    className="h-10 w-10 cursor-pointer rounded border border-gray-700 bg-gray-800"
                  />
                  <Input
                    value={branding.accent_color}
                    onChange={(e) => setBranding(prev => ({ ...prev, accent_color: e.target.value }))}
                    className="w-32 border-gray-700 bg-gray-800 text-white font-mono"
                    placeholder="#3b82f6"
                  />
                  <div className="h-10 flex-1 rounded-lg" style={{ backgroundColor: branding.accent_color }} />
                </div>
              </div>

              {/* Preview */}
              <div className="mt-4 rounded-lg border border-gray-700 bg-gray-800 p-4">
                <p className="text-xs text-gray-500 mb-2">Preview</p>
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg" style={{ backgroundColor: branding.primary_color }} />
                  <div>
                    <p className="text-sm font-bold text-white">{branding.company_name || 'Your Agency'}</p>
                    <p className="text-xs" style={{ color: branding.accent_color }}>Dashboard</p>
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <div className="h-8 rounded-lg px-4 flex items-center text-xs text-white font-medium" style={{ backgroundColor: branding.primary_color }}>
                    Primary Button
                  </div>
                  <div className="h-8 rounded-lg px-4 flex items-center text-xs text-white font-medium" style={{ backgroundColor: branding.accent_color }}>
                    Accent Button
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Custom Domain */}
          <Card className="border-gray-800 bg-gray-900 lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center text-white">
                <Globe className="mr-2 h-5 w-5" />
                Custom Domain
              </CardTitle>
              <CardDescription>Use your own domain for the platform</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-white">Custom Domain</Label>
                <Input
                  value={branding.custom_domain}
                  onChange={(e) => setBranding(prev => ({ ...prev, custom_domain: e.target.value }))}
                  className="mt-1 border-gray-700 bg-gray-800 text-white"
                  placeholder="app.youragency.com"
                />
              </div>

              <div className="rounded-lg border border-gray-700 bg-gray-800 p-4">
                <h4 className="text-sm font-medium text-white mb-2">DNS Configuration</h4>
                <p className="text-xs text-gray-400 mb-3">Add the following CNAME record to your DNS provider:</p>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="text-gray-500">Type</div>
                  <div className="text-gray-500">Name</div>
                  <div className="text-gray-500">Value</div>
                  <div className="text-white font-mono">CNAME</div>
                  <div className="text-white font-mono">{branding.custom_domain || 'app'}</div>
                  <div className="text-white font-mono">platform.trinityai.com</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
