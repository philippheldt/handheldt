require('dotenv').config()
const Stripe = require('stripe')
const stripe = Stripe(process.env.STRIPE_SECRET_KEY)
console.log('Stripe Key:', process.env.STRIPE_SECRET_KEY)

exports.handler = async (event, context) => {
    try {
        const { price } = JSON.parse(event.body) // Price in smallest currency unit (e.g., cents)

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'eur',
                        product_data: {
                            name: 'Your Product Name', // Ensure this is defined
                        },
                        unit_amount: 2000, // Amount in cents (20.00 EUR)
                    },
                    quantity: 1, // Quantity of the product
                },
            ],
            mode: 'payment',
            success_url: 'http://localhost:8888/success',
            cancel_url: 'http://localhost:8888/cancel',
        })

        return {
            statusCode: 200,
            body: JSON.stringify({ sessionId: session.id }),
        }
    } catch (error) {
        console.error('Stripe Checkout Error:', error)
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to create Stripe session' }),
        }
    }
}
