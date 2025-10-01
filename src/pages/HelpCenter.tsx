import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  MessageCircle, 
  Book, 
  Video, 
  FileText, 
  Clock,
  Users,
  Zap,
  CheckCircle,
  ArrowRight,
  Mail,
  Phone
} from 'lucide-react';

const HelpCenter = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const helpCategories = [
    {
      title: 'Erste Schritte',
      description: 'Alles was Sie für den Start mit Workblix benötigen',
      icon: <Zap className="h-6 w-6" />,
      articles: [
        'Konto erstellen und einrichten',
        'Ihr erstes Bewerbungsdokument erstellen',
        'Profil vervollständigen',
        'URL-Scanner verwenden'
      ]
    },
    {
      title: 'Bewerbungen erstellen',
      description: 'Leitfäden für professionelle Bewerbungsunterlagen',
      icon: <FileText className="h-6 w-6" />,
      articles: [
        'Personalisierte Anschreiben generieren',
        'Lebenslauf optimieren',
        'Stellenanzeigen analysieren',
        'Dokumente herunterladen und verwenden'
      ]
    },
    {
      title: 'Konto & Abrechnung',
      description: 'Verwalten Sie Ihr Konto und Abonnement',
      icon: <Users className="h-6 w-6" />,
      articles: [
        'Auf Pro upgraden',
        'Zahlungsmethoden verwalten',
        'Rechnungen einsehen',
        'Konto löschen'
      ]
    }
  ];

  const quickAnswers = [
    {
      question: 'Wie erstelle ich meine erste Bewerbung?',
      answer: 'Melden Sie sich an, vervollständigen Sie Ihr Profil und fügen Sie eine Job-URL ein. Workblix analysiert die Stelle und erstellt automatisch eine passende Bewerbung.'
    },
    {
      question: 'Ist meine kostenlose Nutzung begrenzt?',
      answer: 'Ja, kostenlose Nutzer können 1 Bewerbung pro Monat generieren. Mit Pro erhalten Sie unbegrenzte Generierungen und zusätzliche Features.'
    },
    {
      question: 'Kann ich meine Bewerbungen anpassen?',
      answer: 'Ja, Sie können alle generierten Bewerbungen vor dem Download bearbeiten und personalisieren.'
    },
    {
      question: 'Welche Dateiformate werden unterstützt?',
      answer: 'Workblix exportiert Bewerbungen als PDF und TXT-Dateien. Pro-Nutzer erhalten zusätzliche Formatoptionen.'
    }
  ];

  const filteredCategories = helpCategories.filter(category =>
    category.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    category.articles.some(article => 
      article.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Hilfe Center</h1>
          <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            Finden Sie Antworten auf Ihre Fragen und lernen Sie, wie Sie Workblix optimal nutzen
          </p>
          
          {/* Search */}
          <div className="max-w-md mx-auto relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Suchen Sie nach Hilfe..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 bg-white/90 border-0 text-foreground"
            />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12 max-w-2xl mx-auto">
          <Card className="text-center hover:shadow-lg transition-all duration-300">
            <CardContent className="pt-6">
              <div className="bg-green-500/10 text-green-500 p-3 rounded-full w-fit mx-auto mb-4">
                <Mail className="h-6 w-6" />
              </div>
              <h3 className="font-semibold mb-2">E-Mail Support</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Senden Sie uns eine Anfrage an info@workblix.com
              </p>
              <Button size="sm" variant="outline" asChild>
                <a href="mailto:info@workblix.com">E-Mail senden</a>
              </Button>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-all duration-300">
            <CardContent className="pt-6">
              <div className="bg-blue-500/10 text-blue-500 p-3 rounded-full w-fit mx-auto mb-4">
                <Phone className="h-6 w-6" />
              </div>
              <h3 className="font-semibold mb-2">Telefon Support</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Rufen Sie uns an: +41 79 609 90 06
              </p>
              <Button size="sm" variant="outline" asChild>
                <a href="tel:+41796099006">Anrufen</a>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Help Categories */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold mb-8 text-center">Kategorien</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {filteredCategories.map((category, index) => (
              <Card key={index} className="hover:shadow-lg transition-all duration-300">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="bg-primary/10 text-primary p-2 rounded-lg">
                      {category.icon}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{category.title}</CardTitle>
                      <CardDescription>{category.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {category.articles.map((article, idx) => (
                      <li key={idx} className="flex items-center space-x-2 text-sm text-muted-foreground hover:text-primary cursor-pointer transition-colors">
                        <ArrowRight className="h-3 w-3" />
                        <span>{article}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Quick Answers */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold mb-8 text-center">Häufige Fragen</h2>
          <div className="max-w-3xl mx-auto">
            <Accordion type="single" collapsible className="space-y-4">
              {quickAnswers.map((qa, index) => (
                <AccordionItem key={index} value={`item-${index}`} className="border border-border/50 rounded-lg px-6">
                  <AccordionTrigger className="text-left font-medium">
                    {qa.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {qa.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>

        {/* Contact CTA */}
        <Card className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground text-center">
          <CardContent className="pt-8 pb-8">
            <h3 className="text-2xl font-bold mb-4">Brauchen Sie weitere Hilfe?</h3>
            <p className="text-lg opacity-90 mb-6">
              Unser Support-Team ist bereit, Ihnen zu helfen
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" asChild>
                <a href="mailto:info@workblix.com">
                  <Mail className="mr-2 h-5 w-5" />
                  E-Mail senden
                </a>
              </Button>
              <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10" asChild>
                <a href="tel:+41796099006">
                  <Phone className="mr-2 h-5 w-5" />
                  Anrufen
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default HelpCenter;