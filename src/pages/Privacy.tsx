import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, Eye, Lock, Database, UserCheck, Mail, Phone } from 'lucide-react';

const Privacy = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground py-16">
        <div className="container mx-auto px-4 text-center">
          <Shield className="h-16 w-16 mx-auto mb-4 opacity-90" />
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Datenschutzerklärung</h1>
          <p className="text-xl opacity-90 max-w-2xl mx-auto">
            Ihre Privatsphäre ist uns wichtig. Hier erfahren Sie, wie wir Ihre Daten schützen und verwenden.
          </p>
          <Badge variant="secondary" className="mt-4">
            Letzte Aktualisierung: 1. Oktober 2025
          </Badge>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Responsible Party */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Eye className="h-5 w-5" />
              <span>1. Verantwortlicher</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="bg-muted/50 p-4 rounded-lg">
              <p className="text-sm font-semibold">Workblix GmbH (in Gründung)</p>
              <p className="text-sm text-muted-foreground">Melchiorstrasse 19</p>
              <p className="text-sm text-muted-foreground">3027 Bern, Schweiz</p>
              <div className="mt-3 space-y-1">
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">info@workblix.com</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">+41 79 609 90 06</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Collection */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Database className="h-5 w-5" />
              <span>2. Erhobene Daten</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Wir verarbeiten personenbezogene Daten, die bei der Nutzung unserer Plattform entstehen:
            </p>
            <div>
              <h4 className="font-semibold mb-2">Profildaten</h4>
              <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                <li>• Name, Adresse, E-Mail</li>
                <li>• Bewerbungsunterlagen</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Zugangsdaten</h4>
              <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                <li>• Login, Passwort</li>
                <li>• IP-Adresse, Browserdaten</li>
                <li>• Cookies</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Zahlungsdaten</h4>
              <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                <li>• Über unseren Zahlungsanbieter Stripe</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Nutzungs- und Trackingdaten</h4>
              <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                <li>• Google Analytics</li>
                <li>• Cookies, Logfiles</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Data Usage */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <UserCheck className="h-5 w-5" />
              <span>3. Zweck der Datenverarbeitung</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">Die Daten werden verwendet für:</p>
            <ul className="text-sm text-muted-foreground space-y-1 ml-4">
              <li>• Erstellung und Automatisierung von Bewerbungen</li>
              <li>• Betrieb, Sicherheit und Optimierung der Plattform (Hosting via Vercel, Datenbanken via Supabase)</li>
              <li>• Zahlungsabwicklung (Stripe)</li>
              <li>• Statistische Auswertungen (Google Analytics)</li>
              <li>• Erfüllung rechtlicher Pflichten</li>
            </ul>
          </CardContent>
        </Card>

        {/* Legal Basis */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>4. Rechtsgrundlagen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p className="text-sm text-muted-foreground">Die Verarbeitung erfolgt auf Grundlage von:</p>
            <div className="bg-blue-50 p-3 rounded-lg border-l-4 border-blue-500">
              <strong>Vertragserfüllung</strong>
            </div>
            <div className="bg-green-50 p-3 rounded-lg border-l-4 border-green-500">
              <strong>Einwilligung</strong>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg border-l-4 border-purple-500">
              <strong>Berechtigtes Interesse</strong>
            </div>
            <div className="bg-amber-50 p-3 rounded-lg border-l-4 border-amber-500">
              <strong>Gesetzlichen Pflichten</strong>
            </div>
          </CardContent>
        </Card>

        {/* Data Sharing */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>5. Weitergabe an Dritte</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Wir geben Daten ausschliesslich an folgende Empfänger weiter:
            </p>
            <div className="space-y-2">
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-primary rounded-full mt-1.5"></div>
                <span className="text-sm">Vercel (Hosting)</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-primary rounded-full mt-1.5"></div>
                <span className="text-sm">Supabase (Datenbanken)</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-primary rounded-full mt-1.5"></div>
                <span className="text-sm">Stripe (Zahlungsabwicklung)</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-primary rounded-full mt-1.5"></div>
                <span className="text-sm">Google Analytics (Statistische Auswertung)</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-primary rounded-full mt-1.5"></div>
                <span className="text-sm">Weitere Integrationen, sofern zur Bewerbungs-Automatisierung nötig</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Retention */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Lock className="h-5 w-5" />
              <span>6. Speicherdauer</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-primary rounded-full mt-1.5"></div>
                <div>
                  <span className="text-sm font-medium">Bewerbungsdaten:</span>
                  <span className="text-sm text-muted-foreground ml-1">solange wie für die Nutzung erforderlich oder bis zur Löschung</span>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-primary rounded-full mt-1.5"></div>
                <div>
                  <span className="text-sm font-medium">Zahlungsdaten:</span>
                  <span className="text-sm text-muted-foreground ml-1">gemäss gesetzlichen Aufbewahrungsfristen (10 Jahre)</span>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-primary rounded-full mt-1.5"></div>
                <div>
                  <span className="text-sm font-medium">Trackingdaten:</span>
                  <span className="text-sm text-muted-foreground ml-1">standardmässig 14 Monate</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* User Rights */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>7. Rechte der Nutzer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Nutzer haben das Recht auf:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span className="text-sm font-medium">Auskunft</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span className="text-sm font-medium">Berichtigung oder Löschung</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span className="text-sm font-medium">Einschränkung der Verarbeitung</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span className="text-sm font-medium">Datenübertragbarkeit</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span className="text-sm font-medium">Widerruf erteilter Einwilligungen</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span className="text-sm font-medium">Beschwerde bei der Aufsichtsbehörde (EDÖB)</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cookies & Tracking */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>8. Cookies & Tracking</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Unsere Website verwendet Cookies sowie vergleichbare Technologien:
            </p>
            <div className="space-y-2">
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-primary rounded-full mt-1.5"></div>
                <span className="text-sm">Essenzielle Cookies (Login, Bewerbungsfunktionen)</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-primary rounded-full mt-1.5"></div>
                <span className="text-sm">Analyse-Cookies (Google Analytics)</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-primary rounded-full mt-1.5"></div>
                <span className="text-sm">Zahlungs- & Sicherheits-Cookies (Stripe)</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Mail className="h-5 w-5" />
              <span>9. Kontakt für Datenschutzfragen</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Bei Fragen zur Verarbeitung personenbezogener Daten:
            </p>
            <div className="bg-muted/50 p-4 rounded-lg space-y-2">
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">info@workblix.com</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Privacy;