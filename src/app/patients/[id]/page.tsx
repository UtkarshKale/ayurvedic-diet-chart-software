"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AppSidebar } from "@/components/AppSidebar"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  ArrowLeft, 
  User, 
  Phone, 
  Mail, 
  Calendar, 
  Activity, 
  FileText, 
  TrendingUp, 
  AlertCircle,
  CheckCircle2,
  Loader2,
  ChevronDown,
  ChevronUp,
  UtensilsCrossed
} from "lucide-react"
import { toast } from "sonner"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface Patient {
  id: number
  name: string
  age: number
  gender: string
  dosha: string
  phone?: string
  email?: string
  height?: number
  weight?: number
  bmi?: number
  dietary_habits?: string
  meal_frequency?: number
  water_intake?: number
  health_conditions?: string
  allergies?: string
  notes?: string
  status: string
  created_at: string
  updated_at: string
  diet_charts?: any[]
  compliance_records?: any[]
}

export default function PatientDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [patient, setPatient] = useState<Patient | null>(null)
  const [loading, setLoading] = useState(true)
  const [complianceData, setComplianceData] = useState<any>(null)
  const [expandedChartId, setExpandedChartId] = useState<number | null>(null)
  const [chartMeals, setChartMeals] = useState<Record<number, any[]>>({})
  const [loadingMeals, setLoadingMeals] = useState<Record<number, boolean>>({})

  useEffect(() => {
    fetchPatientData()
    fetchComplianceData()
  }, [params.id])

  const fetchPatientData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/patients/${params.id}`)
      if (!response.ok) throw new Error("Failed to fetch patient")
      const data = await response.json()
      setPatient(data)
    } catch (error) {
      console.error("Error fetching patient:", error)
      toast.error("Failed to load patient data")
    } finally {
      setLoading(false)
    }
  }

  const fetchComplianceData = async () => {
    try {
      const response = await fetch(`/api/compliance/patient/${params.id}`)
      if (!response.ok) throw new Error("Failed to fetch compliance")
      const data = await response.json()
      setComplianceData(data)
    } catch (error) {
      console.error("Error fetching compliance:", error)
    }
  }

  const fetchChartMeals = async (chartId: number) => {
    if (chartMeals[chartId]) {
      // Already fetched
      setExpandedChartId(expandedChartId === chartId ? null : chartId)
      return
    }

    try {
      setLoadingMeals(prev => ({ ...prev, [chartId]: true }))
      const response = await fetch(`/api/diet-charts/${chartId}`)
      if (!response.ok) throw new Error("Failed to fetch meals")
      const data = await response.json()
      setChartMeals(prev => ({ ...prev, [chartId]: data.meals || [] }))
      setExpandedChartId(chartId)
    } catch (error) {
      console.error("Error fetching chart meals:", error)
      toast.error("Failed to load meal details")
    } finally {
      setLoadingMeals(prev => ({ ...prev, [chartId]: false }))
    }
  }

  const calculateMealTotals = (meals: any[]) => {
    const totals = { calories: 0, protein: 0, carbs: 0, fat: 0 }
    meals.forEach(meal => {
      if (meal.foods) {
        meal.foods.forEach((food: any) => {
          totals.calories += food.calories || 0
          totals.protein += food.protein || 0
          totals.carbs += food.carbs || 0
          totals.fat += food.fat || 0
        })
      }
    })
    return totals
  }

  if (loading) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AppSidebar />
          <main className="flex-1 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </main>
        </div>
      </SidebarProvider>
    )
  }

  if (!patient) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AppSidebar />
          <main className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <p className="text-muted-foreground mb-4">Patient not found</p>
              <Button onClick={() => router.push("/patients")}>Back to Patients</Button>
            </div>
          </main>
        </div>
      </SidebarProvider>
    )
  }

  const doshaColors = {
    Vata: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    Pitta: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    Kapha: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    "Vata-Pitta": "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
    "Pitta-Kapha": "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
    "Kapha-Vata": "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300",
  }

  const averageCompliance = complianceData?.statistics?.average_compliance || 0
  const complianceTrend = complianceData?.statistics?.trend || "stable"

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <main className="flex-1 overflow-auto">
          <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex h-16 items-center gap-4 px-6">
              <Button variant="ghost" size="icon" onClick={() => router.push("/patients")}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div className="flex-1">
                <h1 className="text-2xl font-semibold">{patient.name}</h1>
                <p className="text-sm text-muted-foreground">Patient Profile & Health Records</p>
              </div>
              <Badge className={doshaColors[patient.dosha as keyof typeof doshaColors]}>
                {patient.dosha}
              </Badge>
              <Badge variant={patient.status === "Active" ? "default" : "secondary"}>
                {patient.status}
              </Badge>
            </div>
          </header>

          <div className="p-6 space-y-6">
            {/* Overview Cards */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-sm font-medium">Active Diet Charts</CardTitle>
                  <FileText className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {patient.diet_charts?.filter((dc: any) => dc.status === "Active").length || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Total: {patient.diet_charts?.length || 0}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-sm font-medium">Compliance Rate</CardTitle>
                  <Activity className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{averageCompliance}%</div>
                  <Progress value={averageCompliance} className="h-1 mt-2" />
                  <p className="text-xs text-muted-foreground mt-1">
                    {complianceTrend === "improving" && "↗ Improving"}
                    {complianceTrend === "declining" && "↘ Declining"}
                    {complianceTrend === "stable" && "→ Stable"}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-sm font-medium">BMI</CardTitle>
                  <TrendingUp className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{patient.bmi?.toFixed(1) || "N/A"}</div>
                  <p className="text-xs text-muted-foreground">
                    {patient.bmi && patient.bmi < 18.5 && "Underweight"}
                    {patient.bmi && patient.bmi >= 18.5 && patient.bmi < 25 && "Normal"}
                    {patient.bmi && patient.bmi >= 25 && patient.bmi < 30 && "Overweight"}
                    {patient.bmi && patient.bmi >= 30 && "Obese"}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-sm font-medium">Compliance Records</CardTitle>
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{patient.compliance_records?.length || 0}</div>
                  <p className="text-xs text-muted-foreground">Total entries</p>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="overview" className="w-full">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="diet-charts">Diet Charts</TabsTrigger>
                <TabsTrigger value="compliance">Compliance History</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  {/* Personal Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Personal Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <span className="text-muted-foreground">Age:</span>
                        <span className="font-medium">{patient.age} years</span>
                        <span className="text-muted-foreground">Gender:</span>
                        <span className="font-medium">{patient.gender}</span>
                        <span className="text-muted-foreground">Dosha:</span>
                        <span className="font-medium">{patient.dosha}</span>
                      </div>
                      {patient.phone && (
                        <div className="flex items-center gap-2 text-sm pt-2 border-t">
                          <Phone className="w-4 h-4 text-muted-foreground" />
                          <span>{patient.phone}</span>
                        </div>
                      )}
                      {patient.email && (
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="w-4 h-4 text-muted-foreground" />
                          <span>{patient.email}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Health Metrics */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Activity className="w-4 h-4" />
                        Health Metrics
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {patient.height && (
                          <>
                            <span className="text-muted-foreground">Height:</span>
                            <span className="font-medium">{patient.height} cm</span>
                          </>
                        )}
                        {patient.weight && (
                          <>
                            <span className="text-muted-foreground">Weight:</span>
                            <span className="font-medium">{patient.weight} kg</span>
                          </>
                        )}
                        {patient.bmi && (
                          <>
                            <span className="text-muted-foreground">BMI:</span>
                            <span className="font-medium">{patient.bmi.toFixed(1)}</span>
                          </>
                        )}
                        {patient.meal_frequency && (
                          <>
                            <span className="text-muted-foreground">Meal Frequency:</span>
                            <span className="font-medium">{patient.meal_frequency}/day</span>
                          </>
                        )}
                        {patient.water_intake && (
                          <>
                            <span className="text-muted-foreground">Water Intake:</span>
                            <span className="font-medium">{patient.water_intake}L/day</span>
                          </>
                        )}
                        {patient.dietary_habits && (
                          <>
                            <span className="text-muted-foreground">Diet Type:</span>
                            <span className="font-medium">{patient.dietary_habits}</span>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Health Conditions */}
                  {(patient.health_conditions || patient.allergies) && (
                    <Card className="md:col-span-2">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <AlertCircle className="w-4 h-4" />
                          Health Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {patient.health_conditions && (
                          <div>
                            <p className="text-sm font-medium mb-1">Health Conditions:</p>
                            <p className="text-sm text-muted-foreground">{patient.health_conditions}</p>
                          </div>
                        )}
                        {patient.allergies && (
                          <div>
                            <p className="text-sm font-medium mb-1">Allergies:</p>
                            <p className="text-sm text-muted-foreground">{patient.allergies}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* Notes */}
                  {patient.notes && (
                    <Card className="md:col-span-2">
                      <CardHeader>
                        <CardTitle>Additional Notes</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">{patient.notes}</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="diet-charts" className="space-y-4">
                {patient.diet_charts && patient.diet_charts.length > 0 ? (
                  <div className="grid gap-4">
                    {patient.diet_charts.map((chart: any) => (
                      <Card key={chart.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="pt-6">
                          <div className="space-y-4">
                            {/* Chart Summary Header */}
                            <div className="flex items-start justify-between">
                              <div className="space-y-2 flex-1">
                                <div className="flex items-center gap-3">
                                  <Badge variant={chart.status === "Active" ? "default" : "secondary"}>
                                    {chart.status}
                                  </Badge>
                                  <span className="text-sm text-muted-foreground">
                                    {chart.dietary_focus && `Focus: ${chart.dietary_focus.replace("-", " ")}`}
                                  </span>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                  <div>
                                    <span className="text-muted-foreground">Duration:</span>
                                    <span className="ml-2 font-medium">{chart.duration} days</span>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Target:</span>
                                    <span className="ml-2 font-medium">{chart.target_calories} cal</span>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Dosha Score:</span>
                                    <span className="ml-2 font-medium">{chart.dosha_balance_score || "N/A"}%</span>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Created:</span>
                                    <span className="ml-2 font-medium">
                                      {new Date(chart.created_at).toLocaleDateString()}
                                    </span>
                                  </div>
                                </div>
                                {chart.special_instructions && (
                                  <p className="text-sm text-muted-foreground pt-2 border-t">
                                    {chart.special_instructions}
                                  </p>
                                )}
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => fetchChartMeals(chart.id)}
                                disabled={loadingMeals[chart.id]}
                              >
                                {loadingMeals[chart.id] ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : expandedChartId === chart.id ? (
                                  <>
                                    <ChevronUp className="w-4 h-4 mr-2" />
                                    Hide Meals
                                  </>
                                ) : (
                                  <>
                                    <ChevronDown className="w-4 h-4 mr-2" />
                                    View Meals
                                  </>
                                )}
                              </Button>
                            </div>

                            {/* Expanded Meal Details */}
                            {expandedChartId === chart.id && chartMeals[chart.id] && (
                              <div className="space-y-4 pt-4 border-t">
                                {/* Nutritional Summary */}
                                {chartMeals[chart.id].length > 0 && (
                                  <div className="grid grid-cols-4 gap-3">
                                    {(() => {
                                      const totals = calculateMealTotals(chartMeals[chart.id])
                                      return (
                                        <>
                                          <Card className="bg-muted/50">
                                            <CardContent className="pt-4 pb-3">
                                              <div className="text-xs text-muted-foreground">Total Calories</div>
                                              <div className="text-xl font-bold">{Math.round(totals.calories)}</div>
                                              <Progress 
                                                value={(totals.calories / chart.target_calories) * 100} 
                                                className="h-1 mt-2" 
                                              />
                                            </CardContent>
                                          </Card>
                                          <Card className="bg-muted/50">
                                            <CardContent className="pt-4 pb-3">
                                              <div className="text-xs text-muted-foreground">Protein</div>
                                              <div className="text-xl font-bold">{Math.round(totals.protein)}g</div>
                                            </CardContent>
                                          </Card>
                                          <Card className="bg-muted/50">
                                            <CardContent className="pt-4 pb-3">
                                              <div className="text-xs text-muted-foreground">Carbs</div>
                                              <div className="text-xl font-bold">{Math.round(totals.carbs)}g</div>
                                            </CardContent>
                                          </Card>
                                          <Card className="bg-muted/50">
                                            <CardContent className="pt-4 pb-3">
                                              <div className="text-xs text-muted-foreground">Fat</div>
                                              <div className="text-xl font-bold">{Math.round(totals.fat)}g</div>
                                            </CardContent>
                                          </Card>
                                        </>
                                      )
                                    })()}
                                  </div>
                                )}

                                {/* Meal Breakdown */}
                                <div className="space-y-4">
                                  {chartMeals[chart.id].map((meal: any) => (
                                    <Card key={meal.id} className="bg-gradient-to-br from-[var(--ayurveda-saffron)]/5 to-[var(--ayurveda-terracotta)]/5">
                                      <CardHeader className="pb-3">
                                        <div className="flex items-center justify-between">
                                          <div className="flex items-center gap-2">
                                            <UtensilsCrossed className="w-4 h-4 text-[var(--ayurveda-saffron)]" />
                                            <CardTitle className="text-base">{meal.meal_type}</CardTitle>
                                          </div>
                                          <div className="flex items-center gap-4 text-sm">
                                            <span className="text-muted-foreground">{meal.timing}</span>
                                            <Badge variant="outline">{meal.total_calories || 0} cal</Badge>
                                          </div>
                                        </div>
                                      </CardHeader>
                                      <CardContent>
                                        {meal.foods && meal.foods.length > 0 ? (
                                          <Table>
                                            <TableHeader>
                                              <TableRow>
                                                <TableHead>Food Item</TableHead>
                                                <TableHead>Quantity</TableHead>
                                                <TableHead className="text-right">Calories</TableHead>
                                                <TableHead className="text-right">Protein</TableHead>
                                                <TableHead className="text-right">Carbs</TableHead>
                                                <TableHead className="text-right">Fat</TableHead>
                                              </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                              {meal.foods.map((food: any) => (
                                                <TableRow key={food.id}>
                                                  <TableCell className="font-medium">{food.food_name}</TableCell>
                                                  <TableCell>{food.quantity} {food.unit}</TableCell>
                                                  <TableCell className="text-right">{Math.round(food.calories || 0)}</TableCell>
                                                  <TableCell className="text-right">{Math.round(food.protein || 0)}g</TableCell>
                                                  <TableCell className="text-right">{Math.round(food.carbs || 0)}g</TableCell>
                                                  <TableCell className="text-right">{Math.round(food.fat || 0)}g</TableCell>
                                                </TableRow>
                                              ))}
                                            </TableBody>
                                          </Table>
                                        ) : (
                                          <p className="text-sm text-muted-foreground text-center py-4">
                                            No food items in this meal
                                          </p>
                                        )}
                                      </CardContent>
                                    </Card>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground">No diet charts created yet</p>
                      <Button className="mt-4" onClick={() => router.push("/diet-charts")}>
                        Create Diet Chart
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="compliance" className="space-y-4">
                {complianceData?.data && complianceData.data.length > 0 ? (
                  <>
                    <Card className="bg-gradient-to-br from-[var(--ayurveda-saffron)]/5 to-[var(--ayurveda-terracotta)]/5 border-[var(--ayurveda-saffron)]/20">
                      <CardHeader>
                        <CardTitle className="text-base">Compliance Statistics</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold">{averageCompliance}%</div>
                            <p className="text-xs text-muted-foreground">Average Compliance</p>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold">{complianceData.statistics.total_records}</div>
                            <p className="text-xs text-muted-foreground">Total Records</p>
                          </div>
                          <div className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              {complianceTrend === "improving" && (
                                <CheckCircle2 className="w-5 h-5 text-green-600" />
                              )}
                              {complianceTrend === "declining" && (
                                <AlertCircle className="w-5 h-5 text-amber-600" />
                              )}
                              {complianceTrend === "stable" && (
                                <Activity className="w-5 h-5 text-blue-600" />
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground capitalize">{complianceTrend}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <div className="grid gap-4">
                      {complianceData.data.map((record: any) => (
                        <Card key={record.id}>
                          <CardContent className="pt-6">
                            <div className="flex items-start justify-between">
                              <div className="space-y-2 flex-1">
                                <div className="flex items-center gap-3">
                                  <Calendar className="w-4 h-4 text-muted-foreground" />
                                  <span className="font-medium">{record.date}</span>
                                  <Badge variant={record.compliance_percentage >= 80 ? "default" : "secondary"}>
                                    {record.compliance_percentage}%
                                  </Badge>
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  Meals: {record.meals_followed} / {record.meals_total}
                                </div>
                                {record.notes && (
                                  <p className="text-sm text-muted-foreground pt-2 border-t">
                                    {record.notes}
                                  </p>
                                )}
                              </div>
                              <Progress value={record.compliance_percentage} className="w-24 h-2" />
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </>
                ) : (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <Activity className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground">No compliance records yet</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </SidebarProvider>
  )
}