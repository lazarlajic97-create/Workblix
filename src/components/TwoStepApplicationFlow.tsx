import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Upload, FileText, Link, Check, ArrowRight, Loader2,
  Sparkles, AlertCircle
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import CoverLetterPreview from '@/components/CoverLetterPreview';
import * as pdfjsLib from 'pdfjs-dist';

// Set worker path for pdfjs - use multiple fallback options
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
}

export default function TwoStepApplicationFlow() {
  const { toast } = useToast();
  
  // Step 1: Resume
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [resumeText, setResumeText] = useState('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  
  // Step 2: Job Input
  const [jobUrl, setJobUrl] = useState('');
  const [jobText, setJobText] = useState('');
  const [userCity, setUserCity] = useState('');
  const [inputMode, setInputMode] = useState<'url' | 'text'>('url');
  
  // Step 3: Result
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedLetter, setGeneratedLetter] = useState('');
  const [wordCount, setWordCount] = useState(0);
  const [jobData, setJobData] = useState<any>(null);
  
  // Extract applicant info from resume
  const [applicantInfo, setApplicantInfo] = useState<{
    name: string;
    address?: string;
    city?: string;
    phone?: string;
    email?: string;
  } | null>(null);

  // Handle file upload and text extraction
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setResumeFile(file);

    // Basic text extraction (for TXT files)
    if (file.type === 'text/plain') {
      const text = await file.text();
      setResumeText(text);
      toast({
        title: 'Datei hochgeladen',
        description: `${file.name} erfolgreich geladen (${text.length} Zeichen)`,
      });
    } else if (file.type === 'application/pdf') {
      // PDF text extraction
      try {
        toast({
          title: 'PDF wird verarbeitet...',
          description: 'Bitte warten, dies kann einen Moment dauern',
        });

        console.log('Starting PDF extraction for:', file.name);
        const arrayBuffer = await file.arrayBuffer();
        console.log('ArrayBuffer created, size:', arrayBuffer.byteLength);
        
        const loadingTask = pdfjsLib.getDocument({ 
          data: arrayBuffer,
          useWorkerFetch: false,
          isEvalSupported: false,
          useSystemFonts: true
        });
        
        const pdf = await loadingTask.promise;
        console.log('PDF loaded, pages:', pdf.numPages);
        
        let fullText = '';

        // Extract text from all pages with proper spacing
        for (let i = 1; i <= pdf.numPages; i++) {
          console.log(`Extracting page ${i}/${pdf.numPages}`);
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          
          // Better text extraction with positioning
          let lastY = -1;
          let pageText = '';
          
          textContent.items.forEach((item: any, index: number) => {
            const currentY = item.transform[5];
            
            // Add line break if Y position changed significantly (new line)
            if (lastY !== -1 && Math.abs(lastY - currentY) > 5) {
              pageText += '\n';
            } 
            // Add space between words on same line
            else if (index > 0 && pageText.length > 0 && !pageText.endsWith(' ') && !pageText.endsWith('\n')) {
              pageText += ' ';
            }
            
            pageText += item.str;
            lastY = currentY;
          });
          
          fullText += pageText + '\n\n';
          console.log(`Page ${i} extracted text preview:`, pageText.substring(0, 200));
        }

        console.log('Extraction complete, text length:', fullText.length);
        
        if (fullText.trim().length === 0) {
          throw new Error('PDF enthält keinen extrahierbaren Text');
        }

        setResumeText(fullText.trim());
        toast({
          title: '✅ PDF erfolgreich verarbeitet',
          description: `${file.name} - ${fullText.length} Zeichen extrahiert`,
        });
      } catch (error: any) {
        console.error('PDF parsing error:', error);
        toast({
          title: '❌ PDF-Fehler',
          description: error.message || 'Konnte Text nicht extrahieren. Bitte kopiere den Text manuell oder verwende eine TXT-Datei.',
          variant: 'destructive',
        });
      }
    } else {
      toast({
        title: 'Nicht unterstütztes Format',
        description: 'Bitte verwende PDF oder TXT Dateien, oder kopiere den Text manuell.',
        variant: 'destructive',
      });
    }
  };

  const handleStep1Submit = () => {
    if (resumeText.length < 500) {
      toast({
        title: 'Lebenslauf zu kurz',
        description: 'Bitte füge mindestens 500 Zeichen ein.',
        variant: 'destructive',
      });
      return;
    }
    
    // Extract applicant info from resume text
    const nameMatch = resumeText.match(/^([A-ZÄÖÜ][a-zäöü]+(?:\s+[A-ZÄÖÜ][a-zäöü]+)+)/m);
    const emailMatch = resumeText.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/);
    const cityMatch = resumeText.match(/\b(\d{5})\s+([A-ZÄÖÜ][a-zäöü]+(?:\s+[A-ZÄÖÜ][a-zäöü]+)?)\b/);
    
    // Extract phone - but exclude postal codes (5 digits alone)
    // Look for phone numbers with at least 6 digits or has country code/separators
    const phoneMatch = resumeText.match(/(?:\+\d{1,3}[-.\s]?)?(?:\(?\d{2,4}\)?[-.\s]?)?\d{3,4}[-.\s]?\d{3,9}(?!\s+[A-ZÄÖÜ])/);
    
    
    setApplicantInfo({
      name: nameMatch?.[1] || 'Bewerber/in',
      email: emailMatch?.[0],
      phone: phoneMatch?.[0],
      city: cityMatch ? `${cityMatch[1]} ${cityMatch[2]}` : undefined
    });
    
    setStep(2);
  };

  const handleGenerateLetter = async () => {
    if (!resumeText || resumeText.length < 500) {
      toast({
        title: 'Fehler',
        description: 'Lebenslauf fehlt oder ist zu kurz.',
        variant: 'destructive',
      });
      return;
    }

    if (!jobUrl && !jobText) {
      toast({
        title: 'Fehler',
        description: 'Bitte gib entweder eine Job-URL oder Job-Text ein.',
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);

    try {
      const response = await supabase.functions.invoke('generate-application', {
        body: {
          resumeText,
          jobUrl: inputMode === 'url' ? jobUrl : undefined,
          jobText: inputMode === 'text' ? jobText : undefined,
          userCity: userCity || undefined,
        }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const data = response.data;

      if (data.success && data.letter) {
        setGeneratedLetter(data.letter);
        setWordCount(data.wordCount || 0);
        setJobData(data.jobData);
        setStep(3);
        
        toast({
          title: '✅ Anschreiben erstellt!',
          description: `${data.wordCount || 0} Wörter generiert`,
        });
      } else {
        throw new Error(data.error || 'Generierung fehlgeschlagen');
      }
    } catch (error: any) {
      console.error('Generation error:', error);
      toast({
        title: 'Fehler beim Generieren',
        description: error.message || 'Bitte versuche es erneut.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };


  return (
    <div className="space-y-6">
      {/* Progress Indicator */}
      <div className="flex items-center justify-center space-x-4 mb-8">
        <div className={`flex items-center ${step >= 1 ? 'text-primary' : 'text-muted-foreground'}`}>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${step >= 1 ? 'border-primary bg-primary/10' : 'border-muted'}`}>
            {step > 1 ? <Check className="h-5 w-5" /> : '1'}
          </div>
          <span className="ml-2 font-medium">Lebenslauf</span>
        </div>
        
        <ArrowRight className="h-5 w-5 text-muted-foreground" />
        
        <div className={`flex items-center ${step >= 2 ? 'text-primary' : 'text-muted-foreground'}`}>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${step >= 2 ? 'border-primary bg-primary/10' : 'border-muted'}`}>
            {step > 2 ? <Check className="h-5 w-5" /> : '2'}
          </div>
          <span className="ml-2 font-medium">Job-Details</span>
        </div>
        
        <ArrowRight className="h-5 w-5 text-muted-foreground" />
        
        <div className={`flex items-center ${step >= 3 ? 'text-primary' : 'text-muted-foreground'}`}>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${step >= 3 ? 'border-primary bg-primary/10' : 'border-muted'}`}>
            {step >= 3 ? <Check className="h-5 w-5" /> : '3'}
          </div>
          <span className="ml-2 font-medium">Anschreiben</span>
        </div>
      </div>

      {/* Step 1: Resume Upload */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-6 w-6 text-primary" />
              <span>Schritt 1: Lebenslauf hochladen</span>
              <Badge variant="secondary" className="ml-2 text-xs px-2 py-0.5 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                BETA
              </Badge>
            </CardTitle>
            <CardDescription>
              Lade deinen Lebenslauf als PDF/TXT hoch oder füge den Text direkt ein (min. 500 Zeichen)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* File Upload */}
            <div className="space-y-2">
              <Label htmlFor="resume-file">Datei hochladen (PDF oder TXT)</Label>
              <div className="flex items-center gap-4">
                <Input
                  id="resume-file"
                  type="file"
                  accept=".txt,.pdf"
                  onChange={handleFileUpload}
                  className="flex-1"
                />
                <Upload className="h-5 w-5 text-muted-foreground" />
              </div>
              {resumeFile && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    📄 {resumeFile.name} ({Math.round(resumeFile.size / 1024)} KB)
                  </p>
                  {resumeText && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm text-green-800 font-semibold mb-1">
                        ✅ Text erfolgreich extrahiert ({resumeText.length} Zeichen)
                      </p>
                      <p className="text-xs text-green-700">
                        Vorschau: {resumeText.substring(0, 150)}...
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-4">
              <div className="flex-1 h-px bg-border" />
              <span className="text-sm text-muted-foreground">oder</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* Direct Text Input */}
            <div className="space-y-2">
              <Label htmlFor="resume-text">Lebenslauf-Text direkt einfügen</Label>
              <Textarea
                id="resume-text"
                placeholder="Füge hier deinen kompletten Lebenslauf ein (Name, Erfahrung, Skills, Ausbildung...)"
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                rows={12}
                className="font-mono text-sm"
              />
              <p className="text-sm text-muted-foreground">
                {resumeText.length} / 500 Zeichen (min.)
              </p>
            </div>

            <Button 
              onClick={handleStep1Submit} 
              disabled={resumeText.length < 500}
              className="w-full"
              size="lg"
            >
              Weiter zu Job-Details
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Job Input */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Link className="h-6 w-6 text-primary" />
              <span>Schritt 2: Job-Quelle wählen</span>
            </CardTitle>
            <CardDescription>
              Füge eine Job-URL ein oder kopiere die Stellenausschreibung direkt
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Input Mode Selector */}
            <div className="flex gap-2">
              <Button
                variant={inputMode === 'url' ? 'default' : 'outline'}
                onClick={() => setInputMode('url')}
                className="flex-1"
              >
                <Link className="h-4 w-4 mr-2" />
                Job-URL
              </Button>
              <Button
                variant={inputMode === 'text' ? 'default' : 'outline'}
                onClick={() => setInputMode('text')}
                className="flex-1"
              >
                <FileText className="h-4 w-4 mr-2" />
                Job-Text
              </Button>
            </div>

            {inputMode === 'url' ? (
              <div className="space-y-2">
                <Label htmlFor="job-url">Job-URL</Label>
                <Input
                  id="job-url"
                  placeholder="https://stepstone.de/stellenangebote/..."
                  value={jobUrl}
                  onChange={(e) => setJobUrl(e.target.value)}
                  className="h-12"
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="job-text">Stellenausschreibungs-Text</Label>
                <Textarea
                  id="job-text"
                  placeholder="Kopiere hier die komplette Stellenausschreibung ein..."
                  value={jobText}
                  onChange={(e) => setJobText(e.target.value)}
                  rows={10}
                  className="font-mono text-sm"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="user-city">Dein Wohnort (optional)</Label>
              <Input
                id="user-city"
                placeholder="z.B. Berlin"
                value={userCity}
                onChange={(e) => setUserCity(e.target.value)}
              />
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Das Anschreiben wird mit GPT-5 generiert (350-450 Wörter, professionelles Deutsch)
              </AlertDescription>
            </Alert>

            <div className="flex gap-4">
              <Button 
                variant="outline" 
                onClick={() => setStep(1)}
                className="flex-1"
              >
                Zurück
              </Button>
              <Button 
                onClick={handleGenerateLetter} 
                disabled={isGenerating || (!jobUrl && !jobText)}
                className="flex-1"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Generiere...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-5 w-5" />
                    Anschreiben erstellen
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Result */}
      {step === 3 && generatedLetter && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Check className="h-6 w-6 text-green-600" />
              <span>Dein personalisiertes Anschreiben</span>
            </CardTitle>
            <CardDescription>
              {wordCount} Wörter · {jobData?.arbeitgeber || 'Unbekannt'} · {jobData?.ort || ''}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <CoverLetterPreview
              letterText={generatedLetter}
              applicantInfo={applicantInfo || undefined}
              jobInfo={jobData}
              date={new Date().toLocaleDateString('de-DE', { 
                day: '2-digit', 
                month: 'long', 
                year: 'numeric' 
              })}
            />

            <div className="flex justify-center">
              <Button 
                onClick={() => { 
                  setStep(1); 
                  setResumeText(''); 
                  setJobUrl(''); 
                  setJobText(''); 
                  setGeneratedLetter('');
                  setApplicantInfo(null);
                }}
                variant="outline"
                size="lg"
              >
                Neue Bewerbung erstellen
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
