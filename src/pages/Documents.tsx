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
  Filter
} from 'lucide-react';
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
        .select('id, job_title, company_name, created_at, generated_application, language, job_url')
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

  const downloadApplication = (app: Application) => {
    if (!app.generated_application) {
      toast({
        title: 'Kein Inhalt verfügbar',
        description: 'Für dieses Dokument ist kein generierter Inhalt verfügbar.',
        variant: 'destructive',
      });
      return;
    }

    const cleanJobTitle = app.job_title.replace(/[^\w\s-]/g, '').replace(/\s+/g, '_');
    const cleanCompany = app.company_name.replace(/[^\w\s-]/g, '').replace(/\s+/g, '_');
    const date = new Date(app.created_at).toLocaleDateString('de-DE').replace(/\./g, '-');

    const filename = `Bewerbung_${cleanJobTitle}_${cleanCompany}_${date}.txt`;

    const blob = new Blob([app.generated_application], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: 'Download erfolgreich',
      description: 'Deine Bewerbung wurde heruntergeladen.',
    });
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAndSortedApplications.map((app) => (
                <Card key={app.id} className="hover:shadow-lg transition-shadow duration-200">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg line-clamp-2 mb-1">
                          {app.job_title}
                        </CardTitle>
                        <CardDescription className="flex items-center space-x-1">
                          <Building2 className="h-4 w-4" />
                          <span className="line-clamp-1">{app.company_name}</span>
                        </CardDescription>
                      </div>
                      <Badge variant="outline" className="ml-2">
                        {app.language?.toUpperCase() || 'DE'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4 mr-2" />
                      <span>
                        {new Date(app.created_at).toLocaleDateString('de-DE', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Button
                        onClick={() => setSelectedApp(app)}
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        disabled={!app.generated_application}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Anzeigen
                      </Button>
                      <Button
                        onClick={() => downloadApplication(app)}
                        size="sm"
                        className="flex-1"
                        disabled={!app.generated_application}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                      <Button
                        onClick={() => deleteApplication(app.id)}
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    {!app.generated_application && (
                      <div className="text-xs text-muted-foreground bg-muted/50 rounded p-2">
                        Kein generierter Inhalt verfügbar
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Document Preview Modal */}
          {selectedApp && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
              <Card className="max-w-4xl max-h-[90vh] w-full">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>{selectedApp.job_title}</CardTitle>
                    <CardDescription>{selectedApp.company_name}</CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      onClick={() => downloadApplication(selectedApp)}
                      size="sm"
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                    <Button
                      onClick={() => setSelectedApp(null)}
                      variant="outline"
                      size="sm"
                    >
                      Schließen
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="overflow-auto max-h-[60vh]">
                  <div className="whitespace-pre-wrap font-mono text-sm bg-muted/50 rounded p-4">
                    {selectedApp.generated_application || 'Kein Inhalt verfügbar'}
                  </div>
                </CardContent>
              </Card>
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