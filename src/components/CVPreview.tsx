import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Eye, ExternalLink, FileText } from 'lucide-react';
import { BudapestTemplate } from './cv-templates/BudapestTemplate';
import { ChicagoTemplate } from './cv-templates/ChicagoTemplate';
import { RigaTemplate } from './cv-templates/RigaTemplate';
import { RotterdamTemplate } from './cv-templates/RotterdamTemplate';
import { CaliTemplate } from './cv-templates/CaliTemplate';
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

  // Render the correct template based on templateId
  const renderTemplate = () => {
    if (!profile) {
      return (
        <div className="p-8 text-center text-gray-500">
          Bitte füllen Sie Ihr Profil aus, um eine Vorschau zu sehen.
        </div>
      );
    }

    switch (templateId) {
      case 'budapest':
        return <BudapestTemplate profile={profile} />;
      case 'chicago':
        return <ChicagoTemplate profile={profile} />;
      case 'riga':
        return <RigaTemplate profile={profile} />;
      case 'rotterdam':
        return <RotterdamTemplate profile={profile} />;
      case 'cali':
        return <CaliTemplate profile={profile} />;
      default:
        return (
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
        );
    }
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
            <div className="border rounded-lg overflow-auto max-h-[60vh] bg-white relative">
              {/* Watermark Overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                <div className="text-gray-300 text-6xl font-bold opacity-20 rotate-[-45deg] select-none">
                  VORSCHAU
                </div>
              </div>
              
              <div className="transform scale-50 origin-top-left" style={{ width: '200%', height: '200%' }}>
                {renderTemplate()}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}