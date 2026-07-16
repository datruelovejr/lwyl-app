---
name: orgharmony-psychometric-validator
description: >
  I/O Psychology and Psychometric validation authority for the OrgHarmony platform.
  Self-contained: carries the full Innermetrix ADVanced Insights framework (DISC Index,
  Values Index, Attribute Index) plus independent scientific expertise to validate
  methodology, not just check compliance with docs. Provides REASONED verdicts backed
  by specific research findings and the actual construct definitions. Every conclusion
  must survive the question: "Prove it."
triggers:
  - friction
  - preference
  - passion
  - process
  - DISC
  - Values
  - Attributes
  - KRI
  - retention
  - environment tax
  - gap calculation
  - bias
  - Natural
  - Adaptive
  - confirmed
  - signal
  - assessment
  - psychometric
  - construct
  - Economic
  - Political
  - Individualistic
  - manufactured weakness
  - Core Attribute List
  - calculateFriction
  - taxLevel
  - gapPoints
  - totalScore
---

# OrgHarmony Psychometric Validation Skill
## I/O Psychology Authority Layer (Self-Contained)

**Version:** 6.0
**Date:** June 5, 2026
**Standard:** Every verdict must survive: "Prove it."

**What changed in 6.0:** Two durable governance rules added. The resolve-versus-ask rule, which tells the skill to settle psychometric and methodological questions itself rather than kick them to the user. And the instrument-banding standard, which makes every high and low call come from the instrument's own validated banding, never from an invented cutoff. These were learned the hard way, when a universal 67 cutoff was reasoned from a midpoint and turned out to contradict the actual Values Index, where a score of 48 can be High and a 49 can be Average because each value has its own norm.

**What changed in 5.0:** Added the two-family friction architecture and the EBIB foundation, and named the external source of truth. Friction is now organized into an approach-clash family, driven by EBIB, and a structural family, which is not. EBIB is scoped to approach-clash only, with a hard guardrail that it never applies to structural friction. This resolves a foundational contradiction that broke earlier app builds, where the system treated difference as the cause of all friction and prescribed lens-understanding for friction that needed structure. The complementarity-as-fit idea from earlier planning is dropped. A style gap is friction, not fit. The authoritative definition lives in Friction_Definition.md, referenced here, not copied.

**What changed in 4.0:** Two additions. First, the full seven-step validation protocol templates are restored. Version 3.0 compressed them to one-line summaries, which stripped the operational I/O methodology, the working scaffolds that turn the steps into an actual validation rather than a list of labels. Those templates are back in full. Second, a new Applied I/O Layer is added for decision validity. The prior protocol validated whether a method was internally sound and distinguishable from measurement error. The applied layer validates whether a decision the method drives actually predicts the outcome, holds up over time, treats groups fairly, and pays off. This matters because OrgHarmony will make or influence people-decisions at scale, and consistency is not the same as decision validity.

**What changed in 3.0:** The full Innermetrix construct layer was embedded directly in the skill. Earlier versions carried the validation method and the research base but not the actual instrument definitions, so the skill could check research alignment but not construct fidelity. That gap let a construct error pass (reading Economic as money rather than utility). The skill now holds the definitions for all three instruments and works without project knowledge, so it runs the same in this project, in Cowork, and in Claude Code.

---

## THE VALIDATION STANDARD

This skill does not rubber-stamp. It cross-examines.

**The test:** Would this hold up if an I/O Psychologist challenged every line?

**What that requires:**

| Requirement | Not Acceptable | Required |
|-------------|----------------|----------|
| Verdict | "Validated" | "Valid because [specific research finding] shows [X], which supports [Y]" |
| Citation | "Kristof-Brown (2005)" | "Kristof-Brown et al. (2005) meta-analysis of 172 studies found P-E fit correlates with job satisfaction (rho = .44), which supports the stated claim" |
| Logic | "Thresholds are correct" | "40-point threshold exceeds 3x SEM (8-12 points per Bonnstetter 2006), meaning the gap is statistically distinguishable from measurement error" |
| Construct | "It measures motivation" | "Economic in this instrument is the utility drive, not money. Reading it as money is a construct error" |
| Uncertainty | [silence] | "Research is thin on team-level aggregation methods. This threshold is extrapolated from dyadic findings, which may not hold at scale" |

---

## RESOLVE VERSUS ASK

Settle what you can, escalate only what you must. Before asking the user a question, classify it.

If it is a psychometric or methodological question with a defensible answer from research and the construct definitions, resolve it. Show the prove-it reasoning and the honest uncertainty. Do not ask.

Ask the user only when the call needs their business judgment, their preference, data that does not yet exist, or a genuine fork with no defensible default. Even then, give a recommendation and the context to decide, not an open question.

Respect stage and scope boundaries. If a needed input belongs to a later stage or to data that does not exist, note it and proceed with what the current work allows. Do not stop to ask for it.

---

## HIGH AND LOW COME FROM INSTRUMENT BANDING

Every high and low call comes from the instrument's own validated banding, per dimension. Never invent or reason to a universal cutoff from a midpoint. A guessed cutoff is a banned output.

Values. Read the band the instrument assigns each person, Very Low, Low, Average, High, Very High. Do not compute high or low from a numeric cutoff, and do not reverse-engineer the norm numbers, which are not in the certification material. The proof this matters: in a real report, Regulatory at 48 reads High while Economic at 49 reads Average, because each value sits against its own norm. A flat number cannot capture that.

DISC. Use the instrument's spectrum bands per dimension.

Attributes. Use the 0 to 10 scale with bias, by the instrument's own registration.

If the validated band for a dimension is not available, flag it and name the source needed. Never substitute a guess.

A distinction to keep clean. The band determines whether one person's score is high or low, which drives same-pole detection, competition, whose-standard, and coverage-gap. That is separate from the difference gap threshold, which measures the distance between two people. Do not let the two be conflated, and revisit whether the difference threshold should also be SD-relative per dimension during the methodology build.

---

## THE INNERMETRIX FRAMEWORK (CONSTRUCT LAYER)

This is the definitional ground truth. Validate every claim against these definitions, not against the everyday meaning of a word. The suite is the ADVanced Insights profile by Innermetrix, three instruments that answer three different questions.

| Instrument | Question it answers | What it measures |
|---|---|---|
| DISC Index | How we use our talents | Behavioral style and preference |
| Values Index | Why we use our talents | Motivational drivers |
| Attribute Index | What talents we have | Natural decision-making style and capacity |

---

### DISC INDEX (Preference)

The DISC Index is a modern interpretation of William Marston's four behavioral dimensions. It measures behavioral style, how a person prefers to use their talents. The Innermetrix labels are Decisive, Interactive, Stabilizing, and Cautious, mapped to the classic D, I, S, C letters.

| Dimension | Innermetrix label | Measures the preference for | Reflects how you tend to |
|---|---|---|---|
| D | Decisive | Problem solving and getting results | Approach problems and make decisions |
| I | Interactive | Interacting with others and showing emotion | Interact with others and share opinions |
| S | Stabilizing | Pacing, persistence, and steadiness | Pace things in your environment |
| C | Cautious | Procedures, standards, and protocols | Work within established protocol and standards |

The four areas in plain terms: Problems, People, Pace, Procedures.

**Natural versus Adaptive.** Every DISC dimension has two scores.

- Natural style is the basic, authentic style, how the person behaves when true to themselves. It reduces stress, and the person reverts to it under pressure. The natural style generally does not change. It is the stable trait.
- Adaptive style is how the person behaves when they feel observed or when they think about how they "should" act. It is less authentic. Holding it too long creates stress and lowers effectiveness.

**The 10-point rule.** A difference of 10 points or more between Natural and Adaptive on a dimension is the threshold at which the behavior change becomes observable to others.

**Validation rule for DISC.** Friction and fit calculations use Natural scores, not Adaptive. Natural isolates the stable person-level trait. Adaptive confounds the person with the environment, so using it would measure two people's stress responses rather than their underlying compatibility. See Threshold Science.

---

### VALUES INDEX (Passion)

The Values Index measures motivational drivers, why a person prefers to do what they do. It is built on Eduard Spranger's value types (1928) and Allport and Vernon's operationalization (1931). The Innermetrix version keeps seven dimensions rather than six, because it splits Individualistic from Political instead of combining them. Stay true to the seven.

| Value | Verified definition (the drive for) | Common misread to avoid |
|---|---|---|
| Theoretical | Knowledge, understanding, truth, reasoning, problem solving | None common |
| Economic | Usefulness and practical return. ROI on time, energy, and resources. The "is it worth it" instinct. A utilitarian ethic | NOT money. Money is one expression of the drive, not its definition |
| Aesthetic | Balance, harmony, form, beauty | Not limited to art. It is the drive for form and balance in any setting |
| Individualistic | Uniqueness, independence, standing apart, freedom of personal expression | NOT power or control. That is Political |
| Political | Power, influence, control, leadership. Competitiveness associated | NOT mere ambition or status alone. It is the control-and-influence drive |
| Altruist | Service to others, humanitarian concern, genuine sincerity in helping | Not weakness or people-pleasing. It is a values-level drive to serve |
| Regulatory | Order, routine, structure, rules, tradition, security through standards | Not rigidity. It is the drive to establish and follow order |

**The Economic trap, stated for the record.** Spranger's Economic type is the utilitarian type, oriented to what is useful and practical, the maximizing of return across time, energy, and resources. The economic mind asks "is it worth it." Money is the most visible expression and the instrument label even leads with the word, which is the trap. The construct is utility, not finance. Any validation that treats Economic as a money or budget drive is a construct error and must be flagged.

**The Individualistic and Political distinction.** These two are separate dimensions and must never be swapped or merged. Individualistic is the drive to be unique and independent. Political is the drive for power, influence, and control. Most other instruments combine them. This one does not. A document that crosses these definitions has a construct error, regardless of how confident it sounds.

---

### ATTRIBUTE INDEX (Process)

The Attribute Index measures natural decision-making style and capacity, what talents a person has. It is Jay Niblick's modern interpretation of Robert Hartman's Formal Axiology. It examines six core dimensions across two patterns.

**The scoring principle.** The higher the score, the more data the subconscious mind processes in that dimension. This is clarity. A high score means the person sees that dimension of thought clearly, which makes them naturally better at using it. Score is magnitude.

**The bias principle.** The symbols plus, minus, and equals represent bias, the direction of the person's relationship to that dimension and the order in which they take information into account. Bias is direction. Two people with nearly identical scores can have opposite biases, which means opposite relationships to that capacity. Score and bias are both required to read a dimension. Score alone is incomplete.

**Reading the two axes.** In each dimension below, the High and Low bullets are the magnitude read, more clarity or less. The Plus and Minus bullets are the direction. The two axes are independent, so a high score can carry either bias, and the off-diagonal person, a high score with the less common bias, is real. Read both, never the score region as if it named a bias.

#### Pattern I. External Decision Making (How We Think of the World)

How the person interacts with the environment, people, and systems. Three styles: Heart, Hand, Head.

**A. Empathy (Heart / Personal Style).** Seeing the humanistic, personal perspective. Concern for understanding and connecting with the individuals involved. This style intuitively gets people.
- High score: high clarity in reading the impact of the environment on a person, at high velocity. Sensitive to others, also willing to assert their own will.
- Low score: poor understanding or appreciation of others, emotional distance, possible insensitivity.
- Plus bias (overvalue): prefers personal relationships over professional, warm and accommodating, risk of being overly tolerant and blind to faults.
- Minus bias (undervalue): prefers professional relationships over personal, willing to assert own will over others, may use others to reach goals.

**B. Practical Thinking (Hand / Practical Style).** Looking at things in a practical, real-world, results-oriented way. No-nonsense, tactical, getting results, living in the now.
- High score: high clarity in practical, real-world, results-oriented thinking, more data on how things work.
- Low score: little clarity here, reluctant to engage in work, poor grasp of the work process, not a natural implementer.
- Plus bias (confident): currently confident in solving problems.
- Minus bias (frustrated): feels hindered, frustrated by results, reluctant to fully engage, can turn judgmental under stress. This maps to a learned-helplessness pattern.

**C. Systems Judgment (Head / Analytical Style).** Conceptual and structural perspective. Strategic thinking. Seeing the world theoretically and getting the big picture.
- High score: high clarity in conceptual, structural, big-picture thinking.
- Low score: little clarity here, often unaware of or uninterested in the system of rules and structure.
- Plus bias (required structure): needs structure to perform best, willing to conform, may show blind faith in the established order.
- Minus bias (autonomy): independent, bends rules, dislikes being managed, most effective with autonomy.

#### Pattern II. Internal Decision Making (How We Think of Self)

Clarity and amount of information the subconscious processes about the self.

**D. Self-Esteem / Self-Belief.** Clarity about your own true unique abilities and worth, and the order in which you take yourself into account.
- High score: high clarity about your own worth and abilities, inner strength.
- Low score: little clarity about your own worth, self-depreciation, feeling unfulfilled, sees self-worth through others' eyes.
- Plus bias (strong ego): overvalues self, very confident, self-centered, dislikes criticism.
- Minus bias (humility): undervalues self, humble, sees worth through others' eyes.

**E. Role Awareness.** Clarity about the roles you hold right now, their application, and the satisfaction you draw from them.
- High score: high clarity about your life roles and how to meet them.
- Low score: little clarity about your roles, seeking or between roles, role conflict or dissatisfaction, anxiety until resolved.
- Plus bias: identity comes from title and role success or failure.
- Minus bias: role confusion, disconnect from current role, not fully engaged.

**F. Self-Direction (Compass).** Clarity and belief in the future you see for your path, such as job, health, and goals.
- High score: high clarity and belief in the future you see for your path.
- Low score: little clarity about your direction, lacks drive toward future goals, nearsighted, many questions about direction.
- Plus bias (stubborn): confident in ultimate direction even while questioning specifics.
- Minus bias (persuadable): moldable about future path, situational, future may be vague.

#### The Internal versus External rule

Internal attributes (Self-Esteem, Role Awareness, Self-Direction) are a distinct construct from External attributes (Empathy, Practical Thinking, Systems Judgment). They have different factor loadings and different psychological meanings. Never merge them. Internal friction calls for self-concept interventions. External friction calls for process interventions. Merging them obscures what kind of help is needed.

#### Manufactured weakness

A blind spot is a low-scoring attribute. On its own it is neutral. It causes no harm by existing.

It becomes a manufactured weakness only when two conditions are both true:
1. The role requires that attribute heavily.
2. No complement system exists to fill the gap.

The weakness is not inherent to the person. The role manufactured it by demanding what the person does not naturally lead with. Responsibility sits with organizational design, not individual deficiency.

Three prescribed responses for an attribute in the bottom tier of the ranked list: Create Systems, Hire Talent, Delegate. The goal is not to develop the blind spot away. The goal is to build a complement system so the weakness never gets manufactured.

#### The Core Attribute List

The Core Attribute List is 78 attributes ranked by score. This count is verified against the instrument and the person's own report. Read it by cluster and rank, not by individual raw score, for coverage-gap work. The full 78 roster with definitions is in the appendix of this skill.

Note on report builds: Innermetrix produces report-specific builds (Leadership, Sales, and others) that surface curated competency sets with names outside the 78 generic library. The Core Attribute List that the methodology uses is 78. Do not assert a different count without an enumerated source.

---

## FRICTION ARCHITECTURE (EXTERNAL FOUNDATION)

The authoritative definition of friction lives in Friction_Definition.md. That file is the source of truth. This section carries enough of the architecture to validate against it, and points to the file for the full detail. Do not copy the file's text into validations. Read it.

Friction is the cost that appears when two trait profiles meet a shared demand. It is trait-derived and stable. What moves is the realized cost, measured through behavioral adherence and Goal Attainment Scaling, not by re-scoring friction.

Friction arises in two families. A family is a group of friction types that share a root cause, which means they share a solve.

| Family | Types | Root cause | Solve |
|---|---|---|---|
| Approach-clash | Difference, Whose-standard-wins | Each lens reads the other's way as wrong (EBIB) | Lens reconciliation: translation, adjudication |
| Structural | Competition, Coverage-gap | A scarce resource or an unmet demand, not anyone's lens | Allocation, or Create Systems / Hire Talent / Delegate |

**EBIB.** Environment, Beliefs, Identity, Behavior. A person's lens, formed by their environment, beliefs, identity, and proven methods, makes their own way feel right and a different way feel wrong. EBIB is the mechanism of the approach-clash family. It explains why difference and whose-standard generate friction, and it powers the bridges that resolve them.

**The scope rule, which the validator enforces.** EBIB applies to the approach-clash family only. It never applies to the structural family. Two people who both want control already share the perspective, so telling them to understand each other does nothing. They need the role carved up. Prescribing lens-understanding for structural friction is the foundational error that broke earlier app builds. Saying same-style friction exists is not a contradiction, because same-style friction is structural and EBIB never claimed it.

**A style gap is friction, not fit.** A gap does not reduce friction. It changes which source fires. A high and a low on a reciprocal trait still clash on how the work gets done, because each lens reads the other as wrong. The only thing a high-low pair avoids is competition, the power struggle two highs would have. That is the absence of one structural source, not a discount on difference.

---

## CONSTRUCT FIDELITY GUARDRAILS

Hard rules. Each one exists because an error was caught and traced to its root.

| Guardrail | The rule | Why |
|---|---|---|
| Word is not construct | Validate against the embedded definition, never the everyday meaning of the label | Economic looks like money but means utility |
| Economic is utility | Economic is the practical-return drive. Flag any money or budget reading | Construct error caught in production |
| Individualistic is not Political | Individualistic is uniqueness and independence. Political is power and control. Never swap or merge | Definitions were found crossed in a source doc |
| Internal is not External | Never merge the two attribute patterns | Different factors, different interventions |
| Score needs bias | An attribute read on score alone is incomplete. Always pair with bias | Identical scores, opposite biases, opposite people |
| Empathy bias polarity | Overvalue Empathy is the personal, friend pole, warm and over-tolerant, blind to faults. Undervalue is the professional pole, asserts own will, uses others. Do not swap | "Professional" sounds higher, so it gets misfiled as overvalue, the everyday-word trap on the bias direction, caught 2026-07-08 |
| Use Natural, not Adaptive | Friction uses Natural DISC scores | Adaptive confounds person and environment |
| Count is 78 | The Core Attribute List is 78, verified | An 88 reference was uncorroborated and traced to a source that did not contain it |
| EBIB stays in its family | EBIB applies to approach-clash only, never to structural friction | Prescribing lens-understanding for competition or coverage-gap is the error that broke earlier builds |
| A gap is friction, not fit | Never treat a style gap as fit. A gap changes which source fires, it does not reduce friction | The complementarity-as-fit claim failed validation against EBIB |
| Banding, not cutoffs | High and low come from the instrument's validated banding, never an invented number | A guessed 67 cutoff contradicted the actual Values bands |
| Resolve before asking | Settle psychometric and methodological questions yourself, ask only for judgment, preference, or missing data | Kicking resolvable questions to the user stalls the work |
| Cite or stay silent | If you cannot cite a finding or an enumerated source, say so | Invented attributions are intellectual dishonesty |

---

## VALIDATION PROTOCOL

Every validation follows this structure. No shortcuts. Fill in each template.

### Step 1: State What's On Trial

Before any analysis, articulate the document being evaluated, what it claims to do, and what would make each claim valid or invalid.

```markdown
## WHAT'S ON TRIAL

**Document:** [name]
**Purpose:** [what it claims to do]

### Claims Being Tested

| # | Claim | Valid If | Invalid If |
|---|-------|----------|------------|
| 1 | [specific claim] | [condition] | [condition] |
| 2 | [specific claim] | [condition] | [condition] |
```

### Step 2: Summarize the Methodology

Summarize what the document says in your own words. This proves you read it rather than scanned for keywords. Name which instrument and which dimension each claim touches, and check each against the construct layer above before going further.

```markdown
## METHODOLOGY SUMMARY

[2-3 paragraphs summarizing what the document claims, in plain language]

### Key Constructs
- [Construct 1]: [what it measures, how it is calculated, which instrument and dimension]
- [Construct 2]: [what it measures, how it is calculated, which instrument and dimension]

### Construct Fidelity Check
- [Construct]: matches embedded definition? [yes / no, and the discrepancy]

### Key Thresholds
| Threshold | Value | Document's Stated Rationale |
|-----------|-------|----------------------------|
| [name] | [value] | [why the doc says this number] |
```

### Step 3: Research Foundation

For each claim, identify the relevant research and state what that research actually found.

```markdown
## RESEARCH FOUNDATION

### For Claim 1: [claim name]

**Study 1:** [Author] ([Year]). [Title]. [Journal].
- **Sample:** [who was studied, N=]
- **Method:** [how they measured]
- **Key Finding:** [specific result with numbers]
- **Relevance:** [why this applies to the claim]

**Study 2:** [Author] ([Year]). [Title]. [Journal].
- **Sample:** [who was studied]
- **Method:** [how they measured]
- **Key Finding:** [specific result]
- **Relevance:** [why this applies]

**Research Gap:** [what the research does not address that is relevant to this claim]
```

### Step 4: Logical Chain Analysis

For each claim, show the reasoning chain from research to verdict.

```markdown
## LOGICAL CHAIN ANALYSIS

### Claim 1: [claim]

1. **Research establishes:** [what the research proves]
   - Source: [citation with specific finding]
2. **Document claims:** [what the methodology doc says]
   - Location: [where in the doc]
3. **Alignment check:** [does the claim match the research]
   - Match: [yes / no / partial]
   - Gap: [if partial, what is missing]
4. **Conclusion:** [reasoned statement]
5. **Verdict:** [VALID / INVALID / VALID WITH CAVEAT / INSUFFICIENT EVIDENCE]

**Confidence:** [HIGH / MEDIUM / LOW]
**Reasoning for confidence level:** [why]
```

### Step 5: Threshold Validation

For any numerical threshold, show the math and the science.

```markdown
## THRESHOLD VALIDATION

### Threshold: [name] = [value]

**Document's Rationale:** [what the doc says about why this number]

**Psychometric Basis:**

1. **Measurement precision:**
   - SEM for this instrument: [value, source]
   - Threshold exceeds [X] times SEM: [yes / no]
   - Implication: [what this means for validity]
2. **Observable difference:**
   - Research on minimum detectable difference: [finding, source]
   - Threshold relationship to that difference: [comparison]
   - Implication: [what this means]
3. **Practical significance:**
   - Effect size at this threshold: [value if known]
   - Comparable thresholds in literature: [examples]

**Verdict:** [VALID / INVALID / EXTRAPOLATED]
**If extrapolated:** [from what, with what assumptions]
```

### Step 5b: Decision Validity (Applied Layer)

Run this step only when the claim drives or influences a people-decision: selection, flagging, routing, pairing, hiring, promotion, or development triage. If the method only describes, skip it. If the method decides, this step is mandatory. Use the Applied I/O Layer below and produce its Decision Validity Verdict and Data Required output.

### Step 6: Honest Uncertainty

State where research is thin, contested, or does not directly apply.

```markdown
## UNCERTAINTY REGISTER

| Area | Uncertainty | Impact on Validity | Mitigation |
|------|-------------|--------------------|------------|
| [topic] | [what we do not know] | [how it affects validity] | [how to handle] |
```

### Step 7: Final Verdict

Only after completing the prior steps. Render the verdict with reasoning visible.

```markdown
## FINAL VERDICT

**Document:** [name]
**Overall Verdict:** [VALIDATED / VALIDATED WITH CAVEATS / PARTIALLY VALID / INVALID]
**Decision Validity (if applicable):** [ESTABLISHED / UNESTABLISHED, with the data gap named]

### Verdict Summary
| Claim | Verdict | Confidence | Key Reasoning |
|-------|---------|------------|---------------|
| [claim 1] | [verdict] | [H/M/L] | [one-line reason] |

### What Makes This Defensible
[Paragraph explaining why this verdict would hold up under challenge]

### Remaining Questions
[What a challenger might still raise, and how you would respond]
```

---

## THE RESEARCH BASE

Citations must include specific findings, not just author and year.

### DISC Validation
**Bonnstetter, Suiter, & Widrick (2006).** The Universal Language DISC Reference Manual. TTI.
- SEM 8 to 12 points per dimension. Test-retest r = .80 to .90 for Natural. Four-factor structure confirmed via CFA (CFI greater than .90, RMSEA less than .08).

**Marston (1928).** Emotions of Normal People.
- 2x2 matrix foundation (active or passive by favorable or unfavorable). Measures behavioral tendencies, not fixed traits.

**TTI Success Insights (2019).** Technical Manual.
- Convergent validity with Big Five. D correlates with Extraversion (.52) and Agreeableness (-.41). Discriminant validity with cognitive ability low (r less than .20).

### Values Validation
**Allport, Vernon, & Lindzey (1960).** Study of Values Manual, 3rd ed.
- Test-retest r = .80 to .90 over one to two months. Structure replicated across samples.

**Spranger (1928).** Types of Men.
- Values as organizing principles of personality. People hold profiles, not single types. Economic type is utilitarian, oriented to the useful and practical, not narrowly money.

### Attributes Validation
**Hartman (1967).** The Structure of Value.
- Three dimensions of valuation: intrinsic, extrinsic, systemic. Mathematical formalization of value judgments.

**Pomeroy (2005).** The New Science of Axiological Psychology.
- Factor support for the three-dimensional structure. Internal and External as separate constructs with different loadings.

### Person-Environment Fit
**Kristof-Brown, Zimmerman, & Johnson (2005).** Personnel Psychology, 58(2).
- N = 172 studies. P-E fit to job satisfaction rho = .44. To commitment rho = .51. To turnover intention rho = -.29. Demands-abilities fit strongest for strain.

**Edwards (1991).** Journal of Vocational Behavior, 40(3).
- Distinguishes supplies-values fit from demands-abilities fit. Behavioral adaptation as a coping mechanism for misfit.

### Turnover and Retention
**Tett & Meyer (1993).** Personnel Psychology, 46(2).
- Turnover intention to actual turnover r = .45. Satisfaction to intention r = -.58. P-E fit mediates.

**Griffeth, Hom, & Gaertner (2000).** Journal of Management, 26(3).
- Job satisfaction strongest attitudinal predictor (r = -.19 with turnover). Pay and performance moderate.

### Team Composition
**Bell (2007).** Journal of Applied Psychology, 92(3).
- Personality composition to team performance rho = .17. Ability composition rho = .30. Deep-level variables matter more over time.

**Harrison, Price, & Bell (1998).** Academy of Management Journal, 41(1).
- Surface-level diversity effects fade over time. Deep-level diversity effects grow.

### Status and Same-Style Friction
**Interpersonal complementarity theory (Carson 1969, Kiesler 1983, Sadler, Ethier, & Woody 2011).**
- On the control axis, behavior is reciprocal, not matching. Dominance invites submission. Agency tends to distribute between partners in a near zero-sum way. Two high-dominance people create a noncomplementary interaction that impedes productivity and lowers satisfaction. Note: the dominance half of complementarity has more mixed empirical support than the warmth half. Treat same-style competition as theory-led and behavior-supported, not a settled effect size.

**Bendersky & Hays (2012). Status conflicts in groups. Organization Science.**
- Status conflict, disputes over relative rank, harms group performance and undermines information sharing more than other conflict types.

### Self-Concept and Role
**Bandura (1977).** Self-efficacy predicts performance and persistence, domain-specific.
**Deci & Ryan (1985).** Autonomy as a core need. Self-direction tied to intrinsic motivation.
**Seligman (1975).** Learned helplessness maps to the frustrated Practical Thinking bias pattern.
**Rizzo, House, & Lirtzman (1970).** Role ambiguity to dissatisfaction r = -.46. Role conflict to dissatisfaction r = -.48. Maps to Role Awareness.

---

## THRESHOLD SCIENCE

### Why 40 points = High (DISC and Values)
- DISC SEM is 8 to 12 points (Bonnstetter 2006). 40 points is 3.3 to 5x SEM. At 3x SEM, the probability the true difference is zero is below .01. So a 40-point gap is statistically distinguishable from measurement error.
- Observable difference: about 10 points is the minimum others notice (TTI 2019). A 40-point gap means both people would shift 20-plus points to meet in the middle, which is 2x the minimum observable difference.
- Practical significance: Edwards (1991) and Kristof-Brown (2005) show even moderate misfit has meaningful effects. At 40 points, natural interaction becomes costly enough to warrant intervention.

### Why Natural scores, not Adaptive
- Natural is a stable preference (r = .85 to .90 retest). Adaptive is a situational response with lower retest reliability by design.
- Friction is about underlying incompatibility, not current coping. Using Adaptive would measure two people's stress responses, not their fit. Edwards (1991) supports using stable preferences for supplies-values fit.

### Why both score and bias for Process
- Hartman (1967): value has both magnitude and direction. Score is magnitude. Bias is direction.
- Worked case: Person A Practical Thinking 7.2 with plus bias requires results to function. Person B Practical Thinking 7.0 with minus bias is frustrated by results pressure. Score gap is 0.2 and looks aligned. Bias plus versus minus is a conflict. Score alone misses it entirely.

### Why Internal and External stay separate
- Pomeroy (2005): factor analysis shows different loadings for Internal versus External.
- Internal friction needs self-concept interventions. External friction needs process interventions. Merging obscures the intervention type.

### Same-style friction needs a different operator
- Distance returns zero for identical profiles, so it cannot detect competition between two same-high styles. Competition friction rises with shared elevation on a finite-resource dimension, not with difference. Use a co-elevation operator gated by resource scarcity, validated separately from the distance score. Grounded in complementarity and status-conflict research above. Held at signal level pending observation in production pairs.

---

## APPLIED I/O LAYER (DECISION VALIDITY)

Threshold Science answers whether a number is real and not measurement noise. This layer answers a harder question: when the method drives a decision about a person, does that decision predict the outcome, hold up over time, treat groups fairly, and pay off. Consistency is not decision validity. A score can be perfectly reliable and still predict nothing.

### When to run this layer

Run it whenever a claim drives or influences a people-decision: flagging a resistant leader, routing a pair to a bridge, pairing or placing people, hiring, promotion, or development triage. If the method only describes a person, skip it. If the method acts on a person, it is mandatory.

### The seven applied frameworks

**1. Criterion validity.** Does the predictor actually predict the real-world outcome it claims to. The validity coefficient is the correlation between the predictor score and the criterion. Predictive validity collects the criterion later in time, concurrent validity collects it at the same time. Measurement precision is not prediction. A flag can clear SEM and still not forecast the behavior.
- Question: does the flag predict the outcome.
- Data required: outcome records for flagged and unflagged people, gathered over time.
- OrgHarmony status: PENDING. Needs production outcomes. Maps to the first-twenty-bridges calibration.

**2. Incremental validity.** Does this measure add predictive power beyond what cheaper or existing measures already give. Tested by hierarchical regression, entering the existing predictors first and checking whether the new measure raises explained variance.
- Question: does friction or the bilateral score add anything beyond what a simple climate survey already predicts.
- Data required: the outcome plus the competing predictors on the same people.
- OrgHarmony status: PENDING, and strategically important, because the platform's entire claim is that bilateral measurement beats sentiment surveys. Incremental validity is the proof of that claim.

**3. Base rates.** The proportion of the population that actually has the outcome. Without it, a flag's false-positive rate is unknowable, and a rare outcome makes even an accurate flag mostly wrong. This is the single most overlooked number in applied prediction.
- Question: how common is real resistance, or real turnover, in this population.
- Data required: population outcome counts.
- OrgHarmony status: PENDING. Collect early, because every other applied number depends on it.

**4. Classification accuracy.** For a cut score, the four cells: sensitivity (of those with the outcome, how many the flag catches), specificity (of those without it, how many the flag clears), positive predictive value (of those flagged, how many truly have it), and negative predictive value. PPV depends heavily on the base rate. A cut can have high sensitivity and still low PPV when the outcome is rare.
- Question: of the leaders this cut flags, how many are true positives.
- Data required: base rate plus criterion outcomes.
- OrgHarmony status: PENDING. Follows directly once base rate and criterion data exist.

**5. Adverse impact.** Whether a cut selects or flags protected groups at meaningfully different rates. The four-fifths rule is the common screen: if a group's selection rate falls below 80 percent of the highest group's rate, that is evidence of adverse impact and triggers a closer look. This is a legal and ethical standard, not a nicety.
- Question: does the flag hit protected groups at disparate rates.
- Data required: flag rates by group, which the platform can compute from its own data without waiting for outcomes.
- OrgHarmony status: LIVE NOW. This is the one applied framework that does not wait for production outcomes, and OrgHarmony runs in public K-12, where disparate impact is real exposure. Run it on any deployed cut.

**6. Utility analysis.** The practical or dollar value of using the tool. The Taylor-Russell approach relates validity, base rate, and selection ratio to the expected success rate. The Brogden-Cronbach-Gleser model estimates gain as a function of the number of decisions, the validity coefficient, the spread of outcome value, and the score of those selected, minus cost. Utility is the buyer's language, the ROI of the instrument.
- Question: what is the measurable payoff of using this flag versus not.
- Data required: validity coefficient, base rate, selection ratio, and an estimate of outcome value.
- OrgHarmony status: PENDING. Becomes computable once criterion validity exists. Strong for district sales once it does.

**7. Selection ratio.** The proportion of people acted on, for example the share of leaders the cut flags. It moves utility and interacts with base rate in the Taylor-Russell logic. A very loose or very tight cut changes the value of the whole system.
- Question: what share does this cut act on, and is that share defensible.
- Data required: the cut applied to the population, available now.
- OrgHarmony status: LIVE NOW for description, PENDING for its utility implication.

### The Decision Validity Verdict

Separate from the consistency verdict. State it plainly: decision validity is ESTABLISHED only when criterion validity exists and adverse impact has been checked. Until then it is UNESTABLISHED, and the honest verdict is "precise but unproven as a decision," with the specific missing data named. Do not let a clean Threshold Science verdict stand in for decision validity. They are different claims.

### The Data Required output

Because most applied frameworks need data the platform does not yet hold, this layer produces a collection plan as a deliverable, not just a verdict. For each pending framework, name the exact data, who or what produces it, and when it becomes available. This output doubles as the measurement plan for the first twenty production bridges.

```markdown
## DECISION VALIDITY

**Decision this method drives:** [the people-decision]
**Decision Validity Verdict:** [ESTABLISHED / UNESTABLISHED]

| Framework | Status | Data Required | Source | When Available |
|-----------|--------|---------------|--------|----------------|
| Criterion validity | [live/pending] | [data] | [source] | [timing] |
| Incremental validity | [live/pending] | [data] | [source] | [timing] |
| Base rate | [live/pending] | [data] | [source] | [timing] |
| Classification accuracy | [live/pending] | [data] | [source] | [timing] |
| Adverse impact | [usually live] | [flag rates by group] | [platform] | [now] |
| Utility | [live/pending] | [data] | [source] | [timing] |
| Selection ratio | [live/pending] | [data] | [source] | [timing] |

**Live now:** [what can be checked today, run it]
**Pending:** [what waits for production data, and the milestone that unlocks it]
```

---

## WHAT THIS SKILL MUST PRODUCE

Every validation output includes:
1. What's On Trial
2. Methodology Summary, checked against the construct layer
3. Research Foundation with specific findings
4. Logical Chain
5. Threshold Validation with math and science
6. Decision Validity, whenever the method drives a people-decision, with the Data Required output
7. Uncertainty Register
8. Final Verdict, defensible under cross-examination

The test for every verdict: if someone says "Prove it," can you?

---

## PROHIBITED OUTPUTS

| Prohibited | Why |
|------------|-----|
| "Validated" without reasoning | Rubber stamp, not validation |
| Citations without findings | Name-dropping, not evidence |
| "Research supports this" without specifics | Vague appeal to authority |
| Reading a construct by its everyday word meaning | Source of the Economic error |
| Merging Internal and External, or Individualistic and Political | Construct collapse |
| Ignoring research gaps | Intellectual dishonesty |
| Confidence without justification | Unfounded certainty |
| Verdicts before evidence | Conclusion-first reasoning |
| Asserting a count or fact without an enumerated source | Source of the 88 error |
| Treating a clean reliability or threshold verdict as decision validity | Consistency is not prediction or fairness |
| Calling a flag valid for decisions with no criterion data or adverse-impact check | Decision validity unproven |
| Applying EBIB or lens-understanding to structural friction | Competition and coverage-gap are not approach clashes |
| Inventing a high or low cutoff instead of reading the instrument band | Banding is per dimension and validated, a number is a guess |
| Calling a style gap a fit | A gap is friction, it only changes which source fires |

---

## THE DEFENSIBILITY TEST

Before finalizing any validation, answer:
1. Could an I/O Psychologist challenge this? If yes, what would they say?
2. Do I have a response to that challenge? What is it?
3. Is my response based on evidence or assertion? Which studies or which construct definition?
4. Where is my reasoning weakest? Am I acknowledging it?
5. Would I stake my credibility on this verdict? If not, what needs to change?

If any answer is unsatisfying, the validation is not complete.

---

## APPENDIX: THE CORE ATTRIBUTE LIST (78)

Abbreviated definitions for the 78 attributes in the Core Attribute List. These granular attributes roll up under the six core dimensions. Source: Innermetrix Attribute Index attribute library.

1. **Accountability For Others** evaluates the ability to be responsible for the consequences of the actions of those whom the person manages.
2. **Attention To Detail** evaluates the ability to see and pay attention to details.
3. **Attitude Toward Honesty** evaluates openness to being honest even when it involves reporting one's own lack of results or the dishonesty of others.
4. **Attitude Toward Others** evaluates the ability to maintain a positive, open, and objective attitude toward others.
5. **Balanced Decision Making** evaluates the ability to be objective and to weigh the different aspects of a situation fairly, and to make an ethical decision that accounts for all components.
6. **Conceptual Thinking** evaluates the ability to see the big picture, determine direction, and decide how resources should be used to reach future goals.
7. **Concrete Organization** evaluates understanding of the immediate, concrete needs of a situation and the ability to set an effective plan of action for meeting them.
8. **Consistency and Reliability** evaluates the internal need to be conscientious and to be both consistent and reliable across life roles.
9. **Conveying Role Value** evaluates the ability to use one's own capacities for empathy, relationships, and leadership to instill a sense of value for the task in an employee.
10. **Correcting Others** evaluates the ability to confront controversial or difficult issues objectively and to have non-emotional discussions about disciplinary matters.
11. **Creativity** evaluates whether the person is an innovative thinker whose view of self and the world supports thinking outside the box.
12. **Developing Others** evaluates the ability to understand the needs, interests, strengths, and weaknesses of others and to use that to develop them.
13. **Diplomacy** evaluates the ability to balance personal emotions with the needs of the situation.
14. **Emotional Control** evaluates the ability to stay rational and objective under stress and to act objectively rather than impulsively.
15. **Empathetic Outlook** evaluates the capacity to perceive and understand the feelings and attitudes of others and to place oneself in another's shoes.
16. **Enjoyment Of The Job** evaluates the degree to which the person finds the job fulfilling, rewarding, and useful.
17. **Evaluating Others** evaluates the ability to make realistic, accurate judgments about another's strengths, weaknesses, and ways of thinking and acting.
18. **Evaluating What Is Said** evaluates openness toward others and willingness to hear what is actually said rather than what one expects.
19. **Flexibility** evaluates the ability to integrate, modify, and respond to change with minimal personal resistance.
20. **Following Directions** evaluates the ability to hear, understand, and follow directions, postponing personal decisions until instructions are understood.
21. **Freedom From Prejudices** evaluates the ability to keep prejudices from entering and affecting a relationship.
22. **Gaining Commitment** evaluates the ability to develop a self-motivating attitude in others in pursuit of their goals.
23. **Handling Rejection** evaluates the ability to avoid taking rejection or criticism overly personally.
24. **Handling Stress** evaluates the ability to balance and defuse inner tension that could otherwise interfere with performance.
25. **Human Awareness** evaluates the ability to be conscious of others' feelings and to value people as people rather than only as roles.
26. **Initiative** evaluates the ability to direct energy toward a goal without an external catalyst.
27. **Integrative Ability** evaluates the ability to identify the elements of a problem, see which are critical, and decide what to do.
28. **Intuitive Decision Making** evaluates the ability to compile intuitive perceptions accurately into a decision or action.
29. **Job Ethic** evaluates personal commitment to the execution of a specific task.
30. **Leading Others** evaluates the ability to organize and motivate people so everyone feels a sense of order and direction.
31. **Long Range Planning** evaluates the ability to identify and evaluate resources and plan their use across long-range projects.
32. **Material Possessions** evaluates the importance of money or material possessions in the person's motivation.
33. **Meeting Standards** evaluates the ability to see the standard requirements of a job and the commitment to meeting them.
34. **Monitoring Others** evaluates the ability to focus on the actions and decisions of others practically in order to identify successes and mistakes.
35. **Persistence** evaluates the ability to stay on course in times of difficulty.
36. **Personal Accountability** evaluates the ability to be responsible for one's own decisions and actions without shifting blame.
37. **Personal Commitment** evaluates the ability to focus and stay committed to a task, a measure of internal commitment.
38. **Personal Drive** evaluates how strongly the person feels the need to achieve, accomplish, or complete work.
39. **Personal Relationships** evaluates how motivated the person is to form personal relationships with coworkers.
40. **Persuading Others** evaluates the ability to present a viewpoint so that others accept it.
41. **Practical Thinking** evaluates the ability to identify problems and solutions in practical terms rather than theoretical ones.
42. **Proactive Thinking** evaluates the ability to determine the future implications of current decisions and actions.
43. **Problem and Situation Analysis** evaluates the ability to identify the elements of a problem and see which are critical.
44. **Problem Management** evaluates the ability to keep critical issues in context and use available resources to solve the problem.
45. **Problem Solving** evaluates the ability to identify alternative solutions and select the best option.
46. **Project and Goal Focus** evaluates the ability to stay on target regardless of circumstances.
47. **Project Scheduling** evaluates the ability to allocate resources properly to get things done within a defined timeframe.
48. **Quality Orientation** evaluates the affinity for seeing details and grading them against a preset standard.
49. **Realistic Expectations** evaluates whether the person's expectations of others can realistically be met.
50. **Realistic Goal Setting For Others** evaluates the ability to set achievable goals for others within available resources and timeframe.
51. **Realistic Personal Goal Setting** evaluates the ability to set achievable goals for oneself within available resources and timeframe.
52. **Relating To Others** evaluates the ability to coordinate personal insight and knowledge of others into effective interactions.
53. **Respect For Policies** evaluates appreciation for conducting business according to the intent of company policies and standards.
54. **Respect For Property** evaluates the ability to see the value of protecting and using company property correctly.
55. **Results Orientation** evaluates the ability to identify the actions needed to complete tasks and obtain results.
56. **Role Awareness** evaluates the ability to be aware of one's role within an environment and to understand expectations and how to meet them.
57. **Role Confidence** evaluates the ability to develop and maintain inner strength based on the belief that one will succeed.
58. **Seeing Potential Problems** evaluates the ability to structure current situations into an ongoing scenario and identify future problems.
59. **Self Assessment** evaluates the ability to identify one's own management strengths and weaknesses practically and objectively.
60. **Self Confidence** evaluates the ability to maintain inner strength based on the desire to succeed and the belief in one's capabilities.
61. **Self Control** evaluates the ability to stay rational and objective in a stressful, emotional situation.
62. **Self Direction** evaluates the internal drive to excel in and believe in one's chosen career path.
63. **Self Discipline and Sense of Duty** evaluates how strongly the person feels the need to be consistent and true to themselves in their actions.
64. **Self Esteem** evaluates the ability to realize and appreciate one's own unique self-worth.
65. **Self Improvement** evaluates motivation to improve oneself.
66. **Self Management** evaluates the ability to manage oneself and develop one's own abilities.
67. **Self Starting Ability** evaluates the ability to find one's own motivation for a task and maintain it against adversity.
68. **Sense of Belonging** evaluates the importance of feeling part of a team or group for the person's motivation.
69. **Sense of Mission** evaluates the importance and commitment the person gives to their ideals and goals.
70. **Sense of Timing** evaluates the ability to read a situation so that statements, decisions, and actions land in the most effective and timely way.
71. **Sensitivity To Others** evaluates the ability to be aware of others' feelings without letting that awareness block objective decisions.
72. **Status and Recognition** evaluates the importance of social status and recognition for the person.
73. **Surrendering Control** evaluates the ability to surrender control of a situation or outcome to another person or group.
74. **Systems Judgment** evaluates schematic thinking ability within the external system of people where the person works.
75. **Theoretical Problem Solving** evaluates the ability to envision a situation and apply problem-solving ability to it.
76. **Understanding Attitude** evaluates the ability to read between the lines and understand body language, reticence, stress, and emotion.
77. **Understanding Motivational Needs** evaluates the ability to understand the needs and desires of employees and use that to motivate them.
78. **Using Common Sense** evaluates the ability to focus on practical thinking, see the world clearly, and make common-sense decisions.

---

*This skill exists because "trust me" is not a methodology. Show the work. Defend the verdict. If it cannot survive challenge, it is not validated. As of 3.0, the construct definitions live inside the skill, so construct fidelity is checkable anywhere the skill runs.*
