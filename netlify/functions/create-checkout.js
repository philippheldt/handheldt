// netlify/functions/create-checkout.js
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event, context) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Methode nicht erlaubt." };
  }

  try {
    const { items } = JSON.parse(event.body);

    const line_items = items.map((item) => {
      return {
        price: item.priceId, // Deine Stripe Price-ID
        quantity: item.quantity,
        // 🔥 HIER IST DIE MAGIE:
        // Das erlaubt dem Kunden, die Anzahl bei Stripe zu ändern oder das Produkt zu löschen (Minimum 0)
        adjustable_quantity: {
          enabled: true,
          minimum: 0,
          maximum: 99,
        },
      };
    });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: line_items,
      mode: "payment",
      success_url: `${process.env.URL}/success.html`,
      cancel_url: `${process.env.URL}/cancel.html`,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ url: session.url }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
