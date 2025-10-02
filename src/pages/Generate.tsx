import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Briefcase, Building2, MapPin, Clock, Download, FileText, Loader2, Edit, Save, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { validateAndRefreshSession } from '@/lib/sessionUtils';
import jsPDF from 'jspdf';

interface JobData {
  jobtitel: string;
  arbeitgeber: string;
  ort?: string;
  vertrag?: string;
  beschreibung: string;
  anforderungen: string[];
  bewerbungsprozess?: string;
}

export default function Generate() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const jobData = location.state?.jobData as JobData;
  
  const [generatedApplication, setGeneratedApplication] = useState<string>('');
  const [applicationId, setApplicationId] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGenerationComplete, setIsGenerationComplete] = useState(false);
  const [userPlan, setUserPlan] = useState<string>('free');
  const [monthlyUsage, setMonthlyUsage] = useState<number>(0);
  const [usageLimit, setUsageLimit] = useState<number>(1);
  const [hasReachedLimit, setHasReachedLimit] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedApplication, setEditedApplication] = useState<string>('');

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    
    if (!jobData) {
      navigate('/dashboard');
      return;
    }
    fetchUserPlan();
    fetchMonthlyUsage();
  }, [user, jobData, navigate]);

  const fetchUserPlan = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('plan')
        .eq('user_id', user.id)
        .single();
      
      if (!error && data) {
        const plan = data.plan || 'free';
        setUserPlan(plan);
        // Check for both 'pro' and 'premium' plan names
        const isPremium = plan === 'pro' || plan === 'premium';
        setUsageLimit(isPremium ? 999 : 1); // Pro users get virtually unlimited
      }
    } catch (error) {
      console.error('Error fetching user plan:', error);
    }
  };

  const fetchMonthlyUsage = async () => {
    if (!user) return;
    
    try {
      const currentDate = new Date();
      const monthStart = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-01`;
      
      const { data, error } = await supabase
        .from('usage_scans')
        .select('scans_count')
        .eq('user_id', user.id)
        .eq('month_start', monthStart)
        .maybeSingle();
      
      const usage = data?.scans_count || 0;
      setMonthlyUsage(usage);
      
      // Check if limit is reached after fetching usage
      if (userPlan === 'free' && usage >= 1) {
        setHasReachedLimit(true);
      }
    } catch (error) {
      console.error('Error fetching monthly usage:', error);
    }
  };

  // Update hasReachedLimit when userPlan or monthlyUsage changes
  useEffect(() => {
    if (userPlan === 'free' && monthlyUsage >= usageLimit) {
      setHasReachedLimit(true);
    } else {
      setHasReachedLimit(false);
    }
  }, [userPlan, monthlyUsage, usageLimit]);

  useEffect(() => {
    if (generatedApplication && !editedApplication) {
      setEditedApplication(generatedApplication);
    }
  }, [generatedApplication]);

  // Auto-generate on page load if not already generated and limit not reached
  useEffect(() => {
    if (!isGenerationComplete && !isGenerating && !hasReachedLimit && user && jobData) {
      generateApplication();
    }
  }, [isGenerationComplete, isGenerating, hasReachedLimit, user, jobData]);

  const generateApplication = async () => {
    if (!user || !jobData || isGenerating) return;

    setIsGenerating(true);
    
    try {
      console.log('Starting application generation...');
      console.log('Current user:', user.id);
      console.log('Job data:', jobData);
      
      // Validate and refresh session using utility
      console.log('Validating session...');
      const sessionValidation = await validateAndRefreshSession();
      
      if (!sessionValidation.isValid) {
        console.error('Session validation failed:', sessionValidation.error);
        throw new Error(sessionValidation.error || 'Sitzung ungültig. Bitte melden Sie sich erneut an.');
      }

      console.log('Session validated successfully, calling generate-application function...');
      
      const { data, error } = await supabase.functions.invoke('generate-application', {
        body: { jobData }
      });

      console.log('Function response received');
      console.log('Data:', data);
      console.log('Error:', error);

      if (error) {
        console.error('Function invoke error:', error);
        throw error;
      }

      if (data?.error) {
        console.error('Function returned error:', data.error);
        if (data.limitReached) {
          setHasReachedLimit(true);
          toast({
            title: "Monatliches Limit erreicht",
            description: "Sie haben bereits 1 Bewerbung diesen Monat generiert. Upgraden Sie auf Pro für unbegrenzte Generierungen.",
            variant: "destructive",
          });
          return;
        }
        throw new Error(data.error);
      }

      if (!data?.generatedApplication) {
        console.error('No application in response:', data);
        throw new Error('Keine Bewerbung in der Antwort erhalten');
      }

      console.log('Application generated successfully');
      setGeneratedApplication(data.generatedApplication);
      setApplicationId(data.applicationId);
      setIsGenerationComplete(true);
      
      // Update usage count
      setMonthlyUsage(prev => prev + 1);
      if (userPlan === 'free' && monthlyUsage + 1 >= usageLimit) {
        setHasReachedLimit(true);
      }
      
      toast({
        title: "Bewerbung generiert",
        description: "Ihre personalisierte Bewerbung wurde erfolgreich erstellt.",
      });

    } catch (error) {
      console.error('Error generating application:', error);
      
      let errorMessage = "Die Bewerbung konnte nicht generiert werden. Bitte versuchen Sie es erneut.";
      
      if (error instanceof Error) {
        const errorMsg = error.message.toLowerCase();
        if (errorMsg.includes('session') || errorMsg.includes('auth') || errorMsg.includes('token')) {
          errorMessage = "Sitzung abgelaufen. Bitte melden Sie sich erneut an.";
          toast({
            title: "Sitzung abgelaufen",
            description: errorMessage,
            variant: "destructive",
          });
          setTimeout(() => navigate('/auth'), 2000);
          return;
        } else if (errorMsg.includes('openai') || errorMsg.includes('api')) {
          errorMessage = "Fehler bei der KI-Generierung. Bitte versuchen Sie es später erneut.";
        } else if (errorMsg.includes('profile')) {
          errorMessage = "Profildaten konnten nicht geladen werden. Bitte vervollständigen Sie Ihr Profil.";
        }
      }
      
      toast({
        title: "Fehler",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const saveEdits = () => {
    setGeneratedApplication(editedApplication);
    setIsEditing(false);
    toast({
      title: "Änderungen gespeichert",
      description: "Ihre Änderungen wurden erfolgreich gespeichert.",
    });
  };

  const cancelEditing = () => {
    setEditedApplication(generatedApplication);
    setIsEditing(false);
  };

  const downloadAsTXT = () => {
    if (!generatedApplication) return;

    // Clean filename - remove special characters
    const cleanJobTitle = jobData.jobtitel.replace(/[^\w\s-]/g, '').replace(/\s+/g, '_');
    const cleanCompany = jobData.arbeitgeber.replace(/[^\w\s-]/g, '').replace(/\s+/g, '_');
    const currentDate = new Date().toLocaleDateString('de-DE').replace(/\./g, '-');

    // Only add watermark for free users
    let content = generatedApplication;
    if (userPlan === 'free') {
      content += `\n\n---\nErstellt mit Workblix am ${new Date().toLocaleDateString('de-DE')}`;
    }

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Bewerbung_${cleanCompany}_${cleanJobTitle}_${currentDate}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Download erfolgreich",
      description: `Ihre Bewerbung wurde als TXT-Datei heruntergeladen${userPlan === 'pro' ? ' (ohne Wasserzeichen)' : ''}.`,
    });
  };

  const downloadAsPDF = async () => {
    if (!generatedApplication) return;

    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      // Clean filename
      const cleanJobTitle = jobData.jobtitel.replace(/[^\w\s-]/g, '').replace(/\s+/g, '_');
      const cleanCompany = jobData.arbeitgeber.replace(/[^\w\s-]/g, '').replace(/\s+/g, '_');
      const currentDate = new Date().toLocaleDateString('de-DE').replace(/\./g, '-');
      
      // Professional PDF styling
      const margins = {
        left: 25,
        right: 25,
        top: 25,
        bottom: 25
      };
      
      const pageWidth = 210 - margins.left - margins.right; // A4 width minus margins
      const pageHeight = 297 - margins.top - margins.bottom; // A4 height minus margins
      
      // Set professional font
      doc.setFont("helvetica", "normal");
      
      // Parse application content for better formatting
      const applicationLines = generatedApplication.split('\n');
      let yPosition = margins.top;
      const lineHeight = 5;
      const paragraphSpacing = 8;
      
      applicationLines.forEach((line: string) => {
        line = line.trim();
        
        if (line === '') {
          // Empty line - add paragraph spacing
          yPosition += paragraphSpacing;
          return;
        }
        
        // Check if we need a new page
        if (yPosition > pageHeight + margins.top - 20) {
          doc.addPage();
          yPosition = margins.top;
        }
        
        // Detect if line is a header/important (contains date, address, subject, etc.)
        const isHeader = line.includes('Dortmund,') || 
                        line.includes('Betreff:') || 
                        line.includes('Sehr geehrte') ||
                        line.match(/^\d{5}\s/) || // Postal code
                        line.match(/^[A-ZÄÖÜ][a-zäöüß\s-]+straße/) || // Street address
                        line.includes('@') || // Email
                        line.includes('Mit freundlichen Grüßen');
        
        if (isHeader) {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(11);
        } else {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(11);
        }
        
        // Split long lines properly
        const wrappedLines = doc.splitTextToSize(line, pageWidth);
        
        wrappedLines.forEach((wrappedLine: string) => {
          if (yPosition > pageHeight + margins.top - 20) {
            doc.addPage();
            yPosition = margins.top;
          }
          
          doc.text(wrappedLine, margins.left, yPosition);
          yPosition += lineHeight;
        });
        
        // Add extra spacing after certain elements
        if (line.includes('Betreff:') || line.includes('Sehr geehrte') || line.includes('Mit freundlichen Grüßen')) {
          yPosition += 3;
        }
      });
      
      // Only add watermark footer for free users
      if (userPlan === 'free') {
        const totalPages = doc.getNumberOfPages();
        
        for (let i = 1; i <= totalPages; i++) {
          doc.setPage(i);
          doc.setFontSize(8);
          doc.setTextColor(128, 128, 128); // Gray color
          doc.text(
            `Erstellt mit Workblix - ${new Date().toLocaleDateString('de-DE')}`, 
            margins.left, 
            297 - 10 // 10mm from bottom
          );
        }
      }
      
      // Download with professional filename
      doc.save(`Bewerbung_${cleanCompany}_${cleanJobTitle}_${currentDate}.pdf`);
      
      toast({
        title: "Download erfolgreich",
        description: `Ihre Bewerbung wurde als PDF heruntergeladen${userPlan === 'pro' ? ' (ohne Wasserzeichen)' : ''}.`,
      });
    } catch (error) {
      console.error('PDF generation error:', error);
      toast({
        title: "PDF Fehler",
        description: "Fehler beim Erstellen der PDF. Versuchen Sie den TXT Download.",
        variant: "destructive",
      });
    }
  };

  if (!jobData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Zurück zum Dashboard
            </Button>
            <div className="flex items-center space-x-3">
              <div className="bg-primary text-primary-foreground p-2 rounded-lg">
                <Briefcase className="h-6 w-6" />
              </div>
              <h1 className="text-2xl font-bold">Workblix</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Bewerbung generieren</h1>
            <p className="text-muted-foreground">
              Wir haben die Stellenausschreibung analysiert. Hier sind die extrahierten Informationen:
            </p>
          </div>

          {/* Job Information Card */}
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="bg-primary/10 text-primary p-3 rounded-lg">
                    <Building2 className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">{jobData.jobtitel}</CardTitle>
                    <CardDescription className="text-lg">{jobData.arbeitgeber}</CardDescription>
                  </div>
                </div>
                <Badge variant="secondary">
                  <Clock className="h-3 w-3 mr-1" />
                  Gescannt
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {jobData.ort && (
                <div className="flex items-center space-x-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{jobData.ort}</span>
                </div>
              )}

              <div>
                <h3 className="font-semibold mb-2">Stellenbeschreibung</h3>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-sm leading-relaxed">
                    {jobData.beschreibung.length > 500 
                      ? `${jobData.beschreibung.substring(0, 500)}...` 
                      : jobData.beschreibung}
                  </p>
                </div>
              </div>

              {jobData.anforderungen && jobData.anforderungen.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Anforderungen</h3>
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <ul className="text-sm leading-relaxed space-y-1">
                      {jobData.anforderungen.slice(0, 10).map((requirement, index) => (
                        <li key={index} className="flex items-start">
                          <span className="mr-2">•</span>
                          <span>{requirement}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Usage Status for Free Users */}
          {userPlan === 'free' && (
            <Card className="mb-8 border-amber-200 bg-amber-50/50">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="bg-amber-100 text-amber-700 p-3 rounded-lg">
                      <Clock className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-amber-900">Monatliche Nutzung</h3>
                      <p className="text-sm text-amber-700">
                        {monthlyUsage}/{usageLimit} Bewerbung{usageLimit > 1 ? 'en' : ''} diesen Monat generiert
                      </p>
                    </div>
                  </div>
                  {hasReachedLimit && (
                    <Button 
                      onClick={() => navigate('/pro-upgrade')} 
                      className="bg-amber-600 hover:bg-amber-700"
                    >
                      Jetzt upgraden
                    </Button>
                  )}
                </div>
                {hasReachedLimit && (
                  <div className="mt-4 p-4 bg-amber-100 rounded-lg border border-amber-200">
                    <p className="text-sm text-amber-800">
                      Sie haben Ihr monatliches Limit erreicht. Upgraden Sie auf Pro für unbegrenzte Bewerbungsgenerierungen.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Application Generation Status */}
          {isGenerating && (
            <Card className="mb-8">
              <CardContent className="pt-6">
                <div className="flex items-center space-x-3">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <div>
                    <h3 className="font-semibold">Bewerbung wird generiert...</h3>
                    <p className="text-sm text-muted-foreground">
                      Die KI erstellt Ihre personalisierte Bewerbung basierend auf der Stellenausschreibung und Ihrem Profil.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Limit Reached Message */}
          {hasReachedLimit && !isGenerationComplete && !isGenerating && (
            <Card className="mb-8 border-red-200 bg-red-50/50">
              <CardContent className="pt-6">
                <div className="flex items-center space-x-3">
                  <div className="bg-red-100 text-red-700 p-3 rounded-lg">
                    <Clock className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-red-900">Monatliches Limit erreicht</h3>
                    <p className="text-sm text-red-700">
                      Sie haben bereits {usageLimit} Bewerbung diesen Monat generiert. Das nächste Mal können Sie am 1. des nächsten Monats wieder generieren.
                    </p>
                    <div className="mt-4 flex space-x-3">
                      <Button 
                        onClick={() => navigate('/pro-upgrade')} 
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Auf Pro upgraden
                      </Button>
                      <Button 
                        onClick={() => navigate('/dashboard')} 
                        variant="outline"
                        className="border-red-300"
                      >
                        Zum Dashboard
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Generated Application */}
          {isGenerationComplete && generatedApplication && (
            <Card className="mb-8 border-green-200 bg-green-50/50">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center space-x-3">
                    <div className="bg-green-100 text-green-700 p-3 rounded-lg">
                      <FileText className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle className="text-xl text-green-900">Bewerbung erfolgreich erstellt</CardTitle>
                      <CardDescription className="text-green-700">
                        Professionelles Anschreiben bereit zum Versenden
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {!isEditing ? (
                      <>
                        <Button onClick={() => setIsEditing(true)} size="sm" variant="outline" className="border-blue-300 hover:bg-blue-100 flex-1 sm:flex-none">
                          <Edit className="h-4 w-4 sm:mr-2" />
                          <span className="hidden sm:inline">Bearbeiten</span>
                        </Button>
                        <div className="relative flex-1 sm:flex-none">
                          <Button onClick={downloadAsTXT} size="sm" variant="outline" className="border-green-300 hover:bg-green-100 w-full">
                            <Download className="h-4 w-4 sm:mr-2" />
                            <span>TXT</span>
                          </Button>
                          {userPlan === 'pro' && (
                            <Badge className="absolute -top-2 -right-2 bg-yellow-500 text-yellow-900 text-xs">
                              Pro
                            </Badge>
                          )}
                        </div>
                        <div className="relative flex-1 sm:flex-none">
                          <Button onClick={downloadAsPDF} size="sm" className="bg-green-600 hover:bg-green-700 w-full">
                            <Download className="h-4 w-4 sm:mr-2" />
                            <span>PDF</span>
                          </Button>
                          {userPlan === 'pro' && (
                            <Badge className="absolute -top-2 -right-2 bg-yellow-500 text-yellow-900 text-xs">
                              Pro
                            </Badge>
                          )}
                        </div>
                      </>
                    ) : (
                      <>
                        <Button onClick={saveEdits} size="sm" className="bg-green-600 hover:bg-green-700 flex-1 sm:flex-none">
                          <Save className="h-4 w-4 sm:mr-2" />
                          <span className="hidden sm:inline">Speichern</span>
                        </Button>
                        <Button onClick={cancelEditing} size="sm" variant="outline" className="border-gray-300 flex-1 sm:flex-none">
                          <X className="h-4 w-4 sm:mr-2" />
                          <span className="hidden sm:inline">Abbrechen</span>
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-white p-6 rounded-lg border border-green-200 shadow-sm">
                  {isEditing ? (
                    <textarea
                      value={editedApplication}
                      onChange={(e) => setEditedApplication(e.target.value)}
                      className="w-full min-h-[500px] p-4 text-sm leading-relaxed font-serif text-gray-900 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Bearbeiten Sie Ihre Bewerbung hier..."
                    />
                  ) : (
                    <div className="whitespace-pre-line text-sm leading-relaxed font-serif text-gray-900">
                      {generatedApplication}
                    </div>
                  )}
                </div>
                {!isEditing && (
                  <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-3">
                      <div>
                        <h4 className="font-semibold text-green-900">Bewerbung versandfertig</h4>
                        <p className="text-sm text-green-700">
                          Generiert am {new Date().toLocaleDateString('de-DE')} um {new Date().toLocaleTimeString('de-DE')}
                        </p>
                      </div>
                      <Button variant="outline" size="sm" onClick={generateApplication} disabled={isGenerating} className="border-green-300 hover:bg-green-100 w-full sm:w-auto">
                        {isGenerating ? 'Wird generiert...' : 'Neu generieren'}
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="bg-white p-3 rounded border border-green-200">
                        <p className="font-medium text-green-900">✓ Professionell formatiert</p>
                        <p className="text-green-700">Deutsche Geschäftsbrief-Standards</p>
                      </div>
                      <div className="bg-white p-3 rounded border border-green-200">
                        <p className="font-medium text-green-900">✓ Bearbeitbar</p>
                        <p className="text-green-700">Anpassbar vor dem Download</p>
                      </div>
                      <div className="bg-white p-3 rounded border border-green-200">
                        <p className="font-medium text-green-900">
                          {userPlan === 'pro' ? '✓ Ohne Wasserzeichen' : '✓ Stellenspezifisch'}
                        </p>
                        <p className="text-green-700">
                          {userPlan === 'pro' ? 'Professionelle Downloads für Pro-Nutzer' : 'Auf Anforderungen zugeschnitten'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Next Steps */}
          <Card>
            <CardHeader>
              <CardTitle>
                {isGenerationComplete ? 'Weitere Optionen' : 'Profil vervollständigen'}
              </CardTitle>
              <CardDescription>
                {isGenerationComplete 
                  ? 'Verwalten Sie Ihre Bewerbungen und Profil' 
                  : 'Verbessern Sie Ihr Profil für bessere Bewerbungen'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button 
                  variant="outline" 
                  size="lg"
                  onClick={() => navigate('/profile')}
                  className="h-auto p-4"
                >
                  <div className="text-left">
                    <div className="font-semibold">Profil bearbeiten</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Verbessern Sie Ihre Erfahrungen und Fähigkeiten
                    </div>
                  </div>
                </Button>
                
                <Button 
                  size="lg"
                  onClick={() => navigate('/dashboard')}
                  className="h-auto p-4"
                  variant={isGenerationComplete ? "default" : "outline"}
                >
                  <div className="text-left">
                    <div className="font-semibold">Weitere Bewerbungen</div>
                    <div className="text-sm text-primary-foreground/70 mt-1">
                      Erstellen Sie Bewerbungen für andere Stellen
                    </div>
                  </div>
                </Button>
              </div>
              
              {!isGenerationComplete && !isGenerating && (
                <div className="text-center pt-4">
                  <p className="text-sm text-muted-foreground">
                    Die KI-gestützte Bewerbungserstellung läuft automatisch basierend auf Ihrem aktuellen Profil.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}