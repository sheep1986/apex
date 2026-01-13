import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronRight,
  EyeOff,
  Filter,
  Pin,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";

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
  onSort?: (key: string, order: "asc" | "desc") => void;
  onUnsort?: () => void;
  onPinToggle?: () => void;
  sortHistory?: ("asc" | "desc")[];
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
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const options: DropdownOption[] = [];

  // If custom options are provided, use those instead of default column options
  if (customOptions) {
    customOptions.forEach((option) => {
      options.push({
        label: option,
        icon: <ChevronRight className="mr-2.5 h-3 w-3 opacity-50" />,
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
          label: "Sort ascending",
          icon: <ArrowUp className="mr-2.5 h-3 w-3" />,
          onClick: () => {
            onSort(sortKey, "asc");
            setIsOpen(false);
          },
        },
        {
          label: "Sort descending",
          icon: <ArrowDown className="mr-2.5 h-3 w-3" />,
          onClick: () => {
            onSort(sortKey, "desc");
            setIsOpen(false);
          },
        }
      );

      // Always add unsort option if onUnsort is provided
      if (onUnsort) {
        options.push({
          label: "Unsort",
          icon: <ArrowUpDown className="mr-2.5 h-3 w-3" />,
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
        label: isPinned ? "Unpin column" : "Pin column",
        icon: (
          <Pin className={`mr-2.5 h-3 w-3 ${isPinned ? "fill-current" : ""}`} />
        ),
        onClick: () => {
          onPinToggle();
          setIsOpen(false);
        },
      });
    }

    options.push(
      {
        label: `Filter by ${title.toLowerCase()}`,
        icon: <Filter className="mr-2.5 h-3 w-3" />,
        onClick: () => setIsOpen(false),
      },
      {
        label: "Hide column",
        icon: <EyeOff className="mr-2.5 h-3 w-3" />,
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
          className="absolute right-0 top-full z-[9999] mt-2 max-h-[300px] overflow-y-auto custom-scrollbar"
          style={{
            minWidth: "180px",
            background: "rgba(12, 12, 12, 0.88)",
            backdropFilter: "blur(40px) saturate(200%)",
            WebkitBackdropFilter: "blur(40px) saturate(200%)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: "12px",
            boxShadow:
              "0 25px 50px -12px rgba(0, 0, 0, 0.6), inset 0 0 0 1px rgba(255, 255, 255, 0.05)",
            padding: "4px",
          }}
        >
          <div className="px-3 py-2 border-b border-white/5 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/40">
              {title}
            </span>
          </div>
          {options.map((option, index) => (
            <React.Fragment key={index}>
              <div
                onClick={option.onClick}
                className="group flex items-center px-3 py-2 cursor-pointer rounded-lg transition-all duration-300"
                style={{
                  color: "rgba(255, 255, 255, 0.8)",
                  fontSize: "11px",
                  fontWeight: "500",
                  letterSpacing: "0.01em",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor =
                    "rgba(255, 255, 255, 0.06)";
                  e.currentTarget.style.color = "#ffffff";
                  e.currentTarget.style.transform = "translateX(2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.color = "rgba(255, 255, 255, 0.8)";
                  e.currentTarget.style.transform = "translateX(0)";
                }}
              >
                <span className="opacity-60 transition-opacity group-hover:opacity-100">
                  {option.icon}
                </span>
                {option.label}
              </div>
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
};
