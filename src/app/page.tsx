"use client"

import { useState, useEffect } from "react"
import { AppSidebar } from "@/components/AppSidebar"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, Database, FileText, TrendingUp, Activity, Leaf, Plus, Loader2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export default function Dashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [reportsDialogOpen, setReportsDialogOpen] = useState(false)
  const [reports, setReports] = useState<any>(null)
  const [stats, setStats] = useState({
    totalPatients: 0,
    activeCharts: 0,
    complianceRate: 0,
  })
  const [recentPatients, setRecentPatients] = useState<any[]>([])

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      // Fetch dashboard stats
      const reportsResponse = await fetch("/api/reports/dashboard")
      if (reportsResponse.ok) {
        const reportsData = await reportsResponse.json()
        setStats({
          totalPatients: reportsData.total_patients || 0,
          activeCharts: reportsData.active_charts || 0,
          complianceRate: reportsData.average_compliance || 0,
        })
      }

      // Fetch recent patients
      const patientsResponse = await fetch("/api/patients")
      if (patientsResponse.ok) {
        const patientsData = await patientsResponse.json()
        setRecentPatients(patientsData.slice(0, 4))
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleViewReports = async () => {
    try {
      setReportsDialogOpen(true)
      const response = await fetch("/api/reports/dashboard")
      if (!response.ok) throw new Error("Failed to fetch reports")
      const data = await response.json()
      setReports(data)
    } catch (error) {
      console.error("Error fetching reports:", error)
      toast.error("Failed to load reports")
    }
  }

  const statsData = [
    {
      title: "Total Patients",
      value: loading ? "..." : stats.totalPatients.toString(),
      change: "+12 this week",
      icon: Users,
      gradient: "from-[var(--ayurveda-saffron)] to-[var(--ayurveda-terracotta)]",
    },
    {
      title: "Food Database",
      value: "8,247",
      change: "Items catalogued",
      icon: Database,
      gradient: "from-[var(--ayurveda-sage)] to-[var(--ayurveda-forest)]",
    },
    {
      title: "Active Diet Charts",
      value: loading ? "..." : stats.activeCharts.toString(),
      change: "+8 today",
      icon: FileText,
      gradient: "from-[var(--ayurveda-earth)] to-[var(--ayurveda-gold)]",
    },
    {
      title: "Compliance Rate",
      value: loading ? "..." : `${stats.complianceRate}%`,
      change: "+5% from last month",
      icon: TrendingUp,
      gradient: "from-green-500 to-emerald-600",
    },
  ]

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <main className="flex-1 overflow-auto">
          <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 no-print">
            <div className="flex h-16 items-center gap-4 px-6">
              <SidebarTrigger />
              <div className="flex-1">
                <h1 className="text-2xl font-semibold">Dashboard</h1>
                <p className="text-sm text-muted-foreground">Welcome back, Dr. Ayurveda</p>
              </div>
              <Button 
                className="bg-gradient-to-r from-[var(--ayurveda-saffron)] to-[var(--ayurveda-terracotta)] text-white hover:opacity-90"
                onClick={() => router.push("/patients")}
              >
                <Plus className="w-4 h-4 mr-2" />
                New Patient
              </Button>
            </div>
          </header>

          <div className="p-6 space-y-6">
            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {statsData.map((stat, index) => (
                <Card key={index} className="relative overflow-hidden">
                  <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${stat.gradient} opacity-10 rounded-full -mr-8 -mt-8`} />
                  <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                    <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                    <div className={`p-2 rounded-lg bg-gradient-to-br ${stat.gradient}`}>
                      <stat.icon className="h-4 w-4 text-white" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{stat.value}</div>
                    <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              {/* Recent Patients */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Patients</CardTitle>
                  <CardDescription>Latest patient consultations</CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : recentPatients.length > 0 ? (
                    <div className="space-y-4">
                      {recentPatients.map((patient, index) => (
                        <div 
                          key={index} 
                          className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                          onClick={() => router.push(`/patients/${patient.id}`)}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--ayurveda-sage)] to-[var(--ayurveda-forest)] flex items-center justify-center text-white font-semibold">
                              {patient.name.split(' ').map((n: string) => n[0]).join('')}
                            </div>
                            <div>
                              <p className="font-medium">{patient.name}</p>
                              <p className="text-sm text-muted-foreground">{patient.age} years • {patient.dosha}</p>
                            </div>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {new Date(patient.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">No patients yet</p>
                  )}
                  <Link href="/patients">
                    <Button variant="outline" className="w-full mt-4">View All Patients</Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Ayurvedic Insights */}
              <Card className="bg-gradient-to-br from-[var(--ayurveda-saffron)]/5 to-[var(--ayurveda-terracotta)]/5 border-[var(--ayurveda-saffron)]/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Leaf className="w-5 h-5 text-[var(--ayurveda-saffron)]" />
                    Ayurvedic Insights
                  </CardTitle>
                  <CardDescription>Seasonal dietary recommendations</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 rounded-lg bg-white dark:bg-card border">
                    <h4 className="font-semibold mb-2">Current Season: Vasant (Spring)</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Focus on light, warm, and easily digestible foods. Reduce Kapha-aggravating foods.
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Activity className="w-4 h-4 text-green-600" />
                        <span>Favor: Bitter, pungent, and astringent tastes</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Activity className="w-4 h-4 text-green-600" />
                        <span>Include: Leafy greens, legumes, warm spices</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Activity className="w-4 h-4 text-amber-600" />
                        <span>Reduce: Heavy, oily, and cold foods</span>
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full">View Seasonal Guidelines</Button>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common tasks and workflows</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <Link href="/patients">
                    <Button variant="outline" className="w-full h-auto py-4 flex flex-col gap-2">
                      <Users className="w-6 h-6" />
                      <span>Add Patient</span>
                    </Button>
                  </Link>
                  <Link href="/diet-charts">
                    <Button variant="outline" className="w-full h-auto py-4 flex flex-col gap-2">
                      <FileText className="w-6 h-6" />
                      <span>Create Diet Chart</span>
                    </Button>
                  </Link>
                  <Link href="/food-database">
                    <Button variant="outline" className="w-full h-auto py-4 flex flex-col gap-2">
                      <Database className="w-6 h-6" />
                      <span>Browse Foods</span>
                    </Button>
                  </Link>
                  <Button 
                    variant="outline" 
                    className="w-full h-auto py-4 flex flex-col gap-2"
                    onClick={handleViewReports}
                  >
                    <Activity className="w-6 h-6" />
                    <span>View Reports</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      {/* Reports Dialog */}
      <Dialog open={reportsDialogOpen} onOpenChange={setReportsDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Dashboard Reports</DialogTitle>
            <DialogDescription>Overview of key metrics and statistics</DialogDescription>
          </DialogHeader>
          {reports ? (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Total Patients</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{reports.total_patients}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Active Charts</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{reports.active_charts}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Average Compliance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{reports.average_compliance}%</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Total Charts</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{reports.total_charts}</div>
                  </CardContent>
                </Card>
              </div>
              
              {reports.dosha_distribution && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Dosha Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.entries(reports.dosha_distribution).map(([dosha, count]: [string, any]) => (
                        <div key={dosha} className="flex items-center justify-between">
                          <span className="text-sm font-medium">{dosha}</span>
                          <span className="text-sm text-muted-foreground">{count} patients</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  )
}