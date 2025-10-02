import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { patients, diet_charts, compliance_records } from '@/db/schema';
import { eq, like, and, or, desc, asc, count, avg, sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'month';

    // Calculate date ranges based on period
    const now = new Date();
    let startDate: Date;
    
    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'quarter':
        startDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
        break;
      case 'year':
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        break;
      default: // month
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
    }

    const startDateStr = startDate.toISOString();
    const thisWeekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

    // 1. Patient Statistics
    const totalPatientsResult = await db.select({ count: count() }).from(patients);
    const total_patients = totalPatientsResult[0]?.count || 0;

    const activePatientsResult = await db.select({ count: count() })
      .from(patients)
      .where(eq(patients.status, 'Active'));
    const active_patients = activePatientsResult[0]?.count || 0;

    const patientsByDoshaResult = await db.select({
      dosha: patients.dosha,
      count: count()
    }).from(patients)
      .groupBy(patients.dosha);
    
    const patients_by_dosha = patientsByDoshaResult.reduce((acc, item) => {
      acc[item.dosha] = item.count;
      return acc;
    }, {} as Record<string, number>);

    const newPatientsResult = await db.select({ count: count() })
      .from(patients)
      .where(sql`${patients.created_at} >= ${startDateStr}`);
    const new_patients_this_month = newPatientsResult[0]?.count || 0;

    // 2. Diet Chart Statistics
    const totalDietChartsResult = await db.select({ count: count() }).from(diet_charts);
    const total_diet_charts = totalDietChartsResult[0]?.count || 0;

    const activeDietChartsResult = await db.select({ count: count() })
      .from(diet_charts)
      .where(eq(diet_charts.status, 'Active'));
    const active_diet_charts = activeDietChartsResult[0]?.count || 0;

    const chartsByFocusResult = await db.select({
      dietary_focus: diet_charts.dietary_focus,
      count: count()
    }).from(diet_charts)
      .where(sql`${diet_charts.dietary_focus} IS NOT NULL`)
      .groupBy(diet_charts.dietary_focus);
    
    const charts_by_focus = chartsByFocusResult.reduce((acc, item) => {
      if (item.dietary_focus) {
        acc[item.dietary_focus] = item.count;
      }
      return acc;
    }, {} as Record<string, number>);

    const avgDurationResult = await db.select({
      avg_duration: avg(diet_charts.duration)
    }).from(diet_charts)
      .where(sql`${diet_charts.duration} IS NOT NULL`);
    const average_duration = avgDurationResult[0]?.avg_duration || 0;

    // 3. Compliance Statistics
    const overallComplianceResult = await db.select({
      avg_compliance: avg(compliance_records.compliance_percentage)
    }).from(compliance_records);
    const overall_compliance_rate = overallComplianceResult[0]?.avg_compliance || 0;

    const weeklyComplianceResult = await db.select({
      avg_compliance: avg(compliance_records.compliance_percentage)
    }).from(compliance_records)
      .where(sql`${compliance_records.created_at} >= ${thisWeekStart}`);
    const compliance_this_week = weeklyComplianceResult[0]?.avg_compliance || 0;

    const goodComplianceResult = await db.select({
      patient_id: compliance_records.patient_id,
      avg_compliance: avg(compliance_records.compliance_percentage)
    }).from(compliance_records)
      .groupBy(compliance_records.patient_id)
      .having(sql`avg(${compliance_records.compliance_percentage}) > 80`);
    const patients_with_good_compliance = goodComplianceResult.length;

    // Calculate compliance trend (this week vs last week)
    const lastWeekStart = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString();
    const lastWeekComplianceResult = await db.select({
      avg_compliance: avg(compliance_records.compliance_percentage)
    }).from(compliance_records)
      .where(and(
        sql`${compliance_records.created_at} >= ${lastWeekStart}`,
        sql`${compliance_records.created_at} < ${thisWeekStart}`
      ));
    const last_week_compliance = lastWeekComplianceResult[0]?.avg_compliance || 0;
    const compliance_trend = compliance_this_week - last_week_compliance;

    // 4. Recent Activity
    const recent_patients = await db.select({
      id: patients.id,
      name: patients.name,
      dosha: patients.dosha,
      status: patients.status,
      created_at: patients.created_at
    }).from(patients)
      .orderBy(desc(patients.created_at))
      .limit(5);

    const recent_diet_charts = await db.select({
      id: diet_charts.id,
      patient_id: diet_charts.patient_id,
      dietary_focus: diet_charts.dietary_focus,
      status: diet_charts.status,
      created_at: diet_charts.created_at
    }).from(diet_charts)
      .orderBy(desc(diet_charts.created_at))
      .limit(5);

    const recent_compliance = await db.select({
      id: compliance_records.id,
      patient_id: compliance_records.patient_id,
      compliance_percentage: compliance_records.compliance_percentage,
      date: compliance_records.date,
      created_at: compliance_records.created_at
    }).from(compliance_records)
      .orderBy(desc(compliance_records.created_at))
      .limit(10);

    // 5. Health Insights
    const healthConditionsResult = await db.select({
      health_conditions: patients.health_conditions
    }).from(patients)
      .where(sql`${patients.health_conditions} IS NOT NULL AND ${patients.health_conditions} != ''`);

    const common_health_conditions: Record<string, number> = {};
    healthConditionsResult.forEach(record => {
      if (record.health_conditions) {
        const conditions = record.health_conditions.split(',').map(c => c.trim());
        conditions.forEach(condition => {
          if (condition) {
            common_health_conditions[condition] = (common_health_conditions[condition] || 0) + 1;
          }
        });
      }
    });

    const dietaryHabitsResult = await db.select({
      dietary_habits: patients.dietary_habits,
      count: count()
    }).from(patients)
      .where(sql`${patients.dietary_habits} IS NOT NULL`)
      .groupBy(patients.dietary_habits);
    
    const dietary_habits_distribution = dietaryHabitsResult.reduce((acc, item) => {
      if (item.dietary_habits) {
        acc[item.dietary_habits] = item.count;
      }
      return acc;
    }, {} as Record<string, number>);

    const bmiBydoshaResult = await db.select({
      dosha: patients.dosha,
      avg_bmi: avg(patients.bmi)
    }).from(patients)
      .where(sql`${patients.bmi} IS NOT NULL`)
      .groupBy(patients.dosha);
    
    const average_bmi_by_dosha = bmiBydoshaResult.reduce((acc, item) => {
      acc[item.dosha] = item.avg_bmi || 0;
      return acc;
    }, {} as Record<string, number>);

    const dashboardData = {
      patient_statistics: {
        total_patients,
        active_patients,
        patients_by_dosha,
        new_patients_this_month
      },
      diet_chart_statistics: {
        total_diet_charts,
        active_diet_charts,
        charts_by_focus,
        average_duration: Math.round(average_duration * 100) / 100
      },
      compliance_statistics: {
        overall_compliance_rate: Math.round(overall_compliance_rate * 100) / 100,
        compliance_this_week: Math.round(compliance_this_week * 100) / 100,
        patients_with_good_compliance,
        compliance_trend: Math.round(compliance_trend * 100) / 100
      },
      recent_activity: {
        recent_patients,
        recent_diet_charts,
        recent_compliance
      },
      health_insights: {
        common_health_conditions,
        dietary_habits_distribution,
        average_bmi_by_dosha
      },
      period,
      generated_at: new Date().toISOString()
    };

    return NextResponse.json(dashboardData, { status: 200 });

  } catch (error) {
    console.error('GET dashboard error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}