import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { isInsideGeofence } from '@/lib/geofence';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { deviceId, location, ip, geofenceId } = req.body;

    if (!deviceId || !location || !location.lat || !location.lon) {
        return res.status(400).json({ error: 'Missing required data' });
    }

    try {
        // 1. Identify User by Device ID via device_authorizations table
        const { data: deviceAuth, error: deviceError } = await supabaseAdmin
            .from('device_authorizations')
            .select('user_id, users(id, name)')
            .eq('device_id', deviceId)
            .single();

        if (deviceError || !deviceAuth) {
            return res.status(401).json({ error: 'Dispositivo não reconhecido. Vincule seu dispositivo primeiro.' });
        }

        const user = deviceAuth.users as { id: string; name: string };

        let validGeofence = null;

        // 2. If geofenceId is provided (from QR Code), validate against that specific geofence
        if (geofenceId) {
            const { data: specificGeofence, error: fenceError } = await supabaseAdmin
                .from('geofences')
                .select('*')
                .eq('id', geofenceId)
                .eq('active', true)
                .single();

            if (fenceError || !specificGeofence) {
                return res.status(403).json({ error: 'Geofence não encontrada ou inativa' });
            }

            // Validate location against the specific geofence
            if (
                isInsideGeofence(
                    location.lat,
                    location.lon,
                    specificGeofence.latitude,
                    specificGeofence.longitude,
                    specificGeofence.radius
                )
            ) {
                validGeofence = specificGeofence;
            } else {
                return res.status(403).json({ 
                    error: `Você está fora da área permitida (${specificGeofence.name}). Aproxime-se do local.` 
                });
            }
        } else {
            // 3. No geofenceId provided - check all active geofences
            const { data: geofences, error: fenceError } = await supabaseAdmin
                .from('geofences')
                .select('*')
                .eq('active', true);

            if (fenceError) throw fenceError;

            if (geofences) {
                for (const fence of geofences) {
                    if (
                        isInsideGeofence(
                            location.lat,
                            location.lon,
                            fence.latitude,
                            fence.longitude,
                            fence.radius
                        )
                    ) {
                        validGeofence = fence;
                        break;
                    }
                }
            }

            if (!validGeofence) {
                return res.status(403).json({ error: 'Fora da área permitida para registro de ponto' });
            }
        }

        // 4. Record the entry
        const { error: insertError } = await supabaseAdmin.from('records').insert({
            user_id: user.id,
            device_id: deviceId,
            geofence_id: validGeofence.id,
            location: location,
            ip: ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress,
        });

        if (insertError) throw insertError;

        return res
            .status(200)
            .json({ 
                message: `Ponto registrado em ${validGeofence.name}`, 
                user: user.name,
                geofence: validGeofence.name
            });
    } catch (error) {
        console.error('Error recording point:', error);
        return res.status(500).json({ error: 'Erro interno do servidor' });
    }
}
