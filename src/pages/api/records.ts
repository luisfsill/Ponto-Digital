import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabaseClient';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    // Check authentication for admin routes
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    if (req.method === 'GET') {
        // Join with users table to get names
        const { data, error } = await supabase
            .from('records')
            .select('*, users(name)')
            .order('timestamp', { ascending: false });

        if (error) return res.status(500).json({ error: error.message });
        return res.status(200).json(data);
    } else if (req.method === 'POST') {
        // Import records
        const { records } = req.body;
        
        if (!records || !Array.isArray(records)) {
            return res.status(400).json({ error: 'Records array is required' });
        }

        let importedCount = 0;
        const errors: string[] = [];

        for (const record of records) {
            try {
                // Find user by name
                const { data: userData, error: userError } = await supabase
                    .from('users')
                    .select('id')
                    .eq('name', record.user_name)
                    .single();

                if (userError || !userData) {
                    errors.push(`Usuário "${record.user_name}" não encontrado`);
                    continue;
                }

                // Insert record - location é opcional na importação
                const { error: insertError } = await supabase
                    .from('records')
                    .insert({
                        user_id: userData.id,
                        device_id: record.device_id || 'imported',
                        timestamp: record.timestamp,
                        record_type: record.record_type || null,
                        location: record.lat && record.lon 
                            ? { lat: record.lat, lon: record.lon, accuracy: 0 } 
                            : { lat: 0, lon: 0, accuracy: 0 }
                    });

                if (insertError) {
                    errors.push(`Erro ao inserir registro: ${insertError.message}`);
                } else {
                    importedCount++;
                }
            } catch (err) {
                errors.push(`Erro ao processar registro: ${String(err)}`);
            }
        }

        return res.status(200).json({ 
            imported: importedCount,
            total: records.length,
            errors: errors.length > 0 ? errors : undefined
        });
    } else if (req.method === 'DELETE') {
        const { id } = req.query;

        if (!id || typeof id !== 'string') {
            return res.status(400).json({ error: 'Record ID is required' });
        }

        const { error } = await supabase
            .from('records')
            .delete()
            .eq('id', id);

        if (error) return res.status(500).json({ error: error.message });
        return res.status(200).json({ success: true });
    } else {
        return res.status(405).json({ error: 'Method not allowed' });
    }
}
