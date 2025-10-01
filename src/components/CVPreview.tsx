import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Eye, ExternalLink, FileText } from 'lucide-react';
import { BudapestTemplate } from './cv-templates/BudapestTemplate';
import { Profile } from '@/pages/Profile';

interface CVPreviewProps {
  templateId: string;
  templateName: string;
  profile?: Profile;
  onSelect?: () => void;
  disabled?: boolean;
}

export default function CVPreview({ templateId, templateName, profile, onSelect, disabled = false }: CVPreviewProps) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  
  const templateUrl = `/templates/cv/${templateId}.html`;

  const openFullPreview = () => {
    const previewWindow = window.open(templateUrl, '_blank', 'width=800,height=1000,scrollbars=yes');
    if (previewWindow) {
      previewWindow.focus();
    }
  };

  // Create sample profile if none provided
  const sampleProfile: Profile = profile || {
    email: 'anna.mueller@example.com',
    first_name: 'Anna',
    last_name: 'Müller',
    phone: '+41 44 123 45 67',
    address: 'Musterstraße 123',
    city: 'Zürich',
    postal_code: '8001',
    country: 'CH',
    summary: 'Marketing Managerin mit über 5 Jahren Erfahrung in der Entwicklung und Umsetzung kreativer Kampagnen. Starke analytische Fähigkeiten und Leidenschaft für Storytelling.',
    education: [
      {
        id: '1',
        institution: 'Universität Zürich',
        degree: 'Bachelor of Arts',
        field: 'Kommunikationswissenschaft',
        startDate: '2012',
        endDate: '2016',
        ongoing: false,
        description: ''
      }
    ],
    experience: [
      {
        id: '1',
        company: 'TechWorld AG',
        position: 'Senior Marketing Managerin',
        startDate: '2022-01',
        endDate: '',
        current: true,
        description: 'Leitung eines Teams von 5 Marketing-Spezialisten zur Durchführung von Kampagnen in über 3 Ländern.\nSteigerung der Markenbekanntheit um 25 % durch multimediale Kampagnen.'
      }
    ],
    skills: [
      { id: '1', name: 'Strategisches Marketing', level: 'Experte' },
      { id: '2', name: 'Projektmanagement', level: 'Fortgeschritten' },
      { id: '3', name: 'Adobe Creative Suite', level: 'Fortgeschritten' }
    ],
    languages: [
      { id: '1', name: 'Deutsch', level: 'Muttersprache' },
      { id: '2', name: 'Englisch', level: 'C1' },
      { id: '3', name: 'Französisch', level: 'B2' }
    ]
  };

  return (
    <div className="space-y-2">
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="w-full">
            <Eye className="h-4 w-4 mr-2" />
            Vorschau ansehen
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Vorschau: {templateName}
            </DialogTitle>
            <DialogDescription>
              Professionelle CV-Vorlage für einen überzeugenden ersten Eindruck
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            <div className="flex gap-2">
              <Button onClick={openFullPreview} variant="outline" size="sm">
                <ExternalLink className="h-4 w-4 mr-2" />
                In neuem Tab öffnen
              </Button>
              {onSelect && (
                <Button onClick={onSelect} disabled={disabled} size="sm">
                  <FileText className="h-4 w-4 mr-2" />
                  Diese Vorlage verwenden
                </Button>
              )}
            </div>
            <div className="border rounded-lg overflow-auto max-h-[60vh] bg-white">
              <div className="transform scale-50 origin-top-left" style={{ width: '200%', height: '200%' }}>
                {templateId === 'budapest' ? (
                  <BudapestTemplate profile={sampleProfile} />
                ) : (
                  <div className="p-8 text-center text-gray-500">
                    Vorschau für Template "{templateId}" noch nicht verfügbar.
                    <br />
                    <small>Fallback zur HTML-Vorschau:</small>
                    <iframe
                      src={templateUrl}
                      className="w-full h-96 mt-4 border rounded"
                      title={`CV Vorlage ${templateName}`}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}