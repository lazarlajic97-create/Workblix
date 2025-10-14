import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Json } from '@/integrations/supabase/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from '@/components/ui/alert-dialog';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { 
  User, 
  MapPin, 
  Phone, 
  Mail, 
  Briefcase, 
  GraduationCap, 
  Award,
  Languages,
  Plus,
  Trash2,
  Save,
  ArrowLeft,
  Download,
  FileText,
  Crown,
  Palette,
  Eye,
  CheckCircle,
  Layout,
  Settings,
  CreditCard,
  AlertTriangle,
  Upload
} from 'lucide-react';
import { validateAndRefreshSession } from '@/lib/sessionUtils';
import jsPDF from 'jspdf';
import CVTemplateSelector from '@/components/CVTemplateSelector';

export interface Education {
  id: string;
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string;
  ongoing?: boolean;
  description?: string;
}

export interface Experience {
  id: string;
  company: string;
  position: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string;
}

export interface Skill {
  id: string;
  name: string;
  level: string;
}

export interface Language {
  id: string;
  name: string;
  level: string;
  native?: boolean;
}

export interface Profile {
  email: string;
  first_name: string;
  last_name: string;
  professional_title?: string;
  phone: string;
  address: string;
  city: string;
  postal_code: string;
  country: string;
  linkedin?: string;
  github?: string;
  website?: string;
  summary?: string;
  include_photo_placeholder?: boolean;
  education: Education[];
  experience: Experience[];
  skills: Skill[];
  languages: Language[];
}


interface CVCustomization {
  template: string;
  primaryColor: string;
  font: string;
  includePhoto: boolean;
  layout: 'single' | 'two-column';
}

export default function Profile() {
  console.log('Profile component rendering...');
  const { user, refreshSession, session } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generatingCV, setGeneratingCV] = useState(false);
  const [userPlan, setUserPlan] = useState<string>('free');
  const [isPremium, setIsPremium] = useState(false);
  const [planStatus, setPlanStatus] = useState<string | null>(null);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('budapest');
  const [customization, setCustomization] = useState<CVCustomization>({
    template: 'budapest',
    primaryColor: '#2563eb',
    font: 'helvetica',
    includePhoto: false,
    layout: 'two-column'
  });
  const [showCustomization, setShowCustomization] = useState(false);
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [isUploadingPicture, setIsUploadingPicture] = useState(false);
  const [profile, setProfile] = useState<Profile>({
    email: '',
    first_name: '',
    last_name: '',
    professional_title: '',
    phone: '',
    address: '',
    city: '',
    postal_code: '',
    country: '',
    linkedin: '',
    github: '',
    website: '',
    summary: '',
    education: [],
    experience: [],
    skills: [],
    languages: []
  });

  useEffect(() => {
    console.log('Profile component useEffect - Auth state:', {
      hasUser: !!user,
      hasSession: !!session,
      userId: user?.id,
      userEmail: user?.email
    });
    
    if (!user) {
      console.log('No user found, redirecting to auth...');
      navigate('/auth');
      return;
    }
    
    if (!session) {
      console.log('No session found, but user exists - this might be the issue');
    }
    
    console.log('User found:', user.id, 'fetching profile data...');
    fetchProfile();
    fetchUserPlan();
  }, [user, session, navigate]);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
        return;
      }

      if (data) {
        setProfile({
          email: data.email || '',
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          professional_title: data.professional_title || '',
          phone: data.phone || '',
          address: data.address || '',
          city: data.city || '',
          postal_code: data.postal_code || '',
          country: data.country || '',
          linkedin: '',
          github: '',
          website: '',
          summary: '',
          education: Array.isArray(data.education) ? data.education as unknown as Education[] : [],
          experience: Array.isArray(data.experience) ? data.experience as unknown as Experience[] : [],
          skills: Array.isArray(data.skills) ? data.skills as unknown as Skill[] : [],
          languages: Array.isArray(data.languages) ? data.languages as unknown as Language[] : []
        });
        setProfilePicture(data.profile_picture_url || null);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserPlan = async () => {
    if (!user) return;

    try {
      const { data } = await supabase
        .from('profiles')
        .select('plan, plan_status, stripe_customer_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (data) {
        setUserPlan(data.plan || 'free');
        setPlanStatus(data.plan_status);
        // User is premium if plan is 'pro', regardless of plan_status
        // plan_status can be null for manually activated accounts
        setIsPremium(data.plan === 'pro');
      }
    } catch (error) {
      console.error('Error fetching user plan:', error);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;

    setDeletingAccount(true);
    try {
      // Call the delete account edge function
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('No active session');
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-account`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            userId: user.id,
            confirmDelete: true
          }),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to delete account');
      }

      // Sign out and redirect to homepage
      await supabase.auth.signOut();
      
      toast({
        title: "Konto gelöscht",
        description: "Ihr Konto wurde erfolgreich gelöscht.",
        variant: "default"
      });
      
      navigate('/');
    } catch (error) {
      console.error('Error deleting account:', error);
      toast({
        title: "Fehler beim Löschen",
        description: error instanceof Error ? error.message : "Konto konnte nicht gelöscht werden",
        variant: "destructive"
      });
    } finally {
      setDeletingAccount(false);
    }
  };

  const isProfileComplete = () => {
    const requiredFields = [
      profile.first_name,
      profile.last_name,
      profile.email,
      profile.city
    ];
    
    return requiredFields.every(field => field.trim() !== '') &&
           (profile.education.length > 0 || profile.experience.length > 0);
  };

  // Premium CV templates are now handled by CVTemplateSelector component
  // Budapest is free for all users, only other templates require premium
  const premiumTemplates = [
    'cali', 'chicago', 'riga', 'rotterdam'
  ];

  const colorOptions = [
    { name: 'Professional Blue', value: '#2563eb' },
    { name: 'Corporate Navy', value: '#1e3a8a' },
    { name: 'Creative Teal', value: '#0891b2' },
    { name: 'Elegant Purple', value: '#7c3aed' },
    { name: 'Modern Green', value: '#059669' },
    { name: 'Sophisticated Gray', value: '#374151' }
  ];

  const fontOptions = [
    { name: 'Helvetica (Modern)', value: 'helvetica' },
    { name: 'Times (Classic)', value: 'times' },
    { name: 'Arial (Clean)', value: 'arial' }
  ];

  const generateCVContent = () => {
    // Generate professional summary if missing
    const summary = profile.summary || `Experienced professional with ${profile.experience.length > 0 ? 'proven track record in ' + profile.experience[0]?.position?.toLowerCase() : 'strong background'} seeking new opportunities to contribute expertise and drive results.`;

    return {
      personalInfo: {
        fullName: `${profile.first_name} ${profile.last_name}`,
        professionalTitle: profile.professional_title || (profile.experience[0]?.position ?? ''),
        email: profile.email,
        phone: profile.phone,
        address: [profile.address, `${profile.postal_code} ${profile.city}`, profile.country].filter(Boolean).join(', '),
        linkedin: profile.linkedin,
        github: profile.github,
        website: profile.website
      },
      summary,
      experience: profile.experience.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()),
      education: profile.education.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()),
      skills: profile.skills,
      languages: profile.languages
    };
  };

  // New handlers for template system
  const handleTemplateSelect = (template: any) => {
    setSelectedTemplate(template.id);
  };

  const handleGenerateCV = async (templateId: string) => {
    setGeneratingCV(true);
    try {
      // Check if using premium template
      const premiumTemplates = ['cali', 'chicago', 'riga', 'rotterdam'];
      if (premiumTemplates.includes(templateId) && userPlan !== 'pro') {
        toast({
          title: 'Premium-Vorlage erforderlich',
          description: 'Diese Vorlage ist nur für Pro-Nutzer verfügbar. Bitte upgraden Sie Ihr Konto.',
          variant: 'destructive',
        });
        return;
      }

      // Import React and the PDF generator
      const React = await import('react');
      const { generatePDFFromElement } = await import('@/utils/pdfGenerator');
      
      // Dynamically import the correct template based on templateId
      let TemplateComponent;
      switch (templateId) {
        case 'budapest':
          const { BudapestTemplate } = await import('@/components/cv-templates/BudapestTemplate');
          TemplateComponent = BudapestTemplate;
          break;
        case 'chicago':
          const { ChicagoTemplate } = await import('@/components/cv-templates/ChicagoTemplate');
          TemplateComponent = ChicagoTemplate;
          break;
        case 'riga':
          const { RigaTemplate } = await import('@/components/cv-templates/RigaTemplate');
          TemplateComponent = RigaTemplate;
          break;
        case 'rotterdam':
          const { RotterdamTemplate } = await import('@/components/cv-templates/RotterdamTemplate');
          TemplateComponent = RotterdamTemplate;
          break;
        case 'cali':
          const { CaliTemplate } = await import('@/components/cv-templates/CaliTemplate');
          TemplateComponent = CaliTemplate;
          break;
        default:
          const { BudapestTemplate: DefaultTemplate } = await import('@/components/cv-templates/BudapestTemplate');
          TemplateComponent = DefaultTemplate;
      }
      
      // Create the React element
      const cvElement = React.createElement(TemplateComponent, { profile });
      
      // Create a temporary container for rendering
      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'fixed';
      tempContainer.style.top = '-9999px';
      tempContainer.style.left = '-9999px';
      tempContainer.style.width = '210mm'; // A4 width
      tempContainer.style.height = 'auto';
      tempContainer.style.backgroundColor = 'white';
      tempContainer.style.zIndex = '-1';
      
      document.body.appendChild(tempContainer);

      // Import ReactDOM for rendering
      const { createRoot } = await import('react-dom/client');
      const root = createRoot(tempContainer);
      
      // Render the component
      root.render(cvElement);

      // Wait for rendering and then generate PDF
      setTimeout(async () => {
        try {
          const fileName = `CV_${profile.first_name}_${profile.last_name}_${templateId}.pdf`;
          
          await generatePDFFromElement(tempContainer, {
            filename: fileName,
            format: 'a4',
            orientation: 'portrait',
            quality: 1,
            scale: 2,
            addWatermark: userPlan === 'free',
            userPlan: userPlan
          });
          
          toast({
            title: 'CV erfolgreich generiert!',
            description: `Ihr ${templateId} CV wurde als PDF heruntergeladen.`,
          });
        } catch (pdfError) {
          console.error('PDF generation error:', pdfError);
          toast({
            title: 'Fehler beim PDF-Export',
            description: 'Das PDF konnte nicht erstellt werden. Bitte versuchen Sie es erneut.',
            variant: 'destructive',
          });
        } finally {
          // Clean up
          root.unmount();
          document.body.removeChild(tempContainer);
          setGeneratingCV(false);
        }
      }, 1500); // Give time for fonts and styles to load

    } catch (error) {
      console.error('Error generating CV:', error);
      toast({
        title: 'Fehler beim Generieren',
        description: error instanceof Error ? error.message : 'Unbekannter Fehler',
        variant: 'destructive',
      });
      setGeneratingCV(false);
    }
  };

  const generateModernMinimalPDF = (content: any) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    let yPosition = margin;

    const primaryRGB = hexToRgb(customization.primaryColor);
    const lightGray = [248, 250, 252];
    const darkGray = [51, 65, 85];

    // Check for new page
    const checkNewPage = (space = 20) => {
      if (yPosition + space > pageHeight - margin) {
        doc.addPage();
        yPosition = margin;
        return true;
      }
      return false;
    };

    // Comprehensive Header with name and all contact information
    doc.setFillColor(primaryRGB[0], primaryRGB[1], primaryRGB[2]);
    doc.rect(0, 0, pageWidth, 70, 'F');
    
    // Name (centered)
    doc.setTextColor(255, 255, 255);
    doc.setFont(customization.font, 'bold');
    doc.setFontSize(28);
    const nameWidth = doc.getTextWidth(content.personalInfo.fullName);
    doc.text(content.personalInfo.fullName, (pageWidth - nameWidth) / 2, 30);

    // Contact information (organized and complete)
    doc.setFontSize(11);
    doc.setFont(customization.font, 'normal');
    
    // Address (if available)
    if (content.personalInfo.address) {
      const addressWidth = doc.getTextWidth(content.personalInfo.address);
      doc.text(content.personalInfo.address, (pageWidth - addressWidth) / 2, 45);
    }
    
    // Email and Phone on the same line
    const contactItems = [content.personalInfo.email, content.personalInfo.phone].filter(Boolean);
    if (contactItems.length > 0) {
      const contactText = contactItems.join(' • ');
      const contactWidth = doc.getTextWidth(contactText);
      doc.text(contactText, (pageWidth - contactWidth) / 2, 58);
    }

    yPosition = 90;

    // Section helper
    const addSection = (title: string, callback: () => void) => {
      checkNewPage(25);
      
      doc.setFillColor(primaryRGB[0], primaryRGB[1], primaryRGB[2]);
      doc.rect(margin, yPosition - 2, pageWidth - 2 * margin, 1, 'F');
      
      doc.setTextColor(primaryRGB[0], primaryRGB[1], primaryRGB[2]);
      doc.setFont(customization.font, 'bold');
      doc.setFontSize(16);
      doc.text(title, margin, yPosition + 12);
      
      yPosition += 25;
      callback();
      yPosition += 10;
    };

    // Skip the summary section - removed as requested

    // Experience
    if (content.experience.length > 0) {
      addSection('PROFESSIONAL EXPERIENCE', () => {
        content.experience.forEach((exp: Experience) => {
          checkNewPage(35);
          
          // Background for each entry
          doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
          doc.rect(margin - 5, yPosition - 5, pageWidth - 2 * margin + 10, 30, 'F');
          
          // Position and dates
          doc.setTextColor(primaryRGB[0], primaryRGB[1], primaryRGB[2]);
          doc.setFont(customization.font, 'bold');
          doc.setFontSize(12);
          doc.text(exp.position, margin, yPosition + 8);
          
          const period = `${exp.startDate}${exp.current ? ' - Present' : exp.endDate ? ` - ${exp.endDate}` : ''}`;
          const periodWidth = doc.getTextWidth(period);
          doc.setFont(customization.font, 'normal');
          doc.setFontSize(10);
          doc.text(period, pageWidth - margin - periodWidth, yPosition + 8);
          
          // Company
          doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
          doc.setFont(customization.font, 'italic');
          doc.setFontSize(11);
          doc.text(exp.company, margin, yPosition + 18);
          
          yPosition += 30;
          
          // Description
          if (exp.description) {
            doc.setFont(customization.font, 'normal');
            doc.setFontSize(10);
            const descLines = doc.splitTextToSize(exp.description, pageWidth - 2 * margin - 10);
            descLines.forEach((line: string) => {
              checkNewPage(5);
              doc.text(line, margin + 5, yPosition);
              yPosition += 5;
            });
            yPosition += 5;
          }
        });
      });
    }

    // Education
    if (content.education.length > 0) {
      addSection('EDUCATION', () => {
        content.education.forEach((edu: Education) => {
          checkNewPage(25);
          
          doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
          doc.rect(margin - 5, yPosition - 5, pageWidth - 2 * margin + 10, 20, 'F');
          
          const degree = `${edu.degree}${edu.field ? ` in ${edu.field}` : ''}`;
          doc.setTextColor(primaryRGB[0], primaryRGB[1], primaryRGB[2]);
          doc.setFont(customization.font, 'bold');
          doc.setFontSize(11);
          doc.text(degree, margin, yPosition + 8);
          
          const period = `${edu.startDate} - ${edu.ongoing ? 'laufend' : edu.endDate || 'present'}`;
          const periodWidth = doc.getTextWidth(period);
          doc.setFont(customization.font, 'normal');
          doc.setFontSize(9);
          doc.text(period, pageWidth - margin - periodWidth, yPosition + 8);
          
          doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
          doc.setFont(customization.font, 'italic');
          doc.setFontSize(10);
          doc.text(edu.institution, margin, yPosition + 15);
          
          yPosition += 25;
        });
      });
    }

    // Skills and Languages in two columns
    if (content.skills.length > 0 || content.languages.length > 0) {
      const columnWidth = (pageWidth - 3 * margin) / 2;
      
      if (content.skills.length > 0) {
        checkNewPage(30);
        
        doc.setFillColor(primaryRGB[0], primaryRGB[1], primaryRGB[2]);
        doc.rect(margin, yPosition - 2, columnWidth, 1, 'F');
        
        doc.setTextColor(primaryRGB[0], primaryRGB[1], primaryRGB[2]);
        doc.setFont(customization.font, 'bold');
        doc.setFontSize(14);
        doc.text('SKILLS', margin, yPosition + 12);
        
        let skillY = yPosition + 20;
        content.skills.forEach((skill: Skill) => {
          checkNewPage(8);
          doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
          doc.setFont(customization.font, 'normal');
          doc.setFontSize(10);
          doc.text(`• ${skill.name} (${skill.level})`, margin, skillY);
          skillY += 8;
        });
      }
      
      if (content.languages.length > 0) {
        const langX = margin + columnWidth + margin/2;
        
        doc.setFillColor(primaryRGB[0], primaryRGB[1], primaryRGB[2]);
        doc.rect(langX, yPosition - 2, columnWidth, 1, 'F');
        
        doc.setTextColor(primaryRGB[0], primaryRGB[1], primaryRGB[2]);
        doc.setFont(customization.font, 'bold');
        doc.setFontSize(14);
        doc.text('LANGUAGES', langX, yPosition + 12);
        
        let langY = yPosition + 20;
        content.languages.forEach((lang: Language) => {
          checkNewPage(8);
          doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
          doc.setFont(customization.font, 'normal');
          doc.setFontSize(10);
          doc.text(`• ${lang.name} (${lang.level})`, langX, langY);
          langY += 8;
        });
      }
    }

    return doc;
  };

  const generateCorporateCleanPDF = (content: any) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 25;
    let yPosition = margin;

    const primaryRGB = [30, 58, 138]; // Navy blue
    const lightGray = [243, 244, 246];

    // Helper function
    const checkNewPage = (space = 20) => {
      if (yPosition + space > pageHeight - margin) {
        doc.addPage();
        yPosition = margin;
        return true;
      }
      return false;
    };

    // Comprehensive Traditional Header
    doc.setTextColor(primaryRGB[0], primaryRGB[1], primaryRGB[2]);
    doc.setFont('times', 'bold');
    doc.setFontSize(24);
    doc.text(content.personalInfo.fullName, margin, yPosition + 15);
    
    // Underline
    doc.setLineWidth(0.5);
    doc.line(margin, yPosition + 18, pageWidth - margin, yPosition + 18);
    
    yPosition += 35;
    
    // Complete Contact information in structured format
    doc.setFont('times', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    
    // Address (full address in one line if available)
    if (content.personalInfo.address) {
      doc.text(`Address: ${content.personalInfo.address}`, margin, yPosition);
      yPosition += 8;
    }
    
    // Email and Phone
    if (content.personalInfo.email) {
      doc.text(`Email: ${content.personalInfo.email}`, margin, yPosition);
      yPosition += 8;
    }
    if (content.personalInfo.phone) {
      doc.text(`Phone: ${content.personalInfo.phone}`, margin, yPosition);
      yPosition += 8;
    }
    
    yPosition += 20;

    // Section headers with traditional styling
    const addCorporateSection = (title: string, callback: () => void) => {
      checkNewPage(25);
      
      doc.setTextColor(primaryRGB[0], primaryRGB[1], primaryRGB[2]);
      doc.setFont('times', 'bold');
      doc.setFontSize(14);
      doc.text(title, margin, yPosition);
      
      // Double underline for corporate look
      doc.setLineWidth(0.3);
      doc.line(margin, yPosition + 2, margin + doc.getTextWidth(title), yPosition + 2);
      doc.line(margin, yPosition + 4, margin + doc.getTextWidth(title), yPosition + 4);
      
      yPosition += 15;
      callback();
      yPosition += 10;
    };

    // Skip the summary section - removed as requested

    // Experience with formal structure
    if (content.experience.length > 0) {
      addCorporateSection('PROFESSIONAL EXPERIENCE', () => {
        content.experience.forEach((exp: Experience) => {
          checkNewPage(30);
          
          // Company and position in bold
          doc.setFont('times', 'bold');
          doc.setFontSize(12);
          doc.text(`${exp.position} - ${exp.company}`, margin, yPosition);
          
          // Dates aligned right
          const period = `${exp.startDate}${exp.current ? ' - Present' : exp.endDate ? ` - ${exp.endDate}` : ''}`;
          const periodWidth = doc.getTextWidth(period);
          doc.setFont('times', 'normal');
          doc.setFontSize(10);
          doc.text(period, pageWidth - margin - periodWidth, yPosition);
          
          yPosition += 12;
          
          // Description with bullet points
          if (exp.description) {
            doc.setFont('times', 'normal');
            doc.setFontSize(10);
            const descLines = doc.splitTextToSize(exp.description, pageWidth - 2 * margin - 10);
            descLines.forEach((line: string) => {
              checkNewPage(5);
              doc.text(`• ${line}`, margin + 5, yPosition);
              yPosition += 5;
            });
          }
          yPosition += 8;
        });
      });
    }

    // Education
    if (content.education.length > 0) {
      addCorporateSection('EDUCATION', () => {
        content.education.forEach((edu: Education) => {
          checkNewPage(20);
          
          const degree = `${edu.degree}${edu.field ? ` in ${edu.field}` : ''}`;
          doc.setFont('times', 'bold');
          doc.setFontSize(11);
          doc.text(degree, margin, yPosition);
          
          const period = `${edu.startDate} - ${edu.ongoing ? 'laufend' : edu.endDate || 'present'}`;
          const periodWidth = doc.getTextWidth(period);
          doc.setFont('times', 'normal');
          doc.setFontSize(10);
          doc.text(period, pageWidth - margin - periodWidth, yPosition);
          
          doc.setFont('times', 'italic');
          doc.setFontSize(10);
          doc.text(edu.institution, margin, yPosition + 8);
          
          yPosition += 18;
        });
      });
    }

    // Skills
    if (content.skills.length > 0) {
      addCorporateSection('CORE COMPETENCIES', () => {
        const skillsText = content.skills.map((skill: Skill) => skill.name).join(' • ');
        doc.setFont('times', 'normal');
        doc.setFontSize(10);
        const skillLines = doc.splitTextToSize(skillsText, pageWidth - 2 * margin);
        skillLines.forEach((line: string) => {
          checkNewPage(6);
          doc.text(line, margin, yPosition);
          yPosition += 6;
        });
      });
    }

    return doc;
  };

  const generateCreativeSidebarPDF = (content: any) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const sidebarWidth = 65;
    const mainContentX = sidebarWidth + 10;
    const mainContentWidth = pageWidth - mainContentX - 10;
    let yPosition = 20;

    const primaryRGB = hexToRgb(customization.primaryColor);
    const sidebarRGB = [51, 65, 85]; // Dark gray

    // Sidebar background
    doc.setFillColor(sidebarRGB[0], sidebarRGB[1], sidebarRGB[2]);
    doc.rect(0, 0, sidebarWidth, pageHeight, 'F');

    // Comprehensive Profile section in sidebar
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    
    const firstName = content.personalInfo.fullName.split(' ')[0];
    const lastName = content.personalInfo.fullName.split(' ').slice(1).join(' ');
    
    doc.text(firstName, 5, 25);
    doc.text(lastName, 5, 35);

    // Complete Contact information in sidebar
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    let sidebarY = 50;
    
    // Address
    if (content.personalInfo.address) {
      doc.text('ADDRESS', 5, sidebarY);
      sidebarY += 6;
      const addressLines = doc.splitTextToSize(content.personalInfo.address, sidebarWidth - 10);
      addressLines.forEach((line: string) => {
        doc.text(line, 5, sidebarY);
        sidebarY += 6;
      });
      sidebarY += 10;
    }
    
    // Email
    if (content.personalInfo.email) {
      doc.text('EMAIL', 5, sidebarY);
      sidebarY += 6;
      const emailLines = doc.splitTextToSize(content.personalInfo.email, sidebarWidth - 10);
      emailLines.forEach((line: string) => {
        doc.text(line, 5, sidebarY);
        sidebarY += 6;
      });
      sidebarY += 10;
    }
    
    // Phone
    if (content.personalInfo.phone) {
      doc.text('PHONE', 5, sidebarY);
      sidebarY += 6;
      doc.text(content.personalInfo.phone, 5, sidebarY);
      sidebarY += 12;
    }

    // Skills in sidebar with visual bars
    if (content.skills.length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.text('SKILLS', 5, sidebarY);
      sidebarY += 10;
      doc.setFont('helvetica', 'normal');
      content.skills.slice(0, 8).forEach((skill: Skill) => {
        doc.text(skill.name, 5, sidebarY);
        
        // Skill level bar
        const skillLevel = skill.level === 'Experte' ? 0.9 : skill.level === 'Fortgeschritten' ? 0.7 : 0.4;
        doc.setFillColor(primaryRGB[0], primaryRGB[1], primaryRGB[2]);
        doc.rect(5, sidebarY + 2, (sidebarWidth - 15) * skillLevel, 2, 'F');
        doc.setFillColor(200, 200, 200);
        doc.rect(5 + (sidebarWidth - 15) * skillLevel, sidebarY + 2, (sidebarWidth - 15) * (1 - skillLevel), 2, 'F');
        
        sidebarY += 12;
      });
    }

    // Main content area with creative header
    doc.setTextColor(0, 0, 0);
    
    // Large name with creative styling
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(28);
    doc.text(content.personalInfo.fullName, mainContentX, 35);
    
    // Colored accent line
    doc.setFillColor(primaryRGB[0], primaryRGB[1], primaryRGB[2]);
    doc.rect(mainContentX, 40, mainContentWidth * 0.3, 3, 'F');
    
    // Skip the summary section - removed as requested
    yPosition = 55;

    // Experience with creative layout
    if (content.experience.length > 0) {
      // Creative section header
      doc.setFillColor(primaryRGB[0], primaryRGB[1], primaryRGB[2]);
      doc.rect(mainContentX, yPosition - 3, 5, 15, 'F');
      
      doc.setTextColor(primaryRGB[0], primaryRGB[1], primaryRGB[2]);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text('EXPERIENCE', mainContentX + 10, yPosition + 8);
      yPosition += 25;
      
      content.experience.forEach((exp: Experience) => {
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.text(exp.position, mainContentX, yPosition);
        
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(11);
        doc.setTextColor(primaryRGB[0], primaryRGB[1], primaryRGB[2]);
        doc.text(exp.company, mainContentX, yPosition + 8);
        
        const period = `${exp.startDate}${exp.current ? ' - Present' : exp.endDate ? ` - ${exp.endDate}` : ''}`;
        const periodWidth = doc.getTextWidth(period);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text(period, pageWidth - 10 - periodWidth, yPosition);
        
        yPosition += 18;
        
        if (exp.description) {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(10);
          doc.setTextColor(0, 0, 0);
          const descLines = doc.splitTextToSize(exp.description, mainContentWidth - 5);
          descLines.forEach((line: string) => {
            doc.text(line, mainContentX + 5, yPosition);
            yPosition += 5;
          });
        }
        yPosition += 12;
      });
    }

    return doc;
  };

  const generateElegantClassicPDF = (content: any) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 30;
    let yPosition = margin;

    const elegantGold = [184, 134, 11]; // Gold accent
    const darkBlue = [30, 41, 59];

    const checkNewPage = (space = 20) => {
      if (yPosition + space > pageHeight - margin) {
        doc.addPage();
        yPosition = margin;
        return true;
      }
      return false;
    };

    // Elegant header with decorative elements and comprehensive contact info
    doc.setTextColor(darkBlue[0], darkBlue[1], darkBlue[2]);
    doc.setFont('times', 'bold');
    doc.setFontSize(26);
    
    // Center the name
    const nameWidth = doc.getTextWidth(content.personalInfo.fullName);
    const nameX = (pageWidth - nameWidth) / 2;
    doc.text(content.personalInfo.fullName, nameX, yPosition + 20);
    
    // Decorative lines around name
    doc.setFillColor(elegantGold[0], elegantGold[1], elegantGold[2]);
    doc.rect(nameX - 20, yPosition + 25, nameWidth + 40, 0.8, 'F');
    doc.rect(nameX - 10, yPosition + 28, nameWidth + 20, 0.5, 'F');
    
    yPosition += 50;
    
    // Comprehensive centered contact information
    doc.setFont('times', 'italic');
    doc.setFontSize(11);
    doc.setTextColor(darkBlue[0], darkBlue[1], darkBlue[2]);
    
    // Address (full address)
    if (content.personalInfo.address) {
      const addressWidth = doc.getTextWidth(content.personalInfo.address);
      doc.text(content.personalInfo.address, (pageWidth - addressWidth) / 2, yPosition);
      yPosition += 8;
    }
    
    // Email and Phone in elegant format
    if (content.personalInfo.email) {
      const emailWidth = doc.getTextWidth(content.personalInfo.email);
      doc.text(content.personalInfo.email, (pageWidth - emailWidth) / 2, yPosition);
      yPosition += 8;
    }
    
    if (content.personalInfo.phone) {
      const phoneWidth = doc.getTextWidth(content.personalInfo.phone);
      doc.text(content.personalInfo.phone, (pageWidth - phoneWidth) / 2, yPosition);
      yPosition += 8;
    }
    
    yPosition += 20;

    // Elegant section headers
    const addElegantSection = (title: string, callback: () => void) => {
      checkNewPage(30);
      
      // Centered section title with decorative elements
      const titleWidth = doc.getTextWidth(title);
      const titleX = (pageWidth - titleWidth) / 2;
      
      doc.setTextColor(darkBlue[0], darkBlue[1], darkBlue[2]);
      doc.setFont('times', 'bold');
      doc.setFontSize(14);
      doc.text(title, titleX, yPosition);
      
      // Decorative underline
      doc.setFillColor(elegantGold[0], elegantGold[1], elegantGold[2]);
      doc.rect(titleX - 10, yPosition + 3, titleWidth + 20, 0.8, 'F');
      
      yPosition += 20;
      callback();
      yPosition += 15;
    };

    // Skip the summary section - removed as requested

    // Experience with elegant formatting
    if (content.experience.length > 0) {
      addElegantSection('PROFESSIONAL EXPERIENCE', () => {
        content.experience.forEach((exp: Experience) => {
          checkNewPage(35);
          
          // Position in elegant script-like styling
          doc.setFont('times', 'bold');
          doc.setFontSize(12);
          doc.setTextColor(darkBlue[0], darkBlue[1], darkBlue[2]);
          doc.text(exp.position, margin + 10, yPosition);
          
          // Company in italics with gold accent
          doc.setFont('times', 'italic');
          doc.setFontSize(11);
          doc.setTextColor(elegantGold[0], elegantGold[1], elegantGold[2]);
          doc.text(`at ${exp.company}`, margin + 10, yPosition + 8);
          
          // Period elegantly aligned
          const period = `${exp.startDate}${exp.current ? ' - Present' : exp.endDate ? ` - ${exp.endDate}` : ''}`;
          const periodWidth = doc.getTextWidth(period);
          doc.setFont('times', 'normal');
          doc.setFontSize(10);
          doc.setTextColor(100, 100, 100);
          doc.text(period, pageWidth - margin - 10 - periodWidth, yPosition + 4);
          
          yPosition += 20;
          
          // Description with elegant formatting
          if (exp.description) {
            doc.setFont('times', 'normal');
            doc.setFontSize(10);
            doc.setTextColor(0, 0, 0);
            const descLines = doc.splitTextToSize(exp.description, pageWidth - 2 * margin - 30);
            descLines.forEach((line: string) => {
              checkNewPage(6);
              doc.text(`${line}`, margin + 20, yPosition);
              yPosition += 6;
            });
          }
          yPosition += 12;
        });
      });
    }

    // Education with classical styling
    if (content.education.length > 0) {
      addElegantSection('EDUCATION', () => {
        content.education.forEach((edu: Education) => {
          checkNewPage(25);
          
          const degree = `${edu.degree}${edu.field ? ` in ${edu.field}` : ''}`;
          doc.setFont('times', 'bold');
          doc.setFontSize(11);
          doc.setTextColor(darkBlue[0], darkBlue[1], darkBlue[2]);
          doc.text(degree, margin + 10, yPosition);
          
          doc.setFont('times', 'italic');
          doc.setFontSize(10);
          doc.setTextColor(elegantGold[0], elegantGold[1], elegantGold[2]);
          doc.text(edu.institution, margin + 10, yPosition + 8);
          
          const period = `${edu.startDate} - ${edu.ongoing ? 'laufend' : edu.endDate || 'present'}`;
          const periodWidth = doc.getTextWidth(period);
          doc.setFont('times', 'normal');
          doc.setFontSize(9);
          doc.setTextColor(100, 100, 100);
          doc.text(period, pageWidth - margin - 10 - periodWidth, yPosition + 4);
          
          yPosition += 22;
        });
      });
    }

    return doc;
  };

  const generateTechModernPDF = (content: any) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    let yPosition = margin;

    const techBlue = [14, 165, 233]; // Bright tech blue
    const darkGray = [15, 23, 42];
    const lightBg = [248, 250, 252];

    const checkNewPage = (space = 20) => {
      if (yPosition + space > pageHeight - margin) {
        doc.addPage();
        yPosition = margin;
        return true;
      }
      return false;
    };

    // Modern tech header with comprehensive contact information
    doc.setFillColor(darkGray[0], darkGray[1], darkGray[2]);
    doc.rect(0, 0, pageWidth, 55, 'F');
    
    // Geometric accent
    doc.setFillColor(techBlue[0], techBlue[1], techBlue[2]);
    doc.rect(0, 0, 5, 55, 'F');
    doc.rect(pageWidth - 5, 0, 5, 55, 'F');
    
    // Name in modern sans-serif style
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text(content.personalInfo.fullName, margin + 10, 25);
    
    // Comprehensive contact info in header
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    let contactY = 35;
    
    // Address on first line
    if (content.personalInfo.address) {
      doc.text(content.personalInfo.address, margin + 10, contactY);
      contactY += 10;
    }
    
    // Email and Phone on second line
    const contactItems = [content.personalInfo.email, content.personalInfo.phone].filter(Boolean);
    if (contactItems.length > 0) {
      const contactText = contactItems.join(' | ');
      doc.text(contactText, margin + 10, contactY);
    }
    
    yPosition = 70;

    // Modern section headers with tech styling
    const addTechSection = (title: string, callback: () => void) => {
      checkNewPage(25);
      
      // Section with accent border
      doc.setFillColor(techBlue[0], techBlue[1], techBlue[2]);
      doc.rect(margin, yPosition - 5, 3, 15, 'F');
      
      doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text(title, margin + 8, yPosition + 5);
      
      // Subtle line
      doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
      doc.rect(margin, yPosition + 8, pageWidth - 2 * margin, 0.5, 'F');
      
      yPosition += 18;
      callback();
      yPosition += 10;
    };

    // Skip the summary section - removed as requested

    // Technical Skills with progress bars
    if (content.skills.length > 0) {
      addTechSection('TECHNICAL SKILLS', () => {
        content.skills.forEach((skill: Skill) => {
          checkNewPage(12);
          
          // Skill name
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(10);
          doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
          doc.text(skill.name, margin + 5, yPosition);
          
          // Modern progress bar
          const skillLevel = skill.level === 'Experte' ? 0.95 : skill.level === 'Fortgeschritten' ? 0.75 : 0.5;
          const barWidth = 60;
          
          // Background bar
          doc.setFillColor(230, 230, 230);
          doc.rect(margin + 80, yPosition - 3, barWidth, 4, 'F');
          
          // Progress bar
          doc.setFillColor(techBlue[0], techBlue[1], techBlue[2]);
          doc.rect(margin + 80, yPosition - 3, barWidth * skillLevel, 4, 'F');
          
          // Percentage
          doc.setFontSize(8);
          doc.setTextColor(100, 100, 100);
          doc.text(`${Math.round(skillLevel * 100)}%`, margin + 145, yPosition);
          
          yPosition += 12;
        });
      });
    }

    // Experience with modern cards
    if (content.experience.length > 0) {
      addTechSection('EXPERIENCE', () => {
        content.experience.forEach((exp: Experience) => {
          checkNewPage(40);
          
          // Card background
          doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
          doc.rect(margin, yPosition - 5, pageWidth - 2 * margin, 35, 'F');
          
          // Position and company
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(12);
          doc.setTextColor(techBlue[0], techBlue[1], techBlue[2]);
          doc.text(exp.position, margin + 5, yPosition + 5);
          
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(10);
          doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
          doc.text(exp.company, margin + 5, yPosition + 12);
          
          // Period with modern styling
          const period = `${exp.startDate}${exp.current ? ' - Present' : exp.endDate ? ` - ${exp.endDate}` : ''}`;
          const periodWidth = doc.getTextWidth(period);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(9);
          doc.setTextColor(techBlue[0], techBlue[1], techBlue[2]);
          doc.text(period, pageWidth - margin - 5 - periodWidth, yPosition + 5);
          
          yPosition += 20;
          
          // Description
          if (exp.description) {
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
            const descLines = doc.splitTextToSize(exp.description, pageWidth - 2 * margin - 15);
            descLines.forEach((line: string) => {
              checkNewPage(5);
              doc.text(line, margin + 8, yPosition);
              yPosition += 5;
            });
          }
          yPosition += 15;
        });
      });
    }

    return doc;
  };

  // Helper function to convert hex to RGB
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
      parseInt(result[1], 16),
      parseInt(result[2], 16),
      parseInt(result[3], 16)
    ] : [37, 99, 235]; // fallback blue
  };

  const generateCV = async () => {
    setGeneratingCV(true);
    try {
      const content = generateCVContent();
      let doc: jsPDF;

      // Check if using premium template
      if (premiumTemplates.includes(selectedTemplate)) {
        if (userPlan !== 'pro') {
          toast({
            title: 'Premium-Vorlage erforderlich',
            description: 'Diese Vorlage ist nur für Pro-Nutzer verfügbar. Bitte upgraden Sie Ihr Konto.',
            variant: 'destructive',
          });
          return;
        }
      }

      // Legacy template support or fallback
      switch (selectedTemplate) {
        case 'creative-sidebar':
          doc = generateCreativeSidebarPDF(content);
          break;
        case 'corporate-clean':
          doc = generateCorporateCleanPDF(content);
          break;
        case 'elegant-classic':
          doc = generateElegantClassicPDF(content);
          break;
        case 'tech-modern':
          doc = generateTechModernPDF(content);
          break;
        case 'modern-minimal':
        default:
          doc = generateModernMinimalPDF(content);
          break;
      }

      return doc;
    } catch (error) {
      console.error('Error generating CV:', error);
      toast({
        title: 'Fehler bei der CV-Erstellung',
        description: 'Dein Lebenslauf konnte nicht erstellt werden.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setGeneratingCV(false);
    }
  };

  const downloadAsPDF = async () => {
    try {
      const doc = await generateCV();
      if (!doc) return;

      const fileName = `${profile.first_name}_${profile.last_name}_CV.pdf`;
      doc.save(fileName);

      toast({
        title: 'Download erfolgreich',
        description: 'Dein professioneller Lebenslauf wurde als PDF heruntergeladen.',
      });
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast({
        title: 'Download-Fehler',
        description: 'Der Download konnte nicht gestartet werden.',
        variant: 'destructive',
      });
    }
  };

  const previewCV = async () => {
    try {
      const doc = await generateCV();
      if (!doc) return;

      const pdfBlob = doc.output('blob');
      const url = URL.createObjectURL(pdfBlob);
      window.open(url, '_blank');
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error previewing CV:', error);
      toast({
        title: 'Vorschau-Fehler',
        description: 'Die Vorschau konnte nicht geöffnet werden.',
        variant: 'destructive',
      });
    }
  };

  const downloadAsTXT = async () => {
    try {
      const content = generateCVContent();
      
      // Create simple text version
      const txtContent = `
${content.personalInfo.fullName}
${content.personalInfo.address}
Email: ${content.personalInfo.email}
Phone: ${content.personalInfo.phone}

PROFESSIONAL SUMMARY
${content.summary}

EXPERIENCE
${content.experience.map((exp: Experience) => `
${exp.startDate}${exp.current ? ' - Present' : exp.endDate ? ` - ${exp.endDate}` : ''}: ${exp.position}
${exp.company}
${exp.description}
`).join('')}

EDUCATION
${content.education.map((edu: Education) => `
${edu.startDate} - ${edu.ongoing ? 'laufend' : edu.endDate || 'present'}: ${edu.degree}${edu.field ? ` in ${edu.field}` : ''}
${edu.institution}
`).join('')}

SKILLS
${content.skills.map((skill: Skill) => `• ${skill.name} (${skill.level})`).join('\n')}

LANGUAGES
${content.languages.map((lang: Language) => `• ${lang.name} (${lang.level})`).join('\n')}
      `.trim();

      const blob = new Blob([txtContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${profile.first_name}_${profile.last_name}_CV.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: 'Download erfolgreich',
        description: 'Dein CV wurde als TXT-Datei heruntergeladen.',
      });
    } catch (error) {
      console.error('Error downloading TXT:', error);
      toast({
        title: 'Download-Fehler',
        description: 'Der Download konnte nicht gestartet werden.',
        variant: 'destructive',
      });
    }
  };

  const handleProfilePictureUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    console.log('File selected:', file.name, file.size, file.type);

    // Validate file
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Ungültiger Dateityp",
        description: "Bitte laden Sie nur Bilddateien hoch (JPG, PNG, etc.)",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast({
        title: "Datei zu groß",
        description: "Bitte laden Sie ein Bild unter 5MB hoch",
        variant: "destructive",
      });
      return;
    }

    setIsUploadingPicture(true);

    try {
      // Simplest possible upload
      const timestamp = Date.now();
      const fileExt = file.name.split('.').pop();
      const fileName = `avatar_${timestamp}.${fileExt}`; // Unique filename each time
      const filePath = `${user.id}/${fileName}`;

      console.log('Starting upload:', filePath);

      // Bare minimum upload - no options
      const { data, error: uploadError } = await supabase.storage
        .from('profile-pictures')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Upload error details:', uploadError);
        throw uploadError;
      }

      console.log('Upload successful:', data);

      // Get public URL with cache busting
      const { data: { publicUrl } } = supabase.storage
        .from('profile-pictures')
        .getPublicUrl(filePath);
      
      const publicUrlWithCache = `${publicUrl}?t=${timestamp}`;

      // Update profile with picture URL (without cache param)
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ profile_picture_url: publicUrl })
        .eq('user_id', user.id);

      if (updateError) {
        console.error('Profile update error:', updateError);
        throw updateError;
      }

      setProfilePicture(publicUrlWithCache);

      toast({
        title: "Profilbild aktualisiert",
        description: "Ihr Profilbild wurde erfolgreich hochgeladen.",
      });
      
      // Reset file input
      event.target.value = '';
    } catch (error: any) {
      console.error('Error uploading profile picture:', error);
      
      let errorMessage = "Beim Hochladen ist ein Fehler aufgetreten";
      
      if (error.message) {
        if (error.message.includes('storage')) {
          errorMessage = "Storage-Fehler: Der Speicher-Bucket 'profile-pictures' existiert nicht oder ist nicht konfiguriert. Bitte kontaktieren Sie den Support.";
        } else if (error.message.includes('permission') || error.message.includes('policy')) {
          errorMessage = "Berechtigung verweigert: Sie haben keine Berechtigung, Bilder hochzuladen. Bitte kontaktieren Sie den Support.";
        } else if (error.message.includes('size') || error.message.includes('large')) {
          errorMessage = "Datei zu gro\u00df: Bitte verwenden Sie ein Bild unter 5MB.";
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage = "Netzwerkfehler: Bitte überprüfen Sie Ihre Internetverbindung und versuchen Sie es erneut.";
        } else if (error.message.includes('bucket')) {
          errorMessage = "Bucket-Fehler: Der Speicher-Bucket konnte nicht erreicht werden. M\u00f6glicherweise ist er nicht \u00f6ffentlich zug\u00e4nglich.";
        } else {
          errorMessage = `Fehler: ${error.message}`;
        }
      }
      
      toast({
        title: "Upload fehlgeschlagen",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsUploadingPicture(false);
    }
  };

  const deleteProfilePicture = async () => {
    if (!user || !profilePicture) return;

    try {
      // Delete from storage
      const path = profilePicture.split('/').slice(-2).join('/');
      await supabase.storage
        .from('profile-pictures')
        .remove([path]);

      // Update profile
      await supabase
        .from('profiles')
        .update({ profile_picture_url: null })
        .eq('user_id', user.id);

      setProfilePicture(null);

      toast({
        title: "Profilbild gelöscht",
        description: "Ihr Profilbild wurde entfernt.",
      });
    } catch (error: any) {
      console.error('Error deleting profile picture:', error);
      toast({
        title: "Löschen fehlgeschlagen",
        description: "Beim Löschen ist ein Fehler aufgetreten",
        variant: "destructive",
      });
    }
  };

  const saveProfile = async () => {
    if (!user) {
      toast({
        title: 'Fehler',
        description: 'Kein Benutzer gefunden. Bitte melden Sie sich erneut an.',
        variant: 'destructive',
      });
      navigate('/auth');
      return;
    }

    setSaving(true);
    try {
      console.log('SAVE PROFILE: Starting save for user:', user.id);
      
      // Prepare profile data - handle empty arrays properly and convert to Json type
      const profileData = {
        user_id: user.id,
        email: profile.email || user.email || '',
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        professional_title: profile.professional_title || '',
        phone: profile.phone || '',
        address: profile.address || '',
        city: profile.city || '',
        postal_code: profile.postal_code || '',
        country: profile.country || '',
        // Convert arrays to JSONB - ensure they're not empty and convert to Json type
        education: profile.education && profile.education.length > 0 ? JSON.parse(JSON.stringify(profile.education)) : [],
        experience: profile.experience && profile.experience.length > 0 ? JSON.parse(JSON.stringify(profile.experience)) : [],
        skills: profile.skills && profile.skills.length > 0 ? JSON.parse(JSON.stringify(profile.skills)) : [],
        languages: profile.languages && profile.languages.length > 0 ? JSON.parse(JSON.stringify(profile.languages)) : []
      };

      console.log('SAVE PROFILE: Profile data to save:', profileData);

      // Try direct upsert without session checking
      const { data, error } = await supabase
        .from('profiles')
        .upsert(profileData as any, { 
          onConflict: 'user_id'
        })
        .select();

      if (error) {
        console.error('SAVE PROFILE: Database error:', error);
        console.error('SAVE PROFILE: Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw new Error(`Database Error: ${error.message}`);
      }

      console.log('SAVE PROFILE: Success! Saved data:', data);
      
      toast({
        title: 'Profil gespeichert',
        description: 'Deine Profildaten wurden erfolgreich aktualisiert.',
      });

    } catch (error) {
      console.error('SAVE PROFILE: Full error:', error);
      
      let errorMessage = 'Dein Profil konnte nicht gespeichert werden.';
      
      if (error instanceof Error) {
        console.error('SAVE PROFILE: Error message:', error.message);
        
        // Check for specific errors
        if (error.message.includes('JWT') || error.message.includes('session') || error.message.includes('auth')) {
          errorMessage = 'Sitzungsfehler. Bitte melden Sie sich erneut an.';
          setTimeout(() => navigate('/auth'), 2000);
        } else if (error.message.includes('RLS') || error.message.includes('policy') || error.message.includes('permission')) {
          errorMessage = 'Keine Berechtigung. Überprüfen Sie die Datenbankeinstellungen.';
        } else if (error.message.includes('duplicate') || error.message.includes('conflict')) {
          errorMessage = 'Datenkonflikt. Bitte laden Sie die Seite neu.';
        } else {
          errorMessage = `Fehler: ${error.message}`;
        }
      }

      toast({
        title: 'Fehler beim Speichern',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  // Simple test save function without session validation
  const testSave = async () => {
    if (!user) {
      toast({
        title: 'Fehler',
        description: 'Kein Benutzer gefunden',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      console.log('TEST SAVE: Starting simple save without session validation...');
      console.log('TEST SAVE: User ID:', user.id);
      
      // Simple profile data - just the basics
      const simpleProfileData = {
        user_id: user.id,
        first_name: profile.first_name || 'Test',
        last_name: profile.last_name || 'User',
        email: profile.email || user.email || 'test@example.com'
      };

      console.log('TEST SAVE: Attempting to save:', simpleProfileData);

      const { error } = await supabase
        .from('profiles')
        .upsert(simpleProfileData, { onConflict: 'user_id' });

      if (error) {
        console.error('TEST SAVE: Error:', error);
        throw error;
      }

      console.log('TEST SAVE: Success!');
      toast({
        title: 'Test erfolgreich',
        description: 'Basis-Profildaten wurden gespeichert.',
      });
    } catch (error) {
      console.error('TEST SAVE: Failed:', error);
      toast({
        title: 'Test fehlgeschlagen',
        description: error instanceof Error ? error.message : 'Unbekannter Fehler',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  // Debug function to check database and user state
  const debugCheck = async () => {
    console.log('=== DEBUG CHECK START ===');
    
    // Check user state
    console.log('User from useAuth:', {
      id: user?.id,
      email: user?.email,
      created_at: user?.created_at
    });
    
    console.log('Session from useAuth:', {
      hasSession: !!session,
      expires_at: session?.expires_at
    });
    
    // Check current session from Supabase directly
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      console.log('Direct session check:', {
        hasSession: !!sessionData.session,
        error: sessionError,
        userId: sessionData.session?.user?.id
      });
    } catch (error) {
      console.error('Session check failed:', error);
    }
    
    // Check if we can read from profiles table
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('count')
        .limit(1);
        
      console.log('Profiles table read test:', { data, error });
    } catch (error) {
      console.error('Profiles read test failed:', error);
    }
    
    // Check if we can write to profiles table (simple test)
    if (user) {
      try {
        const testData = {
          user_id: user.id,
          first_name: 'Debug Test',
          updated_at: new Date().toISOString()
        };
        
        const { data, error } = await supabase
          .from('profiles')
          .upsert(testData, { onConflict: 'user_id' })
          .select();
          
        console.log('Profiles table write test:', { data, error });
        
        if (!error) {
          toast({
            title: 'Debug erfolgreich',
            description: 'Datenbankverbindung funktioniert!',
          });
        } else {
          toast({
            title: 'Debug Fehler',
            description: `DB Fehler: ${error.message}`,
            variant: 'destructive',
          });
        }
      } catch (error) {
        console.error('Profiles write test failed:', error);
        toast({
          title: 'Debug Fehler',
          description: 'Schreibtest fehlgeschlagen - siehe Konsole',
          variant: 'destructive',
        });
      }
    }
    
    console.log('=== DEBUG CHECK END ===');
  };

  const addEducation = () => {
    const newEducation: Education = {
      id: Date.now().toString(),
      institution: '',
      degree: '',
      field: '',
      startDate: '',
      endDate: '',
      ongoing: false,
      description: ''
    };
    setProfile(prev => ({
      ...prev,
      education: [...prev.education, newEducation]
    }));
  };

  const removeEducation = (id: string) => {
    setProfile(prev => ({
      ...prev,
      education: prev.education.filter(edu => edu.id !== id)
    }));
  };

  const updateEducation = (id: string, field: keyof Education, value: string | boolean) => {
    setProfile(prev => ({
      ...prev,
      education: prev.education.map(edu =>
        edu.id === id ? { ...edu, [field]: value } : edu
      )
    }));
  };

  const addExperience = () => {
    const newExperience: Experience = {
      id: Date.now().toString(),
      company: '',
      position: '',
      startDate: '',
      endDate: '',
      current: false,
      description: ''
    };
    setProfile(prev => ({
      ...prev,
      experience: [...prev.experience, newExperience]
    }));
  };

  const removeExperience = (id: string) => {
    setProfile(prev => ({
      ...prev,
      experience: prev.experience.filter(exp => exp.id !== id)
    }));
  };

  const updateExperience = (id: string, field: keyof Experience, value: string | boolean) => {
    setProfile(prev => ({
      ...prev,
      experience: prev.experience.map(exp =>
        exp.id === id ? { ...exp, [field]: value } : exp
      )
    }));
  };

  const addSkill = () => {
    const newSkill: Skill = {
      id: Date.now().toString(),
      name: '',
      level: 'Anfänger'
    };
    setProfile(prev => ({
      ...prev,
      skills: [...prev.skills, newSkill]
    }));
  };

  const removeSkill = (id: string) => {
    setProfile(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill.id !== id)
    }));
  };

  const updateSkill = (id: string, field: keyof Skill, value: string) => {
    setProfile(prev => ({
      ...prev,
      skills: prev.skills.map(skill =>
        skill.id === id ? { ...skill, [field]: value } : skill
      )
    }));
  };

  const addLanguage = () => {
    const newLanguage: Language = {
      id: Date.now().toString(),
      name: '',
      level: 'A1',
      native: false
    };
    setProfile(prev => ({
      ...prev,
      languages: [...prev.languages, newLanguage]
    }));
  };

  const removeLanguage = (id: string) => {
    setProfile(prev => ({
      ...prev,
      languages: prev.languages.filter(lang => lang.id !== id)
    }));
  };

  const updateLanguage = (id: string, field: keyof Language, value: string) => {
    setProfile(prev => ({
      ...prev,
      languages: prev.languages.map(lang =>
        lang.id === id ? { ...lang, [field]: value } : lang
      )
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-primary/5 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Profil wird geladen...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-primary/5">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
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
            <div className="flex gap-2">
              <Button onClick={saveProfile} disabled={saving} className="flex items-center space-x-2">
                <Save className="h-4 w-4" />
                <span className="hidden sm:inline">{saving ? 'Speichern...' : 'Profil speichern'}</span>
                <span className="sm:hidden">{saving ? 'Speichern...' : 'Speichern'}</span>
              </Button>
            </div>
          </div>

          <div className="space-y-8">
            {/* Account Management */}
            <Card className="shadow-medium border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center space-x-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <CreditCard className="h-6 w-6 text-primary" />
                  </div>
                  <span>Kontoeinstellungen</span>
                </CardTitle>
                <CardDescription>
                  Verwalte dein Abonnement und deine Kontoeinstellungen
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Subscription Status */}
                <div className="p-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold">Abonnement-Status</h3>
                      <div className="flex items-center gap-2 mt-1">
                        {isPremium ? (
                          <>
                            <Badge className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white">
                              <Crown className="h-3 w-3 mr-1" />
                              Premium User
                            </Badge>
                            <span className="text-sm text-green-600">● Aktiv</span>
                          </>
                        ) : (
                          <Badge variant="secondary">Free User</Badge>
                        )}
                      </div>
                    </div>
                    {!isPremium && (
                      <Button 
                        onClick={() => navigate('/pro-upgrade')}
                        className="bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90"
                      >
                        <Crown className="h-4 w-4 mr-2" />
                        Upgrade to Premium
                      </Button>
                    )}
                  </div>
                  
                  {isPremium ? (
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <p>✓ Unbegrenzte CV-Generierungen</p>
                      <p>✓ Alle Premium-Templates</p>
                      <p>✓ URL Scanner ohne Limits</p>
                      <p>✓ Wasserzeichenfreie PDFs</p>
                      <p className="text-xs mt-2">Status: {planStatus || 'active'}</p>
                    </div>
                  ) : (
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <p>• Basis-Template (Budapest)</p>
                      <p>• 1 PDF-Download pro Monat</p>
                      <p className="text-xs mt-2 text-amber-600">
                        Upgrade für unbegrenzte Features und Premium-Vorlagen!
                      </p>
                    </div>
                  )}
                </div>

                {/* Account Actions */}
                <div className="pt-6 border-t">
                  <h4 className="text-sm font-medium mb-4">Konto-Aktionen</h4>
                  <div className="space-y-3">
                    {isPremium && (
                      <Button 
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => navigate('/subscription')}
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Abonnement verwalten
                      </Button>
                    )}
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="destructive"
                          className="w-full justify-start"
                          disabled={deletingAccount}
                        >
                          <AlertTriangle className="h-4 w-4 mr-2" />
                          Konto löschen
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Sind Sie absolut sicher?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Diese Aktion kann nicht rückgängig gemacht werden. Dies wird Ihr Konto 
                            dauerhaft löschen und alle Ihre Daten von unseren Servern entfernen.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleDeleteAccount}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            {deletingAccount ? "Löschen..." : "Konto endgültig löschen"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Photo Placeholder Toggle */}
            <Card className="shadow-medium">
              <CardHeader>
                <CardTitle className="flex items-center space-x-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <User className="h-6 w-6 text-primary" />
                  </div>
                  <span>Profilbild-Platzhalter</span>
                </CardTitle>
                <CardDescription>
                  Professioneller Platzhalter für Ihr Bewerbungsfoto im Lebenslauf
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="space-y-1 flex-1">
                    <Label htmlFor="photo-placeholder" className="text-base font-medium cursor-pointer">
                      Foto-Platzhalter einfügen
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Ein vorgesehener Rahmen wird in Ihrem Lebenslauf eingefügt, in den Sie nach dem Download Ihr Foto in optimaler Qualität einfügen können.
                    </p>
                  </div>
                  <Switch
                    id="photo-placeholder"
                    checked={profile.include_photo_placeholder || false}
                    onCheckedChange={(checked) => 
                      setProfile(prev => ({ ...prev, include_photo_placeholder: checked }))
                    }
                  />
                </div>
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-2">
                  <p className="text-sm text-blue-900">
                    <strong>💡 Warum manuelles Einfügen?</strong>
                  </p>
                  <p className="text-sm text-blue-800 leading-relaxed">
                    Um die bestmögliche Qualität und professionelle Darstellung Ihres Bewerbungsfotos zu gewährleisten, empfehlen wir das manuelle Einfügen. So haben Sie die volle Kontrolle über Auflösung, Positionierung und Qualität Ihres Fotos.
                  </p>
                  <p className="text-sm text-blue-700 mt-2">
                    <strong>Empfohlene Tools:</strong> Adobe Acrobat, Foxit Reader oder kostenlose Online-PDF-Editoren wie Sejda oder PDFescape.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Personal Information */}
            <Card className="shadow-medium">
              <CardHeader>
                <CardTitle className="flex items-center space-x-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <User className="h-6 w-6 text-primary" />
                  </div>
                  <span>Persönliche Daten</span>
                </CardTitle>
                <CardDescription>
                  Grundlegende Informationen für deine Bewerbungen
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="first_name">Vorname</Label>
                    <Input
                      id="first_name"
                      value={profile.first_name}
                      onChange={(e) => setProfile(prev => ({ ...prev, first_name: e.target.value }))}
                      placeholder="Max"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last_name">Nachname</Label>
                    <Input
                      id="last_name"
                      value={profile.last_name}
                      onChange={(e) => setProfile(prev => ({ ...prev, last_name: e.target.value }))}
                      placeholder="Mustermann"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="professional_title">Titel unter dem Namen</Label>
                  <Input
                    id="professional_title"
                    value={profile.professional_title || ''}
                    onChange={(e) => setProfile(prev => ({ ...prev, professional_title: e.target.value }))}
                    placeholder="z. B. Sales Agent, Software Engineer, Marketing Specialist"
                  />
                  <p className="text-xs text-muted-foreground">
                    Dieser Text erscheint direkt unter deinem Namen in allen Lebenslauf-Templates.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">E-Mail</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profile.email}
                      onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="max@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefon</Label>
                    <Input
                      id="phone"
                      value={profile.phone}
                      onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="+49 123 456789"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Adresse</Label>
                  <Input
                    id="address"
                    value={profile.address}
                    onChange={(e) => setProfile(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="Musterstraße 123"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="postal_code">PLZ</Label>
                    <Input
                      id="postal_code"
                      value={profile.postal_code}
                      onChange={(e) => setProfile(prev => ({ ...prev, postal_code: e.target.value }))}
                      placeholder="12345"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">Stadt</Label>
                    <Input
                      id="city"
                      value={profile.city}
                      onChange={(e) => setProfile(prev => ({ ...prev, city: e.target.value }))}
                      placeholder="Berlin"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">Land</Label>
                    <Input
                      id="country"
                      value={profile.country}
                      onChange={(e) => setProfile(prev => ({ ...prev, country: e.target.value }))}
                      placeholder="Deutschland"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Work Experience */}
            <Card className="shadow-medium">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <CardTitle className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Briefcase className="h-6 w-6 text-blue-600" />
                      </div>
                      <span>Berufserfahrung</span>
                    </CardTitle>
                    <CardDescription className="hidden sm:block">
                      Deine bisherigen Positionen und Erfahrungen
                    </CardDescription>
                  </div>
                  <Button onClick={addExperience} size="sm" className="flex items-center justify-center space-x-2 w-full sm:w-auto">
                    <Plus className="h-4 w-4" />
                    <span>Hinzufügen</span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {profile.experience.map((exp, index) => (
                  <div key={exp.id} className="p-4 border rounded-lg space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Position {index + 1}</h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeExperience(exp.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Unternehmen</Label>
                        <Input
                          value={exp.company}
                          onChange={(e) => updateExperience(exp.id, 'company', e.target.value)}
                          placeholder="Firma GmbH"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Position</Label>
                        <Input
                          value={exp.position}
                          onChange={(e) => updateExperience(exp.id, 'position', e.target.value)}
                          placeholder="Software Developer"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Startdatum (Monat/Jahr)</Label>
                        <Input
                          type="month"
                          value={exp.startDate}
                          onChange={(e) => updateExperience(exp.id, 'startDate', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Enddatum (Monat/Jahr)</Label>
                        <Input
                          type="month"
                          value={exp.endDate}
                          disabled={exp.current}
                          onChange={(e) => updateExperience(exp.id, 'endDate', e.target.value)}
                        />
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`current-${exp.id}`}
                            checked={exp.current}
                            onChange={(e) => updateExperience(exp.id, 'current', e.target.checked)}
                            className="rounded"
                          />
                          <Label htmlFor={`current-${exp.id}`} className="text-sm">
                            Aktuelle Position
                          </Label>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Beschreibung</Label>
                      <Textarea
                        value={exp.description}
                        onChange={(e) => updateExperience(exp.id, 'description', e.target.value)}
                        placeholder="Beschreibe deine Aufgaben und Erfolge..."
                        rows={3}
                      />
                    </div>
                  </div>
                ))}
                
                {profile.experience.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Keine Berufserfahrung hinzugefügt</p>
                    <p className="text-sm">Klicke auf "Hinzufügen" um zu beginnen</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Education */}
            <Card className="shadow-medium">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <CardTitle className="flex items-center space-x-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <GraduationCap className="h-6 w-6 text-green-600" />
                      </div>
                      <span>Bildungsweg</span>
                    </CardTitle>
                    <CardDescription className="hidden sm:block">
                      Deine Ausbildung, Studium und Weiterbildungen
                    </CardDescription>
                  </div>
                  <Button onClick={addEducation} size="sm" className="flex items-center justify-center space-x-2 w-full sm:w-auto">
                    <Plus className="h-4 w-4" />
                    <span>Hinzufügen</span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {profile.education.map((edu, index) => (
                  <div key={edu.id} className="p-4 border rounded-lg space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Bildung {index + 1}</h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeEducation(edu.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Uni/Schule</Label>
                        <Input
                          value={edu.institution}
                          onChange={(e) => updateEducation(edu.id, 'institution', e.target.value)}
                          placeholder="Universität Berlin"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Abschluss</Label>
                        <Input
                          value={edu.degree}
                          onChange={(e) => updateEducation(edu.id, 'degree', e.target.value)}
                          placeholder="Bachelor of Science"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Startdatum (Monat/Jahr)</Label>
                        <Input
                          type="month"
                          value={edu.startDate}
                          onChange={(e) => updateEducation(edu.id, 'startDate', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Enddatum (Monat/Jahr)</Label>
                        <Input
                          type="month"
                          value={edu.endDate}
                          onChange={(e) => updateEducation(edu.id, 'endDate', e.target.value)}
                          disabled={edu.ongoing}
                        />
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`ongoing-${edu.id}`}
                        checked={edu.ongoing || false}
                        onChange={(e) => updateEducation(edu.id, 'ongoing', e.target.checked)}
                        className="rounded border-gray-300"
                      />
                      <Label htmlFor={`ongoing-${edu.id}`}>Aktuell (laufend)</Label>
                    </div>

                    <div className="space-y-2">
                      <Label>Beschreibung (optional)</Label>
                      <Textarea
                        value={edu.description || ''}
                        onChange={(e) => updateEducation(edu.id, 'description', e.target.value)}
                        placeholder="Zusätzliche Informationen, Schwerpunkte, Noten..."
                        rows={2}
                      />
                    </div>
                  </div>
                ))}
                
                {profile.education.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <GraduationCap className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Keine Bildung hinzugefügt</p>
                    <p className="text-sm">Klicke auf "Hinzufügen" um zu beginnen</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Skills */}
            <Card className="shadow-medium">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <CardTitle className="flex items-center space-x-3">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <Award className="h-6 w-6 text-purple-600" />
                      </div>
                      <span>Fähigkeiten</span>
                    </CardTitle>
                    <CardDescription className="hidden sm:block">
                      Deine fachlichen und persönlichen Kompetenzen
                    </CardDescription>
                  </div>
                  <Button onClick={addSkill} size="sm" className="flex items-center justify-center space-x-2 w-full sm:w-auto">
                    <Plus className="h-4 w-4" />
                    <span>Hinzufügen</span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {profile.skills.map((skill) => (
                    <div key={skill.id} className="flex items-center space-x-4 p-3 border rounded-lg">
                      <div className="flex-1 space-y-2">
                        <Input
                          value={skill.name}
                          onChange={(e) => updateSkill(skill.id, 'name', e.target.value)}
                          placeholder="z.B. JavaScript, Teamwork"
                        />
                        <select
                          value={skill.level}
                          onChange={(e) => updateSkill(skill.id, 'level', e.target.value)}
                          className="w-full p-2 border rounded-md bg-background"
                        >
                          <option value="Anfänger">Anfänger</option>
                          <option value="Fortgeschritten">Fortgeschritten</option>
                          <option value="Experte">Experte</option>
                        </select>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeSkill(skill.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                
                {profile.skills.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Award className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Keine Fähigkeiten hinzugefügt</p>
                    <p className="text-sm">Klicke auf "Hinzufügen" um zu beginnen</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Languages */}
            <Card className="shadow-medium">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <CardTitle className="flex items-center space-x-3">
                      <div className="p-2 bg-orange-100 rounded-lg">
                        <Languages className="h-6 w-6 text-orange-600" />
                      </div>
                      <span>Sprachen</span>
                    </CardTitle>
                    <CardDescription className="hidden sm:block">
                      Deine Sprachkenntnisse nach dem europäischen Referenzrahmen
                    </CardDescription>
                  </div>
                  <Button onClick={addLanguage} size="sm" className="flex items-center justify-center space-x-2 w-full sm:w-auto">
                    <Plus className="h-4 w-4" />
                    <span>Hinzufügen</span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {profile.languages.map((language) => (
                    <div key={language.id} className="flex items-center space-x-4 p-3 border rounded-lg">
                      <div className="flex-1 space-y-2">
                        <Input
                          value={language.name}
                          onChange={(e) => updateLanguage(language.id, 'name', e.target.value)}
                          placeholder="z.B. Deutsch, Englisch"
                        />
                        <select
                          value={language.level}
                          onChange={(e) => updateLanguage(language.id, 'level', e.target.value)}
                          className="w-full p-2 border rounded-md bg-background"
                        >
                          <option value="A1">A1 - Anfänger</option>
                          <option value="A2">A2 - Grundlegend</option>
                          <option value="B1">B1 - Mittelstufe</option>
                          <option value="B2">B2 - Gute Mittelstufe</option>
                          <option value="C1">C1 - Fortgeschritten</option>
                          <option value="C2">C2 - Muttersprachlich</option>
                        </select>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeLanguage(language.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                
                {profile.languages.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Languages className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Keine Sprachen hinzugefügt</p>
                    <p className="text-sm">Klicke auf "Hinzufügen" um zu beginnen</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* CV Generator Section */}
            <Card className="shadow-medium border-2 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <span>Professional CV Generator</span>
                  {userPlan === 'pro' && (
                    <Badge variant="default" className="bg-gradient-to-r from-amber-400 to-orange-500 text-black flex items-center space-x-1">
                      <Crown className="h-3 w-3" />
                      <span>PRO</span>
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  Erstelle einen professionellen Lebenslauf mit eleganten Design-Vorlagen
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {!isProfileComplete() ? (
                  <div className="text-center py-8 px-4 bg-muted/50 rounded-lg">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="font-semibold text-lg mb-2">Profil vervollständigen</h3>
                    <p className="text-muted-foreground mb-4">
                      Fülle mindestens deine persönlichen Daten aus und füge Berufserfahrung oder Bildung hinzu, 
                      um deinen Lebenslauf zu erstellen.
                    </p>
                    <div className="text-sm space-y-1">
                      <p className="font-medium">Erforderlich:</p>
                      <ul className="text-left inline-block space-y-1">
                        <li className={`flex items-center space-x-2 ${profile.first_name ? 'text-green-600' : 'text-muted-foreground'}`}>
                          <span className="w-2 h-2 rounded-full bg-current"></span>
                          <span>Vorname</span>
                        </li>
                        <li className={`flex items-center space-x-2 ${profile.last_name ? 'text-green-600' : 'text-muted-foreground'}`}>
                          <span className="w-2 h-2 rounded-full bg-current"></span>
                          <span>Nachname</span>
                        </li>
                        <li className={`flex items-center space-x-2 ${profile.email ? 'text-green-600' : 'text-muted-foreground'}`}>
                          <span className="w-2 h-2 rounded-full bg-current"></span>
                          <span>E-Mail</span>
                        </li>
                        <li className={`flex items-center space-x-2 ${profile.city ? 'text-green-600' : 'text-muted-foreground'}`}>
                          <span className="w-2 h-2 rounded-full bg-current"></span>
                          <span>Stadt</span>
                        </li>
                        <li className={`flex items-center space-x-2 ${(profile.education.length > 0 || profile.experience.length > 0) ? 'text-green-600' : 'text-muted-foreground'}`}>
                          <span className="w-2 h-2 rounded-full bg-current"></span>
                          <span>Berufserfahrung oder Bildung</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Profile Complete Status */}
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        <span className="font-semibold text-green-800">Profil vollständig!</span>
                      </div>
                      <p className="text-green-700 text-sm">
                        Dein Profil ist bereit für die Lebenslauf-Erstellung. Wähle ein Template und passe es an.
                      </p>
                    </div>

                    {/* Premium CV Template Selection */}
                    <CVTemplateSelector
                      userPlan={userPlan}
                      onSelectTemplate={handleTemplateSelect}
                      onGenerateCV={handleGenerateCV}
                      profile={profile}
                      isGenerating={generatingCV}
                    />

                    {/* Customization Panel */}
                    {showCustomization && (
                      <div className="bg-muted/50 rounded-lg p-4 space-y-4">
                        <h4 className="font-semibold flex items-center space-x-2">
                          <Palette className="h-4 w-4" />
                          <span>Design anpassen</span>
                        </h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {/* Color Selection */}
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">Farbe</Label>
                            <div className="grid grid-cols-3 gap-2">
                              {colorOptions.map((color) => (
                                <div 
                                  key={color.value}
                                  className={`cursor-pointer p-2 rounded border-2 transition-all ${
                                    customization.primaryColor === color.value ? 'border-primary' : 'border-border'
                                  }`}
                                  onClick={() => setCustomization(prev => ({ ...prev, primaryColor: color.value }))}
                                >
                                  <div 
                                    className="w-full h-6 rounded mb-1"
                                    style={{ backgroundColor: color.value }}
                                  />
                                  <p className="text-xs text-center">{color.name.split(' ')[0]}</p>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Font Selection */}
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">Schriftart</Label>
                            <select
                              value={customization.font}
                              onChange={(e) => setCustomization(prev => ({ ...prev, font: e.target.value }))}
                              className="w-full p-2 border rounded-md bg-background"
                            >
                              {fontOptions.map((font) => (
                                <option key={font.value} value={font.value}>{font.name}</option>
                              ))}
                            </select>
                          </div>

                          {/* Layout Selection */}
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">Layout</Label>
                            <select
                              value={customization.layout}
                              onChange={(e) => setCustomization(prev => ({ ...prev, layout: e.target.value as 'single' | 'two-column' }))}
                              className="w-full p-2 border rounded-md bg-background"
                            >
                              <option value="single">Einspaltig</option>
                              <option value="two-column">Zweispaltig</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex justify-center">
                      <Button 
                        onClick={downloadAsTXT}
                        disabled={generatingCV}
                        size="lg"
                        className="h-14 px-8 flex items-center justify-center space-x-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                      >
                        <FileText className="h-5 w-5" />
                        <span>TXT Download</span>
                      </Button>
                    </div>

                    {generatingCV && (
                      <div className="text-center py-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                        <p className="text-sm text-muted-foreground">Professioneller CV wird erstellt...</p>
                      </div>
                    )}

                    {userPlan === 'free' && (
                      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <Crown className="h-4 w-4 text-amber-600" />
                          <span className="font-semibold text-amber-800">Upgrade zu PRO</span>
                        </div>
                        <p className="text-amber-700 text-sm mb-3">
                          Erhalte Zugang zu allen Premium-Templates, DOCX-Export, <strong>wasserzeichenfreie PDFs</strong> und erweiterte Anpassungsoptionen.
                        </p>
                        <p className="text-amber-600 text-xs mb-3">
                          ⚠️ Free-Version: PDFs enthalten Wasserzeichen
                        </p>
                        <Button 
                          size="sm" 
                          onClick={() => navigate('/pro-upgrade')}
                          className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                        >
                          Jetzt upgraden
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex justify-center pt-6">
              <Button onClick={saveProfile} disabled={saving} size="lg" className="px-12 w-full sm:w-auto">
                <Save className="h-5 w-5 mr-2" />
                {saving ? 'Speichern...' : 'Profil speichern'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}