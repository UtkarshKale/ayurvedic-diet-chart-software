import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { patients, diet_charts, meals, meal_foods, compliance_records } from '@/db/schema';
import { eq, and, gte, lte, desc, asc, sql } from 'drizzle-orm';

export async function GET(
  request: NextRequest, 
  { params }: { params: { patientId: string } }
) {
  try {
    const { patientId } = params;
    const searchParams = request.nextUrl.searchParams;
    
    // Validate patient ID
    const id = parseInt(patientId);
    if (!patientId || isNaN(id)) {
      return NextResponse.json({ 
        error: "Valid patient ID is required",
        code: "INVALID_PATIENT_ID" 
      }, { status: 400 });
    }

    // Get query parameters
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const includeMeals = searchParams.get('include_meals') === 'true';

    // Validate date formats if provided
    if (startDate && !/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
      return NextResponse.json({ 
        error: "Invalid start_date format. Use YYYY-MM-DD",
        code: "INVALID_DATE_FORMAT" 
      }, { status: 400 });
    }

    if (endDate && !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
      return NextResponse.json({ 
        error: "Invalid end_date format. Use YYYY-MM-DD",
        code: "INVALID_DATE_FORMAT" 
      }, { status: 400 });
    }

    // Get patient information
    const patient = await db.select()
      .from(patients)
      .where(eq(patients.id, id))
      .limit(1);

    if (patient.length === 0) {
      return NextResponse.json({ 
        error: 'Patient not found',
        code: "PATIENT_NOT_FOUND" 
      }, { status: 404 });
    }

    const patientData = patient[0];

    // Build date filter for compliance and diet charts
    let dateFilter = eq(diet_charts.patient_id, id);
    let complianceDateFilter = eq(compliance_records.patient_id, id);

    if (startDate && endDate) {
      dateFilter = and(
        eq(diet_charts.patient_id, id),
        gte(diet_charts.created_at, startDate),
        lte(diet_charts.created_at, endDate)
      );
      complianceDateFilter = and(
        eq(compliance_records.patient_id, id),
        gte(compliance_records.date, startDate),
        lte(compliance_records.date, endDate)
      );
    } else if (startDate) {
      dateFilter = and(
        eq(diet_charts.patient_id, id),
        gte(diet_charts.created_at, startDate)
      );
      complianceDateFilter = and(
        eq(compliance_records.patient_id, id),
        gte(compliance_records.date, startDate)
      );
    } else if (endDate) {
      dateFilter = and(
        eq(diet_charts.patient_id, id),
        lte(diet_charts.created_at, endDate)
      );
      complianceDateFilter = and(
        eq(compliance_records.patient_id, id),
        lte(compliance_records.date, endDate)
      );
    }

    // Get diet charts for the patient
    const dietCharts = await db.select()
      .from(diet_charts)
      .where(dateFilter)
      .orderBy(desc(diet_charts.created_at));

    // Get compliance records
    const complianceRecords = await db.select()
      .from(compliance_records)
      .where(complianceDateFilter)
      .orderBy(desc(compliance_records.date));

    // Calculate BMI and category if height and weight available
    let bmiData = null;
    if (patientData.height && patientData.weight) {
      const heightInMeters = patientData.height / 100;
      const bmi = patientData.weight / (heightInMeters * heightInMeters);
      let category = '';
      
      if (bmi < 18.5) category = 'Underweight';
      else if (bmi < 25) category = 'Normal';
      else if (bmi < 30) category = 'Overweight';
      else category = 'Obese';

      bmiData = {
        value: Math.round(bmi * 100) / 100,
        category,
        height: patientData.height,
        weight: patientData.weight
      };
    }

    // Analyze compliance statistics
    let complianceAnalysis = null;
    if (complianceRecords.length > 0) {
      const totalCompliance = complianceRecords.reduce((sum, record) => sum + (record.compliance_percentage || 0), 0);
      const avgCompliance = totalCompliance / complianceRecords.length;
      
      const sortedByCompliance = [...complianceRecords].sort((a, b) => (b.compliance_percentage || 0) - (a.compliance_percentage || 0));
      const bestPeriod = sortedByCompliance[0];
      const worstPeriod = sortedByCompliance[sortedByCompliance.length - 1];

      // Calculate trends (last 7 days vs previous 7 days if enough data)
      let trend = 'stable';
      if (complianceRecords.length >= 7) {
        const recent7 = complianceRecords.slice(0, 7);
        const previous7 = complianceRecords.slice(7, 14);
        
        if (previous7.length > 0) {
          const recentAvg = recent7.reduce((sum, r) => sum + (r.compliance_percentage || 0), 0) / recent7.length;
          const previousAvg = previous7.reduce((sum, r) => sum + (r.compliance_percentage || 0), 0) / previous7.length;
          
          if (recentAvg > previousAvg + 5) trend = 'improving';
          else if (recentAvg < previousAvg - 5) trend = 'declining';
        }
      }

      complianceAnalysis = {
        overall_compliance: Math.round(avgCompliance * 100) / 100,
        total_records: complianceRecords.length,
        best_period: {
          date: bestPeriod.date,
          compliance: bestPeriod.compliance_percentage
        },
        worst_period: {
          date: worstPeriod.date,
          compliance: worstPeriod.compliance_percentage
        },
        trend,
        compliance_history: complianceRecords.map(record => ({
          date: record.date,
          compliance: record.compliance_percentage,
          meals_followed: record.meals_followed,
          meals_total: record.meals_total
        }))
      };
    }

    // Get meals data if requested and diet charts exist
    let mealAnalysis = null;
    if (includeMeals && dietCharts.length > 0) {
      const dietChartIds = dietCharts.map(chart => chart.id);
      
      // Get all meals for these diet charts
      const allMeals = await db.select({
        id: meals.id,
        diet_chart_id: meals.diet_chart_id,
        meal_type: meals.meal_type,
        meal_time: meals.meal_time,
        total_calories: meals.total_calories,
        total_protein: meals.total_protein,
        total_carbs: meals.total_carbs,
        total_fat: meals.total_fat
      })
      .from(meals)
      .where(sql`${meals.diet_chart_id} IN ${dietChartIds}`);

      // Get meal foods for detailed analysis
      const mealIds = allMeals.map(meal => meal.id);
      let mealFoods = [];
      
      if (mealIds.length > 0) {
        mealFoods = await db.select()
          .from(meal_foods)
          .where(sql`${meal_foods.meal_id} IN ${mealIds}`);
      }

      // Analyze meal patterns
      const mealTypeCount = allMeals.reduce((acc, meal) => {
        const type = meal.meal_type || 'unknown';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const totalCalories = allMeals.reduce((sum, meal) => sum + (meal.total_calories || 0), 0);
      const avgCaloriesPerMeal = allMeals.length > 0 ? totalCalories / allMeals.length : 0;

      // Analyze nutritional patterns from meal foods
      const nutritionalPatterns = mealFoods.reduce((acc, food) => {
        acc.total_protein += food.protein || 0;
        acc.total_carbs += food.carbs || 0;
        acc.total_fat += food.fat || 0;
        acc.total_calories += food.calories || 0;
        
        if (food.thermal_property) {
          acc.thermal_properties[food.thermal_property] = (acc.thermal_properties[food.thermal_property] || 0) + 1;
        }
        
        if (food.rasa) {
          acc.rasa_distribution[food.rasa] = (acc.rasa_distribution[food.rasa] || 0) + 1;
        }
        
        return acc;
      }, {
        total_protein: 0,
        total_carbs: 0,
        total_fat: 0,
        total_calories: 0,
        thermal_properties: {} as Record<string, number>,
        rasa_distribution: {} as Record<string, number>
      });

      mealAnalysis = {
        total_meals: allMeals.length,
        meal_type_distribution: mealTypeCount,
        average_calories_per_meal: Math.round(avgCaloriesPerMeal * 100) / 100,
        nutritional_patterns: {
          total_protein: Math.round(nutritionalPatterns.total_protein * 100) / 100,
          total_carbs: Math.round(nutritionalPatterns.total_carbs * 100) / 100,
          total_fat: Math.round(nutritionalPatterns.total_fat * 100) / 100,
          total_calories: Math.round(nutritionalPatterns.total_calories * 100) / 100,
          thermal_properties: nutritionalPatterns.thermal_properties,
          rasa_distribution: nutritionalPatterns.rasa_distribution
        }
      };
    }

    // Generate recommendations based on data
    const recommendations = [];

    if (complianceAnalysis) {
      if (complianceAnalysis.overall_compliance < 70) {
        recommendations.push({
          category: 'compliance',
          priority: 'high',
          message: 'Consider simplifying the diet plan to improve adherence',
          suggestion: 'Focus on 2-3 key meals per day initially'
        });
      }
      
      if (complianceAnalysis.trend === 'declining') {
        recommendations.push({
          category: 'compliance',
          priority: 'medium',
          message: 'Compliance is declining - schedule a consultation',
          suggestion: 'Review current challenges and adjust plan accordingly'
        });
      }
    }

    // Dosha-specific recommendations
    const doshaRecommendations = {
      'Vata': 'Focus on warm, cooked foods and regular meal times',
      'Pitta': 'Emphasize cooling foods and avoid excessive spicy meals',
      'Kapha': 'Include more stimulating spices and lighter meals'
    };

    if (patientData.dosha && doshaRecommendations[patientData.dosha as keyof typeof doshaRecommendations]) {
      recommendations.push({
        category: 'dosha',
        priority: 'medium',
        message: `${patientData.dosha} balancing`,
        suggestion: doshaRecommendations[patientData.dosha as keyof typeof doshaRecommendations]
      });
    }

    // Diet chart progression analysis
    const dietChartProgression = dietCharts.map(chart => ({
      id: chart.id,
      created_at: chart.created_at,
      duration: chart.duration,
      target_calories: chart.target_calories,
      dietary_focus: chart.dietary_focus,
      dosha_balance_score: chart.dosha_balance_score,
      rasa_score: chart.rasa_score,
      digestibility_score: chart.digestibility_score,
      status: chart.status
    }));

    // Build comprehensive report
    const report = {
      patient_overview: {
        id: patientData.id,
        name: patientData.name,
        age: patientData.age,
        gender: patientData.gender,
        dosha: patientData.dosha,
        phone: patientData.phone,
        email: patientData.email,
        bmi_analysis: bmiData,
        dietary_habits: patientData.dietary_habits,
        meal_frequency: patientData.meal_frequency,
        water_intake: patientData.water_intake,
        health_conditions: patientData.health_conditions,
        allergies: patientData.allergies,
        status: patientData.status,
        health_assessment: {
          total_diet_charts: dietCharts.length,
          compliance_records: complianceRecords.length,
          average_compliance: complianceAnalysis?.overall_compliance || null
        }
      },
      diet_chart_history: {
        total_charts: dietCharts.length,
        progression: dietChartProgression,
        effectiveness_analysis: {
          average_dosha_score: dietCharts.length > 0 
            ? Math.round((dietCharts.reduce((sum, chart) => sum + (chart.dosha_balance_score || 0), 0) / dietCharts.length) * 100) / 100 
            : null,
          average_rasa_score: dietCharts.length > 0 
            ? Math.round((dietCharts.reduce((sum, chart) => sum + (chart.rasa_score || 0), 0) / dietCharts.length) * 100) / 100 
            : null,
          average_digestibility_score: dietCharts.length > 0 
            ? Math.round((dietCharts.reduce((sum, chart) => sum + (chart.digestibility_score || 0), 0) / dietCharts.length) * 100) / 100 
            : null
        }
      },
      compliance_analysis: complianceAnalysis,
      meal_pattern_analysis: mealAnalysis,
      recommendations: {
        total: recommendations.length,
        high_priority: recommendations.filter(r => r.priority === 'high').length,
        suggestions: recommendations
      },
      report_metadata: {
        generated_at: new Date().toISOString(),
        period: {
          start_date: startDate || 'All time',
          end_date: endDate || 'All time'
        },
        includes_meals: includeMeals
      }
    };

    return NextResponse.json(report);

  } catch (error) {
    console.error('GET patient report error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}