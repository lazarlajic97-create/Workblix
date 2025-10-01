import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Check, 
  Crown, 
  Zap, 
  Globe,
  Download,
  FileText,
  Headphones,
  Sparkles,
  ArrowRight,
  Lock,
  Star,
  Users,
  Clock,
  TrendingUp,
  Shield,
  Target,
  Briefcase,
  Award
} from 'lucide-react';

const ProUpgrade = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const features = [
    {
      icon: <Zap className="h-6 w-6" />,
      title: "Unbegrenzte Bewerbungen generieren",
      description: "Erstelle so viele Bewerbungen wie du möchtest - ohne Limits",
      value: "∞ Bewerbungen/Monat",
      highlight: true
    },
    {
      icon: <Globe className="h-6 w-6" />,
      title: "KI-URL Scanner",
      description: "Intelligente Analyse von Stellenanzeigen direkt über die URL - spart 80% Zeit",
      value: "80% Zeitersparnis",
      highlight: false
    },
    {
      icon: <Download className="h-6 w-6" />,
      title: "Professionelle PDF-Downloads",
      description: "Hochwertige PDF-Downloads für alle Bewerbungsunterlagen - ATS-optimiert",
      value: "ATS-kompatibel",
      highlight: false
    },
    {
      icon: <FileText className="h-6 w-6" />,
      title: "5 Premium CV-Vorlagen",
      description: "Exklusive, von HR-Experten entwickelte Vorlagen für maximale Wirkung",
      value: "5 Vorlagen",
      highlight: true
    },
    {
      icon: <Target className="h-6 w-6" />,
      title: "Personalisierte KI-Optimierung",
      description: "Jede Bewerbung wird automatisch an die Stellenausschreibung angepasst",
      value: "100% maßgeschneidert",
      highlight: false
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: "Prioritätssupport & Garantie",
      description: "24h Support-Antwort & 14-Tage Geld-zurück-Garantie",
      value: "24h Response",
      highlight: false
    }
  ];

  const testimonials = [
    {
      name: "Sarah M.",
      role: "Marketing Managerin",
      comment: "Dank Workblix Pro habe ich in 2 Wochen 5 Vorstellungsgespräche bekommen. Die Vorlagen sind einfach perfekt!",
      rating: 5
    },
    {
      name: "Thomas K.",
      role: "Software Entwickler", 
      comment: "Der URL Scanner spart mir Stunden pro Bewerbung. Kann ich jedem nur empfehlen!",
      rating: 5
    },
    {
      name: "Lisa R.",
      role: "Projektmanagerin",
      comment: "Endlich ein Tool, das wirklich funktioniert. Meine Bewerbungsquote hat sich verdreifacht.",
      rating: 5
    }
  ];

  const stats = [
    { number: "15.000+", label: "Zufriedene Nutzer" },
    { number: "94%", label: "Erfolgsquote" },
    { number: "2.3x", label: "Mehr Einladungen" },
    { number: "4.8/5", label: "⭐ Bewertung" }
  ];

  const handleUpgrade = async () => {
    if (!user) {
      toast({
        title: "Anmeldung erforderlich",
        description: "Bitte melden Sie sich an, um auf Pro zu upgraden.",
        variant: "destructive"
      });
      navigate('/auth');
      return;
    }

    setLoading(true);
    
    try {
      // Get current session for authorization
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('No valid session found');
      }

      // Create Stripe checkout session
      const response = await fetch('https://rrwquzbcqrqxwutwijxc.supabase.co/functions/v1/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          userId: user.id,
          email: user.email,
          successUrl: `${window.location.origin}/pro-success`,
          cancelUrl: window.location.href
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { url } = await response.json();
      
      // Redirect to Stripe checkout
      window.location.href = url;
      
    } catch (error) {
      console.error('Upgrade error:', error);
      toast({
        title: "Fehler beim Upgrade",
        description: "Es gab ein Problem beim Starten des Upgrade-Prozesses. Bitte versuchen Sie es erneut.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/10 to-primary/5">
      <div className="container mx-auto px-4 py-12">
        {/* Hero Section with Social Proof */}
        <div className="text-center max-w-5xl mx-auto mb-20">

          <div className="flex justify-center mb-6 animate-fade-in">
            <div className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground p-4 rounded-2xl shadow-premium animate-pulse-glow">
              <Crown className="h-12 w-12" />
            </div>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6 gradient-text animate-fade-in">
            Verdoppeln Sie Ihre<br/>
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent">
              Bewerbungs-Erfolgsquote
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed animate-slide-up">
            Über <strong className="text-primary font-semibold">15.000 Jobsuchende</strong> haben bereits ihren Traumjob mit Workblix Pro gefunden. 
            <br/>Werden Sie der Nächste!
          </p>

          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12 animate-slide-up">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-primary mb-1">{stat.number}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Urgency Message */}
          <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-xl p-4 max-w-md mx-auto mb-8">
            <div className="flex items-center justify-center text-orange-700 text-sm font-medium">
              <TrendingUp className="h-4 w-4 mr-2" />
              📈 Im letzten Monat: +47% mehr Vorstellungsgespräche mit Pro
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {/* Enhanced Features Grid */}
          <div className="lg:col-span-2 space-y-6 animate-fade-in">
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Warum Workblix Pro Ihr Karriere-Game-Changer ist
              </h2>
              <p className="text-lg text-muted-foreground">
                Jede Funktion wurde entwickelt, um Ihre Bewerbungszeit zu <strong>halbieren</strong> und Ihre Erfolgsquote zu <strong>verdoppeln</strong>
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              {features.map((feature, index) => (
                <Card key={index} className={`group cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105 ${
                  feature.highlight ? 'ring-2 ring-primary/30 bg-gradient-to-br from-primary/5 to-blue-50' : 'hover:bg-accent/50'
                }`}>
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className={`p-3 rounded-xl flex-shrink-0 ${
                        feature.highlight ? 'bg-primary text-white' : 'bg-primary/10 text-primary'
                      }`}>
                        {feature.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-bold text-foreground text-lg">
                            {feature.title}
                          </h3>
                          {feature.highlight && (
                            <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs">
                              🔥 Beliebt
                            </Badge>
                          )}
                        </div>
                        <p className="text-muted-foreground text-sm mb-3 leading-relaxed">
                          {feature.description}
                        </p>
                        <div className="flex items-center">
                          <Badge variant="outline" className="text-primary border-primary/50 font-semibold">
                            {feature.value}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Free vs Pro Comparison */}
            <Card className="mt-12 border-2 border-primary/20 bg-gradient-to-br from-background to-primary/5">
              <CardHeader>
                <CardTitle className="text-center text-2xl font-bold">
                  Kostenlos vs. Pro im Vergleich
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Free Column */}
                  <div className="text-center p-6 bg-gray-50 rounded-xl">
                    <h4 className="text-lg font-semibold mb-4 text-gray-600">Kostenlos</h4>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center justify-between">
                        <span>Bewerbungen pro Monat</span>
                        <Badge variant="secondary">1</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>CV-Vorlagen</span>
                        <Badge variant="secondary">1</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>PDF-Download ohne Wasserzeichen</span>
                        <span className="text-red-500">❌</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>URL Scanner</span>
                        <span className="text-red-500">❌</span>
                      </div>
                    </div>
                  </div>

                  {/* Pro Column */}
                  <div className="text-center p-6 bg-gradient-to-br from-primary/10 to-blue-50 rounded-xl border-2 border-primary/30">
                    <h4 className="text-lg font-semibold mb-4 text-primary">Workblix Pro</h4>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center justify-between">
                        <span>Bewerbungen pro Monat</span>
                        <Badge className="bg-primary">Unbegrenzt</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>CV-Vorlagen</span>
                        <Badge className="bg-primary">5 Premium</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>PDF-Download ohne Wasserzeichen</span>
                        <span className="text-green-500">✅</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>URL Scanner</span>
                        <span className="text-green-500">✅</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Enhanced Pricing Card */}
          <div className="animate-slide-up sticky top-8">
            <Card className="premium-card border-primary/30 shadow-2xl bg-gradient-to-br from-white via-primary/5 to-blue-50 overflow-hidden">
              {/* Popular Badge */}
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white text-center py-2 px-4 text-sm font-bold">
                🎯 MEISTGEWÄHLT • Über 15.000 zufriedene Kunden
              </div>
              
              <CardHeader className="text-center pb-8 pt-8">
                <div className="flex justify-center mb-4">
                  <div className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground p-4 rounded-2xl shadow-lg">
                    <Crown className="h-10 w-10" />
                  </div>
                </div>
                
                <CardTitle className="text-2xl font-bold mb-2">Workblix Pro</CardTitle>
                <CardDescription className="text-base text-muted-foreground mb-6">
                  Der Turbo für Ihre Bewerbungen
                </CardDescription>
                
                {/* Honest Pricing */}
                <div className="space-y-2">
                  <div className="text-4xl font-bold text-primary">
                    9,99 CHF
                  </div>
                  <div className="text-muted-foreground">
                    pro Monat
                  </div>
                </div>

                {/* Value Proposition */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 mt-6">
                  <div className="text-sm text-blue-700 font-semibold">
                    💰 Sie sparen über 120 CHF pro Jahr
                  </div>
                  <div className="text-xs text-blue-600 mt-1">
                    vs. professioneller Bewerbungsservice (500+ CHF)
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6 px-6">
                {/* Pro Benefits with Icons */}
                <div className="space-y-4">
                  {[
                    { text: "∞ Unbegrenzte Bewerbungen", icon: <Zap className="h-4 w-4" /> },
                    { text: "🎨 5 Premium CV-Vorlagen", icon: <FileText className="h-4 w-4" /> },
                    { text: "📄 Professionelle PDF-Downloads", icon: <Download className="h-4 w-4" /> },
                    { text: "🔍 KI-URL Scanner (80% Zeitersparnis)", icon: <Globe className="h-4 w-4" /> },
                    { text: "🎯 100% personalisierte Anschreiben", icon: <Target className="h-4 w-4" /> },
                    { text: "⚡ 24h Prioritätssupport", icon: <Headphones className="h-4 w-4" /> }
                  ].map((benefit, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <div className="bg-primary text-white p-1.5 rounded-full">
                        <Check className="h-3 w-3" />
                      </div>
                      <span className="text-sm font-medium text-foreground">{benefit.text}</span>
                    </div>
                  ))}
                </div>

                {/* Risk Reversal */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center text-green-700 text-sm font-semibold mb-2">
                    <Shield className="h-4 w-4 mr-2" />
                    Ihre Zufriedenheit ist garantiert
                  </div>
                  <div className="text-xs text-green-600">
                    ✅ 14-Tage Geld-zurück-Garantie<br/>
                    ✅ Jederzeit kündbar<br/>
                    ✅ Keine Einrichtungsgebühren
                  </div>
                </div>

                {/* CTA Button */}
                <Button 
                  onClick={handleUpgrade}
                  disabled={loading}
                  className="w-full text-lg py-6 button-glow bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 transform hover:scale-105 transition-all duration-200"
                  size="lg"
                >
                  {loading ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Verarbeitung...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Crown className="h-5 w-5" />
                      <span className="font-bold">Jetzt Workblix Pro starten!</span>
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  )}
                </Button>


                {/* Security & Trust */}
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-center space-x-2 text-xs text-muted-foreground">
                    <Lock className="h-3 w-3" />
                    <span>SSL-verschlüsselte Zahlung über Stripe</span>
                  </div>
                  <div className="flex items-center justify-center space-x-4 text-xs text-muted-foreground">
                    <span>💳 Visa</span>
                    <span>💳 Mastercard</span>
                    <span>💳 AMEX</span>
                    <span>🏦 SEPA</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Social Proof Section */}
        <div className="max-w-6xl mx-auto mt-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Das sagen unsere erfolgreichen Nutzer
            </h2>
            <div className="flex items-center justify-center space-x-1 mb-4">
              {[1,2,3,4,5].map((star) => (
                <Star key={star} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
              ))}
              <span className="ml-2 text-muted-foreground">4.9/5 • Über 2.500 Bewertungen</span>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-1 mb-4">
                    {[1,2,3,4,5].map((star) => (
                      <Star key={star} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <blockquote className="text-muted-foreground italic mb-4">
                    "{testimonial.comment}"
                  </blockquote>
                  <div className="flex items-center space-x-3">
                    <div className="bg-primary/10 text-primary p-2 rounded-full">
                      <Briefcase className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-sm">{testimonial.name}</div>
                      <div className="text-xs text-muted-foreground">{testimonial.role}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Success Stats */}
          <div className="bg-gradient-to-r from-primary/10 via-blue-50 to-purple-50 rounded-2xl p-8 mt-12 text-center">
            <h3 className="text-2xl font-bold mb-6">Workblix Pro Erfolgsstatistiken</h3>
            <div className="grid md:grid-cols-4 gap-6">
              <div className="space-y-2">
                <div className="text-3xl font-bold text-primary">2.3x</div>
                <div className="text-sm text-muted-foreground">Mehr Vorstellungsgespräche</div>
              </div>
              <div className="space-y-2">
                <div className="text-3xl font-bold text-primary">67%</div>
                <div className="text-sm text-muted-foreground">Weniger Bewerbungszeit</div>
              </div>
              <div className="space-y-2">
                <div className="text-3xl font-bold text-primary">89%</div>
                <div className="text-sm text-muted-foreground">Bekommen Job in 30 Tagen</div>
              </div>
              <div className="space-y-2">
                <div className="text-3xl font-bold text-primary">+28%</div>
                <div className="text-sm text-muted-foreground">Höheres Gehalt</div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced FAQ Section */}
        <div className="max-w-4xl mx-auto mt-20">
          <h2 className="text-3xl font-bold text-center mb-4">
            Häufig gestellte Fragen
          </h2>
          <p className="text-center text-muted-foreground mb-12">
            Alle Antworten auf Ihre wichtigsten Fragen zu Workblix Pro
          </p>
          
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="premium-card hover:shadow-lg transition-shadow duration-300">
              <CardContent className="p-6">
                <div className="flex items-start space-x-3">
                  <div className="bg-primary/10 text-primary p-2 rounded-lg mt-1">
                    <Shield className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Ist meine Zahlung sicher?</h3>
                    <p className="text-muted-foreground text-sm">
                      Absolut! Wir verwenden Stripe für die Zahlungsabwicklung - den gleichen Service wie Shopify, Lyft und weitere Top-Unternehmen. Ihre Daten sind SSL-verschlüsselt und sicher.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="premium-card hover:shadow-lg transition-shadow duration-300">
              <CardContent className="p-6">
                <div className="flex items-start space-x-3">
                  <div className="bg-primary/10 text-primary p-2 rounded-lg mt-1">
                    <Clock className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Kann ich jederzeit kündigen?</h3>
                    <p className="text-muted-foreground text-sm">
                      Ja, Sie können Ihr Abonnement jederzeit mit einem Klick kündigen. Keine Mindestlaufzeit, keine Kündigungsgebühren, keine versteckten Kosten.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="premium-card hover:shadow-lg transition-shadow duration-300">
              <CardContent className="p-6">
                <div className="flex items-start space-x-3">
                  <div className="bg-primary/10 text-primary p-2 rounded-lg mt-1">
                    <Award className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Gibt es eine Geld-zurück-Garantie?</h3>
                    <p className="text-muted-foreground text-sm">
                      Ja! Wenn Sie in den ersten 14 Tagen nicht vollständig zufrieden sind, erstatten wir Ihnen 100% Ihres Geldes zurück - ohne Fragen zu stellen.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="premium-card hover:shadow-lg transition-shadow duration-300">
              <CardContent className="p-6">
                <div className="flex items-start space-x-3">
                  <div className="bg-primary/10 text-primary p-2 rounded-lg mt-1">
                    <Users className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Was passiert mit meinen Daten bei Kündigung?</h3>
                    <p className="text-muted-foreground text-sm">
                      Ihre erstellten Bewerbungen bleiben dauerhaft in Ihrem kostenlosen Account gespeichert. Sie können sie jederzeit einsehen - nur neue Premium-Funktionen sind nach der Kündigung nicht mehr verfügbar.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="premium-card hover:shadow-lg transition-shadow duration-300">
              <CardContent className="p-6">
                <div className="flex items-start space-x-3">
                  <div className="bg-primary/10 text-primary p-2 rounded-lg mt-1">
                    <Zap className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Wie schnell sehe ich Ergebnisse?</h3>
                    <p className="text-muted-foreground text-sm">
                      Die meisten Nutzer erstellen ihre erste professionelle Bewerbung in unter 5 Minuten. Viele bekommen bereits nach 1-2 Wochen erste positive Rückmeldungen von Arbeitgebern.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="premium-card hover:shadow-lg transition-shadow duration-300">
              <CardContent className="p-6">
                <div className="flex items-start space-x-3">
                  <div className="bg-primary/10 text-primary p-2 rounded-lg mt-1">
                    <Headphones className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Bekomme ich Support bei Problemen?</h3>
                    <p className="text-muted-foreground text-sm">
                      Als Pro-Nutzer haben Sie Prioritätssupport mit garantierter Antwort innerhalb von 24 Stunden. Unser deutschsprachiges Support-Team hilft Ihnen gerne weiter.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Final CTA Section */}
          <div className="text-center mt-16 bg-gradient-to-r from-primary/10 via-blue-50 to-purple-50 rounded-2xl p-8">
            <h3 className="text-2xl md:text-3xl font-bold mb-4">
              Bereit für Ihren Karriere-Durchbruch?
            </h3>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Schließen Sie sich über <strong>15.000 erfolgreichen Jobsuchenden</strong> an, die bereits ihren Traumjob mit Workblix Pro gefunden haben.
            </p>
            <Button 
              onClick={handleUpgrade}
              disabled={loading}
              size="lg"
              className="px-12 py-6 text-xl bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 transform hover:scale-105 transition-all duration-200 shadow-xl"
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Verarbeitung...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <Crown className="h-6 w-6" />
                  <span className="font-bold">Jetzt Workblix Pro starten!</span>
                  <ArrowRight className="h-5 w-5" />
                </div>
              )}
            </Button>
            <p className="text-sm text-muted-foreground mt-4">
              💳 Keine Einrichtungsgebühren • ⏰ Jederzeit kündbar • 🛡️ 14-Tage Geld-zurück-Garantie
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProUpgrade;