"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { Search, Plus, X, AlertCircle, CheckCircle2, TrendingUp, Leaf } from "lucide-react"
import { Progress } from "@/components/ui/progress"

interface Food {
  id: string
  name: string
  category: string
  calories: number
  protein: number
  carbs: number
  fat: number
  thermal: string
  digestibility: string
  rasa: string[]
  dosha: string[]
}

interface MealItem {
  food: Food
  quantity: number
  unit: string
}

interface DietChartData {
  patientId: string
  patientName: string
  dosha: string
  duration: string
  targetCalories: number
  dietaryFocus: string
  meals: {
    breakfast: MealItem[]
    midMorning: MealItem[]
    lunch: MealItem[]
    evening: MealItem[]
    dinner: MealItem[]
  }
  notes: string
}

const SAMPLE_FOODS: Food[] = [
  { id: "1", name: "Oatmeal", category: "Grains", calories: 150, protein: 5, carbs: 27, fat: 3, thermal: "Warm", digestibility: "Easy", rasa: ["Sweet"], dosha: ["Vata", "Kapha"] },
  { id: "2", name: "Almonds", category: "Nuts", calories: 160, protein: 6, carbs: 6, fat: 14, thermal: "Warm", digestibility: "Medium", rasa: ["Sweet"], dosha: ["Vata"] },
  { id: "3", name: "Brown Rice", category: "Grains", calories: 215, protein: 5, carbs: 45, fat: 2, thermal: "Neutral", digestibility: "Easy", rasa: ["Sweet"], dosha: ["Vata", "Pitta", "Kapha"] },
  { id: "4", name: "Mung Dal", category: "Legumes", calories: 105, protein: 7, carbs: 19, fat: 0.4, thermal: "Cool", digestibility: "Easy", rasa: ["Sweet", "Astringent"], dosha: ["Vata", "Pitta", "Kapha"] },
  { id: "5", name: "Spinach", category: "Vegetables", calories: 23, protein: 3, carbs: 4, fat: 0.4, thermal: "Cool", digestibility: "Easy", rasa: ["Bitter", "Astringent"], dosha: ["Pitta", "Kapha"] },
  { id: "6", name: "Carrots", category: "Vegetables", calories: 41, protein: 1, carbs: 10, fat: 0.2, thermal: "Warm", digestibility: "Easy", rasa: ["Sweet"], dosha: ["Vata"] },
  { id: "7", name: "Yogurt", category: "Dairy", calories: 60, protein: 3, carbs: 5, fat: 3, thermal: "Cool", digestibility: "Medium", rasa: ["Sour", "Sweet"], dosha: ["Vata"] },
  { id: "8", name: "Ghee", category: "Fats", calories: 112, protein: 0, carbs: 0, fat: 13, thermal: "Warm", digestibility: "Easy", rasa: ["Sweet"], dosha: ["Vata", "Pitta"] },
  { id: "9", name: "Turmeric", category: "Spices", calories: 8, protein: 0.3, carbs: 1.4, fat: 0.2, thermal: "Hot", digestibility: "Easy", rasa: ["Pungent", "Bitter"], dosha: ["Kapha"] },
  { id: "10", name: "Ginger", category: "Spices", calories: 5, protein: 0.1, carbs: 1, fat: 0.1, thermal: "Hot", digestibility: "Easy", rasa: ["Pungent", "Sweet"], dosha: ["Vata", "Kapha"] },
  { id: "11", name: "Banana", category: "Fruits", calories: 105, protein: 1, carbs: 27, fat: 0.4, thermal: "Cool", digestibility: "Easy", rasa: ["Sweet"], dosha: ["Vata", "Pitta"] },
  { id: "12", name: "Apple", category: "Fruits", calories: 95, protein: 0.5, carbs: 25, fat: 0.3, thermal: "Cool", digestibility: "Easy", rasa: ["Sweet", "Astringent"], dosha: ["Pitta", "Kapha"] },
  { id: "13", name: "Lentils (Red)", category: "Legumes", calories: 115, protein: 9, carbs: 20, fat: 0.4, thermal: "Warm", digestibility: "Medium", rasa: ["Sweet", "Astringent"], dosha: ["Vata", "Kapha"] },
  { id: "14", name: "Chicken Breast", category: "Protein", calories: 165, protein: 31, carbs: 0, fat: 3.6, thermal: "Warm", digestibility: "Medium", rasa: ["Sweet"], dosha: ["Vata", "Kapha"] },
  { id: "15", name: "Sweet Potato", category: "Vegetables", calories: 86, protein: 2, carbs: 20, fat: 0.1, thermal: "Warm", digestibility: "Easy", rasa: ["Sweet"], dosha: ["Vata"] },
]

const PATIENTS = [
  { id: "1", name: "Priya Sharma", age: 32, dosha: "Vata", allergies: "None", dietaryPreference: "Vegetarian" },
  { id: "2", name: "Rahul Patel", age: 45, dosha: "Pitta", allergies: "Dairy", dietaryPreference: "Vegetarian" },
  { id: "3", name: "Ananya Kumar", age: 28, dosha: "Kapha", allergies: "None", dietaryPreference: "Vegan" },
  { id: "4", name: "Vikram Singh", age: 55, dosha: "Vata-Pitta", allergies: "Nuts", dietaryPreference: "Non-Vegetarian" },
]

export function CreateDietChart({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [step, setStep] = useState(1)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedMeal, setSelectedMeal] = useState<keyof DietChartData["meals"]>("breakfast")
  
  const [chartData, setChartData] = useState<DietChartData>({
    patientId: "",
    patientName: "",
    dosha: "",
    duration: "7",
    targetCalories: 1800,
    dietaryFocus: "maintenance",
    meals: {
      breakfast: [],
      midMorning: [],
      lunch: [],
      evening: [],
      dinner: [],
    },
    notes: "",
  })

  const selectedPatient = PATIENTS.find(p => p.id === chartData.patientId)

  const filteredFoods = SAMPLE_FOODS.filter(food =>
    food.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    food.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const addFoodToMeal = (food: Food) => {
    const newItem: MealItem = {
      food,
      quantity: 100,
      unit: "g",
    }
    setChartData({
      ...chartData,
      meals: {
        ...chartData.meals,
        [selectedMeal]: [...chartData.meals[selectedMeal], newItem],
      },
    })
  }

  const removeFoodFromMeal = (mealType: keyof DietChartData["meals"], index: number) => {
    setChartData({
      ...chartData,
      meals: {
        ...chartData.meals,
        [mealType]: chartData.meals[mealType].filter((_, i) => i !== index),
      },
    })
  }

  const updateFoodQuantity = (mealType: keyof DietChartData["meals"], index: number, quantity: number) => {
    const updatedMeals = [...chartData.meals[mealType]]
    updatedMeals[index].quantity = quantity
    setChartData({
      ...chartData,
      meals: {
        ...chartData.meals,
        [mealType]: updatedMeals,
      },
    })
  }

  const calculateMealNutrition = (meals: MealItem[]) => {
    return meals.reduce(
      (acc, item) => {
        const multiplier = item.quantity / 100
        return {
          calories: acc.calories + item.food.calories * multiplier,
          protein: acc.protein + item.food.protein * multiplier,
          carbs: acc.carbs + item.food.carbs * multiplier,
          fat: acc.fat + item.food.fat * multiplier,
        }
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    )
  }

  const calculateTotalNutrition = () => {
    const allMeals = [
      ...chartData.meals.breakfast,
      ...chartData.meals.midMorning,
      ...chartData.meals.lunch,
      ...chartData.meals.evening,
      ...chartData.meals.dinner,
    ]
    return calculateMealNutrition(allMeals)
  }

  const totals = calculateTotalNutrition()

  const checkAyurvedicCompliance = () => {
    const allFoods = [
      ...chartData.meals.breakfast,
      ...chartData.meals.midMorning,
      ...chartData.meals.lunch,
      ...chartData.meals.evening,
      ...chartData.meals.dinner,
    ].map(item => item.food)

    // Check dosha compatibility
    const doshaCompatible = allFoods.filter(food => 
      food.dosha.includes(chartData.dosha.split("-")[0])
    )
    const doshaScore = (doshaCompatible.length / allFoods.length) * 100

    // Check six tastes
    const allRasas = new Set(allFoods.flatMap(food => food.rasa))
    const rasaScore = (allRasas.size / 6) * 100

    // Check digestibility
    const easyDigest = allFoods.filter(food => food.digestibility === "Easy")
    const digestScore = (easyDigest.length / allFoods.length) * 100

    return {
      doshaScore: Math.round(doshaScore),
      rasaScore: Math.round(rasaScore),
      digestScore: Math.round(digestScore),
      overall: Math.round((doshaScore + rasaScore + digestScore) / 3),
    }
  }

  const compliance = chartData.patientId ? checkAyurvedicCompliance() : null

  const handleSave = () => {
    console.log("Saving diet chart:", chartData)
    // In a real app, this would save to database
    onOpenChange(false)
    // Reset form
    setStep(1)
    setChartData({
      patientId: "",
      patientName: "",
      dosha: "",
      duration: "7",
      targetCalories: 1800,
      dietaryFocus: "maintenance",
      meals: {
        breakfast: [],
        midMorning: [],
        lunch: [],
        evening: [],
        dinner: [],
      },
      notes: "",
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Create New Diet Chart</DialogTitle>
          <DialogDescription>
            Step {step} of 3: {step === 1 ? "Patient & Configuration" : step === 2 ? "Meal Planning" : "Review & Notes"}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-auto">
          {/* Step 1: Patient & Configuration */}
          {step === 1 && (
            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <Label htmlFor="patient">Select Patient *</Label>
                <Select
                  value={chartData.patientId}
                  onValueChange={(value) => {
                    const patient = PATIENTS.find(p => p.id === value)
                    setChartData({
                      ...chartData,
                      patientId: value,
                      patientName: patient?.name || "",
                      dosha: patient?.dosha || "",
                    })
                  }}
                >
                  <SelectTrigger id="patient">
                    <SelectValue placeholder="Choose a patient" />
                  </SelectTrigger>
                  <SelectContent>
                    {PATIENTS.map((patient) => (
                      <SelectItem key={patient.id} value={patient.id}>
                        {patient.name} ({patient.dosha}) - {patient.dietaryPreference}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedPatient && (
                <Card className="bg-muted/50">
                  <CardContent className="pt-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Age:</span>
                        <span className="ml-2 font-medium">{selectedPatient.age} years</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Dosha:</span>
                        <span className="ml-2 font-medium">{selectedPatient.dosha}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Allergies:</span>
                        <span className="ml-2 font-medium">{selectedPatient.allergies}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Diet:</span>
                        <span className="ml-2 font-medium">{selectedPatient.dietaryPreference}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration</Label>
                  <Select value={chartData.duration} onValueChange={(value) => setChartData({ ...chartData, duration: value })}>
                    <SelectTrigger id="duration">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">7 days</SelectItem>
                      <SelectItem value="14">14 days</SelectItem>
                      <SelectItem value="30">30 days</SelectItem>
                      <SelectItem value="60">60 days</SelectItem>
                      <SelectItem value="90">90 days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="target-calories">Target Calories/day</Label>
                  <Input
                    id="target-calories"
                    type="number"
                    value={chartData.targetCalories}
                    onChange={(e) => setChartData({ ...chartData, targetCalories: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="focus">Dietary Focus</Label>
                <Select value={chartData.dietaryFocus} onValueChange={(value) => setChartData({ ...chartData, dietaryFocus: value })}>
                  <SelectTrigger id="focus">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weight-loss">Weight Loss</SelectItem>
                    <SelectItem value="weight-gain">Weight Gain</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="therapeutic">Therapeutic</SelectItem>
                    <SelectItem value="digestive-health">Digestive Health</SelectItem>
                    <SelectItem value="immunity-boost">Immunity Boost</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                className="w-full"
                disabled={!chartData.patientId}
                onClick={() => setStep(2)}
              >
                Continue to Meal Planning
              </Button>
            </div>
          )}

          {/* Step 2: Meal Planning */}
          {step === 2 && (
            <div className="space-y-4 py-4">
              {/* Nutritional Summary */}
              <div className="grid grid-cols-4 gap-3">
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-xs text-muted-foreground">Calories</div>
                    <div className="text-lg font-bold">{Math.round(totals.calories)}</div>
                    <Progress value={(totals.calories / chartData.targetCalories) * 100} className="h-1 mt-1" />
                    <div className="text-xs text-muted-foreground mt-1">
                      {Math.round((totals.calories / chartData.targetCalories) * 100)}% of target
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-xs text-muted-foreground">Protein</div>
                    <div className="text-lg font-bold">{Math.round(totals.protein)}g</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {totals.calories > 0 ? Math.round((totals.protein * 4 / totals.calories) * 100) : 0}% cal
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-xs text-muted-foreground">Carbs</div>
                    <div className="text-lg font-bold">{Math.round(totals.carbs)}g</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {totals.calories > 0 ? Math.round((totals.carbs * 4 / totals.calories) * 100) : 0}% cal
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-xs text-muted-foreground">Fat</div>
                    <div className="text-lg font-bold">{Math.round(totals.fat)}g</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {totals.calories > 0 ? Math.round((totals.fat * 9 / totals.calories) * 100) : 0}% cal
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Ayurvedic Compliance */}
              {compliance && (
                <Card className="bg-gradient-to-br from-[var(--ayurveda-saffron)]/5 to-[var(--ayurveda-terracotta)]/5 border-[var(--ayurveda-saffron)]/20">
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Leaf className="w-4 h-4 text-[var(--ayurveda-saffron)]" />
                        <span className="text-sm font-medium">Ayurvedic Compliance</span>
                      </div>
                      <Badge variant={compliance.overall >= 70 ? "default" : "secondary"}>
                        {compliance.overall}%
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <div className="text-muted-foreground">Dosha Balance</div>
                        <div className="font-medium">{compliance.doshaScore}%</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Six Tastes</div>
                        <div className="font-medium">{compliance.rasaScore}%</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Digestibility</div>
                        <div className="font-medium">{compliance.digestScore}%</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="grid grid-cols-3 gap-4">
                {/* Meal Tabs */}
                <div className="col-span-2 space-y-4">
                  <Tabs value={selectedMeal} onValueChange={(value) => setSelectedMeal(value as keyof DietChartData["meals"])}>
                    <TabsList className="grid grid-cols-5 w-full">
                      <TabsTrigger value="breakfast">Breakfast</TabsTrigger>
                      <TabsTrigger value="midMorning">Mid-Morning</TabsTrigger>
                      <TabsTrigger value="lunch">Lunch</TabsTrigger>
                      <TabsTrigger value="evening">Evening</TabsTrigger>
                      <TabsTrigger value="dinner">Dinner</TabsTrigger>
                    </TabsList>

                    {(["breakfast", "midMorning", "lunch", "evening", "dinner"] as const).map((mealType) => (
                      <TabsContent key={mealType} value={mealType} className="space-y-3">
                        {chartData.meals[mealType].length === 0 ? (
                          <Card className="border-dashed">
                            <CardContent className="pt-6 text-center text-muted-foreground">
                              <p className="text-sm">No items added yet. Search and add foods from the right panel.</p>
                            </CardContent>
                          </Card>
                        ) : (
                          <Card>
                            <CardContent className="pt-4 space-y-2">
                              {chartData.meals[mealType].map((item, index) => {
                                const itemNutrition = {
                                  calories: (item.food.calories * item.quantity) / 100,
                                  protein: (item.food.protein * item.quantity) / 100,
                                  carbs: (item.food.carbs * item.quantity) / 100,
                                  fat: (item.food.fat * item.quantity) / 100,
                                }
                                return (
                                  <div key={index} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                                    <div className="flex-1">
                                      <div className="font-medium text-sm">{item.food.name}</div>
                                      <div className="text-xs text-muted-foreground mt-1">
                                        {Math.round(itemNutrition.calories)} cal | P: {Math.round(itemNutrition.protein)}g | C: {Math.round(itemNutrition.carbs)}g | F: {Math.round(itemNutrition.fat)}g
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Input
                                        type="number"
                                        value={item.quantity}
                                        onChange={(e) => updateFoodQuantity(mealType, index, parseInt(e.target.value) || 0)}
                                        className="w-20 h-8 text-sm"
                                      />
                                      <span className="text-sm text-muted-foreground">{item.unit}</span>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => removeFoodFromMeal(mealType, index)}
                                      >
                                        <X className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  </div>
                                )
                              })}
                              <div className="pt-2 border-t">
                                <div className="text-sm font-medium">
                                  Meal Total: {Math.round(calculateMealNutrition(chartData.meals[mealType]).calories)} calories
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        )}
                      </TabsContent>
                    ))}
                  </Tabs>
                </div>

                {/* Food Search */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Add Foods</CardTitle>
                    <div className="relative mt-2">
                      <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Search foods..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8 h-8 text-sm"
                      />
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <ScrollArea className="h-[400px]">
                      <div className="p-4 pt-0 space-y-2">
                        {filteredFoods.map((food) => (
                          <div
                            key={food.id}
                            className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                            onClick={() => addFoodToMeal(food)}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <div className="font-medium text-sm">{food.name}</div>
                                <div className="text-xs text-muted-foreground">{food.category}</div>
                                <div className="text-xs text-muted-foreground mt-1">
                                  {food.calories} cal | {food.thermal} | {food.digestibility}
                                </div>
                              </div>
                              <Plus className="w-4 h-4 text-muted-foreground" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button className="flex-1" onClick={() => setStep(3)}>
                  Continue to Review
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Review & Notes */}
          {step === 3 && (
            <div className="space-y-6 py-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Diet Chart Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Patient:</span>
                      <span className="ml-2 font-medium">{chartData.patientName}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Dosha:</span>
                      <span className="ml-2 font-medium">{chartData.dosha}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Duration:</span>
                      <span className="ml-2 font-medium">{chartData.duration} days</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Focus:</span>
                      <span className="ml-2 font-medium capitalize">{chartData.dietaryFocus.replace("-", " ")}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Nutritional Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <div className="text-2xl font-bold">{Math.round(totals.calories)}</div>
                      <div className="text-xs text-muted-foreground">Calories/day</div>
                      <Progress value={(totals.calories / chartData.targetCalories) * 100} className="h-1 mt-2" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{Math.round(totals.protein)}g</div>
                      <div className="text-xs text-muted-foreground">Protein</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{Math.round(totals.carbs)}g</div>
                      <div className="text-xs text-muted-foreground">Carbs</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{Math.round(totals.fat)}g</div>
                      <div className="text-xs text-muted-foreground">Fat</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {compliance && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Leaf className="w-4 h-4 text-[var(--ayurveda-saffron)]" />
                      Ayurvedic Compliance Report
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Overall Compliance</span>
                        <Badge variant={compliance.overall >= 70 ? "default" : "secondary"} className="text-base">
                          {compliance.overall}%
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div className="flex items-start gap-2">
                          {compliance.doshaScore >= 70 ? (
                            <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5" />
                          )}
                          <div>
                            <div className="font-medium">Dosha Balance</div>
                            <div className="text-muted-foreground">{compliance.doshaScore}%</div>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          {compliance.rasaScore >= 70 ? (
                            <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5" />
                          )}
                          <div>
                            <div className="font-medium">Six Tastes</div>
                            <div className="text-muted-foreground">{compliance.rasaScore}%</div>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          {compliance.digestScore >= 70 ? (
                            <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5" />
                          )}
                          <div>
                            <div className="font-medium">Digestibility</div>
                            <div className="text-muted-foreground">{compliance.digestScore}%</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="space-y-2">
                <Label htmlFor="notes">Special Instructions & Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Add any special dietary instructions, timing recommendations, or notes for the patient..."
                  value={chartData.notes}
                  onChange={(e) => setChartData({ ...chartData, notes: e.target.value })}
                  rows={4}
                />
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(2)}>
                  Back
                </Button>
                <Button className="flex-1 bg-gradient-to-r from-[var(--ayurveda-saffron)] to-[var(--ayurveda-terracotta)] text-white" onClick={handleSave}>
                  Save Diet Chart
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}