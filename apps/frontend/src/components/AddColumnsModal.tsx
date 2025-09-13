import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from './ui/dialog';
import { 
  Checkbox 
} from './ui/checkbox';
import { 
  Building2, 
  Users, 
  DollarSign, 
  TrendingUp, 
  Phone, 
  Calendar,
  MapPin,
  Tag,
  UserCheck,
  BarChart3,
  Clock,
  Target,
  Globe,
  Briefcase
} from 'lucide-react';

export interface ColumnField {
  key: string;
  title: string;
  description: string;
  category: string;
  icon: React.ComponentType<any>;
  width?: string;
}

export interface AddColumnsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (selectedFields: string[]) => void;
  availableColumns: ColumnField[];
  currentColumns: string[];
}

const AVAILABLE_FIELDS: ColumnField[] = [
  // Business Information
  {
    key: 'industry',
    title: 'Industry',
    description: 'Business sector classification',
    category: 'Business Info',
    icon: Building2,
    width: '140px'
  },
  {
    key: 'companySize',
    title: 'Company Size',
    description: 'Number of employees',
    category: 'Business Info',
    icon: Users,
    width: '120px'
  },
  {
    key: 'location',
    title: 'Location',
    description: 'Geographic location',
    category: 'Business Info',
    icon: MapPin,
    width: '140px'
  },
  {
    key: 'website',
    title: 'Website',
    description: 'Company website',
    category: 'Business Info',
    icon: Globe,
    width: '140px'
  },
  
  // Sales Data
  {
    key: 'pipelineValue',
    title: 'Pipeline Value',
    description: 'Estimated deal value',
    category: 'Sales Data',
    icon: DollarSign,
    width: '130px'
  },
  {
    key: 'leadScore',
    title: 'Lead Score',
    description: 'Lead quality rating (1-10)',
    category: 'Sales Data',
    icon: TrendingUp,
    width: '110px'
  },
  {
    key: 'interestLevel',
    title: 'Interest Level',
    description: 'Interest rating (1-10)',
    category: 'Sales Data',
    icon: BarChart3,
    width: '120px'
  },
  {
    key: 'priority',
    title: 'Priority',
    description: 'Lead priority level',
    category: 'Sales Data',
    icon: Target,
    width: '100px'
  },
  
  // Contact Data
  {
    key: 'source',
    title: 'Lead Source',
    description: 'How lead was acquired',
    category: 'Contact Data',
    icon: Tag,
    width: '130px'
  },
  {
    key: 'nextFollowUp',
    title: 'Next Follow-up',
    description: 'Scheduled follow-up date',
    category: 'Contact Data',
    icon: Calendar,
    width: '140px'
  },
  {
    key: 'lastCallOutcome',
    title: 'Last Call Outcome',
    description: 'Result of last call',
    category: 'Contact Data',
    icon: Phone,
    width: '150px'
  },
  {
    key: 'callDuration',
    title: 'Call Duration',
    description: 'Average call length',
    category: 'Contact Data',
    icon: Clock,
    width: '120px'
  },
  
  // Assignment
  {
    key: 'owner',
    title: 'Lead Owner',
    description: 'Assigned team member',
    category: 'Assignment',
    icon: UserCheck,
    width: '130px'
  },
  {
    key: 'title',
    title: 'Job Title',
    description: 'Contact job position',
    category: 'Assignment',
    icon: Briefcase,
    width: '130px'
  }
];

export function AddColumnsModal({ 
  isOpen, 
  onClose, 
  onSave, 
  currentColumns 
}: AddColumnsModalProps) {
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [categoryExpanded, setCategoryExpanded] = useState<Record<string, boolean>>({
    'Business Info': true,
    'Sales Data': true,
    'Contact Data': true,
    'Assignment': true
  });

  const categories = [...new Set(AVAILABLE_FIELDS.map(field => field.category))];
  
  const availableFields = AVAILABLE_FIELDS.filter(
    field => !currentColumns.includes(field.key)
  );

  const handleFieldToggle = (fieldKey: string) => {
    setSelectedFields(prev => 
      prev.includes(fieldKey) 
        ? prev.filter(key => key !== fieldKey)
        : [...prev, fieldKey]
    );
  };

  const handleSave = () => {
    onSave(selectedFields);
    setSelectedFields([]);
    onClose();
  };

  const handleCancel = () => {
    setSelectedFields([]);
    onClose();
  };

  const toggleCategory = (category: string) => {
    setCategoryExpanded(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden bg-gray-900 border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-white">Add Columns to CRM Table</DialogTitle>
          <DialogDescription className="text-gray-400">
            Select additional fields to display in your CRM table. Choose from business information, sales data, and contact details.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-2 gap-6 overflow-y-auto max-h-[500px] py-4 pr-2">
          {categories.map(category => {
            const categoryFields = availableFields.filter(field => field.category === category);
            
            if (categoryFields.length === 0) return null;
            
            return (
              <Card key={category} className="bg-gray-800/60 border-gray-600 hover:border-gray-500 transition-colors">
                <CardHeader 
                  className="pb-3 cursor-pointer hover:bg-gray-700/30 rounded-t-lg transition-colors"
                  onClick={() => toggleCategory(category)}
                >
                  <CardTitle className="text-sm text-white flex items-center justify-between">
                    <span className="font-medium">{category}</span>
                    <Badge variant="secondary" className="bg-blue-600/20 text-blue-300 border border-blue-500/30">
                      {categoryFields.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                
                {categoryExpanded[category] && (
                  <CardContent className="space-y-3">
                    {categoryFields.map(field => {
                      const IconComponent = field.icon;
                      const isSelected = selectedFields.includes(field.key);
                      
                      return (
                        <div 
                          key={field.key}
                          className={`flex items-start space-x-3 p-3 rounded-lg border cursor-pointer transition-all ${
                            isSelected 
                              ? 'border-blue-500 bg-blue-500/15 shadow-sm' 
                              : 'border-gray-600 hover:border-gray-500 hover:bg-gray-700/30'
                          }`}
                          onClick={() => handleFieldToggle(field.key)}
                        >
                          <div className="mt-0.5">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleFieldToggle(field.key)}
                              className="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer"
                            />
                          </div>
                          <IconComponent className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-white mb-1">
                              {field.title}
                            </div>
                            <div className="text-xs text-gray-400 leading-relaxed">
                              {field.description}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        {selectedFields.length > 0 && (
          <div className="border-t border-gray-700 pt-4 bg-gray-800/30 -mx-6 px-6 rounded-b-lg">
            <div className="text-sm text-gray-300 mb-3 font-medium">Selected fields ({selectedFields.length}):</div>
            <div className="flex flex-wrap gap-2 max-h-20 overflow-y-auto">
              {selectedFields.map(fieldKey => {
                const field = AVAILABLE_FIELDS.find(f => f.key === fieldKey);
                return field ? (
                  <Badge key={fieldKey} variant="secondary" className="bg-blue-600 text-white hover:bg-blue-700 transition-colors">
                    {field.title}
                  </Badge>
                ) : null;
              })}
            </div>
          </div>
        )}

        <DialogFooter className="gap-3">
          <Button 
            variant="outline" 
            onClick={handleCancel} 
            className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={selectedFields.length === 0}
            className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Add {selectedFields.length} Column{selectedFields.length !== 1 ? 's' : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}