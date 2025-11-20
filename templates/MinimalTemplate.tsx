import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { ResumeData } from '@/types/resume';

const styles = StyleSheet.create({
  page: {
    padding: 60,
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: '#1f2937',
  },
  header: {
    marginBottom: 30,
  },
  name: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 10,
    letterSpacing: -0.5,
  },
  contactInfo: {
    fontSize: 9,
    color: '#6b7280',
    marginTop: 2,
  },
  section: {
    marginTop: 25,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 12,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: '#111827',
  },
  summary: {
    lineHeight: 1.7,
    color: '#4b5563',
  },
  experienceItem: {
    marginBottom: 16,
  },
  jobRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  jobTitle: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  dates: {
    fontSize: 9,
    color: '#9ca3af',
  },
  company: {
    fontSize: 10,
    color: '#6b7280',
    marginBottom: 6,
  },
  description: {
    marginTop: 3,
    lineHeight: 1.6,
    color: '#4b5563',
  },
  bullet: {
    marginLeft: 12,
    marginTop: 3,
  },
  skillsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skill: {
    fontSize: 9,
    color: '#4b5563',
    marginRight: 12,
    marginBottom: 4,
  },
});

export const MinimalTemplate: React.FC<{ data: ResumeData }> = ({ data }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.name}>{data.personalInfo.name}</Text>
        <Text style={styles.contactInfo}>
          {data.personalInfo.email}  •  {data.personalInfo.phone}  •  {data.personalInfo.location}
        </Text>
        {data.personalInfo.linkedin && (
          <Text style={styles.contactInfo}>{data.personalInfo.linkedin}</Text>
        )}
      </View>

      {/* Summary */}
      {data.summary && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.summary}>{data.summary}</Text>
        </View>
      )}

      {/* Experience */}
      {data.experience.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Experience</Text>
          {data.experience.map((exp) => (
            <View key={exp.id} style={styles.experienceItem}>
              <View style={styles.jobRow}>
                <Text style={styles.jobTitle}>{exp.position}</Text>
                <Text style={styles.dates}>
                  {exp.startDate} — {exp.endDate}
                </Text>
              </View>
              <Text style={styles.company}>
                {exp.company}  •  {exp.location}
              </Text>
              {exp.description.map((desc, idx) => (
                <Text key={idx} style={[styles.description, styles.bullet]}>
                  {desc}
                </Text>
              ))}
            </View>
          ))}
        </View>
      )}

      {/* Education */}
      {data.education.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Education</Text>
          {data.education.map((edu) => (
            <View key={edu.id} style={styles.experienceItem}>
              <View style={styles.jobRow}>
                <Text style={styles.jobTitle}>
                  {edu.degree}, {edu.field}
                </Text>
                <Text style={styles.dates}>{edu.graduationDate}</Text>
              </View>
              <Text style={styles.company}>
                {edu.school}  •  {edu.location}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Skills */}
      {data.skills.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Skills</Text>
          <View style={styles.skillsGrid}>
            {data.skills.map((skill, idx) => (
              <Text key={idx} style={styles.skill}>
                {skill}
              </Text>
            ))}
          </View>
        </View>
      )}
    </Page>
  </Document>
);
