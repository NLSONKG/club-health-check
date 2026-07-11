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
  const maTV = (url.searchParams.get("gsv") || "").trim().toUpperCase();
  if (!maTV) {
    return json(400, { error: "Thiếu mã gsv" });
  }

  try {
    // Ma_TV la ma Herbalife that; 1 Ma_TV co the ung voi 2 dong (vo chong chung ma)
    const where = encodeURIComponent(`(Ma_TV,eq,${maTV})~and(Active,eq,true)`);
    const res = await fetch(
      `https://app.nocodb.com/api/v2/tables/${tableId}/records?where=${where}&limit=25`,
      { headers: { "xc-token": apiToken } }
    );
    if (!res.ok) {
      const errText = await res.text();
      return json(500, { error: errText });
    }
    const data = await res.json();
    const records = data?.list || [];
    if (records.length === 0) {
      return json(404, { error: "Không tìm thấy GSV" });
    }
    // App chi hien thi thong tin GSV cho khach xem (khong dang nhap) -> lay dong dau
    // lam nguon SDT/Dia_Diem, ghep ten neu ma dung chung cho ca cap vo chong
    const first = records[0];
    const hoTen = records.map((r) => r.Ho_Ten).filter(Boolean).join(" & ");
    return json(200, {
      Ho_Ten: hoTen,
      SDT: first.SDT,
      Dia_Diem: first.Dia_Diem,
    });
  } catch (err) {
    return json(500, { error: err.message });
  }
};
