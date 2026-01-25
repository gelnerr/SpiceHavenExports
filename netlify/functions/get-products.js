// netlify/functions/get-products.js

const { createClient } = require('@supabase/supabase-js');

// These environment variables will be set in your Netlify project settings.
// DO NOT hardcode these values here.
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

// Create a Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

exports.handler = async function(event, context) {
    try {
        // Fetch all data from the 'products' table
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .order('created_at', { ascending: false }); // Show newest first

        if (error) {
            throw error;
        }

        // Return a successful response with the product data
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*' // Allow requests from any origin
            },
            body: JSON.stringify(data),
        };
    } catch (error) {
        console.error('Error fetching products:', error);
        // Return an error response
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to fetch products' }),
        };
    }
};