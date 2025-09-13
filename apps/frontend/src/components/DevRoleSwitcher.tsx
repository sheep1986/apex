import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Shield, User, UserCog, Building, Crown } from 'lucide-react';

const roles = [
  { 
    id: 'platform_owner', 
    label: 'Platform Owner', 
    icon: Crown, 
    color: 'text-purple-500',
    route: '/platform',
    description: 'Full platform access'
  },
  { 
    id: 'agency_owner', 
    label: 'Agency Owner', 
    icon: Building, 
    color: 'text-blue-500',
    route: '/agency',
    description: 'Agency management'
  },
  { 
    id: 'agency_admin', 
    label: 'Agency Admin', 
    icon: UserCog, 
    color: 'text-blue-400',
    route: '/agency',
    description: 'Agency operations'
  },
  { 
    id: 'client_admin', 
    label: 'Client Admin', 
    icon: UserCog, 
    color: 'text-emerald-500',
    route: '/dashboard',
    description: 'Client management'
  },
  { 
    id: 'client_user', 
    label: 'Client User', 
    icon: User, 
    color: 'text-emerald-400',
    route: '/dashboard',
    description: 'Standard user access'
  },
];

export function DevRoleSwitcher() {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentRole, setCurrentRole] = useState(() => {
    return localStorage.getItem('dev_role') || 'platform_owner';
  });

  useEffect(() => {
    localStorage.setItem('dev_role', currentRole);
  }, [currentRole]);

  const handleRoleChange = (roleId: string) => {
    setCurrentRole(roleId);
    const role = roles.find(r => r.id === roleId);
    if (role) {
      navigate(role.route);
    }
  };

  const currentRoleData = roles.find(r => r.id === currentRole);
  const Icon = currentRoleData?.icon || User;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            className="bg-gray-900/95 border-gray-700 hover:bg-gray-800 backdrop-blur-sm shadow-lg"
          >
            <Icon className={`w-4 h-4 mr-2 ${currentRoleData?.color}`} />
            <span className="text-sm font-medium">Dev: {currentRoleData?.label}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-64 bg-gray-900/95 border-gray-700 backdrop-blur-sm" align="end">
          <DropdownMenuLabel className="text-gray-400 text-xs uppercase tracking-wider">Switch User Role</DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-gray-700" />
          {roles.map((role) => {
            const RoleIcon = role.icon;
            const isActive = currentRole === role.id;
            return (
              <DropdownMenuItem
                key={role.id}
                onClick={() => handleRoleChange(role.id)}
                className={`cursor-pointer hover:bg-gray-800 ${
                  isActive ? 'bg-gray-800/50' : ''
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-3">
                    <RoleIcon className={`w-4 h-4 ${role.color}`} />
                    <div>
                      <div className="text-white font-medium">{role.label}</div>
                      <div className="text-xs text-gray-400">{role.description}</div>
                    </div>
                  </div>
                  {isActive && (
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  )}
                </div>
              </DropdownMenuItem>
            );
          })}
          <DropdownMenuSeparator className="bg-gray-700" />
          <DropdownMenuLabel className="text-gray-400 text-xs uppercase tracking-wider mt-2">Quick Links</DropdownMenuLabel>
          <DropdownMenuItem
            className="cursor-pointer hover:bg-gray-800"
            onClick={() => navigate('/organization-setup')}
          >
            <Building className="w-4 h-4 mr-3 text-orange-500" />
            <span className="text-white">Organization Wizard</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            className="cursor-pointer hover:bg-gray-800"
            onClick={() => navigate('/campaign-wizard')}
          >
            <UserCog className="w-4 h-4 mr-3 text-green-500" />
            <span className="text-white">Campaign Wizard</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}