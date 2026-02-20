import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import colors from 'colors';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
    console.error(colors.red('❌ ERROR: Faltan credenciales de Supabase en el .env'));
    process.exit(1);
}

// Este cliente usa HTTPS, por lo que es "invisible" para el firewall de la empresa
export const supabase = createClient(supabaseUrl, supabaseKey);

export const testSupabaseConnection
 = async () => {
    try {
        const { data, error } = await supabase.from('usuarios').select('count').limit(1);
        if (error) throw error;
        console.log(colors.green('✅ [SUPABASE API] Conectado exitosamente vía HTTPS.'));
    } catch (err: any) {
        console.error(colors.red('❌ [SUPABASE API] Error de conexión:'), err.message);
        console.log(colors.yellow('💡 Intenta usar los datos de tu celular para descartar bloqueo total.'));
    }
};