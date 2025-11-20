import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { ResumeData } from '@/types/resume';

const styles = StyleSheet.create({
  page: {
    padding: 50,
    fontSize: 11,
    fontFamily: 'Times-Roman',
  },
  header: {
    marginBottom: 20,
    textAlign: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    paddingBottom: 15,
  },
  name: {
    fontSize: 24,
    fontFamily: 'Times-Bold',
    marginBottom: 8,
  },
  contactInfo: {
    fontSize: 10,
    marginTop: 3,
  },
  section: {
    marginTop: 18,
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: 'Times-Bold',
    marginBottom: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: '#000',
    paddingBottom: 3,
  },
  summary: {
    lineHeight: 1.6,
    textAlign: 'justify',
  },
  experienceItem: {
    marginBottom: 14,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  jobTitle: {
    fontSize: 12,
    fontFamily: 'Times-Bold',
  },
  dates: {
    fontSize: 10,
    fontStyle: 'italic',
  },
  company: {
    fontSize: 11,
    fontStyle: 'italic',
    marginBottom: 5,
  },
  description: {
    marginTop: 4,
    lineHeight: 1.5,
  },
  bullet: {
    marginLeft: 15,
    marginTop: 3,
  },
  skillsList: {
    lineHeight: 1.6,
  },
});

export const ClassicTemplate: React.FC<{ data: ResumeData }> = ({ data }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.name}>{data.personalInfo.name}</Text>
        <Text style={styles.contactInfo}>
          {data.personalInfo.location}
        </Text>
        <Text style={styles.contactInfo}>
          {data.personalInfo.phone} • {data.personalInfo.email}
        </Text>
        {data.personalInfo.linkedin && (
          <Text style={styles.contactInfo}>{data.personalInfo.linkedin}</Text>
        )}
      </View>

      {/* Summary */}
      {data.summary && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PROFESSIONAL SUMMARY</Text>
          <Text style={styles.summary}>{data.summary}</Text>
        </View>
      )}

      {/* Experience */}
      {data.experience.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PROFESSIONAL EXPERIENCE</Text>
          {data.experience.map((exp) => (
            <View key={exp.id} style={styles.experienceItem}>
              <View style={styles.jobHeader}>
                <Text style={styles.jobTitle}>{exp.position}</Text>
                <Text style={styles.dates}>
                  {exp.startDate} - {exp.endDate}
                </Text>
              </View>
              <Text style={styles.company}>
                {exp.company}, {exp.location}
              </Text>
              {exp.description.map((desc, idx) => (
                <Text key={idx} style={[styles.description, styles.bullet]}>
                  • {desc}
                </Text>
              ))}
            </View>
          ))}
        </View>
      )}

      {/* Education */}
      {data.education.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>EDUCATION</Text>
          {data.education.map((edu) => (
            <View key={edu.id} style={styles.experienceItem}>
              <View style={styles.jobHeader}>
                <Text style={styles.jobTitle}>
                  {edu.degree} in {edu.field}
                </Text>
                <Text style={styles.dates}>{edu.graduationDate}</Text>
              </View>
              <Text style={styles.company}>
                {edu.school}, {edu.location}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Skills */}
      {data.skills.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SKILLS</Text>
          <Text style={styles.skillsList}>{data.skills.join(' • ')}</Text>
        </View>
      )}
    </Page>
  </Document>
);
