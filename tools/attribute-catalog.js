/**
 * Attribute Catalog — Maps the 78 core attributes to clusters and core dimensions.
 * Source: Innermetrix Attribute Index, verified against orgharmony-psychometric-validator/SKILL.md
 */

export const ATTRIBUTE_CATALOG = [
  // HEART / EMPATHY (External)
  { rank: 1, attribute: "Accountability For Others", cluster: "Heart", core_dimension: "Empathy" },
  { rank: 3, attribute: "Attitude Toward Others", cluster: "Heart", core_dimension: "Empathy" },
  { rank: 9, attribute: "Conveying Role Value", cluster: "Heart", core_dimension: "Empathy" },
  { rank: 12, attribute: "Developing Others", cluster: "Heart", core_dimension: "Empathy" },
  { rank: 13, attribute: "Diplomacy", cluster: "Heart", core_dimension: "Empathy" },
  { rank: 15, attribute: "Empathetic Outlook", cluster: "Heart", core_dimension: "Empathy" },
  { rank: 18, attribute: "Evaluating What Is Said", cluster: "Heart", core_dimension: "Empathy" },
  { rank: 21, attribute: "Freedom From Prejudices", cluster: "Heart", core_dimension: "Empathy" },
  { rank: 22, attribute: "Gaining Commitment", cluster: "Heart", core_dimension: "Empathy" },
  { rank: 25, attribute: "Human Awareness", cluster: "Heart", core_dimension: "Empathy" },
  { rank: 30, attribute: "Leading Others", cluster: "Heart", core_dimension: "Empathy" },
  { rank: 39, attribute: "Personal Relationships", cluster: "Heart", core_dimension: "Empathy" },
  { rank: 40, attribute: "Persuading Others", cluster: "Heart", core_dimension: "Empathy" },
  { rank: 52, attribute: "Relating To Others", cluster: "Heart", core_dimension: "Empathy" },
  { rank: 71, attribute: "Sensitivity To Others", cluster: "Heart", core_dimension: "Empathy" },
  { rank: 76, attribute: "Understanding Attitude", cluster: "Heart", core_dimension: "Empathy" },
  { rank: 77, attribute: "Understanding Motivational Needs", cluster: "Heart", core_dimension: "Empathy" },

  // HAND / PRACTICAL THINKING (External)
  { rank: 2, attribute: "Attention To Detail", cluster: "Hand", core_dimension: "Practical Thinking" },
  { rank: 7, attribute: "Concrete Organization", cluster: "Hand", core_dimension: "Practical Thinking" },
  { rank: 34, attribute: "Monitoring Others", cluster: "Hand", core_dimension: "Practical Thinking" },
  { rank: 41, attribute: "Practical Thinking", cluster: "Hand", core_dimension: "Practical Thinking" },
  { rank: 43, attribute: "Problem and Situation Analysis", cluster: "Hand", core_dimension: "Practical Thinking" },
  { rank: 44, attribute: "Problem Management", cluster: "Hand", core_dimension: "Practical Thinking" },
  { rank: 45, attribute: "Problem Solving", cluster: "Hand", core_dimension: "Practical Thinking" },
  { rank: 47, attribute: "Project Scheduling", cluster: "Hand", core_dimension: "Practical Thinking" },
  { rank: 48, attribute: "Quality Orientation", cluster: "Hand", core_dimension: "Practical Thinking" },
  { rank: 55, attribute: "Results Orientation", cluster: "Hand", core_dimension: "Practical Thinking" },
  { rank: 58, attribute: "Seeing Potential Problems", cluster: "Hand", core_dimension: "Practical Thinking" },
  { rank: 78, attribute: "Using Common Sense", cluster: "Hand", core_dimension: "Practical Thinking" },

  // HEAD / SYSTEMS JUDGMENT (External)
  { rank: 6, attribute: "Conceptual Thinking", cluster: "Head", core_dimension: "Systems Judgment" },
  { rank: 11, attribute: "Creativity", cluster: "Head", core_dimension: "Systems Judgment" },
  { rank: 27, attribute: "Integrative Ability", cluster: "Head", core_dimension: "Systems Judgment" },
  { rank: 28, attribute: "Intuitive Decision Making", cluster: "Head", core_dimension: "Systems Judgment" },
  { rank: 31, attribute: "Long Range Planning", cluster: "Head", core_dimension: "Systems Judgment" },
  { rank: 42, attribute: "Proactive Thinking", cluster: "Head", core_dimension: "Systems Judgment" },
  { rank: 74, attribute: "Systems Judgment", cluster: "Head", core_dimension: "Systems Judgment" },
  { rank: 75, attribute: "Theoretical Problem Solving", cluster: "Head", core_dimension: "Systems Judgment" },

  // SELF-ESTEEM (Internal)
  { rank: 5, attribute: "Balanced Decision Making", cluster: "Self-Esteem", core_dimension: "Self-Esteem" },
  { rank: 14, attribute: "Emotional Control", cluster: "Self-Esteem", core_dimension: "Self-Esteem" },
  { rank: 23, attribute: "Handling Rejection", cluster: "Self-Esteem", core_dimension: "Self-Esteem" },
  { rank: 24, attribute: "Handling Stress", cluster: "Self-Esteem", core_dimension: "Self-Esteem" },
  { rank: 57, attribute: "Role Confidence", cluster: "Self-Esteem", core_dimension: "Self-Esteem" },
  { rank: 60, attribute: "Self Confidence", cluster: "Self-Esteem", core_dimension: "Self-Esteem" },
  { rank: 61, attribute: "Self Control", cluster: "Self-Esteem", core_dimension: "Self-Esteem" },
  { rank: 64, attribute: "Self Esteem", cluster: "Self-Esteem", core_dimension: "Self-Esteem" },

  // ROLE AWARENESS (Internal)
  { rank: 4, attribute: "Attitude Toward Honesty", cluster: "Role Awareness", core_dimension: "Role Awareness" },
  { rank: 8, attribute: "Consistency and Reliability", cluster: "Role Awareness", core_dimension: "Role Awareness" },
  { rank: 10, attribute: "Correcting Others", cluster: "Role Awareness", core_dimension: "Role Awareness" },
  { rank: 20, attribute: "Following Directions", cluster: "Role Awareness", core_dimension: "Role Awareness" },
  { rank: 29, attribute: "Job Ethic", cluster: "Role Awareness", core_dimension: "Role Awareness" },
  { rank: 33, attribute: "Meeting Standards", cluster: "Role Awareness", core_dimension: "Role Awareness" },
  { rank: 36, attribute: "Personal Accountability", cluster: "Role Awareness", core_dimension: "Role Awareness" },
  { rank: 53, attribute: "Respect For Policies", cluster: "Role Awareness", core_dimension: "Role Awareness" },
  { rank: 54, attribute: "Respect For Property", cluster: "Role Awareness", core_dimension: "Role Awareness" },
  { rank: 56, attribute: "Role Awareness", cluster: "Role Awareness", core_dimension: "Role Awareness" },
  { rank: 63, attribute: "Self Discipline and Sense of Duty", cluster: "Role Awareness", core_dimension: "Role Awareness" },

  // SELF-DIRECTION (Internal)
  { rank: 16, attribute: "Enjoyment Of The Job", cluster: "Self-Direction", core_dimension: "Self-Direction" },
  { rank: 17, attribute: "Evaluating Others", cluster: "Self-Direction", core_dimension: "Self-Direction" },
  { rank: 19, attribute: "Flexibility", cluster: "Self-Direction", core_dimension: "Self-Direction" },
  { rank: 26, attribute: "Initiative", cluster: "Self-Direction", core_dimension: "Self-Direction" },
  { rank: 32, attribute: "Material Possessions", cluster: "Self-Direction", core_dimension: "Self-Direction" },
  { rank: 35, attribute: "Persistence", cluster: "Self-Direction", core_dimension: "Self-Direction" },
  { rank: 37, attribute: "Personal Commitment", cluster: "Self-Direction", core_dimension: "Self-Direction" },
  { rank: 38, attribute: "Personal Drive", cluster: "Self-Direction", core_dimension: "Self-Direction" },
  { rank: 46, attribute: "Project and Goal Focus", cluster: "Self-Direction", core_dimension: "Self-Direction" },
  { rank: 49, attribute: "Realistic Expectations", cluster: "Self-Direction", core_dimension: "Self-Direction" },
  { rank: 50, attribute: "Realistic Goal Setting For Others", cluster: "Self-Direction", core_dimension: "Self-Direction" },
  { rank: 51, attribute: "Realistic Personal Goal Setting", cluster: "Self-Direction", core_dimension: "Self-Direction" },
  { rank: 59, attribute: "Self Assessment", cluster: "Self-Direction", core_dimension: "Self-Direction" },
  { rank: 62, attribute: "Self Direction", cluster: "Self-Direction", core_dimension: "Self-Direction" },
  { rank: 65, attribute: "Self Improvement", cluster: "Self-Direction", core_dimension: "Self-Direction" },
  { rank: 66, attribute: "Self Management", cluster: "Self-Direction", core_dimension: "Self-Direction" },
  { rank: 67, attribute: "Self Starting Ability", cluster: "Self-Direction", core_dimension: "Self-Direction" },
  { rank: 68, attribute: "Sense of Belonging", cluster: "Self-Direction", core_dimension: "Self-Direction" },
  { rank: 69, attribute: "Sense of Mission", cluster: "Self-Direction", core_dimension: "Self-Direction" },
  { rank: 70, attribute: "Sense of Timing", cluster: "Self-Direction", core_dimension: "Self-Direction" },
  { rank: 72, attribute: "Status and Recognition", cluster: "Self-Direction", core_dimension: "Self-Direction" },
  { rank: 73, attribute: "Surrendering Control", cluster: "Self-Direction", core_dimension: "Self-Direction" },
];

/**
 * Build a lookup map (attribute name -> catalog entry) for quick access.
 */
export function buildAttributeMap() {
  const map = new Map();
  ATTRIBUTE_CATALOG.forEach(entry => {
    map.set(entry.attribute, entry);
  });
  return map;
}

/**
 * Get the count of attributes in the catalog.
 */
export function getAttributeCount() {
  return ATTRIBUTE_CATALOG.length;
}
