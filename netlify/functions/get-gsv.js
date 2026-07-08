const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}

export default async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: CORS_HEADERS });
  }
  if (req.method !== "GET") {
    return json(405, { error: "Method not allowed" });
  }

  const apiToken = process.env.NOCODB_API_TOKEN;
  const tableId = process.env.NOCODB_TABLE_DANHBA;
  if (!apiToken || !tableId) {
    return json(500, { error: "NocoDB env vars missing" });
  }

  const url = new URL(req.url);
  const maLink = (url.searchParams.get("gsv") || "").trim().toLowerCase();
  if (!maLink) {
    return json(400, { error: "Thiếu mã gsv" });
  }

  try {
    // Ma_Link la khoa duy nhat trong GSV_DanhBa (1 Ma_TV co the dung cho 2 nguoi)
    const where = encodeURIComponent(`(Ma_Link,eq,${maLink})~and(Active,eq,true)`);
    const res = await fetch(
      `https://app.nocodb.com/api/v2/tables/${tableId}/records?where=${where}&limit=1`,
      { headers: { "xc-token": apiToken } }
    );
    if (!res.ok) {
      const errText = await res.text();
      return json(500, { error: errText });
    }
    const data = await res.json();
    const record = data?.list?.[0];
    if (!record) {
      return json(404, { error: "Không tìm thấy GSV" });
    }
    return json(200, {
      Ho_Ten: record.Ho_Ten,
      SDT: record.SDT,
      Dia_Diem: record.Dia_Diem,
    });
  } catch (err) {
    return json(500, { error: err.message });
  }
};
