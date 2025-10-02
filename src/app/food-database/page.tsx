"use client"

import { useState } from "react"
import { AppSidebar } from "@/components/AppSidebar"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Plus, Flame, Droplet, Wind, Sparkles } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function FoodDatabasePage() {
  const [searchQuery, setSearchQuery] = useState("")

  const foodItems = [
    {
      id: 1,
      name: "Brown Rice",
      category: "Grains",
      calories: 112,
      protein: 2.6,
      carbs: 23.5,
      fat: 0.9,
      property: "Warm",
      digestibility: "Easy",
      rasa: ["Sweet"],
      dosha: "Balances Vata",
    },
    {
      id: 2,
      name: "Mung Dal",
      category: "Legumes",
      calories: 105,
      protein: 7.0,
      carbs: 19.2,
      fat: 0.4,
      property: "Cool",
      digestibility: "Easy",
      rasa: ["Sweet", "Astringent"],
      dosha: "Balances all Doshas",
    },
    {
      id: 3,
      name: "Ghee",
      category: "Fats & Oils",
      calories: 112,
      protein: 0,
      carbs: 0,
      fat: 12.7,
      property: "Warm",
      digestibility: "Easy",
      rasa: ["Sweet"],
      dosha: "Balances Vata & Pitta",
    },
    {
      id: 4,
      name: "Ginger (Fresh)",
      category: "Spices",
      calories: 80,
      protein: 1.8,
      carbs: 17.8,
      fat: 0.7,
      property: "Hot",
      digestibility: "Medium",
      rasa: ["Pungent", "Sweet"],
      dosha: "Balances Kapha & Vata",
    },
    {
      id: 5,
      name: "Spinach",
      category: "Vegetables",
      calories: 23,
      protein: 2.9,
      carbs: 3.6,
      fat: 0.4,
      property: "Cool",
      digestibility: "Easy",
      rasa: ["Bitter", "Astringent"],
      dosha: "Balances Pitta & Kapha",
    },
  ]

  const propertyColors = {
    Warm: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
    Cool: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    Hot: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  }

  const rasaIcons = {
    Sweet: "🍯",
    Sour: "🍋",
    Salty: "🧂",
    Pungent: "🌶️",
    Bitter: "🌿",
    Astringent: "🍵",
  }

  const categories = [
    { name: "All Foods", count: 8247 },
    { name: "Grains", count: 450 },
    { name: "Vegetables", count: 1200 },
    { name: "Fruits", count: 800 },
    { name: "Legumes", count: 350 },
    { name: "Dairy", count: 250 },
    { name: "Spices", count: 180 },
    { name: "Fats & Oils", count: 80 },
  ]

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <main className="flex-1 overflow-auto">
          <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex h-16 items-center gap-4 px-6">
              <SidebarTrigger />
              <div className="flex-1">
                <h1 className="text-2xl font-semibold">Food Database</h1>
                <p className="text-sm text-muted-foreground">Browse 8,000+ foods with Ayurvedic properties</p>
              </div>
              <Button className="bg-gradient-to-r from-[var(--ayurveda-saffron)] to-[var(--ayurveda-terracotta)] text-white hover:opacity-90">
                <Plus className="w-4 h-4 mr-2" />
                Add Food Item
              </Button>
            </div>
          </header>

          <div className="p-6 space-y-6">
            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-sm font-medium">Total Foods</CardTitle>
                  <Sparkles className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">8,247</div>
                  <p className="text-xs text-muted-foreground">Across all categories</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-sm font-medium">Indian Cuisine</CardTitle>
                  <span className="text-2xl">🇮🇳</span>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">5,420</div>
                  <p className="text-xs text-muted-foreground">Traditional foods</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-sm font-medium">International</CardTitle>
                  <span className="text-2xl">🌍</span>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">2,827</div>
                  <p className="text-xs text-muted-foreground">Global cuisines</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-sm font-medium">Recipes</CardTitle>
                  <span className="text-2xl">👨‍🍳</span>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">1,200+</div>
                  <p className="text-xs text-muted-foreground">With nutrient data</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-4">
              {/* Categories Sidebar */}
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle>Categories</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {categories.map((category) => (
                      <button
                        key={category.name}
                        className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors text-left"
                      >
                        <span className="text-sm font-medium">{category.name}</span>
                        <span className="text-xs text-muted-foreground">{category.count}</span>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Main Content */}
              <div className="lg:col-span-3 space-y-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Search by food name, nutrient, or Ayurvedic property..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <Tabs defaultValue="all" className="w-full">
                      <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="all">All</TabsTrigger>
                        <TabsTrigger value="vata">Vata</TabsTrigger>
                        <TabsTrigger value="pitta">Pitta</TabsTrigger>
                        <TabsTrigger value="kapha">Kapha</TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Food Item</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead className="text-right">Cal</TableHead>
                          <TableHead className="text-right">P</TableHead>
                          <TableHead className="text-right">C</TableHead>
                          <TableHead className="text-right">F</TableHead>
                          <TableHead>Property</TableHead>
                          <TableHead>Rasa</TableHead>
                          <TableHead>Dosha Effect</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {foodItems.map((food) => (
                          <TableRow key={food.id} className="cursor-pointer hover:bg-muted/50">
                            <TableCell className="font-medium">{food.name}</TableCell>
                            <TableCell>{food.category}</TableCell>
                            <TableCell className="text-right">{food.calories}</TableCell>
                            <TableCell className="text-right">{food.protein}g</TableCell>
                            <TableCell className="text-right">{food.carbs}g</TableCell>
                            <TableCell className="text-right">{food.fat}g</TableCell>
                            <TableCell>
                              <Badge className={propertyColors[food.property as keyof typeof propertyColors]} variant="secondary">
                                {food.property === "Hot" && <Flame className="w-3 h-3 mr-1" />}
                                {food.property === "Cool" && <Droplet className="w-3 h-3 mr-1" />}
                                {food.property === "Warm" && <Wind className="w-3 h-3 mr-1" />}
                                {food.property}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                {food.rasa.map((r) => (
                                  <span key={r} title={r} className="text-sm">
                                    {rasaIcons[r as keyof typeof rasaIcons]}
                                  </span>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">{food.dosha}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  )
}