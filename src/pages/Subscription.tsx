import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "../lib/supabase";
import { createPortalSession } from "@/lib/stripe";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, CreditCard, CheckCircle, Calendar, AlertCircle, Star } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const Subscription = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [managingSubscription, setManagingSubscription] = useState(false);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchProfile();
  }, [user, navigate]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user?.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast.error("Fehler beim Laden der Abonnementdaten");
    } finally {
      setLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    if (!profile?.stripe_customer_id) {
      toast.error("Kein Abonnement gefunden");
      return;
    }

    setManagingSubscription(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error("Authentifizierung erforderlich");
        navigate("/auth");
        return;
      }

      const result = await createPortalSession(
        profile.stripe_customer_id,
        session.access_token
      );
      
      if ('error' in result) {
        throw new Error(result.error);
      }
      
      window.location.href = result.url;
    } catch (error) {
      console.error("Error creating portal session:", error);
      toast.error("Fehler beim Öffnen des Abonnement-Portals");
      setManagingSubscription(false);
    }
  };

  const handleUpgrade = () => {
    navigate("/pro-upgrade");
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Check for both "premium" and "pro" plan names
  const isPremium = profile?.plan === "premium" || profile?.plan === "pro";
  const isCanceled = profile?.plan_status === "canceled";

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Abo verwalten</h1>

      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Aktueller Plan</CardTitle>
            <Badge variant={isPremium ? "default" : "secondary"} className="text-lg px-3 py-1">
              {isPremium ? (
                <>
                  <Star className="w-4 h-4 mr-1" />
                  Premium
                </>
              ) : (
                "Kostenlos"
              )}
            </Badge>
          </div>
          <CardDescription>
            Verwalten Sie Ihr Abonnement und Ihre Rechnungsdetails
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isPremium ? (
            <>
              {profile?.stripe_customer_id ? (
                <>
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <CreditCard className="w-4 h-4 mr-2" />
                      <span>Status: </span>
                      <Badge variant={isCanceled ? "destructive" : "default"} className="ml-2">
                        {isCanceled ? "Gekündigt" : "Aktiv"}
                      </Badge>
                    </div>

                    {profile.current_period_end && (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4 mr-2" />
                        <span>
                          {isCanceled ? "Zugriff bis: " : "Nächster Abrechnungstermin: "}
                          {format(new Date(profile.current_period_end), "MMMM dd, yyyy")}
                        </span>
                      </div>
                    )}

                    {isCanceled && (
                      <div className="flex items-center text-sm text-yellow-600 dark:text-yellow-500 mt-2">
                        <AlertCircle className="w-4 h-4 mr-2" />
                        <span>Ihr Abonnement endet am oben genannten Datum</span>
                      </div>
                    )}
                  </div>

                  <Button
                    onClick={handleManageSubscription}
                    disabled={managingSubscription}
                    className="w-full sm:w-auto"
                  >
                    {managingSubscription && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Abo verwalten
                  </Button>
                  <p className="text-sm text-muted-foreground">
                    Zahlungsmethode aktualisieren, Rechnungen herunterladen oder Abonnement kündigen
                  </p>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                      <span>Status: </span>
                      <Badge variant="default" className="ml-2 bg-green-600">
                        Aktiv
                      </Badge>
                    </div>
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mt-4">
                      <p className="text-sm text-blue-900 mb-2">
                        <strong>Manuell aktivierter Premium-Account</strong>
                      </p>
                      <p className="text-sm text-blue-800">
                        Ihr Account wurde manuell auf Premium hochgestuft. Um Änderungen an Ihrem Abonnement vorzunehmen oder bei Fragen, kontaktieren Sie bitte unseren Support.
                      </p>
                    </div>
                  </div>
                </>
              )}
            </>
          ) : (
            <>
              <p className="text-muted-foreground">
                Sie nutzen derzeit den kostenlosen Plan. Upgraden Sie auf Premium, um alle Funktionen freizuschalten.
              </p>
              <Button onClick={handleUpgrade} className="w-full sm:w-auto">
                Auf Premium upgraden
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Plan-Vergleich</CardTitle>
          <CardDescription>Sehen Sie, was in jedem Plan enthalten ist</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg mb-2">Kostenloser Plan</h3>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <CheckCircle className="w-4 h-4 mr-2 mt-0.5 text-muted-foreground" />
                    <span className="text-sm">1 Lebenslauf-Generierung pro Monat</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-4 h-4 mr-2 mt-0.5 text-muted-foreground" />
                    <span className="text-sm">0 Stellenanzeigen-URL-Scans pro Monat</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-4 h-4 mr-2 mt-0.5 text-muted-foreground" />
                    <span className="text-sm">1 manuelle Bewerbung pro Monat</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-4 h-4 mr-2 mt-0.5 text-muted-foreground" />
                    <span className="text-sm">Nur Basis-Vorlagen</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-4 h-4 mr-2 mt-0.5 text-muted-foreground" />
                    <span className="text-sm">Generierte Dokumente anzeigen</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg mb-2 flex items-center">
                  Premium Plan
                  <Star className="w-4 h-4 ml-2 text-primary" />
                </h3>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <CheckCircle className="w-4 h-4 mr-2 mt-0.5 text-primary" />
                    <span className="text-sm font-medium">Unbegrenzte Lebenslauf-Generierungen</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-4 h-4 mr-2 mt-0.5 text-primary" />
                    <span className="text-sm font-medium">Unbegrenzte Stellenanzeigen-URL-Scans</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-4 h-4 mr-2 mt-0.5 text-primary" />
                    <span className="text-sm font-medium">Alle Premium-Vorlagen</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-4 h-4 mr-2 mt-0.5 text-primary" />
                    <span className="text-sm font-medium">PDF- und DOCX-Downloads</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-4 h-4 mr-2 mt-0.5 text-primary" />
                    <span className="text-sm font-medium">Prioritätssupport</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-4 h-4 mr-2 mt-0.5 text-primary" />
                    <span className="text-sm font-medium">Erweiterte KI-Funktionen</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-4 h-4 mr-2 mt-0.5 text-primary" />
                    <span className="text-sm font-medium">Wasserzeichen entfernen</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Subscription;
