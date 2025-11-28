import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método não permitido' });
    }

    const { userId, deviceId, deviceName } = req.body;

    if (!userId || !deviceId) {
        return res.status(400).json({ error: 'ID do usuário ou dispositivo faltando' });
    }

    try {
        // 1. Check if user exists
        const { data: user, error: userError } = await supabaseAdmin
            .from('users')
            .select('id, name')
            .eq('id', userId)
            .single();

        if (userError || !user) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        // 2. Check if device is already bound to this user
        const { data: existingDevice } = await supabaseAdmin
            .from('device_authorizations')
            .select('id')
            .eq('user_id', userId)
            .eq('device_id', deviceId)
            .single();

        if (existingDevice) {
            return res.status(200).json({ message: 'Dispositivo já vinculado' });
        }

        // 3. Insert new device authorization
        const { error: insertError } = await supabaseAdmin
            .from('device_authorizations')
            .insert({
                user_id: userId,
                device_id: deviceId,
                device_name: deviceName || null
            });

        if (insertError) {
            throw insertError;
        }

        return res.status(200).json({ message: 'Dispositivo vinculado com sucesso' });
    } catch (error) {
        console.error('Error binding device:', error);
        return res.status(500).json({ error: 'Erro interno do servidor' });
    }
}
