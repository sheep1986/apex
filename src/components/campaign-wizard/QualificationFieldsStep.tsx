import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { 
  Calendar, Phone, Target, Clock, DollarSign, User, Building, 
  AlertCircle, Plus, X, ChevronRight, Info, Sparkles, Settings,
  CheckCircle, MessageSquare, TrendingUp, Users, Mail, Briefcase
} from 'lucide-react';

interface QualificationFieldsStepProps {
  selectedFields: any;
  onChange: (fields: any) => void;
}

// Category icons and colors
const categoryConfig = {
  appointment: { icon: Calendar, color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
  interest: { icon: Target, color: 'text-emerald-500', bgColor: 'bg-emerald-500/10' },
  timeline: { icon: Clock, color: 'text-orange-500', bgColor: 'bg-orange-500/10' },
  budget: { icon: DollarSign, color: 'text-green-500', bgColor: 'bg-green-500/10' },
  authority: { icon: User, color: 'text-purple-500', bgColor: 'bg-purple-500/10' },
  pain_point: { icon: AlertCircle, color: 'text-red-500', bgColor: 'bg-red-500/10' },
  competitor: { icon: Target, color: 'text-yellow-500', bgColor: 'bg-yellow-500/10' },
  contact_info: { icon: Mail, color: 'text-cyan-500', bgColor: 'bg-cyan-500/10' },
  company: { icon: Building, color: 'text-indigo-500', bgColor: 'bg-indigo-500/10' },
};

// Preset fields data (would normally come from API)
const presetFields = [
  // Appointment & Follow-up
  { id: '1', category: 'appointment', key: 'appointment_booked', name: 'Appointment Booked', type: 'boolean', weight: 90, action: 'calendar_booking' },
  { id: '2', category: 'appointment', key: 'callback_requested', name: 'Callback Requested', type: 'boolean', weight: 30, action: 'task_creation' },
  { id: '3', category: 'appointment', key: 'demo_requested', name: 'Demo Requested', type: 'boolean', weight: 80, action: 'calendar_booking' },
  
  // Interest Level
  { id: '4', category: 'interest', key: 'high_interest_expressed', name: 'High Interest', type: 'boolean', weight: 70 },
  { id: '5', category: 'interest', key: 'asking_detailed_questions', name: 'Asking Questions', type: 'boolean', weight: 50 },
  { id: '6', category: 'interest', key: 'use_case_mentioned', name: 'Use Case Mentioned', type: 'text', weight: 60 },
  
  // Timeline
  { id: '7', category: 'timeline', key: 'urgent_need', name: 'Urgent Need', type: 'boolean', weight: 85 },
  { id: '8', category: 'timeline', key: 'timeline_mentioned', name: 'Timeline Mentioned', type: 'text', weight: 40 },
  
  // Budget & Authority
  { id: '9', category: 'budget', key: 'budget_mentioned', name: 'Budget Mentioned', type: 'boolean', weight: 65 },
  { id: '10', category: 'budget', key: 'budget_amount', name: 'Budget Amount', type: 'text', weight: 75 },
  { id: '11', category: 'authority', key: 'decision_maker', name: 'Decision Maker', type: 'boolean', weight: 70 },
  { id: '12', category: 'authority', key: 'influencer', name: 'Influencer', type: 'boolean', weight: 45 },
  
  // More fields...
];

export const QualificationFieldsStep: React.FC<QualificationFieldsStepProps> = ({
  selectedFields = { preset: [], custom: [] },
  onChange,
}) => {
  const [activeCategory, setActiveCategory] = useState('appointment');
  const [showCustomField, setShowCustomField] = useState(false);
  const [customField, setCustomField] = useState({
    key: '',
    name: '',
    type: 'boolean',
    description: '',
    ai_hints: '',
    weight: 50,
  });

  const handleTogglePresetField = (fieldId: string) => {
    const currentPresets = selectedFields.preset || [];
    const isSelected = currentPresets.some((f: any) => f.id === fieldId);
    
    if (isSelected) {
      onChange({
        ...selectedFields,
        preset: currentPresets.filter((f: any) => f.id !== fieldId),
      });
    } else {
      const field = presetFields.find(f => f.id === fieldId);
      onChange({
        ...selectedFields,
        preset: [...currentPresets, { ...field, isRequired: false }],
      });
    }
  };

  const handleToggleRequired = (fieldId: string) => {
    const currentPresets = selectedFields.preset || [];
    onChange({
      ...selectedFields,
      preset: currentPresets.map((f: any) => 
        f.id === fieldId ? { ...f, isRequired: !f.isRequired } : f
      ),
    });
  };

  const handleAddCustomField = () => {
    if (customField.key && customField.name) {
      const newField = {
        ...customField,
        id: `custom-${Date.now()}`,
        category: 'custom',
        ai_hints: customField.ai_hints.split('\n').filter(h => h.trim()),
      };
      
      onChange({
        ...selectedFields,
        custom: [...(selectedFields.custom || []), newField],
      });
      
      // Reset form
      setCustomField({
        key: '',
        name: '',
        type: 'boolean',
        description: '',
        ai_hints: '',
        weight: 50,
      });
      setShowCustomField(false);
    }
  };

  const handleRemoveCustomField = (fieldId: string) => {
    onChange({
      ...selectedFields,
      custom: (selectedFields.custom || []).filter((f: any) => f.id !== fieldId),
    });
  };

  const selectedCount = (selectedFields.preset?.length || 0) + (selectedFields.custom?.length || 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-gray-800 bg-gray-900">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Sparkles className="h-5 w-5 text-emerald-500" />
            AI Qualification Fields
          </CardTitle>
          <CardDescription className="text-gray-400">
            Select fields the AI should extract and track from conversations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm text-gray-300">
                <span className="font-medium text-white">{selectedCount}</span> fields selected
              </p>
              <p className="text-xs text-gray-400">
                Each field helps the AI better qualify leads
              </p>
            </div>
            <Button
              onClick={() => setShowCustomField(true)}
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Custom Field
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Field Categories */}
      <Card className="border-gray-800 bg-gray-900">
        <CardContent className="p-0">
          <Tabs value={activeCategory} onValueChange={setActiveCategory}>
            <div className="border-b border-gray-800 px-6 pt-6">
              <TabsList className="grid w-full grid-cols-5 bg-gray-800">
                {Object.entries(categoryConfig).slice(0, 5).map(([key, config]) => {
                  const Icon = config.icon;
                  return (
                    <TabsTrigger key={key} value={key} className="text-gray-300">
                      <Icon className={`mr-2 h-4 w-4 ${config.color}`} />
                      {key.charAt(0).toUpperCase() + key.slice(1).replace('_', ' ')}
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </div>

            <ScrollArea className="h-[400px]">
              {Object.entries(categoryConfig).map(([category, config]) => (
                <TabsContent key={category} value={category} className="m-0 p-6">
                  <div className="space-y-3">
                    {presetFields
                      .filter(field => field.category === category)
                      .map(field => {
                        const isSelected = selectedFields.preset?.some((f: any) => f.id === field.id);
                        const selectedField = selectedFields.preset?.find((f: any) => f.id === field.id);
                        const Icon = config.icon;
                        
                        return (
                          <div
                            key={field.id}
                            className={`rounded-lg border p-4 transition-all ${
                              isSelected 
                                ? 'border-emerald-600 bg-emerald-950/20' 
                                : 'border-gray-800 bg-gray-900/50 hover:border-gray-700'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-start gap-3">
                                <div className={`rounded-lg p-2 ${config.bgColor}`}>
                                  <Icon className={`h-4 w-4 ${config.color}`} />
                                </div>
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <h4 className="text-sm font-medium text-white">{field.name}</h4>
                                    <Badge variant="outline" className="text-xs">
                                      {field.type}
                                    </Badge>
                                    {field.action && (
                                      <Badge className="bg-blue-500/20 text-xs text-blue-400">
                                        {field.action.replace('_', ' ')}
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-xs text-gray-400">
                                    AI will detect when {field.name.toLowerCase()} is mentioned
                                  </p>
                                  <div className="flex items-center gap-4 text-xs">
                                    <span className="text-gray-500">
                                      Weight: <span className="text-emerald-400">{field.weight}%</span>
                                    </span>
                                    {isSelected && (
                                      <label className="flex items-center gap-1">
                                        <input
                                          type="checkbox"
                                          checked={selectedField?.isRequired || false}
                                          onChange={() => handleToggleRequired(field.id)}
                                          className="rounded border-gray-600 bg-gray-800"
                                        />
                                        <span className="text-gray-400">Required</span>
                                      </label>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <Switch
                                checked={isSelected}
                                onCheckedChange={() => handleTogglePresetField(field.id)}
                              />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </TabsContent>
              ))}
            </ScrollArea>
          </Tabs>
        </CardContent>
      </Card>

      {/* Custom Fields */}
      {selectedFields.custom?.length > 0 && (
        <Card className="border-gray-800 bg-gray-900">
          <CardHeader>
            <CardTitle className="text-lg text-white">Custom Fields</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {selectedFields.custom.map((field: any) => (
              <div
                key={field.id}
                className="flex items-center justify-between rounded-lg border border-gray-800 bg-gray-900/50 p-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-medium text-white">{field.name}</h4>
                    <Badge variant="outline" className="text-xs">
                      {field.type}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-400">{field.description}</p>
                </div>
                <Button
                  onClick={() => handleRemoveCustomField(field.id)}
                  size="sm"
                  variant="ghost"
                  className="text-red-400 hover:text-red-300"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Add Custom Field Modal */}
      {showCustomField && (
        <Card className="border-emerald-600 bg-gray-900">
          <CardHeader>
            <CardTitle className="text-white">Add Custom Field</CardTitle>
            <CardDescription className="text-gray-400">
              Create a custom qualification field for your campaign
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-white">Field Key</Label>
                <Input
                  value={customField.key}
                  onChange={(e) => setCustomField({ ...customField, key: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                  placeholder="e.g., competitor_pricing"
                  className="border-gray-700 bg-gray-800"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-white">Field Name</Label>
                <Input
                  value={customField.name}
                  onChange={(e) => setCustomField({ ...customField, name: e.target.value })}
                  placeholder="e.g., Competitor Pricing"
                  className="border-gray-700 bg-gray-800"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-white">Field Type</Label>
                <Select
                  value={customField.type}
                  onValueChange={(value) => setCustomField({ ...customField, type: value })}
                >
                  <SelectTrigger className="border-gray-700 bg-gray-800">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="boolean">Yes/No</SelectItem>
                    <SelectItem value="text">Text</SelectItem>
                    <SelectItem value="number">Number</SelectItem>
                    <SelectItem value="date">Date</SelectItem>
                    <SelectItem value="select">Select</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-white">Scoring Weight</Label>
                <Input
                  type="number"
                  value={customField.weight}
                  onChange={(e) => setCustomField({ ...customField, weight: parseInt(e.target.value) || 0 })}
                  min="0"
                  max="100"
                  className="border-gray-700 bg-gray-800"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-white">AI Detection Hints</Label>
              <Textarea
                value={customField.ai_hints}
                onChange={(e) => setCustomField({ ...customField, ai_hints: e.target.value })}
                placeholder="Enter phrases the AI should look for (one per line)..."
                className="min-h-[100px] border-gray-700 bg-gray-800"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                onClick={() => setShowCustomField(false)}
                variant="outline"
                className="border-gray-700"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddCustomField}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                Add Field
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info Box */}
      <div className="rounded-lg border border-blue-900/50 bg-blue-950/30 p-4">
        <div className="flex gap-3">
          <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-400" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-blue-300">How qualification fields work</p>
            <p className="text-xs text-blue-300/80">
              Each field you select trains the AI to listen for specific information during calls. 
              Fields with higher weights have more impact on the final lead score. Required fields 
              must be captured for a lead to be qualified. Some fields trigger automatic CRM actions 
              like booking appointments or creating tasks.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};