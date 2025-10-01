import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Crown, ArrowRight, Sparkles, Clock, Shield } from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';

const ProSuccess = () => {
  const navigate = useNavigate();
  const { refreshProfile } = useProfile();
  const { toast } = useToast();

  useEffect(() => {
    // Refresh profile to get updated plan status
    const refreshUserProfile = async () => {
      try {
        // Wait a bit for webhook to process
        await new Promise(resolve => setTimeout(resolve, 2000));
        await refreshProfile();
        
        toast({
          title: "Pro-Upgrade erfolgreich!",
          description: "Dein Account wurde auf Pro aktualisiert. Alle Features sind jetzt verfügbar.",
        });
      } catch (error) {
        console.error('Error refreshing profile:', error);
      }
    };
    
    refreshUserProfile();

    // Auto-redirect after 10 seconds
    const timer = setTimeout(() => {
      navigate('/dashboard');
    }, 10000);

    return () => clearTimeout(timer);
  }, [navigate, refreshProfile, toast]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/10 to-primary/5 flex items-center justify-center">
      <div className="container mx-auto px-4">
        <Card className="max-w-2xl mx-auto premium-card border-primary/20 shadow-premium">
          <CardHeader className="text-center pb-8">
            <div className="flex justify-center mb-6 animate-fade-in">
              <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-4 rounded-full shadow-premium animate-pulse-glow">
                <CheckCircle className="h-12 w-12" />
              </div>
            </div>
            
            <CardTitle className="text-3xl font-bold mb-4 animate-fade-in">
              Herzlichen Glückwunsch! 🎉
            </CardTitle>
            
            <CardDescription className="text-lg animate-slide-up">
              Vielen Dank für dein Vertrauen in Workblix Pro!
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6 text-center">
            {/* Verification Notice */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-2 border-blue-200 dark:border-blue-800 rounded-xl p-6 animate-slide-up">
              <div className="flex justify-center mb-4">
                <div className="bg-blue-500 text-white p-3 rounded-full">
                  <Shield className="h-6 w-6" />
                </div>
              </div>
              
              <h3 className="text-xl font-semibold mb-3 text-blue-900 dark:text-blue-100">
                Aktivierung wird geprüft
              </h3>
              
              <div className="space-y-3 text-sm text-blue-800 dark:text-blue-200">
                <p className="leading-relaxed">
                  Deine Zahlung war erfolgreich! Unser Team überprüft gerade deine Abonnement-Aktivierung, 
                  um höchste Sicherheit und Qualität zu gewährleisten.
                </p>
                
                <div className="flex items-center justify-center gap-2 pt-2">
                  <Clock className="h-5 w-5 text-blue-600 dark:text-blue-300" />
                  <span className="font-semibold text-blue-900 dark:text-blue-100">
                    Aktivierung in ca. 30 Minuten
                  </span>
                </div>
                
                <p className="text-xs pt-2 text-blue-700 dark:text-blue-300">
                  Du erhältst eine E-Mail-Bestätigung, sobald dein Pro-Account vollständig aktiviert ist.
                </p>
              </div>
            </div>

            <div className="animate-slide-up">
              <div className="flex justify-center mb-4">
                <div className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground p-3 rounded-xl">
                  <Crown className="h-8 w-8" />
                </div>
              </div>
              
              <h2 className="text-2xl font-semibold mb-4 gradient-text">
                Willkommen bei Workblix Pro!
              </h2>
              
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Nach der Aktivierung hast du Zugang zu allen Premium-Features und kannst unbegrenzt 
                professionelle Bewerbungen erstellen.
              </p>
            </div>

            {/* Pro Features Unlocked */}
            <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl p-6 animate-fade-in">
              <div className="flex items-center justify-center mb-4">
                <Sparkles className="h-5 w-5 text-primary mr-2" />
                <span className="font-semibold text-primary">Bald verfügbar für dich:</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                {[
                  "Unbegrenzte Bewerbungen",
                  "PDF-Downloads",
                  "Premium-Vorlagen",
                  "URL Scanner",
                  "Prioritätssupport",
                  "Beta-Features"
                ].map((feature, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6 animate-slide-up">
              <Button 
                onClick={() => navigate('/dashboard')}
                className="button-glow"
                size="lg"
              >
                Zum Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => navigate('/generate')}
                size="lg"
              >
                Erste Pro-Bewerbung erstellen
              </Button>
            </div>

            {/* Auto Redirect Notice */}
            <p className="text-xs text-muted-foreground pt-4">
              Du wirst automatisch in 10 Sekunden zum Dashboard weitergeleitet
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProSuccess;