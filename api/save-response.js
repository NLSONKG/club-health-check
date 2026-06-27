export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const apiToken = process.env.NOCODB_API_TOKEN;
  const baseId  = process.env.NOCODB_BASE_ID;
  const tableId = process.env.NOCODB_TABLE_ID;

  if (!apiToken || !baseId || !tableId) {
    return res.status(500).json({ error: 'NocoDB env vars missing' });
  }

  try {
    const body = req.body;

    const nocoRes = await fetch(
      `https://app.nocodb.com/api/v1/db/data/noco/${baseId}/${tableId}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xc-token': apiToken,
        },
        body: JSON.stringify(body),
      }
    );

    if (!nocoRes.ok) {
      const err = await nocoRes.text();
      return res.status(500).json({ error: err });
    }

    const data = await nocoRes.json();
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}