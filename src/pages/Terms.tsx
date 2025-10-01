import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Scale, AlertTriangle, CreditCard, Shield, Users } from 'lucide-react';

const Terms = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground py-16">
        <div className="container mx-auto px-4 text-center">
          <Scale className="h-16 w-16 mx-auto mb-4 opacity-90" />
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Allgemeine Geschäftsbedingungen</h1>
          <p className="text-xl opacity-90 max-w-2xl mx-auto">
            Die Nutzungsbedingungen für Workblix und unsere Services
          </p>
          <Badge variant="secondary" className="mt-4">
            Letzte Aktualisierung: 1. Oktober 2025
          </Badge>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Introduction */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>1. Geltungsbereich</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none">
            <p>
              Diese Allgemeinen Geschäftsbedingungen (AGB) regeln das Vertragsverhältnis zwischen der
              Workblix GmbH (in Gründung), Melchiorstrasse 19, 3027 Bern, Schweiz (nachfolgend „Workblix"
              genannt) und den Nutzern der Plattform www.workblix.com (nachfolgend „Nutzer" genannt). Durch
              die Registrierung oder Nutzung der Plattform akzeptieren die Nutzer diese AGB.
            </p>
          </CardContent>
        </Card>

        {/* Services */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>2. Leistungsbeschreibung</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Workblix bietet eine digitale Plattform zur Automatisierung von Bewerbungsprozessen. Nutzer
              können über ein persönliches Profil Bewerbungen generieren und verwalten.
            </p>
            <p className="text-sm text-muted-foreground">Die Leistungen umfassen insbesondere:</p>
            <ul className="text-sm text-muted-foreground space-y-1 ml-4">
              <li>• Erstellung von Bewerbungsunterlagen auf Basis der vom Nutzer gemachten Angaben</li>
              <li>• Speicherung und Verwaltung von Bewerbungsdokumenten</li>
              <li>• Nutzung von Schnittstellen zu Dritten (z. B. Jobportale)</li>
              <li>• Kostenpflichtige Premium-Funktionen (z. B. unbegrenzte Bewerbungen, Zusatzfeatures)</li>
            </ul>
            <div className="bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-500 mt-4">
              <p className="text-sm text-yellow-800">
                <strong>Wichtiger Hinweis:</strong> Workblix ist kein Personalvermittler und übernimmt keine Garantie für eine erfolgreiche Bewerbung
                oder Anstellung.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Registration */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>3. Registrierung & Nutzerkonto</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <ul className="text-sm text-muted-foreground space-y-2 ml-4">
              <li>• Für die Nutzung der Plattform ist ein Nutzerkonto erforderlich.</li>
              <li>• Die Registrierung erfolgt mit wahrheitsgemässen und vollständigen Angaben.</li>
              <li>• Nutzer sind verpflichtet, ihre Zugangsdaten geheim zu halten und vor unbefugtem Zugriff zu schützen.</li>
              <li>• Workblix kann Nutzerkonten sperren oder löschen, wenn ein Verstoss gegen diese AGB oder geltendes Recht vorliegt.</li>
            </ul>
          </CardContent>
        </Card>

        {/* Payment Terms */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CreditCard className="h-5 w-5" />
              <span>4. Preise & Zahlungsbedingungen</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <ul className="text-sm text-muted-foreground space-y-2 ml-4">
              <li>• Die Basisversion von Workblix ist teilweise kostenlos nutzbar.</li>
              <li>• Für den erweiterten Funktionsumfang können kostenpflichtige Abonnements abgeschlossen werden.</li>
              <li>• Preise und Abomodelle sind auf www.workblix.com einsehbar.</li>
              <li>• Die Abrechnung erfolgt über Stripe.</li>
              <li>• Alle Preise verstehen sich in CHF und inkl. gesetzlicher MwSt. (sofern anwendbar).</li>
              <li>• Abonnements verlängern sich automatisch, sofern sie nicht rechtzeitig gekündigt werden.</li>
            </ul>
          </CardContent>
        </Card>

        {/* User Obligations */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>5. Pflichten der Nutzer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <ul className="text-sm text-muted-foreground space-y-2 ml-4">
              <li>• Nutzer sind verantwortlich für die Richtigkeit und Vollständigkeit der von ihnen bereitgestellten Daten.</li>
              <li>• Es dürfen keine rechtswidrigen, beleidigenden, diskriminierenden oder falschen Inhalte in Bewerbungen eingefügt werden.</li>
              <li>• Nutzer verpflichten sich, die Plattform nicht zu missbrauchen (z. B. durch automatisierte Spam-Bewerbungen).</li>
            </ul>
          </CardContent>
        </Card>

        {/* Liability */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5" />
              <span>6. Haftung</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <ul className="text-sm text-muted-foreground space-y-2 ml-4">
              <li>• Workblix haftet nur für Schäden, die durch vorsätzliches oder grob fahrlässiges Verhalten verursacht werden.</li>
              <li>• Eine Haftung für die erfolgreiche Vermittlung eines Arbeitsplatzes ist ausgeschlossen.</li>
              <li>• Für Ausfälle oder Störungen, die durch Dritte (Hosting-Anbieter, Zahlungsdienstleister, etc.) verursacht werden, übernimmt Workblix keine Verantwortung.</li>
              <li>• Die Nutzung der Plattform erfolgt auf eigenes Risiko.</li>
            </ul>
          </CardContent>
        </Card>

        {/* Privacy */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>7. Datenschutz</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Die Erhebung und Verarbeitung personenbezogener Daten erfolgt gemäss der
              Datenschutzerklärung von Workblix.
            </p>
          </CardContent>
        </Card>

        {/* Termination */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>8. Vertragsdauer & Kündigung</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <ul className="text-sm text-muted-foreground space-y-2 ml-4">
              <li>• Der Nutzungsvertrag beginnt mit der Registrierung und gilt auf unbestimmte Zeit.</li>
              <li>• Nutzer können ihr Konto jederzeit selbst löschen oder die Kündigung schriftlich an Workblix richten.</li>
              <li>• Bei kostenpflichtigen Abonnements gelten die jeweiligen Kündigungsfristen gemäss Angebotsbeschreibung.</li>
              <li>• Workblix behält sich vor, Nutzerkonten bei Missbrauch oder Verstössen gegen diese AGB fristlos zu kündigen.</li>
            </ul>
          </CardContent>
        </Card>

        {/* AGB Changes */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>9. Änderungen der AGB</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Workblix behält sich das Recht vor, diese AGB jederzeit zu ändern. Änderungen werden den
              Nutzern in Textform mitgeteilt und gelten als akzeptiert, wenn der Nutzer nicht innerhalb von 14
              Tagen widerspricht.
            </p>
          </CardContent>
        </Card>

        {/* Final Provisions */}
        <Card>
          <CardHeader>
            <CardTitle>10. Anwendbares Recht & Gerichtsstand</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Es gilt ausschliesslich schweizerisches Recht. Gerichtsstand ist Bern, Schweiz, soweit gesetzlich
              zulässig.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Terms;