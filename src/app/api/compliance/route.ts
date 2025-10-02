import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { compliance_records, patients, diet_charts } from '@/db/schema';
import { eq, like, and, or, desc, asc, gte, lte } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // If ID is provided, return single record
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json({ 
          error: "Valid ID is required",
          code: "INVALID_ID" 
        }, { status: 400 });
      }

      const record = await db
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
          patient: {
            id: patients.id,
            name: patients.name,
            age: patients.age,
            gender: patients.gender,
            dosha: patients.dosha,
            phone: patients.phone,
            email: patients.email
          },
          diet_chart: {
            id: diet_charts.id,
            duration: diet_charts.duration,
            target_calories: diet_charts.target_calories,
            dietary_focus: diet_charts.dietary_focus,
            status: diet_charts.status
          }
        })
        .from(compliance_records)
        .leftJoin(patients, eq(compliance_records.patient_id, patients.id))
        .leftJoin(diet_charts, eq(compliance_records.diet_chart_id, diet_charts.id))
        .where(eq(compliance_records.id, parseInt(id)))
        .limit(1);

      if (record.length === 0) {
        return NextResponse.json({ error: 'Compliance record not found' }, { status: 404 });
      }

      return NextResponse.json(record[0], { status: 200 });
    }

    // List records with pagination and filtering
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    const search = searchParams.get('search');
    const patient_id = searchParams.get('patient_id');
    const diet_chart_id = searchParams.get('diet_chart_id');
    const start_date = searchParams.get('start_date');
    const end_date = searchParams.get('end_date');
    const sort = searchParams.get('sort') || 'created_at';
    const order = searchParams.get('order') || 'desc';

    let query = db
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
        patient: {
          id: patients.id,
          name: patients.name,
          age: patients.age,
          gender: patients.gender,
          dosha: patients.dosha,
          phone: patients.phone,
          email: patients.email
        },
        diet_chart: {
          id: diet_charts.id,
          duration: diet_charts.duration,
          target_calories: diet_charts.target_calories,
          dietary_focus: diet_charts.dietary_focus,
          status: diet_charts.status
        }
      })
      .from(compliance_records)
      .leftJoin(patients, eq(compliance_records.patient_id, patients.id))
      .leftJoin(diet_charts, eq(compliance_records.diet_chart_id, diet_charts.id));

    // Build where conditions
    const conditions = [];

    if (patient_id) {
      conditions.push(eq(compliance_records.patient_id, parseInt(patient_id)));
    }

    if (diet_chart_id) {
      conditions.push(eq(compliance_records.diet_chart_id, parseInt(diet_chart_id)));
    }

    if (start_date) {
      conditions.push(gte(compliance_records.date, start_date));
    }

    if (end_date) {
      conditions.push(lte(compliance_records.date, end_date));
    }

    if (search) {
      conditions.push(
        or(
          like(patients.name, `%${search}%`),
          like(compliance_records.notes, `%${search}%`),
          like(compliance_records.date, `%${search}%`)
        )
      );
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Add sorting
    const sortColumn = sort === 'date' ? compliance_records.date : 
                      sort === 'compliance_percentage' ? compliance_records.compliance_percentage :
                      compliance_records.created_at;
    
    query = order === 'asc' ? query.orderBy(asc(sortColumn)) : query.orderBy(desc(sortColumn));

    const results = await query.limit(limit).offset(offset);

    return NextResponse.json(results, { status: 200 });

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const requestBody = await request.json();
    const { patient_id, diet_chart_id, date, compliance_percentage, meals_followed, meals_total, notes } = requestBody;

    // Validation: required fields
    if (!patient_id) {
      return NextResponse.json({ 
        error: "Patient ID is required",
        code: "MISSING_PATIENT_ID" 
      }, { status: 400 });
    }

    if (!diet_chart_id) {
      return NextResponse.json({ 
        error: "Diet chart ID is required",
        code: "MISSING_DIET_CHART_ID" 
      }, { status: 400 });
    }

    if (!date) {
      return NextResponse.json({ 
        error: "Date is required",
        code: "MISSING_DATE" 
      }, { status: 400 });
    }

    if (compliance_percentage === undefined || compliance_percentage === null) {
      return NextResponse.json({ 
        error: "Compliance percentage is required",
        code: "MISSING_COMPLIANCE_PERCENTAGE" 
      }, { status: 400 });
    }

    if (!meals_followed && meals_followed !== 0) {
      return NextResponse.json({ 
        error: "Meals followed is required",
        code: "MISSING_MEALS_FOLLOWED" 
      }, { status: 400 });
    }

    if (!meals_total) {
      return NextResponse.json({ 
        error: "Total meals is required",
        code: "MISSING_MEALS_TOTAL" 
      }, { status: 400 });
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return NextResponse.json({ 
        error: "Date must be in YYYY-MM-DD format",
        code: "INVALID_DATE_FORMAT" 
      }, { status: 400 });
    }

    // Validate date is not in the future
    const inputDate = new Date(date);
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today
    
    if (inputDate > today) {
      return NextResponse.json({ 
        error: "Date cannot be in the future",
        code: "FUTURE_DATE_NOT_ALLOWED" 
      }, { status: 400 });
    }

    // Validate compliance percentage (0-100)
    if (compliance_percentage < 0 || compliance_percentage > 100) {
      return NextResponse.json({ 
        error: "Compliance percentage must be between 0 and 100",
        code: "INVALID_COMPLIANCE_PERCENTAGE" 
      }, { status: 400 });
    }

    // Validate meals are positive integers
    if (meals_followed < 0 || meals_total < 0) {
      return NextResponse.json({ 
        error: "Meals followed and total meals must be positive integers",
        code: "INVALID_MEALS_COUNT" 
      }, { status: 400 });
    }

    // Validate meals_followed <= meals_total
    if (meals_followed > meals_total) {
      return NextResponse.json({ 
        error: "Meals followed cannot exceed total meals",
        code: "MEALS_FOLLOWED_EXCEEDS_TOTAL" 
      }, { status: 400 });
    }

    // Validate patient exists
    const patient = await db.select().from(patients).where(eq(patients.id, patient_id)).limit(1);
    if (patient.length === 0) {
      return NextResponse.json({ 
        error: "Patient not found",
        code: "PATIENT_NOT_FOUND" 
      }, { status: 400 });
    }

    // Validate diet chart exists
    const dietChart = await db.select().from(diet_charts).where(eq(diet_charts.id, diet_chart_id)).limit(1);
    if (dietChart.length === 0) {
      return NextResponse.json({ 
        error: "Diet chart not found",
        code: "DIET_CHART_NOT_FOUND" 
      }, { status: 400 });
    }

    // Create compliance record
    const newRecord = await db.insert(compliance_records)
      .values({
        patient_id,
        diet_chart_id,
        date,
        compliance_percentage,
        meals_followed,
        meals_total,
        notes: notes || null,
        created_at: new Date().toISOString()
      })
      .returning();

    return NextResponse.json(newRecord[0], { status: 201 });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    const requestBody = await request.json();
    const { patient_id, diet_chart_id, date, compliance_percentage, meals_followed, meals_total, notes } = requestBody;

    // Check if record exists
    const existingRecord = await db.select()
      .from(compliance_records)
      .where(eq(compliance_records.id, parseInt(id)))
      .limit(1);

    if (existingRecord.length === 0) {
      return NextResponse.json({ error: 'Compliance record not found' }, { status: 404 });
    }

    // Prepare update object
    const updates: any = {};

    if (patient_id !== undefined) {
      // Validate patient exists
      const patient = await db.select().from(patients).where(eq(patients.id, patient_id)).limit(1);
      if (patient.length === 0) {
        return NextResponse.json({ 
          error: "Patient not found",
          code: "PATIENT_NOT_FOUND" 
        }, { status: 400 });
      }
      updates.patient_id = patient_id;
    }

    if (diet_chart_id !== undefined) {
      // Validate diet chart exists
      const dietChart = await db.select().from(diet_charts).where(eq(diet_charts.id, diet_chart_id)).limit(1);
      if (dietChart.length === 0) {
        return NextResponse.json({ 
          error: "Diet chart not found",
          code: "DIET_CHART_NOT_FOUND" 
        }, { status: 400 });
      }
      updates.diet_chart_id = diet_chart_id;
    }

    if (date !== undefined) {
      // Validate date format
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(date)) {
        return NextResponse.json({ 
          error: "Date must be in YYYY-MM-DD format",
          code: "INVALID_DATE_FORMAT" 
        }, { status: 400 });
      }

      // Validate date is not in the future
      const inputDate = new Date(date);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      
      if (inputDate > today) {
        return NextResponse.json({ 
          error: "Date cannot be in the future",
          code: "FUTURE_DATE_NOT_ALLOWED" 
        }, { status: 400 });
      }

      updates.date = date;
    }

    if (compliance_percentage !== undefined) {
      if (compliance_percentage < 0 || compliance_percentage > 100) {
        return NextResponse.json({ 
          error: "Compliance percentage must be between 0 and 100",
          code: "INVALID_COMPLIANCE_PERCENTAGE" 
        }, { status: 400 });
      }
      updates.compliance_percentage = compliance_percentage;
    }

    if (meals_followed !== undefined) {
      if (meals_followed < 0) {
        return NextResponse.json({ 
          error: "Meals followed must be a positive integer",
          code: "INVALID_MEALS_FOLLOWED" 
        }, { status: 400 });
      }
      updates.meals_followed = meals_followed;
    }

    if (meals_total !== undefined) {
      if (meals_total < 0) {
        return NextResponse.json({ 
          error: "Total meals must be a positive integer",
          code: "INVALID_MEALS_TOTAL" 
        }, { status: 400 });
      }
      updates.meals_total = meals_total;
    }

    // Validate meals_followed <= meals_total if both are being updated or one is updated
    const finalMealsFollowed = updates.meals_followed !== undefined ? updates.meals_followed : existingRecord[0].meals_followed;
    const finalMealsTotal = updates.meals_total !== undefined ? updates.meals_total : existingRecord[0].meals_total;

    if (finalMealsFollowed > finalMealsTotal) {
      return NextResponse.json({ 
        error: "Meals followed cannot exceed total meals",
        code: "MEALS_FOLLOWED_EXCEEDS_TOTAL" 
      }, { status: 400 });
    }

    if (notes !== undefined) {
      updates.notes = notes;
    }

    // Always update timestamp
    updates.updated_at = new Date().toISOString();

    const updated = await db.update(compliance_records)
      .set(updates)
      .where(eq(compliance_records.id, parseInt(id)))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json({ error: 'Compliance record not found' }, { status: 404 });
    }

    return NextResponse.json(updated[0], { status: 200 });

  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    // Check if record exists
    const existingRecord = await db.select()
      .from(compliance_records)
      .where(eq(compliance_records.id, parseInt(id)))
      .limit(1);

    if (existingRecord.length === 0) {
      return NextResponse.json({ error: 'Compliance record not found' }, { status: 404 });
    }

    const deleted = await db.delete(compliance_records)
      .where(eq(compliance_records.id, parseInt(id)))
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json({ error: 'Compliance record not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      message: 'Compliance record deleted successfully',
      deleted: deleted[0] 
    }, { status: 200 });

  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}