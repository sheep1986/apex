import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
  ArrowDown,
  Clock,
  GripVertical,
  Loader2,
  Mail,
  MessageSquare,
  Phone,
  Plus,
  Save,
  Trash2,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

interface SequenceStep {
  id: string;
  step_order: number;
  step_type: 'call' | 'sms' | 'email' | 'wait';
  config: Record<string, any>;
}

interface SequenceBuilderProps {
  campaignId: string;
  sequenceId?: string;
  onSave?: (sequenceId: string) => void;
}

const STEP_TYPES = [
  { value: 'call', label: 'Voice Call', icon: Phone, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' },
  { value: 'sms', label: 'SMS', icon: MessageSquare, color: 'text-blue-400 bg-blue-500/10 border-blue-500/30' },
  { value: 'email', label: 'Email', icon: Mail, color: 'text-purple-400 bg-purple-500/10 border-purple-500/30' },
  { value: 'wait', label: 'Wait/Delay', icon: Clock, color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' },
];

const getStepMeta = (type: string) => STEP_TYPES.find(s => s.value === type) || STEP_TYPES[0];

export default function SequenceBuilder({ campaignId, sequenceId, onSave }: SequenceBuilderProps) {
  const { organization } = useSupabaseAuth();
  const { toast } = useToast();
  const [steps, setSteps] = useState<SequenceStep[]>([]);
  const [sequenceName, setSequenceName] = useState('');
  const [currentSequenceId, setCurrentSequenceId] = useState(sequenceId || '');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [templates, setTemplates] = useState<{ id: string; name: string; subject: string }[]>([]);

  // Load email templates for the template selector
  const loadTemplates = useCallback(async () => {
    if (!organization?.id) return;
    const { data } = await supabase
      .from('email_templates')
      .select('id, name, subject')
      .eq('organization_id', organization.id)
      .eq('is_active', true);
    setTemplates(data || []);
  }, [organization?.id]);

  // Load existing sequence
  const loadSequence = useCallback(async () => {
    if (!currentSequenceId) return;
    setLoading(true);
    try {
      const { data: seq } = await supabase
        .from('campaign_sequences')
        .select('name')
        .eq('id', currentSequenceId)
        .single();
      if (seq) setSequenceName(seq.name);

      const { data: stepData } = await supabase
        .from('campaign_sequence_steps')
        .select('*')
        .eq('sequence_id', currentSequenceId)
        .order('step_order', { ascending: true });
      setSteps((stepData || []).map(s => ({
        id: s.id,
        step_order: s.step_order,
        step_type: s.step_type,
        config: s.config || {},
      })));
    } catch {
      toast({ title: 'Error', description: 'Failed to load sequence.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [currentSequenceId, toast]);

  useEffect(() => {
    loadTemplates();
    loadSequence();
  }, [loadTemplates, loadSequence]);

  const addStep = (type: 'call' | 'sms' | 'email' | 'wait') => {
    const defaultConfigs: Record<string, Record<string, any>> = {
      call: { assistant_id: '' },
      sms: { body: '' },
      email: { template_id: '', subject: '', body: '' },
      wait: { duration_hours: 24 },
    };

    const newStep: SequenceStep = {
      id: `temp_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      step_order: steps.length + 1,
      step_type: type,
      config: defaultConfigs[type],
    };
    setSteps(prev => [...prev, newStep]);
  };

  const updateStepConfig = (index: number, key: string, value: any) => {
    setSteps(prev => prev.map((s, i) =>
      i === index ? { ...s, config: { ...s.config, [key]: value } } : s
    ));
  };

  const removeStep = (index: number) => {
    setSteps(prev => prev.filter((_, i) => i !== index).map((s, i) => ({ ...s, step_order: i + 1 })));
  };

  const moveStep = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= steps.length) return;
    setSteps(prev => {
      const newSteps = [...prev];
      const [moved] = newSteps.splice(fromIndex, 1);
      newSteps.splice(toIndex, 0, moved);
      return newSteps.map((s, i) => ({ ...s, step_order: i + 1 }));
    });
  };

  const saveSequence = async () => {
    if (!organization?.id || !sequenceName.trim()) {
      toast({ title: 'Error', description: 'Enter a sequence name.', variant: 'destructive' });
      return;
    }
    if (steps.length === 0) {
      toast({ title: 'Error', description: 'Add at least one step.', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      let seqId = currentSequenceId;

      if (!seqId) {
        // Create new sequence
        const { data, error } = await supabase
          .from('campaign_sequences')
          .insert({
            campaign_id: campaignId,
            organization_id: organization.id,
            name: sequenceName.trim(),
          })
          .select('id')
          .single();
        if (error) throw error;
        seqId = data.id;
        setCurrentSequenceId(seqId);
      } else {
        // Update name
        await supabase
          .from('campaign_sequences')
          .update({ name: sequenceName.trim(), updated_at: new Date().toISOString() })
          .eq('id', seqId);
      }

      // Delete existing steps and re-insert
      await supabase
        .from('campaign_sequence_steps')
        .delete()
        .eq('sequence_id', seqId);

      const stepsToInsert = steps.map((s, i) => ({
        sequence_id: seqId,
        step_order: i + 1,
        step_type: s.step_type,
        config: s.config,
      }));

      const { error: stepsError } = await supabase
        .from('campaign_sequence_steps')
        .insert(stepsToInsert);

      if (stepsError) throw stepsError;

      toast({ title: 'Saved', description: 'Sequence saved successfully.' });
      onSave?.(seqId);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to save sequence.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Sequence Name */}
      <div className="flex items-center gap-3">
        <Input
          value={sequenceName}
          onChange={(e) => setSequenceName(e.target.value)}
          placeholder="Sequence name (e.g., 3-Step Follow-Up)"
          className="border-gray-700 bg-gray-800 text-white flex-1"
        />
        <Button
          className="bg-emerald-600 hover:bg-emerald-700"
          onClick={saveSequence}
          disabled={saving || !sequenceName.trim() || steps.length === 0}
        >
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          {saving ? 'Saving...' : 'Save'}
        </Button>
      </div>

      {/* Steps */}
      <div className="space-y-2">
        {steps.map((step, index) => {
          const meta = getStepMeta(step.step_type);
          const StepIcon = meta.icon;

          return (
            <div key={step.id}>
              <Card className={`border ${meta.color.split(' ').find(c => c.startsWith('border-')) || 'border-gray-700'} bg-gray-900`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {/* Drag handle & order */}
                    <div className="flex flex-col items-center gap-1 pt-1">
                      <GripVertical className="h-4 w-4 text-gray-600 cursor-grab" />
                      <span className="text-[10px] text-gray-500 font-mono">#{index + 1}</span>
                      <div className="flex flex-col gap-0.5 mt-1">
                        <button
                          onClick={() => moveStep(index, index - 1)}
                          className="text-gray-500 hover:text-white text-[10px]"
                          disabled={index === 0}
                        >▲</button>
                        <button
                          onClick={() => moveStep(index, index + 1)}
                          className="text-gray-500 hover:text-white text-[10px]"
                          disabled={index === steps.length - 1}
                        >▼</button>
                      </div>
                    </div>

                    {/* Step icon */}
                    <div className={`p-2 rounded-lg ${meta.color}`}>
                      <StepIcon className="h-5 w-5" />
                    </div>

                    {/* Step config */}
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={`text-[10px] capitalize ${meta.color}`}>
                          {meta.label}
                        </Badge>
                      </div>

                      {step.step_type === 'call' && (
                        <div>
                          <Label className="text-xs text-gray-400">Assistant ID</Label>
                          <Input
                            value={step.config.assistant_id || ''}
                            onChange={(e) => updateStepConfig(index, 'assistant_id', e.target.value)}
                            className="mt-1 h-8 text-sm border-gray-700 bg-gray-800 text-white"
                            placeholder="Enter assistant ID"
                          />
                        </div>
                      )}

                      {step.step_type === 'sms' && (
                        <div>
                          <Label className="text-xs text-gray-400">SMS Message</Label>
                          <Textarea
                            value={step.config.body || ''}
                            onChange={(e) => updateStepConfig(index, 'body', e.target.value)}
                            className="mt-1 text-sm border-gray-700 bg-gray-800 text-white"
                            rows={2}
                            placeholder="Hi {{first_name}}, just following up..."
                          />
                          <p className="text-[10px] text-gray-500 mt-1">
                            {(step.config.body || '').length}/160 chars ({Math.ceil((step.config.body || '').length / 160) || 1} segment{Math.ceil((step.config.body || '').length / 160) > 1 ? 's' : ''})
                          </p>
                        </div>
                      )}

                      {step.step_type === 'email' && (
                        <div className="space-y-2">
                          <div>
                            <Label className="text-xs text-gray-400">Email Template</Label>
                            <Select
                              value={step.config.template_id || ''}
                              onValueChange={(v) => updateStepConfig(index, 'template_id', v)}
                            >
                              <SelectTrigger className="mt-1 h-8 text-sm border-gray-700 bg-gray-800 text-white">
                                <SelectValue placeholder="Select template..." />
                              </SelectTrigger>
                              <SelectContent className="bg-gray-800 border-gray-700">
                                <SelectItem value="custom">Custom (no template)</SelectItem>
                                {templates.map(t => (
                                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          {(!step.config.template_id || step.config.template_id === 'custom') && (
                            <>
                              <div>
                                <Label className="text-xs text-gray-400">Subject</Label>
                                <Input
                                  value={step.config.subject || ''}
                                  onChange={(e) => updateStepConfig(index, 'subject', e.target.value)}
                                  className="mt-1 h-8 text-sm border-gray-700 bg-gray-800 text-white"
                                  placeholder="Following up on our conversation"
                                />
                              </div>
                              <div>
                                <Label className="text-xs text-gray-400">Body</Label>
                                <Textarea
                                  value={step.config.body || ''}
                                  onChange={(e) => updateStepConfig(index, 'body', e.target.value)}
                                  className="mt-1 text-sm border-gray-700 bg-gray-800 text-white"
                                  rows={3}
                                  placeholder="Hi {{first_name}},..."
                                />
                              </div>
                            </>
                          )}
                        </div>
                      )}

                      {step.step_type === 'wait' && (
                        <div className="flex items-center gap-2">
                          <Label className="text-xs text-gray-400">Wait</Label>
                          <Input
                            type="number"
                            value={step.config.duration_hours || 24}
                            onChange={(e) => updateStepConfig(index, 'duration_hours', parseInt(e.target.value) || 1)}
                            className="h-8 w-20 text-sm border-gray-700 bg-gray-800 text-white"
                            min="1"
                            max="720"
                          />
                          <span className="text-xs text-gray-400">hours</span>
                          <span className="text-[10px] text-gray-600">
                            ({Math.round((step.config.duration_hours || 24) / 24 * 10) / 10} days)
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Delete */}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-400 hover:text-red-300 h-8 w-8 p-0"
                      onClick={() => removeStep(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Arrow connector */}
              {index < steps.length - 1 && (
                <div className="flex justify-center py-1">
                  <ArrowDown className="h-4 w-4 text-gray-600" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Step Buttons */}
      <div className="flex items-center gap-2 pt-2">
        <span className="text-xs text-gray-500">Add step:</span>
        {STEP_TYPES.map(st => {
          const Icon = st.icon;
          return (
            <Button
              key={st.value}
              size="sm"
              variant="outline"
              className={`border-gray-700 hover:border-gray-600 text-gray-400 hover:text-white`}
              onClick={() => addStep(st.value as any)}
            >
              <Icon className="h-3 w-3 mr-1" />
              {st.label}
            </Button>
          );
        })}
      </div>

      {steps.length === 0 && (
        <div className="text-center py-8">
          <Plus className="mx-auto h-8 w-8 text-gray-600 mb-2" />
          <p className="text-sm text-gray-400">No steps yet. Add a step to start building your sequence.</p>
          <p className="text-xs text-gray-500 mt-1">Example: Call → Wait 24h → Email → Wait 48h → SMS</p>
        </div>
      )}
    </div>
  );
}
