import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Download, Copy, Edit, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import html2pdf from 'html2pdf.js';

interface CoverLetterPreviewProps {
  letterText: string;
  applicantInfo?: {
    name: string;
    address?: string;
    city?: string;
    phone?: string;
    email?: string;
  };
  jobInfo?: {
    jobtitel: string;
    arbeitgeber: string;
    ort?: string;
  };
  date?: string;
}

export default function CoverLetterPreview({
  letterText,
  applicantInfo,
  jobInfo,
  date
}: CoverLetterPreviewProps) {
  const { toast } = useToast();
  const letterRef = useRef<HTMLDivElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(letterText);
  
  // Spacing controls
  const [headerSpacing, setHeaderSpacing] = useState(12);
  const [subjectSpacing, setSubjectSpacing] = useState(6);
  const [paragraphSpacing, setParagraphSpacing] = useState(6); // Increased from 4 to 6 for better visibility
  const [closingSpacing, setClosingSpacing] = useState(8);
  
  // Margin controls (in cm)
  const [marginTop, setMarginTop] = useState(2.5);
  const [marginBottom, setMarginBottom] = useState(2.0);
  const [marginLeft, setMarginLeft] = useState(2.5);
  const [marginRight, setMarginRight] = useState(2.0);
  
  // Update edited text when letterText changes
  React.useEffect(() => {
    setEditedText(letterText);
  }, [letterText]);

  // Extract applicant info from letter text if not provided
  const extractedInfo = React.useMemo(() => {
    const lines = letterText.split('\n').filter(l => l.trim());
    
    // Extract city and date from letter
    const cityDateMatch = letterText.match(/^([A-ZÄÖÜ][a-zäöü]+),?\s+(\d{1,2}\.\s*\w+\s+\d{4})/m);
    
    // Extract subject line (Betreff)
    const subjectMatch = letterText.match(/^Bewerbung als\s+(.+)/m) ||
                        letterText.match(/^Betreff:\s*Bewerbung als\s+(.+)/m);
    
    // Extract salutation
    const salutationLine = lines.find(l => l.includes('Sehr geehrte') || l.includes('Sehr geehrter'));
    
    return {
      cityDate: cityDateMatch ? `${cityDateMatch[1]}, ${cityDateMatch[2]}` : date || new Date().toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' }),
      subject: subjectMatch ? `Bewerbung als ${subjectMatch[1].trim()}` : `Bewerbung als ${jobInfo?.jobtitel || 'Position'}`,
      salutation: salutationLine || 'Sehr geehrte Damen und Herren,',
    };
  }, [letterText, jobInfo, date]);

  // Parse letter into sections (use editedText for display)
  const letterSections = React.useMemo(() => {
    const lines = editedText.split('\n').filter(l => l.trim());
    
    // Find salutation index
    const salutationIndex = lines.findIndex(l => l.includes('Sehr geehrte') || l.includes('Sehr geehrter'));
    
    // Find closing index
    const closingIndex = lines.findIndex(l => l.includes('Mit freundlichen Grüßen') || l.includes('Freundliche Grüße'));
    
    // Extract body paragraphs
    const bodyLines = salutationIndex !== -1 && closingIndex !== -1
      ? lines.slice(salutationIndex + 1, closingIndex)
      : lines;
    
    // Group into paragraphs (separated by empty lines in original)
    const paragraphs: string[] = [];
    let currentParagraph = '';
    
    bodyLines.forEach(line => {
      if (line.trim()) {
        currentParagraph += (currentParagraph ? ' ' : '') + line.trim();
      } else if (currentParagraph) {
        paragraphs.push(currentParagraph);
        currentParagraph = '';
      }
    });
    
    if (currentParagraph) {
      paragraphs.push(currentParagraph);
    }
    
    // Extract signature
    const signatureIndex = lines.findIndex(l => 
      l.trim() && 
      closingIndex !== -1 && 
      lines.indexOf(l) > closingIndex &&
      !l.includes('Mit freundlichen')
    );
    
    const signature = signatureIndex !== -1 ? lines[signatureIndex] : applicantInfo?.name || '';
    
    return {
      salutation: extractedInfo.salutation,
      paragraphs: paragraphs.filter(p => p.length > 20), // Filter out very short paragraphs
      signature
    };
  }, [editedText, applicantInfo, extractedInfo]);

  const downloadAsPDF = async () => {
    if (!letterRef.current) return;

    try {
      // Convert cm to mm for html2pdf (format: [top, right, bottom, left])
      const marginsInMm: [number, number, number, number] = [
        marginTop * 10,
        marginRight * 10,
        marginBottom * 10,
        marginLeft * 10
      ];
      
      // @ts-ignore - html2pdf type definitions are incomplete
      await html2pdf()
        .set({
          margin: marginsInMm,
          filename: `Anschreiben_${jobInfo?.arbeitgeber?.replace(/\s+/g, '_') || 'Bewerbung'}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { 
            scale: 2, 
            useCORS: true,
            logging: false,
            windowWidth: 794, // A4 width in pixels at 96 DPI
            windowHeight: 1123 // A4 height in pixels at 96 DPI
          },
          jsPDF: { 
            unit: 'mm', 
            format: 'a4', 
            orientation: 'portrait'
          },
          pagebreak: { 
            mode: ['avoid-all', 'css', 'legacy']
          }
        })
        .from(letterRef.current)
        .save();
      
      toast({
        title: 'PDF erstellt',
        description: 'Anschreiben wurde als PDF heruntergeladen.',
      });
    } catch (error) {
      console.error('PDF generation error:', error);
      toast({
        title: 'Fehler',
        description: 'PDF konnte nicht erstellt werden.',
        variant: 'destructive',
      });
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(editedText);
    toast({
      title: 'Kopiert!',
      description: 'Anschreiben in Zwischenablage kopiert.',
    });
  };
  
  const saveEdits = () => {
    setIsEditing(false);
    toast({
      title: 'Änderungen gespeichert',
      description: 'Deine Bearbeitungen wurden übernommen. Das PDF verwendet jetzt deine angepasste Version.',
    });
  };

  return (
    <div className="space-y-4">
      {/* Action Buttons */}
      <div className="flex gap-3">
        {!isEditing ? (
          <>
            <Button onClick={downloadAsPDF} className="flex-1" size="lg">
              <Download className="h-4 w-4 mr-2" />
              Als PDF herunterladen
            </Button>
            <Button onClick={() => setIsEditing(true)} variant="outline" className="flex-1" size="lg">
              <Edit className="h-4 w-4 mr-2" />
              Bearbeiten
            </Button>
            <Button onClick={copyToClipboard} variant="outline" className="flex-1" size="lg">
              <Copy className="h-4 w-4 mr-2" />
              Kopieren
            </Button>
          </>
        ) : (
          <>
            <Button onClick={saveEdits} className="flex-1" size="lg">
              <Save className="h-4 w-4 mr-2" />
              Änderungen speichern
            </Button>
            <Button 
              onClick={() => { 
                setEditedText(letterText); 
                setIsEditing(false); 
              }} 
              variant="outline" 
              className="flex-1" 
              size="lg"
            >
              Abbrechen
            </Button>
          </>
        )}
      </div>

      {/* Cover Letter Preview - Same for both Edit & View modes */}
      {isEditing && (
        <>
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2 text-sm text-amber-800">
            <Edit className="h-4 w-4" />
            <span>
              <strong>Bearbeitungsmodus:</strong> Klicke direkt in die Textbereiche unten, um sie zu bearbeiten. 
              Die Vorschau entspricht dem finalen PDF.
            </span>
          </div>
          
          {/* Spacing Controls */}
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-4">
            <div>
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <span>📐</span> Abstände anpassen (in mm)
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-xs text-gray-600 block mb-1">Header Abstand</label>
                  <input
                    type="range"
                    min="6"
                    max="20"
                    value={headerSpacing}
                    onChange={(e) => setHeaderSpacing(Number(e.target.value))}
                    className="w-full"
                  />
                  <span className="text-xs text-gray-500">{headerSpacing}mm</span>
                </div>
                <div>
                  <label className="text-xs text-gray-600 block mb-1">Betreff Abstand</label>
                  <input
                    type="range"
                    min="3"
                    max="12"
                    value={subjectSpacing}
                    onChange={(e) => setSubjectSpacing(Number(e.target.value))}
                    className="w-full"
                  />
                  <span className="text-xs text-gray-500">{subjectSpacing}mm</span>
                </div>
                <div>
                  <label className="text-xs text-gray-600 block mb-1">Absatz Abstand</label>
                  <input
                    type="range"
                    min="2"
                    max="8"
                    value={paragraphSpacing}
                    onChange={(e) => setParagraphSpacing(Number(e.target.value))}
                    className="w-full"
                  />
                  <span className="text-xs text-gray-500">{paragraphSpacing}mm</span>
                </div>
                <div>
                  <label className="text-xs text-gray-600 block mb-1">Abschluss Abstand</label>
                  <input
                    type="range"
                    min="4"
                    max="16"
                    value={closingSpacing}
                    onChange={(e) => setClosingSpacing(Number(e.target.value))}
                    className="w-full"
                  />
                  <span className="text-xs text-gray-500">{closingSpacing}mm</span>
                </div>
              </div>
            </div>
            
            <div className="border-t border-blue-300 pt-4">
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <span>📏</span> Seitenränder (in cm)
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-xs text-gray-600 block mb-1">Oben</label>
                  <input
                    type="number"
                    min="1.0"
                    max="4.0"
                    step="0.1"
                    value={marginTop}
                    onChange={(e) => setMarginTop(Number(e.target.value))}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                  <span className="text-xs text-gray-500">{marginTop}cm</span>
                </div>
                <div>
                  <label className="text-xs text-gray-600 block mb-1">Unten</label>
                  <input
                    type="number"
                    min="1.0"
                    max="4.0"
                    step="0.1"
                    value={marginBottom}
                    onChange={(e) => setMarginBottom(Number(e.target.value))}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                  <span className="text-xs text-gray-500">{marginBottom}cm</span>
                </div>
                <div>
                  <label className="text-xs text-gray-600 block mb-1">Links</label>
                  <input
                    type="number"
                    min="1.5"
                    max="4.0"
                    step="0.1"
                    value={marginLeft}
                    onChange={(e) => setMarginLeft(Number(e.target.value))}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                  <span className="text-xs text-gray-500">{marginLeft}cm</span>
                </div>
                <div>
                  <label className="text-xs text-gray-600 block mb-1">Rechts</label>
                  <input
                    type="number"
                    min="1.0"
                    max="4.0"
                    step="0.1"
                    value={marginRight}
                    onChange={(e) => setMarginRight(Number(e.target.value))}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                  <span className="text-xs text-gray-500">{marginRight}cm</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
      {(
        <div className="border rounded-lg bg-white shadow-lg overflow-auto max-h-[800px]">
          <div
            ref={letterRef}
            className="cover-letter bg-white"
            style={{
              fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
              color: '#222',
              lineHeight: '1.5',
              maxWidth: '210mm',
              margin: '0 auto',
              minHeight: 'auto',
              paddingTop: `${marginTop}cm`,
              paddingBottom: `${marginBottom}cm`,
              paddingLeft: `${marginLeft}cm`,
              paddingRight: `${marginRight}cm`,
            }}
          >
          {/* Header - Two Column Layout */}
          <div className="grid grid-cols-2 gap-8" style={{ marginBottom: `${headerSpacing}mm` }}>
            {/* Left Column - Applicant Info */}
            <div>
              <h1 
                className={`text-xl font-bold text-gray-900 mb-3 ${isEditing ? 'hover:bg-blue-50 cursor-text border border-transparent hover:border-blue-300 rounded p-2' : ''}`}
                contentEditable={isEditing}
                suppressContentEditableWarning={true}
                style={{ fontSize: '18pt', outline: 'none' }}
              >
                {applicantInfo?.name || letterSections.signature}
              </h1>
              <div className="text-sm text-gray-600 space-y-1" style={{ fontSize: '11pt' }}>
                {applicantInfo?.address && (
                  <p 
                    className={isEditing ? 'hover:bg-blue-50 cursor-text border border-transparent hover:border-blue-300 rounded p-1' : ''}
                    contentEditable={isEditing}
                    suppressContentEditableWarning={true}
                    style={{ outline: 'none' }}
                  >
                    {applicantInfo.address}
                  </p>
                )}
                {applicantInfo?.city && (
                  <p 
                    className={isEditing ? 'hover:bg-blue-50 cursor-text border border-transparent hover:border-blue-300 rounded p-1' : ''}
                    contentEditable={isEditing}
                    suppressContentEditableWarning={true}
                    style={{ outline: 'none' }}
                  >
                    {applicantInfo.city}
                  </p>
                )}
                {applicantInfo?.phone && (
                  <p 
                    className={isEditing ? 'hover:bg-blue-50 cursor-text border border-transparent hover:border-blue-300 rounded p-1' : ''}
                    contentEditable={isEditing}
                    suppressContentEditableWarning={true}
                    style={{ outline: 'none' }}
                  >
                    {applicantInfo.phone}
                  </p>
                )}
                {applicantInfo?.email && (
                  <p 
                    className={isEditing ? 'hover:bg-blue-50 cursor-text border border-transparent hover:border-blue-300 rounded p-1' : ''}
                    contentEditable={isEditing}
                    suppressContentEditableWarning={true}
                    style={{ outline: 'none' }}
                  >
                    {applicantInfo.email}
                  </p>
                )}
              </div>
            </div>

            {/* Right Column - Company Info & Date */}
            <div className="text-right text-sm" style={{ fontSize: '11pt' }}>
              <p 
                className={`mb-4 text-gray-700 ${isEditing ? 'hover:bg-blue-50 cursor-text border border-transparent hover:border-blue-300 rounded p-2' : ''}`}
                contentEditable={isEditing}
                suppressContentEditableWarning={true}
                style={{ outline: 'none' }}
              >
                {extractedInfo.cityDate}
              </p>
              <div className="text-gray-800">
                <p 
                  className={`font-semibold ${isEditing ? 'hover:bg-blue-50 cursor-text border border-transparent hover:border-blue-300 rounded p-1' : ''}`}
                  contentEditable={isEditing}
                  suppressContentEditableWarning={true}
                  style={{ outline: 'none' }}
                >
                  {jobInfo?.arbeitgeber || 'Unternehmen'}
                </p>
                {jobInfo?.ort && (
                  <p 
                    className={isEditing ? 'hover:bg-blue-50 cursor-text border border-transparent hover:border-blue-300 rounded p-1' : ''}
                    contentEditable={isEditing}
                    suppressContentEditableWarning={true}
                    style={{ outline: 'none' }}
                  >
                    {jobInfo.ort}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Subject Line */}
          <div className="avoid-break" style={{ marginBottom: `${subjectSpacing}mm` }}>
            <h2 
              className={`font-bold text-gray-900 ${isEditing ? 'hover:bg-blue-50 cursor-text border border-transparent hover:border-blue-300 rounded p-2' : ''}`}
              contentEditable={isEditing}
              suppressContentEditableWarning={true}
              onBlur={(e) => {
                if (isEditing) {
                  const newSubject = e.currentTarget.textContent || '';
                  const updatedText = editedText.replace(extractedInfo.subject, newSubject);
                  setEditedText(updatedText);
                }
              }}
              style={{ fontSize: '14pt', outline: 'none' }}
            >
              {extractedInfo.subject}
            </h2>
          </div>

          {/* Salutation */}
          <div className="avoid-break mb-6">
            {isEditing && (
              <div className="text-xs font-semibold text-blue-600 mb-2 px-1">
                👋 Anrede
              </div>
            )}
            <p 
              className={`mb-4 ${isEditing ? 'hover:bg-blue-50 cursor-text border border-transparent hover:border-blue-300 rounded p-2' : ''}`}
              contentEditable={isEditing}
              suppressContentEditableWarning={true}
              onBlur={(e) => {
                if (isEditing) {
                  const newSalutation = e.currentTarget.textContent || '';
                  const updatedText = editedText.replace(letterSections.salutation, newSalutation);
                  setEditedText(updatedText);
                }
              }}
              style={{ fontSize: '12pt', outline: 'none' }}
            >
              {letterSections.salutation}
            </p>
          </div>

          {/* Body Paragraphs with Clear Section Structure */}
          <div className="space-y-6" style={{ fontSize: '11.5pt', lineHeight: '1.6' }}>
            {letterSections.paragraphs.map((paragraph, index) => {
              // Determine section label
              let sectionLabel = '';
              if (index === 0) {
                sectionLabel = '📝 Einleitung';
              } else if (index === letterSections.paragraphs.length - 1) {
                sectionLabel = '🎯 Schluss';
              } else {
                sectionLabel = `💼 Hauptteil ${index}`;
              }
              
              return (
                <div key={index} className="avoid-break">
                  {isEditing && (
                    <div className="text-xs font-semibold text-blue-600 mb-2 px-1">
                      {sectionLabel}
                    </div>
                  )}
                  <p
                    className={`text-gray-800 ${isEditing ? 'hover:bg-blue-50 cursor-text border border-transparent hover:border-blue-300 rounded p-2' : ''}`}
                    contentEditable={isEditing}
                    suppressContentEditableWarning={true}
                    onBlur={(e) => {
                      if (isEditing) {
                        const newText = e.currentTarget.textContent || '';
                        const lines = editedText.split('\n');
                        // Find and replace this paragraph in editedText
                        const updatedText = editedText.replace(paragraph, newText);
                        setEditedText(updatedText);
                      }
                    }}
                    style={{
                      textAlign: 'justify',
                      hyphens: 'auto',
                      outline: 'none',
                      marginBottom: `${paragraphSpacing}mm`,
                    }}
                    dangerouslySetInnerHTML={{
                      __html: paragraph
                        // Bold important keywords
                        .replace(/\b(React|TypeScript|JavaScript|Python|Java|SAP|AWS|Docker|Kubernetes|Projektmanagement|Teamleitung|Agile|Scrum|Node\.js|Vue\.js|TypeScript)\b/gi, '<strong>$1</strong>')
                        // Bold years of experience
                        .replace(/(\d+\+?\s*Jahre?)/gi, '<strong>$1</strong>')
                    }}
                  />
                </div>
              );
            })}
          </div>

          {/* Closing */}
          <div className="avoid-break" style={{ marginTop: `${closingSpacing}mm` }}>
            <p className="mb-8" style={{ fontSize: '11pt' }}>
              Mit freundlichen Grüßen
            </p>
            <p 
              className={`font-bold text-gray-900 ${isEditing ? 'hover:bg-blue-50 cursor-text border border-transparent hover:border-blue-300 rounded p-2' : ''}`}
              contentEditable={isEditing}
              suppressContentEditableWarning={true}
              onBlur={(e) => {
                if (isEditing) {
                  const newSignature = e.currentTarget.textContent || '';
                  const updatedText = editedText.replace(letterSections.signature, newSignature);
                  setEditedText(updatedText);
                }
              }}
              style={{ fontSize: '12pt', outline: 'none' }}
            >
              {letterSections.signature}
            </p>
          </div>
        </div>
      </div>
      )}
    </div>
  );
}
