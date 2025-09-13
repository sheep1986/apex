import React, { useState, useRef, useEffect } from 'react';

interface SimpleDropdownProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: 'start' | 'end';
  className?: string;
}

export const SimpleDropdown: React.FC<SimpleDropdownProps> = ({
  trigger,
  children,
  align = 'start',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <div onClick={() => setIsOpen(!isOpen)}>{trigger}</div>

      {isOpen && (
        <div
          className={`absolute top-full z-50 mt-1 w-48 ${align === 'end' ? 'right-0' : 'left-0'} ${className}`}
          style={{
            backgroundColor: '#111827',
            border: '1px solid #374151',
            borderRadius: '8px',
            padding: '4px',
            boxShadow: '0 8px 16px rgba(0, 0, 0, 0.3)',
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
};

interface SimpleDropdownItemProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  selected?: boolean;
}

export const SimpleDropdownItem: React.FC<SimpleDropdownItemProps> = ({
  children,
  onClick,
  className = '',
  selected = false,
}) => {
  return (
    <div
      style={{
        backgroundColor: '#111827',
        color: selected ? '#10b981' : '#d1d5db',
        padding: '6px 8px',
        cursor: 'pointer',
        fontSize: '12px',
        border: 'none',
        outline: 'none',
        margin: '0',
        borderRadius: '0',
      }}
      onClick={onClick}
    >
      {children}
    </div>
  );
};
