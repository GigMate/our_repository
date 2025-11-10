import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Music, MapPin, Calendar, DollarSign, Star, Users,
  ArrowRight, Check, Shield, Ticket, MessageSquare
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface TourStep {
  icon: React.ReactNode;
  title: string;
  description: string;
  features: string[];
}

export default function OnboardingTour() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [completing, setCompleting] = useState(false);

  const tourSteps: TourStep[] = [
    {
      icon: <Music className="w-16 h-16 text-blue-600" />,
      title: 'Welcome to GigMate Beta!',
      description: 'The revolutionary platform connecting musicians, venues, and fans.',
      features: [
        'Book gigs and manage your calendar',
        'Secure escrow payments',
        'Built-in ticketing system',
        'Real-time messaging',
        'Professional contracts'
      ]
    },
    {
      icon: <MapPin className="w-16 h-16 text-blue-600" />,
      title: 'Discover & Connect',
      description: 'Find the perfect matches in your area.',
      features: [
        'Search by location, genre, and availability',
        'View detailed profiles and portfolios',
        'Check ratings and reviews',
        'See upcoming shows and availability',
        'Filter by distance and preferences'
      ]
    },
    {
      icon: <Calendar className="w-16 h-16 text-blue-600" />,
      title: 'Easy Booking System',
      description: 'Book gigs in minutes, not hours.',
      features: [
        'Send booking requests with one click',
        'Automated contract generation',
        'Calendar integration',
        'Instant notifications',
        'Track all your bookings in one place'
      ]
    },
    {
      icon: <DollarSign className="w-16 h-16 text-blue-600" />,
      title: 'Secure Payments',
      description: 'Get paid safely and on time.',
      features: [
        'Escrow holds funds until show completion',
        'Automatic payout after successful gigs',
        'Transparent fee structure',
        'Dispute resolution system',
        'Track all your earnings'
      ]
    },
    {
      icon: <Ticket className="w-16 h-16 text-blue-600" />,
      title: 'Ticketing & Promotion',
      description: 'Sell tickets and promote your shows.',
      features: [
        'Built-in ticketing with QR codes',
        'Social media integration',
        'Email notifications to fans',
        'Track ticket sales in real-time',
        'No hidden fees for fans'
      ]
    },
    {
      icon: <Shield className="w-16 h-16 text-blue-600" />,
      title: 'Beta Tester Responsibilities',
      description: 'What we need from you.',
      features: [
        'Test all features thoroughly',
        'Report bugs and issues promptly',
        'Provide honest feedback',
        'Keep all information confidential (NDA)',
        'Help us build the best platform'
      ]
    },
    {
      icon: <Star className="w-16 h-16 text-blue-600" />,
      title: 'Beta Tester Rewards',
      description: 'Thank you for being an early supporter!',
      features: [
        'LIFETIME Pro membership ($240/year value - Forever!)',
        '50% discount on Business tier upgrades ($25/mo instead of $50/mo)',
        '100 free credits ($50 value)',
        'Exclusive Beta Tester badge on your profile',
        'First access to all new features',
        'Priority customer support'
      ]
    }
  ];

  const currentTour = tourSteps[currentStep];

  async function handleNext() {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);

      if (user) {
        await supabase.rpc('update_onboarding_progress', {
          p_user_id: user.id,
          p_step: `step_${currentStep + 1}`
        });
      }
    } else {
      handleComplete();
    }
  }

  async function handleComplete() {
    if (!user) return;

    setCompleting(true);
    try {
      await supabase.rpc('update_onboarding_progress', {
        p_user_id: user.id,
        p_step: 'completed',
        p_completed: true
      });

      await supabase.rpc('mark_tour_completed', {
        p_user_id: user.id
      });

      navigate('/dashboard');
    } catch (error) {
      console.error('Error completing tour:', error);
      setCompleting(false);
    }
  }

  function handleSkip() {
    navigate('/dashboard');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-3xl w-full">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="p-8">
            <div className="flex justify-center mb-6">
              {currentTour.icon}
            </div>

            <h2 className="text-3xl font-bold text-gray-900 text-center mb-4">
              {currentTour.title}
            </h2>

            <p className="text-lg text-gray-600 text-center mb-8">
              {currentTour.description}
            </p>

            <div className="space-y-3 mb-8">
              {currentTour.features.map((feature, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg"
                >
                  <Check className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">{feature}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-center gap-2 mb-8">
              {tourSteps.map((_, index) => (
                <div
                  key={index}
                  className={`h-2 rounded-full transition-all ${
                    index === currentStep
                      ? 'w-8 bg-blue-600'
                      : index < currentStep
                      ? 'w-2 bg-blue-400'
                      : 'w-2 bg-gray-300'
                  }`}
                />
              ))}
            </div>

            <div className="flex gap-4">
              {currentStep > 0 && (
                <button
                  onClick={() => setCurrentStep(currentStep - 1)}
                  className="flex-1 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Previous
                </button>
              )}

              {currentStep === 0 && (
                <button
                  onClick={handleSkip}
                  className="flex-1 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Skip Tour
                </button>
              )}

              <button
                onClick={handleNext}
                disabled={completing}
                className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 font-medium flex items-center justify-center gap-2"
              >
                {completing ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Finishing...
                  </>
                ) : currentStep === tourSteps.length - 1 ? (
                  <>
                    Get Started
                    <ArrowRight className="w-5 h-5" />
                  </>
                ) : (
                  <>
                    Next
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </div>

          {currentStep === tourSteps.length - 1 && (
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 text-center">
              <p className="text-lg">
                Ready to revolutionize live music? Let's go!
              </p>
            </div>
          )}
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Step {currentStep + 1} of {tourSteps.length}
          </p>
        </div>
      </div>
    </div>
  );
}
