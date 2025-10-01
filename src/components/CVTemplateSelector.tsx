import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Crown, Eye, Download, Sparkles, Briefcase, Palette, Zap, Users } from 'lucide-react';
import CVPreview from '@/components/CVPreview';
import { Profile } from '@/pages/Profile';

interface CVTemplate {
  id: string;
  name: string;
  filename: string;
  description: string;
  isPremium: boolean;
  preview: string;
  primaryColor: string;
  accentColor: string;
  gradient: string;
  category: string;
  icon: any;
  features: string[];
  mockupElements: {
    headerStyle: string;
    sectionStyle: string;
    accentElements: string;
  };
}

interface CVTemplateSelectorProps {
  userPlan: string;
  onSelectTemplate: (template: CVTemplate) => void;
  onGenerateCV: (templateId: string) => void;
  profile?: Profile;
  isGenerating?: boolean;
}

const CV_TEMPLATES: CVTemplate[] = [
  {
    id: 'budapest',
    name: 'Budapest',
    filename: 'budapest.html',
    description: 'Elegantes zweispaltiges Design mit dunkler Seitenleiste und modernen Akzenten.',
    isPremium: false,
    preview: '/templates/cv/budapest.html',
    primaryColor: '#334155',
    accentColor: '#3b82f6',
    gradient: 'from-slate-600 to-slate-700',
    category: 'Professional',
    icon: Briefcase,
    features: ['Zweispaltig', 'Dunkle Sidebar', 'Moderne Icons', 'ATS-optimiert'],
    mockupElements: {
      headerStyle: 'Dark sidebar with contact info',
      sectionStyle: 'Clean sections with dividers',
      accentElements: 'Blue accent colors for highlights'
    }
  },
  {
    id: 'cali',
    name: 'Cali',
    filename: 'cali.html', 
    description: 'Frisches, modernes Design mit Foto-Bereich und lebendigen Akzenten.',
    isPremium: true,
    preview: '/templates/cv/cali.html',
    primaryColor: '#2563eb',
    accentColor: '#06b6d4',
    gradient: 'from-blue-500 to-cyan-500',
    category: 'Modern',
    icon: Sparkles,
    features: ['Foto-Integration', 'Farbige Akzente', 'Moderne Typografie', 'Social Media'],
    mockupElements: {
      headerStyle: 'Photo integration with colorful header',
      sectionStyle: 'Card-based sections with shadows',
      accentElements: 'Gradient backgrounds and icons'
    }
  },
  {
    id: 'chicago',
    name: 'Chicago',
    filename: 'chicago.html',
    description: 'Traditionelles Layout mit klassischer Typografie für seriöse Branchen.',
    isPremium: true,
    preview: '/templates/cv/chicago.html',
    primaryColor: '#475569',
    accentColor: '#64748b',
    gradient: 'from-gray-500 to-gray-600',
    category: 'Classic',
    icon: Users,
    features: ['Traditionell', 'Seriös', 'Bewährtes Layout', 'Konservativ'],
    mockupElements: {
      headerStyle: 'Classic header with formal styling',
      sectionStyle: 'Traditional sections with subtle lines',
      accentElements: 'Minimal accents and professional fonts'
    }
  },
  {
    id: 'riga',
    name: 'Riga',
    filename: 'riga.html',
    description: 'Ultra-minimalistisches Design mit klaren Linien für Tech-Profis.',
    isPremium: true,
    preview: '/templates/cv/riga.html',
    primaryColor: '#059669',
    accentColor: '#10b981',
    gradient: 'from-emerald-500 to-green-600',
    category: 'Minimal',
    icon: Zap,
    features: ['Ultra-minimal', 'Klare Linien', 'Tech-fokussiert', 'Weißraum'],
    mockupElements: {
      headerStyle: 'Minimal header with clean typography',
      sectionStyle: 'Spacious sections with subtle dividers',
      accentElements: 'Green accents for key information'
    }
  },
  {
    id: 'rotterdam',
    name: 'Rotterdam',
    filename: 'rotterdam.html',
    description: 'Kreatives Layout mit dynamischen Elementen für Design-Berufe.',
    isPremium: true,
    preview: '/templates/cv/rotterdam.html',
    primaryColor: '#dc2626',
    accentColor: '#f97316',
    gradient: 'from-red-500 to-orange-500',
    category: 'Creative',
    icon: Palette,
    features: ['Kreativ', 'Dynamisch', 'Artistic', 'Portfolio-Style'],
    mockupElements: {
      headerStyle: 'Creative header with artistic elements',
      sectionStyle: 'Dynamic sections with creative layouts',
      accentElements: 'Vibrant colors and design elements'
    }
  }
];

export default function CVTemplateSelector({ 
  userPlan, 
  onSelectTemplate, 
  onGenerateCV, 
  profile,
  isGenerating = false 
}: CVTemplateSelectorProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<CVTemplate | null>(null);

  const isPremiumUser = userPlan === 'pro' || userPlan === 'premium';

  const handleSelectTemplate = (template: CVTemplate) => {
    if (template.isPremium && !isPremiumUser) {
      return;
    }
    setSelectedTemplate(template);
    onSelectTemplate(template);
  };

  const handleGenerate = () => {
    if (selectedTemplate) {
      onGenerateCV(selectedTemplate.id);
    }
  };

  return (
    <div className="space-y-8">
      {/* Enhanced Header Section */}
      <div className="text-center space-y-4">
        <div className="space-y-2">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Wählen Sie Ihr perfektes CV-Design
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Erstellen Sie einen professionellen Lebenslauf, der Ihre Persönlichkeit und Qualifikationen optimal präsentiert
          </p>
        </div>
        
        {!isPremiumUser && (
          <div className="mt-6 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200 max-w-lg mx-auto">
            <div className="flex items-center justify-center gap-3 text-blue-700">
              <Crown className="w-6 h-6 text-yellow-500" />
              <span className="font-semibold text-base">
                Upgraden Sie auf Premium für alle exklusiven Design-Vorlagen
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Enhanced Template Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {CV_TEMPLATES.map((template) => {
          const isLocked = template.isPremium && !isPremiumUser;
          const isSelected = selectedTemplate?.id === template.id;
          const IconComponent = template.icon;

          return (
            <Card 
              key={template.id}
              className={`group cursor-pointer transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] hover:-translate-y-2 ${
                isSelected 
                  ? 'ring-4 ring-blue-500 shadow-2xl scale-[1.02] -translate-y-2 bg-gradient-to-br from-white to-blue-50' 
                  : 'hover:shadow-xl'
              } ${isLocked ? 'opacity-70' : ''}`}
              onClick={() => !isLocked && handleSelectTemplate(template)}
              style={{ 
                borderColor: isSelected ? template.accentColor : undefined,
                boxShadow: isSelected ? `0 25px 50px -12px ${template.accentColor}30` : undefined
              }}
            >
              {/* Template Header */}
              <CardHeader className="pb-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="p-2 rounded-lg text-white"
                      style={{ backgroundColor: template.primaryColor }}
                    >
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold text-gray-900 group-hover:text-gray-700 transition-colors">
                        {template.name}
                      </CardTitle>
                      <Badge 
                        variant="outline" 
                        className="mt-1 text-xs font-medium border-0 px-2 py-1 rounded-full"
                        style={{ 
                          backgroundColor: `${template.accentColor}15`,
                          color: template.accentColor 
                        }}
                      >
                        {template.category}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-2">
                    {template.isPremium ? (
                      <Badge variant="outline" className="bg-gradient-to-r from-yellow-100 to-yellow-50 border-yellow-300 text-yellow-700 font-semibold">
                        <Crown className="w-3 h-3 mr-1" />
                        Premium
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-gradient-to-r from-green-100 to-green-50 border-green-300 text-green-700 font-semibold">
                        Kostenlos
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {/* Enhanced Preview Mockup */}
                <div className={`relative w-full h-48 rounded-xl overflow-hidden bg-gradient-to-br ${template.gradient} shadow-lg`}>
                  {/* Animated gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-black/10" />
                  
                  {/* CV Mockup Content */}
                  <div className="absolute inset-4 bg-white/95 rounded-lg p-4 space-y-2 backdrop-blur-sm">
                    {/* Header mockup */}
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: template.accentColor }}
                      />
                      <div className="h-2 bg-gray-700 rounded flex-1 max-w-[60px]" />
                      <div className="h-1 bg-gray-400 rounded flex-1 max-w-[40px]" />
                    </div>
                    
                    {/* Section mockup */}
                    <div className="space-y-1">
                      <div className="h-1 bg-gray-300 rounded w-full" />
                      <div className="h-1 bg-gray-200 rounded w-4/5" />
                      <div className="h-1 bg-gray-200 rounded w-3/4" />
                    </div>
                    
                    {/* Skills/highlights mockup */}
                    <div className="flex gap-1 pt-2">
                      <div 
                        className="h-2 rounded-full px-2 text-[6px] flex items-center justify-center text-white font-bold"
                        style={{ backgroundColor: template.accentColor }}
                      >
                        ●
                      </div>
                      <div 
                        className="h-2 rounded-full px-2 text-[6px] flex items-center justify-center text-white font-bold"
                        style={{ backgroundColor: template.primaryColor }}
                      >
                        ●
                      </div>
                    </div>
                  </div>
                  
                  {/* Lock overlay for premium templates */}
                  {isLocked && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm">
                      <div className="text-center text-white space-y-2">
                        <Crown className="w-12 h-12 mx-auto text-yellow-400" />
                        <p className="text-sm font-medium">Premium Template</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Enhanced Description and Features */}
                <div className="space-y-4">
                  <p className="text-sm text-gray-600 leading-relaxed font-medium">
                    {template.description}
                  </p>
                  
                  {/* Feature tags */}
                  <div className="flex flex-wrap gap-1.5">
                    {template.features.slice(0, 3).map((feature, index) => (
                      <Badge 
                        key={index}
                        variant="secondary" 
                        className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 transition-colors"
                      >
                        {feature}
                      </Badge>
                    ))}
                    {template.features.length > 3 && (
                      <Badge variant="secondary" className="text-xs px-2 py-1 bg-gray-100">
                        +{template.features.length - 3} mehr
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Enhanced Action Buttons */}
                <div className="space-y-3 pt-2">
                  <CVPreview 
                    templateId={template.id}
                    templateName={template.name}
                    profile={profile}
                    onSelect={() => handleSelectTemplate(template)}
                    disabled={isLocked}
                  />
                  
                  {isSelected && (
                    <Button
                      size="default"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleGenerate();
                      }}
                      disabled={isGenerating}
                      className="w-full h-10 font-semibold transition-all duration-200 hover:scale-105"
                      style={{ 
                        backgroundColor: template.primaryColor,
                        borderColor: template.primaryColor
                      }}
                    >
                      {isGenerating ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Generiere...
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Download className="w-4 h-4" />
                          Download
                        </div>
                      )}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}