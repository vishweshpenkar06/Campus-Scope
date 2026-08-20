import { AppShell } from '@/components/app-shell'
import { CollegeDetail } from '@/components/college-detail'
export default async function Page({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <AppShell><CollegeDetail id={id} /></AppShell> }
