import React from 'react';
import { Phone, Clock, User, MapPin } from 'lucide-react';

export const LiveCalls: React.FC = () => {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Live Calls</h1>
        <p className="text-gray-600">Monitor active calls in real-time</p>
      </div>
      
      <div className="grid gap-4">
        {/* Mock live call data */}
        <div className="rounded-lg border p-4 bg-green-50 border-green-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Phone className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium">John Doe</p>
                <p className="text-sm text-gray-600">+1 (555) 123-4567</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <Clock className="h-4 w-4" />
                <span>02:34</span>
              </div>
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <MapPin className="h-4 w-4" />
                <span>New York, NY</span>
              </div>
              <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
        
        <div className="rounded-lg border p-4 bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Phone className="h-5 w-5 text-blue-600" />
              <div>
                <p className="font-medium">Jane Smith</p>
                <p className="text-sm text-gray-600">+1 (555) 987-6543</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <Clock className="h-4 w-4" />
                <span>01:12</span>
              </div>
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <MapPin className="h-4 w-4" />
                <span>Los Angeles, CA</span>
              </div>
              <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
        
        <div className="rounded-lg border p-8 text-center text-gray-500">
          <Phone className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium mb-2">No More Active Calls</h3>
          <p>All other calls have been completed.</p>
        </div>
      </div>
    </div>
  );
};