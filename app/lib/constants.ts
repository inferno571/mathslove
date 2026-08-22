import { GradeConfig } from './types';

export const GRADE_CONFIGS: GradeConfig[] = [
  {
    key: 'grade_5',
    label: 'Grade 5',
    gradeRange: '5',
    ageRange: '10-11 years',
    description: 'Decimals, fraction operations, ratios, and coordinate planes.',
    file: '5th_6th_grade_set_normalized.json',
    enriched: true,
    icon: '',
    color: '#f59e0b',
  },
  {
    key: 'grade_6',
    label: 'Grade 6',
    gradeRange: '6',
    ageRange: '11-12 years',
    description: 'Percentages, ratios, rates, algebraic thinking, and volume.',
    file: '5th_6th_grade_set_normalized.json',
    enriched: true,
    icon: '',
    color: '#f97316',
  },
  {
    key: 'grade_7',
    label: 'Grade 7',
    gradeRange: '7',
    ageRange: '12-13 years',
    description: 'Pre-algebra, linear equations, exponents, and geometry.',
    file: '7th_8th_grade_set_normalized.json',
    enriched: true,
    icon: '',
    color: '#a78bfa',
  },
  {
    key: 'grade_8',
    label: 'Grade 8',
    gradeRange: '8',
    ageRange: '13-14 years',
    description: 'Systems of equations, Pythagorean Theorem, probability, and complex problems.',
    file: '7th_8th_grade_set_normalized.json',
    enriched: true,
    icon: '',
    color: '#c084fc',
  },
];

export const QUESTIONS_PER_TEST = 10;
export const TEST_TIME_LIMIT = 600; // 10 minutes in seconds
