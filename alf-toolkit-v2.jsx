import { useState, useRef, useEffect, useMemo } from "react";

// ─── Constants ───────────────────────────────────────────────────────────────

const STEPS = [
  "Performance Reality",
  "Dimensional Diagnosis",
  "Design Recommendations",
  "Project Plan",
];

const DIMENSIONS = [
  {
    id: "associative",
    name: "Associative",
    subtitle: "Behavioral / Automatic",
    color: "#C05746",
    questions: [
      { q: "Must the learner execute procedures or steps automatically, without conscious deliberation?", weight: 3 },
      { q: "Is performance under time pressure, stress, or cognitive load a key requirement?", weight: 2 },
      { q: "Does the task involve repetitive actions that must become habitual or reflexive?", weight: 2 },
      { q: "Is compliance with exact procedures critical to safety, accuracy, or regulation?", weight: 3 },
      { q: "Would failure to perform the correct response instantly create significant risk?", weight: 2 },
    ],
  },
  {
    id: "cognitive",
    name: "Cognitive",
    subtitle: "Knowledge / Mental Models",
    color: "#2D7D9A",
    questions: [
      { q: "Must the learner build organized mental models or schemas to understand how a system works?", weight: 3 },
      { q: "Is the primary gap a lack of factual, conceptual, or procedural knowledge?", weight: 3 },
      { q: "Does the learner need to recall, classify, or explain information accurately?", weight: 2 },
      { q: "Is there a defined body of knowledge that must be mastered before performance is possible?", weight: 2 },
      { q: "Does the task require applying known rules or principles to familiar types of problems?", weight: 2 },
    ],
  },
  {
    id: "constructive",
    name: "Constructive",
    subtitle: "Meaning-Making / Transfer",
    color: "#6B8E23",
    questions: [
      { q: "Must the learner solve novel problems or adapt skills to unfamiliar situations?", weight: 3 },
      { q: "Does the task require synthesizing information from multiple sources or perspectives?", weight: 2 },
      { q: "Is critical thinking, evaluation, or judgment a core performance requirement?", weight: 3 },
      { q: "Must the learner create new artifacts, strategies, or solutions (not just apply known ones)?", weight: 2 },
      { q: "Does the learning need to transfer across significantly different contexts?", weight: 2 },
    ],
  },
  {
    id: "social",
    name: "Social-Ecological",
    subtitle: "Situated / Collaborative",
    color: "#8B5DAA",
    questions: [
      { q: "Is the target performance inherently collaborative or team-dependent?", weight: 3 },
      { q: "Does success depend on navigating social dynamics, politics, or organizational culture?", weight: 2 },
      { q: "Must the learner adopt the identity, norms, or practices of a professional community?", weight: 2 },
      { q: "Is mentorship, coaching, or apprenticeship essential to developing competence?", weight: 3 },
      { q: "Does the performance context vary significantly based on relationships or situational factors?", weight: 2 },
    ],
  },
  {
    id: "networked",
    name: "Networked",
    subtitle: "Connected / Just-in-Time",
    color: "#D4A04A",
    questions: [
      { q: "Is the knowledge base rapidly changing or frequently updated?", weight: 3 },
      { q: "Does the learner need to find, evaluate, and apply information from distributed sources?", weight: 2 },
      { q: "Is maintaining connections to current knowledge networks more important than memorizing content?", weight: 2 },
      { q: "Would performance support tools or just-in-time resources serve better than training?", weight: 3 },
      { q: "Does the role require continuous learning and self-directed professional development?", weight: 2 },
    ],
  },
];

const CONTENT_TYPES = [
  { id: "facts", label: "Facts", desc: "Specific information to recall", icon: "◆" },
  { id: "concepts", label: "Concepts", desc: "Categories, classifications, definitions", icon: "◇" },
  { id: "processes", label: "Processes", desc: "How systems work (sequential flow)", icon: "▷" },
  { id: "procedures", label: "Procedures", desc: "Step-by-step task execution", icon: "▶" },
  { id: "principles", label: "Principles", desc: "Guidelines for judgment & decisions", icon: "★" },
];

const MODALITIES = {
  associative: ["Drill & practice simulations", "Job aids & quick-reference guides", "Scenario-based repetition", "Timed performance exercises"],
  cognitive: ["eLearning modules (conceptual)", "Instructor-led training (ILT)", "Worked examples & demos", "Knowledge checks & assessments"],
  constructive: ["Case studies & problem-based learning", "Project-based assignments", "Simulations with branching", "Reflective exercises & journals"],
  social: ["Facilitated workshops", "Peer learning cohorts", "Mentorship / coaching programs", "Communities of practice"],
  networked: ["Performance support systems", "Microlearning / just-in-time", "Curated resource libraries", "Social knowledge sharing platforms"],
};

const MODELS = {
  associative: { primary: "Gagné's Nine Events", supporting: ["Behavioral objectives (Mager)", "Direct Instruction"] },
  cognitive: { primary: "Merrill's First Principles", supporting: ["Bloom's Taxonomy", "Cognitive Load Theory (Clark)"] },
  constructive: { primary: "Kolb's Experiential Cycle", supporting: ["Action Mapping (Moore)", "Backward Design (Wiggins)"] },
  social: { primary: "Situated Learning (Lave & Wenger)", supporting: ["70-20-10 Framework", "Social Learning Theory (Bandura)"] },
  networked: { primary: "Connectivism (Siemens)", supporting: ["Five Moments of Need (Gottfredson)", "Microlearning principles"] },
};

const DEV_PROCESSES = {
  stable: { name: "ADDIE (Structured)", desc: "Best for well-defined content with stable requirements", phases: ["Analysis", "Design", "Development", "Implementation", "Evaluation"] },
  iterative: { name: "SAM (Iterative)", desc: "Best for complex/ambiguous challenges needing rapid prototyping", phases: ["Preparation", "Iterative Design", "Iterative Development"] },
  hybrid: { name: "Hybrid (ADDIE + SAM)", desc: "Structured analysis with iterative development cycles", phases: ["Analysis", "Design Sprint", "Build Iteration 1", "Build Iteration 2", "Pilot & Evaluate"] },
};

// ─── Project Planning Logic ──────────────────────────────────────────────────

const ROLE_TEMPLATES = [
  { role: "Project Sponsor", abbr: "PS", always: true },
  { role: "Learning Architect / Lead ID", abbr: "LA", always: true },
  { role: "Instructional Designer", abbr: "ID", always: true },
  { role: "Subject Matter Expert", abbr: "SME", always: true },
  { role: "Visual / Media Designer", abbr: "VD", always: false },
  { role: "LMS Administrator", abbr: "LMS", always: false },
  { role: "Facilitator / Trainer", abbr: "FAC", always: false },
  { role: "QA / Reviewer", abbr: "QA", always: true },
];

function generateProjectPlan(context, scores, contentTypes, devProcess) {
  const maxDim = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
  const complexity = maxDim[1] > 70 ? "high" : maxDim[1] > 40 ? "medium" : "low";
  const multiDimensional = Object.values(scores).filter(s => s > 40).length > 2;

  // Determine which roles are needed
  const needsMedia = contentTypes.includes("processes") || contentTypes.includes("procedures") || scores.constructive > 50;
  const needsLMS = true;
  const needsFacilitator = scores.social > 40 || scores.constructive > 50;
  const roles = ROLE_TEMPLATES.filter(r => {
    if (r.always) return true;
    if (r.abbr === "VD") return needsMedia;
    if (r.abbr === "LMS") return needsLMS;
    if (r.abbr === "FAC") return needsFacilitator;
    return false;
  });

  // Base effort multipliers (in days)
  const effortBase = {
    low: { analysis: 3, design: 5, development: 8, review: 2, implementation: 3, evaluation: 2 },
    medium: { analysis: 5, design: 8, development: 15, review: 4, implementation: 5, evaluation: 3 },
    high: { analysis: 8, design: 12, development: 25, review: 6, implementation: 8, evaluation: 5 },
  };

  const effort = effortBase[complexity];
  const multiDimMultiplier = multiDimensional ? 1.3 : 1.0;

  // Generate WBS tasks based on content types and dimensions
  const wbs = generateWBS(contentTypes, scores, devProcess, effort, multiDimMultiplier);

  // Risk factors
  const risks = [];
  if (multiDimensional) risks.push({ risk: "Multi-dimensional complexity", impact: "High", mitigation: "Phased delivery; address dominant dimension first, layer secondary dimensions" });
  if (scores.social > 60) risks.push({ risk: "Social/collaborative components require coordination", impact: "Medium", mitigation: "Early stakeholder alignment; pilot with small cohort" });
  if (scores.networked > 60) risks.push({ risk: "Content may become outdated quickly", impact: "Medium", mitigation: "Build modular/updateable structure; assign content owner" });
  if (contentTypes.length > 3) risks.push({ risk: "Multiple content types increase design complexity", impact: "Medium", mitigation: "Standardize templates per content type; parallel development tracks" });
  if (complexity === "high") risks.push({ risk: "Scope creep from stakeholder expectations", impact: "High", mitigation: "Locked scope document; change request process" });
  if (risks.length === 0) risks.push({ risk: "Straightforward project — primary risk is over-engineering", impact: "Low", mitigation: "Stay lean; resist adding complexity without evidence of need" });

  return { complexity, roles, wbs, risks, effort, multiDimensional, devProcess };
}

function generateWBS(contentTypes, scores, devProcess, effort, multiplier) {
  const phases = [];

  // Phase 1: Analysis & Discovery
  const analysisTasks = [
    { task: "Stakeholder kickoff meeting", effort: 0.5, roles: ["PS", "LA", "SME"], raci: { LA: "R", PS: "A", SME: "C" } },
    { task: "Performance & gap analysis", effort: Math.round(effort.analysis * 0.4 * multiplier * 10) / 10, roles: ["LA", "SME"], raci: { LA: "R", SME: "C", PS: "I" } },
    { task: "Audience analysis & learner profiling", effort: Math.round(effort.analysis * 0.3 * multiplier * 10) / 10, roles: ["LA", "SME"], raci: { LA: "R", SME: "C" } },
    { task: "Content audit & asset inventory", effort: Math.round(effort.analysis * 0.3 * multiplier * 10) / 10, roles: ["ID", "SME"], raci: { ID: "R", SME: "C", LA: "A" } },
  ];
  if (scores.networked > 40) analysisTasks.push({ task: "Technology & platform assessment", effort: 1, roles: ["LA", "LMS"], raci: { LA: "R", LMS: "C" } });
  phases.push({ name: "Analysis & Discovery", tasks: analysisTasks });

  // Phase 2: Design
  const designTasks = [
    { task: "Learning objectives development (Mager-style)", effort: Math.round(effort.design * 0.2 * multiplier * 10) / 10, roles: ["LA", "SME"], raci: { LA: "R", SME: "C", PS: "A" } },
    { task: "Content outline / information architecture", effort: Math.round(effort.design * 0.25 * multiplier * 10) / 10, roles: ["ID", "SME"], raci: { ID: "R", LA: "A", SME: "C" } },
    { task: "Assessment strategy & rubric design", effort: Math.round(effort.design * 0.15 * multiplier * 10) / 10, roles: ["ID", "LA"], raci: { ID: "R", LA: "A" } },
    { task: "Modality & delivery strategy selection", effort: Math.round(effort.design * 0.15 * multiplier * 10) / 10, roles: ["LA"], raci: { LA: "R", PS: "A" } },
    { task: "Storyboard / design document creation", effort: Math.round(effort.design * 0.25 * multiplier * 10) / 10, roles: ["ID", "VD"], raci: { ID: "R", VD: "C", LA: "A", SME: "C" } },
  ];
  if (scores.constructive > 50) designTasks.push({ task: "Scenario / case study design", effort: Math.round(effort.design * 0.15 * multiplier * 10) / 10, roles: ["ID", "SME"], raci: { ID: "R", SME: "C" } });
  if (scores.social > 50) designTasks.push({ task: "Facilitation guide & activity design", effort: Math.round(effort.design * 0.15 * multiplier * 10) / 10, roles: ["ID", "FAC"], raci: { ID: "R", FAC: "C" } });
  phases.push({ name: "Design", tasks: designTasks });

  // Phase 3: Development
  const devTasks = [];
  if (contentTypes.includes("facts") || contentTypes.includes("concepts")) {
    devTasks.push({ task: "Knowledge content development (facts/concepts)", effort: Math.round(effort.development * 0.2 * multiplier * 10) / 10, roles: ["ID", "SME"], raci: { ID: "R", SME: "C", LA: "A" } });
  }
  if (contentTypes.includes("procedures")) {
    devTasks.push({ task: "Procedural content & job aid development", effort: Math.round(effort.development * 0.25 * multiplier * 10) / 10, roles: ["ID", "SME", "VD"], raci: { ID: "R", SME: "C", VD: "C" } });
  }
  if (contentTypes.includes("processes")) {
    devTasks.push({ task: "Process visualization & system diagrams", effort: Math.round(effort.development * 0.2 * multiplier * 10) / 10, roles: ["ID", "VD"], raci: { ID: "R", VD: "C" } });
  }
  if (contentTypes.includes("principles")) {
    devTasks.push({ task: "Principle-based scenario & case development", effort: Math.round(effort.development * 0.25 * multiplier * 10) / 10, roles: ["ID", "SME"], raci: { ID: "R", SME: "C" } });
  }
  if (scores.associative > 40) {
    devTasks.push({ task: "Practice exercises & drill simulations", effort: Math.round(effort.development * 0.15 * multiplier * 10) / 10, roles: ["ID"], raci: { ID: "R", LA: "A" } });
  }
  if (scores.constructive > 40) {
    devTasks.push({ task: "Branching scenario / simulation build", effort: Math.round(effort.development * 0.3 * multiplier * 10) / 10, roles: ["ID", "VD"], raci: { ID: "R", VD: "C", LA: "A" } });
  }
  devTasks.push({ task: "Assessment item development", effort: Math.round(effort.development * 0.15 * multiplier * 10) / 10, roles: ["ID", "SME"], raci: { ID: "R", SME: "C" } });
  devTasks.push({ task: "Media production (graphics, video, audio)", effort: Math.round(effort.development * 0.2 * multiplier * 10) / 10, roles: ["VD", "ID"], raci: { VD: "R", ID: "C" } });
  if (scores.social > 40) {
    devTasks.push({ task: "Facilitator guide & session materials", effort: Math.round(effort.development * 0.1 * multiplier * 10) / 10, roles: ["ID", "FAC"], raci: { ID: "R", FAC: "C" } });
  }
  phases.push({ name: "Development", tasks: devTasks });

  // Phase 4: Review & QA
  const reviewTasks = [
    { task: "SME content accuracy review", effort: Math.round(effort.review * 0.3 * multiplier * 10) / 10, roles: ["SME", "QA"], raci: { SME: "R", QA: "C", LA: "A" } },
    { task: "Instructional quality review (alignment, flow, engagement)", effort: Math.round(effort.review * 0.3 * multiplier * 10) / 10, roles: ["QA", "LA"], raci: { QA: "R", LA: "A" } },
    { task: "Technical / functional QA", effort: Math.round(effort.review * 0.2 * multiplier * 10) / 10, roles: ["QA", "LMS"], raci: { QA: "R", LMS: "C" } },
    { task: "Revision & iteration cycle", effort: Math.round(effort.review * 0.2 * multiplier * 10) / 10, roles: ["ID", "VD"], raci: { ID: "R", VD: "C", LA: "A" } },
  ];
  phases.push({ name: "Review & QA", tasks: reviewTasks });

  // Phase 5: Implementation
  const implTasks = [
    { task: "LMS build & configuration", effort: Math.round(effort.implementation * 0.3 * multiplier * 10) / 10, roles: ["LMS", "ID"], raci: { LMS: "R", ID: "C" } },
    { task: "Pilot delivery & learner feedback", effort: Math.round(effort.implementation * 0.4 * multiplier * 10) / 10, roles: ["FAC", "LA", "ID"], raci: { FAC: "R", LA: "A", ID: "C" } },
    { task: "Pilot revisions", effort: Math.round(effort.implementation * 0.15 * multiplier * 10) / 10, roles: ["ID"], raci: { ID: "R", LA: "A" } },
    { task: "Full launch & stakeholder communication", effort: Math.round(effort.implementation * 0.15 * multiplier * 10) / 10, roles: ["LA", "PS", "LMS"], raci: { LA: "R", PS: "A", LMS: "C" } },
  ];
  phases.push({ name: "Implementation", tasks: implTasks });

  // Phase 6: Evaluation
  const evalTasks = [
    { task: "Level 1: Learner satisfaction survey", effort: Math.round(effort.evaluation * 0.2 * multiplier * 10) / 10, roles: ["ID", "LMS"], raci: { ID: "R", LMS: "C" } },
    { task: "Level 2: Knowledge / skill assessment analysis", effort: Math.round(effort.evaluation * 0.3 * multiplier * 10) / 10, roles: ["ID", "LA"], raci: { ID: "R", LA: "A" } },
    { task: "Level 3: On-the-job application observation", effort: Math.round(effort.evaluation * 0.3 * multiplier * 10) / 10, roles: ["LA", "SME"], raci: { LA: "R", SME: "C", PS: "I" } },
    { task: "Closeout report & lessons learned", effort: Math.round(effort.evaluation * 0.2 * multiplier * 10) / 10, roles: ["LA"], raci: { LA: "R", PS: "I" } },
  ];
  phases.push({ name: "Evaluation", tasks: evalTasks });

  return phases;
}

// ─── Merrill & ARCS Checklists ───────────────────────────────────────────────

const MERRILL_ITEMS = [
  { principle: "Problem-Centered", question: "Is the learning anchored in a real-world problem or task the learner recognizes?" },
  { principle: "Activation", question: "Does it activate prior knowledge or experience before introducing new content?" },
  { principle: "Demonstration", question: "Does it show (not just tell) — through examples, models, or worked cases?" },
  { principle: "Application", question: "Does the learner practice applying new knowledge with feedback?" },
  { principle: "Integration", question: "Can the learner reflect, discuss, or demonstrate capability in their own context?" },
];

const ARCS_ITEMS = [
  { element: "Attention", question: "Does the design capture interest through novelty, inquiry, or variability?" },
  { element: "Relevance", question: "Is it clearly connected to the learner's goals, experience, or role?" },
  { element: "Confidence", question: "Does the learner believe they can succeed, with appropriate scaffolding?" },
  { element: "Satisfaction", question: "Are there meaningful rewards — intrinsic or extrinsic — for effort?" },
];

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@300;400;500;600&family=DM+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap');

  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    font-family: 'DM Sans', sans-serif;
    background: #0D0D0F;
    color: rgba(255,255,255,0.85);
    -webkit-font-smoothing: antialiased;
  }

  .mono { font-family: 'IBM Plex Mono', monospace; }

  .container {
    max-width: 760px;
    margin: 0 auto;
    padding: 48px 24px;
  }

  .tag-label {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  .card {
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 12px;
    padding: 20px;
  }

  .btn {
    padding: 14px 24px;
    border-radius: 10px;
    border: none;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  .btn:disabled { opacity: 0.3; cursor: not-allowed; }
  .btn-primary { background: linear-gradient(135deg, #C2883A, #D4A04A); color: #0D0D0F; }
  .btn-primary:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 4px 20px rgba(194,136,58,0.3); }
  .btn-secondary { background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.5); }
  .btn-back { background: rgba(255,255,255,0.04); color: rgba(255,255,255,0.4); border: 1px solid rgba(255,255,255,0.08); }

  textarea, input[type="text"] {
    width: 100%;
    padding: 14px 16px;
    border-radius: 10px;
    border: 1px solid rgba(255,255,255,0.08);
    background: rgba(255,255,255,0.03);
    color: rgba(255,255,255,0.85);
    font-size: 14px;
    line-height: 1.5;
    font-family: inherit;
    resize: vertical;
    outline: none;
    transition: border-color 0.2s ease;
  }
  textarea:focus, input[type="text"]:focus { border-color: rgba(194,136,58,0.4); }

  .section-toggle {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 14px 0;
    background: none;
    border: none;
    border-bottom: 1px solid rgba(255,255,255,0.06);
    cursor: pointer;
  }

  .dim-tab {
    padding: 10px 16px;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,0.08);
    background: rgba(255,255,255,0.03);
    cursor: pointer;
    transition: all 0.2s ease;
    text-align: center;
  }
  .dim-tab.active { border-color: rgba(255,255,255,0.2); background: rgba(255,255,255,0.06); }
  .dim-tab.complete { border-color: rgba(194,136,58,0.3); }

  .slider-track {
    width: 100%;
    height: 6px;
    border-radius: 3px;
    background: rgba(255,255,255,0.08);
    position: relative;
    cursor: pointer;
  }

  .raci-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    border-radius: 4px;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 10px;
    font-weight: 600;
  }
  .raci-R { background: rgba(194,136,58,0.25); color: #D4A04A; }
  .raci-A { background: rgba(45,125,154,0.25); color: #5DB8D4; }
  .raci-C { background: rgba(107,142,35,0.25); color: #9AB84D; }
  .raci-I { background: rgba(139,93,170,0.2); color: #B08DD0; }

  .phase-bar {
    height: 8px;
    border-radius: 4px;
    transition: width 0.6s ease;
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .fade-in { animation: fadeIn 0.4s ease forwards; }

  .risk-high { border-left: 3px solid #C05746; }
  .risk-medium { border-left: 3px solid #D4A04A; }
  .risk-low { border-left: 3px solid #6B8E23; }
`;

// ─── Main App ────────────────────────────────────────────────────────────────

export default function App() {
  const topRef = useRef(null);
  const [step, setStep] = useState(0);

  // Step 0: Performance Reality
  const [context, setContext] = useState({ role: "", task: "", gap: "", stakes: "", constraints: "" });

  // Step 1: Dimensional Diagnosis
  const [answers, setAnswers] = useState({});
  const [activeDim, setActiveDim] = useState(0);

  // Step 2: Design Recommendations
  const [contentTypes, setContentTypes] = useState([]);
  const [merrillChecks, setMerrillChecks] = useState({});
  const [arcsChecks, setArcsChecks] = useState({});
  const [expanded, setExpanded] = useState({});

  // Step 3: Project Plan
  const [projectConfig, setProjectConfig] = useState({ devProcess: "hybrid", projectName: "" });
  const [expandedPhases, setExpandedPhases] = useState({});

  const contextFilled = context.role.trim() && context.task.trim() && context.gap.trim();

  // Calculate dimensional scores
  const scores = useMemo(() => {
    const result = {};
    DIMENSIONS.forEach((dim) => {
      let totalWeight = 0;
      let totalScore = 0;
      dim.questions.forEach((q, qi) => {
        const key = `${dim.id}-${qi}`;
        const val = answers[key];
        if (val !== undefined) {
          totalScore += val * q.weight;
          totalWeight += 5 * q.weight;
        } else {
          totalWeight += 5 * q.weight;
        }
      });
      result[dim.id] = totalWeight > 0 ? Math.round((totalScore / totalWeight) * 100) : 0;
    });
    return result;
  }, [answers]);

  const sortedDimensions = useMemo(() => {
    return [...DIMENSIONS].sort((a, b) => (scores[b.id] || 0) - (scores[a.id] || 0));
  }, [scores]);

  const allDiagQuestionsAnswered = useMemo(() => {
    let total = 0;
    DIMENSIONS.forEach(d => { total += d.questions.length; });
    return Object.keys(answers).length >= total;
  }, [answers]);

  const dimQuestionsComplete = (dimId) => {
    const dim = DIMENSIONS.find(d => d.id === dimId);
    return dim.questions.every((_, qi) => answers[`${dimId}-${qi}`] !== undefined);
  };

  // Recommended dev process
  const recommendedProcess = useMemo(() => {
    const dominant = sortedDimensions[0]?.id;
    if (scores.constructive > 60 || scores.social > 60) return "iterative";
    if (scores.associative > 60 || scores.cognitive > 60) return "stable";
    return "hybrid";
  }, [scores, sortedDimensions]);

  // Project plan generation
  const projectPlan = useMemo(() => {
    if (step < 3) return null;
    return generateProjectPlan(context, scores, contentTypes, projectConfig.devProcess);
  }, [step, context, scores, contentTypes, projectConfig.devProcess]);

  const totalEffort = useMemo(() => {
    if (!projectPlan) return 0;
    return projectPlan.wbs.reduce((sum, phase) =>
      sum + phase.tasks.reduce((s, t) => s + t.effort, 0), 0
    );
  }, [projectPlan]);

  const scrollToTop = () => topRef.current?.scrollIntoView({ behavior: "smooth" });

  const goToStep = (s) => { setStep(s); setTimeout(scrollToTop, 50); };

  const toggle = (key) => setExpanded(p => ({ ...p, [key]: !p[key] }));
  const togglePhase = (key) => setExpandedPhases(p => ({ ...p, [key]: !p[key] }));

  const ProgressBar = ({ score, max, color }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ flex: 1, height: 6, borderRadius: 3, background: "rgba(255,255,255,0.06)" }}>
        <div style={{ height: "100%", borderRadius: 3, width: `${max > 0 ? (score / max) * 100 : 0}%`, background: `linear-gradient(90deg, ${color}88, ${color})`, transition: "width 0.4s ease" }} />
      </div>
      <span className="mono" style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", minWidth: 36, textAlign: "right" }}>{Math.round(max > 0 ? (score / max) * 100 : 0)}%</span>
    </div>
  );

  const RACIBadge = ({ type }) => (
    <span className={`raci-badge raci-${type}`}>{type}</span>
  );

  return (
    <div className="container">
      <style>{styles}</style>
      <div ref={topRef} />

      {/* Header */}
      <div style={{ marginBottom: 40 }}>
        <div className="tag-label" style={{ color: "#C2883A", marginBottom: 8, letterSpacing: "0.2em" }}>Adaptive Learning Framework</div>
        <h1 style={{ fontSize: 28, fontWeight: 700, lineHeight: 1.2, color: "rgba(255,255,255,0.95)" }}>
          Decisioning Toolkit <span className="mono" style={{ fontSize: 14, color: "rgba(255,255,255,0.25)", fontWeight: 400 }}>v2.0</span>
        </h1>
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 15, marginTop: 8, lineHeight: 1.5 }}>
          Diagnose, design, and plan — from learning challenge to project execution.
        </p>
      </div>

      {/* Step Indicator */}
      <div style={{ display: "flex", gap: 4, marginBottom: 36 }}>
        {STEPS.map((s, i) => (
          <div key={i} style={{ flex: 1 }}>
            <div style={{ height: 3, borderRadius: 2, background: i <= step ? "linear-gradient(90deg, #C2883A, #D4A04A)" : "rgba(255,255,255,0.08)", transition: "background 0.4s ease", marginBottom: 8 }} />
            <div className="mono" style={{ fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", color: i <= step ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.2)", fontWeight: i === step ? 600 : 400 }}>{s}</div>
          </div>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* STEP 0: PERFORMANCE REALITY                                       */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {step === 0 && (
        <div className="fade-in">
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="tag-label" style={{ color: "#C2883A", marginBottom: 6 }}>Ground Rule</div>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.55)", lineHeight: 1.6 }}>
              Before selecting any theory, model, or solution — describe the performance reality. What does success actually look like in context? These inputs anchor the entire diagnostic and feed the project plan.
            </p>
          </div>

          {[
            { key: "role", label: "Who is the learner?", placeholder: "Role, experience level, current capability, relevant context..." },
            { key: "task", label: "What must they be able to do?", placeholder: "Describe the target performance as it looks in the real environment..." },
            { key: "gap", label: "What is the current gap?", placeholder: "What is happening now vs. what should be happening? Be specific..." },
            { key: "stakes", label: "What are the stakes?", placeholder: "What happens if the gap persists? What improves if it closes?", optional: true },
            { key: "constraints", label: "What are the constraints?", placeholder: "Timeline, budget, technology, stakeholder dynamics, learner availability...", optional: true },
          ].map((field) => (
            <div key={field.key} style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 14, fontWeight: 600, marginBottom: 8, color: "rgba(255,255,255,0.8)" }}>
                {field.label}
                {field.optional && <span style={{ fontWeight: 400, color: "rgba(255,255,255,0.3)", fontSize: 12, marginLeft: 8 }}>Optional</span>}
              </label>
              <textarea
                value={context[field.key]}
                onChange={(e) => setContext(prev => ({ ...prev, [field.key]: e.target.value }))}
                placeholder={field.placeholder}
                rows={3}
              />
            </div>
          ))}

          <button className="btn btn-primary" style={{ width: "100%" }} disabled={!contextFilled} onClick={() => goToStep(1)}>
            Begin Dimensional Diagnosis →
          </button>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* STEP 1: DIMENSIONAL DIAGNOSIS                                     */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {step === 1 && (
        <div className="fade-in">
          {/* Dimension tabs */}
          <div style={{ display: "flex", gap: 6, marginBottom: 24, flexWrap: "wrap" }}>
            {DIMENSIONS.map((dim, i) => (
              <button
                key={dim.id}
                className={`dim-tab ${i === activeDim ? "active" : ""} ${dimQuestionsComplete(dim.id) ? "complete" : ""}`}
                onClick={() => setActiveDim(i)}
                style={{ flex: 1, minWidth: 100 }}
              >
                <div className="mono" style={{ fontSize: 10, color: dim.color, marginBottom: 2 }}>{dim.name}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>{dim.subtitle}</div>
                {dimQuestionsComplete(dim.id) && <div style={{ fontSize: 10, color: "#C2883A", marginTop: 4 }}>✓</div>}
              </button>
            ))}
          </div>

          {/* Active dimension questions */}
          {(() => {
            const dim = DIMENSIONS[activeDim];
            return (
              <div>
                <div style={{ marginBottom: 20 }}>
                  <div className="tag-label" style={{ color: dim.color, marginBottom: 4 }}>{dim.name} Dimension</div>
                  <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>Rate each indicator from 0 (not relevant) to 5 (critically important)</p>
                </div>

                {dim.questions.map((q, qi) => {
                  const key = `${dim.id}-${qi}`;
                  const val = answers[key];
                  return (
                    <div key={qi} className="card" style={{ marginBottom: 12 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.75)", lineHeight: 1.5, flex: 1, paddingRight: 16 }}>{q.q}</p>
                        <span className="mono" style={{ fontSize: 10, color: "rgba(255,255,255,0.2)" }}>×{q.weight}</span>
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        {[0, 1, 2, 3, 4, 5].map(n => (
                          <button
                            key={n}
                            onClick={() => setAnswers(prev => ({ ...prev, [key]: n }))}
                            style={{
                              width: 40, height: 36, borderRadius: 6,
                              border: val === n ? `2px solid ${dim.color}` : "1px solid rgba(255,255,255,0.08)",
                              background: val === n ? `${dim.color}20` : "rgba(255,255,255,0.03)",
                              color: val === n ? dim.color : "rgba(255,255,255,0.4)",
                              fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, fontWeight: 600,
                              cursor: "pointer", transition: "all 0.15s ease",
                            }}
                          >{n}</button>
                        ))}
                      </div>
                    </div>
                  );
                })}

                {/* Nav between dimensions */}
                <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
                  {activeDim > 0 && (
                    <button className="btn btn-back" style={{ flex: 1 }} onClick={() => setActiveDim(activeDim - 1)}>← {DIMENSIONS[activeDim - 1].name}</button>
                  )}
                  {activeDim < DIMENSIONS.length - 1 && (
                    <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setActiveDim(activeDim + 1)}>{DIMENSIONS[activeDim + 1].name} →</button>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Dimensional Profile (live) */}
          <div className="card" style={{ marginTop: 24 }}>
            <div className="tag-label" style={{ color: "#C2883A", marginBottom: 12 }}>Live Dimensional Profile</div>
            {DIMENSIONS.map(dim => (
              <div key={dim.id} style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span className="mono" style={{ fontSize: 11, color: dim.color }}>{dim.name}</span>
                </div>
                <ProgressBar score={scores[dim.id]} max={100} color={dim.color} />
              </div>
            ))}
          </div>

          {/* Proceed */}
          <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
            <button className="btn btn-back" style={{ flex: 1 }} onClick={() => goToStep(0)}>← Performance Reality</button>
            <button className="btn btn-primary" style={{ flex: 2 }} disabled={!allDiagQuestionsAnswered} onClick={() => goToStep(2)}>
              {allDiagQuestionsAnswered ? "View Recommendations →" : `Answer all questions (${Object.keys(answers).length}/${DIMENSIONS.reduce((s, d) => s + d.questions.length, 0)})`}
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* STEP 2: DESIGN RECOMMENDATIONS                                    */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {step === 2 && (
        <div className="fade-in">
          {/* Dimensional Profile */}
          <div className="card" style={{ marginBottom: 24 }}>
            <div className="tag-label" style={{ color: "#C2883A", marginBottom: 12 }}>Dimensional Profile</div>
            {sortedDimensions.map(dim => (
              <div key={dim.id} style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span className="mono" style={{ fontSize: 11, color: dim.color }}>{dim.name}</span>
                  <span className="mono" style={{ fontSize: 11, color: scores[dim.id] > 60 ? dim.color : "rgba(255,255,255,0.3)" }}>
                    {scores[dim.id] > 60 ? "PRIMARY" : scores[dim.id] > 40 ? "SECONDARY" : "LOW"}
                  </span>
                </div>
                <ProgressBar score={scores[dim.id]} max={100} color={dim.color} />
              </div>
            ))}
          </div>

          {/* Recommended Models */}
          <div style={{ marginBottom: 24 }}>
            <button className="section-toggle" onClick={() => toggle("models")}>
              <span className="tag-label" style={{ color: "#C2883A" }}>Recommended Models & Modalities</span>
              <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 18 }}>{expanded.models ? "−" : "+"}</span>
            </button>
            {expanded.models && (
              <div style={{ paddingTop: 16 }}>
                {sortedDimensions.filter(d => scores[d.id] > 30).map(dim => (
                  <div key={dim.id} className="card" style={{ marginBottom: 12 }}>
                    <div className="mono" style={{ fontSize: 11, color: dim.color, marginBottom: 8 }}>{dim.name} — {scores[dim.id]}%</div>
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.8)", marginBottom: 4 }}>Primary Model: {MODELS[dim.id].primary}</div>
                      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>Supporting: {MODELS[dim.id].supporting.join(" · ")}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.6)", marginBottom: 6 }}>Delivery Strategies:</div>
                      {MODALITIES[dim.id].map((m, i) => (
                        <div key={i} style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", padding: "4px 0", paddingLeft: 12, borderLeft: `2px solid ${dim.color}30` }}>{m}</div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Content Type Selection */}
          <div style={{ marginBottom: 24 }}>
            <button className="section-toggle" onClick={() => toggle("content")}>
              <span className="tag-label" style={{ color: "#C2883A" }}>Content Classification</span>
              <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 18 }}>{expanded.content ? "−" : "+"}</span>
            </button>
            {expanded.content && (
              <div style={{ paddingTop: 16 }}>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginBottom: 12 }}>Select the content types present in this project (drives task generation in the project plan):</p>
                {CONTENT_TYPES.map(ct => (
                  <label key={ct.id} className="card" style={{
                    display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 8, cursor: "pointer",
                    ...(contentTypes.includes(ct.id) ? { borderColor: "rgba(194,136,58,0.3)", background: "rgba(194,136,58,0.05)" } : {})
                  }}>
                    <input
                      type="checkbox"
                      checked={contentTypes.includes(ct.id)}
                      onChange={() => setContentTypes(prev => prev.includes(ct.id) ? prev.filter(x => x !== ct.id) : [...prev, ct.id])}
                      style={{ accentColor: "#C2883A", marginTop: 3 }}
                    />
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.8)" }}>{ct.icon} {ct.label}</div>
                      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>{ct.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Merrill's First Principles Checklist */}
          <div style={{ marginBottom: 24 }}>
            <button className="section-toggle" onClick={() => toggle("merrill")}>
              <span className="tag-label" style={{ color: "#2D7D9A" }}>Merrill's First Principles Audit</span>
              <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 18 }}>{expanded.merrill ? "−" : "+"}</span>
            </button>
            {expanded.merrill && (
              <div style={{ paddingTop: 16 }}>
                {MERRILL_ITEMS.map((item, i) => (
                  <label key={i} className="card" style={{
                    display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 8, cursor: "pointer",
                    ...(merrillChecks[i] ? { borderColor: "rgba(45,125,154,0.3)", background: "rgba(45,125,154,0.05)" } : {})
                  }}>
                    <input type="checkbox" checked={!!merrillChecks[i]} onChange={() => setMerrillChecks(p => ({ ...p, [i]: !p[i] }))} style={{ accentColor: "#2D7D9A", marginTop: 3 }} />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14, color: "rgba(255,255,255,0.85)" }}>{item.principle}</div>
                      <div style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", marginTop: 2 }}>{item.question}</div>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* ARCS Motivation Checklist */}
          <div style={{ marginBottom: 24 }}>
            <button className="section-toggle" onClick={() => toggle("arcs")}>
              <span className="tag-label" style={{ color: "#C05746" }}>ARCS Motivation Audit</span>
              <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 18 }}>{expanded.arcs ? "−" : "+"}</span>
            </button>
            {expanded.arcs && (
              <div style={{ paddingTop: 16 }}>
                {ARCS_ITEMS.map((item, i) => (
                  <label key={i} className="card" style={{
                    display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 8, cursor: "pointer",
                    ...(arcsChecks[i] ? { borderColor: "rgba(192,87,70,0.3)", background: "rgba(192,87,70,0.05)" } : {})
                  }}>
                    <input type="checkbox" checked={!!arcsChecks[i]} onChange={() => setArcsChecks(p => ({ ...p, [i]: !p[i] }))} style={{ accentColor: "#C05746", marginTop: 3 }} />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14, color: "rgba(255,255,255,0.85)" }}>{item.element}</div>
                      <div style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", marginTop: 2 }}>{item.question}</div>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Nav */}
          <div style={{ display: "flex", gap: 12 }}>
            <button className="btn btn-back" style={{ flex: 1 }} onClick={() => goToStep(1)}>← Revise Diagnosis</button>
            <button className="btn btn-primary" style={{ flex: 2 }} disabled={contentTypes.length === 0} onClick={() => {
              setProjectConfig(p => ({ ...p, devProcess: recommendedProcess }));
              goToStep(3);
            }}>
              {contentTypes.length === 0 ? "Select content types to continue" : "Generate Project Plan →"}
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* STEP 3: PROJECT PLAN                                              */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {step === 3 && projectPlan && (
        <div className="fade-in">
          {/* Project Charter Summary */}
          <div className="card" style={{ marginBottom: 24, borderColor: "rgba(194,136,58,0.15)" }}>
            <div className="tag-label" style={{ color: "#C2883A", marginBottom: 12 }}>Project Charter</div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.5)", marginBottom: 6 }}>Project Name</label>
              <input
                type="text"
                value={projectConfig.projectName}
                onChange={(e) => setProjectConfig(p => ({ ...p, projectName: e.target.value }))}
                placeholder="e.g., New Hire Onboarding Redesign"
                style={{ fontSize: 16, fontWeight: 600 }}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              <div style={{ padding: 12, borderRadius: 8, background: "rgba(255,255,255,0.03)" }}>
                <div className="mono" style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginBottom: 4 }}>COMPLEXITY</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: projectPlan.complexity === "high" ? "#C05746" : projectPlan.complexity === "medium" ? "#D4A04A" : "#6B8E23" }}>
                  {projectPlan.complexity.toUpperCase()}
                </div>
              </div>
              <div style={{ padding: 12, borderRadius: 8, background: "rgba(255,255,255,0.03)" }}>
                <div className="mono" style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginBottom: 4 }}>EST. TOTAL EFFORT</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: "rgba(255,255,255,0.85)" }}>{Math.round(totalEffort)} days</div>
              </div>
              <div style={{ padding: 12, borderRadius: 8, background: "rgba(255,255,255,0.03)" }}>
                <div className="mono" style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginBottom: 4 }}>CONTENT TYPES</div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.7)" }}>{contentTypes.map(ct => CONTENT_TYPES.find(c => c.id === ct)?.label).join(", ")}</div>
              </div>
              <div style={{ padding: 12, borderRadius: 8, background: "rgba(255,255,255,0.03)" }}>
                <div className="mono" style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginBottom: 4 }}>DOMINANT DIMENSION</div>
                <div style={{ fontSize: 13, color: sortedDimensions[0]?.color }}>{sortedDimensions[0]?.name} ({scores[sortedDimensions[0]?.id]}%)</div>
              </div>
            </div>

            <div style={{ padding: 12, borderRadius: 8, background: "rgba(255,255,255,0.03)", marginBottom: 12 }}>
              <div className="mono" style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginBottom: 4 }}>SCOPE</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", lineHeight: 1.5 }}>
                <strong style={{ color: "rgba(255,255,255,0.8)" }}>Learner:</strong> {context.role}<br />
                <strong style={{ color: "rgba(255,255,255,0.8)" }}>Target Performance:</strong> {context.task}<br />
                <strong style={{ color: "rgba(255,255,255,0.8)" }}>Gap:</strong> {context.gap}
              </div>
            </div>
          </div>

          {/* Development Process Selection */}
          <div className="card" style={{ marginBottom: 24 }}>
            <div className="tag-label" style={{ color: "#C2883A", marginBottom: 12 }}>Development Methodology</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {Object.entries(DEV_PROCESSES).map(([key, proc]) => (
                <button
                  key={key}
                  onClick={() => setProjectConfig(p => ({ ...p, devProcess: key }))}
                  className="card"
                  style={{
                    flex: 1, minWidth: 180, cursor: "pointer", textAlign: "left",
                    ...(projectConfig.devProcess === key ? { borderColor: "rgba(194,136,58,0.4)", background: "rgba(194,136,58,0.08)" } : {})
                  }}
                >
                  <div style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.85)", marginBottom: 4 }}>
                    {proc.name}
                    {key === recommendedProcess && <span className="mono" style={{ fontSize: 10, color: "#C2883A", marginLeft: 8 }}>RECOMMENDED</span>}
                  </div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", lineHeight: 1.4 }}>{proc.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Team & RACI Legend */}
          <div className="card" style={{ marginBottom: 24 }}>
            <div className="tag-label" style={{ color: "#C2883A", marginBottom: 12 }}>Project Team</div>
            <div style={{ display: "flex", gap: 16, marginBottom: 16, flexWrap: "wrap" }}>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}><RACIBadge type="R" /><span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>Responsible</span></div>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}><RACIBadge type="A" /><span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>Accountable</span></div>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}><RACIBadge type="C" /><span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>Consulted</span></div>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}><RACIBadge type="I" /><span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>Informed</span></div>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {projectPlan.roles.map(r => (
                <div key={r.abbr} style={{ padding: "6px 12px", borderRadius: 6, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <span className="mono" style={{ fontSize: 11, fontWeight: 600, color: "#D4A04A" }}>{r.abbr}</span>
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginLeft: 8 }}>{r.role}</span>
                </div>
              ))}
            </div>
          </div>

          {/* WBS - Work Breakdown Structure */}
          <div style={{ marginBottom: 24 }}>
            <div className="tag-label" style={{ color: "#C2883A", marginBottom: 16 }}>Work Breakdown Structure</div>

            {/* Phase effort overview */}
            <div className="card" style={{ marginBottom: 16 }}>
              {projectPlan.wbs.map((phase, pi) => {
                const phaseEffort = phase.tasks.reduce((s, t) => s + t.effort, 0);
                const phasePct = totalEffort > 0 ? (phaseEffort / totalEffort) * 100 : 0;
                const colors = ["#C05746", "#2D7D9A", "#6B8E23", "#8B5DAA", "#D4A04A", "#C2883A"];
                return (
                  <div key={pi} style={{ marginBottom: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 13, color: "rgba(255,255,255,0.7)" }}>{phase.name}</span>
                      <span className="mono" style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{Math.round(phaseEffort)}d ({Math.round(phasePct)}%)</span>
                    </div>
                    <div style={{ height: 8, borderRadius: 4, background: "rgba(255,255,255,0.06)" }}>
                      <div className="phase-bar" style={{ width: `${phasePct}%`, background: `linear-gradient(90deg, ${colors[pi]}88, ${colors[pi]})` }} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Expandable phase details */}
            {projectPlan.wbs.map((phase, pi) => (
              <div key={pi} style={{ marginBottom: 8 }}>
                <button
                  onClick={() => togglePhase(pi)}
                  style={{
                    width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "12px 16px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.06)",
                    background: expandedPhases[pi] ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.02)",
                    cursor: "pointer", transition: "all 0.2s ease",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span className="mono" style={{ fontSize: 11, color: "#C2883A", fontWeight: 600 }}>{String(pi + 1).padStart(2, "0")}</span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.85)" }}>{phase.name}</span>
                    <span className="mono" style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{phase.tasks.length} tasks</span>
                  </div>
                  <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 16 }}>{expandedPhases[pi] ? "−" : "+"}</span>
                </button>

                {expandedPhases[pi] && (
                  <div style={{ padding: "12px 0" }}>
                    {phase.tasks.map((task, ti) => (
                      <div key={ti} className="card" style={{ marginBottom: 8, padding: 14 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                          <div style={{ fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.8)", flex: 1, paddingRight: 12 }}>{task.task}</div>
                          <span className="mono" style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", whiteSpace: "nowrap" }}>{task.effort}d</span>
                        </div>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                          {Object.entries(task.raci || {}).map(([role, type]) => (
                            <div key={role} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                              <RACIBadge type={type} />
                              <span className="mono" style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>{role}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Risk Register */}
          <div style={{ marginBottom: 24 }}>
            <div className="tag-label" style={{ color: "#C2883A", marginBottom: 12 }}>Risk Register</div>
            {projectPlan.risks.map((r, i) => (
              <div key={i} className={`card risk-${r.impact.toLowerCase()}`} style={{ marginBottom: 8, paddingLeft: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.8)" }}>{r.risk}</span>
                  <span className="mono" style={{ fontSize: 10, color: r.impact === "High" ? "#C05746" : r.impact === "Medium" ? "#D4A04A" : "#6B8E23" }}>{r.impact}</span>
                </div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.5 }}>
                  <strong style={{ color: "rgba(255,255,255,0.6)" }}>Mitigation:</strong> {r.mitigation}
                </div>
              </div>
            ))}
          </div>

          {/* Nav */}
          <div style={{ display: "flex", gap: 12 }}>
            <button className="btn btn-back" style={{ flex: 1 }} onClick={() => goToStep(2)}>← Design Recommendations</button>
            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => {
              setStep(0);
              setContext({ role: "", task: "", gap: "", stakes: "", constraints: "" });
              setAnswers({});
              setActiveDim(0);
              setContentTypes([]);
              setMerrillChecks({});
              setArcsChecks({});
              setExpanded({});
              setExpandedPhases({});
              setProjectConfig({ devProcess: "hybrid", projectName: "" });
              setTimeout(scrollToTop, 50);
            }}>Start New Project</button>
          </div>

          {/* Footer */}
          <div style={{ marginTop: 40, paddingTop: 20, borderTop: "1px solid rgba(255,255,255,0.06)", textAlign: "center" }}>
            <div className="mono" style={{ fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(255,255,255,0.2)" }}>
              Adaptive Learning Framework — Decisioning Toolkit v2.0
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
