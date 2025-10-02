import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { profile_settings } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const records = await db.select()
      .from(profile_settings)
      .limit(1);

    // Return first record or default empty structure
    if (records.length === 0) {
      return NextResponse.json({
        id: null,
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        specialization: '',
        clinic_name: '',
        updated_at: ''
      });
    }

    return NextResponse.json(records[0]);
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const requestBody = await request.json();
    const {
      first_name,
      last_name,
      email,
      phone,
      specialization,
      clinic_name
    } = requestBody;

    // Validate email format if provided
    if (email && email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        return NextResponse.json({ 
          error: "Invalid email format",
          code: "INVALID_EMAIL_FORMAT" 
        }, { status: 400 });
      }
    }

    // Prepare update data with trimmed strings
    const updateData = {
      first_name: first_name ? first_name.trim() : first_name,
      last_name: last_name ? last_name.trim() : last_name,
      email: email ? email.trim().toLowerCase() : email,
      phone: phone,
      specialization: specialization ? specialization.trim() : specialization,
      clinic_name: clinic_name ? clinic_name.trim() : clinic_name,
      updated_at: new Date().toISOString()
    };

    // Check if profile exists
    const existingProfile = await db.select()
      .from(profile_settings)
      .limit(1);

    let result;

    if (existingProfile.length === 0) {
      // Create new profile record
      result = await db.insert(profile_settings)
        .values(updateData)
        .returning();
    } else {
      // Update existing profile record
      result = await db.update(profile_settings)
        .set(updateData)
        .where(eq(profile_settings.id, existingProfile[0].id))
        .returning();
    }

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}