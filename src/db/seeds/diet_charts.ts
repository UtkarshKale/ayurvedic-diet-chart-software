import { db } from '@/db';
import { diet_charts } from '@/db/schema';

async function main() {
    const sampleDietCharts = [
        {
            patient_id: 1,
            duration: 30,
            target_calories: 1500,
            dietary_focus: 'weight loss',
            special_instructions: 'Follow Vata-pacifying diet with warm, cooked foods. Avoid cold and raw foods. Include ginger tea before meals to enhance digestion. Eat regular meals at consistent times. Include ghee and sesame oil for healthy fats. Avoid excessive fasting and maintain stable blood sugar levels.',
            total_calories: 1485.5,
            total_protein: 85.2,
            total_carbs: 195.8,
            total_fat: 42.6,
            dosha_balance_score: 88,
            rasa_score: 82,
            digestibility_score: 91,
            status: 'Active',
            created_at: new Date('2024-01-15').toISOString(),
            updated_at: new Date('2024-01-15').toISOString(),
        },
        {
            patient_id: 2,
            duration: 60,
            target_calories: 1800,
            dietary_focus: 'weight loss',
            special_instructions: 'Pitta-balancing diet with cooling foods and bitter tastes. Avoid spicy, oily, and fried foods. Include plenty of fresh vegetables and fruits. Drink cool water between meals. Avoid eating during peak sun hours. Include coconut water and mint to cool the system. Practice moderation in all meals.',
            total_calories: 1795.3,
            total_protein: 102.7,
            total_carbs: 238.4,
            total_fat: 58.9,
            status: 'Active',
            dosha_balance_score: 92,
            rasa_score: 87,
            digestibility_score: 89,
            created_at: new Date('2024-01-20').toISOString(),
            updated_at: new Date('2024-01-20').toISOString(),
        },
        {
            patient_id: 3,
            duration: 45,
            target_calories: 1200,
            dietary_focus: 'digestive health',
            special_instructions: 'Kapha-reducing diet with light, warm, and spicy foods. Avoid dairy, cold foods, and excessive sweets. Include plenty of vegetables and legumes. Drink warm water throughout the day. Fast periodically to improve digestion. Use warming spices like ginger, black pepper, and turmeric. Eat largest meal at noon.',
            total_calories: 1195.8,
            total_protein: 68.4,
            total_carbs: 158.9,
            total_fat: 35.2,
            dosha_balance_score: 85,
            rasa_score: 79,
            digestibility_score: 94,
            status: 'Active',
            created_at: new Date('2024-02-01').toISOString(),
            updated_at: new Date('2024-02-01').toISOString(),
        },
        {
            patient_id: 4,
            duration: 90,
            target_calories: 2000,
            dietary_focus: 'therapeutic',
            special_instructions: 'Therapeutic Ayurvedic diet for chronic conditions. Focus on easily digestible foods with healing properties. Include medicinal herbs like turmeric, ashwagandha, and triphala. Avoid processed foods and refined sugars. Eat fresh, organic produce when possible. Include therapeutic preparations like kitchari and medicated ghee. Follow strict meal timing.',
            total_calories: 1985.6,
            total_protein: 118.3,
            total_carbs: 264.7,
            total_fat: 72.1,
            dosha_balance_score: 95,
            rasa_score: 90,
            digestibility_score: 93,
            status: 'Active',
            created_at: new Date('2024-02-10').toISOString(),
            updated_at: new Date('2024-02-10').toISOString(),
        },
        {
            patient_id: 5,
            duration: 21,
            target_calories: 1600,
            dietary_focus: 'immunity boost',
            special_instructions: 'Immunity-boosting Ayurvedic diet with rasayana foods. Include vitamin C rich fruits, immunity-boosting spices like turmeric and ginger. Consume chyawanprash daily. Include plenty of cooked vegetables and whole grains. Avoid refined and processed foods. Drink golden milk before bed. Include seasonal fruits and maintain food freshness.',
            total_calories: 1588.9,
            total_protein: 94.6,
            total_carbs: 212.3,
            total_fat: 48.7,
            dosha_balance_score: 78,
            rasa_score: 84,
            digestibility_score: 87,
            status: 'Completed',
            created_at: new Date('2024-01-10').toISOString(),
            updated_at: new Date('2024-02-15').toISOString(),
        }
    ];

    await db.insert(diet_charts).values(sampleDietCharts);
    
    console.log('✅ Diet charts seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});