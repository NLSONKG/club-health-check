export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const apiToken = process.env.NOCODB_API_TOKEN;
  const tableId = process.env.NOCODB_TABLE_ID;

  if (!apiToken || !tableId) {
    return res.status(500).json({ error: 'NocoDB env vars missing' });
  }

  try {
    const body = req.body;

    // Cot that trong NocoDB dung "ket_qua-ai" (dau gach ngang), khong phai "ket_qua_ai"
    const payload = {
      ten_gsv: body.ten_gsv,
      ho_ten: body.ho_ten,
      so_dien_thoai: body.so_dien_thoai,
      tuoi: body.tuoi,
      gioi_tinh: body.gioi_tinh,
      nghe_nghiep: body.nghe_nghiep,
      can_nang: body.can_nang,
      chieu_cao: body.chieu_cao,
      bmi: body.bmi,
      muc_tieu: body.muc_tieu,
      muc_van_dong: body.muc_van_dong,
      van_de: body.van_de,
      ghi_chu: body.ghi_chu,
      "ket_qua-ai": body.ket_qua_ai,
      thoi_gian: body.thoi_gian,
      nguon: body.nguon,
    };

    const nocoRes = await fetch(
      `https://app.nocodb.com/api/v2/tables/${tableId}/records`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xc-token': apiToken,
        },
        body: JSON.stringify(payload),
      }
    );

    const data = await nocoRes.text();
    if (!nocoRes.ok) {
      return res.status(nocoRes.status).json({ error: data });
    }

    return res.status(200).json(JSON.parse(data));
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
