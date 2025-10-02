import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { compliance_records, diet_charts, patients } from '@/db/schema';
import { eq, and, gte, lte, desc } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: { chartId: string } }
) {
  try {
    const { chartId } = params;
    const { searchParams } = new URL(request.url);
    
    // Validate chartId
    if (!chartId || isNaN(parseInt(chartId))) {
      return NextResponse.json({
        error: "Valid chart ID is required",
        code: "INVALID_CHART_ID"
      }, { status: 400 });
    }

    const chartIdInt = parseInt(chartId);
    
    // Verify diet chart exists
    const dietChart = await db.select()
      .from(diet_charts)
      .where(eq(diet_charts.id, chartIdInt))
      .limit(1);

    if (dietChart.length === 0) {
      return NextResponse.json({
        error: "Diet chart not found",
        code: "CHART_NOT_FOUND"
      }, { status: 404 });
    }

    // Extract query parameters
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const limit = Math.min(parseInt(searchParams.get('limit') || '30'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    // Validate date formats if provided
    if (startDate && !isValidDate(startDate)) {
      return NextResponse.json({
        error: "Invalid start_date format. Use YYYY-MM-DD",
        code: "INVALID_START_DATE"
      }, { status: 400 });
    }

    if (endDate && !isValidDate(endDate)) {
      return NextResponse.json({
        error: "Invalid end_date format. Use YYYY-MM-DD",
        code: "INVALID_END_DATE"
      }, { status: 400 });
    }

    // Build where conditions
    let whereConditions = [eq(compliance_records.diet_chart_id, chartIdInt)];

    if (startDate) {
      whereConditions.push(gte(compliance_records.date, startDate));
    }

    if (endDate) {
      whereConditions.push(lte(compliance_records.date, endDate));
    }

    // Fetch compliance records with patient information
    const complianceRecords = await db.select({
      id: compliance_records.id,
      patient_id: compliance_records.patient_id,
      diet_chart_id: compliance_records.diet_chart_id,
      date: compliance_records.date,
      compliance_percentage: compliance_records.compliance_percentage,
      meals_followed: compliance_records.meals_followed,
      meals_total: compliance_records.meals_total,
      notes: compliance_records.notes,
      created_at: compliance_records.created_at,
      patient_name: patients.name,
      patient_age: patients.age,
      patient_gender: patients.gender,
      patient_dosha: patients.dosha,
      patient_phone: patients.phone,
      patient_email: patients.email
    })
      .from(compliance_records)
      .innerJoin(patients, eq(compliance_records.patient_id, patients.id))
      .where(and(...whereConditions))
      .orderBy(desc(compliance_records.date))
      .limit(limit)
      .offset(offset);

    // Fetch all compliance records for statistics (without pagination)
    const allComplianceRecords = await db.select({
      compliance_percentage: compliance_records.compliance_percentage,
      date: compliance_records.date
    })
      .from(compliance_records)
      .where(and(...whereConditions))
      .orderBy(desc(compliance_records.date));

    // Calculate compliance statistics
    const statistics = calculateComplianceStatistics(allComplianceRecords);

    return NextResponse.json({
      records: complianceRecords,
      statistics,
      pagination: {
        limit,
        offset,
        total: allComplianceRecords.length
      }
    });

  } catch (error) {
    console.error('GET compliance records error:', error);
    return NextResponse.json({
      error: 'Internal server error: ' + error
    }, { status: 500 });
  }
}

function isValidDate(dateString: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) {
    return false;
  }
  
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime()) && 
         date.toISOString().split('T')[0] === dateString;
}

function calculateComplianceStatistics(records: { compliance_percentage: number | null, date: string | null }[]) {
  if (records.length === 0) {
    return {
      average_compliance: 0,
      total_records: 0,
      compliance_trend: 'stable',
      best_day: null,
      worst_day: null
    };
  }

  const validRecords = records.filter(r => r.compliance_percentage !== null);
  
  if (validRecords.length === 0) {
    return {
      average_compliance: 0,
      total_records: records.length,
      compliance_trend: 'stable',
      best_day: null,
      worst_day: null
    };
  }

  // Calculate average compliance
  const totalCompliance = validRecords.reduce((sum, record) => sum + (record.compliance_percentage || 0), 0);
  const averageCompliance = Math.round(totalCompliance / validRecords.length);

  // Find best and worst days
  let bestDay = validRecords[0];
  let worstDay = validRecords[0];

  validRecords.forEach(record => {
    if ((record.compliance_percentage || 0) > (bestDay.compliance_percentage || 0)) {
      bestDay = record;
    }
    if ((record.compliance_percentage || 0) < (worstDay.compliance_percentage || 0)) {
      worstDay = record;
    }
  });

  // Calculate trend (comparing first half vs second half of records)
  let complianceTrend = 'stable';
  if (validRecords.length >= 4) {
    const midPoint = Math.floor(validRecords.length / 2);
    const firstHalf = validRecords.slice(0, midPoint);
    const secondHalf = validRecords.slice(midPoint);

    const firstHalfAvg = firstHalf.reduce((sum, r) => sum + (r.compliance_percentage || 0), 0) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((sum, r) => sum + (r.compliance_percentage || 0), 0) / secondHalf.length;

    const difference = secondHalfAvg - firstHalfAvg;
    
    if (difference > 5) {
      complianceTrend = 'improving';
    } else if (difference < -5) {
      complianceTrend = 'declining';
    }
  }

  return {
    average_compliance: averageCompliance,
    total_records: records.length,
    compliance_trend: complianceTrend,
    best_day: {
      date: bestDay.date,
      compliance_percentage: bestDay.compliance_percentage
    },
    worst_day: {
      date: worstDay.date,
      compliance_percentage: worstDay.compliance_percentage
    }
  };
}