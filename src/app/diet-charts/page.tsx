"use client"

import { useState, useEffect } from "react"
import { AppSidebar } from "@/components/AppSidebar"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Calendar, User, Printer, Download, CheckCircle2, AlertCircle, Loader2 } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import { CreateDietChart } from "@/components/CreateDietChart"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface DietChart {
  id: number
  patient_id: number
  duration: number
  target_calories: number
  dietary_focus: string
  status: string
  created_at: string
  dosha_balance_score?: number
  rasa_score?: number
  digestibility_score?: number
  patient?: {
    name: string
    dosha: string
    age: number
  }
}

export default function DietChartsPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [isCreateChartOpen, setIsCreateChartOpen] = useState(false)
  const [dietCharts, setDietCharts] = useState<DietChart[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDietCharts()
  }, [])

  const fetchDietCharts = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/diet-charts")
      if (!response.ok) throw new Error("Failed to fetch diet charts")
      const data = await response.json()
      setDietCharts(data)
    } catch (error) {
      console.error("Error fetching diet charts:", error)
      toast.error("Failed to load diet charts")
    } finally {
      setLoading(false)
    }
  }

  const filteredCharts = dietCharts.filter((chart) =>
    chart.patient?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const activeCharts = filteredCharts.filter((c) => c.status === "Active")
  const completedCharts = filteredCharts.filter((c) => c.status === "Completed")

  // Preview sample data
  const mealPlan = {
    breakfast: [
      { food: "Oatmeal with almonds", qty: "1 bowl", calories: 220, protein: 8, carbs: 35, fat: 6 },
      { food: "Herbal tea", qty: "1 cup", calories: 5, protein: 0, carbs: 1, fat: 0 },
    ],
    lunch: [
      { food: "Brown rice", qty: "1 cup", calories: 215, protein: 5, carbs: 45, fat: 2 },
      { food: "Mung dal", qty: "1 cup", calories: 105, protein: 7, carbs: 19, fat: 0.4 },
      { food: "Mixed vegetables", qty: "1 cup", calories: 80, protein: 3, carbs: 15, fat: 1 },
    ],
    snack: [
      { food: "Fresh fruits", qty: "1 serving", calories: 95, protein: 1, carbs: 25, fat: 0 },
      { food: "Nuts", qty: "10 pieces", calories: 85, protein: 3, carbs: 3, fat: 7 },
    ],
    dinner: [
      { food: "Vegetable khichdi", qty: "1.5 cups", calories: 240, protein: 8, carbs: 40, fat: 5 },
      { food: "Yogurt", qty: "1 small bowl", calories: 60, protein: 3, carbs: 5, fat: 3 },
    ],
  }

  const calculateTotals = () => {
    const allMeals = [...mealPlan.breakfast, ...mealPlan.lunch, ...mealPlan.snack, ...mealPlan.dinner]
    return {
      calories: allMeals.reduce((sum, item) => sum + item.calories, 0),
      protein: allMeals.reduce((sum, item) => sum + item.protein, 0),
      carbs: allMeals.reduce((sum, item) => sum + item.carbs, 0),
      fat: allMeals.reduce((sum, item) => sum + item.fat, 0),
    }
  }

  const totals = calculateTotals()
  const targetCalories = 1800

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <main className="flex-1 overflow-auto">
          <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 no-print">
            <div className="flex h-16 items-center gap-4 px-6">
              <SidebarTrigger />
              <div className="flex-1">
                <h1 className="text-2xl font-semibold">Diet Chart Management</h1>
                <p className="text-sm text-muted-foreground">Create and manage personalized diet plans</p>
              </div>
              <Button 
                className="bg-gradient-to-r from-[var(--ayurveda-saffron)] to-[var(--ayurveda-terracotta)] text-white hover:opacity-90"
                onClick={() => setIsCreateChartOpen(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Diet Chart
              </Button>
            </div>
          </header>

          <div className="p-6 space-y-6">
            <Tabs defaultValue="all" className="w-full">
              <TabsList>
                <TabsTrigger value="all">All Charts ({filteredCharts.length})</TabsTrigger>
                <TabsTrigger value="active">Active ({activeCharts.length})</TabsTrigger>
                <TabsTrigger value="completed">Completed ({completedCharts.length})</TabsTrigger>
                <TabsTrigger value="preview">Preview Sample</TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="space-y-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Search diet charts by patient name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </CardContent>
                </Card>

                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredCharts.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <p className="text-muted-foreground">No diet charts found. Create your first diet chart to get started.</p>
                      <Button className="mt-4" onClick={() => setIsCreateChartOpen(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Create Diet Chart
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-4">
                    {filteredCharts.map((chart) => (
                      <Card 
                        key={chart.id} 
                        className="hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => router.push(`/patients/${chart.patient_id}`)}
                      >
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 space-y-3">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--ayurveda-sage)] to-[var(--ayurveda-forest)] flex items-center justify-center text-white font-semibold">
                                  <User className="w-5 h-5" />
                                </div>
                                <div>
                                  <h3 className="font-semibold">{chart.patient?.name || "Unknown Patient"}</h3>
                                  <p className="text-sm text-muted-foreground">Dosha: {chart.patient?.dosha || "N/A"}</p>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div className="flex items-center gap-2">
                                  <Calendar className="w-4 h-4 text-muted-foreground" />
                                  <span>{new Date(chart.created_at).toLocaleDateString()}</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Duration: </span>
                                  <span className="font-medium">{chart.duration} days</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Target: </span>
                                  <span className="font-medium">{chart.target_calories} cal</span>
                                </div>
                                <div>
                                  <Badge variant={chart.status === "Active" ? "default" : "secondary"}>
                                    {chart.status}
                                  </Badge>
                                </div>
                              </div>
                              {chart.dietary_focus && (
                                <div className="text-sm">
                                  <span className="text-muted-foreground">Focus: </span>
                                  <span className="font-medium capitalize">{chart.dietary_focus.replace("-", " ")}</span>
                                </div>
                              )}
                              {(chart.dosha_balance_score || chart.rasa_score || chart.digestibility_score) && (
                                <div className="flex gap-4 text-sm pt-2 border-t">
                                  {chart.dosha_balance_score && (
                                    <div>
                                      <span className="text-muted-foreground">Dosha: </span>
                                      <span className="font-medium">{chart.dosha_balance_score}%</span>
                                    </div>
                                  )}
                                  {chart.rasa_score && (
                                    <div>
                                      <span className="text-muted-foreground">Rasa: </span>
                                      <span className="font-medium">{chart.rasa_score}%</span>
                                    </div>
                                  )}
                                  {chart.digestibility_score && (
                                    <div>
                                      <span className="text-muted-foreground">Digestibility: </span>
                                      <span className="font-medium">{chart.digestibility_score}%</span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                            <div className="flex gap-2 ml-4">
                              <Button variant="outline" size="icon" onClick={(e) => { e.stopPropagation(); window.print() }}>
                                <Printer className="w-4 h-4" />
                              </Button>
                              <Button variant="outline" size="icon" onClick={(e) => e.stopPropagation()}>
                                <Download className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="active" className="space-y-4">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                  </div>
                ) : activeCharts.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <p className="text-muted-foreground">No active diet charts</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-4">
                    {activeCharts.map((chart) => (
                      <Card 
                        key={chart.id}
                        className="hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => router.push(`/patients/${chart.patient_id}`)}
                      >
                        <CardContent className="pt-6">
                          <div className="flex items-center gap-3">
                            <User className="w-8 h-8" />
                            <div>
                              <h3 className="font-semibold">{chart.patient?.name}</h3>
                              <p className="text-sm text-muted-foreground">{chart.patient?.dosha}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="completed" className="space-y-4">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                  </div>
                ) : completedCharts.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <p className="text-muted-foreground">No completed diet charts</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-4">
                    {completedCharts.map((chart) => (
                      <Card 
                        key={chart.id}
                        className="hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => router.push(`/patients/${chart.patient_id}`)}
                      >
                        <CardContent className="pt-6">
                          <div className="flex items-center gap-3">
                            <User className="w-8 h-8" />
                            <div>
                              <h3 className="font-semibold">{chart.patient?.name}</h3>
                              <p className="text-sm text-muted-foreground">{chart.patient?.dosha}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="preview" className="space-y-6">
                {/* Nutritional Analysis Dashboard */}
                <div className="grid gap-4 md:grid-cols-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Total Calories</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{totals.calories}</div>
                      <p className="text-xs text-muted-foreground">
                        Target: {targetCalories} ({Math.round((totals.calories / targetCalories) * 100)}%)
                      </p>
                      <Progress value={(totals.calories / targetCalories) * 100} className="h-1 mt-2" />
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Protein</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{totals.protein}g</div>
                      <p className="text-xs text-muted-foreground">
                        {Math.round((totals.protein * 4 / totals.calories) * 100)}% of calories
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Carbohydrates</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{totals.carbs}g</div>
                      <p className="text-xs text-muted-foreground">
                        {Math.round((totals.carbs * 4 / totals.calories) * 100)}% of calories
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Fat</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{totals.fat}g</div>
                      <p className="text-xs text-muted-foreground">
                        {Math.round((totals.fat * 9 / totals.calories) * 100)}% of calories
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Ayurvedic Compliance */}
                <Card className="bg-gradient-to-br from-[var(--ayurveda-saffron)]/5 to-[var(--ayurveda-terracotta)]/5 border-[var(--ayurveda-saffron)]/20">
                  <CardHeader>
                    <CardTitle>Ayurvedic Compliance Indicators</CardTitle>
                    <CardDescription>Diet plan alignment with Ayurvedic principles</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-white dark:bg-card border">
                        <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                        <div>
                          <p className="font-medium text-sm">Dosha Balance</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Foods selected are suitable for Vata constitution
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-white dark:bg-card border">
                        <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                        <div>
                          <p className="font-medium text-sm">Six Tastes</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            All six Rasa categories represented
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-white dark:bg-card border">
                        <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                        <div>
                          <p className="font-medium text-sm">Digestibility</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Consider lighter dinner for better digestion
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Print-friendly Diet Chart */}
                <Card>
                  <CardHeader className="no-print">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Daily Meal Plan</CardTitle>
                        <CardDescription>Personalized Ayurvedic diet chart</CardDescription>
                      </div>
                      <Button onClick={() => window.print()} variant="outline">
                        <Printer className="w-4 h-4 mr-2" />
                        Print Chart
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Header for print */}
                    <div className="hidden print:block text-center mb-6">
                      <h1 className="text-2xl font-bold mb-2">AyurDiet - Personalized Diet Chart</h1>
                      <p className="text-sm text-muted-foreground">Prepared by: Dr. Ayurveda | Date: {new Date().toLocaleDateString()}</p>
                      <p className="text-sm mt-2">Patient: Priya Sharma | Dosha: Vata | Duration: 7 days</p>
                    </div>

                    {/* Breakfast */}
                    <div>
                      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                        <span className="text-2xl">🌅</span> Breakfast (7:00 - 8:00 AM)
                      </h3>
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
                          {mealPlan.breakfast.map((item, idx) => (
                            <TableRow key={idx}>
                              <TableCell className="font-medium">{item.food}</TableCell>
                              <TableCell>{item.qty}</TableCell>
                              <TableCell className="text-right">{item.calories}</TableCell>
                              <TableCell className="text-right">{item.protein}g</TableCell>
                              <TableCell className="text-right">{item.carbs}g</TableCell>
                              <TableCell className="text-right">{item.fat}g</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Lunch */}
                    <div>
                      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                        <span className="text-2xl">☀️</span> Lunch (12:00 - 1:00 PM)
                      </h3>
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
                          {mealPlan.lunch.map((item, idx) => (
                            <TableRow key={idx}>
                              <TableCell className="font-medium">{item.food}</TableCell>
                              <TableCell>{item.qty}</TableCell>
                              <TableCell className="text-right">{item.calories}</TableCell>
                              <TableCell className="text-right">{item.protein}g</TableCell>
                              <TableCell className="text-right">{item.carbs}g</TableCell>
                              <TableCell className="text-right">{item.fat}g</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Snack */}
                    <div>
                      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                        <span className="text-2xl">🥤</span> Evening Snack (4:00 - 5:00 PM)
                      </h3>
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
                          {mealPlan.snack.map((item, idx) => (
                            <TableRow key={idx}>
                              <TableCell className="font-medium">{item.food}</TableCell>
                              <TableCell>{item.qty}</TableCell>
                              <TableCell className="text-right">{item.calories}</TableCell>
                              <TableCell className="text-right">{item.protein}g</TableCell>
                              <TableCell className="text-right">{item.carbs}g</TableCell>
                              <TableCell className="text-right">{item.fat}g</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Dinner */}
                    <div>
                      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                        <span className="text-2xl">🌙</span> Dinner (7:00 - 8:00 PM)
                      </h3>
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
                          {mealPlan.dinner.map((item, idx) => (
                            <TableRow key={idx}>
                              <TableCell className="font-medium">{item.food}</TableCell>
                              <TableCell>{item.qty}</TableCell>
                              <TableCell className="text-right">{item.calories}</TableCell>
                              <TableCell className="text-right">{item.protein}g</TableCell>
                              <TableCell className="text-right">{item.carbs}g</TableCell>
                              <TableCell className="text-right">{item.fat}g</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Ayurvedic Guidelines */}
                    <div className="mt-6 p-4 bg-muted/50 rounded-lg print-page-break">
                      <h3 className="text-lg font-semibold mb-3">Ayurvedic Dietary Guidelines</h3>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-start gap-2">
                          <span className="text-green-600">✓</span>
                          <span>Eat warm, cooked foods. Avoid cold or raw foods which can aggravate Vata.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-green-600">✓</span>
                          <span>Include ghee or healthy oils in moderation for nourishment.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-green-600">✓</span>
                          <span>Favor sweet, sour, and salty tastes. Minimize bitter, pungent, and astringent.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-green-600">✓</span>
                          <span>Maintain regular meal times. Eat in a calm, peaceful environment.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-green-600">✓</span>
                          <span>Drink warm water throughout the day. Avoid ice-cold beverages.</span>
                        </li>
                      </ul>
                    </div>

                    <div className="text-center text-sm text-muted-foreground print:mt-8">
                      <p>For any concerns or modifications, please consult your Ayurvedic practitioner.</p>
                      <p className="mt-2">© AyurDiet - Holistic Nutrition Management System</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>

      <CreateDietChart 
        open={isCreateChartOpen} 
        onOpenChange={setIsCreateChartOpen}
        onSuccess={fetchDietCharts}
      />
    </SidebarProvider>
  )
}