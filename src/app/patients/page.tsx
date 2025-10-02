"use client"

import { useState, useEffect } from "react"
import { AppSidebar } from "@/components/AppSidebar"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Filter, MoreVertical, Phone, Mail, Calendar, Loader2 } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

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
}

export default function PatientsPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [isAddPatientOpen, setIsAddPatientOpen] = useState(false)
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    gender: "",
    dosha: "",
    phone: "",
    email: "",
    height: "",
    weight: "",
    dietary_habits: "",
    meal_frequency: "",
    water_intake: "",
    health_conditions: "",
    allergies: "",
    notes: "",
  })

  const fetchPatients = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/patients")
      if (!response.ok) throw new Error("Failed to fetch patients")
      const data = await response.json()
      setPatients(data)
    } catch (error) {
      console.error("Error fetching patients:", error)
      toast.error("Failed to load patients")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPatients()
  }, [])

  const handleSubmit = async () => {
    if (!formData.name || !formData.age || !formData.gender || !formData.dosha) {
      toast.error("Please fill in all required fields")
      return
    }

    try {
      setSubmitting(true)
      const response = await fetch("/api/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          age: parseInt(formData.age),
          gender: formData.gender.charAt(0).toUpperCase() + formData.gender.slice(1),
          dosha: formData.dosha.split("-").map(d => d.charAt(0).toUpperCase() + d.slice(1)).join("-"),
          phone: formData.phone || undefined,
          email: formData.email || undefined,
          height: formData.height ? parseFloat(formData.height) : undefined,
          weight: formData.weight ? parseFloat(formData.weight) : undefined,
          dietary_habits: formData.dietary_habits || undefined,
          meal_frequency: formData.meal_frequency ? parseInt(formData.meal_frequency) : undefined,
          water_intake: formData.water_intake ? parseFloat(formData.water_intake) : undefined,
          health_conditions: formData.health_conditions || undefined,
          allergies: formData.allergies || undefined,
          notes: formData.notes || undefined,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to add patient")
      }

      toast.success("Patient added successfully!")
      setIsAddPatientOpen(false)
      setFormData({
        name: "",
        age: "",
        gender: "",
        dosha: "",
        phone: "",
        email: "",
        height: "",
        weight: "",
        dietary_habits: "",
        meal_frequency: "",
        water_intake: "",
        health_conditions: "",
        allergies: "",
        notes: "",
      })
      fetchPatients()
    } catch (error: any) {
      console.error("Error adding patient:", error)
      toast.error(error.message || "Failed to add patient")
    } finally {
      setSubmitting(false)
    }
  }

  const filteredPatients = patients.filter((patient) =>
    patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    patient.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    patient.phone?.includes(searchQuery)
  )

  const doshaColors = {
    Vata: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    Pitta: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    Kapha: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    "Vata-Pitta": "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
    "Pitta-Kapha": "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
    "Kapha-Vata": "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300",
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <main className="flex-1 overflow-auto">
          <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex h-16 items-center gap-4 px-6">
              <SidebarTrigger />
              <div className="flex-1">
                <h1 className="text-2xl font-semibold">Patient Management</h1>
                <p className="text-sm text-muted-foreground">Manage and track patient profiles</p>
              </div>
              <Dialog open={isAddPatientOpen} onOpenChange={setIsAddPatientOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-[var(--ayurveda-saffron)] to-[var(--ayurveda-terracotta)] text-white hover:opacity-90">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Patient
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Add New Patient</DialogTitle>
                    <DialogDescription>Enter patient details and Ayurvedic profile</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name *</Label>
                        <Input
                          id="name"
                          placeholder="Enter full name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="age">Age *</Label>
                        <Input
                          id="age"
                          type="number"
                          placeholder="Age"
                          value={formData.age}
                          onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="gender">Gender *</Label>
                        <Select value={formData.gender} onValueChange={(value) => setFormData({ ...formData, gender: value })}>
                          <SelectTrigger id="gender">
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="dosha">Primary Dosha *</Label>
                        <Select value={formData.dosha} onValueChange={(value) => setFormData({ ...formData, dosha: value })}>
                          <SelectTrigger id="dosha">
                            <SelectValue placeholder="Select dosha" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="vata">Vata</SelectItem>
                            <SelectItem value="pitta">Pitta</SelectItem>
                            <SelectItem value="kapha">Kapha</SelectItem>
                            <SelectItem value="vata-pitta">Vata-Pitta</SelectItem>
                            <SelectItem value="pitta-kapha">Pitta-Kapha</SelectItem>
                            <SelectItem value="kapha-vata">Kapha-Vata</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="+91 XXXXX XXXXX"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="email@example.com"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="height">Height (cm)</Label>
                        <Input
                          id="height"
                          type="number"
                          placeholder="170"
                          value={formData.height}
                          onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="weight">Weight (kg)</Label>
                        <Input
                          id="weight"
                          type="number"
                          placeholder="65"
                          value={formData.weight}
                          onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="bmi">BMI</Label>
                        <Input
                          id="bmi"
                          disabled
                          placeholder="Auto-calculated"
                          value={
                            formData.height && formData.weight
                              ? (
                                  parseFloat(formData.weight) /
                                  Math.pow(parseFloat(formData.height) / 100, 2)
                                ).toFixed(1)
                              : ""
                          }
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dietary-habits">Dietary Habits</Label>
                      <Select value={formData.dietary_habits} onValueChange={(value) => setFormData({ ...formData, dietary_habits: value })}>
                        <SelectTrigger id="dietary-habits">
                          <SelectValue placeholder="Select dietary preference" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="vegetarian">Vegetarian</SelectItem>
                          <SelectItem value="non-vegetarian">Non-Vegetarian</SelectItem>
                          <SelectItem value="vegan">Vegan</SelectItem>
                          <SelectItem value="eggetarian">Eggetarian</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="meal-frequency">Meal Frequency (per day)</Label>
                        <Input
                          id="meal-frequency"
                          type="number"
                          placeholder="3"
                          value={formData.meal_frequency}
                          onChange={(e) => setFormData({ ...formData, meal_frequency: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="water-intake">Water Intake (liters/day)</Label>
                        <Input
                          id="water-intake"
                          type="number"
                          step="0.1"
                          placeholder="2.5"
                          value={formData.water_intake}
                          onChange={(e) => setFormData({ ...formData, water_intake: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="health-conditions">Health Conditions</Label>
                      <Textarea
                        id="health-conditions"
                        placeholder="Any existing health conditions..."
                        value={formData.health_conditions}
                        onChange={(e) => setFormData({ ...formData, health_conditions: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="allergies">Allergies</Label>
                      <Textarea
                        id="allergies"
                        placeholder="Any allergies or dietary restrictions..."
                        value={formData.allergies}
                        onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="notes">Additional Notes</Label>
                      <Textarea
                        id="notes"
                        placeholder="Any additional information..."
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddPatientOpen(false)} disabled={submitting}>
                      Cancel
                    </Button>
                    <Button
                      className="bg-gradient-to-r from-[var(--ayurveda-saffron)] to-[var(--ayurveda-terracotta)] text-white"
                      onClick={handleSubmit}
                      disabled={submitting}
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Adding...
                        </>
                      ) : (
                        "Add Patient"
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </header>

          <div className="p-6 space-y-6">
            {/* Search and Filter */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search patients by name, phone, or email..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Button variant="outline" size="icon">
                    <Filter className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Loading State */}
            {loading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            )}

            {/* Empty State */}
            {!loading && patients.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">No patients found. Add your first patient to get started.</p>
                </CardContent>
              </Card>
            )}

            {/* Patients Grid */}
            {!loading && filteredPatients.length > 0 && (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredPatients.map((patient) => (
                  <Card
                    key={patient.id}
                    className="hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => router.push(`/patients/${patient.id}`)}
                  >
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--ayurveda-sage)] to-[var(--ayurveda-forest)] flex items-center justify-center text-white font-semibold text-lg">
                            {patient.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </div>
                          <div>
                            <h3 className="font-semibold">{patient.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {patient.age} years • {patient.gender}
                            </p>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); router.push(`/patients/${patient.id}`) }}>
                              View Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem>Edit Details</DropdownMenuItem>
                            <DropdownMenuItem>Create Diet Chart</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">Delete Patient</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Dosha Type</span>
                          <Badge className={doshaColors[patient.dosha as keyof typeof doshaColors]}>
                            {patient.dosha}
                          </Badge>
                        </div>

                        {patient.phone && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Phone className="w-4 h-4" />
                            <span>{patient.phone}</span>
                          </div>
                        )}

                        {patient.email && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Mail className="w-4 h-4" />
                            <span>{patient.email}</span>
                          </div>
                        )}

                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          <span>Added: {new Date(patient.created_at).toLocaleDateString()}</span>
                        </div>

                        <div className="pt-2 border-t">
                          <Badge variant={patient.status === "Active" ? "default" : "secondary"}>
                            {patient.status}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </SidebarProvider>
  )
}