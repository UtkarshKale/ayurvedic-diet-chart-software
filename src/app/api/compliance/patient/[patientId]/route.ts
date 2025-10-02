import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { patients, compliance_records, diet_charts } from '@/db/schema';
import { eq, and, gte, lte, desc, asc } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: { patientId: string } }
) {
  try {
    const { patientId } = params;
    const { searchParams } = new URL(request.url);

    // Validate patientId
    const patientIdInt = parseInt(patientId);
    if (!patientId || isNaN(patientIdInt)) {
      return NextResponse.json({ 
        error: "Valid patient ID is required",
        code: "INVALID_PATIENT_ID" 
      }, { status: 400 });
    }

    // Check if patient exists
    const patient = await db.select()
      .from(patients)
      .where(eq(patients.id, patientIdInt))
      .limit(1);

    if (patient.length === 0) {
      return NextResponse.json({ 
        error: "Patient not found",
        code: "PATIENT_NOT_FOUND" 
      }, { status: 404 });
    }

    // Parse query parameters
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const limit = Math.min(parseInt(searchParams.get('limit') || '30'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    const order = searchParams.get('order') || 'desc';

    // Validate date formats
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

    // Validate order parameter
    if (order !== 'desc' && order !== 'asc') {
      return NextResponse.json({ 
        error: "Invalid order parameter. Use 'desc' or 'asc'",
        code: "INVALID_ORDER" 
      }, { status: 400 });
    }

    // Build query conditions
    let whereConditions = [eq(compliance_records.patient_id, patientIdInt)];

    if (startDate) {
      whereConditions.push(gte(compliance_records.date, startDate));
    }

    if (endDate) {
      whereConditions.push(lte(compliance_records.date, endDate));
    }

    // Fetch compliance records with diet chart data
    const complianceQuery = db
      .select({
        id: compliance_records.id,
        patient_id: compliance_records.patient_id,
        diet_chart_id: compliance_records.diet_chart_id,
        date: compliance_records.date,
        compliance_percentage: compliance_records.compliance_percentage,
        meals_followed: compliance_records.meals_followed,
        meals_total: compliance_records.meals_total,
        notes: compliance_records.notes,
        created_at: compliance_records.created_at,
        diet_chart: {
          id: diet_charts.id,
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
          updated_at: diet_charts.updated_at
        }
      })
      .from(compliance_records)
      .leftJoin(diet_charts, eq(compliance_records.diet_chart_id, diet_charts.id))
      .where(and(...whereConditions))
      .orderBy(order === 'desc' ? desc(compliance_records.date) : asc(compliance_records.date))
      .limit(limit)
      .offset(offset);

    const complianceRecords = await complianceQuery;

    // Get total count for pagination
    const totalCountQuery = db
      .select({ count: compliance_records.id })
      .from(compliance_records)
      .where(and(...whereConditions));

    const totalCount = await totalCountQuery;

    // Calculate compliance statistics
    const allRecordsForStats = await db
      .select({
        compliance_percentage: compliance_records.compliance_percentage,
        date: compliance_records.date
      })
      .from(compliance_records)
      .where(and(...whereConditions))
      .orderBy(asc(compliance_records.date));

    let statistics = {
      total_records: totalCount.length,
      average_compliance: 0,
      trend: 'stable' as 'improving' | 'declining' | 'stable'
    };

    if (allRecordsForStats.length > 0) {
      // Calculate average compliance
      const totalCompliance = allRecordsForStats.reduce((sum, record) => 
        sum + (record.compliance_percentage || 0), 0
      );
      statistics.average_compliance = Math.round(totalCompliance / allRecordsForStats.length);

      // Calculate trend (compare first half vs second half)
      if (allRecordsForStats.length >= 4) {
        const midPoint = Math.floor(allRecordsForStats.length / 2);
        const firstHalf = allRecordsForStats.slice(0, midPoint);
        const secondHalf = allRecordsForStats.slice(midPoint);

        const firstHalfAvg = firstHalf.reduce((sum, record) => 
          sum + (record.compliance_percentage || 0), 0
        ) / firstHalf.length;

        const secondHalfAvg = secondHalf.reduce((sum, record) => 
          sum + (record.compliance_percentage || 0), 0
        ) / secondHalf.length;

        const difference = secondHalfAvg - firstHalfAvg;
        if (difference > 5) {
          statistics.trend = 'improving';
        } else if (difference < -5) {
          statistics.trend = 'declining';
        }
      }
    }

    return NextResponse.json({
      data: complianceRecords,
      pagination: {
        total: totalCount.length,
        limit,
        offset,
        has_more: totalCount.length > offset + limit
      },
      statistics
    });

  } catch (error) {
    console.error('GET compliance records error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}