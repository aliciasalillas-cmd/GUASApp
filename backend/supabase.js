const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('⚠️ Advertencia: Variables de entorno de Supabase no configuradas en el backend.');
}

const supabaseAdmin = createClient(supabaseUrl, supabaseAnonKey);

function getSupabaseClient(accessToken) {
    if (!accessToken) return supabaseAdmin;
    return createClient(supabaseUrl, supabaseAnonKey, {
        global: {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        }
    });
}

module.exports = { supabaseAdmin, getSupabaseClient };
