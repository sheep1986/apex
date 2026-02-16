import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, FileText, Printer } from 'lucide-react';
import React, { useRef } from 'react';

interface LedgerEntry {
  id: string;
  amount: number;
  type: string;
  description: string;
  created_at: string;
}

interface StatementProps {
  orgName: string;
  orgId: string;
  plan: string;
  periodStart: string;
  periodEnd: string;
  entries: LedgerEntry[];
  creditBalance: number;
  onClose: () => void;
}

export const BillingStatement: React.FC<StatementProps> = ({
  orgName,
  orgId,
  plan,
  periodStart,
  periodEnd,
  entries,
  creditBalance,
  onClose,
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  const totalCredits = entries
    .filter((e) => e.amount > 0)
    .reduce((sum, e) => sum + e.amount, 0);
  const totalCharges = entries
    .filter((e) => e.amount < 0)
    .reduce((sum, e) => sum + Math.abs(e.amount), 0);

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>Billing Statement - ${orgName}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; color: #1a1a1a; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; }
            .logo { font-size: 24px; font-weight: 700; color: #10b981; }
            .info { text-align: right; font-size: 13px; color: #666; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th { background: #f3f4f6; padding: 10px 12px; text-align: left; font-size: 12px; text-transform: uppercase; color: #6b7280; border-bottom: 2px solid #e5e7eb; }
            td { padding: 10px 12px; border-bottom: 1px solid #f3f4f6; font-size: 14px; }
            .amount-positive { color: #10b981; }
            .amount-negative { color: #ef4444; }
            .totals { margin-top: 20px; padding: 15px; background: #f9fafb; border-radius: 8px; }
            .totals div { display: flex; justify-content: space-between; padding: 4px 0; font-size: 14px; }
            .totals .total-row { font-weight: 600; font-size: 16px; border-top: 1px solid #e5e7eb; margin-top: 8px; padding-top: 8px; }
            .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #9ca3af; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="logo">Trinity Labs AI</div>
              <div style="font-size:12px;color:#666;margin-top:4px;">Voice AI Platform</div>
            </div>
            <div class="info">
              <strong>Billing Statement</strong><br/>
              ${orgName}<br/>
              Period: ${new Date(periodStart).toLocaleDateString()} — ${new Date(periodEnd).toLocaleDateString()}<br/>
              Generated: ${new Date().toLocaleDateString()}
            </div>
          </div>
          <table>
            <thead>
              <tr><th>Date</th><th>Description</th><th>Type</th><th style="text-align:right">Amount</th></tr>
            </thead>
            <tbody>
              ${entries.map(e => `
                <tr>
                  <td>${new Date(e.created_at).toLocaleDateString()}</td>
                  <td>${e.description || e.type}</td>
                  <td>${e.type}</td>
                  <td style="text-align:right" class="${e.amount >= 0 ? 'amount-positive' : 'amount-negative'}">
                    ${e.amount >= 0 ? '+' : ''}$${Math.abs(e.amount).toFixed(2)}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="totals">
            <div><span>Total Credits</span><span class="amount-positive">+$${totalCredits.toFixed(2)}</span></div>
            <div><span>Total Charges</span><span class="amount-negative">-$${totalCharges.toFixed(2)}</span></div>
            <div class="total-row"><span>Current Balance</span><span>$${creditBalance.toFixed(2)}</span></div>
          </div>
          <div class="footer">
            <p>Trinity Labs AI &middot; Powered by advanced voice technology</p>
            <p>This is an automatically generated statement. For questions, contact support.</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-lg border border-gray-800 bg-gray-900">
        <div ref={printRef}>
          <CardHeader className="border-b border-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-white">
                  <FileText className="h-5 w-5 text-emerald-400" />
                  Billing Statement
                </CardTitle>
                <p className="text-sm text-gray-400 mt-1">
                  {orgName} &middot; {plan ? plan.charAt(0).toUpperCase() + plan.slice(1) : 'Free'} Plan
                </p>
                <p className="text-xs text-gray-500">
                  Period: {new Date(periodStart).toLocaleDateString()} — {new Date(periodEnd).toLocaleDateString()}
                </p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={handlePrint} className="border-gray-700 text-gray-300">
                  <Printer className="mr-1 h-4 w-4" /> Print
                </Button>
                <Button size="sm" variant="outline" onClick={onClose} className="border-gray-700 text-gray-300">
                  Close
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6 space-y-4">
            {/* Line items */}
            <div className="rounded-lg border border-gray-800 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-800 bg-gray-800/50">
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase">Date</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase">Description</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase">Type</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-400 uppercase">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-gray-500">No transactions in this period</td>
                    </tr>
                  ) : (
                    entries.map((entry) => (
                      <tr key={entry.id} className="border-b border-gray-800/50">
                        <td className="px-4 py-2 text-sm text-gray-300">{new Date(entry.created_at).toLocaleDateString()}</td>
                        <td className="px-4 py-2 text-sm text-white">{entry.description || entry.type}</td>
                        <td className="px-4 py-2 text-sm text-gray-400 capitalize">{entry.type.replace(/_/g, ' ')}</td>
                        <td className={`px-4 py-2 text-sm text-right font-medium ${entry.amount >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {entry.amount >= 0 ? '+' : ''}${Math.abs(entry.amount).toFixed(2)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="rounded-lg bg-gray-800/50 p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Total Credits</span>
                <span className="text-emerald-400 font-medium">+${totalCredits.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Total Charges</span>
                <span className="text-red-400 font-medium">-${totalCharges.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-base font-semibold border-t border-gray-700 pt-2 mt-2">
                <span className="text-white">Current Balance</span>
                <span className="text-white">${creditBalance.toFixed(2)}</span>
              </div>
            </div>

            <p className="text-xs text-gray-500 text-center">
              Generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()} &middot;
              Trinity Labs AI
            </p>
          </CardContent>
        </div>
      </div>
    </div>
  );
};
