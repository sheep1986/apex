
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import React from 'react';

// Stub for JSON Schema Route Editor
// Visualizes the inbound_routes config JSON

export const InboundRouteEditor: React.FC = () => {
  return (
    <div className="space-y-6">
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-zinc-100">IVR & Routing Config</CardTitle>
          <p className="text-sm text-zinc-400">Define call flow logic using JSON Schema.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          
          <div className="p-4 bg-zinc-950/50 rounded border border-zinc-800 font-mono text-sm">
             <textarea 
                className="w-full h-64 bg-transparent resize-none text-emerald-400 focus:outline-none"
                defaultValue={JSON.stringify({
                    "type": "direct",
                    "destination": {
                        "type": "assistant",
                        "targetId": "uuid-here"
                    },
                    "business_hours": {
                        "enabled": true,
                        "schedule": "Mon-Fri 09:00-17:00"
                    }
                }, null, 2)}
             />
          </div>

          <p className="text-xs text-zinc-500">
             Validates against <code>inbound_routes.schema.json</code>
          </p>

        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
         <button className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-4 py-2 rounded-md font-medium transition-colors">
            Validate Schema
         </button>
         <button className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-md font-medium transition-colors">
            Deploy Route
         </button>
      </div>
    </div>
  );
};
