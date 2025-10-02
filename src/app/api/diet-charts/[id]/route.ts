import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { diet_charts, patients, meals, meal_foods } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    const dietChartId = parseInt(id);

    // Fetch diet chart with patient information
    const dietChartResult = await db
      .select({
        // Diet chart fields
        id: diet_charts.id,
        patient_id: diet_charts.patient_id,
        duration: diet_charts.duration,
        target_calories: diet_charts.target_calories,
        dietary_focus: diet_charts.dietary_focus,
        special_instructions: diet_charts.special_instructions,
        total_calories: diet_charts.total_calories,
        total_protein: diet_charts.total_protein,
        total_carbs: diet_charts.total_carbs,
        total_fat: diet_charts.total_fat,
        dosha_balance_score: diet_charts.dosha_balance_score,
        rasa_score: diet_charts.rasa_score,
        digestibility_score: diet_charts.digestibility_score,
        status: diet_charts.status,
        created_at: diet_charts.created_at,
        updated_at: diet_charts.updated_at,
        // Patient fields
        patient_name: patients.name,
        patient_age: patients.age,
        patient_gender: patients.gender,
        patient_dosha: patients.dosha,
        patient_phone: patients.phone,
        patient_email: patients.email,
        patient_height: patients.height,
        patient_weight: patients.weight,
        patient_bmi: patients.bmi,
        patient_dietary_habits: patients.dietary_habits,
        patient_meal_frequency: patients.meal_frequency,
        patient_water_intake: patients.water_intake,
        patient_health_conditions: patients.health_conditions,
        patient_allergies: patients.allergies,
        patient_notes: patients.notes,
        patient_status: patients.status,
        patient_created_at: patients.created_at,
        patient_updated_at: patients.updated_at
      })
      .from(diet_charts)
      .leftJoin(patients, eq(diet_charts.patient_id, patients.id))
      .where(eq(diet_charts.id, dietChartId))
      .limit(1);

    if (dietChartResult.length === 0) {
      return NextResponse.json({ 
        error: 'Diet chart not found',
        code: 'DIET_CHART_NOT_FOUND' 
      }, { status: 404 });
    }

    const dietChart = dietChartResult[0];

    // Fetch meals for this diet chart
    const mealsResult = await db
      .select()
      .from(meals)
      .where(eq(meals.diet_chart_id, dietChartId));

    // Fetch foods for all meals
    const mealsWithFoods = await Promise.all(
      mealsResult.map(async (meal) => {
        const foods = await db
          .select()
          .from(meal_foods)
          .where(eq(meal_foods.meal_id, meal.id));
        
        return {
          ...meal,
          foods
        };
      })
    );

    // Structure the response
    const response = {
      id: dietChart.id,
      patient_id: dietChart.patient_id,
      duration: dietChart.duration,
      target_calories: dietChart.target_calories,
      dietary_focus: dietChart.dietary_focus,
      special_instructions: dietChart.special_instructions,
      total_calories: dietChart.total_calories,
      total_protein: dietChart.total_protein,
      total_carbs: dietChart.total_carbs,
      total_fat: dietChart.total_fat,
      dosha_balance_score: dietChart.dosha_balance_score,
      rasa_score: dietChart.rasa_score,
      digestibility_score: dietChart.digestibility_score,
      status: dietChart.status,
      created_at: dietChart.created_at,
      updated_at: dietChart.updated_at,
      patient: dietChart.patient_name ? {
        id: dietChart.patient_id,
        name: dietChart.patient_name,
        age: dietChart.patient_age,
        gender: dietChart.patient_gender,
        dosha: dietChart.patient_dosha,
        phone: dietChart.patient_phone,
        email: dietChart.patient_email,
        height: dietChart.patient_height,
        weight: dietChart.patient_weight,
        bmi: dietChart.patient_bmi,
        dietary_habits: dietChart.patient_dietary_habits,
        meal_frequency: dietChart.patient_meal_frequency,
        water_intake: dietChart.patient_water_intake,
        health_conditions: dietChart.patient_health_conditions,
        allergies: dietChart.patient_allergies,
        notes: dietChart.patient_notes,
        status: dietChart.patient_status,
        created_at: dietChart.patient_created_at,
        updated_at: dietChart.patient_updated_at
      } : null,
      meals: mealsWithFoods
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    const dietChartId = parseInt(id);
    const requestBody = await request.json();

    // Check if the diet chart exists
    const existingRecord = await db
      .select()
      .from(diet_charts)
      .where(eq(diet_charts.id, dietChartId))
      .limit(1);

    if (existingRecord.length === 0) {
      return NextResponse.json({ 
        error: 'Diet chart not found',
        code: 'DIET_CHART_NOT_FOUND' 
      }, { status: 404 });
    }

    // Validate patient_id if provided
    if (requestBody.patient_id) {
      const patientExists = await db
        .select({ id: patients.id })
        .from(patients)
        .where(eq(patients.id, requestBody.patient_id))
        .limit(1);

      if (patientExists.length === 0) {
        return NextResponse.json({ 
          error: "Patient not found",
          code: "PATIENT_NOT_FOUND" 
        }, { status: 400 });
      }
    }

    // Validate score ranges (0-100)
    const scoreFields = ['dosha_balance_score', 'rasa_score', 'digestibility_score'];
    for (const field of scoreFields) {
      if (requestBody[field] !== undefined) {
        const score = parseInt(requestBody[field]);
        if (isNaN(score) || score < 0 || score > 100) {
          return NextResponse.json({ 
            error: `${field} must be between 0 and 100`,
            code: "INVALID_SCORE_RANGE" 
          }, { status: 400 });
        }
      }
    }

    // Prepare update data
    const updateData = {
      ...requestBody,
      updated_at: new Date().toISOString()
    };

    // Remove undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    const updatedRecord = await db
      .update(diet_charts)
      .set(updateData)
      .where(eq(diet_charts.id, dietChartId))
      .returning();

    if (updatedRecord.length === 0) {
      return NextResponse.json({ 
        error: 'Failed to update diet chart',
        code: 'UPDATE_FAILED' 
      }, { status: 500 });
    }

    return NextResponse.json(updatedRecord[0]);

  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    const dietChartId = parseInt(id);

    // Check if the diet chart exists
    const existingRecord = await db
      .select()
      .from(diet_charts)
      .where(eq(diet_charts.id, dietChartId))
      .limit(1);

    if (existingRecord.length === 0) {
      return NextResponse.json({ 
        error: 'Diet chart not found',
        code: 'DIET_CHART_NOT_FOUND' 
      }, { status: 404 });
    }

    // Get all meals for this diet chart to delete their foods
    const mealsToDelete = await db
      .select({ id: meals.id })
      .from(meals)
      .where(eq(meals.diet_chart_id, dietChartId));

    // Delete meal foods for each meal
    for (const meal of mealsToDelete) {
      await db
        .delete(meal_foods)
        .where(eq(meal_foods.meal_id, meal.id));
    }

    // Delete meals
    await db
      .delete(meals)
      .where(eq(meals.diet_chart_id, dietChartId));

    // Delete the diet chart
    const deletedRecord = await db
      .delete(diet_charts)
      .where(eq(diet_charts.id, dietChartId))
      .returning();

    return NextResponse.json({
      message: 'Diet chart deleted successfully',
      deleted_record: deletedRecord[0]
    });

  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}