import React from 'react';
import { Profile, Education, Experience, Skill, Language } from '@/pages/Profile';

interface ChicagoTemplateProps {
  profile: Profile;
}

export const ChicagoTemplate: React.FC<ChicagoTemplateProps> = ({ profile }) => {
  const styles = {
    page: {
      display: 'flex',
      height: '297mm',
      width: '210mm',
      margin: 0,
      padding: 0,
      fontFamily: 'Arial, sans-serif',
      color: '#222',
      fontSize: '12px',
      lineHeight: '1.4',
      backgroundColor: 'white',
      boxSizing: 'border-box' as const,
    },
    resume: {
      display: 'flex',
      border: '2px solid #222',
      minHeight: '100%',
      width: '100%',
    },
    sidebar: {
      width: '28%',
      backgroundColor: '#f9f9f9',
      padding: '25px',
      boxSizing: 'border-box' as const,
      borderRight: '2px solid #222',
    },
    sidebarH3: {
      fontSize: '1em',
      textTransform: 'uppercase' as const,
      margin: '20px 0 6px',
      borderBottom: '1px solid #ddd',
      paddingBottom: '4px',
    },
    sidebarFirstH3: {
      fontSize: '1em',
      textTransform: 'uppercase' as const,
      margin: '0 0 6px',
      borderBottom: '1px solid #ddd',
      paddingBottom: '4px',
    },
    sidebarP: {
      fontSize: '0.85em',
      margin: '3px 0',
    },
    sidebarUl: {
      listStyle: 'none',
      paddingLeft: '0',
      margin: '0',
    },
    sidebarLi: {
      fontSize: '0.85em',
      margin: '3px 0',
    },
    main: {
      width: '72%',
      padding: '30px',
      boxSizing: 'border-box' as const,
    },
    name: {
      fontSize: '2em',
      textTransform: 'uppercase' as const,
      margin: '0',
      fontWeight: 'bold',
    },
    subtitle: {
      fontSize: '1em',
      color: '#666',
      marginBottom: '20px',
      marginTop: '5px',
    },
    section: {
      marginBottom: '25px',
    },
    sectionH2: {
      fontSize: '1.2em',
      textTransform: 'uppercase' as const,
      borderBottom: '1px solid #ddd',
      paddingBottom: '5px',
      marginBottom: '10px',
      fontWeight: 'bold',
    },
    item: {
      marginBottom: '15px',
    },
    role: {
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
    itemUl: {
      margin: '5px 0 10px 20px',
    },
    photoPlaceholder: {
      width: '100px',
      height: '100px',
      border: '2px solid #ddd',
      marginBottom: '20px',
      marginLeft: 'auto',
      marginRight: 'auto',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '0.8em',
      color: '#999',
      backgroundColor: '#fff',
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
      <div style={styles.resume}>
        <div style={styles.sidebar}>
          {profile.include_photo_placeholder && (
            <div style={styles.photoPlaceholder}>
              FOTO
            </div>
          )}
          
          <h3 style={styles.sidebarFirstH3}>Kontakt</h3>
          <p style={styles.sidebarP}>
            {profile.first_name} {profile.last_name}
          </p>
          {profile.city && profile.country && (
            <p style={styles.sidebarP}>{profile.city}, {profile.country}</p>
          )}
          {profile.phone && <p style={styles.sidebarP}>{profile.phone}</p>}
          {profile.email && <p style={styles.sidebarP}>{profile.email}</p>}

          {(profile.linkedin || profile.github || profile.website) && (
            <>
              <h3 style={styles.sidebarH3}>Links</h3>
              <ul style={styles.sidebarUl}>
                {profile.linkedin && (
                  <li style={styles.sidebarLi}>
                    <a href={profile.linkedin} style={{ color: '#222', textDecoration: 'none' }}>
                      LinkedIn
                    </a>
                  </li>
                )}
                {profile.github && (
                  <li style={styles.sidebarLi}>
                    <a href={profile.github} style={{ color: '#222', textDecoration: 'none' }}>
                      GitHub
                    </a>
                  </li>
                )}
                {profile.website && (
                  <li style={styles.sidebarLi}>
                    <a href={profile.website} style={{ color: '#222', textDecoration: 'none' }}>
                      Website
                    </a>
                  </li>
                )}
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
          <div style={styles.name}>
            {profile.first_name} {profile.last_name}
          </div>
          {profile.experience && profile.experience.length > 0 && (
            <div style={styles.subtitle}>
              {profile.experience[0].position}
            </div>
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
                  <div key={index} style={styles.item}>
                    <div style={styles.role}>{exp.position}</div>
                    <div style={styles.company}>{exp.company}</div>
                    <div style={styles.dates}>
                      {formatDateRange(exp.startDate, exp.endDate, exp.current)}
                    </div>
                    {exp.description && (
                      <ul style={styles.itemUl}>
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
                  <div key={index} style={styles.item}>
                    <div style={styles.role}>
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

          {profile.skills && profile.skills.length > 0 && (
            <div style={styles.section}>
              <h2 style={styles.sectionH2}>Kompetenzen</h2>
              <ul style={styles.itemUl}>
                {profile.skills.map((skill: Skill, index: number) => (
                  <li key={index}>
                    <strong>{skill.name}</strong>
                    {skill.level && ` - ${skill.level}`}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChicagoTemplate;
