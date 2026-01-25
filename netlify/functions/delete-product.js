// netlify/functions/delete-product.js

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

        const { product_id } = JSON.parse(event.body);

        if (!product_id) {
            return { statusCode: 400, body: 'Bad Request: Product ID is required' };
        }

        const { error: deleteError } = await supabaseAdmin
            .from('products')
            .delete()
            .match({ id: product_id });

        if (deleteError) {
            throw deleteError;
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ message: `Product ${product_id} deleted successfully` }),
        };

    } catch (error) {
        console.error('Error deleting product:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: `Failed to delete product: ${error.message}` }),
        };
    }
};
