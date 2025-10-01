import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Briefcase, 
  FileText, 
  Heart, 
  Globe, 
  FolderOpen,
  CheckCircle,
  Users,
  Clock,
  ArrowRight,
  Star,
  Quote,
  Sparkles,
  Zap,
  TrendingUp,
  Award
} from 'lucide-react';

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden bg-gradient-to-br from-background to-secondary/20">
        {/* Subtle Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl opacity-50" />
          <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-blue-500/10 rounded-full blur-2xl opacity-40" />
        </div>
        
        <div className="container mx-auto px-4 py-16 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            {/* Simplified Logo */}
            <div className="flex justify-center mb-8 animate-fade-in">
              <div className="bg-gradient-to-br from-primary to-primary/80 text-white p-6 rounded-2xl shadow-lg">
                <Briefcase className="h-12 w-12" />
              </div>
            </div>

            {/* Clean Title */}
            <div className="mb-6 animate-fade-in">
              <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
              Workblix
              </h1>
            </div>

            {/* Concise Subtitle */}
            <div className="mb-10 animate-slide-up">
              <p className="text-xl md:text-2xl text-muted-foreground mb-4 max-w-3xl mx-auto leading-relaxed">
                Die <span className="text-primary font-medium">intelligente KI-Plattform</span> für perfekte Bewerbungen
              </p>
              <p className="text-lg text-muted-foreground/80 max-w-2xl mx-auto">
                Von der Job-URL bis zur maßgeschneiderten Bewerbung in Sekunden
              </p>
            </div>

            {/* Simple Stats */}
            <div className="flex items-center justify-center gap-8 mb-10 animate-fade-in text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>95% Erfolgsquote</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-500" />
                <span>10k+ Nutzer</span>
              </div>
            </div>

            {/* Clean CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up">
              <Button 
                size="lg" 
                className="text-lg px-8 py-3 shadow-lg hover:shadow-xl transition-all duration-300"
                onClick={() => navigate('/auth')}
              >
                Kostenlos starten
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              
              <Button 
                variant="outline" 
                size="lg" 
                className="text-lg px-8 py-3 hover:bg-primary/5 transition-all duration-300"
                onClick={() => navigate('/pro-upgrade')}
              >
                Preise ansehen
              </Button>
            </div>
          </div>
        </div>

        {/* Floating Elements */}
        <div className="absolute top-20 left-10 animate-bounce" style={{ animationDelay: '2s', animationDuration: '3s' }}>
          <div className="bg-primary/10 backdrop-blur-sm rounded-full p-3">
            <FileText className="h-6 w-6 text-primary" />
          </div>
        </div>
        <div className="absolute bottom-32 right-16 animate-bounce" style={{ animationDelay: '3s', animationDuration: '4s' }}>
          <div className="bg-blue-500/10 backdrop-blur-sm rounded-full p-3">
            <CheckCircle className="h-6 w-6 text-blue-500" />
          </div>
        </div>
        <div className="absolute top-1/3 right-10 animate-bounce" style={{ animationDelay: '1s', animationDuration: '5s' }}>
          <div className="bg-purple-500/10 backdrop-blur-sm rounded-full p-3">
            <Zap className="h-6 w-6 text-purple-500" />
          </div>
        </div>
        <div className="absolute bottom-1/2 left-16 animate-bounce" style={{ animationDelay: '4s', animationDuration: '6s' }}>
          <div className="bg-green-500/10 backdrop-blur-sm rounded-full p-3">
            <Star className="h-6 w-6 text-green-500" />
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-gradient-to-b from-background to-secondary/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-foreground">
              Alles was du brauchst, an einem Ort
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Erstelle professionelle Bewerbungsunterlagen mit modernster KI-Technologie
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="premium-card text-center animate-fade-in">
              <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/20 text-blue-600 p-4 rounded-xl w-fit mx-auto mb-4">
                <FileText className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Lebenslauf</h3>
              <p className="text-muted-foreground">
                Professionelle Lebensläufe in verschiedenen Designs, optimiert für ATS-Systeme
              </p>
            </div>
            <div className="premium-card text-center animate-fade-in">
              <div className="bg-gradient-to-br from-green-500/10 to-green-600/20 text-green-600 p-4 rounded-xl w-fit mx-auto mb-4">
                <Heart className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Motivationsschreiben</h3>
              <p className="text-muted-foreground">
                Überzeugende Anschreiben, die perfekt auf die Stellenausschreibung zugeschnitten sind
              </p>
            </div>
            <div className="premium-card text-center animate-fade-in">
              <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/20 text-purple-600 p-4 rounded-xl w-fit mx-auto mb-4">
                <Globe className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold mb-3">URL-Scanning</h3>
              <p className="text-muted-foreground">
                Intelligente Analyse von Stellenanzeigen für maßgeschneiderte Bewerbungen
              </p>
            </div>
            <div className="premium-card text-center animate-fade-in">
              <div className="bg-gradient-to-br from-orange-500/10 to-orange-600/20 text-orange-600 p-4 rounded-xl w-fit mx-auto mb-4">
                <FolderOpen className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Dokumenten-Management</h3>
              <p className="text-muted-foreground">
                Zentrale Verwaltung aller deiner Bewerbungsunterlagen und Vorlagen
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Step by Step Section */}
      <section className="py-20 bg-gradient-to-br from-secondary/10 to-primary/5">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-foreground">
              Von der Idee zum Traumjob in 3 Schritten
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              So einfach war Bewerbung schreiben noch nie
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center animate-fade-in">
              <div className="step-number mx-auto mb-6 animate-pulse-glow">1</div>
              <h3 className="text-2xl font-semibold mb-4">Job-URL einfügen</h3>
              <p className="text-muted-foreground text-lg">
                Kopiere einfach den Link zur Stellenausschreibung und füge ihn in Workblix ein. 
                Unsere KI analysiert sofort alle wichtigen Details.
              </p>
            </div>
            <div className="text-center animate-fade-in">
              <div className="step-number mx-auto mb-6 animate-pulse-glow">2</div>
              <h3 className="text-2xl font-semibold mb-4">Profil vervollständigen</h3>
              <p className="text-muted-foreground text-lg">
                Ergänze deine persönlichen Daten und Qualifikationen. Workblix erstellt 
                automatisch dein optimales Bewerberprofil.
              </p>
            </div>
            <div className="text-center animate-fade-in">
              <div className="step-number mx-auto mb-6 animate-pulse-glow">3</div>
              <h3 className="text-2xl font-semibold mb-4">Bewerbung generieren</h3>
              <p className="text-muted-foreground text-lg">
                In Sekunden erhältst du eine maßgeschneiderte Bewerbung mit Lebenslauf 
                und Anschreiben, bereit zum Download.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-gradient-to-b from-background to-secondary/20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-foreground">
              Was unsere Nutzer sagen
            </h2>
            <p className="text-xl text-muted-foreground">
              Erfolgsgeschichten von Workblix-Nutzern
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="testimonial-card animate-fade-in">
              <div className="flex items-center mb-4">
                <div className="flex text-yellow-500">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-current" />
                  ))}
                </div>
              </div>
              <Quote className="h-8 w-8 text-primary mb-4" />
              <p className="text-muted-foreground mb-4 italic">
                "Workblix hat meine Bewerbungszeit um 90% reduziert. Die KI erstellt wirklich 
                passende Anschreiben, die zu den Stellenausschreibungen passen."
              </p>
              <div className="font-semibold">Sarah M., Marketing Managerin</div>
            </div>
            <div className="testimonial-card animate-fade-in">
              <div className="flex items-center mb-4">
                <div className="flex text-yellow-500">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-current" />
                  ))}
                </div>
              </div>
              <Quote className="h-8 w-8 text-primary mb-4" />
              <p className="text-muted-foreground mb-4 italic">
                "Dank Workblix habe ich meinen Traumjob gefunden. Die Bewerbungen sind 
                professionell und heben sich von der Masse ab."
              </p>
              <div className="font-semibold">Michael K., Software Developer</div>
            </div>
            <div className="testimonial-card animate-fade-in">
              <div className="flex items-center mb-4">
                <div className="flex text-yellow-500">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-current" />
                  ))}
                </div>
              </div>
              <Quote className="h-8 w-8 text-primary mb-4" />
              <p className="text-muted-foreground mb-4 italic">
                "Als Quereinsteiger war ich unsicher bei Bewerbungen. Workblix hat mir 
                das Vertrauen gegeben und zu mehreren Vorstellungsgesprächen verholfen."
              </p>
              <div className="font-semibold">Lisa R., Projektmanagerin</div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative overflow-hidden bg-gradient-to-r from-primary via-primary/90 to-primary text-primary-foreground py-20">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-transparent to-primary/20 animate-gradient-shift"></div>
        <div className="container mx-auto px-4 text-center relative">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-5xl font-bold mb-6 animate-fade-in">
              Starte jetzt deine erfolgreiche Karriere
            </h2>
            <p className="text-2xl mb-10 opacity-90 animate-slide-up">
              Schließe dich tausenden zufriedenen Nutzern an und erstelle noch heute 
              deine erste professionelle Bewerbung.
            </p>
            <div className="flex justify-center animate-slide-up">
              <Button 
                size="lg" 
                variant="secondary" 
                className="text-lg px-10 py-4 hero-glow hover:scale-105 transition-all duration-300"
                onClick={() => navigate('/auth')}
              >
                <CheckCircle className="mr-2 h-5 w-5" />
                Kostenlos registrieren
              </Button>
            </div>
            <p className="text-sm mt-6 opacity-75">
              Keine Kreditkarte erforderlich • 3 Bewerbungen kostenlos • Jederzeit kündbar
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
