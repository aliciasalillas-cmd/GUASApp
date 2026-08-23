const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'placeholder';

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
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
