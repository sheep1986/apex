import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DayPicker } from 'react-day-picker';

import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn('p-3', className)}
      classNames={{
        months: 'flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0',
        month: 'space-y-4',
        caption: 'flex justify-center pt-1 relative items-center text-white',
        caption_label: 'text-sm font-medium text-white',
        nav: 'space-x-1 flex items-center',
        nav_button: cn(
          buttonVariants({ variant: 'outline' }),
          'h-7 w-7 bg-transparent p-0 text-white opacity-70 hover:opacity-100'
        ),
        nav_button_previous: 'absolute left-1 text-white',
        nav_button_next: 'absolute right-1 text-white',
        table: 'w-full border-collapse space-y-1 text-white',
        head_row: 'flex text-white',
        head_cell: 'text-xs font-semibold text-white w-9 text-center',
        row: 'flex w-full mt-2 text-white',
        cell: 'h-9 w-9 text-center p-0 relative focus-within:relative focus-within:z-20 text-white',
        day: cn(
          buttonVariants({ variant: 'ghost' }),
          'h-9 w-9 p-0 font-normal text-white aria-selected:opacity-100'
        ),
        day_selected: 'bg-gray-600 text-white hover:bg-gray-700 focus:bg-gray-700',
        day_today: 'border-gray-500 text-white',
        day_outside: 'text-gray-600 opacity-50 text-white',
        day_disabled: 'text-gray-700 opacity-50 text-white',
        day_range_middle: 'aria-selected:bg-pink-200 aria-selected:text-gray-900 text-white',
        day_hidden: 'invisible text-white',
        ...classNames,
      }}
      components={{
        IconLeft: ({ className, ...props }) => (
          <ChevronLeft className={cn('h-4 w-4 text-white', className)} {...props} />
        ),
        IconRight: ({ className, ...props }) => (
          <ChevronRight className={cn('h-4 w-4 text-white', className)} {...props} />
        ),
      }}
      {...props}
    />
  );
}
Calendar.displayName = 'Calendar';

export { Calendar };
