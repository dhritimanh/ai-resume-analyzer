import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { ResumeData } from '@/types/resume';

const styles = StyleSheet.create({
  page: {
    flexDirection: 'row',
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  leftColumn: {
    width: '35%',
    backgroundColor: '#1e40af',
    padding: 30,
    color: '#ffffff',
  },
  rightColumn: {
    width: '65%',
    padding: 30,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#ffffff',
  },
  contactItem: {
    fontSize: 9,
    marginBottom: 8,
    color: '#e0e7ff',
  },
  leftSection: {
    marginTop: 20,
  },
  leftSectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#ffffff',
    borderBottomWidth: 2,
    borderBottomColor: '#60a5fa',
    paddingBottom: 5,
  },
  skillItem: {
    fontSize: 9,
    marginBottom: 6,
    color: '#e0e7ff',
  },
  rightSection: {
    marginBottom: 20,
  },
  rightSectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
    borderBottomWidth: 2,
    borderBottomColor: '#2563eb',
    paddingBottom: 5,
  },
  summary: {
    fontSize: 10,
    lineHeight: 1.5,
    color: '#374151',
    marginBottom: 15,
  },
  experienceItem: {
    marginBottom: 15,
  },
  jobTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  company: {
    fontSize: 10,
    color: '#4b5563',
    marginTop: 2,
  },
  dates: {
    fontSize: 9,
    color: '#6b7280',
    marginTop: 2,
    fontStyle: 'italic',
  },
  description: {
    fontSize: 9,
    marginTop: 4,
    lineHeight: 1.4,
    color: '#374151',
  },
  bullet: {
    marginLeft: 10,
    marginTop: 3,
  },
  educationItem: {
    marginBottom: 12,
  },
});

export const ModernTemplate: React.FC<{ data: ResumeData }> = ({ data }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Left Column - Sidebar */}
      <View style={styles.leftColumn}>
        {/* Name */}
        <Text style={styles.name}>{data.personalInfo.name}</Text>
        
        {/* Contact Info */}
        <View>
          {data.personalInfo.email && (
            <Text style={styles.contactItem}>✉ {data.personalInfo.email}</Text>
          )}
          {data.personalInfo.phone && (
            <Text style={styles.contactItem}>☎ {data.personalInfo.phone}</Text>
          )}
          {data.personalInfo.location && (
            <Text style={styles.contactItem}>📍 {data.personalInfo.location}</Text>
          )}
          {data.personalInfo.linkedin && (
            <Text style={styles.contactItem}>🔗 {data.personalInfo.linkedin}</Text>
          )}
          {data.personalInfo.website && (
            <Text style={styles.contactItem}>🌐 {data.personalInfo.website}</Text>
          )}
          {data.personalInfo.github && (
            <Text style={styles.contactItem}>💻 {data.personalInfo.github}</Text>
          )}
          {data.personalInfo.portfolio && (
            <Text style={styles.contactItem}>📁 {data.personalInfo.portfolio}</Text>
          )}
        </View>

        {/* Skills */}
        {data.skills.length > 0 && (
          <View style={styles.leftSection}>
            <Text style={styles.leftSectionTitle}>SKILLS</Text>
            {data.skills.map((skill, idx) => (
              <Text key={idx} style={styles.skillItem}>
                • {skill}
              </Text>
            ))}
          </View>
        )}

        {/* Education */}
        {data.education.length > 0 && (
          <View style={styles.leftSection}>
            <Text style={styles.leftSectionTitle}>EDUCATION</Text>
            {data.education.map((edu) => (
              <View key={edu.id} style={styles.educationItem}>
                <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#ffffff', marginBottom: 3 }}>
                  {edu.degree}
                </Text>
                {edu.field && (
                  <Text style={{ fontSize: 9, color: '#e0e7ff', marginBottom: 2 }}>
                    {edu.field}
                  </Text>
                )}
                <Text style={{ fontSize: 9, color: '#cbd5e1', marginBottom: 2 }}>
                  {edu.school}
                </Text>
                {edu.graduationDate && (
                  <Text style={{ fontSize: 8, color: '#94a3b8', fontStyle: 'italic' }}>
                    {edu.graduationDate}
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Right Column - Main Content */}
      <View style={styles.rightColumn}>
        {/* Summary */}
        {data.summary && (
          <View style={styles.rightSection}>
            <Text style={styles.rightSectionTitle}>Professional Summary</Text>
            <Text style={styles.summary}>{data.summary}</Text>
          </View>
        )}

        {/* Experience */}
        {data.experience.length > 0 && (
          <View style={styles.rightSection}>
            <Text style={styles.rightSectionTitle}>Experience</Text>
            {data.experience.map((exp) => (
              <View key={exp.id} style={styles.experienceItem}>
                <Text style={styles.jobTitle}>{exp.position}</Text>
                <Text style={styles.company}>
                  {exp.company}{exp.location ? ` | ${exp.location}` : ''}
                </Text>
                {(exp.startDate || exp.endDate) && (
                  <Text style={styles.dates}>
                    {exp.startDate} {exp.startDate && exp.endDate ? '- ' : ''}{exp.endDate}
                  </Text>
                )}
                {exp.description.map((desc, idx) => (
                  desc.trim() && (
                    <Text key={idx} style={[styles.description, styles.bullet]}>
                      • {desc}
                    </Text>
                  )
                ))}
              </View>
            ))}
          </View>
        )}

        {/* Custom Sections */}
        {data.customSections && data.customSections.map((section) => (
          <View key={section.id} style={styles.rightSection}>
            <Text style={styles.rightSectionTitle}>{section.title}</Text>
            
            {/* List type */}
            {section.type === 'list' && Array.isArray(section.content) && (
              <View>
                {(section.content as string[]).map((item, idx) => (
                  <Text key={idx} style={{ fontSize: 9, marginBottom: 4, color: '#374151' }}>
                    • {item}
                  </Text>
                ))}
              </View>
            )}

            {/* Text type */}
            {section.type === 'text' && typeof section.content === 'string' && (
              <Text style={{ fontSize: 10, lineHeight: 1.5, color: '#374151' }}>
                {section.content}
              </Text>
            )}

            {/* Items type */}
            {section.type === 'items' && Array.isArray(section.content) && (
              <View>
                {(section.content as any[]).map((item, idx) => (
                  <View key={item.id || idx} style={styles.experienceItem}>
                    <Text style={styles.jobTitle}>{item.title}</Text>
                    {item.subtitle && (
                      <Text style={{ fontSize: 9, color: '#4b5563', marginTop: 2 }}>
                        {item.subtitle}
                      </Text>
                    )}
                    {item.date && (
                      <Text style={styles.dates}>{item.date}</Text>
                    )}
                    {item.description && Array.isArray(item.description) && item.description.map((desc: string, descIdx: number) => (
                      desc.trim() && (
                        <Text key={descIdx} style={[styles.description, styles.bullet]}>
                          • {desc}
                        </Text>
                      )
                    ))}
                  </View>
                ))}
              </View>
            )}
          </View>
        ))}
      </View>
    </Page>
  </Document>
);
