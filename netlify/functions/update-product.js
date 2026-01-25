// netlify/functions/update-product.js

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

        const { id, name, description, price, unit, image_url } = JSON.parse(event.body);

        if (!id) {
            return { statusCode: 400, body: 'Bad Request: Product ID is required' };
        }

        // Build update object dynamically
        const updates = {};
        if (name) updates.name = name;
        if (description !== undefined) updates.description = description;
        if (price !== undefined) updates.price = price;
        if (unit !== undefined) updates.unit = unit;
        if (image_url) updates.image_url = image_url;

        const { data: updatedProduct, error: updateError } = await supabaseAdmin
            .from('products')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (updateError) {
            throw updateError;
        }

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedProduct),
        };

    } catch (error) {
        console.error('Error updating product:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: `Failed to update product: ${error.message}` }),
        };
    }
};