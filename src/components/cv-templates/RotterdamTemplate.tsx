import React from 'react';
import { Profile, Education, Experience, Skill, Language } from '@/pages/Profile';

interface RotterdamTemplateProps {
  profile: Profile;
}

export const RotterdamTemplate: React.FC<RotterdamTemplateProps> = ({ profile }) => {
  const styles = {
    page: {
      display: 'flex',
      height: '297mm',
      width: '210mm',
      margin: 0,
      padding: 0,
      fontFamily: 'Arial, sans-serif',
      color: '#333',
      fontSize: '12px',
      lineHeight: '1.4',
      boxSizing: 'border-box' as const,
    },
    leftPanel: {
      width: '30%',
      backgroundColor: '#f5ece2',
      padding: '30px 20px',
      boxSizing: 'border-box' as const,
      display: 'flex',
      flexDirection: 'column' as const,
      justifyContent: 'flex-start' as const,
    },
    photoPlaceholder: {
      width: '120px',
      height: '120px',
      borderRadius: '60px',
      backgroundColor: '#ddd',
      margin: '0 auto 20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '0.8em',
      color: '#999',
    },
    leftH2: {
      fontSize: '1.5em',
      margin: '10px 0 5px',
      textAlign: 'center' as const,
    },
    leftH3: {
      marginTop: '30px',
      marginBottom: '5px',
      fontSize: '1em',
      textTransform: 'uppercase' as const,
      letterSpacing: '1px',
      color: '#555',
    },
    leftFirstH3: {
      marginTop: '0',
      marginBottom: '5px',
      fontSize: '1em',
      textTransform: 'uppercase' as const,
      letterSpacing: '1px',
      color: '#555',
    },
    leftP: {
      fontSize: '0.9em',
      lineHeight: '1.4',
      margin: '4px 0',
    },
    leftUl: {
      listStyle: 'none',
      paddingLeft: '0',
      margin: '0',
    },
    leftLi: {
      fontSize: '0.9em',
      lineHeight: '1.4',
      margin: '4px 0',
    },
    rightPanel: {
      width: '70%',
      backgroundColor: '#ffffff',
      padding: '40px',
      boxSizing: 'border-box' as const,
    },
    header: {
      borderBottom: '2px solid #e2d6c4',
      marginBottom: '20px',
      paddingBottom: '10px',
    },
    headerH1: {
      margin: '0',
      fontSize: '2.2em',
      textTransform: 'uppercase' as const,
      letterSpacing: '2px',
      fontWeight: 'bold',
    },
    headerSpan: {
      display: 'block',
      fontSize: '1.1em',
      color: '#777',
      marginTop: '4px',
    },
    section: {
      marginBottom: '25px',
    },
    sectionH2: {
      fontSize: '1.2em',
      textTransform: 'uppercase' as const,
      borderBottom: '1px solid #e2d6c4',
      paddingBottom: '5px',
      marginBottom: '10px',
      fontWeight: 'bold',
    },
    job: {
      marginBottom: '15px',
    },
    jobTitle: {
      fontWeight: 'bold',
    },
    jobCompany: {
      color: '#555',
      fontStyle: 'italic' as const,
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
      <div style={styles.leftPanel}>
        {profile.include_photo_placeholder && (
          <div style={styles.photoPlaceholder}>
            FOTO
          </div>
        )}
        
        <h2 style={styles.leftH2}>
          {profile.first_name} {profile.last_name}
        </h2>
        {(profile.professional_title || (profile.experience && profile.experience.length > 0)) && (
          <p style={{ ...styles.leftP, textAlign: 'center' }}>
            {profile.professional_title || profile.experience[0].position}
          </p>
        )}

        <h3 style={styles.leftFirstH3}>Kontakt</h3>
        <p style={styles.leftP}>
          {profile.city && profile.country && (
            <>{profile.city}, {profile.country}<br /></>
          )}
          {profile.phone && <>{profile.phone}<br /></>}
          {profile.email && profile.email}
        </p>

        {(profile.linkedin || profile.github || profile.website) && (
          <>
            <h3 style={styles.leftH3}>Links</h3>
            <ul style={styles.leftUl}>
              {profile.linkedin && (
                <li style={styles.leftLi}>
                  <a href={profile.linkedin} style={{ color: '#333', textDecoration: 'none' }}>
                    LinkedIn
                  </a>
                </li>
              )}
              {profile.github && (
                <li style={styles.leftLi}>
                  <a href={profile.github} style={{ color: '#333', textDecoration: 'none' }}>
                    GitHub
                  </a>
                </li>
              )}
              {profile.website && (
                <li style={styles.leftLi}>
                  <a href={profile.website} style={{ color: '#333', textDecoration: 'none' }}>
                    Portfolio
                  </a>
                </li>
              )}
            </ul>
          </>
        )}

        {profile.skills && profile.skills.length > 0 && (
          <>
            <h3 style={styles.leftH3}>Fähigkeiten</h3>
            <ul style={styles.leftUl}>
              {profile.skills.map((skill: Skill, index: number) => (
                <li key={index} style={styles.leftLi}>
                  <strong>{skill.name}</strong>
                  {skill.level && <div style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>{skill.level}</div>}
                </li>
              ))}
            </ul>
          </>
        )}

        {profile.languages && profile.languages.length > 0 && (
          <>
            <h3 style={styles.leftH3}>Sprachen</h3>
            <ul style={styles.leftUl}>
              {profile.languages.map((language: Language, index: number) => (
                <li key={index} style={styles.leftLi}>
                  {language.name} – {language.level}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      <div style={styles.rightPanel}>
        <div style={styles.header}>
          <h1 style={styles.headerH1}>
            {profile.first_name} {profile.last_name}
          </h1>
          {(profile.professional_title || (profile.experience && profile.experience.length > 0)) && (
            <span style={styles.headerSpan}>
              {profile.professional_title || profile.experience[0].position}
            </span>
          )}
        </div>

        {profile.summary && (
          <div style={styles.section}>
            <h2 style={styles.sectionH2}>Über mich</h2>
            <p>{profile.summary}</p>
          </div>
        )}

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
                  {edu.description && <p>{edu.description}</p>}
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RotterdamTemplate;
