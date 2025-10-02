import { db } from '@/db';
import { profile_settings } from '@/db/schema';

async function main() {
    const sampleProfile = [
        {
            first_name: 'Dr. Rajesh',
            last_name: 'Sharma',
            email: 'dr.rajesh@ayurlife.com',
            phone: '+91 98765 43210',
            specialization: 'Ayurvedic Medicine & Nutrition',
            clinic_name: 'AyurLife Wellness Center',
            updated_at: new Date().toISOString(),
        }
    ];

    await db.insert(profile_settings).values(sampleProfile);
    
    console.log('✅ Profile settings seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});