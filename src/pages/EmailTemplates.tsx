import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/services/supabase-client';
import {
  Copy,
  Edit3,
  Eye,
  FileText,
  Loader2,
  Mail,
  Plus,
  Search,
  Trash2,
  Variable,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body_html: string;
  body_text: string;
  variables: string[];
  category: string;
  is_active: boolean;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

const CATEGORIES = [
  { value: 'general', label: 'General' },
  { value: 'follow_up', label: 'Follow Up' },
  { value: 'appointment', label: 'Appointment' },
  { value: 'welcome', label: 'Welcome' },
  { value: 'nurture', label: 'Nurture' },
  { value: 're_engagement', label: 'Re-Engagement' },
];

const AVAILABLE_VARIABLES = [
  '{{first_name}}',
  '{{last_name}}',
  '{{company}}',
  '{{email}}',
  '{{phone}}',
  '{{deal_value}}',
  '{{campaign_name}}',
  '{{agent_name}}',
  '{{meeting_date}}',
  '{{meeting_time}}',
];

const CATEGORY_COLORS: Record<string, string> = {
  general: 'text-gray-400 border-gray-600',
  follow_up: 'text-blue-400 border-blue-600',
  appointment: 'text-purple-400 border-purple-600',
  welcome: 'text-emerald-400 border-emerald-600',
  nurture: 'text-amber-400 border-amber-600',
  re_engagement: 'text-pink-400 border-pink-600',
};

export default function EmailTemplates() {
  const { organization } = useSupabaseAuth();
  const { toast } = useToast();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');

  // Editor state
  const [showEditor, setShowEditor] = useState(false);
  const [editing, setEditing] = useState<EmailTemplate | null>(null);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [form, setForm] = useState({
    name: '',
    subject: '',
    body_html: '',
    body_text: '',
    category: 'general',
  });

  const fetchTemplates = useCallback(async () => {
    if (!organization?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .eq('organization_id', organization.id)
        .order('updated_at', { ascending: false });
      if (error) throw error;
      setTemplates(data || []);
    } catch {
      toast({ title: 'Error', description: 'Failed to load templates.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [organization?.id, toast]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', subject: '', body_html: '', body_text: '', category: 'general' });
    setShowEditor(true);
    setShowPreview(false);
  };

  const openEdit = (template: EmailTemplate) => {
    setEditing(template);
    setForm({
      name: template.name,
      subject: template.subject,
      body_html: template.body_html,
      body_text: template.body_text || '',
      category: template.category,
    });
    setShowEditor(true);
    setShowPreview(false);
  };

  const saveTemplate = async () => {
    if (!form.name.trim() || !form.subject.trim() || !form.body_html.trim() || !organization?.id) return;

    // Extract variables from content
    const variableRegex = /\{\{(\w+)\}\}/g;
    const foundVars = new Set<string>();
    let match;
    const content = form.subject + ' ' + form.body_html;
    while ((match = variableRegex.exec(content)) !== null) {
      foundVars.add(`{{${match[1]}}}`);
    }

    setSaving(true);
    try {
      if (editing) {
        const { error } = await supabase
          .from('email_templates')
          .update({
            name: form.name.trim(),
            subject: form.subject.trim(),
            body_html: form.body_html.trim(),
            body_text: form.body_text.trim(),
            category: form.category,
            variables: Array.from(foundVars),
            updated_at: new Date().toISOString(),
          })
          .eq('id', editing.id);
        if (error) throw error;
        toast({ title: 'Updated', description: 'Template updated successfully.' });
      } else {
        const { error } = await supabase.from('email_templates').insert({
          organization_id: organization.id,
          name: form.name.trim(),
          subject: form.subject.trim(),
          body_html: form.body_html.trim(),
          body_text: form.body_text.trim(),
          category: form.category,
          variables: Array.from(foundVars),
        });
        if (error) throw error;
        toast({ title: 'Created', description: 'Template created successfully.' });
      }
      setShowEditor(false);
      fetchTemplates();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to save template.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const deleteTemplate = async (id: string) => {
    await supabase.from('email_templates').delete().eq('id', id);
    setTemplates(prev => prev.filter(t => t.id !== id));
    toast({ title: 'Deleted', description: 'Template removed.' });
  };

  const duplicateTemplate = async (template: EmailTemplate) => {
    if (!organization?.id) return;
    const { error } = await supabase.from('email_templates').insert({
      organization_id: organization.id,
      name: `${template.name} (Copy)`,
      subject: template.subject,
      body_html: template.body_html,
      body_text: template.body_text,
      category: template.category,
      variables: template.variables,
    });
    if (error) {
      toast({ title: 'Error', description: 'Failed to duplicate.', variant: 'destructive' });
    } else {
      toast({ title: 'Duplicated', description: 'Template copied.' });
      fetchTemplates();
    }
  };

  const insertVariable = (variable: string) => {
    setForm(prev => ({ ...prev, body_html: prev.body_html + variable }));
  };

  const filtered = templates.filter(t => {
    const matchesSearch = !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.subject.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = filterCategory === 'all' || t.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

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
              <Mail className="h-8 w-8 text-purple-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Email Templates</h1>
              <p className="text-gray-400">Create and manage reusable email templates with variables</p>
            </div>
          </div>
          <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            New Template
          </Button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search templates..."
              className="pl-10 border-gray-700 bg-gray-900 text-white"
            />
          </div>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-[160px] border-gray-700 bg-gray-900 text-white">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700">
              <SelectItem value="all">All Categories</SelectItem>
              {CATEGORIES.map(c => (
                <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Templates Grid */}
        {filtered.length === 0 ? (
          <Card className="border-gray-800 bg-gray-900">
            <CardContent className="py-16 text-center">
              <FileText className="mx-auto mb-4 h-16 w-16 text-gray-600" />
              <h3 className="text-lg font-medium text-white">No templates found</h3>
              <p className="mx-auto max-w-sm text-sm text-gray-400 mt-1">
                Create email templates with variables like {'{{first_name}}'} for personalized outreach.
              </p>
              <Button className="mt-4 bg-emerald-600 hover:bg-emerald-700" onClick={openCreate}>
                <Plus className="mr-2 h-4 w-4" /> Create First Template
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((template) => (
              <Card key={template.id} className="border-gray-800 bg-gray-900 hover:border-gray-700 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-sm font-semibold text-white truncate">
                        {template.name}
                      </CardTitle>
                      <p className="text-xs text-gray-500 mt-1 truncate">{template.subject}</p>
                    </div>
                    <Badge variant="outline" className={`text-[10px] capitalize ml-2 ${CATEGORY_COLORS[template.category] || ''}`}>
                      {template.category.replace('_', ' ')}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="text-xs text-gray-500 mb-3 line-clamp-2"
                    dangerouslySetInnerHTML={{ __html: template.body_html.replace(/<[^>]*>/g, '').slice(0, 120) + '...' }}
                  />

                  {template.variables.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {template.variables.slice(0, 4).map((v, i) => (
                        <span key={i} className="text-[10px] px-1.5 py-0.5 bg-gray-800 text-gray-400 rounded">
                          {v}
                        </span>
                      ))}
                      {template.variables.length > 4 && (
                        <span className="text-[10px] text-gray-500">+{template.variables.length - 4} more</span>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Used {template.usage_count} times</span>
                    <span>{new Date(template.updated_at).toLocaleDateString()}</span>
                  </div>

                  <div className="flex items-center gap-1 mt-3 pt-3 border-t border-gray-800">
                    <Button size="sm" variant="ghost" className="text-gray-400 hover:text-white h-7 px-2" onClick={() => openEdit(template)}>
                      <Edit3 className="h-3 w-3 mr-1" /> Edit
                    </Button>
                    <Button size="sm" variant="ghost" className="text-gray-400 hover:text-white h-7 px-2" onClick={() => duplicateTemplate(template)}>
                      <Copy className="h-3 w-3 mr-1" /> Copy
                    </Button>
                    <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-300 h-7 px-2 ml-auto" onClick={() => deleteTemplate(template.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Editor Modal */}
      {showEditor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-lg border border-gray-800 bg-gray-900 p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">
                {editing ? 'Edit Template' : 'Create Template'}
              </h3>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPreview(!showPreview)}
                  className="text-gray-400 hover:text-white"
                >
                  <Eye className="h-4 w-4 mr-1" />
                  {showPreview ? 'Editor' : 'Preview'}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setShowEditor(false)} className="text-gray-400 hover:text-white">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {showPreview ? (
              <div className="space-y-4">
                <div className="rounded-lg border border-gray-700 bg-white p-6">
                  <div className="text-sm text-gray-500 mb-2">Subject: {form.subject || '(no subject)'}</div>
                  <div className="text-sm text-gray-800" dangerouslySetInnerHTML={{ __html: form.body_html || '<p>No content</p>' }} />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-white">Template Name</Label>
                    <Input
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="mt-1 border-gray-700 bg-gray-800 text-white"
                      placeholder="Welcome Email"
                    />
                  </div>
                  <div>
                    <Label className="text-white">Category</Label>
                    <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                      <SelectTrigger className="mt-1 border-gray-700 bg-gray-800 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700">
                        {CATEGORIES.map(c => (
                          <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label className="text-white">Subject Line</Label>
                  <Input
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    className="mt-1 border-gray-700 bg-gray-800 text-white"
                    placeholder="Hi {{first_name}}, following up on our conversation"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <Label className="text-white">Email Body (HTML)</Label>
                    <div className="flex items-center gap-1">
                      <Variable className="h-3 w-3 text-gray-500" />
                      <span className="text-[10px] text-gray-500">Click to insert:</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {AVAILABLE_VARIABLES.map((v) => (
                      <button
                        key={v}
                        onClick={() => insertVariable(v)}
                        className="text-[10px] px-2 py-1 bg-gray-800 text-emerald-400 rounded hover:bg-gray-700 transition-colors border border-gray-700"
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                  <Textarea
                    value={form.body_html}
                    onChange={(e) => setForm({ ...form, body_html: e.target.value })}
                    className="border-gray-700 bg-gray-800 text-white font-mono text-sm"
                    rows={12}
                    placeholder={`<h2>Hi {{first_name}},</h2>\n<p>Thank you for your interest in our services...</p>`}
                  />
                </div>

                <div>
                  <Label className="text-white">Plain Text Version (optional)</Label>
                  <Textarea
                    value={form.body_text}
                    onChange={(e) => setForm({ ...form, body_text: e.target.value })}
                    className="mt-1 border-gray-700 bg-gray-800 text-white"
                    rows={4}
                    placeholder="Plain text fallback for email clients that don't support HTML..."
                  />
                </div>
              </div>
            )}

            <div className="mt-6 flex space-x-3">
              <Button variant="outline" onClick={() => setShowEditor(false)} className="flex-1 border-gray-700">
                Cancel
              </Button>
              <Button
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                onClick={saveTemplate}
                disabled={saving || !form.name.trim() || !form.subject.trim() || !form.body_html.trim()}
              >
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
                {saving ? 'Saving...' : editing ? 'Update Template' : 'Create Template'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
