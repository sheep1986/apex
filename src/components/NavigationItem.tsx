import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { LucideIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface NavigationItemProps {
  name: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
  isActive: boolean;
  sidebarOpen: boolean;
  onClick?: () => void;
}

export function NavigationItem({
  name,
  href,
  icon: Icon,
  badge,
  isActive,
  sidebarOpen,
  onClick,
}: NavigationItemProps) {
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = () => {
    onClick?.();
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <NavLink
          to={href}
          onClick={handleClick}
          className={cn(
            'nav-item flex items-center rounded-lg px-3 py-2 text-sm font-medium',
            'group relative transition-all duration-200',
            'hover:bg-gray-800 focus:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20',
            isActive && 'bg-gray-800 text-white',
            !isActive && 'text-gray-400 hover:text-white',
            !sidebarOpen && 'justify-center'
          )}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Active indicator */}
          {isActive && (
            <div className="absolute bottom-0 left-0 top-0 w-1 rounded-r bg-emerald-500" />
          )}

          {/* Icon */}
          <Icon
            className={cn(
              'h-5 w-5 flex-shrink-0 transition-colors duration-200',
              isActive && 'text-emerald-400',
              !isActive && isHovered && 'text-emerald-300',
              !isActive && !isHovered && 'text-gray-400'
            )}
          />

          {/* Text - only show when sidebar is open */}
          <span
            className={cn(
              'ml-3 whitespace-nowrap transition-all duration-300',
              sidebarOpen ? 'w-auto opacity-100' : 'w-0 overflow-hidden opacity-0'
            )}
          >
            {name}
          </span>

          {/* Badge - only show when sidebar is open */}
          {badge && sidebarOpen && (
            <Badge
              variant="default"
              className={cn(
                'ml-auto border-0 bg-emerald-600 text-white transition-all duration-200',
                'rounded-full px-2 py-1 text-xs',
                isHovered && 'bg-emerald-500'
              )}
            >
              {badge}
            </Badge>
          )}

          {/* Hover effect overlay */}
          <div
            className={cn(
              'absolute inset-0 rounded-lg bg-gradient-to-r from-emerald-600/10 to-transparent',
              'transition-opacity duration-200',
              isHovered ? 'opacity-100' : 'opacity-0'
            )}
          />
        </NavLink>
      </TooltipTrigger>

      {/* Tooltip only shows when sidebar is collapsed */}
      {!sidebarOpen && (
        <TooltipContent side="right" className="border-gray-700 bg-gray-800 text-white">
          <div className="flex items-center space-x-2">
            <span>{name}</span>
            {badge && (
              <Badge variant="default" className="border-0 bg-emerald-600 text-xs text-white">
                {badge}
              </Badge>
            )}
          </div>
        </TooltipContent>
      )}
    </Tooltip>
  );
}
