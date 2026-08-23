const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

let supabaseAdmin = {
    auth: { getUser: async () => ({ data: { user: null }, error: new Error('Supabase no inicializado') }) },
    from: () => ({ select: () => ({ data: [], error: null }), upsert: async () => ({}), delete: () => ({ eq: () => ({}) }) })
};

if (supabaseUrl && supabaseAnonKey && supabaseUrl.startsWith('http')) {
    try {
        supabaseAdmin = createClient(supabaseUrl, supabaseAnonKey);
    } catch (e) {
        console.warn('⚠️ Error inicializando cliente Supabase:', e.message);
    }
} else {
    console.warn('⚠️ Advertencia: Variables de entorno SUPABASE_URL o SUPABASE_ANON_KEY no configuradas o vacías en el backend.');
}

function getSupabaseClient(accessToken) {
    if (!accessToken || !supabaseUrl || !supabaseAnonKey || !supabaseUrl.startsWith('http')) return supabaseAdmin;
    try {
        return createClient(supabaseUrl, supabaseAnonKey, {
            global: {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            }
        });
    } catch (e) {
        return supabaseAdmin;
    }
}

module.exports = { supabaseAdmin, getSupabaseClient };
