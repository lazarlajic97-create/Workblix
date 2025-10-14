import React from 'react';
import { Profile, Education, Experience, Skill, Language } from '@/pages/Profile';

interface RigaTemplateProps {
  profile: Profile;
}

export const RigaTemplate: React.FC<RigaTemplateProps> = ({ profile }) => {
  const styles = {
    page: {
      height: '297mm',
      width: '210mm',
      margin: 0,
      padding: 0,
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#f5f7fa',
      color: '#222',
      fontSize: '12px',
      lineHeight: '1.4',
      boxSizing: 'border-box' as const,
    },
    header: {
      backgroundColor: '#202b45',
      color: '#fff',
      padding: '40px 30px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '30px',
    },
    headerContent: {
      display: 'flex',
      alignItems: 'center',
      gap: '30px',
    },
    headerText: {
      textAlign: 'left' as const,
    },
    headerH1: {
      margin: '0',
      fontSize: '2.4em',
      textTransform: 'uppercase' as const,
      letterSpacing: '2px',
    },
    headerP: {
      margin: '5px 0 0 0',
      fontSize: '1.1em',
      fontStyle: 'italic' as const,
      color: '#d6dced',
    },
    container: {
      display: 'flex',
      padding: '30px',
    },
    sidebar: {
      width: '35%',
      paddingRight: '30px',
      boxSizing: 'border-box' as const,
    },
    photoPlaceholder: {
      width: '120px',
      height: '120px',
      borderRadius: '60px',
      backgroundColor: '#3f5a92',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '0.9em',
      color: '#a8c3f0',
      flexShrink: 0,
    },
    sidebarH3: {
      textTransform: 'uppercase' as const,
      fontSize: '1em',
      marginTop: '30px',
      marginBottom: '6px',
      color: '#c4972f',
    },
    sidebarFirstH3: {
      textTransform: 'uppercase' as const,
      fontSize: '1em',
      marginTop: '0',
      marginBottom: '6px',
      color: '#c4972f',
    },
    sidebarP: {
      fontSize: '0.9em',
      margin: '3px 0',
      lineHeight: '1.4',
    },
    sidebarUl: {
      listStyle: 'none',
      paddingLeft: '0',
      margin: '0',
    },
    sidebarLi: {
      fontSize: '0.9em',
      margin: '3px 0',
      lineHeight: '1.4',
    },
    main: {
      width: '65%',
      boxSizing: 'border-box' as const,
    },
    section: {
      marginBottom: '25px',
    },
    sectionH2: {
      fontSize: '1.3em',
      textTransform: 'uppercase' as const,
      marginBottom: '8px',
      color: '#202b45',
      borderBottom: '2px solid #c4972f',
      display: 'inline-block',
      paddingBottom: '4px',
      fontWeight: 'bold',
    },
    job: {
      marginBottom: '15px',
    },
    jobTitle: {
      fontWeight: 'bold',
    },
    jobCompany: {
      fontStyle: 'italic' as const,
      color: '#555',
    },
    jobDates: {
      fontSize: '0.8em',
      color: '#777',
    },
    jobUl: {
      margin: '5px 0 10px 20px',
    },
  };

  const formatDateRange = (startDate: string, endDate: string, ongoing?: boolean) => {
    if (ongoing) {
      return `${startDate} – Heute`;
    }
    return endDate ? `${startDate} – ${endDate}` : startDate;
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div style={styles.headerContent}>
          {profile.include_photo_placeholder && (
            <div style={styles.photoPlaceholder}>
              FOTO
            </div>
          )}
          
          <div style={styles.headerText}>
            <h1 style={styles.headerH1}>
              {profile.first_name} {profile.last_name}
            </h1>
            {(profile.professional_title || (profile.experience && profile.experience.length > 0)) && (
              <p style={styles.headerP}>
                {profile.professional_title || profile.experience[0].position}
              </p>
            )}
          </div>
        </div>
      </div>
      
      <div style={styles.container}>
        <div style={styles.sidebar}>
          <h3 style={styles.sidebarFirstH3}>Kontakt</h3>
          <p style={styles.sidebarP}>
            {profile.city && profile.country && (
              <>{profile.city}, {profile.country}<br /></>
            )}
            {profile.phone && <>{profile.phone}<br /></>}
            {profile.email && profile.email}
          </p>

          {profile.summary && (
            <>
              <h3 style={styles.sidebarH3}>Über mich</h3>
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

        <div style={styles.main}>
          {profile.experience && profile.experience.length > 0 && (
            <div style={styles.section}>
              <h2 style={styles.sectionH2}>Berufserfahrung</h2>
              {profile.experience
                .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
                .map((exp: Experience, index: number) => (
                  <div key={index} style={styles.job}>
                    <div style={styles.jobTitle}>{exp.position}</div>
                    <div style={styles.jobCompany}>{exp.company}</div>
                    <div style={styles.jobDates}>
                      {formatDateRange(exp.startDate, exp.endDate, exp.current)}
                    </div>
                    {exp.description && (
                      <ul style={styles.jobUl}>
                        {exp.description.split('\n').filter(item => item.trim()).map((item, i) => (
                          <li key={i}>{item.trim()}</li>
                        ))}
                      </ul>
                    )}
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
                  <div key={index} style={styles.job}>
                    <div style={styles.jobTitle}>
                      {edu.degree}{edu.field ? ` in ${edu.field}` : ''}
                    </div>
                    <div style={styles.jobCompany}>{edu.institution}</div>
                    <div style={styles.jobDates}>
                      {formatDateRange(edu.startDate, edu.endDate, edu.ongoing)}
                    </div>
                    {edu.description && <p style={styles.sidebarP}>{edu.description}</p>}
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RigaTemplate;
