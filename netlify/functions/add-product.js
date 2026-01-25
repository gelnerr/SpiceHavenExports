// netlify/functions/add-product.js

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

exports.handler = async function(event, context) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const token = event.headers.authorization?.split(' ')[1];
        if (!token) {
            return { statusCode: 401, body: 'Unauthorized: No token provided' };
        }

        const supabase = createClient(supabaseUrl, supabaseAnonKey);
        const { data: { user }, error: userError } = await supabase.auth.getUser(token);

        if (userError || !user) {
            return { statusCode: 401, body: 'Unauthorized: Invalid token' };
        }

        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

        const { name, description, price, unit, image_url } = JSON.parse(event.body);

        if (!name) {
            return { statusCode: 400, body: 'Bad Request: Product name is required' };
        }

        const { data: newProduct, error: insertError } = await supabaseAdmin
            .from('products')
            .insert([{ name, description, price, unit, image_url }])
            .select()
            .single();

        if (insertError) {
            throw insertError;
        }

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newProduct),
        };

    } catch (error) {
        console.error('Error adding product:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: `Failed to add product: ${error.message}` }),
        };
    }
};
