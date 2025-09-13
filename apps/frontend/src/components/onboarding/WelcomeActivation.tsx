import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { CheckCircle, Calendar, Phone, BookOpen, Rocket } from 'lucide-react';

interface WelcomeActivationProps {
  data: any;
  onComplete: (data: any) => void;
  onPrevious?: () => void;
  loading?: boolean;
}

const WelcomeActivation: React.FC<WelcomeActivationProps> = ({
  data,
  onComplete,
  onPrevious,
  loading = false,
}) => {
  const handleSubmit = () => {
    onComplete({
      completed: true,
      activatedAt: new Date(),
    });
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <CheckCircle className="mx-auto mb-4 h-16 w-16 text-emerald-400" />
        <h2 className="mb-4 text-3xl font-bold text-white">🎉 Welcome to Apex AI!</h2>
        <p className="text-gray-400">
          Congratulations! Your AI calling platform is ready to transform your business.
        </p>
      </div>

      <Card className="border-emerald-500/20 bg-gradient-to-r from-emerald-500/10 to-blue-500/10">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 gap-6 text-center md:grid-cols-3">
            <div>
              <div className="text-2xl font-bold text-emerald-400">24/7</div>
              <div className="text-gray-300">AI Availability</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-emerald-400">3x</div>
              <div className="text-gray-300">Faster Response</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-emerald-400">60%</div>
              <div className="text-gray-300">Cost Savings</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card className="border-gray-700 bg-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center text-white">
              <Rocket className="mr-2 h-5 w-5" />
              Next Steps
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              <li className="flex items-start">
                <CheckCircle className="mr-3 mt-0.5 h-5 w-5 text-emerald-400" />
                <div>
                  <div className="font-medium text-white">Access Your Dashboard</div>
                  <div className="text-sm text-gray-400">
                    Login at {data.provisioning?.subdomain}.apex.ai
                  </div>
                </div>
              </li>
              <li className="flex items-start">
                <Calendar className="mr-3 mt-0.5 h-5 w-5 text-blue-400" />
                <div>
                  <div className="font-medium text-white">Setup Call Scheduled</div>
                  <div className="text-sm text-gray-400">
                    {data.selectedPlan?.setupAssistance
                      ? 'Our team will contact you within 24 hours'
                      : 'Follow our self-service guide'}
                  </div>
                </div>
              </li>
              <li className="flex items-start">
                <Phone className="mr-3 mt-0.5 h-5 w-5 text-emerald-400" />
                <div>
                  <div className="font-medium text-white">First Campaign Ready</div>
                  <div className="text-sm text-gray-400">
                    Your AI assistant is configured and ready
                  </div>
                </div>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card className="border-gray-700 bg-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center text-white">
              <BookOpen className="mr-2 h-5 w-5" />
              Resources
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-emerald-400 hover:text-emerald-300">
                  📚 Quick Start Guide
                </a>
              </li>
              <li>
                <a href="#" className="text-emerald-400 hover:text-emerald-300">
                  🎥 Video Tutorials
                </a>
              </li>
              <li>
                <a href="#" className="text-emerald-400 hover:text-emerald-300">
                  💬 Community Forum
                </a>
              </li>
              <li>
                <a href="#" className="text-emerald-400 hover:text-emerald-300">
                  📞 Support Center
                </a>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <div className="text-center">
        <Button
          onClick={handleSubmit}
          disabled={loading}
          size="lg"
          className="bg-emerald-600 px-8 text-white hover:bg-emerald-700"
        >
          🚀 Launch My AI Calling Platform
        </Button>
      </div>
    </div>
  );
};

export default WelcomeActivation;
