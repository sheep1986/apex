import * as React from 'react';
import { AlertTriangle, Trash2, Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './alert-dialog';
import { Button } from './button';
import { Input } from './input';
import { Label } from './label';

interface DeleteConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  itemName?: string;
  onConfirm: () => void | Promise<void>;
  isLoading?: boolean;
}

export function DeleteConfirmationDialog({
  open,
  onOpenChange,
  title,
  description,
  itemName,
  onConfirm,
  isLoading = false,
}: DeleteConfirmationDialogProps) {
  const [confirmText, setConfirmText] = React.useState('');
  const [error, setError] = React.useState('');

  const isConfirmValid = confirmText === 'DELETE';

  const handleConfirm = async () => {
    if (!isConfirmValid) {
      setError('Please type DELETE to confirm');
      return;
    }

    try {
      await onConfirm();
      setConfirmText('');
      setError('');
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
    }
  };

  const handleCancel = () => {
    setConfirmText('');
    setError('');
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md border border-gray-700 bg-gray-900 shadow-2xl shadow-black/60">
        <AlertDialogHeader>
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/20 border border-red-500/40">
              <AlertTriangle className="h-6 w-6 text-red-500" />
            </div>
            <div>
              <AlertDialogTitle className="text-xl font-bold text-red-500">
                {title}
              </AlertDialogTitle>
              {itemName && (
                <p className="text-sm text-gray-300 mt-1">
                  Campaign: <span className="text-white font-semibold">{itemName}</span>
                </p>
              )}
            </div>
          </div>
          <AlertDialogDescription className="mt-4 text-gray-300 leading-relaxed">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-5 py-4">
          {/* Warning box */}
          <div className="rounded-lg bg-red-950 border border-red-800 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-900">
                <Trash2 className="h-4 w-4 text-red-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-red-400">Permanent Action</p>
                <p className="text-sm text-gray-300 mt-1">
                  This will permanently delete all associated leads, calls, and analytics data. This action cannot be undone.
                </p>
              </div>
            </div>
          </div>

          {/* Confirmation input */}
          <div className="space-y-3">
            <Label htmlFor="confirm-delete" className="text-sm font-medium text-white">
              Type <span className="font-bold text-red-500 bg-red-900 px-2 py-1 rounded mx-1">DELETE</span> to confirm
            </Label>
            <Input
              id="confirm-delete"
              value={confirmText}
              onChange={(e) => {
                setConfirmText(e.target.value.toUpperCase());
                setError('');
              }}
              placeholder="Type DELETE here"
              className={`bg-gray-800 border-gray-600 text-white placeholder:text-gray-400 focus:border-red-500 focus:ring-red-500/30 transition-all ${
                error ? 'border-red-500' : ''
              } ${isConfirmValid ? 'border-emerald-500 bg-emerald-950/50' : ''}`}
              autoComplete="off"
              autoFocus
            />
            {error && (
              <p className="text-sm text-red-500 flex items-center gap-2 font-medium">
                <AlertTriangle className="h-3.5 w-3.5" />
                {error}
              </p>
            )}
          </div>
        </div>

        <AlertDialogFooter className="gap-3 sm:gap-3">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
            className="border-gray-600 bg-gray-800 text-white hover:bg-gray-700 hover:border-gray-500 transition-all"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!isConfirmValid || isLoading}
            className={`transition-all ${
              isConfirmValid
                ? 'bg-red-600 hover:bg-red-500 text-white font-semibold shadow-lg shadow-red-900/50'
                : 'bg-gray-700 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Permanently
              </>
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
