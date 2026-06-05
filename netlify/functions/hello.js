export const handler = async (event, context) => {
  return {
    statusCode: 200,
    body: JSON.stringify({ message: "Hallo von Netlify! Ich funktioniere!" }),
  };
};
