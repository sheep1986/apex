import * as React from 'react';
import { Check } from 'lucide-react';

interface SmallCheckboxProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  onClick?: (e: React.MouseEvent) => void;
}

const SmallCheckbox = React.forwardRef<HTMLDivElement, SmallCheckboxProps>(
  ({ checked, onCheckedChange, onClick }, ref) => (
    <div
      ref={ref}
      onClick={(e) => {
        onClick?.(e);
        onCheckedChange?.(!checked);
      }}
      style={{
        width: '12px',
        height: '12px',
        border: '1px solid white',
        borderRadius: '0px',
        backgroundColor: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        flexShrink: 0,
      }}
    >
      {checked && (
        <Check
          style={{
            width: '8px',
            height: '8px',
            color: 'black',
            strokeWidth: 3,
          }}
        />
      )}
    </div>
  )
);
SmallCheckbox.displayName = 'SmallCheckbox';

export { SmallCheckbox };
