import { sqliteTable, integer, text, real } from 'drizzle-orm/sqlite-core';

// Patients table
export const patients = sqliteTable('patients', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  age: integer('age').notNull(),
  gender: text('gender').notNull(),
  dosha: text('dosha').notNull(),
  phone: text('phone'),
  email: text('email'),
  height: real('height'),
  weight: real('weight'),
  bmi: real('bmi'),
  dietary_habits: text('dietary_habits'),
  meal_frequency: integer('meal_frequency'),
  water_intake: real('water_intake'),
  health_conditions: text('health_conditions'),
  allergies: text('allergies'),
  notes: text('notes'),
  status: text('status').notNull().default('Active'),
  created_at: text('created_at').notNull(),
  updated_at: text('updated_at').notNull(),
});

// Diet Charts table
export const diet_charts = sqliteTable('diet_charts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  patient_id: integer('patient_id').references(() => patients.id),
  duration: integer('duration'),
  target_calories: integer('target_calories'),
  dietary_focus: text('dietary_focus'),
  special_instructions: text('special_instructions'),
  total_calories: real('total_calories'),
  total_protein: real('total_protein'),
  total_carbs: real('total_carbs'),
  total_fat: real('total_fat'),
  dosha_balance_score: integer('dosha_balance_score'),
  rasa_score: integer('rasa_score'),
  digestibility_score: integer('digestibility_score'),
  status: text('status').notNull().default('Active'),
  created_at: text('created_at').notNull(),
  updated_at: text('updated_at').notNull(),
});

// Meals table
export const meals = sqliteTable('meals', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  diet_chart_id: integer('diet_chart_id').references(() => diet_charts.id),
  meal_type: text('meal_type'),
  meal_time: text('meal_time'),
  total_calories: real('total_calories'),
  total_protein: real('total_protein'),
  total_carbs: real('total_carbs'),
  total_fat: real('total_fat'),
  created_at: text('created_at').notNull(),
});

// Meal Foods table
export const meal_foods = sqliteTable('meal_foods', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  meal_id: integer('meal_id').references(() => meals.id),
  food_name: text('food_name'),
  quantity: real('quantity'),
  unit: text('unit'),
  calories: real('calories'),
  protein: real('protein'),
  carbs: real('carbs'),
  fat: real('fat'),
  thermal_property: text('thermal_property'),
  digestibility: text('digestibility'),
  rasa: text('rasa'),
  dosha_effect: text('dosha_effect'),
  created_at: text('created_at').notNull(),
});

// Compliance Records table
export const compliance_records = sqliteTable('compliance_records', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  patient_id: integer('patient_id').references(() => patients.id),
  diet_chart_id: integer('diet_chart_id').references(() => diet_charts.id),
  date: text('date'),
  compliance_percentage: integer('compliance_percentage'),
  meals_followed: integer('meals_followed'),
  meals_total: integer('meals_total'),
  notes: text('notes'),
  created_at: text('created_at').notNull(),
});

// Profile Settings table
export const profile_settings = sqliteTable('profile_settings', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  first_name: text('first_name'),
  last_name: text('last_name'),
  email: text('email'),
  phone: text('phone'),
  specialization: text('specialization'),
  clinic_name: text('clinic_name'),
  updated_at: text('updated_at').notNull(),
});