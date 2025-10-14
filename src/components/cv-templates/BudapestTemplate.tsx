import React from 'react';
import { Profile, Education, Experience, Skill, Language } from '@/pages/Profile';

interface BudapestTemplateProps {
  profile: Profile;
}

export const BudapestTemplate: React.FC<BudapestTemplateProps> = ({ profile }) => {
  const styles = {
    page: {
      display: 'flex',
      height: '297mm', // A4 height
      width: '210mm',  // A4 width
      margin: 0,
      padding: 0,
      fontFamily: 'Arial, sans-serif',
      color: '#333',
      fontSize: '12px',
      lineHeight: '1.4',
      backgroundColor: 'white',
      boxSizing: 'border-box' as const,
    },
    sidebar: {
      width: '25%',
      backgroundColor: '#2f2f2f',
      color: '#fafafa',
      padding: '40px 20px',
      boxSizing: 'border-box' as const,
    },
    sidebarH3: {
      marginTop: '20px',
      marginBottom: '10px',
      color: '#fafafa',
      fontSize: '1.2em',
      fontWeight: 'bold',
      borderBottom: '1px solid #555',
      paddingBottom: '4px',
    },
    sidebarFirstH3: {
      marginTop: '0',
      marginBottom: '10px',
      color: '#fafafa',
      fontSize: '1.2em',
      fontWeight: 'bold',
      borderBottom: '1px solid #555',
      paddingBottom: '4px',
    },
    sidebarP: {
      fontSize: '0.9em',
      lineHeight: '1.4',
      margin: '4px 0',
    },
    sidebarUl: {
      listStyle: 'none',
      paddingLeft: '0',
      margin: '4px 0',
    },
    sidebarLi: {
      fontSize: '0.9em',
      lineHeight: '1.4',
      margin: '4px 0',
    },
    content: {
      width: '75%',
      padding: '40px',
      boxSizing: 'border-box' as const,
    },
    name: {
      fontSize: '2.4em',
      fontWeight: 'bold',
      marginBottom: '4px',
      textTransform: 'uppercase' as const,
      letterSpacing: '1px',
      color: '#333',
    },
    title: {
      fontSize: '1.1em',
      marginBottom: '20px',
      fontStyle: 'italic' as const,
    },
    section: {
      marginTop: '30px',
    },
    sectionH2: {
      fontSize: '1.3em',
      marginBottom: '8px',
      textTransform: 'uppercase' as const,
      letterSpacing: '1px',
      borderBottom: '2px solid #2f2f2f',
      paddingBottom: '3px',
      fontWeight: 'bold',
    },
    experienceEducation: {
      marginBottom: '20px',
    },
    job: {
      marginBottom: '10px',
    },
    jobTitle: {
      fontWeight: 'bold',
      fontSize: '1em',
      marginBottom: '2px',
    },
    jobCompany: {
      fontStyle: 'italic' as const,
      color: '#555',
      fontSize: '0.95em',
      marginBottom: '2px',
    },
    jobDates: {
      fontSize: '0.8em',
      color: '#777',
      marginBottom: '5px',
    },
    jobUl: {
      margin: '5px 0 10px 20px',
      paddingLeft: '0',
    },
    jobLi: {
      marginBottom: '3px',
      fontSize: '0.9em',
      lineHeight: '1.4',
    },
    sidebarName: {
      fontSize: '2em',
      margin: '0 0 20px 0',
      fontWeight: 'bold',
      color: '#fafafa',
    },
    photoPlaceholder: {
      width: '120px',
      height: '120px',
      border: '2px solid #555',
      marginBottom: '20px',
      marginLeft: 'auto',
      marginRight: 'auto',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '0.9em',
      color: '#888',
      backgroundColor: '#222',
    },
  };

  // Helper function to format dates with ongoing support
  const formatDateRange = (startDate: string, endDate: string, ongoing?: boolean) => {
    if (ongoing) {
      return `${startDate} – Heute`;
    }
    return endDate ? `${startDate} – ${endDate}` : startDate;
  };

  return (
    <div style={styles.page}>
      <div style={styles.sidebar}>

        {profile.include_photo_placeholder && (
          <div style={styles.photoPlaceholder}>
            FOTO
          </div>
        )}
        
        <h1 style={styles.sidebarName}>
          {profile.first_name} {profile.last_name}
        </h1>
        
        <h3 style={styles.sidebarFirstH3}>Kontakt</h3>
        <p style={styles.sidebarP}>
          {profile.city && profile.country && `${profile.city}, ${profile.country}`}
          {profile.address && <><br />{profile.address}</>}
          {profile.phone && <><br />{profile.phone}</>}
          {profile.email && <><br />{profile.email}</>}
        </p>

        {profile.summary && (
          <>
            <h3 style={styles.sidebarH3}>Profil</h3>
            <p style={styles.sidebarP}>{profile.summary}</p>
          </>
        )}

        {profile.skills && profile.skills.length > 0 && (
          <>
            <h3 style={styles.sidebarH3}>Fähigkeiten</h3>
            <ul style={styles.sidebarUl}>
              {profile.skills.map((skill: Skill, index: number) => (
                <li key={index} style={styles.sidebarLi}>
                  <strong>{skill.name}</strong>
                  {skill.level && <div style={{ fontSize: '11px', color: '#ccc', marginTop: '2px' }}>{skill.level}</div>}
                </li>
              ))}
            </ul>
          </>
        )}

        {profile.languages && profile.languages.length > 0 && (
          <>
            <h3 style={styles.sidebarH3}>Sprachen</h3>
            <ul style={styles.sidebarUl}>
              {profile.languages.map((language: Language, index: number) => (
                <li key={index} style={styles.sidebarLi}>
                  {language.name} – {language.level}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      <div style={styles.content}>
        <div style={styles.name}>
          {profile.first_name} {profile.last_name}
        </div>
        
        {(profile.professional_title || (profile.experience && profile.experience.length > 0)) && (
          <div style={styles.title}>
            {profile.professional_title || profile.experience[0].position}
          </div>
        )}

        {profile.summary && (
          <div style={styles.section}>
            <h2 style={styles.sectionH2}>Über Mich</h2>
            <p>{profile.summary}</p>
          </div>
        )}

        {profile.experience && profile.experience.length > 0 && (
          <div style={styles.section}>
            <h2 style={styles.sectionH2}>Berufserfahrung</h2>
            {profile.experience
              .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
              .map((exp: Experience, index: number) => (
                <div key={index} style={styles.experienceEducation}>
                  <div style={styles.job}>
                    <div style={styles.jobTitle}>{exp.position}</div>
                    <div style={styles.jobCompany}>{exp.company}</div>
                    <div style={styles.jobDates}>
                      {formatDateRange(exp.startDate, exp.endDate, exp.current)}
                    </div>
                    {exp.description && (
                      <ul style={styles.jobUl}>
                        {exp.description.split('\n').filter(item => item.trim()).map((item, i) => (
                          <li key={i} style={styles.jobLi}>{item.trim()}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              ))}
          </div>
        )}

        {profile.education && profile.education.length > 0 && (
          <div style={styles.section}>
            <h2 style={styles.sectionH2}>Ausbildung</h2>
            {profile.education
              .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
              .map((edu: Education, index: number) => (
                <div key={index} style={styles.experienceEducation}>
                  <div style={styles.jobTitle}>
                    {edu.degree}{edu.field ? ` in ${edu.field}` : ''}
                  </div>
                  <div style={styles.jobCompany}>{edu.institution}</div>
                  <div style={styles.jobDates}>
                    {formatDateRange(edu.startDate, edu.endDate, edu.ongoing)}
                  </div>
                  {edu.description && (
                    <p style={{ fontSize: '0.9em', marginTop: '5px' }}>
                      {edu.description}
                    </p>
                  )}
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BudapestTemplate;
