const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export default async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: CORS_HEADERS });
  }
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405, headers: CORS_HEADERS });
  }

  const apiToken = process.env.NOCODB_API_TOKEN;
  const tableId = process.env.NOCODB_TABLE_ID;

  if (!apiToken || !tableId) {
    return new Response(JSON.stringify({ error: "NocoDB env vars missing" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...CORS_HEADERS },
    });
  }

  try {
    const body = await req.json();

    // Cot that trong NocoDB dung "ket_qua-ai" (dau gach ngang), khong phai "ket_qua_ai"
    const payload = {
      ma_link: body.ma_link,
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
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "xc-token": apiToken,
        },
        body: JSON.stringify(payload),
      }
    );

    const data = await nocoRes.text();
    return new Response(data, {
      status: nocoRes.status,
      headers: { "Content-Type": "application/json", ...CORS_HEADERS },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...CORS_HEADERS },
    });
  }
};
