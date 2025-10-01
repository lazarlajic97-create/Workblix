import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Briefcase, User, Mail, Lock, UserPlus, LogIn, ArrowRight, Sparkles, Crown, Shield } from 'lucide-react';

export default function Auth() {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const { signIn, signUp, signInWithGoogle, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await signIn(email, password);
      if (error) {
        toast({
          title: 'Fehler beim Anmelden',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Erfolgreich angemeldet',
          description: 'Willkommen zurück bei JobFlow!',
        });
        navigate('/dashboard');
      }
    } catch (error) {
      toast({
        title: 'Fehler',
        description: 'Ein unerwarteter Fehler ist aufgetreten.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await signUp(email, password, firstName, lastName);
      if (error) {
        toast({
          title: 'Fehler bei der Registrierung',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Registrierung erfolgreich',
          description: 'Bitte überprüfen Sie Ihre E-Mail für die Bestätigung.',
        });
      }
    } catch (error) {
      toast({
        title: 'Fehler',
        description: 'Ein unerwarteter Fehler ist aufgetreten.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        toast({
          title: 'Fehler beim Google Login',
          description: error.message,
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Fehler',
        description: 'Ein unerwarteter Fehler ist aufgetreten.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-primary/5 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/5 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-secondary/20 rounded-full blur-2xl animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 right-1/3 w-32 h-32 bg-accent/30 rounded-full blur-xl animate-float" style={{ animationDelay: '4s' }} />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo and branding section */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="flex justify-center mb-6">
            <div className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground p-4 rounded-2xl shadow-strong animate-pulse-glow">
              <Briefcase className="h-10 w-10" />
            </div>
          </div>
          <h1 className="text-4xl font-bold gradient-text mb-2">JobFlow</h1>
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Sparkles className="h-4 w-4 text-primary" />
            <p>KI-gestützte Bewerbungsgenerierung</p>
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
        </div>

        {/* Main card with enhanced design */}
        <Card className="shadow-strong border-0 backdrop-blur-sm bg-card/95 animate-slide-up">
          <Tabs defaultValue="signin" className="w-full">
            <CardHeader className="space-y-4">
              <TabsList className="grid w-full grid-cols-2 h-12 bg-muted/50">
                <TabsTrigger value="signin" className="flex items-center gap-2 h-10">
                  <LogIn className="h-4 w-4" />
                  Anmelden
                </TabsTrigger>
                <TabsTrigger value="signup" className="flex items-center gap-2 h-10">
                  <UserPlus className="h-4 w-4" />
                  Registrieren
                </TabsTrigger>
              </TabsList>
            </CardHeader>

            <TabsContent value="signin" className="space-y-0">
              <form onSubmit={handleSignIn}>
                <CardContent className="space-y-6 px-6">
                  <div className="space-y-3">
                    <Label htmlFor="signin-email" className="text-sm font-medium flex items-center gap-2">
                      <Mail className="h-4 w-4 text-primary" />
                      E-Mail-Adresse
                    </Label>
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="ihre.email@beispiel.de"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="h-12 text-base transition-all duration-300 focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="signin-password" className="text-sm font-medium flex items-center gap-2">
                      <Lock className="h-4 w-4 text-primary" />
                      Passwort
                    </Label>
                    <Input
                      id="signin-password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="h-12 text-base transition-all duration-300 focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </CardContent>
                <CardFooter className="px-6 pb-6">
                  <Button 
                    type="submit" 
                    className="w-full h-12 text-base button-glow font-semibold" 
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    ) : (
                      <LogIn className="mr-2 h-5 w-5" />
                    )}
                    {isLoading ? 'Wird angemeldet...' : 'Anmelden'}
                    {!isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
                  </Button>
                </CardFooter>
                
                {/* Google Sign In - Premium Feature - DISABLED */}
                {false && (
                  <div className="px-6 pb-6">
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card px-2 text-muted-foreground">oder</span>
                      </div>
                    </div>
                    <Button 
                      type="button"
                      variant="outline"
                      className="w-full h-12 mt-4 relative overflow-hidden group border-2 hover:bg-primary/5"
                      onClick={handleGoogleSignIn}
                      disabled={isLoading}
                    >
                      <div className="relative flex items-center justify-center gap-2">
                        <svg className="h-5 w-5" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        <span className="font-medium">
                          {isLoading ? 'Anmeldung läuft...' : 'Mit Google anmelden'}
                        </span>
                      </div>
                    </Button>
                  </div>
                )}
              </form>
            </TabsContent>

            <TabsContent value="signup" className="space-y-0">
              <form onSubmit={handleSignUp}>
                <CardContent className="space-y-6 px-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <Label htmlFor="first-name" className="text-sm font-medium flex items-center gap-2">
                        <User className="h-4 w-4 text-primary" />
                        Vorname
                      </Label>
                      <Input
                        id="first-name"
                        placeholder="Max"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        required
                        className="h-12 text-base transition-all duration-300 focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="last-name" className="text-sm font-medium">
                        Nachname
                      </Label>
                      <Input
                        id="last-name"
                        placeholder="Mustermann"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        required
                        className="h-12 text-base transition-all duration-300 focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="signup-email" className="text-sm font-medium flex items-center gap-2">
                      <Mail className="h-4 w-4 text-primary" />
                      E-Mail-Adresse
                    </Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="ihre.email@beispiel.de"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="h-12 text-base transition-all duration-300 focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="signup-password" className="text-sm font-medium flex items-center gap-2">
                      <Lock className="h-4 w-4 text-primary" />
                      Passwort
                    </Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="Mindestens 6 Zeichen"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      className="h-12 text-base transition-all duration-300 focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground text-center">
                      Mit der Registrierung erstellen Sie Ihr persönliches Profil für 
                      <span className="text-primary font-medium"> personalisierte Bewerbungen</span>
                    </p>
                  </div>
                </CardContent>
                <CardFooter className="px-6 pb-6">
                  <Button 
                    type="submit" 
                    className="w-full h-12 text-base button-glow font-semibold" 
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    ) : (
                      <UserPlus className="mr-2 h-5 w-5" />
                    )}
                    {isLoading ? 'Wird registriert...' : 'Konto erstellen'}
                    {!isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
                  </Button>
                </CardFooter>
                
                {/* Google Sign Up - Premium Feature - DISABLED */}
                {false && (
                  <div className="px-6 pb-6">
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card px-2 text-muted-foreground">oder</span>
                      </div>
                    </div>
                    <Button 
                      type="button"
                      variant="outline"
                      className="w-full h-12 mt-4 relative overflow-hidden group border-2 hover:bg-primary/5"
                      onClick={handleGoogleSignIn}
                      disabled={isLoading}
                    >
                      <div className="relative flex items-center justify-center gap-2">
                        <svg className="h-5 w-5" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        <span className="font-medium">
                          {isLoading ? 'Registrierung läuft...' : 'Mit Google registrieren'}
                        </span>
                      </div>
                    </Button>
                  </div>
                )}
              </form>
            </TabsContent>
          </Tabs>
        </Card>

        {/* Additional info */}
        <div className="text-center mt-6 animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <p className="text-sm text-muted-foreground">
            Erstellen Sie professionelle Bewerbungen in Sekundenschnelle
          </p>
        </div>
      </div>
    </div>
  );
}