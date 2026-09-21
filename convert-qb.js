/**
 * convert-qb.js
 * Converts latestqb/*.xlsx files to public/data/*.json in the normalized format
 * expected by the app's QuestionSet / Question types.
 */

const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const qbDir = path.join(__dirname, 'latestqb');
const outDir = path.join(__dirname, 'public', 'data');

// Map: xlsx filename → output JSON filename + metadata
const fileMap = [
  {
    file: 'QB4.1.xlsx',
    out: 'grade_4_set_normalized.json',
    name: 'Grade 4 Mathematics Question Set',
    grade_band: '4th Grade',
    target_students: '9-10 years old',
  },
  {
    file: 'QB5.2.xlsx',
    out: 'grade_5_set_normalized.json',
    name: 'Grade 5 Mathematics Question Set',
    grade_band: '5th Grade',
    target_students: '10-11 years old',
  },
  {
    file: 'QB6.3.xlsx',
    out: 'grade_6_set_normalized.json',
    name: 'Grade 6 Mathematics Question Set',
    grade_band: '6th Grade',
    target_students: '11-12 years old',
  },
  {
    file: 'QB7.1.xlsx',
    out: 'grade_7_set_normalized.json',
    name: 'Grade 7 Mathematics Question Set',
    grade_band: '7th Grade',
    target_students: '12-13 years old',
  },
  {
    file: 'QB8.1.xlsx',
    out: 'grade_8_set_normalized.json',
    name: 'Grade 8 Mathematics Question Set',
    grade_band: '8th Grade',
    target_students: '13-14 years old',
  },
  {
    file: 'QB9.1.xlsx',
    out: 'grade_9_set_normalized.json',
    name: 'Grade 9 Mathematics Question Set',
    grade_band: '9th Grade',
    target_students: '14-15 years old',
  },
  {
    file: 'QB10.1.xlsx',
    out: 'grade_10_set_normalized.json',
    name: 'Grade 10 Mathematics Question Set',
    grade_band: '10th Grade',
    target_students: '15-16 years old',
  },
];

function parseList(val) {
  if (!val) return [];
  return String(val)
    .split(/[|;,\n]/)
    .map(s => s.trim())
    .filter(Boolean);
}

// Choices must ONLY split on pipe `|` — commas are thousand separators in numbers
function parseChoices(val) {
  if (!val) return [];
  const choices = String(val)
    .split('|')
    .map(s => s.trim())
    .filter(Boolean);
  // Deduplicate while preserving order
  return [...new Set(choices)];
}

function parseBool(val) {
  if (typeof val === 'boolean') return val;
  if (typeof val === 'number') return val !== 0;
  const s = String(val).toLowerCase().trim();
  return s === 'true' || s === '1' || s === 'yes';
}

for (const { file, out, name, grade_band, target_students } of fileMap) {
  const xlsxPath = path.join(qbDir, file);
  if (!fs.existsSync(xlsxPath)) {
    console.warn(`SKIP: ${file} not found`);
    continue;
  }

  const wb = XLSX.readFile(xlsxPath);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });

  const questions = rows.map((r, idx) => ({
    id: String(r.id || r.source_id || `Q-${idx + 1}`),
    source_id: String(r.source_id || r.id || `Q-${idx + 1}`),
    original_grade: String(r.original_grade || ''),
    source: String(r.source || ''),
    problem: String(r.problem || ''),
    solution_type: String(r.solution_type || 'MCQ'),
    formula: String(r.formula || ''),
    correct_answer: String(r.correct_answer || ''),
    explanation: String(r.explanation || ''),
    difficulty: String(r.difficulty || 'Medium'),
    topic: String(r.topic || ''),
    cognitive_domain: String(r.cognitive_domain || ''),
    skills: parseList(r.skills),
    calculator_needed: parseBool(r.calculator_needed),
    answer_type: String(r.answer_type || 'MCQ'),
    tags: parseList(r.tags),
    choices: parseChoices(r.choices),
  }));

  const topics = [...new Set(questions.map(q => q.topic))].filter(Boolean);

  const output = {
    name,
    grade_band,
    target_students,
    description: `${questions.length} questions covering: ${topics.join(', ')}.`,
    questions,
  };

  const outPath = path.join(outDir, out);
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2), 'utf-8');
  console.log(`✓ ${out} — ${questions.length} questions, topics: ${topics.join(' | ')}`);
}

console.log('\nDone!');
