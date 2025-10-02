import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { diet_charts, patients, meals } from '@/db/schema';
import { eq, and, desc, asc, count } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: { patientId: string } }
) {
  try {
    const { patientId } = params;
    const { searchParams } = new URL(request.url);
    
    // Validate patientId
    if (!patientId || isNaN(parseInt(patientId))) {
      return NextResponse.json({
        error: "Valid patient ID is required",
        code: "INVALID_PATIENT_ID"
      }, { status: 400 });
    }

    const parsedPatientId = parseInt(patientId);

    // Verify patient exists
    const patient = await db.select()
      .from(patients)
      .where(eq(patients.id, parsedPatientId))
      .limit(1);

    if (patient.length === 0) {
      return NextResponse.json({
        error: "Patient not found",
        code: "PATIENT_NOT_FOUND"
      }, { status: 404 });
    }

    // Extract query parameters
    const statusFilter = searchParams.get('status');
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50);
    const offset = parseInt(searchParams.get('offset') || '0');
    const sortOrder = searchParams.get('order') === 'asc' ? asc : desc;

    // Build base query
    let whereConditions = [eq(diet_charts.patient_id, parsedPatientId)];

    // Add status filter if provided
    if (statusFilter && ['Active', 'Completed', 'Archived'].includes(statusFilter)) {
      whereConditions.push(eq(diet_charts.status, statusFilter));
    }

    // Get total count for pagination
    const totalCountResult = await db.select({ count: count() })
      .from(diet_charts)
      .where(and(...whereConditions));

    const totalCount = totalCountResult[0]?.count || 0;

    // Fetch diet charts with patient information
    const dietCharts = await db.select({
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
      patient_name: patients.name,
      patient_age: patients.age,
      patient_gender: patients.gender,
      patient_dosha: patients.dosha,
      patient_status: patients.status
    })
      .from(diet_charts)
      .leftJoin(patients, eq(diet_charts.patient_id, patients.id))
      .where(and(...whereConditions))
      .orderBy(sortOrder(diet_charts.created_at))
      .limit(limit)
      .offset(offset);

    // Get meal summary for each diet chart
    const dietChartIds = dietCharts.map(dc => dc.id);
    
    let mealSummaries: any[] = [];
    if (dietChartIds.length > 0) {
      mealSummaries = await db.select({
        diet_chart_id: meals.diet_chart_id,
        meal_count: count(),
        meal_types: meals.meal_type
      })
        .from(meals)
        .where(eq(meals.diet_chart_id, dietChartIds[0]))
        .groupBy(meals.diet_chart_id, meals.meal_type);

      // For multiple diet charts, we need to query each separately due to SQL limitations
      if (dietChartIds.length > 1) {
        for (let i = 1; i < dietChartIds.length; i++) {
          const additionalSummary = await db.select({
            diet_chart_id: meals.diet_chart_id,
            meal_count: count(),
            meal_types: meals.meal_type
          })
            .from(meals)
            .where(eq(meals.diet_chart_id, dietChartIds[i]))
            .groupBy(meals.diet_chart_id, meals.meal_type);
          
          mealSummaries = [...mealSummaries, ...additionalSummary];
        }
      }
    }

    // Process meal summaries by diet chart
    const mealSummaryMap: { [key: number]: { total_meals: number, meal_types: string[] } } = {};
    
    mealSummaries.forEach(summary => {
      const dietChartId = summary.diet_chart_id;
      if (!mealSummaryMap[dietChartId]) {
        mealSummaryMap[dietChartId] = {
          total_meals: 0,
          meal_types: []
        };
      }
      mealSummaryMap[dietChartId].total_meals += summary.meal_count;
      if (summary.meal_types && !mealSummaryMap[dietChartId].meal_types.includes(summary.meal_types)) {
        mealSummaryMap[dietChartId].meal_types.push(summary.meal_types);
      }
    });

    // Combine diet charts with meal summaries
    const enrichedDietCharts = dietCharts.map(dietChart => ({
      ...dietChart,
      patient: {
        id: dietChart.patient_id,
        name: dietChart.patient_name,
        age: dietChart.patient_age,
        gender: dietChart.patient_gender,
        dosha: dietChart.patient_dosha,
        status: dietChart.patient_status
      },
      meal_summary: mealSummaryMap[dietChart.id] || {
        total_meals: 0,
        meal_types: []
      }
    }));

    // Remove redundant patient fields from main object
    const finalDietCharts = enrichedDietCharts.map(({
      patient_name,
      patient_age,
      patient_gender,
      patient_dosha,
      patient_status,
      ...dietChart
    }) => dietChart);

    return NextResponse.json({
      diet_charts: finalDietCharts,
      pagination: {
        total: totalCount,
        limit,
        offset,
        has_more: offset + limit < totalCount
      }
    });

  } catch (error) {
    console.error('GET diet charts error:', error);
    return NextResponse.json({
      error: 'Internal server error: ' + error
    }, { status: 500 });
  }
}