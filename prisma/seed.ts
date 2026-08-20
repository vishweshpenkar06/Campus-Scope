import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const facilities = [
  'WiFi', 'Research Labs', 'Library', 'Sports Complex', 'Auditorium',
  'Canteen', 'Medical Center', 'Transport', 'Bank/ATM', 'Gym',
]

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
  ['Kalinga Institute of Industrial Technology', 'Bhubaneswar', 290000, 4.0, 78000, true, 1, 1992, '350 Acres', 'NAAC A++', 'https://www.kiit.ac.in', 'https://www.kiit.ac.in/admissions'],
  ['Graphic Era University', 'Dehradun', 210000, 4.0, 62000, true, 2, 1993, '50 Acres', 'NAAC A+', 'https://www.geu.ac.in', 'https://www.geu.ac.in/admissions'],
  ['PES Modern College', 'Pune', 125000, 3.7, 42000, true, 3, 1970, '20 Acres', 'NAAC A', 'https://www.moderncollegepune.edu.in', 'https://www.moderncollegepune.edu.in/admissions'],
  ['Agnel Institute of Technology', 'Navi Mumbai', 105000, 3.6, 38000, true, 4, 1999, '15 Acres', 'NAAC A', 'https://www.aitpune.com', 'https://www.cetcell.mahacet.org'],
] as const

async function main() {
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
                { year: 2024, avgPackage: 8 + (index % 10) * 1.2, highestPackage: 24 + (index % 8) * 7, placementRate: 72 + (index % 25) },
                { year: 2023, avgPackage: 7.5 + (index % 10) * 1.1, highestPackage: 20 + (index % 8) * 6, placementRate: 70 + (index % 25) },
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
      const cutoffs = generateCutoffs(index, college.id)
      await prisma.cutoff.createMany({ data: cutoffs })
    }
  }
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

  const exams = ['JEE', 'CET']
  const rounds = [1, 2, 3]
  const categories = ['OPEN', 'OBC', 'SC', 'ST', 'TFWS']
  const branches = [
    'Computer Science & Engineering',
    'Electronics & Communication',
    'Mechanical Engineering',
    'Information Technology',
    'Electrical Engineering',
    'Civil Engineering',
  ]

  for (const exam of exams) {
    for (const round of rounds) {
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
          })
        }
      }
    }
  }
  return cutoffs
}

main().finally(() => prisma.$disconnect())
