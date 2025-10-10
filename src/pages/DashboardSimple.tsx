import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Briefcase, User, FileText, Activity, LogOut, Plus, ExternalLink, 
  Sparkles, Target, ArrowRight, Crown, Clock, CheckCircle, TrendingUp,
  Zap, Star, Calendar, Edit3, ChevronDown, ChevronUp
} from 'lucide-react';
import { Loader2 } from 'lucide-react';
import TwoStepApplicationFlow from '@/components/TwoStepApplicationFlow';

interface Profile {
  plan: string;
  plan_status: string | null;
  scans_used: number;
}

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [jobUrl, setJobUrl] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [recentApplications, setRecentApplications] = useState([]);
  const [showManualForm, setShowManualForm] = useState(false);
  const [jobPostingText, setJobPostingText] = useState('');
  const [isProcessingText, setIsProcessingText] = useState(false);
  const [activeTab, setActiveTab] = useState<'quick' | 'twoStep'>('quick');

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchProfile();
    fetchRecentApplications();
  }, [user, navigate]);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      // Get profile data
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('plan, plan_status')
        .eq('user_id', user.id)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        return;
      }

      // Get current month usage
      const currentMonth = new Date().toISOString().slice(0, 7) + '-01';
      const { data: usage, error: usageError } = await supabase
        .from('usage_scans')
        .select('scans_count')
        .eq('user_id', user.id)
        .eq('month_start', currentMonth)
        .maybeSingle();

      setProfile({
        plan: profileData?.plan || 'free',
        plan_status: profileData?.plan_status,
        scans_used: usage?.scans_count || 0,
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchRecentApplications = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('applications')
        .select('id, job_title, company_name, created_at, updated_at, language, job_url, generated_application')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error fetching applications:', error);
        return;
      }

      // Transform data to include activity types and better information
      const enrichedApplications = (data || []).map(app => {
        const createdDate = new Date(app.created_at).getTime();
        const updatedDate = new Date(app.updated_at).getTime();
        const isUpdated = updatedDate > createdDate + 1000; // Allow 1 second tolerance
        
        return {
          ...app,
          activityType: isUpdated ? 'updated' : 'created',
          lastActivity: app.updated_at,
          hasGeneratedContent: !!app.generated_application,
        };
      });

      setRecentApplications(enrichedApplications);
    } catch (error) {
      console.error('Error fetching applications:', error);
    }
  };

  const handleScanJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobUrl.trim()) return;

    // Check if user has premium access for URL scanner
    if (!profile || profile.plan === 'free') {
      toast({
        title: 'Premium Feature',
        description: 'Der URL Scanner ist nur für Pro-Nutzer verfügbar. Bitte upgraden Sie auf Pro oder nutzen Sie die manuelle Eingabe.',
        variant: 'destructive',
      });
      return;
    }

    setIsScanning(true);
    
    try {
      let data;
      
      try {
        const response = await supabase.functions.invoke('scrape-job', {
          body: { url: jobUrl.trim() }
        });
        data = response.data;
        console.log('Success response data:', data);
      } catch (functionError: any) {
        console.error('Function error details:', {
          name: functionError.name,
          message: functionError.message,
          context: functionError.context,
          stack: functionError.stack
        });
        
        // If the function call failed, try to make a direct fetch to get the error details
        try {
          const directResponse = await fetch(`https://rrwquzbcqrqxwutwijxc.supabase.co/functions/v1/scrape-job`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
              'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJyd3F1emJjcXJxeHd1dHdpanhjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4MDU2NjQsImV4cCI6MjA3NDM4MTY2NH0.75O79n2qZAfdFTkwNhW4DrvYUJUHii2EYxrWcJu6av8'
            },
            body: JSON.stringify({ url: jobUrl.trim() })
          });
          
          console.log('Direct response status:', directResponse.status);
          data = await directResponse.json();
          console.log('Direct response data:', data);
        } catch (directError) {
          console.error('Direct fetch also failed:', directError);
          throw functionError; // Re-throw original error
        }
      }
      // Handle response - null data means an error occurred
      if (!data) {
        console.log('Received null data, checking function directly...');
        // If data is null, try direct fetch to get the actual error
        try {
          const directResponse = await fetch(`https://rrwquzbcqrqxwutwijxc.supabase.co/functions/v1/scrape-job`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
              'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJyd3F1emJjcXJxeHd1dHdpanhjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4MDU2NjQsImV4cCI6MjA3NDM4MTY2NH0.75O79n2qZAfdFTkwNhW4DrvYUJUHii2EYxrWcJu6av8'
            },
            body: JSON.stringify({ url: jobUrl.trim() })
          });
          
          console.log('Direct response status:', directResponse.status);
          const directData = await directResponse.json();
          console.log('Direct response data:', directData);
          data = directData;
        } catch (directError) {
          console.error('Direct fetch failed:', directError);
          toast({
            title: 'Fehler beim Scannen',
            description: 'Die Job-URL konnte nicht verarbeitet werden.',
            variant: 'destructive',
          });
          return;
        }
      }
      
      // Handle error responses
      if (data && !data.success) {
        console.log('Error response:', data);
        
        if (data.code === 'PAYWALL_LIMIT') {
          toast({
            title: 'Monatslimit erreicht',
            description: 'Du hast dein Monatslimit erreicht. Upgrade auf Premium für unbegrenzte Bewerbungen.',
            variant: 'destructive',
          });
          return;
        }
        
        if (data.code === 'INCOMPLETE_SOURCE') {
          toast({
            title: 'Unvollständige Stellenausschreibung',
            description: data.message || 'Auf dieser Seite konnten nicht genügend Informationen gefunden werden. Bitte versuche es mit einer anderen Job-URL.',
            variant: 'destructive',
          });
          return;
        }
        
        if (data.code === 'FETCH_ERROR') {
          toast({
            title: 'Website nicht erreichbar',
            description: data.message || 'Die Job-Seite konnte nicht geladen werden. Bitte versuche es mit einem anderen Link.',
            variant: 'destructive',
          });
          return;
        }
        
        if (data.code === 'LINKEDIN_BLOCKED') {
          toast({
            title: 'LinkedIn nicht unterstützt',
            description: 'LinkedIn blockiert automatisierte Zugriffe. Bitte kopiere den Stelleninhalt manuell oder verwende einen anderen Job-Portal Link (z.B. StepStone, Xing, Indeed).',
            variant: 'destructive',
          });
          return;
        }
        
        // Show specific error message if available
        toast({
          title: 'Fehler beim Scannen',
          description: data.message || 'Die Job-URL konnte nicht verarbeitet werden.',
          variant: 'destructive',
        });
        return;
      }
      
      // Handle successful response
      if (data?.success && data?.jobData) {
        toast({
          title: 'Job erfolgreich gescannt',
          description: `${data.jobData.jobtitel || data.jobData.title} bei ${data.jobData.arbeitgeber || data.jobData.company}`,
        });
        
        // Navigate to application generator with job data
        navigate('/generate', { state: { jobData: data.jobData } });
      } else {
        // Handle unexpected response format
        toast({
          title: 'Fehler beim Scannen',
          description: 'Die Job-URL konnte nicht verarbeitet werden.',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('Error scanning job:', error);
      
      // Try to extract error details from Supabase function error
      let errorData = null;
      try {
        // For FunctionsHttpError, the response body might be in different places
        if (error.context?.res) {
          errorData = await error.context.res.json();
        } else if (error.message) {
          // Try to parse JSON from error message
          const jsonMatch = error.message.match(/\{.*\}/);
          if (jsonMatch) {
            errorData = JSON.parse(jsonMatch[0]);
          }
        }
      } catch (e) {
        console.error('Error parsing error data:', e);
      }

      if (errorData?.code === 'PAYWALL_LIMIT') {
        toast({
          title: 'Monatslimit erreicht',
          description: 'Du hast dein Monatslimit erreicht. Upgrade auf Premium für unbegrenzte Bewerbungen.',
          variant: 'destructive',
        });
        return;
      }
      
      if (errorData?.code === 'INCOMPLETE_SOURCE') {
        toast({
          title: 'Unvollständige Stellenausschreibung',
          description: errorData.message || 'Auf dieser Seite konnten nicht genügend Informationen gefunden werden. Bitte versuche es mit einer anderen Job-URL.',
          variant: 'destructive',
        });
        return;
      }
      
      if (errorData?.code === 'FETCH_ERROR') {
        toast({
          title: 'Website nicht erreichbar',
          description: errorData.message || 'Die Job-Seite konnte nicht geladen werden. Bitte versuche es mit einem anderen Link.',
          variant: 'destructive',
        });
        return;
      }
      
      if (errorData?.code === 'LINKEDIN_BLOCKED') {
        toast({
          title: 'LinkedIn nicht unterstützt',
          description: 'LinkedIn blockiert automatisierte Zugriffe. Bitte kopiere den Stelleninhalt manuell oder verwende einen anderen Job-Portal Link (z.B. StepStone, Xing, Indeed).',
          variant: 'destructive',
        });
        return;
      }
      
      // Show specific error message if available, otherwise generic error
      toast({
        title: 'Fehler beim Scannen',
        description: errorData?.message || 'Ein unerwarteter Fehler ist aufgetreten.',
        variant: 'destructive',
      });
    } finally {
      setIsScanning(false);
      setJobUrl('');
      fetchProfile(); // Refresh usage count
      fetchRecentApplications(); // Refresh activities
    }
  };

  const handleManualJobSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!jobPostingText.trim()) {
      toast({
        title: 'Text erforderlich',
        description: 'Bitte füge den vollständigen Stellenausschreibungs-Text ein.',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessingText(true);

    try {
      let data;
      
      try {
        const response = await supabase.functions.invoke('scrape-job', {
          body: { 
            url: '', // Empty URL to indicate text processing
            rawText: jobPostingText.trim() 
          }
        });
        data = response.data;
        console.log('Text processing success response:', data);
      } catch (functionError: any) {
        console.error('Text processing function error details:', {
          name: functionError.name,
          message: functionError.message,
          context: functionError.context,
          stack: functionError.stack
        });
        
        // If the function call failed, try to make a direct fetch to get the error details
        try {
          const directResponse = await fetch(`https://rrwquzbcqrqxwutwijxc.supabase.co/functions/v1/scrape-job`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
              'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJyd3F1emJjcXJxeHd1dHdpanhjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4MDU2NjQsImV4cCI6MjA3NDM4MTY2NH0.75O79n2qZAfdFTkwNhW4DrvYUJUHii2EYxrWcJu6av8'
            },
            body: JSON.stringify({ 
              url: '', 
              rawText: jobPostingText.trim() 
            })
          });
          
          console.log('Text processing direct response status:', directResponse.status);
          data = await directResponse.json();
          console.log('Text processing direct response data:', data);
        } catch (directError) {
          console.error('Text processing direct fetch also failed:', directError);
          throw functionError; // Re-throw original error
        }
      }
      
      // Handle error responses
      if (data && !data.success) {
        if (data.code === 'TEXT_PROCESSING_ERROR' || data.code === 'INCOMPLETE_SOURCE') {
          toast({
            title: 'Text konnte nicht verarbeitet werden',
            description: data.message || 'Der eingefügte Text enthält nicht genügend Informationen für eine Stellenausschreibung.',
            variant: 'destructive',
          });
          return;
        }
        
        // Show specific error message if available
        toast({
          title: 'Fehler beim Verarbeiten',
          description: data.message || 'Der Job-Text konnte nicht verarbeitet werden.',
          variant: 'destructive',
        });
        return;
      }
      
      // Handle successful response
      if (data?.success && data?.jobData) {
        toast({
          title: 'Job-Text erfolgreich verarbeitet',
          description: `${data.jobData.jobtitel} bei ${data.jobData.arbeitgeber}`,
        });
        
        // Navigate to application generator with job data
        navigate('/generate', { state: { jobData: data.jobData } });
      } else {
        // Handle unexpected response format
        toast({
          title: 'Fehler beim Verarbeiten',
          description: 'Der Job-Text konnte nicht verarbeitet werden.',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('Error processing job text:', error);
      
      // Try to extract error details from Supabase function error
      let errorData = null;
      try {
        if (error.context?.res) {
          errorData = await error.context.res.json();
        } else if (error.message) {
          const jsonMatch = error.message.match(/\{.*\}/);
          if (jsonMatch) {
            errorData = JSON.parse(jsonMatch[0]);
          }
        }
      } catch (e) {
        console.error('Error parsing error data:', e);
      }
      
      if (errorData?.code === 'TEXT_PROCESSING_ERROR' || errorData?.code === 'INCOMPLETE_SOURCE') {
        toast({
          title: 'Text konnte nicht verarbeitet werden',
          description: errorData.message || 'Der eingefügte Text enthält nicht genügend Informationen für eine Stellenausschreibung.',
          variant: 'destructive',
        });
        return;
      }
      
      // Show specific error message if available, otherwise generic error
      toast({
        title: 'Fehler beim Verarbeiten',
        description: errorData?.message || 'Ein unerwarteter Fehler ist aufgetreten beim Verarbeiten des Textes.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessingText(false);
      setJobPostingText('');
      fetchRecentApplications(); // Refresh activities after new application
    }
  };

  const resetManualForm = () => {
    setJobPostingText('');
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const isPremium = profile?.plan === 'pro' && profile?.plan_status === 'active';
  const scansRemaining = isPremium ? '∞' : Math.max(0, 1 - (profile?.scans_used || 0));

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-primary/5 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-secondary/20 rounded-full blur-2xl animate-float" style={{ animationDelay: '2s' }} />
      </div>

      {/* Header with enhanced design */}
      <header className="border-b bg-card/80 backdrop-blur-lg shadow-soft relative z-10">
        <div className="container mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="animate-fade-in">
              <p className="text-2xl font-semibold text-foreground">
                Willkommen zurück, {user?.user_metadata?.first_name || user?.email?.split('@')[0] || 'User'}!
              </p>
            </div>
            
            <div className="flex items-center space-x-4 animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <Badge 
                variant={isPremium ? "default" : "secondary"} 
                className={`px-4 py-2 text-sm font-medium ${isPremium ? 'bg-gradient-to-r from-primary to-primary/80 shadow-soft' : ''}`}
              >
                {isPremium ? (
                  <div className="flex items-center gap-2">
                    <Crown className="h-4 w-4" />
                    Pro
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Free ({scansRemaining} verbleibend)
                  </div>
                )}
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-10 relative z-10">
        {/* Welcome section */}
        <div className="mb-10 animate-slide-up">
          <h2 className="text-2xl font-bold mb-2">Erstelle deine perfekte Bewerbung</h2>
          <p className="text-muted-foreground text-lg">
            Wähle deinen bevorzugten Workflow für die Bewerbungserstellung.
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex gap-4 mb-8">
          <Button
            variant={activeTab === 'quick' ? 'default' : 'outline'}
            onClick={() => setActiveTab('quick')}
            className="flex-1"
            size="lg"
          >
            <Zap className="h-5 w-5 mr-2" />
            Quick Scanner
            <Badge variant="secondary" className="ml-2 text-xs">BETA</Badge>
          </Button>
          <Button
            variant={activeTab === 'twoStep' ? 'default' : 'outline'}
            onClick={() => setActiveTab('twoStep')}
            className="flex-1"
            size="lg"
          >
            <FileText className="h-5 w-5 mr-2" />
            2-Schritt Flow
            <Badge variant="secondary" className="ml-2 text-xs">NEU</Badge>
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {activeTab === 'twoStep' ? (
              <TwoStepApplicationFlow />
            ) : (
              <>
            {/* Enhanced New Application Card */}
            <Card className="shadow-medium border-0 card-hover animate-slide-up" style={{ animationDelay: '0.1s' }}>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center space-x-3 text-xl">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Target className="h-6 w-6 text-primary" />
                      </div>
                      <span>Neue Bewerbung erstellen</span>
                      <Badge variant="secondary" className="ml-2 text-xs px-2 py-0.5 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                        BETA
                      </Badge>
                    </CardTitle>
                    <CardDescription className="mt-2 text-base">
                      Füge eine Job-URL ein und erhalte in Sekunden eine maßgeschneiderte Bewerbung
                    </CardDescription>
                  </div>
                  <div className="hidden md:block">
                    <div className="p-3 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-xl">
                      <Sparkles className="h-8 w-8 text-primary animate-pulse" />
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <form onSubmit={handleScanJob} className="space-y-6">
                  <div className="space-y-4">
                    <div className="relative">
                      <Input
                        placeholder={isPremium ? "https://example.com/stellenanzeige oder Job-URL hier einfügen" : "URL Scanner nur für Pro-Nutzer verfügbar"}
                        value={jobUrl}
                        onChange={(e) => setJobUrl(e.target.value)}
                        className={`h-14 text-base pl-4 pr-4 border-2 transition-all duration-300 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 ${!isPremium ? 'opacity-50' : ''}`}
                        disabled={isScanning || !isPremium}
                      />
                      {!isPremium && (
                        <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-md">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Crown className="h-5 w-5 text-amber-500" />
                            <span className="font-medium">Pro Feature</span>
                          </div>
                        </div>
                      )}
                    </div>
                    <Button 
                      type="submit" 
                      disabled={isScanning || !jobUrl.trim() || !isPremium}
                      className={`w-full h-14 text-base font-semibold ${isPremium ? 'button-glow' : 'opacity-50'}`}
                    >
                      {isScanning ? (
                        <div className="flex items-center gap-3">
                          <Loader2 className="h-5 w-5 animate-spin" />
                          <span>Analysiere Stellenausschreibung...</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          {!isPremium && <Crown className="h-5 w-5" />}
                          <Zap className="h-5 w-5" />
                          <span>{isPremium ? 'Bewerbung erstellen' : 'Pro erforderlich für URL Scanner'}</span>
                          <ArrowRight className="h-4 w-4" />
                        </div>
                      )}
                    </Button>
                  </div>
                  
                  {!isPremium && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center gap-3">
                      <Clock className="h-5 w-5 text-amber-600" />
                      <div>
                        <p className="text-sm font-medium text-amber-800">
                          Du hast noch {scansRemaining} kostenlose Bewerbung{scansRemaining !== 1 ? 'en' : ''} diesen Monat
                        </p>
                        <p className="text-xs text-amber-600 mt-1">
                          Upgrade zu Pro für unbegrenzte Bewerbungen
                        </p>
                      </div>
                    </div>
                  )}
                </form>
              </CardContent>
            </Card>

            {/* Manual Job Input Form */}
            <Card className="shadow-medium border-0 card-hover animate-slide-up" style={{ animationDelay: '0.15s' }}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center space-x-3 text-xl">
                      <div className="p-2 bg-secondary/20 rounded-lg">
                        <Edit3 className="h-6 w-6 text-primary" />
                      </div>
                      <span>Job-Details manuell eingeben</span>
                      {/*<Badge variant="secondary" className="ml-2 text-xs px-2 py-0.5 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                        BETA
                      </Badge>*/}
                    </CardTitle>
                    <CardDescription className="mt-2 text-base">
                      Kopiere einfach den gesamten Stellenausschreibungs-Text (z.B. von LinkedIn) und lass die KI ihn analysieren
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowManualForm(!showManualForm)}
                    className="text-primary"
                  >
                    {showManualForm ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </div>
              </CardHeader>
              
              {showManualForm && (
                <CardContent>
                  <form onSubmit={handleManualJobSubmit} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="jobPostingText" className="text-sm font-medium">
                        Stellenausschreibungs-Text <span className="text-destructive">*</span>
                      </Label>
                      <p className="text-xs text-muted-foreground mb-2">
                        Kopiere den gesamten Job-Text von LinkedIn, StepStone oder einer anderen Seite hier ein. Die KI wird automatisch alle relevanten Informationen extrahieren.
                      </p>
                      <Textarea
                        id="jobPostingText"
                        placeholder="Hier den gesamten Stellenausschreibungs-Text einfügen...

Beispiel:
Software Engineer (m/w/d) - React & TypeScript
TechCorp GmbH - München

Über uns:
TechCorp ist ein innovatives Technologieunternehmen...

Deine Aufgaben:
- Entwicklung von React-Anwendungen
- Zusammenarbeit im agilen Team
- Code Reviews und Qualitätssicherung

Was du mitbringst:
- 3+ Jahre Erfahrung mit JavaScript/TypeScript
- Erfahrung mit React und modernen Web-Technologien
- Teamfähigkeit und Kommunikationsstärke

Wir bieten:
- Modernes Arbeitsumfeld
- Flexible Arbeitszeiten
- Weiterbildungsmöglichkeiten"
                        value={jobPostingText}
                        onChange={(e) => setJobPostingText(e.target.value)}
                        className="min-h-[300px] resize-y"
                        required
                        disabled={isProcessingText}
                      />
                    </div>
                    
                    <div className="flex gap-3">
                      <Button 
                        type="submit" 
                        disabled={isProcessingText || !jobPostingText.trim()}
                        className="flex-1 h-12 text-base font-semibold button-glow"
                      >
                        {isProcessingText ? (
                          <div className="flex items-center gap-3">
                            <Loader2 className="h-5 w-5 animate-spin" />
                            <span>Analysiere Job-Text...</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3">
                            <Zap className="h-5 w-5" />
                            <span>Text analysieren & Bewerbung erstellen</span>
                            <ArrowRight className="h-4 w-4" />
                          </div>
                        )}
                      </Button>
                      
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={resetManualForm}
                        disabled={isProcessingText}
                        className="h-12 px-6"
                      >
                        Zurücksetzen
                      </Button>
                    </div>
                  </form>
                </CardContent>
              )}
            </Card>
              </>
            )}

            {/* Enhanced Recent Activities with Complete Activity Tracking */}
            <Card className="shadow-medium border-0 card-hover animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <CardHeader>
                <CardTitle className="flex items-center space-x-3 text-xl">
                  <div className="p-2 bg-secondary/20 rounded-lg">
                    <Activity className="h-6 w-6 text-primary" />
                  </div>
                  <span>Letzte Aktivitäten</span>
                </CardTitle>
                <CardDescription>
                  Vollständige Übersicht aller Bewerbungsaktivitäten
                </CardDescription>
              </CardHeader>
              <CardContent>
                 {recentApplications.length > 0 ? (
                  <div className="space-y-3">
                    {recentApplications.map((app: any, index: number) => (
                      <div 
                        key={`${app.id}-${app.lastActivity}`}
                        className="group p-4 border border-border/50 rounded-xl hover:bg-accent/30 transition-all duration-300 cursor-pointer animate-fade-in"
                        style={{ animationDelay: `${0.1 * index}s` }}
                        onClick={() => navigate('/documents')}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1">
                            <div className={`p-2 rounded-lg flex-shrink-0 ${
                              app.activityType === 'created' 
                                ? 'bg-green-100 text-green-600' 
                                : 'bg-blue-100 text-blue-600'
                            }`}>
                              {app.activityType === 'created' ? (
                                <Plus className="h-4 w-4" />
                              ) : (
                                <Edit3 className="h-4 w-4" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                                    {app.job_title}
                                  </h4>
                                  <p className="text-sm text-muted-foreground mb-1">
                                    {app.company_name}
                                  </p>
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <span className={`px-2 py-1 rounded-full ${
                                      app.activityType === 'created' 
                                        ? 'bg-green-100 text-green-600' 
                                        : 'bg-blue-100 text-blue-600'
                                    }`}>
                                      {app.activityType === 'created' ? 'Erstellt' : 'Aktualisiert'}
                                    </span>
                                    {app.hasGeneratedContent && (
                                      <span className="px-2 py-1 rounded-full bg-amber-100 text-amber-600">
                                        Bewerbung generiert
                                      </span>
                                    )}
                                    {app.language && app.language !== 'de' && (
                                      <span className="px-2 py-1 rounded-full bg-purple-100 text-purple-600">
                                        {app.language.toUpperCase()}
                                      </span>
                                    )}
                                    {app.job_url && (
                                      <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                                        <ExternalLink className="h-3 w-3 inline mr-1" />
                                        Job-Link
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="text-right flex-shrink-0">
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <Clock className="h-3 w-3" />
                                    <span>
                                      {new Date(app.lastActivity).toLocaleDateString('de-DE', {
                                        day: '2-digit',
                                        month: '2-digit',
                                        year: '2-digit'
                                      })}
                                    </span>
                                  </div>
                                  <div className="text-xs text-muted-foreground mt-1">
                                    {new Date(app.lastActivity).toLocaleTimeString('de-DE', {
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    <div className="pt-4 border-t border-border/30">
                      <Button 
                        variant="outline" 
                        className="w-full h-11 hover:bg-primary/5 hover:border-primary/50"
                        onClick={() => navigate('/documents')}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Alle Dokumente anzeigen ({recentApplications.length >= 10 ? '10+' : recentApplications.length})
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="mx-auto w-24 h-24 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full flex items-center justify-center mb-4">
                      <Activity className="h-10 w-10 text-primary" />
                    </div>
                    <p className="text-muted-foreground text-lg mb-2">
                      Noch keine Aktivitäten
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Beginne mit deiner ersten Bewerbung oben!
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Enhanced Sidebar */}
          <div className="space-y-6">
            {/* Profile Management */}
            <Card className="shadow-medium border-0 card-hover animate-slide-up" style={{ animationDelay: '0.3s' }}>
              <CardHeader>
                <CardTitle className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <User className="h-5 w-5 text-blue-600" />
                  </div>
                  <span>Profil verwalten</span>
                </CardTitle>
                <CardDescription>
                  Optimiere deine persönlichen Daten für bessere Bewerbungen
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  variant="outline" 
                  className="w-full h-12 border-2 hover:border-primary/50 hover:bg-primary/5"
                  onClick={() => navigate('/profile')}
                >
                  <User className="h-4 w-4 mr-2" />
                  Profil bearbeiten
                </Button>
              </CardContent>
            </Card>

            {/* My Documents */}
            <Card className="shadow-medium border-0 card-hover animate-slide-up" style={{ animationDelay: '0.4s' }}>
              <CardHeader>
                <CardTitle className="flex items-center space-x-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <FileText className="h-5 w-5 text-green-600" />
                  </div>
                  <span>Meine Dokumente</span>
                </CardTitle>
                <CardDescription>
                  Alle deine Bewerbungen und Lebensläufe an einem Ort
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  variant="outline" 
                  className="w-full h-12 border-2 hover:border-primary/50 hover:bg-primary/5"
                  onClick={() => navigate('/documents')}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Dokumente verwalten
                </Button>
              </CardContent>
            </Card>

            {/* Enhanced Subscription Card */}
            {!isPremium && (
              <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10 shadow-strong card-hover animate-slide-up" style={{ animationDelay: '0.5s' }}>
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg">
                      <Crown className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-primary flex items-center gap-2">
                        Premium werden
                        <Star className="h-4 w-4 text-amber-500" />
                      </CardTitle>
                    </div>
                  </div>
                  <CardDescription className="text-primary/80">
                    Unbegrenzte KI-Bewerbungen + Premium-Vorlagen
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Unbegrenzte Bewerbungen</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Premium-Vorlagen</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Prioritäts-Support</span>
                    </div>
                  </div>
                  <div className="text-center py-2">
                    <span className="text-2xl font-bold text-primary">9.99 CHF</span>
                    <span className="text-sm text-muted-foreground">/Monat</span>
                  </div>
                  <Button 
                    className="w-full h-12 button-glow font-semibold"
                    onClick={() => navigate('/pro-upgrade')}
                  >
                    <Crown className="h-4 w-4 mr-2" />
                    Jetzt upgraden
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}