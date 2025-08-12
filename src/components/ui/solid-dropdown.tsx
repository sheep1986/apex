import React, { useState, useRef, useEffect } from 'react';
import { ArrowUp, ArrowDown, Pin, Filter, EyeOff } from 'lucide-react';

interface DropdownOption {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  className?: string;
}

interface SolidDropdownProps {
  trigger: React.ReactNode;
  title: string;
  sortKey?: string;
  onSort?: (key: string, order: 'asc' | 'desc') => void;
  onUnsort?: () => void;
  onPinToggle?: () => void;
  sortHistory?: ('asc' | 'desc')[];
  isPinned?: boolean;
  options?: string[];
  onOptionSelect?: (option: string) => void;
  onHideColumn?: () => void;
}

export const SolidDropdown: React.FC<SolidDropdownProps> = ({
  trigger,
  title,
  sortKey,
  onSort,
  onUnsort,
  onPinToggle,
  sortHistory = [],
  isPinned = false,
  options: customOptions,
  onOptionSelect,
  onHideColumn,
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

  const options: DropdownOption[] = [];

  // If custom options are provided, use those instead of default column options
  if (customOptions) {
    customOptions.forEach((option) => {
      options.push({
        label: option,
        icon: <span className="mr-2"></span>,
        onClick: () => {
          if (onOptionSelect) onOptionSelect(option);
          setIsOpen(false);
        },
      });
    });
  } else {
    // Default column dropdown options
    if (sortKey && onSort) {
      options.push(
        {
          label: 'Sort ascending',
          icon: <span className="mr-2">⬆️</span>,
          onClick: () => {
            onSort(sortKey, 'asc');
            setIsOpen(false);
          },
        },
        {
          label: 'Sort descending',
          icon: <span className="mr-2">⬇️</span>,
          onClick: () => {
            onSort(sortKey, 'desc');
            setIsOpen(false);
          },
        }
      );

      // Always add unsort option if onUnsort is provided
      if (onUnsort) {
        options.push({
          label: 'Unsort',
          icon: <span className="mr-2">↕️</span>,
          onClick: () => {
            onUnsort();
            setIsOpen(false);
          },
        });
      }
    }

    // Pin/Unpin option
    if (onPinToggle) {
      options.push({
        label: isPinned ? 'Unpin column' : 'Pin column',
        icon: <span className="mr-2">{isPinned ? '📌' : '📍'}</span>,
        onClick: () => {
          onPinToggle();
          setIsOpen(false);
        },
      });
    }

    options.push(
      {
        label: `Filter by ${title.toLowerCase()}`,
        icon: <span className="mr-2">🔍</span>,
        onClick: () => setIsOpen(false),
      },
      {
        label: 'Hide column',
        icon: <span className="mr-2">👁️‍🗨️</span>,
        onClick: () => {
          if (onHideColumn) onHideColumn();
          setIsOpen(false);
        },
      }
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <div onClick={() => setIsOpen(!isOpen)}>{trigger}</div>

      {isOpen && (
        <div
          className="absolute right-0 top-full z-[9999] mt-1 max-h-[300px] overflow-y-auto"
          style={{
            minWidth: '160px',
            backgroundColor: '#111827',
            border: '1px solid #374151',
            borderRadius: '8px',
            boxShadow: '0 8px 16px rgba(0, 0, 0, 0.7)',
            padding: '6px',
          }}
        >
          {options.map((option, index) => (
            <React.Fragment key={index}>
              {index === 2 && sortKey && (
                <div
                  style={{
                    height: '1px',
                    backgroundColor: '#374151',
                    margin: '6px 8px',
                  }}
                />
              )}
              <div
                onClick={option.onClick}
                className="text-white"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '6px 10px',
                  cursor: 'pointer',
                  borderRadius: '6px',
                  color: '#ffffff !important',
                  fontSize: '10px',
                  backgroundColor: 'transparent',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(55, 65, 81, 0.5)';
                  e.currentTarget.style.color = '#ffffff';
                  e.currentTarget.style.transform = 'translateX(2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#ffffff';
                  e.currentTarget.style.transform = 'translateX(0)';
                }}
              >
                {option.icon}
                {option.label}
              </div>
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
};
