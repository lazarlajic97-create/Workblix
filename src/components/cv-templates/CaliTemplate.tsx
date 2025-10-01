import React from 'react';
import { Profile, Education, Experience, Skill, Language } from '@/pages/Profile';

interface CaliTemplateProps {
  profile: Profile;
}

export const CaliTemplate: React.FC<CaliTemplateProps> = ({ profile }) => {
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
    left: {
      width: '32%',
      backgroundColor: '#243b6b',
      color: '#f7f7f7',
      padding: '40px 25px',
      boxSizing: 'border-box' as const,
    },
    photoPlaceholder: {
      width: '120px',
      height: '120px',
      borderRadius: '60px',
      backgroundColor: '#3f5a92',
      margin: '0 auto 20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '0.8em',
      color: '#a8c3f0',
    },
    leftH2: {
      fontSize: '1.6em',
      margin: '10px 0 4px',
      textAlign: 'center' as const,
    },
    leftP: {
      fontSize: '0.9em',
      textAlign: 'center' as const,
      margin: '4px 0',
    },
    leftH3: {
      fontSize: '1em',
      textTransform: 'uppercase' as const,
      marginTop: '25px',
      marginBottom: '8px',
      color: '#a8c3f0',
      borderBottom: '1px solid #3f5a92',
      paddingBottom: '4px',
    },
    leftFirstH3: {
      fontSize: '1em',
      textTransform: 'uppercase' as const,
      marginTop: '0',
      marginBottom: '8px',
      color: '#a8c3f0',
      borderBottom: '1px solid #3f5a92',
      paddingBottom: '4px',
    },
    leftUl: {
      listStyle: 'none',
      paddingLeft: '0',
      fontSize: '0.85em',
      margin: '0',
    },
    leftLi: {
      margin: '4px 0',
    },
    right: {
      width: '68%',
      padding: '50px',
      boxSizing: 'border-box' as const,
      backgroundColor: '#fff',
    },
    rightH1: {
      fontSize: '2.4em',
      margin: '0 0 5px 0',
      textTransform: 'uppercase' as const,
      letterSpacing: '1px',
      fontWeight: 'bold',
    },
    rightSpan: {
      fontSize: '1.1em',
      color: '#666',
      marginBottom: '20px',
      display: 'block',
    },
    section: {
      marginBottom: '25px',
    },
    sectionH2: {
      fontSize: '1.3em',
      textTransform: 'uppercase' as const,
      color: '#243b6b',
      marginBottom: '8px',
      borderBottom: '2px solid #243b6b',
      display: 'inline-block',
      paddingBottom: '4px',
      fontWeight: 'bold',
    },
    job: {
      marginBottom: '15px',
    },
    position: {
      fontWeight: 'bold',
    },
    company: {
      fontStyle: 'italic' as const,
      color: '#555',
    },
    dates: {
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
      <div style={styles.left}>
        {profile.include_photo_placeholder && (
          <div style={styles.photoPlaceholder}>
            FOTO
          </div>
        )}
        
        <h2 style={styles.leftH2}>
          {profile.first_name} {profile.last_name}
        </h2>
        {profile.experience && profile.experience.length > 0 && (
          <p style={styles.leftP}>
            {profile.experience[0].position}
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

        {profile.skills && profile.skills.length > 0 && (
          <>
            <h3 style={styles.leftH3}>Fähigkeiten</h3>
            <ul style={styles.leftUl}>
              {profile.skills.map((skill: Skill, index: number) => (
                <li key={index} style={styles.leftLi}>
                  <strong>{skill.name}</strong>
                  {skill.level && <div style={{ fontSize: '11px', color: '#999', marginTop: '2px' }}>{skill.level}</div>}
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

      <div style={styles.right}>
        <h1 style={styles.rightH1}>
          {profile.first_name} {profile.last_name}
        </h1>
        {profile.experience && profile.experience.length > 0 && (
          <span style={styles.rightSpan}>
            {profile.experience[0].position}
          </span>
        )}

        {profile.summary && (
          <div style={styles.section}>
            <h2 style={styles.sectionH2}>Profil</h2>
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
                  <div style={styles.position}>{exp.position}</div>
                  <div style={styles.company}>{exp.company}</div>
                  <div style={styles.dates}>
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
                  <div style={styles.position}>
                    {edu.degree}{edu.field ? ` in ${edu.field}` : ''}
                  </div>
                  <div style={styles.company}>{edu.institution}</div>
                  <div style={styles.dates}>
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

export default CaliTemplate;
