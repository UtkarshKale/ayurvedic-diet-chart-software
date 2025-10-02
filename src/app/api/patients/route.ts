import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { patients } from '@/db/schema';
import { eq, like, and, or, desc, asc } from 'drizzle-orm';

// Valid dosha values
const VALID_DOSHAS = ['Vata', 'Pitta', 'Kapha', 'Vata-Pitta', 'Pitta-Kapha', 'Kapha-Vata'];
const VALID_STATUSES = ['Active', 'Inactive'];
const VALID_DIETARY_HABITS = ['vegetarian', 'non-vegetarian', 'vegan', 'eggetarian'];

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Helper function to calculate BMI
function calculateBMI(height: number, weight: number): number {
  if (height <= 0 || weight <= 0) return 0;
  const heightInMeters = height / 100;
  return Math.round((weight / (heightInMeters * heightInMeters)) * 100) / 100;
}

// Helper function to validate patient data
function validatePatientData(data: any, isUpdate = false) {
  const errors: string[] = [];

  // Required fields for POST
  if (!isUpdate) {
    if (!data.name || typeof data.name !== 'string' || data.name.trim() === '') {
      errors.push('Name is required');
    }
    if (!data.age || typeof data.age !== 'number' || data.age <= 0 || !Number.isInteger(data.age)) {
      errors.push('Age must be a positive integer');
    }
    if (!data.gender || typeof data.gender !== 'string' || data.gender.trim() === '') {
      errors.push('Gender is required');
    }
    if (!data.dosha || typeof data.dosha !== 'string' || !VALID_DOSHAS.includes(data.dosha)) {
      errors.push(`Dosha must be one of: ${VALID_DOSHAS.join(', ')}`);
    }
  } else {
    // For updates, validate only if provided
    if (data.age !== undefined && (typeof data.age !== 'number' || data.age <= 0 || !Number.isInteger(data.age))) {
      errors.push('Age must be a positive integer');
    }
    if (data.dosha !== undefined && (typeof data.dosha !== 'string' || !VALID_DOSHAS.includes(data.dosha))) {
      errors.push(`Dosha must be one of: ${VALID_DOSHAS.join(', ')}`);
    }
  }

  // Optional field validations
  if (data.email && (typeof data.email !== 'string' || !EMAIL_REGEX.test(data.email))) {
    errors.push('Email must be a valid email format');
  }
  if (data.height !== undefined && (typeof data.height !== 'number' || data.height <= 0)) {
    errors.push('Height must be a positive number');
  }
  if (data.weight !== undefined && (typeof data.weight !== 'number' || data.weight <= 0)) {
    errors.push('Weight must be a positive number');
  }
  if (data.status && (typeof data.status !== 'string' || !VALID_STATUSES.includes(data.status))) {
    errors.push(`Status must be one of: ${VALID_STATUSES.join(', ')}`);
  }
  if (data.dietary_habits && (typeof data.dietary_habits !== 'string' || !VALID_DIETARY_HABITS.includes(data.dietary_habits))) {
    errors.push(`Dietary habits must be one of: ${VALID_DIETARY_HABITS.join(', ')}`);
  }
  if (data.meal_frequency !== undefined && (typeof data.meal_frequency !== 'number' || data.meal_frequency <= 0 || !Number.isInteger(data.meal_frequency))) {
    errors.push('Meal frequency must be a positive integer');
  }
  if (data.water_intake !== undefined && (typeof data.water_intake !== 'number' || data.water_intake < 0)) {
    errors.push('Water intake must be a non-negative number');
  }

  return errors;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Single patient by ID
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json({ 
          error: "Valid ID is required",
          code: "INVALID_ID" 
        }, { status: 400 });
      }

      const patient = await db.select()
        .from(patients)
        .where(eq(patients.id, parseInt(id)))
        .limit(1);

      if (patient.length === 0) {
        return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
      }

      return NextResponse.json(patient[0]);
    }

    // List patients with pagination and search
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    const search = searchParams.get('search');
    const sort = searchParams.get('sort') || 'created_at';
    const order = searchParams.get('order') || 'desc';
    const status = searchParams.get('status');

    let query = db.select().from(patients);

    // Build where conditions
    const conditions = [];

    if (search) {
      conditions.push(
        or(
          like(patients.name, `%${search}%`),
          like(patients.email, `%${search}%`),
          like(patients.phone, `%${search}%`)
        )
      );
    }

    if (status && VALID_STATUSES.includes(status)) {
      conditions.push(eq(patients.status, status));
    }

    if (conditions.length > 0) {
      query = query.where(conditions.length === 1 ? conditions[0] : and(...conditions));
    }

    // Apply sorting
    const sortColumn = sort === 'name' ? patients.name :
                      sort === 'age' ? patients.age :
                      sort === 'created_at' ? patients.created_at :
                      sort === 'updated_at' ? patients.updated_at :
                      patients.created_at;

    query = query.orderBy(order === 'asc' ? asc(sortColumn) : desc(sortColumn));

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
    const requestBody = await request.json();

    // Validate required fields
    const validationErrors = validatePatientData(requestBody);
    if (validationErrors.length > 0) {
      return NextResponse.json({ 
        error: validationErrors.join(', '),
        code: "VALIDATION_ERROR" 
      }, { status: 400 });
    }

    // Sanitize inputs
    const sanitizedData: any = {
      name: requestBody.name.trim(),
      age: requestBody.age,
      gender: requestBody.gender.trim(),
      dosha: requestBody.dosha,
      status: requestBody.status || 'Active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Add optional fields if provided
    if (requestBody.phone) sanitizedData.phone = requestBody.phone.trim();
    if (requestBody.email) sanitizedData.email = requestBody.email.trim().toLowerCase();
    if (requestBody.height !== undefined) sanitizedData.height = requestBody.height;
    if (requestBody.weight !== undefined) sanitizedData.weight = requestBody.weight;
    if (requestBody.dietary_habits) sanitizedData.dietary_habits = requestBody.dietary_habits;
    if (requestBody.meal_frequency !== undefined) sanitizedData.meal_frequency = requestBody.meal_frequency;
    if (requestBody.water_intake !== undefined) sanitizedData.water_intake = requestBody.water_intake;
    if (requestBody.health_conditions) sanitizedData.health_conditions = requestBody.health_conditions.trim();
    if (requestBody.allergies) sanitizedData.allergies = requestBody.allergies.trim();
    if (requestBody.notes) sanitizedData.notes = requestBody.notes.trim();

    // Calculate BMI if height and weight are provided
    if (sanitizedData.height && sanitizedData.weight) {
      sanitizedData.bmi = calculateBMI(sanitizedData.height, sanitizedData.weight);
    }

    const newPatient = await db.insert(patients)
      .values(sanitizedData)
      .returning();

    return NextResponse.json(newPatient[0], { status: 201 });

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

    // Validate update data
    const validationErrors = validatePatientData(requestBody, true);
    if (validationErrors.length > 0) {
      return NextResponse.json({ 
        error: validationErrors.join(', '),
        code: "VALIDATION_ERROR" 
      }, { status: 400 });
    }

    // Check if patient exists
    const existingPatient = await db.select()
      .from(patients)
      .where(eq(patients.id, parseInt(id)))
      .limit(1);

    if (existingPatient.length === 0) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    // Prepare update data
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    // Add fields to update if provided
    if (requestBody.name !== undefined) updateData.name = requestBody.name.trim();
    if (requestBody.age !== undefined) updateData.age = requestBody.age;
    if (requestBody.gender !== undefined) updateData.gender = requestBody.gender.trim();
    if (requestBody.dosha !== undefined) updateData.dosha = requestBody.dosha;
    if (requestBody.phone !== undefined) updateData.phone = requestBody.phone ? requestBody.phone.trim() : null;
    if (requestBody.email !== undefined) updateData.email = requestBody.email ? requestBody.email.trim().toLowerCase() : null;
    if (requestBody.height !== undefined) updateData.height = requestBody.height;
    if (requestBody.weight !== undefined) updateData.weight = requestBody.weight;
    if (requestBody.dietary_habits !== undefined) updateData.dietary_habits = requestBody.dietary_habits;
    if (requestBody.meal_frequency !== undefined) updateData.meal_frequency = requestBody.meal_frequency;
    if (requestBody.water_intake !== undefined) updateData.water_intake = requestBody.water_intake;
    if (requestBody.health_conditions !== undefined) updateData.health_conditions = requestBody.health_conditions ? requestBody.health_conditions.trim() : null;
    if (requestBody.allergies !== undefined) updateData.allergies = requestBody.allergies ? requestBody.allergies.trim() : null;
    if (requestBody.notes !== undefined) updateData.notes = requestBody.notes ? requestBody.notes.trim() : null;
    if (requestBody.status !== undefined) updateData.status = requestBody.status;

    // Recalculate BMI if height or weight is being updated
    const currentPatient = existingPatient[0];
    const newHeight = updateData.height !== undefined ? updateData.height : currentPatient.height;
    const newWeight = updateData.weight !== undefined ? updateData.weight : currentPatient.weight;
    
    if (newHeight && newWeight) {
      updateData.bmi = calculateBMI(newHeight, newWeight);
    } else if (updateData.height === null || updateData.weight === null) {
      updateData.bmi = null;
    }

    const updated = await db.update(patients)
      .set(updateData)
      .where(eq(patients.id, parseInt(id)))
      .returning();

    return NextResponse.json(updated[0]);

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

    // Check if patient exists
    const existingPatient = await db.select()
      .from(patients)
      .where(eq(patients.id, parseInt(id)))
      .limit(1);

    if (existingPatient.length === 0) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    const deleted = await db.delete(patients)
      .where(eq(patients.id, parseInt(id)))
      .returning();

    return NextResponse.json({
      message: 'Patient deleted successfully',
      deletedPatient: deleted[0]
    });

  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}