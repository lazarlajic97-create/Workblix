import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, Cookie, Settings, Shield, CheckCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

const CookieBar = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [cookieSettings, setCookieSettings] = useState({
    necessary: true, // Always true, cannot be disabled
    functional: false,
    analytics: false,
    marketing: false
  });

  useEffect(() => {
    // Check if user has already made a choice
    const cookieConsent = localStorage.getItem('cookieConsent');
    if (!cookieConsent) {
      // Show banner after a small delay for better UX
      setTimeout(() => setShowBanner(true), 1000);
    } else {
      // Load saved preferences
      try {
        const savedSettings = JSON.parse(cookieConsent);
        setCookieSettings(prev => ({ ...prev, ...savedSettings }));
      } catch (error) {
        console.error('Error parsing cookie settings:', error);
      }
    }
  }, []);

  const handleAcceptAll = () => {
    const allAccepted = {
      necessary: true,
      functional: true,
      analytics: true,
      marketing: true
    };
    setCookieSettings(allAccepted);
    localStorage.setItem('cookieConsent', JSON.stringify(allAccepted));
    localStorage.setItem('cookieConsentDate', new Date().toISOString());
    setShowBanner(false);
    initializeCookies(allAccepted);
  };

  const handleRejectAll = () => {
    const necessaryOnly = {
      necessary: true,
      functional: false,
      analytics: false,
      marketing: false
    };
    setCookieSettings(necessaryOnly);
    localStorage.setItem('cookieConsent', JSON.stringify(necessaryOnly));
    localStorage.setItem('cookieConsentDate', new Date().toISOString());
    setShowBanner(false);
    initializeCookies(necessaryOnly);
  };

  const handleSaveSettings = () => {
    localStorage.setItem('cookieConsent', JSON.stringify(cookieSettings));
    localStorage.setItem('cookieConsentDate', new Date().toISOString());
    setShowBanner(false);
    setShowSettings(false);
    initializeCookies(cookieSettings);
  };

  const initializeCookies = (settings: typeof cookieSettings) => {
    // Initialize Google Analytics if analytics cookies are accepted
    if (settings.analytics && typeof window !== 'undefined') {
      // Add Google Analytics code here
      console.log('Analytics cookies accepted - would initialize GA');
    }

    // Initialize marketing cookies (Facebook Pixel, etc.)
    if (settings.marketing && typeof window !== 'undefined') {
      // Add marketing tracking code here
      console.log('Marketing cookies accepted - would initialize marketing tools');
    }

    // Initialize functional cookies
    if (settings.functional && typeof window !== 'undefined') {
      // Add functional cookies code here
      console.log('Functional cookies accepted - would enable enhanced features');
    }
  };

  const updateSetting = (key: keyof typeof cookieSettings, value: boolean) => {
    if (key === 'necessary') return; // Cannot disable necessary cookies
    setCookieSettings(prev => ({ ...prev, [key]: value }));
  };

  if (!showBanner) return null;

  return (
    <>
      {/* Cookie Banner */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-4xl px-4">
        <Card className="bg-background/95 backdrop-blur-md border border-border shadow-xl rounded-3xl">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              <div className="flex items-start space-x-4 flex-1">
                <div className="bg-primary/10 text-primary p-2 rounded-lg shrink-0">
                  <Cookie className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="font-semibold text-lg">Cookie-Einstellungen</h3>
                    <Badge variant="secondary" className="text-xs">
                      <Shield className="h-3 w-3 mr-1" />
                      DSGVO-konform
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Wir verwenden Cookies, um Ihre Erfahrung zu verbessern, Inhalte zu personalisieren 
                    und unseren Service zu optimieren. Sie können Ihre Einstellungen jederzeit anpassen.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 shrink-0">
                <Dialog open={showSettings} onOpenChange={setShowSettings}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="text-sm">
                      <Settings className="h-4 w-4 mr-2" />
                      Einstellungen
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="flex items-center space-x-2">
                        <Cookie className="h-5 w-5" />
                        <span>Cookie-Einstellungen verwalten</span>
                      </DialogTitle>
                      <DialogDescription>
                        Wählen Sie, welche Cookies Sie zulassen möchten. Sie können diese Einstellungen jederzeit ändern.
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6">
                      {/* Necessary Cookies */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <Label className="font-medium">Notwendige Cookies</Label>
                              <Badge variant="default" className="text-xs">Erforderlich</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Diese Cookies sind für die Grundfunktionen der Website erforderlich.
                            </p>
                          </div>
                          <Switch checked={true} disabled />
                        </div>
                        <div className="bg-muted/50 p-3 rounded-lg text-xs text-muted-foreground">
                          Speichert Login-Status, Spracheinstellungen und wichtige Sicherheitsinformationen.
                        </div>
                      </div>

                      <Separator />

                      {/* Functional Cookies */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <Label className="font-medium">Funktionale Cookies</Label>
                            <p className="text-sm text-muted-foreground">
                              Ermöglichen erweiterte Funktionen und Personalisierung.
                            </p>
                          </div>
                          <Switch 
                            checked={cookieSettings.functional}
                            onCheckedChange={(value) => updateSetting('functional', value)}
                          />
                        </div>
                        <div className="bg-muted/50 p-3 rounded-lg text-xs text-muted-foreground">
                          Speichert Ihre Präferenzen, Thema-Einstellungen und verbessert die Benutzerfreundlichkeit.
                        </div>
                      </div>

                      <Separator />

                      {/* Analytics Cookies */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <Label className="font-medium">Analyse-Cookies</Label>
                            <p className="text-sm text-muted-foreground">
                              Helfen uns zu verstehen, wie Sie unsere Website nutzen.
                            </p>
                          </div>
                          <Switch 
                            checked={cookieSettings.analytics}
                            onCheckedChange={(value) => updateSetting('analytics', value)}
                          />
                        </div>
                        <div className="bg-muted/50 p-3 rounded-lg text-xs text-muted-foreground">
                          Google Analytics, Hotjar und ähnliche Tools zur Verbesserung unserer Services.
                        </div>
                      </div>

                      <Separator />

                      {/* Marketing Cookies */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <Label className="font-medium">Marketing-Cookies</Label>
                            <p className="text-sm text-muted-foreground">
                              Ermöglichen personalisierte Werbung und Inhalte.
                            </p>
                          </div>
                          <Switch 
                            checked={cookieSettings.marketing}
                            onCheckedChange={(value) => updateSetting('marketing', value)}
                          />
                        </div>
                        <div className="bg-muted/50 p-3 rounded-lg text-xs text-muted-foreground">
                          Facebook Pixel, Google Ads und andere Marketing-Tools für relevante Werbung.
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end space-x-3 pt-6">
                      <Button variant="outline" onClick={() => setShowSettings(false)}>
                        Abbrechen
                      </Button>
                      <Button onClick={handleSaveSettings} className="bg-primary">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Einstellungen speichern
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                <Button variant="outline" size="sm" onClick={handleRejectAll}>
                  Nur notwendige
                </Button>
                <Button size="sm" onClick={handleAcceptAll} className="bg-primary">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Alle akzeptieren
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default CookieBar;