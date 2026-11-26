export type Guide = {
  slug: string
  title: string
  description: string
  updated: string
  keyPoints: string[]
  sections: Array<{ heading: string; paragraphs: string[] }>
  faqs: Array<{ question: string; answer: string }>
}

export const GUIDES: Guide[] = [
  {
    slug: 'how-cap-rounds-work',
    title: 'How Maharashtra CAP rounds actually work',
    description:
      'A plain-language walkthrough of CAP rounds, option forms, allotment logic, and spot rounds for Maharashtra engineering admissions.',
    updated: '2026-11-26',
    keyPoints: [
      'You rank colleges and branches in an option form; the system allots the highest preference you clear.',
      'Closing cutoffs usually ease in later rounds as seats roll down.',
      'Spot rounds are separate, short, and institute-level — never assume they repeat.',
    ],
    sections: [
      {
        heading: 'The short version',
        paragraphs: [
          'CAP (Common Admission Process) allocates seats using your entrance-exam percentile, category, quotas, and the order of choices you submit. The allotment engine walks your preferences from top to bottom and gives you the first choice you clear.',
          'That is why preference order matters more than a list of "safe" colleges. A lower-choice college you clear can never be reached if you are allotted a higher choice first.',
        ],
      },
      {
        heading: 'What changes between rounds',
        paragraphs: [
          'Each regular CAP round publishes a new closing cutoff for every institute, branch, and category. Cutoffs often fall in later rounds as vacant seats roll down, but the pattern is not guaranteed.',
          'Treat round-wise cutoffs as evidence of what happened, not a promise of what will happen. Use several years and rounds together, and always check the official CET Cell portal before a deadline.',
        ],
      },
      {
        heading: 'Where spot rounds fit',
        paragraphs: [
          'After regular rounds, institutes may publish vacant seats through spot or institute-level rounds. These have their own eligibility, documents, and very short deadlines. CampusScope flags them separately instead of mixing them into regular CAP cutoffs.',
        ],
      },
    ],
    faqs: [
      {
        question: 'Does a higher preference guarantee allotment?',
        answer:
          'No. You are allotted the highest preference you clear, subject to category, quota, seat availability, and document verification.',
      },
      {
        question: 'Why do cutoffs change every round?',
        answer:
          'Seats left vacant in one round roll into the next. The last admitted candidate can therefore close at a different percentile each round.',
      },
      {
        question: 'Should I rely only on last year’s cutoff?',
        answer:
          'No. Use multiple years, multiple rounds, category-specific rows, and seat information. Last year is one input, not a rule.',
      },
    ],
  },
  {
    slug: 'how-to-fill-option-form',
    title: 'How to fill a CAP option form without regret',
    description:
      'Preference ordering, common mistakes, and how to practice with a CAP-style option form before the official portal opens.',
    updated: '2026-11-26',
    keyPoints: [
      'Order choices by what you would actually accept, not by how hard the college is.',
      'Do not put a reach college above a choice you would happily take.',
      'Check branch codes, category, and home-university status before locking choices.',
    ],
    sections: [
      {
        heading: 'Start with honest preferences',
        paragraphs: [
          'Decide which college and branch you would genuinely attend if allotted. Then order those choices exactly in that order. The system cannot skip a higher choice you clear to give you a lower one you like better.',
          'A useful practice list mixes reachable, target, and safer options. Use the predictor output as a starting point, not a final ranking.',
        ],
      },
      {
        heading: 'Mistakes to avoid',
        paragraphs: [
          'Duplicating the same college and branch, mixing up branch codes, forgetting the home-university distinction, and filling choices at the last minute are the most common errors.',
          'Before locking the form, read every choice code and confirm the category and quota shown against it. Keep a saved copy of your final order.',
        ],
      },
      {
        heading: 'Practise before the real form',
        paragraphs: [
          'CampusScope’s option-form tool lets you build a preference list, reorder it, spot impossible choices, and export a CSV. It is practice only — the official portal is the authority.',
        ],
      },
    ],
    faqs: [
      {
        question: 'Should I put my dream college first even if it is a reach?',
        answer:
          'Only if you would accept it immediately if allotted. A reach at the top does not block lower choices if you do not clear it.',
      },
      {
        question: 'Can I change choices after locking?',
        answer:
          'That depends on the official round schedule and portal rules. Check the current information brochure and notices.',
      },
      {
        question: 'Is the CampusScope option form official?',
        answer:
          'No. It is a practice tool built from historical cutoffs. Always submit choices on the official CET Cell portal.',
      },
    ],
  },
  {
    slug: 'home-university-quota',
    title: 'Home University vs Other Than Home University',
    description:
      'What the H and O seat labels mean in DTE CAP cutoffs and why they change closing percentiles.',
    updated: '2026-11-26',
    keyPoints: [
      'H and O in category codes mark Home University and Other Than Home University seat pools.',
      'A college can have very different cutoffs for H and O rows in the same round.',
      'Eligibility and documents are defined by the current official brochure.',
    ],
    sections: [
      {
        heading: 'Reading the codes',
        paragraphs: [
          'In official DTE PDFs, codes such as GOPENS, LOPENS, GSCH, and GOPENO combine a gender/category prefix with a level suffix. H means Home University; O means Other Than Home University; S means State Level.',
          'CampusScope preserves the raw code and also shows a simplified level label so you can compare like with like.',
        ],
      },
      {
        heading: 'Why it changes the cutoff',
        paragraphs: [
          'The two pools have different eligible candidate sets and often different seat counts. A college may close much higher in one pool than the other in the same round.',
          'When you compare cutoffs, compare the same category and the same level. Mixing them produces misleading conclusions.',
        ],
      },
      {
        heading: 'Documents',
        paragraphs: [
          'Home-university claims usually require specific certificates or domicile/qualification proof. The exact list changes by year and institute — read the official information brochure and keep originals ready.',
        ],
      },
    ],
    faqs: [
      {
        question: 'Is Home University the same as home district?',
        answer:
          'No. It is defined by the admission authority and institute affiliation rules, not simply by your district.',
      },
      {
        question: 'Can I claim both H and O?',
        answer:
          'Eligibility depends on the current rules and your certificates. Do not assume both; check the brochure.',
      },
      {
        question: 'How does CampusScope handle this?',
        answer:
          'Each cutoff row stores its level and raw category code, and the predictor exposes an OTH penalty in the probability model.',
      },
    ],
  },
  {
    slug: 'cutoffs-explained',
    title: 'Cutoff percentiles, ranks, and stages explained',
    description:
      'How to read DTE CAP cutoff PDFs: closing rank, percentile, stage rows, category codes, and source pages.',
    updated: '2026-11-26',
    keyPoints: [
      'The rank is the All India or State merit number of the last allotted candidate.',
      'The bracketed number is the percentile, not the rank.',
      'Stage rows such as I, II, VII reflect admission stages within a round.',
    ],
    sections: [
      {
        heading: 'What a cutoff row means',
        paragraphs: [
          'A DTE cutoff row records the last candidate who was allotted a seat for that institute, branch, category, round, and level. The number before the bracket is the merit rank; the bracketed value is the percentile.',
          'CampusScope imports both values and links the row to the exact PDF and page it came from.',
        ],
      },
      {
        heading: 'Why multiple stage rows exist',
        paragraphs: [
          'PDFs can contain several stages inside one round (I, II, VII, and special PWD/DEF sub-rows). They reflect the progression of allotments. Do not treat them as separate CAP rounds.',
          'The profile table lets you filter by round, category, and level so you can compare the same kind of row across years.',
        ],
      },
      {
        heading: 'Using cutoffs honestly',
        paragraphs: [
          'A cutoff is an outcome, not a forecast. Use several rounds and years, compare the same category and level, and check whether a row is verified before relying on it.',
        ],
      },
    ],
    faqs: [
      {
        question: 'Is a lower closing rank harder or easier?',
        answer:
          'A lower merit rank means a better rank, so the cutoff is harder to clear. Percentile usually moves in the same direction.',
      },
      {
        question: 'Can two rows for one branch both be OPEN?',
        answer:
          'Yes. They can be different levels (H/O/S), genders, or special sub-stages. Compare the raw code and level.',
      },
      {
        question: 'Where can I verify a row?',
        answer:
          'Every CampusScope cutoff row includes a source badge linking to the official PDF, with the page number.',
      },
    ],
  },
  {
    slug: 'categories-and-documents',
    title: 'Maharashtra engineering categories and documents',
    description:
      'A practical overview of OPEN, OBC, SC, ST, EWS, TFWS, VJ/NT, SEBC, PWD, DEF, ORPHAN, and JKM categories.',
    updated: '2026-11-26',
    keyPoints: [
      'Category codes in official PDFs include gender and level prefixes.',
      'Certificate validity and cutoff dates are defined by the current brochure.',
      'CampusScope never decides eligibility — it only shows sourced rows.',
    ],
    sections: [
      {
        heading: 'Common categories',
        paragraphs: [
          'Maharashtra CAP documents list OPEN, OBC, SC, ST, EWS, TFWS, VJ/NT, SEBC, PWD, DEF, ORPHAN, and JKM among others. Each has its own seat pool and certificate requirements.',
          'Some codes add G or L for General/Ladies and H, O, or S for Home University, Other Than Home University, or State Level.',
        ],
      },
      {
        heading: 'Documents change every year',
        paragraphs: [
          'Caste, EWS, income, domicile, and disability certificates have validity rules and cutoff dates. The official information brochure is the only authority for the current year.',
          'Keep scanned and original copies ready, and check that names and dates match across documents.',
        ],
      },
      {
        heading: 'How CampusScope helps',
        paragraphs: [
          'The app normalizes raw category codes into readable labels while preserving the original code on every row. It does not grant eligibility or replace official verification.',
        ],
      },
    ],
    faqs: [
      {
        question: 'Does TFWS need an income certificate?',
        answer:
          'TFWS eligibility and income conditions are defined by the current brochure. Check the official rules for the admission year.',
      },
      {
        question: 'Can I change my category after the merit list?',
        answer:
          'Category changes are governed by official rules and document verification deadlines. Contact the admission authority.',
      },
      {
        question: 'Does CampusScope verify my documents?',
        answer:
          'No. It shows sourced cutoff data and explains how to read it. Document verification is done by the admission authority.',
      },
    ],
  },
]

export function getGuide(slug: string): Guide | undefined {
  return GUIDES.find((guide) => guide.slug === slug)
}
