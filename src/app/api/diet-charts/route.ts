import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { diet_charts, patients } from '@/db/schema';
import { eq, like, and, or, desc, asc } from 'drizzle-orm';

const VALID_DIETARY_FOCUS = [
  'weight loss',
  'weight gain', 
  'maintenance',
  'therapeutic',
  'digestive health',
  'immunity boost'
];

const VALID_STATUS = ['Active', 'Completed', 'Archived'];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Single record fetch
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json({ 
          error: "Valid ID is required",
          code: "INVALID_ID" 
        }, { status: 400 });
      }

      const record = await db.select({
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
        patient: {
          id: patients.id,
          name: patients.name,
          age: patients.age,
          gender: patients.gender,
          dosha: patients.dosha,
          phone: patients.phone,
          email: patients.email
        }
      })
      .from(diet_charts)
      .leftJoin(patients, eq(diet_charts.patient_id, patients.id))
      .where(eq(diet_charts.id, parseInt(id)))
      .limit(1);

      if (record.length === 0) {
        return NextResponse.json({ error: 'Diet chart not found' }, { status: 404 });
      }

      return NextResponse.json(record[0]);
    }

    // List with pagination and filters
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    const search = searchParams.get('search');
    const patient_id = searchParams.get('patient_id');
    const status = searchParams.get('status');
    const dietary_focus = searchParams.get('dietary_focus');
    const sort = searchParams.get('sort') || 'created_at';
    const order = searchParams.get('order') || 'desc';

    let query = db.select({
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
      patient: {
        id: patients.id,
        name: patients.name,
        age: patients.age,
        gender: patients.gender,
        dosha: patients.dosha,
        phone: patients.phone,
        email: patients.email
      }
    })
    .from(diet_charts)
    .leftJoin(patients, eq(diet_charts.patient_id, patients.id));

    // Build where conditions
    const conditions = [];

    if (patient_id) {
      conditions.push(eq(diet_charts.patient_id, parseInt(patient_id)));
    }

    if (status) {
      conditions.push(eq(diet_charts.status, status));
    }

    if (dietary_focus) {
      conditions.push(eq(diet_charts.dietary_focus, dietary_focus));
    }

    if (search) {
      conditions.push(like(patients.name, `%${search}%`));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Apply sorting
    if (order === 'asc') {
      query = query.orderBy(asc(diet_charts[sort as keyof typeof diet_charts] || diet_charts.created_at));
    } else {
      query = query.orderBy(desc(diet_charts[sort as keyof typeof diet_charts] || diet_charts.created_at));
    }

    const results = await query.limit(limit).offset(offset);

    return NextResponse.json(results);

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      patient_id,
      duration,
      target_calories,
      dietary_focus,
      special_instructions,
      total_calories,
      total_protein,
      total_carbs,
      total_fat,
      dosha_balance_score,
      rasa_score,
      digestibility_score,
      status
    } = body;

    // Validation
    if (!patient_id) {
      return NextResponse.json({ 
        error: "Patient ID is required",
        code: "MISSING_PATIENT_ID" 
      }, { status: 400 });
    }

    // Validate patient exists
    const patientExists = await db.select()
      .from(patients)
      .where(eq(patients.id, patient_id))
      .limit(1);

    if (patientExists.length === 0) {
      return NextResponse.json({ 
        error: "Patient not found",
        code: "PATIENT_NOT_FOUND" 
      }, { status: 400 });
    }

    // Validate scores are in 0-100 range
    const scores = [dosha_balance_score, rasa_score, digestibility_score];
    for (const score of scores) {
      if (score !== undefined && score !== null && (score < 0 || score > 100)) {
        return NextResponse.json({ 
          error: "Scores must be between 0 and 100",
          code: "INVALID_SCORE_RANGE" 
        }, { status: 400 });
      }
    }

    // Validate duration is positive
    if (duration !== undefined && duration !== null && duration <= 0) {
      return NextResponse.json({ 
        error: "Duration must be positive",
        code: "INVALID_DURATION" 
      }, { status: 400 });
    }

    // Validate target_calories is positive
    if (target_calories !== undefined && target_calories !== null && target_calories <= 0) {
      return NextResponse.json({ 
        error: "Target calories must be positive",
        code: "INVALID_TARGET_CALORIES" 
      }, { status: 400 });
    }

    // Validate dietary_focus
    if (dietary_focus && !VALID_DIETARY_FOCUS.includes(dietary_focus)) {
      return NextResponse.json({ 
        error: "Invalid dietary focus. Must be one of: " + VALID_DIETARY_FOCUS.join(', '),
        code: "INVALID_DIETARY_FOCUS" 
      }, { status: 400 });
    }

    // Validate status
    if (status && !VALID_STATUS.includes(status)) {
      return NextResponse.json({ 
        error: "Invalid status. Must be one of: " + VALID_STATUS.join(', '),
        code: "INVALID_STATUS" 
      }, { status: 400 });
    }

    const now = new Date().toISOString();
    
    const insertData = {
      patient_id,
      duration: duration || null,
      target_calories: target_calories || null,
      dietary_focus: dietary_focus || null,
      special_instructions: special_instructions?.trim() || null,
      total_calories: total_calories || null,
      total_protein: total_protein || null,
      total_carbs: total_carbs || null,
      total_fat: total_fat || null,
      dosha_balance_score: dosha_balance_score || null,
      rasa_score: rasa_score || null,
      digestibility_score: digestibility_score || null,
      status: status || 'Active',
      created_at: now,
      updated_at: now
    };

    const newRecord = await db.insert(diet_charts)
      .values(insertData)
      .returning();

    // Fetch the created record with patient info
    const createdRecord = await db.select({
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
      patient: {
        id: patients.id,
        name: patients.name,
        age: patients.age,
        gender: patients.gender,
        dosha: patients.dosha,
        phone: patients.phone,
        email: patients.email
      }
    })
    .from(diet_charts)
    .leftJoin(patients, eq(diet_charts.patient_id, patients.id))
    .where(eq(diet_charts.id, newRecord[0].id))
    .limit(1);

    return NextResponse.json(createdRecord[0], { status: 201 });

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

    const body = await request.json();
    
    const {
      patient_id,
      duration,
      target_calories,
      dietary_focus,
      special_instructions,
      total_calories,
      total_protein,
      total_carbs,
      total_fat,
      dosha_balance_score,
      rasa_score,
      digestibility_score,
      status
    } = body;

    // Check if record exists
    const existingRecord = await db.select()
      .from(diet_charts)
      .where(eq(diet_charts.id, parseInt(id)))
      .limit(1);

    if (existingRecord.length === 0) {
      return NextResponse.json({ error: 'Diet chart not found' }, { status: 404 });
    }

    // Validate patient_id if provided
    if (patient_id) {
      const patientExists = await db.select()
        .from(patients)
        .where(eq(patients.id, patient_id))
        .limit(1);

      if (patientExists.length === 0) {
        return NextResponse.json({ 
          error: "Patient not found",
          code: "PATIENT_NOT_FOUND" 
        }, { status: 400 });
      }
    }

    // Validate scores are in 0-100 range
    const scores = [dosha_balance_score, rasa_score, digestibility_score];
    for (const score of scores) {
      if (score !== undefined && score !== null && (score < 0 || score > 100)) {
        return NextResponse.json({ 
          error: "Scores must be between 0 and 100",
          code: "INVALID_SCORE_RANGE" 
        }, { status: 400 });
      }
    }

    // Validate duration is positive
    if (duration !== undefined && duration !== null && duration <= 0) {
      return NextResponse.json({ 
        error: "Duration must be positive",
        code: "INVALID_DURATION" 
      }, { status: 400 });
    }

    // Validate target_calories is positive
    if (target_calories !== undefined && target_calories !== null && target_calories <= 0) {
      return NextResponse.json({ 
        error: "Target calories must be positive",
        code: "INVALID_TARGET_CALORIES" 
      }, { status: 400 });
    }

    // Validate dietary_focus
    if (dietary_focus && !VALID_DIETARY_FOCUS.includes(dietary_focus)) {
      return NextResponse.json({ 
        error: "Invalid dietary focus. Must be one of: " + VALID_DIETARY_FOCUS.join(', '),
        code: "INVALID_DIETARY_FOCUS" 
      }, { status: 400 });
    }

    // Validate status
    if (status && !VALID_STATUS.includes(status)) {
      return NextResponse.json({ 
        error: "Invalid status. Must be one of: " + VALID_STATUS.join(', '),
        code: "INVALID_STATUS" 
      }, { status: 400 });
    }

    const updates: any = {
      updated_at: new Date().toISOString()
    };

    // Only update provided fields
    if (patient_id !== undefined) updates.patient_id = patient_id;
    if (duration !== undefined) updates.duration = duration;
    if (target_calories !== undefined) updates.target_calories = target_calories;
    if (dietary_focus !== undefined) updates.dietary_focus = dietary_focus;
    if (special_instructions !== undefined) updates.special_instructions = special_instructions?.trim();
    if (total_calories !== undefined) updates.total_calories = total_calories;
    if (total_protein !== undefined) updates.total_protein = total_protein;
    if (total_carbs !== undefined) updates.total_carbs = total_carbs;
    if (total_fat !== undefined) updates.total_fat = total_fat;
    if (dosha_balance_score !== undefined) updates.dosha_balance_score = dosha_balance_score;
    if (rasa_score !== undefined) updates.rasa_score = rasa_score;
    if (digestibility_score !== undefined) updates.digestibility_score = digestibility_score;
    if (status !== undefined) updates.status = status;

    const updated = await db.update(diet_charts)
      .set(updates)
      .where(eq(diet_charts.id, parseInt(id)))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json({ error: 'Failed to update diet chart' }, { status: 500 });
    }

    // Fetch the updated record with patient info
    const updatedRecord = await db.select({
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
      patient: {
        id: patients.id,
        name: patients.name,
        age: patients.age,
        gender: patients.gender,
        dosha: patients.dosha,
        phone: patients.phone,
        email: patients.email
      }
    })
    .from(diet_charts)
    .leftJoin(patients, eq(diet_charts.patient_id, patients.id))
    .where(eq(diet_charts.id, parseInt(id)))
    .limit(1);

    return NextResponse.json(updatedRecord[0]);

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
      .from(diet_charts)
      .where(eq(diet_charts.id, parseInt(id)))
      .limit(1);

    if (existingRecord.length === 0) {
      return NextResponse.json({ error: 'Diet chart not found' }, { status: 404 });
    }

    const deleted = await db.delete(diet_charts)
      .where(eq(diet_charts.id, parseInt(id)))
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json({ error: 'Failed to delete diet chart' }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Diet chart deleted successfully',
      deleted: deleted[0]
    });

  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}