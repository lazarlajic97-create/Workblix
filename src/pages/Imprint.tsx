import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building, Mail, Phone, Globe, Scale, Shield, ExternalLink } from 'lucide-react';

const Imprint = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground py-16">
        <div className="container mx-auto px-4 text-center">
          <Building className="h-16 w-16 mx-auto mb-4 opacity-90" />
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Impressum</h1>
          <p className="text-xl opacity-90 max-w-2xl mx-auto">
            Rechtliche Informationen nach Schweizer Recht
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Company Information */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Building className="h-5 w-5" />
              <span>Firmenangaben</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-3">Firmeninformationen</h4>
                <div className="space-y-2 text-sm">
                  <p><strong>Name / Firma:</strong> Workblix GmbH (in Gründung)</p>
                  <p><strong>Sitz:</strong> Bern, Schweiz</p>
                  <p><strong>Handelsregister-Nr.:</strong> [wird nachgetragen]</p>
                  <p><strong>UID:</strong> [wird nachgetragen]</p>
                  <p><strong>MwSt.-Nr.:</strong> [wird nachgetragen, falls steuerpflichtig]</p>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-3">Geschäftsadresse</h4>
                <div className="space-y-1 text-sm">
                  <p>Workblix GmbH (in Gründung)</p>
                  <p>Melchiorstrasse 19</p>
                  <p>3027 Bern</p>
                  <p>Schweiz</p>
                </div>
                
                <h4 className="font-semibold mb-3 mt-6">Kontaktmöglichkeiten</h4>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">+41 79 609 90 06</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">info@workblix.com</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">www.workblix.com</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Representative Person */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Vertretungsberechtigte Person</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted/50 p-4 rounded-lg">
              <p className="text-sm">
                <strong>Lazar Lajic</strong><br />
                Geschäftsführer und Gründer<br />
                Workblix GmbH (in Gründung)
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Company Purpose */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Zweck der Gesellschaft</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Die Workblix GmbH entwickelt und betreibt digitale Lösungen zur Automatisierung von
              Bewerbungs- und Recruitingprozessen. Dazu gehören Software-as-a-Service-Produkte,
              Webanwendungen und digitale Tools für Arbeitssuchende und Unternehmen.
            </p>
          </CardContent>
        </Card>

        {/* Disclaimer */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Haftungsausschluss</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Die Inhalte dieser Website wurden mit grösstmöglicher Sorgfalt erstellt. Trotzdem übernimmt
              Workblix GmbH (in Gründung) keine Gewähr für die Richtigkeit, Vollständigkeit und Aktualität der
              bereitgestellten Inhalte. Workblix GmbH behält sich ausdrücklich vor, Teile der Seiten oder das
              gesamte Angebot ohne gesonderte Ankündigung zu verändern, zu ergänzen, zu löschen oder die
              Veröffentlichung zeitweise oder endgültig einzustellen.
            </p>
          </CardContent>
        </Card>

        {/* Links Liability */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Haftung für Links</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Unsere Website enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen Einfluss
              haben. Deshalb übernehmen wir für diese fremden Inhalte auch keine Gewähr. Für die Inhalte der
              verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber verantwortlich.
            </p>
          </CardContent>
        </Card>

        {/* Copyright */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>Urheberrechte</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Die durch Workblix GmbH erstellten Inhalte und Werke auf dieser Website unterliegen dem
              schweizerischen Urheberrecht. Vervielfältigung, Bearbeitung, Verbreitung und jede Art der
              Verwertung ausserhalb der Grenzen des Urheberrechts bedürfen der schriftlichen Zustimmung der
              Workblix GmbH.
            </p>
          </CardContent>
        </Card>

        {/* Trademark Rights */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Markenrechte</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              „Workblix" sowie alle damit verbundenen Logos und Designs sind geschützte Marken und dürfen
              ohne ausdrückliche schriftliche Genehmigung nicht genutzt werden.
            </p>
          </CardContent>
        </Card>

        {/* Applicable Law */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Scale className="h-5 w-5" />
              <span>Anwendbares Recht</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Es gilt ausschliesslich schweizerisches Recht. Gerichtsstand für sämtliche Streitigkeiten aus oder
              im Zusammenhang mit der Nutzung dieser Website ist – soweit gesetzlich zulässig – Bern,
              Schweiz.
            </p>
          </CardContent>
        </Card>

        {/* Data Protection Authority */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Datenschutzaufsicht</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm font-semibold">
              Eidgenössischer Datenschutz- und Öffentlichkeitsbeauftragter (EDÖB)
            </p>
            <div className="text-sm text-muted-foreground">
              <p>Feldeggweg 1</p>
              <p>3003 Bern</p>
            </div>
            <div className="flex items-center space-x-2">
              <ExternalLink className="h-4 w-4 text-blue-500" />
              <a 
                href="https://www.edoeb.admin.ch" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline"
              >
                https://www.edoeb.admin.ch
              </a>
            </div>
          </CardContent>
        </Card>

        {/* Alternative Dispute Resolution */}
        <Card>
          <CardHeader>
            <CardTitle>Alternative Streitbeilegung</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Die Workblix GmbH (in Gründung) ist weder verpflichtet noch bereit, an einem
              Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Imprint;