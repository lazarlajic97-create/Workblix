import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  FileText, 
  Download, 
  Calendar,
  Building2,
  Eye,
  Trash2,
  Search,
  Filter,
  Clock,
  ExternalLink,
  Edit3,
  CheckCircle,
  X
} from 'lucide-react';
import CoverLetterPreview from '@/components/CoverLetterPreview';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Application {
  id: string;
  job_title: string;
  company_name: string;
  created_at: string;
  generated_application: string | null;
  language: string;
  job_url?: string;
  applicant_info?: {
    name: string;
    address?: string;
    city?: string;
    phone?: string;
    email?: string;
  } | null;
  job_info?: {
    jobtitel: string;
    arbeitgeber: string;
    ort?: string;
  } | null;
  date_generated?: string | null;
}

export default function Documents() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'company' | 'position'>('newest');
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchApplications();
  }, [user, navigate]);

  const fetchApplications = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('applications')
        .select('id, job_title, company_name, created_at, generated_application, language, job_url, applicant_info, job_info, date_generated')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setApplications(data || []);
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast({
        title: 'Fehler beim Laden',
        description: 'Deine Dokumente konnten nicht geladen werden.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteApplication = async (applicationId: string) => {
    try {
      const { error } = await supabase
        .from('applications')
        .delete()
        .eq('id', applicationId)
        .eq('user_id', user?.id);

      if (error) throw error;

      setApplications(prev => prev.filter(app => app.id !== applicationId));
      toast({
        title: 'Dokument gelöscht',
        description: 'Das Bewerbungsdokument wurde erfolgreich gelöscht.',
      });
    } catch (error) {
      console.error('Error deleting application:', error);
      toast({
        title: 'Lösch-Fehler',
        description: 'Das Dokument konnte nicht gelöscht werden.',
        variant: 'destructive',
      });
    }
  };

  const updateApplication = async (applicationId: string, updatedText: string) => {
    try {
      const { error } = await supabase
        .from('applications')
        .update({ generated_application: updatedText })
        .eq('id', applicationId)
        .eq('user_id', user?.id);

      if (error) throw error;

      // Update local state
      setApplications(prev => prev.map(app => 
        app.id === applicationId 
          ? { ...app, generated_application: updatedText }
          : app
      ));
      
      // Update selected app if it's the one being edited
      if (selectedApp?.id === applicationId) {
        setSelectedApp({ ...selectedApp, generated_application: updatedText });
      }

      toast({
        title: 'Änderungen gespeichert',
        description: 'Deine Bearbeitung wurde erfolgreich gespeichert.',
      });
    } catch (error) {
      console.error('Error updating application:', error);
      toast({
        title: 'Fehler beim Speichern',
        description: 'Die Änderungen konnten nicht gespeichert werden.',
        variant: 'destructive',
      });
    }
  };

  const filteredAndSortedApplications = applications
    .filter(app => 
      app.job_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.company_name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'company':
          return a.company_name.localeCompare(b.company_name);
        case 'position':
          return a.job_title.localeCompare(b.job_title);
        default:
          return 0;
      }
    });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-primary/5 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Dokumente werden geladen...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-primary/5">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => navigate('/dashboard')}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Zurück zum Dashboard</span>
              </Button>
            </div>
            <div className="text-center">
              <h1 className="text-3xl font-bold">Meine Dokumente</h1>
              <p className="text-muted-foreground">Alle deine generierten Bewerbungen</p>
            </div>
            <div></div>
          </div>

          {/* Search and Filter Controls */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Suche nach Position oder Unternehmen..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Sortieren nach..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Neueste zuerst</SelectItem>
                      <SelectItem value="oldest">Älteste zuerst</SelectItem>
                      <SelectItem value="company">Unternehmen A-Z</SelectItem>
                      <SelectItem value="position">Position A-Z</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Documents Grid */}
          {filteredAndSortedApplications.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h2 className="text-xl font-semibold mb-2">
                  {searchTerm ? 'Keine Dokumente gefunden' : 'Noch keine Dokumente'}
                </h2>
                <p className="text-muted-foreground mb-6">
                  {searchTerm 
                    ? 'Versuche einen anderen Suchbegriff oder ändere deine Filter.' 
                    : 'Generiere deine erste Bewerbung, um sie hier zu sehen.'
                  }
                </p>
                {!searchTerm && (
                  <Button onClick={() => navigate('/generate')}>
                    Bewerbung erstellen
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredAndSortedApplications.map((app, index) => (
                <Card 
                  key={app.id} 
                  className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-border/50 hover:bg-accent/30"
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="p-2 rounded-lg flex-shrink-0 bg-green-100 text-green-600">
                          <FileText className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors text-lg mb-1">
                                {app.job_title}
                              </h4>
                              <p className="text-sm text-muted-foreground mb-2 flex items-center gap-1">
                                <Building2 className="h-4 w-4" />
                                {app.company_name}
                              </p>
                              <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground mb-3">
                                <span className="px-2 py-1 rounded-full bg-green-100 text-green-600">
                                  <CheckCircle className="h-3 w-3 inline mr-1" />
                                  Gespeichert
                                </span>
                                {app.generated_application && (
                                  <span className="px-2 py-1 rounded-full bg-amber-100 text-amber-600 font-medium">
                                    Bewerbung generiert
                                  </span>
                                )}
                                {app.applicant_info && app.job_info && (
                                  <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-600 font-medium">
                                    <FileText className="h-3 w-3 inline mr-1" />
                                    PDF Design verfügbar
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
                              <div className="flex items-center space-x-2">
                                <Button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedApp(app);
                                  }}
                                  variant="outline"
                                  size="sm"
                                  className="flex-1"
                                  disabled={!app.generated_application}
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  Anzeigen
                                </Button>
                                <Button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    downloadApplication(app);
                                  }}
                                  size="sm"
                                  className="flex-1"
                                  disabled={!app.generated_application}
                                >
                                  <Download className="h-4 w-4 mr-1" />
                                  Download
                                </Button>
                                <Button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteApplication(app.id);
                                  }}
                                  variant="outline"
                                  size="sm"
                                  className="text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0 ml-4">
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                <span>
                                  {new Date(app.created_at).toLocaleDateString('de-DE', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: '2-digit'
                                  })}
                                </span>
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                {new Date(app.created_at).toLocaleTimeString('de-DE', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Document Preview Modal with Full Design */}
          {selectedApp && selectedApp.generated_application && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
              <div className="max-w-5xl w-full my-8">
                <Card className="w-full shadow-2xl">
                  <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/30">
                    <div>
                      <CardTitle className="text-2xl">{selectedApp.job_title}</CardTitle>
                      <CardDescription className="text-base mt-1">{selectedApp.company_name}</CardDescription>
                    </div>
                    <Button
                      onClick={() => setSelectedApp(null)}
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </CardHeader>
                  <CardContent className="p-6">
                    <CoverLetterPreview
                      letterText={selectedApp.generated_application}
                      applicantInfo={selectedApp.applicant_info || undefined}
                      jobInfo={selectedApp.job_info || {
                        jobtitel: selectedApp.job_title,
                        arbeitgeber: selectedApp.company_name,
                        ort: undefined
                      }}
                      date={selectedApp.date_generated || new Date(selectedApp.created_at).toLocaleDateString('de-DE', { 
                        day: '2-digit', 
                        month: 'long', 
                        year: 'numeric' 
                      })}
                      onSave={(editedText) => updateApplication(selectedApp.id, editedText)}
                    />
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Statistics */}
          {applications.length > 0 && (
            <Card className="mt-8">
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-primary">{applications.length}</div>
                    <div className="text-sm text-muted-foreground">Gesamt Dokumente</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-primary">
                      {applications.filter(app => app.generated_application).length}
                    </div>
                    <div className="text-sm text-muted-foreground">Vollständige Bewerbungen</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-primary">
                      {new Set(applications.map(app => app.company_name)).size}
                    </div>
                    <div className="text-sm text-muted-foreground">Verschiedene Unternehmen</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}