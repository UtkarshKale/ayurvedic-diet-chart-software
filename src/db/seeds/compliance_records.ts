import { db } from '@/db';
import { compliance_records } from '@/db/schema';

async function main() {
    const sampleComplianceRecords = [
        // Patient 1: High compliance (85-95%) - motivated patient
        { patient_id: 1, diet_chart_id: 1, date: '2024-01-01', compliance_percentage: 92, meals_followed: 5, meals_total: 5, notes: 'Excellent adherence, following all meal timings perfectly', created_at: new Date('2024-01-01').toISOString() },
        { patient_id: 1, diet_chart_id: 1, date: '2024-01-02', compliance_percentage: 88, meals_followed: 4, meals_total: 5, notes: 'Missed evening snack due to work meeting', created_at: new Date('2024-01-02').toISOString() },
        { patient_id: 1, diet_chart_id: 1, date: '2024-01-03', compliance_percentage: 95, meals_followed: 5, meals_total: 5, notes: 'Perfect day! Meal prep on Sunday really helped', created_at: new Date('2024-01-03').toISOString() },
        { patient_id: 1, diet_chart_id: 1, date: '2024-01-04', compliance_percentage: 90, meals_followed: 5, meals_total: 5, notes: 'All meals followed, portion control maintained well', created_at: new Date('2024-01-04').toISOString() },
        { patient_id: 1, diet_chart_id: 1, date: '2024-01-05', compliance_percentage: 85, meals_followed: 4, meals_total: 5, notes: 'Skipped mid-morning snack, otherwise good adherence', created_at: new Date('2024-01-05').toISOString() },
        { patient_id: 1, diet_chart_id: 1, date: '2024-01-06', compliance_percentage: 93, meals_followed: 5, meals_total: 5, notes: 'Feeling energetic, following schedule religiously', created_at: new Date('2024-01-06').toISOString() },

        // Patient 2: Good compliance (78-88%) - occasional challenges
        { patient_id: 2, diet_chart_id: 2, date: '2024-01-01', compliance_percentage: 82, meals_followed: 4, meals_total: 5, notes: 'New Year celebration affected dinner timing', created_at: new Date('2024-01-01').toISOString() },
        { patient_id: 2, diet_chart_id: 2, date: '2024-01-02', compliance_percentage: 85, meals_followed: 4, meals_total: 5, notes: 'Good progress, missed afternoon snack', created_at: new Date('2024-01-02').toISOString() },
        { patient_id: 2, diet_chart_id: 2, date: '2024-01-03', compliance_percentage: 78, meals_followed: 4, meals_total: 5, notes: 'Stress eating at work, portion sizes increased', created_at: new Date('2024-01-03').toISOString() },
        { patient_id: 2, diet_chart_id: 2, date: '2024-01-04', compliance_percentage: 88, meals_followed: 5, meals_total: 5, notes: 'Better control today, all meals on time', created_at: new Date('2024-01-04').toISOString() },
        { patient_id: 2, diet_chart_id: 2, date: '2024-01-05', compliance_percentage: 80, meals_followed: 4, meals_total: 5, notes: 'Weekend social event disrupted evening meal', created_at: new Date('2024-01-05').toISOString() },
        { patient_id: 2, diet_chart_id: 2, date: '2024-01-06', compliance_percentage: 86, meals_followed: 5, meals_total: 5, notes: 'Back on track, feeling motivated', created_at: new Date('2024-01-06').toISOString() },

        // Patient 3: Variable compliance (70-85%) - lifestyle constraints
        { patient_id: 3, diet_chart_id: 3, date: '2024-01-01', compliance_percentage: 75, meals_followed: 3, meals_total: 5, notes: 'Single parent challenges, rushed meals', created_at: new Date('2024-01-01').toISOString() },
        { patient_id: 3, diet_chart_id: 3, date: '2024-01-02', compliance_percentage: 70, meals_followed: 3, meals_total: 5, notes: 'Kids sick, could not maintain meal schedule', created_at: new Date('2024-01-02').toISOString() },
        { patient_id: 3, diet_chart_id: 3, date: '2024-01-03', compliance_percentage: 83, meals_followed: 4, meals_total: 5, notes: 'Better day, meal prepping helped', created_at: new Date('2024-01-03').toISOString() },
        { patient_id: 3, diet_chart_id: 3, date: '2024-01-04', compliance_percentage: 72, meals_followed: 3, meals_total: 5, notes: 'Work deadline pressure, grabbed quick meals', created_at: new Date('2024-01-04').toISOString() },
        { patient_id: 3, diet_chart_id: 3, date: '2024-01-05', compliance_percentage: 85, meals_followed: 4, meals_total: 5, notes: 'Weekend allowed better meal planning', created_at: new Date('2024-01-05').toISOString() },
        { patient_id: 3, diet_chart_id: 3, date: '2024-01-06', compliance_percentage: 78, meals_followed: 4, meals_total: 5, notes: 'Improving gradually, need more support', created_at: new Date('2024-01-06').toISOString() },

        // Patient 4: Excellent compliance (88-95%) - very disciplined
        { patient_id: 4, diet_chart_id: 4, date: '2024-01-01', compliance_percentage: 95, meals_followed: 5, meals_total: 5, notes: 'Perfect start to the year, all goals met', created_at: new Date('2024-01-01').toISOString() },
        { patient_id: 4, diet_chart_id: 4, date: '2024-01-02', compliance_percentage: 92, meals_followed: 5, meals_total: 5, notes: 'Slight portion increase at dinner but within limits', created_at: new Date('2024-01-02').toISOString() },
        { patient_id: 4, diet_chart_id: 4, date: '2024-01-03', compliance_percentage: 88, meals_followed: 4, meals_total: 5, notes: 'Travel day, missed one snack but maintained quality', created_at: new Date('2024-01-03').toISOString() },
        { patient_id: 4, diet_chart_id: 4, date: '2024-01-04', compliance_percentage: 95, meals_followed: 5, meals_total: 5, notes: 'Excellent discipline, feeling very satisfied', created_at: new Date('2024-01-04').toISOString() },
        { patient_id: 4, diet_chart_id: 4, date: '2024-01-05', compliance_percentage: 90, meals_followed: 5, meals_total: 5, notes: 'All meals followed, minor timing adjustment', created_at: new Date('2024-01-05').toISOString() },
        { patient_id: 4, diet_chart_id: 4, date: '2024-01-06', compliance_percentage: 94, meals_followed: 5, meals_total: 5, notes: 'Consistently maintaining high standards', created_at: new Date('2024-01-06').toISOString() },

        // Patient 5: Moderate compliance (75-82%) - work travel issues
        { patient_id: 5, diet_chart_id: 5, date: '2024-01-01', compliance_percentage: 79, meals_followed: 4, meals_total: 5, notes: 'Airport delays affected meal timing', created_at: new Date('2024-01-01').toISOString() },
        { patient_id: 5, diet_chart_id: 5, date: '2024-01-02', compliance_percentage: 75, meals_followed: 3, meals_total: 5, notes: 'Business travel, limited healthy options', created_at: new Date('2024-01-02').toISOString() },
        { patient_id: 5, diet_chart_id: 5, date: '2024-01-03', compliance_percentage: 82, meals_followed: 4, meals_total: 5, notes: 'Hotel room service, did best with available options', created_at: new Date('2024-01-03').toISOString() },
        { patient_id: 5, diet_chart_id: 5, date: '2024-01-04', compliance_percentage: 76, meals_followed: 4, meals_total: 5, notes: 'Client dinner, managed portions but not ideal foods', created_at: new Date('2024-01-04').toISOString() },
        { patient_id: 5, diet_chart_id: 5, date: '2024-01-05', compliance_percentage: 80, meals_followed: 4, meals_total: 5, notes: 'Back home, getting back on track', created_at: new Date('2024-01-05').toISOString() },
        { patient_id: 5, diet_chart_id: 5, date: '2024-01-06', compliance_percentage: 81, meals_followed: 4, meals_total: 5, notes: 'Weekend recovery, meal prep for next week', created_at: new Date('2024-01-06').toISOString() }
    ];

    await db.insert(compliance_records).values(sampleComplianceRecords);
    
    console.log('✅ Compliance records seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});