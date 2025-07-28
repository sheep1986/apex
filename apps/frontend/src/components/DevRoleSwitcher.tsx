import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  User,
  Crown,
  Building,
  Shield,
  UserCog,
  Settings,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { useDevRole, type UserRole } from '@/services/dev-auth';

const roleConfig = {
  platform_owner: {
    label: 'Platform Owner',
    color: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    icon: Crown,
    description: 'Full platform access',
  },
  agency_owner: {
    label: 'Agency Owner',
    color: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    icon: Building,
    description: 'Agency management',
  },
  agency_admin: {
    label: 'Agency Admin',
    color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    icon: Shield,
    description: 'Agency operations',
  },
  client_admin: {
    label: 'Client Admin',
    color: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    icon: UserCog,
    description: 'Client management',
  },
  client_user: {
    label: 'Client User',
    color: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
    icon: User,
    description: 'Standard user',
  },
};

export function DevRoleSwitcher() {
  const { currentRole, switchRole } = useDevRole();
  const [isExpanded, setIsExpanded] = useState(false);

  // Only show in development mode
  const isDev =
    import.meta.env.VITE_USE_DEV_AUTH === 'true' || !import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

  if (!isDev) {
    return null;
  }

  const currentConfig = roleConfig[currentRole];
  const CurrentIcon = currentConfig.icon;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Card className="border-gray-700 bg-gray-900/50 shadow-xl backdrop-blur-sm">
        <CardContent className="p-3">
          <div className="flex items-center gap-3">
            {/* Current Role Display */}
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-800">
                <Settings className="h-4 w-4 text-emerald-400" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-zinc-400">DEV MODE</span>
                <Badge className={currentConfig.color}>
                  <CurrentIcon className="mr-1 h-3 w-3" />
                  {currentConfig.label}
                </Badge>
              </div>
            </div>

            {/* Role Switcher Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-zinc-400 hover:bg-gray-700/50 hover:text-white"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronUp className="h-4 w-4" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                side="top"
                className="mb-2 border-gray-700 bg-gray-900/95 backdrop-blur-sm"
              >
                <DropdownMenuLabel className="text-zinc-300">Switch User Role</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-gray-700" />

                {Object.entries(roleConfig).map(([role, config]) => {
                  const Icon = config.icon;
                  const isActive = role === currentRole;

                  return (
                    <DropdownMenuItem
                      key={role}
                      className={`cursor-pointer text-zinc-400 hover:bg-gray-700/50 hover:text-white ${isActive ? 'bg-gray-800/50 text-white' : ''} `}
                      onClick={() => switchRole(role as UserRole)}
                    >
                      <div className="flex w-full items-center gap-3">
                        <Icon className="h-4 w-4" />
                        <div className="flex flex-col">
                          <span className="font-medium">{config.label}</span>
                          <span className="text-xs text-zinc-500">{config.description}</span>
                        </div>
                        {isActive && (
                          <div className="ml-auto">
                            <div className="h-2 w-2 rounded-full bg-emerald-400"></div>
                          </div>
                        )}
                      </div>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Description */}
          <div className="mt-2 border-t border-gray-700 pt-2">
            <p className="text-xs text-zinc-500">{currentConfig.description}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
