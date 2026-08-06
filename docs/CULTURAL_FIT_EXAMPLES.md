# Cultural Fit Analysis - Safe Framing Examples

## ❌ DANGEROUS (Absolute Claims)

### Startup vs Enterprise
```
❌ "You are a great fit for startups"
❌ "Best suited for enterprise environments"
❌ "You prefer fast-paced startup culture"
❌ "Your personality aligns with corporate structure"
```

### Work Style
```
❌ "You prefer collaborative environments"
❌ "You're an independent worker"
❌ "You thrive in structured settings"
❌ "You like autonomy"
```

---

## ✅ SAFE (Observable Patterns)

### Startup vs Enterprise
```
✅ "Your resume shows 5 cross-functional collaborations and 0 direct-reports, 
   which may align with environments that value broad influence over 
   head-count management."

✅ "Your experience spans 3 companies: 2 startups (10-50 employees) and 
   1 enterprise (5000+ employees), suggesting adaptability across 
   organization sizes."

✅ "Your resume shows 4 instances of 'built from scratch' and 'launched 0-to-1', 
   indicating experience in early-stage product development."
```

### Work Style
```
✅ "Your resume shows 5 instances of cross-functional collaboration 
   (engineering, design, sales, marketing, exec team), suggesting 
   experience working across diverse teams."

✅ "8 out of 10 bullets mention team collaboration, while 2 highlight 
   individual technical contributions, showing a balance of collaborative 
   and independent work."

✅ "Your resume mentions 'Agile', 'Scrum', and 'sprint planning' 6 times, 
   indicating experience with structured development processes."
```

### Leadership Style
```
✅ "Your resume shows 3 instances of mentoring (2 junior engineers, 
   1 intern program), suggesting coaching experience."

✅ "Your progression from IC → Tech Lead → Manager with 0→12 direct reports 
   shows growing people management responsibility."

✅ "Your bullets emphasize 'empowered team', 'delegated ownership', and 
   'coached 5 engineers', suggesting a supportive leadership approach."
```

---

## Key Principles

1. **Count observable instances** - "5 cross-functional collaborations" not "you prefer collaboration"
2. **Cite actual resume text** - Quote their words in evidence
3. **Use "may align" not "you are"** - Suggest possibilities, don't prescribe
4. **Focus on experience, not personality** - What they've DONE, not who they ARE
5. **Provide data, let user interpret** - "0 direct-reports" is a fact; they decide what it means

---

## Organization Type Alignment Scores

### What the scores mean:
- **Startup (0-100):** Based on experience at startups, NOT prediction of fit
- **Enterprise (0-100):** Based on experience at large companies, NOT prediction of fit
- **Score >80:** Significant experience at this type
- **Score 40-60:** Some exposure, not primary experience
- **Score <40:** Limited or no experience at this type

### Example reasoning:
```json
{
  "organizationTypeAlignment": {
    "startup": 85,
    "enterprise": 45
  }
}
```

**Good reasoning:**
"Your resume shows 6 years at 2 startups (Series A, Series B stage) and 2 years at 1 mid-size company (500 employees). Your startup score (85) reflects significant early-stage experience; your enterprise score (45) reflects limited large-company exposure."

**Bad reasoning:**
❌ "You're a great fit for startups (85 score) but not for enterprise (45 score)"

---

## Implementation in Prompts

All cultural fit analysis now includes:

1. **Explicit prohibition:**
   - "NEVER say 'You are a great fit for startups' or 'Best suited for enterprise'"

2. **Concrete example:**
   - "INSTEAD say: 'Your resume shows 5 cross-functional collaborations and 0 direct-reports, which may align with environments that value broad influence over head-count management'"

3. **Clear instruction:**
   - "For cultural fit: cite observable data NOT absolutes"
   - "Organization type scores reflect EXPERIENCE at those types, not predictions of fit"

4. **Observable pattern emphasis:**
   - "Never claim 'you prefer X' or 'you're a great fit for Y' - only state observable patterns"
