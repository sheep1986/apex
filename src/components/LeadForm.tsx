import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { X, Plus, Save, User, Building, Phone, Mail, Target, Calendar } from 'lucide-react';
import { Lead } from '../services/crm-service';

interface LeadFormProps {
  lead?: Lead;
  isOpen: boolean;
  onClose: () => void;
  onSave: (lead: Partial<Lead>) => Promise<void>;
  mode: 'create' | 'edit';
}

const statusOptions = [
  { value: 'new', label: '🔵 New', color: 'bg-blue-500' },
  { value: 'contacted', label: '📞 Contacted', color: 'bg-yellow-500' },
  { value: 'interested', label: '✨ Interested', color: 'bg-green-500' },
  { value: 'qualified', label: '🎯 Qualified', color: 'bg-emerald-500' },
  { value: 'converted', label: '💰 Converted', color: 'bg-emerald-600' },
  { value: 'unqualified', label: '❌ Unqualified', color: 'bg-red-500' },
];

const priorityOptions = [
  { value: 'low', label: '🟢 Low', color: 'bg-green-600' },
  { value: 'medium', label: '🟡 Medium', color: 'bg-yellow-600' },
  { value: 'high', label: '🔴 High', color: 'bg-red-600' },
];

const sourceOptions = [
  'Website',
  'Social Media',
  'Email Campaign',
  'Cold Call',
  'Referral',
  'Trade Show',
  'Google Ads',
  'Facebook Ads',
  'LinkedIn',
  'Other',
];

export default function LeadForm({ lead, isOpen, onClose, onSave, mode }: LeadFormProps) {
  const [formData, setFormData] = useState<Partial<Lead>>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    title: '',
    status: 'new',
    priority: 'medium',
    source: '',
    campaign: '',
    notes: '',
    tags: [],
    value: 0,
    nextFollowUp: '',
  });

  const [newTag, setNewTag] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (lead && mode === 'edit') {
      setFormData({
        ...lead,
        nextFollowUp: lead.nextFollowUp || '',
      });
    } else {
      // Reset form for create mode
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        company: '',
        title: '',
        status: 'new',
        priority: 'medium',
        source: '',
        campaign: '',
        notes: '',
        tags: [],
        value: 0,
        nextFollowUp: '',
      });
    }
    setErrors({});
  }, [lead, mode, isOpen]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName?.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.lastName?.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!formData.phone?.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^[\+]?[1-9][\d]{0,15}$/.test(formData.phone.replace(/[\s\-\(\)]/g, ''))) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.company?.trim()) {
      newErrors.company = 'Company name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Error saving lead:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof Lead, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags?.includes(newTag.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...(prev.tags || []), newTag.trim()],
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags?.filter((tag) => tag !== tagToRemove) || [],
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <Card className="max-h-[90vh] w-full max-w-4xl overflow-y-auto border-gray-800 bg-gray-900/95 shadow-2xl">
        <CardHeader className="border-b border-gray-800">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-white">
              {mode === 'create' ? (
                <>
                  <Plus className="h-5 w-5" />
                  Create New Lead
                </>
              ) : (
                <>
                  <User className="h-5 w-5" />
                  Edit Lead
                </>
              )}
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6 p-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
                <User className="h-5 w-5" />
                Personal Information
              </h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-gray-300">
                    First Name *
                  </Label>
                  <Input
                    id="firstName"
                    value={formData.firstName || ''}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    className={`border-gray-700 bg-gray-800 text-white ${
                      errors.firstName ? 'border-red-500' : ''
                    }`}
                    placeholder="Enter first name"
                  />
                  {errors.firstName && <p className="text-sm text-red-500">{errors.firstName}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-gray-300">
                    Last Name *
                  </Label>
                  <Input
                    id="lastName"
                    value={formData.lastName || ''}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    className={`border-gray-700 bg-gray-800 text-white ${
                      errors.lastName ? 'border-red-500' : ''
                    }`}
                    placeholder="Enter last name"
                  />
                  {errors.lastName && <p className="text-sm text-red-500">{errors.lastName}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2 text-gray-300">
                    <Mail className="h-4 w-4" />
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={`border-gray-700 bg-gray-800 text-white ${
                      errors.email ? 'border-red-500' : ''
                    }`}
                    placeholder="Enter email address"
                  />
                  {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-2 text-gray-300">
                    <Phone className="h-4 w-4" />
                    Phone Number *
                  </Label>
                  <Input
                    id="phone"
                    value={formData.phone || ''}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className={`border-gray-700 bg-gray-800 text-white ${
                      errors.phone ? 'border-red-500' : ''
                    }`}
                    placeholder="Enter phone number"
                  />
                  {errors.phone && <p className="text-sm text-red-500">{errors.phone}</p>}
                </div>
              </div>
            </div>

            {/* Company Information */}
            <div className="space-y-4">
              <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
                <Building className="h-5 w-5" />
                Company Information
              </h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="company" className="text-gray-300">
                    Company Name *
                  </Label>
                  <Input
                    id="company"
                    value={formData.company || ''}
                    onChange={(e) => handleInputChange('company', e.target.value)}
                    className={`border-gray-700 bg-gray-800 text-white ${
                      errors.company ? 'border-red-500' : ''
                    }`}
                    placeholder="Enter company name"
                  />
                  {errors.company && <p className="text-sm text-red-500">{errors.company}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title" className="text-gray-300">
                    Job Title
                  </Label>
                  <Input
                    id="title"
                    value={formData.title || ''}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    className="border-gray-700 bg-gray-800 text-white"
                    placeholder="Enter job title"
                  />
                </div>
              </div>
            </div>

            {/* Lead Status & Priority */}
            <div className="space-y-4">
              <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
                <Target className="h-5 w-5" />
                Lead Status & Priority
              </h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label className="text-gray-300">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => handleInputChange('status', value)}
                  >
                    <SelectTrigger className="border-gray-700 bg-gray-800 text-white">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent className="border-gray-700 bg-gray-800">
                      {statusOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value} className="text-white">
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-300">Priority</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) => handleInputChange('priority', value)}
                  >
                    <SelectTrigger className="border-gray-700 bg-gray-800 text-white">
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent className="border-gray-700 bg-gray-800">
                      {priorityOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value} className="text-white">
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="value" className="text-gray-300">
                    Estimated Value ($)
                  </Label>
                  <Input
                    id="value"
                    type="number"
                    value={formData.value || ''}
                    onChange={(e) => handleInputChange('value', parseInt(e.target.value) || 0)}
                    className="border-gray-700 bg-gray-800 text-white"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            {/* Campaign & Source */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-gray-300">Source</Label>
                  <Select
                    value={formData.source}
                    onValueChange={(value) => handleInputChange('source', value)}
                  >
                    <SelectTrigger className="border-gray-700 bg-gray-800 text-white">
                      <SelectValue placeholder="Select source" />
                    </SelectTrigger>
                    <SelectContent className="border-gray-700 bg-gray-800">
                      {sourceOptions.map((source) => (
                        <SelectItem key={source} value={source} className="text-white">
                          {source}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="campaign" className="text-gray-300">
                    Campaign
                  </Label>
                  <Input
                    id="campaign"
                    value={formData.campaign || ''}
                    onChange={(e) => handleInputChange('campaign', e.target.value)}
                    className="border-gray-700 bg-gray-800 text-white"
                    placeholder="Enter campaign name"
                  />
                </div>
              </div>
            </div>

            {/* Tags */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Tags</h3>
              <div className="mb-2 flex flex-wrap gap-2">
                {formData.tags?.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="border-emerald-600/30 bg-emerald-600/20 text-emerald-300"
                  >
                    {tag}
                    <X className="ml-1 h-3 w-3 cursor-pointer" onClick={() => removeTag(tag)} />
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  className="border-gray-700 bg-gray-800 text-white"
                  placeholder="Add a tag"
                />
                <Button
                  type="button"
                  onClick={addTag}
                  variant="outline"
                  className="border-gray-600 text-gray-300 hover:bg-gray-800"
                >
                  Add
                </Button>
              </div>
            </div>

            {/* Follow-up Date */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nextFollowUp" className="flex items-center gap-2 text-gray-300">
                  <Calendar className="h-4 w-4" />
                  Next Follow-up Date
                </Label>
                <Input
                  id="nextFollowUp"
                  type="datetime-local"
                  value={formData.nextFollowUp || ''}
                  onChange={(e) => handleInputChange('nextFollowUp', e.target.value)}
                  className="border-gray-700 bg-gray-800 text-white"
                />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="notes" className="text-gray-300">
                  Notes
                </Label>
                <Textarea
                  id="notes"
                  value={formData.notes || ''}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  className="min-h-[100px] border-gray-700 bg-gray-800 text-white"
                  placeholder="Add any additional notes about this lead..."
                />
              </div>
            </div>
          </CardContent>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 border-t border-gray-800 p-6">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-gradient-to-r from-emerald-600 to-emerald-600 hover:from-emerald-700 hover:to-emerald-700"
            >
              {isLoading ? (
                'Saving...'
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {mode === 'create' ? 'Create Lead' : 'Save Changes'}
                </>
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
