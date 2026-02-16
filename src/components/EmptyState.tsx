import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export default function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-16 text-center',
        className
      )}
    >
      <Icon className="h-16 w-16 text-gray-600" />
      <h3 className="mt-4 text-lg font-medium text-gray-300">{title}</h3>
      <p className="mt-2 max-w-sm text-sm text-gray-500">{description}</p>
      {actionLabel && onAction && (
        <Button
          onClick={onAction}
          className="mt-6 bg-emerald-600 text-white hover:bg-emerald-700"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
