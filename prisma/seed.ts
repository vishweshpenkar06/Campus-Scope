import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const colleges = [
  ['IIT Bombay', 'Mumbai', 245000, 4.8], ['IIT Delhi', 'New Delhi', 240000, 4.9], ['IIT Madras', 'Chennai', 238000, 4.8], ['IIT Kanpur', 'Kanpur', 230000, 4.7], ['IIT Kharagpur', 'Kharagpur', 220000, 4.6], ['BITS Pilani', 'Pilani', 580000, 4.7], ['VIT Vellore', 'Vellore', 198000, 4.4], ['Manipal Institute of Technology', 'Manipal', 430000, 4.3], ['SRM Institute of Science and Technology', 'Chennai', 210000, 4.2], ['Thapar Institute of Engineering', 'Patiala', 390000, 4.4], ['DTU', 'New Delhi', 180000, 4.5], ['NSUT', 'New Delhi', 175000, 4.5], ['Jadavpur University', 'Kolkata', 95000, 4.4], ['COEP Technological University', 'Pune', 145000, 4.3], ['NIT Trichy', 'Tiruchirappalli', 165000, 4.6], ['NIT Warangal', 'Warangal', 155000, 4.5], ['NIT Surathkal', 'Mangaluru', 160000, 4.5], ['IIIT Hyderabad', 'Hyderabad', 320000, 4.6], ['Amrita Vishwa Vidyapeetham', 'Coimbatore', 260000, 4.2], ['KIIT University', 'Bhubaneswar', 275000, 4.1], ['PES University', 'Bengaluru', 350000, 4.3], ['RV College of Engineering', 'Bengaluru', 195000, 4.4], ['BMS College of Engineering', 'Bengaluru', 180000, 4.2], ['LNM Institute of Information Technology', 'Jaipur', 280000, 4.1], ['DAIICT', 'Gandhinagar', 320000, 4.3], ['Nirma University', 'Ahmedabad', 240000, 4.0], ['MIT World Peace University', 'Pune', 310000, 3.9], ['Lovely Professional University', 'Phagwara', 160000, 3.8], ['Chandigarh University', 'Mohali', 175000, 4.0], ['SASTRA Deemed University', 'Thanjavur', 145000, 4.1], ['Bharati Vidyapeeth', 'Pune', 230000, 3.8], ['Kalinga Institute of Industrial Technology', 'Bhubaneswar', 290000, 4.0], ['Graphic Era University', 'Dehradun', 210000, 4.0], ['PES Modern College', 'Pune', 125000, 3.7], ['Agnel Institute of Technology', 'Navi Mumbai', 105000, 3.6]] as const

async function main() {
  await prisma.review.deleteMany(); await prisma.placement.deleteMany(); await prisma.course.deleteMany(); await prisma.college.deleteMany()
  for (const [index, [name, location, fees, rating]] of colleges.entries()) {
    const sparse = index % 11 === 0
    await prisma.college.create({ data: {
      name, location, fees, rating,
      overview: `${name} is a respected engineering institution in ${location}, offering a focused academic environment, industry exposure, and a strong student community. Explore programs, placements, and student perspectives before you apply.`,
      courses: sparse ? undefined : { create: [
        { name: 'Computer Science & Engineering', duration: '4 years', fees: Math.round(fees * 0.98) },
        { name: 'Electronics & Communication', duration: '4 years', fees: Math.round(fees * 0.96) },
        { name: 'Mechanical Engineering', duration: '4 years', fees: Math.round(fees * 0.92) },
      ] },
      placements: sparse ? undefined : { create: [
        { year: 2024, avgPackage: 8 + (index % 10) * 1.2, highestPackage: 24 + (index % 8) * 7, placementRate: 72 + (index % 25) },
        { year: 2023, avgPackage: 7.5 + (index % 10) * 1.1, highestPackage: 20 + (index % 8) * 6, placementRate: 70 + (index % 25) },
      ] },
      reviews: index % 7 === 0 ? undefined : { create: [
        { author: 'Aarav Sharma', rating: Math.min(5, rating + 0.1), comment: 'Great peer group and plenty of opportunities to build practical skills.' },
        { author: 'Ishita Rao', rating: Math.max(3, rating - 0.2), comment: 'A solid choice with an active campus and helpful faculty.' },
      ] },
    } })
  }
}

main().finally(() => prisma.$disconnect())
