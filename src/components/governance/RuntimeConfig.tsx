
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import React from 'react';

// Stub for Assistant Runtime Configuration
// Allows Admins to set limits and cost controls.

export const RuntimeConfigEditor: React.FC = () => {
  return (
    <div className="space-y-6">
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-zinc-100">Runtime Governance</CardTitle>
          <p className="text-sm text-zinc-400">Control assistant behavior limits and compliance settings.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
             <div className="p-4 bg-zinc-950/50 rounded border border-zinc-800">
                <h4 className="text-zinc-200 font-medium mb-2">Duration Limit (Seconds)</h4>
                <input 
                  type="number" 
                  className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-zinc-100" 
                  placeholder="600"
                  defaultValue={600}
                />
             </div>
             <div className="p-4 bg-zinc-950/50 rounded border border-zinc-800">
                <h4 className="text-zinc-200 font-medium mb-2">Cost Limit (USD)</h4>
                <input 
                  type="number" 
                  className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-zinc-100" 
                  placeholder="5.00"
                  defaultValue={5.00}
                />
             </div>
          </div>
          
          <div className="p-4 bg-zinc-950/50 rounded border border-zinc-800 flex items-center justify-between">
             <div>
                <h4 className="text-zinc-200 font-medium">Compliance Mode</h4>
                <p className="text-xs text-zinc-500">Enforce strict redaction and recording policies.</p>
             </div>
             <div className="h-6 w-11 bg-emerald-500/20 rounded-full border border-emerald-500/50 flex items-center px-1">
                <div className="h-4 w-4 bg-emerald-500 rounded-full translate-x-5 transition-transform" />
             </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="flex justify-end">
         <button className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-md font-medium transition-colors">
            Save Configuration
         </button>
      </div>
    </div>
  );
};
