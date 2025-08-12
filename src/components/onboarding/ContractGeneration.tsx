import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Checkbox } from '../ui/checkbox';
import { Badge } from '../ui/badge';
import { FileText, CreditCard, Shield, Check, Download } from 'lucide-react';

interface ContractGenerationProps {
  data: any;
  onComplete: (data: any) => void;
  onPrevious?: () => void;
  loading?: boolean;
}

const ContractGeneration: React.FC<ContractGenerationProps> = ({
  data,
  onComplete,
  onPrevious,
  loading = false,
}) => {
  const [agreed, setAgreed] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    billingAddress: '',
  });

  const handleSubmit = () => {
    onComplete({
      contract: {
        signed: true,
        signedDate: new Date(),
        contractId: `APEX-${Date.now()}`,
        paymentMethodId: 'pm_test_123',
        billingCycle: data.contract?.billingCycle || 'monthly',
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Contract Preview */}
      <Card className="border-gray-700 bg-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center text-white">
            <FileText className="mr-2 h-5 w-5" />
            Service Agreement
          </CardTitle>
          <CardDescription>Review and sign your service agreement</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-gray-700 bg-gray-900 p-6">
            <div className="space-y-4 text-sm text-gray-300">
              <div className="border-b border-gray-700 pb-4">
                <h3 className="mb-2 font-semibold text-white">CLIENT INFORMATION</h3>
                <p>
                  <strong>Company:</strong> {data.prospect?.company}
                </p>
                <p>
                  <strong>Contact:</strong> {data.prospect?.firstName} {data.prospect?.lastName}
                </p>
                <p>
                  <strong>Email:</strong> {data.prospect?.email}
                </p>
              </div>

              <div className="border-b border-gray-700 pb-4">
                <h3 className="mb-2 font-semibold text-white">SERVICE PLAN</h3>
                <p>
                  <strong>Plan:</strong> {data.selectedPlan?.tier} Plan
                </p>
                <p>
                  <strong>Monthly Fee:</strong> ${data.selectedPlan?.price}
                </p>
                <p>
                  <strong>Billing Cycle:</strong> {data.contract?.billingCycle}
                </p>
              </div>

              <div className="border-b border-gray-700 pb-4">
                <h3 className="mb-2 font-semibold text-white">FEATURES INCLUDED</h3>
                <ul className="list-inside list-disc space-y-1">
                  {data.selectedPlan?.features?.map((feature: string, index: number) => (
                    <li key={index}>{feature}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="mb-2 font-semibold text-white">TERMS & CONDITIONS</h3>
                <ul className="space-y-1">
                  <li>• Service begins upon contract signature and payment</li>
                  <li>• 30-day money-back guarantee</li>
                  <li>• Cancel anytime with 30-day notice</li>
                  <li>
                    • Setup assistance included: {data.selectedPlan?.setupAssistance ? 'Yes' : 'No'}
                  </li>
                  <li>• Support level: {data.selectedPlan?.priority} priority</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Payment Information */}
      <Card className="border-gray-700 bg-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center text-white">
            <CreditCard className="mr-2 h-5 w-5" />
            Payment Information
          </CardTitle>
          <CardDescription>Secure payment processing powered by Stripe</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <Label htmlFor="cardNumber" className="text-white">
                Card Number
              </Label>
              <Input
                id="cardNumber"
                placeholder="1234 5678 9012 3456"
                value={paymentInfo.cardNumber}
                onChange={(e) =>
                  setPaymentInfo((prev) => ({ ...prev, cardNumber: e.target.value }))
                }
                className="border-gray-600 bg-gray-700 text-white"
              />
            </div>

            <div>
              <Label htmlFor="expiryDate" className="text-white">
                Expiry Date
              </Label>
              <Input
                id="expiryDate"
                placeholder="MM/YY"
                value={paymentInfo.expiryDate}
                onChange={(e) =>
                  setPaymentInfo((prev) => ({ ...prev, expiryDate: e.target.value }))
                }
                className="border-gray-600 bg-gray-700 text-white"
              />
            </div>

            <div>
              <Label htmlFor="cvv" className="text-white">
                CVV
              </Label>
              <Input
                id="cvv"
                placeholder="123"
                value={paymentInfo.cvv}
                onChange={(e) => setPaymentInfo((prev) => ({ ...prev, cvv: e.target.value }))}
                className="border-gray-600 bg-gray-700 text-white"
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="billingAddress" className="text-white">
                Billing Address
              </Label>
              <Textarea
                id="billingAddress"
                placeholder="123 Main St, City, State 12345"
                value={paymentInfo.billingAddress}
                onChange={(e) =>
                  setPaymentInfo((prev) => ({ ...prev, billingAddress: e.target.value }))
                }
                className="border-gray-600 bg-gray-700 text-white"
                rows={3}
              />
            </div>
          </div>

          <div className="flex items-center space-x-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-4">
            <Shield className="h-5 w-5 text-emerald-400" />
            <span className="text-sm text-emerald-400">
              Your payment information is secured with 256-bit SSL encryption
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Billing Summary */}
      <Card className="border-gray-700 bg-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Billing Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-400">{data.selectedPlan?.tier} Plan</span>
              <span className="text-white">${data.selectedPlan?.price}</span>
            </div>

            {data.contract?.billingCycle === 'annual' && (
              <div className="flex justify-between text-emerald-400">
                <span>Annual Discount (15%)</span>
                <span>-${Math.round((data.selectedPlan?.price || 0) * 0.15)}</span>
              </div>
            )}

            <div className="flex justify-between">
              <span className="text-gray-400">Setup Fee</span>
              <span className="text-white">$0</span>
            </div>

            <div className="flex justify-between border-t border-gray-700 pt-3 font-semibold">
              <span className="text-white">
                Total {data.contract?.billingCycle === 'annual' ? '(First Year)' : '(Monthly)'}
              </span>
              <span className="text-emerald-400">
                $
                {data.contract?.billingCycle === 'annual'
                  ? Math.round((data.selectedPlan?.price || 0) * 12 * 0.85)
                  : data.selectedPlan?.price}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Agreement Checkbox */}
      <Card className="border-gray-700 bg-gray-800">
        <CardContent className="pt-6">
          <div className="flex items-start space-x-3">
            <Checkbox
              id="agreement"
              checked={agreed}
              onCheckedChange={(checked) => setAgreed(checked as boolean)}
              className="mt-1"
            />
            <div className="flex-1">
              <Label htmlFor="agreement" className="cursor-pointer text-white">
                I agree to the terms and conditions
              </Label>
              <p className="mt-1 text-sm text-gray-400">
                By checking this box, I agree to the service agreement, terms of service, and
                privacy policy. I authorize Apex AI to charge my payment method for the selected
                plan.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-between">
        {onPrevious && (
          <Button variant="outline" onClick={onPrevious}>
            Previous
          </Button>
        )}

        <Button
          onClick={handleSubmit}
          disabled={loading || !agreed}
          className="ml-auto bg-emerald-600 text-white hover:bg-emerald-700"
        >
          {loading ? (
            'Processing Payment...'
          ) : (
            <>
              <CreditCard className="mr-2 h-4 w-4" />
              Sign Contract & Pay
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default ContractGeneration;
