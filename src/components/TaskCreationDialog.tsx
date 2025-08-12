import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Calendar, Clock, AlertCircle, CheckSquare } from 'lucide-react';

interface TaskCreationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateTask: (task: any) => void;
  leadId: string;
}

export const TaskCreationDialog: React.FC<TaskCreationDialogProps> = ({
  isOpen,
  onClose,
  onCreateTask,
  leadId,
}) => {
  const [taskData, setTaskData] = useState({
    title: '',
    description: '',
    category: 'follow_up',
    priority: 'medium',
    due_date: new Date().toISOString().split('T')[0],
    due_time: '09:00',
    status: 'pending',
    notes: '',
  });

  const handleSubmit = () => {
    if (!taskData.title.trim()) {
      return;
    }

    const newTask = {
      ...taskData,
      id: `task_${Date.now()}`,
      lead_id: leadId,
      created_at: new Date().toISOString(),
    };

    onCreateTask(newTask);
    
    // Reset form
    setTaskData({
      title: '',
      description: '',
      category: 'follow_up',
      priority: 'medium',
      due_date: new Date().toISOString().split('T')[0],
      due_time: '09:00',
      status: 'pending',
      notes: '',
    });
    
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-gray-900 border-gray-800">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
            <CheckSquare className="h-5 w-5 text-emerald-400" />
            Create New Task
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Add a task to follow up with this lead
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-white">
              Task Title <span className="text-red-400">*</span>
            </Label>
            <Input
              id="title"
              value={taskData.title}
              onChange={(e) => setTaskData({ ...taskData, title: e.target.value })}
              placeholder="e.g., Follow up on proposal"
              className="bg-gray-800 border-gray-700 text-white"
              autoFocus
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-white">
              Description
            </Label>
            <Textarea
              id="description"
              value={taskData.description}
              onChange={(e) => setTaskData({ ...taskData, description: e.target.value })}
              placeholder="Add more details about this task..."
              className="bg-gray-800 border-gray-700 text-white min-h-[80px]"
            />
          </div>

          {/* Category and Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category" className="text-white">
                Category
              </Label>
              <Select
                value={taskData.category}
                onValueChange={(value) => setTaskData({ ...taskData, category: value })}
              >
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="follow_up">Follow Up</SelectItem>
                  <SelectItem value="call">Phone Call</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="meeting">Meeting</SelectItem>
                  <SelectItem value="proposal">Proposal</SelectItem>
                  <SelectItem value="contract">Contract</SelectItem>
                  <SelectItem value="research">Research</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority" className="text-white">
                Priority
              </Label>
              <Select
                value={taskData.priority}
                onValueChange={(value) => setTaskData({ ...taskData, priority: value })}
              >
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="urgent">
                    <span className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-red-400" />
                      Urgent
                    </span>
                  </SelectItem>
                  <SelectItem value="high">
                    <span className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-orange-400" />
                      High
                    </span>
                  </SelectItem>
                  <SelectItem value="medium">
                    <span className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-yellow-400" />
                      Medium
                    </span>
                  </SelectItem>
                  <SelectItem value="low">
                    <span className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-gray-400" />
                      Low
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Due Date and Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="due_date" className="text-white flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Due Date
              </Label>
              <Input
                id="due_date"
                type="date"
                value={taskData.due_date}
                onChange={(e) => setTaskData({ ...taskData, due_date: e.target.value })}
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="due_time" className="text-white flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Due Time
              </Label>
              <Input
                id="due_time"
                type="time"
                value={taskData.due_time}
                onChange={(e) => setTaskData({ ...taskData, due_time: e.target.value })}
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-white">
              Additional Notes
            </Label>
            <Textarea
              id="notes"
              value={taskData.notes}
              onChange={(e) => setTaskData({ ...taskData, notes: e.target.value })}
              placeholder="Any additional information..."
              className="bg-gray-800 border-gray-700 text-white min-h-[60px]"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            className="border-gray-700 text-gray-300 hover:bg-gray-800"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!taskData.title.trim()}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <CheckSquare className="h-4 w-4 mr-2" />
            Create Task
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};