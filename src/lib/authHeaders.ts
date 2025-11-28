import { supabase } from '@/lib/supabaseClient';

export async function getAuthHeaders(): Promise<Record<string, string>> {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.access_token) {
        return {};
    }

    return {
        'Authorization': `Bearer ${session.access_token}`,
    };
}
