import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Crown, Check, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PremiumUpgradePromptProps {
  feature: string;
  description: string;
  benefits?: string[];
}

export default function PremiumUpgradePrompt({ 
  feature, 
  description, 
  benefits = [] 
}: PremiumUpgradePromptProps) {
  const navigate = useNavigate();

  const defaultBenefits = [
    'Professionelle CV-Vorlagen',
    'Unbegrenzte Bewerbungen',
    'Premium-Anpassungsoptionen',
    'Prioritätssupport'
  ];

  const allBenefits = benefits.length > 0 ? benefits : defaultBenefits;

  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5">
      <CardHeader className="text-center">
        <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center mb-4">
          <Crown className="h-8 w-8 text-white" />
        </div>
        <CardTitle className="flex items-center justify-center gap-2 text-xl">
          <Sparkles className="h-5 w-5 text-primary" />
          Premium Feature: {feature}
          <Badge variant="default" className="bg-primary">Pro</Badge>
        </CardTitle>
        <CardDescription className="text-base">
          {description}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {allBenefits.map((benefit, index) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
              <span>{benefit}</span>
            </div>
          ))}
        </div>

        <div className="text-center space-y-4">
          <div className="bg-white/50 backdrop-blur-sm rounded-lg p-4">
            <div className="text-2xl font-bold text-primary">9,99 CHF</div>
            <div className="text-sm text-muted-foreground">pro Monat</div>
          </div>
          
          <Button 
            onClick={() => navigate('/pro-upgrade')}
            className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
            size="lg"
          >
            <Crown className="h-5 w-5 mr-2" />
            Jetzt auf Pro upgraden
          </Button>
          
          <p className="text-xs text-muted-foreground">
            Jederzeit kündbar • Keine Bindung • Sofortiger Zugang
          </p>
        </div>
      </CardContent>
    </Card>
  );
}