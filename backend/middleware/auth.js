const { supabaseAdmin, getSupabaseClient } = require('../supabase');

async function requireAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No autorizado: falta el token de autenticación' });
    }

    const token = authHeader.split(' ')[1];
    try {
        const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
        if (error || !user) {
            return res.status(401).json({ error: 'Token inválido o expirado' });
        }

        req.user = user;
        req.token = token;
        req.supabase = getSupabaseClient(token);
        next();
    } catch (err) {
        console.error('Error de autenticación:', err);
        return res.status(500).json({ error: 'Error al verificar la sesión con Supabase' });
    }
}

module.exports = { requireAuth };
