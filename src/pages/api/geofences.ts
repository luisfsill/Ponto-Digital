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
        const { data, error } = await supabase
            .from('geofences')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) return res.status(500).json({ error: error.message });
        return res.status(200).json(data);
    } else if (req.method === 'POST') {
        const { name, latitude, longitude, radius } = req.body;

        if (!name || !latitude || !longitude || !radius) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const { data, error } = await supabase
            .from('geofences')
            .insert({ name, latitude, longitude, radius })
            .select()
            .single();

        if (error) return res.status(500).json({ error: error.message });
        return res.status(201).json(data);
    } else if (req.method === 'PATCH') {
        const { id } = req.query;
        const { active } = req.body;

        if (!id) {
            return res.status(400).json({ error: 'ID is required' });
        }

        const { data, error } = await supabase
            .from('geofences')
            .update({ active })
            .eq('id', id)
            .select()
            .single();

        if (error) return res.status(500).json({ error: error.message });
        return res.status(200).json(data);
    } else {
        return res.status(405).json({ error: 'Method not allowed' });
    }
}
