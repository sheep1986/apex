import * as React from 'react';
import { AlertTriangle } from 'lucide-react';
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
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <AlertDialogTitle className="text-red-600 dark:text-red-400">
              {title}
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="mt-4">
            {description}
            {itemName && (
              <span className="mt-2 block font-medium text-zinc-900 dark:text-zinc-100">
                "{itemName}"
              </span>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 py-4">
          <div className="rounded-md bg-red-50 dark:bg-red-900/10 p-3 text-sm text-red-800 dark:text-red-200">
            <strong>Warning:</strong> This action cannot be undone. All associated data
            will be permanently deleted.
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-delete" className="text-sm font-medium">
              Type <span className="font-bold text-red-600">DELETE</span> to confirm
            </Label>
            <Input
              id="confirm-delete"
              value={confirmText}
              onChange={(e) => {
                setConfirmText(e.target.value);
                setError('');
              }}
              placeholder="Type DELETE here"
              className={error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
              autoComplete="off"
              autoFocus
            />
            {error && (
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            )}
          </div>
        </div>

        <AlertDialogFooter>
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={!isConfirmValid || isLoading}
            className="bg-red-600 hover:bg-red-700"
          >
            {isLoading ? 'Deleting...' : 'Delete Permanently'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
