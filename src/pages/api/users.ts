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
        const { id } = req.query;
        
        // Get single user by ID
        if (id) {
            const { data: user, error } = await supabase
                .from('users')
                .select('*, devices:device_authorizations(*)')
                .eq('id', id)
                .single();

            if (error) return res.status(500).json({ error: error.message });
            return res.status(200).json(user);
        }
        
        // List all users with their devices
        const { data: users, error } = await supabase
            .from('users')
            .select('*, devices:device_authorizations(*)')
            .order('name', { ascending: true });

        if (error) return res.status(500).json({ error: error.message });
        return res.status(200).json(users);
    }

    else if (req.method === 'POST') {
        // Create user
        const { name, role, works_saturday, part_time, work_start_time, work_end_time } = req.body;
        if (!name || !role) {
            return res.status(400).json({ error: 'Name and role are required' });
        }

        const { data, error } = await supabase
            .from('users')
            .insert({ 
                name, 
                role,
                works_saturday: works_saturday || false,
                part_time: part_time || false,
                work_start_time: part_time ? work_start_time : null,
                work_end_time: part_time ? work_end_time : null
            })
            .select()
            .single();

        if (error) return res.status(500).json({ error: error.message });
        return res.status(201).json(data);
    }

    else if (req.method === 'PUT') {
        // Update user
        const { id } = req.query;
        const { name, works_saturday, part_time, work_start_time, work_end_time } = req.body;

        if (!id || !name) {
            return res.status(400).json({ error: 'ID and name are required' });
        }

        const { data, error } = await supabase
            .from('users')
            .update({ 
                name,
                works_saturday: works_saturday || false,
                part_time: part_time || false,
                work_start_time: part_time ? work_start_time : null,
                work_end_time: part_time ? work_end_time : null
            })
            .eq('id', id)
            .select()
            .single();

        if (error) return res.status(500).json({ error: error.message });
        return res.status(200).json(data);
    }

    else if (req.method === 'DELETE') {
        // Delete user (need to delete records first due to foreign key constraint)
        const { id } = req.query;

        if (!id) {
            return res.status(400).json({ error: 'ID is required' });
        }

        // First, delete all records associated with this user
        const { error: recordsError } = await supabase
            .from('records')
            .delete()
            .eq('user_id', id);

        if (recordsError) {
            return res.status(500).json({ error: `Erro ao excluir registros: ${recordsError.message}` });
        }

        // Then, delete the user (device_authorizations will cascade delete)
        const { error } = await supabase
            .from('users')
            .delete()
            .eq('id', id);

        if (error) return res.status(500).json({ error: error.message });
        return res.status(200).json({ message: 'User deleted successfully' });
    }

    else if (req.method === 'PATCH') {
        // Remove device from user or rename device
        const { id, action } = req.query;
        const { deviceId, deviceName } = req.body;

        if (!id) {
            return res.status(400).json({ error: 'ID is required' });
        }

        if (action === 'remove-device') {
            if (!deviceId) {
                return res.status(400).json({ error: 'Device ID is required' });
            }

            // Delete from device_authorizations table
            const { error: deleteError } = await supabase
                .from('device_authorizations')
                .delete()
                .eq('user_id', id)
                .eq('device_id', deviceId);

            if (deleteError) return res.status(500).json({ error: deleteError.message });

            // Return updated user with devices
            const { data: updatedUser, error: fetchError } = await supabase
                .from('users')
                .select('*, devices:device_authorizations(*)')
                .eq('id', id)
                .single();

            if (fetchError) return res.status(500).json({ error: fetchError.message });
            return res.status(200).json(updatedUser);
        }

        if (action === 'rename-device') {
            if (!deviceId || !deviceName) {
                return res.status(400).json({ error: 'Device ID and device name are required' });
            }

            // Update device name in device_authorizations table
            const { error: updateError } = await supabase
                .from('device_authorizations')
                .update({ device_name: deviceName })
                .eq('user_id', id)
                .eq('device_id', deviceId);

            if (updateError) return res.status(500).json({ error: updateError.message });

            // Return updated user with devices
            const { data: updatedUser, error: fetchError } = await supabase
                .from('users')
                .select('*, devices:device_authorizations(*)')
                .eq('id', id)
                .single();

            if (fetchError) return res.status(500).json({ error: fetchError.message });
            return res.status(200).json(updatedUser);
        }

        return res.status(400).json({ error: 'Invalid action' });
    }

    else {
        return res.status(405).json({ error: 'Method not allowed' });
    }
}
