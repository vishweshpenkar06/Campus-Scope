import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const facilities = [
  'WiFi', 'Research Labs', 'Library', 'Sports Complex', 'Auditorium',
  'Canteen', 'Medical Center', 'Transport', 'Bank/ATM', 'Gym',
]

const recruiterPool = [
  ['TCS', 'Infosys', 'Microsoft', 'Goldman Sachs', 'Amazon'],
  ['Google', 'Deutsche Bank', 'Qualcomm', 'Adobe', 'L&T'],
  ['Flipkart', 'Wipro', 'Samsung R&D', 'Deloitte', 'Zoho'],
  ['Accenture', 'Oracle', 'Texas Instruments', 'Paytm', 'Siemens'],
]

const scholarshipsBase = ['EBC Scholarship', 'TFWS Tuition Waiver']
const scholarshipsMaharashtra = ['Punjabrao Deshmukh Scheme']

const colleges = [
  ['IIT Bombay', 'Mumbai', 245000, 4.8, 85000, true, 0, 1958, '550 Acres', 'NAAC A++', 'https://www.iitb.ac.in', 'https://jossa.nic.in'],
  ['IIT Delhi', 'New Delhi', 240000, 4.9, 90000, true, 1, 1961, '320 Acres', 'NAAC A++', 'https://www.iitd.ac.in', 'https://jossa.nic.in'],
  ['IIT Madras', 'Chennai', 238000, 4.8, 82000, true, 2, 1959, '620 Acres', 'NAAC A++', 'https://www.iitm.ac.in', 'https://jossa.nic.in'],
  ['IIT Kanpur', 'Kanpur', 230000, 4.7, 78000, true, 3, 1959, '1055 Acres', 'NAAC A++', 'https://www.iitk.ac.in', 'https://jossa.nic.in'],
  ['IIT Kharagpur', 'Kharagpur', 220000, 4.6, 75000, true, 4, 1951, '2100 Acres', 'NAAC A++', 'https://www.iitkgp.ac.in', 'https://jossa.nic.in'],
  ['BITS Pilani', 'Pilani', 580000, 4.7, 120000, true, 0, 1964, '328 Acres', 'NAAC A', 'https://www.bits-pilani.ac.in', 'https://www.bitsadmission.com'],
  ['VIT Vellore', 'Vellore', 198000, 4.4, 65000, true, 1, 1984, '370 Acres', 'NAAC A++', 'https://www.vit.ac.in', 'https://vit.ac.in/admissions'],
  ['Manipal Institute of Technology', 'Manipal', 430000, 4.3, 110000, true, 2, 1957, '600 Acres', 'NAAC A++', 'https://manipal.edu', 'https://manipal.edu/admissions'],
  ['SRM Institute of Science and Technology', 'Chennai', 210000, 4.2, 70000, true, 3, 1985, '250 Acres', 'NAAC A++', 'https://www.srmist.edu.in', 'https://www.srmist.edu.in/admissions'],
  ['Thapar Institute of Engineering', 'Patiala', 390000, 4.4, 95000, true, 4, 1956, '250 Acres', 'NAAC A+', 'https://www.thapar.edu', 'https://www.thapar.edu/admissions'],
  ['DTU', 'New Delhi', 180000, 4.5, 60000, true, 0, 1941, '164 Acres', 'NAAC A+', 'https://www.dtu.ac.in', 'https://jacd.nic.in'],
  ['NSUT', 'New Delhi', 175000, 4.5, 58000, true, 1, 1983, '145 Acres', 'NAAC A+', 'https://www.nsut.ac.in', 'https://jacd.nic.in'],
  ['Jadavpur University', 'Kolkata', 95000, 4.4, 35000, true, 2, 1955, '58 Acres', 'NAAC A++', 'https://www.jadavpuruniversity.in', 'https://www.jadavpuruniversity.in/admissions'],
  ['COEP Technological University', 'Pune', 145000, 4.3, 48000, true, 3, 1854, '36 Acres', 'NAAC A++', 'https://www.coep.ac.in', 'https://cetcell.mahacet.org'],
  ['NIT Trichy', 'Tiruchirappalli', 165000, 4.6, 55000, true, 4, 1964, '350 Acres', 'NAAC A++', 'https://www.nitt.edu', 'https://jossa.nic.in'],
  ['NIT Warangal', 'Warangal', 155000, 4.5, 52000, true, 0, 1959, '256 Acres', 'NAAC A++', 'https://www.nitw.ac.in', 'https://jossa.nic.in'],
  ['NIT Surathkal', 'Mangaluru', 160000, 4.5, 54000, true, 1, 1960, '295 Acres', 'NAAC A++', 'https://www.nitk.ac.in', 'https://jossa.nic.in'],
  ['IIIT Hyderabad', 'Hyderabad', 320000, 4.6, 88000, true, 2, 1998, '67 Acres', 'NAAC A++', 'https://www.iiit.ac.in', 'https://www.iiit.ac.in/admissions'],
  ['Amrita Vishwa Vidyapeetham', 'Coimbatore', 260000, 4.2, 72000, true, 3, 1994, '400 Acres', 'NAAC A++', 'https://www.amrita.edu', 'https://www.amrita.edu/admissions'],
  ['KIIT University', 'Bhubaneswar', 275000, 4.1, 75000, true, 4, 1992, '350 Acres', 'NAAC A++', 'https://www.kiit.ac.in', 'https://www.kiit.ac.in/admissions'],
  ['PES University', 'Bengaluru', 350000, 4.3, 92000, true, 0, 1972, '25 Acres', 'NAAC A+', 'https://www.pes.edu', 'https://www.pes.edu/admissions'],
  ['RV College of Engineering', 'Bengaluru', 195000, 4.4, 62000, true, 1, 1963, '50 Acres', 'NAAC A+', 'https://www.rvce.edu.in', 'https://www.keacet.nic.in'],
  ['BMS College of Engineering', 'Bengaluru', 180000, 4.2, 58000, true, 2, 1946, '15 Acres', 'NAAC A+', 'https://www.bmsce.ac.in', 'https://www.keacet.nic.in'],
  ['LNM Institute of Information Technology', 'Jaipur', 280000, 4.1, 78000, true, 3, 2003, '100 Acres', 'NAAC A+', 'https://www.lnmnit.ac.in', 'https://www.lnmnit.ac.in/admissions'],
  ['DAIICT', 'Gandhinagar', 320000, 4.3, 85000, true, 4, 2001, '100 Acres', 'NAAC A+', 'https://www.daiict.ac.in', 'https://www.daiict.ac.in/admissions'],
  ['Nirma University', 'Ahmedabad', 240000, 4.0, 68000, true, 0, 1994, '115 Acres', 'NAAC A+', 'https://www.nirmauni.ac.in', 'https://www.nirmauni.ac.in/admissions'],
  ['MIT World Peace University', 'Pune', 310000, 3.9, 82000, true, 1, 2017, '130 Acres', 'NAAC A+', 'https://www.mitwpu.edu.in', 'https://www.mitwpu.edu.in/admissions'],
  ['Lovely Professional University', 'Phagwara', 160000, 3.8, 55000, true, 2, 2005, '600 Acres', 'NAAC A++', 'https://www.lpu.in', 'https://www.lpu.in/admissions'],
  ['Chandigarh University', 'Mohali', 175000, 4.0, 58000, true, 3, 2012, '200 Acres', 'NAAC A+', 'https://www.cuchd.in', 'https://www.cuchd.in/admissions'],
  ['SASTRA Deemed University', 'Thanjavur', 145000, 4.1, 48000, true, 4, 1984, '250 Acres', 'NAAC A++', 'https://www.sastra.edu', 'https://www.sastra.edu/admissions'],
  ['Bharati Vidyapeeth', 'Pune', 230000, 3.8, 65000, true, 0, 1964, '85 Acres', 'NAAC A+', 'https://www.bharatividyapeeth.edu', 'https://www.bharatividyapeeth.edu/admissions'],
  ['Graphic Era University', 'Dehradun', 210000, 4.0, 62000, true, 1, 1993, '50 Acres', 'NAAC A+', 'https://www.geu.ac.in', 'https://www.geu.ac.in/admissions'],
  ['PES Modern College', 'Pune', 125000, 3.7, 42000, true, 2, 1970, '20 Acres', 'NAAC A', 'https://www.moderncollegepune.edu.in', 'https://www.moderncollegepune.edu.in/admissions'],
  ['Agnel Institute of Technology', 'Navi Mumbai', 105000, 3.6, 38000, true, 3, 1999, '15 Acres', 'NAAC A', 'https://www.aitpune.com', 'https://www.cetcell.mahacet.org'],
] as const

// ponytail: Maharashtra-linked colleges get the state-only scholarship; everything else stays on central schemes
const maharashtraLocations = new Set(['Mumbai', 'Pune', 'Navi Mumbai'])

const branches = [
  'Computer Engineering',
  'Electronics & Communication',
  'Mechanical Engineering',
  'Information Technology',
  'Electrical Engineering',
  'Civil Engineering',
]
const categories = ['OPEN', 'OBC', 'SC', 'ST', 'TFWS']
const exams = ['JEE', 'CET']

// Demo rows are not official data. They are visibly legacy/unverified until a
// real source is ingested and approved.
const legacy = {
  sourceName: 'legacy',
  sourceUrl: null,
  sourceDate: null,
  verifiedAt: null,
  verifiedBy: null,
  confidence: 0.5,
} as const

async function main() {
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_DESTRUCTIVE_SEED !== '1') {
    throw new Error(
      'Refusing to seed a production database. Set ALLOW_DESTRUCTIVE_SEED=1 only for a deliberate demo environment.'
    )
  }

  await prisma.dataSource.upsert({
    where: { name: 'legacy' },
    update: { status: 'inactive' },
    create: {
      name: 'legacy',
      url: 'https://campusscope.local/legacy',
      license: 'Demo data — not official cutoff information',
      status: 'inactive',
    },
  })
  await prisma.lead.deleteMany()
  await prisma.counsellorProfile.deleteMany()
  await prisma.feedback.deleteMany()
  await prisma.campusInsight.deleteMany()
  await prisma.capRoundTrend.deleteMany()
  await prisma.seatMatrix.deleteMany()
  await prisma.admissionDeadline.deleteMany()
  await prisma.spotRoundNotice.deleteMany()
  await prisma.cutoff.deleteMany()
  await prisma.review.deleteMany()
  await prisma.placement.deleteMany()
  await prisma.course.deleteMany()
  await prisma.college.deleteMany()

  for (const [index, [name, location, fees, rating, hostelFees, hostelAvailable, facilityIdx, establishedYear, campusSize, accreditation, websiteUrl, admissionUrl]] of colleges.entries()) {
    const sparse = index % 11 === 0
    const collegeFacilities = [
      facilities[(facilityIdx) % facilities.length],
      facilities[(facilityIdx + 1) % facilities.length],
      facilities[(facilityIdx + 2) % facilities.length],
    ]

    const college = await prisma.college.create({
      data: {
        name,
        location,
        fees,
        rating,
        overview: `${name} is a respected engineering institution in ${location}, offering a focused academic environment, industry exposure, and a strong student community. Explore programs, placements, and student perspectives before you apply.`,
        websiteUrl,
        admissionUrl,
        establishedYear,
        campusSize,
        accreditation,
        hostelFees,
        hostelAvailable,
        facilities: JSON.stringify(collegeFacilities),
        cautionDeposit: fees > 300000 ? 25000 : 10000,
        eligibleScholarships: JSON.stringify([
          ...scholarshipsBase,
          ...(maharashtraLocations.has(location) ? scholarshipsMaharashtra : []),
        ]),
        topRecruiters: JSON.stringify(recruiterPool[index % recruiterPool.length]),
        studentFacultyRatio: `1:${12 + (index % 8)}`,
        nirfRank: rating >= 4.4 ? 10 + ((index * 3) % 40) : 0,
        autonomous: index % 3 === 0,
        minorityConcessionPct: [30, 40, 20][index % 3],
        ...legacy,
        courses: sparse
          ? undefined
          : {
              create: [
                { name: 'Computer Science & Engineering', duration: '4 years', fees: Math.round(fees * 0.98) },
                { name: 'Electronics & Communication', duration: '4 years', fees: Math.round(fees * 0.96) },
                { name: 'Mechanical Engineering', duration: '4 years', fees: Math.round(fees * 0.92) },
              ],
            },
        placements: sparse
          ? undefined
          : {
              create: [
                { year: 2024, avgPackage: 8 + (index % 10) * 1.2, highestPackage: 24 + (index % 8) * 7, placementRate: 72 + (index % 25), ...legacy },
                { year: 2023, avgPackage: 7.5 + (index % 10) * 1.1, highestPackage: 20 + (index % 8) * 6, placementRate: 70 + (index % 25), ...legacy },
              ],
            },
        reviews:
          index % 7 === 0
            ? undefined
            : {
                create: [
                  { author: 'Aarav Sharma', rating: Math.min(5, rating + 0.1), comment: 'Great peer group and plenty of opportunities to build practical skills.' },
                  { author: 'Ishita Rao', rating: Math.max(3, rating - 0.2), comment: 'A solid choice with an active campus and helpful faculty.' },
                ],
              },
      },
    })

    if (!sparse) {
      await prisma.cutoff.createMany({ data: generateCutoffs(index, college.id) })
    }
    await prisma.capRoundTrend.createMany({ data: generateTrends(index, college.id) })
    await prisma.seatMatrix.createMany({ data: generateSeatMatrix(index, college.id) })
    await prisma.campusInsight.createMany({ data: generateInsights(college.id, name, index) })
  }

  await prisma.admissionDeadline.createMany({ data: generateDeadlines() })
  await seedSpotNotices()
  await seedMentorsAndForum()
  await seedCounsellors()
}

async function seedCounsellors() {
  const counsellors = [
    {
      name: 'Meera Joshi',
      city: 'Pune',
      languages: ['English', 'Marathi', 'Hindi'],
      bio: 'Twelve CAP cycles helping Maharashtra students build realistic Safe/Target/Reach lists. Focus on TFWS, EBC, and Pune-vs-Mumbai trade-offs.',
      priceRange: 'Free intro · ₹1,500/session',
    },
    {
      name: 'Aditya Rao',
      city: 'Mumbai',
      languages: ['English', 'Hindi', 'Marathi'],
      bio: 'Ex-admissions volunteer. Works with OBC and EWS families on document readiness, home-university quota, and spot-round decisions.',
      priceRange: '₹1,000/session',
    },
    {
      name: 'Fatima Shaikh',
      city: 'Nagpur',
      languages: ['English', 'Hindi', 'Urdu', 'Marathi'],
      bio: 'Counsels first-generation aspirants across Vidarbha. Specialises in fee waivers, hostel budgets, and low-percentile backup plans.',
      priceRange: 'Free for first-generation students',
    },
  ]

  for (const [index, counsellor] of counsellors.entries()) {
    const user = await prisma.user.upsert({
      where: { email: `counsellor${index}@campusscope.test` },
      update: { name: counsellor.name },
      create: { email: `counsellor${index}@campusscope.test`, name: counsellor.name },
    })
    await prisma.counsellorProfile.upsert({
      where: { userId: user.id },
      update: {
        displayName: counsellor.name,
        city: counsellor.city,
        languages: counsellor.languages,
        verified: true,
        bio: counsellor.bio,
        priceRange: counsellor.priceRange,
      },
      create: {
        userId: user.id,
        displayName: counsellor.name,
        city: counsellor.city,
        languages: counsellor.languages,
        verified: true,
        bio: counsellor.bio,
        priceRange: counsellor.priceRange,
      },
    })
  }
}

// Mentors are demo alumni accounts; their slots/posts cascade away with college deletes so reseeding stays clean.
async function seedMentorsAndForum() {
  const colleges = await prisma.college.findMany({ orderBy: { id: 'asc' }, take: 8, select: { id: true } })
  if (!colleges.length) return

  const mentorNames = ['Rohit Deshmukh', 'Sneha Kulkarni', 'Arjun Mehta', 'Priya Nair']
  const mentors: Array<{ id: string }> = []
  for (const [i, name] of mentorNames.entries()) {
    mentors.push(
      await prisma.user.upsert({
        where: { email: `mentor${i}@campusscope.test` },
        update: {},
        create: { email: `mentor${i}@campusscope.test`, name },
      })
    )
  }

  const slots: Array<{ mentorId: string; collegeId: number; startTime: Date; durationMin: number }> = []
  colleges.forEach((college, ci) => {
    for (let day = 1; day <= 3; day++) {
      const start = new Date(Date.now() + day * 86400000)
      start.setHours(17 + (ci % 3), (ci % 2) * 30, 0, 0)
      slots.push({ mentorId: mentors[(ci + day) % mentors.length].id, collegeId: college.id, startTime: start, durationMin: 15 })
    }
  })
  await prisma.mentorSlot.createMany({ data: slots })

  const questions: [string, string][] = [
    ['Is TFWS applicable for ACAP / institute-level rounds?', 'I am OPEN category with 93 percentile — does the tuition fee waiver carry into institute-level spot rounds or only CAP rounds?'],
    ['How strictly is attendance enforced in the IT department?', 'Incoming first-year here. Are proxies realistic or is biometric attendance strict from semester one?'],
    ['What is the actual hostel mess food quality?', 'Considering hostel vs PG. How is the mess rotation menu and hygiene in practice?'],
    ['Does the college allow branch change after first year?', 'What CGPA is realistically needed and how many seats typically open up for CSE?'],
  ]
  for (const [i, college] of colleges.entries()) {
    const [title, content] = questions[i % questions.length]
    const asker = mentors[(i + 1) % mentors.length]
    const post = await prisma.forumPost.create({
      data: { collegeId: college.id, userId: asker.id, title, content, upvotes: 2 + ((i * 5) % 11) },
    })
    await prisma.forumComment.create({
      data: {
        postId: post.id,
        userId: mentors[i % mentors.length].id,
        content: 'Speaking from my own admission cycle — happy to hop on a guidance call this week if useful.',
        isSeniorAnswer: true,
      },
    })
  }
}

// Institute-level vacancy notices typically appear right after CAP round 3 — deadlines are tight (5–10 days).
async function seedSpotNotices() {
  const colleges = await prisma.college.findMany({
    where: { name: { in: ['PES Modern College', 'Agnel Institute of Technology', 'Bharati Vidyapeeth', 'MIT World Peace University', 'LNM Institute of Information Technology'] } },
    select: { id: true, name: true },
  })
  if (!colleges.length) return

  const notices: Array<{
    collegeId: number
    branch: string
    vacancyCount: number
    applicationDeadline: Date
    noticePdfUrl: string
    publishedAt: Date
  }> = []
  const day = (n: number) => new Date(Date.now() + n * 86400000)
  const branchPool = branches.slice(0, 4)

  colleges.forEach((college, i) => {
    for (let b = 0; b < 2 + (i % 2); b++) {
      notices.push({
        collegeId: college.id,
        branch: branchPool[(i + b) % branchPool.length],
        vacancyCount: 3 + ((i + b) % 9),
        applicationDeadline: day(6 + b * 5 + (i % 7)),
        noticePdfUrl: '',
        publishedAt: day(-1),
      })
    }
  })

  await prisma.spotRoundNotice.createMany({ data: notices })
}

function generateCutoffs(collegeIndex: number, collegeId: number) {
  const cutoffs: Array<{
    collegeId: number
    exam: string
    capRound: number
    category: string
    branch: string
    percentile: number
    year: number
  }> = []

  for (const exam of exams) {
    for (const round of [1, 2, 3]) {
      for (const category of categories) {
        const branchCount = 2 + (collegeIndex % 3)
        for (let b = 0; b < branchCount; b++) {
          const branch = branches[b % branches.length]
          const basePercentile = 70 + (collegeIndex % 25) + (category === 'OPEN' ? 10 : category === 'OBC' ? 5 : 0)
          const roundDeduction = (round - 1) * 1.5
          const categoryDeduction = categories.indexOf(category) * 2
          const percentile = Math.min(99.9, Math.max(30, basePercentile - roundDeduction - categoryDeduction + (b * 0.5)))

          cutoffs.push({
            collegeId,
            exam,
            capRound: round,
            category,
            branch,
            percentile: Math.round(percentile * 100) / 100,
            year: 2024,
            ...legacy,
          })
        }
      }
    }
  }
  return cutoffs
}

// Round-over-round closing cutoffs drop as seats stay vacant — spot rounds close lowest.
function round2(value: number) {
  return Math.round(value * 100) / 100
}

function generateTrends(collegeIndex: number, collegeId: number) {
  const trends: Array<{
    collegeId: number
    year: number
    exam: string
    category: string
    branch: string
    round1Cutoff: number
    round2Cutoff: number
    round3Cutoff: number
    spotRoundCutoff: number | null
  }> = []
  const year = 2025

  for (const exam of exams) {
    for (const category of categories) {
      const branchCount = 2 + (collegeIndex % 3)
      for (let b = 0; b < branchCount; b++) {
        const branch = branches[b % branches.length]
        const base =
          68 +
          (collegeIndex % 25) +
          (category === 'OPEN' ? 10 : category === 'OBC' ? 5 : 0) -
          categories.indexOf(category) * 2 +
          b * 0.5 +
          (exam === 'JEE' ? 2 : 0)
        const r1 = Math.min(99.9, Math.max(30, base))
        trends.push({
          collegeId,
          year,
          exam,
          category,
          branch,
          round1Cutoff: round2(r1),
          round2Cutoff: round2(Math.max(30, r1 - 1.8)),
          round3Cutoff: round2(Math.max(30, r1 - 3.1)),
          spotRoundCutoff: round2(Math.max(30, r1 - 4.4)),
          ...legacy,
        })
      }
    }
  }
  return trends
}

// Quota split approximates DTE's OPEN/OBC/SC/ST/TFWS/All-India distribution.
function generateSeatMatrix(collegeIndex: number, collegeId: number) {
  const rows: Array<{
    collegeId: number
    branch: string
    totalSeats: number
    openSeats: number
    obcSeats: number
    scSeats: number
    stSeats: number
    tfwsSeats: number
    allIndiaSeats: number
  }> = []
  const branchCount = 3 + (collegeIndex % 3)

  for (let b = 0; b < branchCount; b++) {
    const total = 60 + ((collegeIndex + b) % 5) * 30
    const open = Math.round(total * 0.35)
    const obc = Math.round(total * 0.25)
    const sc = Math.round(total * 0.1)
    const st = Math.round(total * 0.05)
    const tfws = Math.round(total * 0.05)
    rows.push({
      collegeId,
      branch: branches[b],
      totalSeats: total,
      openSeats: open,
      obcSeats: obc,
      scSeats: sc,
      stSeats: st,
      tfwsSeats: tfws,
      allIndiaSeats: total - open - obc - sc - st - tfws,
      ...legacy,
    })
  }
  return rows
}

function generateInsights(collegeId: number, name: string, index: number) {
  const strictness = [
    'Very strict — daily attendance tracked, 75% hard rule',
    'Moderate — warnings below 75%, proxies common in big lectures',
    'Relaxed — attendance barely enforced after first year',
  ]
  const support = [
    'Dedicated placement cell runs mock interviews from semester 5',
    'Training and placement support exists but you drive your own prep',
    'Placement support is limited; most students apply off-campus',
  ]
  return [
    {
      collegeId,
      authorRole: 'Final-year Student',
      attendanceStrictness: strictness[index % strictness.length],
      canteenRating: Math.round((3.4 + (index % 13) * 0.1) * 10) / 10,
      placementSupport: support[index % support.length],
      content: `Attendance rules at ${name} are enforced differently by department, so ask seniors about your branch specifically. Campus life is active and the peer group pushes you to build projects beyond coursework.`,
    },
    {
      collegeId,
      authorRole: 'Alumnus (Batch of 2023)',
      attendanceStrictness: strictness[(index + 1) % strictness.length],
      canteenRating: Math.round((3.2 + (index % 16) * 0.1) * 10) / 10,
      placementSupport: support[(index + 2) % support.length],
      content: `What nobody tells you about ${name}: the placement season rewards students who started internships early. Hostel rooms fill fast, so confirm your admission quickly if you want on-campus housing.`,
    },
  ]
}

function generateDeadlines() {
  const d = (iso: string) => new Date(iso)
  return [
    {
      title: 'MHT-CET CAP 2026 registration opens',
      description: 'Fresh registrations and document upload on the CET Cell portal.',
      eventDate: d('2026-09-01T10:00:00+05:30'),
      category: 'Registration',
      officialLink: 'https://cetcell.mahacet.org',
    },
    {
      title: 'Document verification window',
      description: 'Get original documents verified at your assigned facilitation center.',
      eventDate: d('2026-09-10T10:00:00+05:30'),
      category: 'CAP',
      officialLink: 'https://cetcell.mahacet.org',
    },
    {
      title: 'Provisional merit list released',
      description: 'Check your merit number and raise objections within 48 hours.',
      eventDate: d('2026-09-18T17:00:00+05:30'),
      category: 'Merit List',
      officialLink: 'https://cetcell.mahacet.org',
    },
    {
      title: 'Option form submission opens',
      description: 'Fill and lock your preference list. Use the Option Form generator to prepare.',
      eventDate: d('2026-09-25T10:00:00+05:30'),
      category: 'Option Form',
      officialLink: 'https://cetcell.mahacet.org',
    },
    {
      title: 'CAP Round 1 allotment',
      description: 'Provisional allotment published. Accept and pay the seat fee to confirm.',
      eventDate: d('2026-10-12T17:00:00+05:30'),
      category: 'CAP',
      officialLink: 'https://cetcell.mahacet.org',
    },
    {
      title: 'CAP Round 2 allotment',
      description: 'Round 2 results and freeze/betterment choices.',
      eventDate: d('2026-10-24T17:00:00+05:30'),
      category: 'CAP',
      officialLink: 'https://cetcell.mahacet.org',
    },
    {
      title: 'CAP Round 3 allotment',
      description: 'Final regular round — cutoffs usually drop further.',
      eventDate: d('2026-11-05T17:00:00+05:30'),
      category: 'CAP',
      officialLink: 'https://cetcell.mahacet.org',
    },
    {
      title: 'Institute-level spot rounds',
      description: 'Vacant seats filled directly by institutes. Watch late-round opportunities.',
      eventDate: d('2026-11-18T10:00:00+05:30'),
      category: 'Spot Round',
      officialLink: 'https://cetcell.mahacet.org',
    },
    {
      title: 'JEE Main 2027 session 1 registration',
      description: 'Expected opening of applications for the next cycle.',
      eventDate: d('2026-12-01T10:00:00+05:30'),
      category: 'Registration',
      officialLink: 'https://jeemain.nta.nic.in',
    },
  ]
}

main().finally(() => prisma.$disconnect())
