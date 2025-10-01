import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Search, 
  HelpCircle, 
  Star, 
  Clock, 
  Shield, 
  CreditCard,
  FileText,
  Zap,
  Users,
  MessageCircle
} from 'lucide-react';

const FAQ = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('alle');

  const categories = [
    { id: 'alle', label: 'Alle Fragen', icon: <HelpCircle className="h-4 w-4" /> },
    { id: 'start', label: 'Erste Schritte', icon: <Zap className="h-4 w-4" /> },
    { id: 'bewerbung', label: 'Bewerbungen', icon: <FileText className="h-4 w-4" /> },
    { id: 'konto', label: 'Konto & Billing', icon: <CreditCard className="h-4 w-4" /> },
    { id: 'sicherheit', label: 'Sicherheit', icon: <Shield className="h-4 w-4" /> },
  ];

  const faqs = [
    {
      category: 'start',
      question: 'Wie erstelle ich mein Workblix-Konto?',
      answer: 'Klicken Sie auf "Registrieren" und geben Sie Ihre E-Mail-Adresse und ein sicheres Passwort ein. Nach der Registrierung können Sie sofort mit der Erstellung Ihrer ersten Bewerbung beginnen.',
      popular: true
    },
    {
      category: 'start',
      question: 'Welche Informationen benötige ich für mein Profil?',
      answer: 'Für optimale Ergebnisse sollten Sie Ihren Namen, Ihre Kontaktdaten, Berufserfahrung, Bildung und relevante Fähigkeiten eingeben. Je vollständiger Ihr Profil, desto personalisierter werden Ihre Bewerbungen.'
    },
    {
      category: 'bewerbung',
      question: 'Wie funktioniert der URL-Scanner?',
      answer: 'Kopieren Sie einfach den Link einer Stellenausschreibung und fügen Sie ihn in Workblix ein. Unsere KI analysiert automatisch die Anforderungen, Unternehmenskultur und wichtige Keywords, um eine passende Bewerbung zu erstellen.',
      popular: true
    },
    {
      category: 'bewerbung',
      question: 'Kann ich die generierten Bewerbungen bearbeiten?',
      answer: 'Ja, alle generierten Bewerbungen können vor dem Download bearbeitet werden. Sie haben vollständige Kontrolle über den Inhalt und können Anpassungen nach Ihren Wünschen vornehmen.'
    },
    {
      category: 'bewerbung',
      question: 'In welchen Formaten kann ich meine Bewerbungen herunterladen?',
      answer: 'Standardmäßig bieten wir PDF und TXT-Formate an. Pro-Nutzer erhalten zusätzlich Zugang zu Word-Dokumenten und können eigene Vorlagen hochladen.',
      popular: true
    },
    {
      category: 'bewerbung',
      question: 'Wie viele Bewerbungen kann ich pro Monat erstellen?',
      answer: 'Kostenlose Nutzer können 1 Bewerbung pro Monat generieren. Pro-Nutzer haben unbegrenzte Generierungen und Zugang zu Premium-Features.'
    },
    {
      category: 'konto',
      question: 'Was kostet Workblix Pro?',
      answer: 'Workblix Pro kostet 9,99 CHF pro Monat oder 99 CHF pro Jahr (2 Monate gratis). Pro-Nutzer erhalten unbegrenzte Bewerbungen, Premium-Vorlagen und Prioritätssupport.'
    },
    {
      category: 'konto',
      question: 'Kann ich mein Abonnement jederzeit kündigen?',
      answer: 'Ja, Sie können Ihr Pro-Abonnement jederzeit in den Kontoeinstellungen kündigen. Die Kündigung wird zum Ende der aktuellen Abrechnungsperiode wirksam.'
    },
    {
      category: 'konto',
      question: 'Welche Zahlungsmethoden werden akzeptiert?',
      answer: 'Wir akzeptieren alle gängigen Kreditkarten (Visa, Mastercard, American Express), PayPal und SEPA-Lastschrift für europäische Kunden.'
    },
    {
      category: 'sicherheit',
      question: 'Wie sicher sind meine Daten bei Workblix?',
      answer: 'Ihre Daten werden mit modernsten Verschlüsselungstechnologien geschützt. Wir befolgen strenge Datenschutzrichtlinien und geben Ihre Informationen niemals an Dritte weiter.',
      popular: true
    },
    {
      category: 'sicherheit',
      question: 'Kann ich meine Daten löschen?',
      answer: 'Ja, Sie können Ihr Konto und alle zugehörigen Daten jederzeit vollständig löschen. Gehen Sie dazu in die Kontoeinstellungen und wählen Sie "Konto löschen".'
    },
    {
      category: 'start',
      question: 'Gibt es eine mobile App?',
      answer: 'Derzeit ist Workblix als responsive Webanwendung verfügbar, die auf allen Geräten funktioniert. Eine dedizierte mobile App ist in Entwicklung.'
    }
  ];

  const filteredFAQs = faqs.filter(faq => {
    const matchesCategory = activeCategory === 'alle' || faq.category === activeCategory;
    const matchesSearch = searchQuery === '' || 
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const popularFAQs = faqs.filter(faq => faq.popular);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground py-16">
        <div className="container mx-auto px-4 text-center">
          <HelpCircle className="h-16 w-16 mx-auto mb-4 opacity-90" />
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Häufig gestellte Fragen</h1>
          <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            Finden Sie schnell Antworten auf die am häufigsten gestellten Fragen zu Workblix
          </p>
          
          {/* Search */}
          <div className="max-w-md mx-auto relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Durchsuchen Sie die FAQ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 bg-white/90 border-0 text-foreground"
            />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* Popular Questions */}
        {searchQuery === '' && activeCategory === 'alle' && (
          <div className="mb-12">
            <div className="flex items-center space-x-2 mb-6">
              <Star className="h-6 w-6 text-yellow-500" />
              <h2 className="text-2xl font-bold">Beliebte Fragen</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {popularFAQs.map((faq, index) => (
                <Card key={index} className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-yellow-500">
                  <CardContent className="p-6">
                    <h3 className="font-semibold mb-2 text-sm">{faq.question}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-2">{faq.answer}</p>
                    <Badge variant="secondary" className="mt-2 text-xs">
                      <Star className="h-3 w-3 mr-1" />
                      Beliebt
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Category Filter */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={activeCategory === category.id ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveCategory(category.id)}
                className="flex items-center space-x-2"
              >
                {category.icon}
                <span>{category.label}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* FAQ Accordion */}
        <div className="max-w-4xl mx-auto">
          {filteredFAQs.length > 0 ? (
            <Accordion type="single" collapsible className="space-y-4">
              {filteredFAQs.map((faq, index) => (
                <AccordionItem 
                  key={index} 
                  value={`item-${index}`} 
                  className="border border-border/50 rounded-lg px-6 bg-card/50"
                >
                  <AccordionTrigger className="text-left font-medium hover:no-underline">
                    <div className="flex items-start space-x-3">
                      <span className="text-sm">{faq.question}</span>
                      {faq.popular && (
                        <Badge variant="secondary" className="text-xs">
                          <Star className="h-3 w-3 mr-1" />
                          Beliebt
                        </Badge>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-sm leading-relaxed">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            <Card className="text-center py-12">
              <CardContent>
                <HelpCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Keine Ergebnisse gefunden</h3>
                <p className="text-muted-foreground mb-4">
                  Versuchen Sie es mit anderen Suchbegriffen oder wählen Sie eine andere Kategorie
                </p>
                <Button variant="outline" onClick={() => {setSearchQuery(''); setActiveCategory('alle');}}>
                  Alle FAQs anzeigen
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Contact CTA */}
        <Card className="mt-12 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-center">
          <CardContent className="pt-8 pb-8">
            <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-90" />
            <h3 className="text-2xl font-bold mb-4">Frage nicht gefunden?</h3>
            <p className="text-lg opacity-90 mb-6">
              Unser Support-Team hilft Ihnen gerne weiter
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary">
                Support kontaktieren
              </Button>
              <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10">
                Hilfe Center besuchen
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FAQ;