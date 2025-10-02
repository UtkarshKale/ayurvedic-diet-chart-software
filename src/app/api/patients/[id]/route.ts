import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { patients, diet_charts, compliance_records } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

    // Validate ID
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({
        error: "Valid patient ID is required",
        code: "INVALID_ID"
      }, { status: 400 });
    }

    // Fetch patient by ID
    const patient = await db.select()
      .from(patients)
      .where(eq(patients.id, parseInt(id)))
      .limit(1);

    if (patient.length === 0) {
      return NextResponse.json({
        error: "Patient not found",
        code: "PATIENT_NOT_FOUND"
      }, { status: 404 });
    }

    // Fetch related diet charts
    const dietCharts = await db.select()
      .from(diet_charts)
      .where(eq(diet_charts.patient_id, parseInt(id)))
      .orderBy(desc(diet_charts.created_at));

    // Fetch related compliance records
    const complianceRecords = await db.select()
      .from(compliance_records)
      .where(eq(compliance_records.patient_id, parseInt(id)))
      .orderBy(desc(compliance_records.date));

    // Return patient with nested relationships
    const patientWithRelations = {
      ...patient[0],
      diet_charts: dietCharts,
      compliance_records: complianceRecords
    };

    return NextResponse.json(patientWithRelations);

  } catch (error) {
    console.error('GET patient error:', error);
    return NextResponse.json({
      error: 'Internal server error: ' + error
    }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

    // Validate ID
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({
        error: "Valid patient ID is required",
        code: "INVALID_ID"
      }, { status: 400 });
    }

    const requestBody = await request.json();

    // Validate required fields
    if (!requestBody.name || !requestBody.age || !requestBody.gender || !requestBody.dosha) {
      return NextResponse.json({
        error: "Missing required fields: name, age, gender, and dosha are required",
        code: "MISSING_REQUIRED_FIELDS"
      }, { status: 400 });
    }

    // Validate dosha values
    const validDoshas = ['Vata', 'Pitta', 'Kapha', 'Vata-Pitta', 'Pitta-Kapha', 'Kapha-Vata'];
    if (!validDoshas.includes(requestBody.dosha)) {
      return NextResponse.json({
        error: "Invalid dosha. Must be one of: " + validDoshas.join(', '),
        code: "INVALID_DOSHA"
      }, { status: 400 });
    }

    // Validate age
    if (requestBody.age < 0 || requestBody.age > 150) {
      return NextResponse.json({
        error: "Age must be between 0 and 150",
        code: "INVALID_AGE"
      }, { status: 400 });
    }

    // Validate gender
    const validGenders = ['Male', 'Female', 'Other'];
    if (!validGenders.includes(requestBody.gender)) {
      return NextResponse.json({
        error: "Invalid gender. Must be one of: " + validGenders.join(', '),
        code: "INVALID_GENDER"
      }, { status: 400 });
    }

    // Validate email format if provided
    if (requestBody.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(requestBody.email)) {
      return NextResponse.json({
        error: "Invalid email format",
        code: "INVALID_EMAIL"
      }, { status: 400 });
    }

    // Validate height and weight if provided
    if (requestBody.height && (requestBody.height < 0 || requestBody.height > 300)) {
      return NextResponse.json({
        error: "Height must be between 0 and 300 cm",
        code: "INVALID_HEIGHT"
      }, { status: 400 });
    }

    if (requestBody.weight && (requestBody.weight < 0 || requestBody.weight > 500)) {
      return NextResponse.json({
        error: "Weight must be between 0 and 500 kg",
        code: "INVALID_WEIGHT"
      }, { status: 400 });
    }

    // Validate meal frequency if provided
    if (requestBody.meal_frequency && (requestBody.meal_frequency < 1 || requestBody.meal_frequency > 10)) {
      return NextResponse.json({
        error: "Meal frequency must be between 1 and 10",
        code: "INVALID_MEAL_FREQUENCY"
      }, { status: 400 });
    }

    // Validate water intake if provided
    if (requestBody.water_intake && (requestBody.water_intake < 0 || requestBody.water_intake > 10)) {
      return NextResponse.json({
        error: "Water intake must be between 0 and 10 liters",
        code: "INVALID_WATER_INTAKE"
      }, { status: 400 });
    }

    // Validate status if provided
    if (requestBody.status) {
      const validStatuses = ['Active', 'Inactive', 'Completed'];
      if (!validStatuses.includes(requestBody.status)) {
        return NextResponse.json({
          error: "Invalid status. Must be one of: " + validStatuses.join(', '),
          code: "INVALID_STATUS"
        }, { status: 400 });
      }
    }

    // Check if patient exists
    const existingPatient = await db.select()
      .from(patients)
      .where(eq(patients.id, parseInt(id)))
      .limit(1);

    if (existingPatient.length === 0) {
      return NextResponse.json({
        error: "Patient not found",
        code: "PATIENT_NOT_FOUND"
      }, { status: 404 });
    }

    // Prepare update data
    const updates: any = {
      name: requestBody.name?.trim(),
      age: requestBody.age,
      gender: requestBody.gender,
      dosha: requestBody.dosha,
      updated_at: new Date().toISOString()
    };

    // Add optional fields if provided
    if (requestBody.phone !== undefined) updates.phone = requestBody.phone?.trim();
    if (requestBody.email !== undefined) updates.email = requestBody.email?.trim().toLowerCase();
    if (requestBody.height !== undefined) updates.height = requestBody.height;
    if (requestBody.weight !== undefined) updates.weight = requestBody.weight;
    if (requestBody.dietary_habits !== undefined) updates.dietary_habits = requestBody.dietary_habits?.trim();
    if (requestBody.meal_frequency !== undefined) updates.meal_frequency = requestBody.meal_frequency;
    if (requestBody.water_intake !== undefined) updates.water_intake = requestBody.water_intake;
    if (requestBody.health_conditions !== undefined) updates.health_conditions = requestBody.health_conditions?.trim();
    if (requestBody.allergies !== undefined) updates.allergies = requestBody.allergies?.trim();
    if (requestBody.notes !== undefined) updates.notes = requestBody.notes?.trim();
    if (requestBody.status !== undefined) updates.status = requestBody.status;

    // Auto-calculate BMI if height and weight are provided
    if (updates.height && updates.weight) {
      const heightInMeters = updates.height / 100;
      updates.bmi = parseFloat((updates.weight / (heightInMeters * heightInMeters)).toFixed(2));
    } else if (updates.height && existingPatient[0].weight) {
      const heightInMeters = updates.height / 100;
      updates.bmi = parseFloat((existingPatient[0].weight / (heightInMeters * heightInMeters)).toFixed(2));
    } else if (updates.weight && existingPatient[0].height) {
      const heightInMeters = existingPatient[0].height / 100;
      updates.bmi = parseFloat((updates.weight / (heightInMeters * heightInMeters)).toFixed(2));
    }

    // Update patient
    const updatedPatient = await db.update(patients)
      .set(updates)
      .where(eq(patients.id, parseInt(id)))
      .returning();

    return NextResponse.json(updatedPatient[0]);

  } catch (error) {
    console.error('PUT patient error:', error);
    return NextResponse.json({
      error: 'Internal server error: ' + error
    }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

    // Validate ID
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({
        error: "Valid patient ID is required",
        code: "INVALID_ID"
      }, { status: 400 });
    }

    // Check if patient exists
    const existingPatient = await db.select()
      .from(patients)
      .where(eq(patients.id, parseInt(id)))
      .limit(1);

    if (existingPatient.length === 0) {
      return NextResponse.json({
        error: "Patient not found",
        code: "PATIENT_NOT_FOUND"
      }, { status: 404 });
    }

    // Delete patient (foreign key constraints will handle related records)
    const deletedPatient = await db.delete(patients)
      .where(eq(patients.id, parseInt(id)))
      .returning();

    return NextResponse.json({
      message: "Patient deleted successfully",
      patient: deletedPatient[0]
    });

  } catch (error) {
    console.error('DELETE patient error:', error);
    
    // Handle foreign key constraint errors
    if (error instanceof Error && error.message.includes('FOREIGN KEY constraint failed')) {
      return NextResponse.json({
        error: "Cannot delete patient with existing diet charts or compliance records. Please delete related records first.",
        code: "FOREIGN_KEY_CONSTRAINT"
      }, { status: 400 });
    }

    return NextResponse.json({
      error: 'Internal server error: ' + error
    }, { status: 500 });
  }
}