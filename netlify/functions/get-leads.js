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
  const danhBaTableId = process.env.NOCODB_TABLE_DANHBA;
  const khaoSatTableId = process.env.NOCODB_TABLE_ID;
  if (!apiToken || !danhBaTableId || !khaoSatTableId) {
    return json(500, { error: "NocoDB env vars missing" });
  }

  const url = new URL(req.url);
  const maTV = (url.searchParams.get("gsv") || "").trim().toUpperCase();
  const sdt = (url.searchParams.get("sdt") || "").trim();
  if (!maTV || !sdt) {
    return json(400, { error: "Thiếu gsv hoặc sdt" });
  }

  try {
    const whereGsv = encodeURIComponent(`(Ma_TV,eq,${maTV})~and(Active,eq,true)`);
    const gsvRes = await fetch(
      `https://app.nocodb.com/api/v2/tables/${danhBaTableId}/records?where=${whereGsv}&limit=25`,
      { headers: { "xc-token": apiToken } }
    );
    if (!gsvRes.ok) {
      const errText = await gsvRes.text();
      return json(500, { error: errText });
    }
    const gsvData = await gsvRes.json();
    const gsvRecords = gsvData?.list || [];
    if (gsvRecords.length === 0) {
      return json(404, { error: "Không tìm thấy GSV" });
    }
    // Ma_TV co the dung chung cho 2 nguoi (vo chong) -> sdt khop voi 1 trong 2 la du
    const matched = gsvRecords.some((r) => (r.SDT || "").trim() === sdt);
    if (!matched) {
      return json(403, { error: "Số điện thoại không khớp" });
    }

    const whereLeads = encodeURIComponent(`(ma_link,eq,${maTV})`);
    const leadsRes = await fetch(
      `https://app.nocodb.com/api/v2/tables/${khaoSatTableId}/records?where=${whereLeads}&sort=-thoi_gian`,
      { headers: { "xc-token": apiToken } }
    );
    if (!leadsRes.ok) {
      const errText = await leadsRes.text();
      return json(500, { error: errText });
    }
    const leadsData = await leadsRes.json();
    const leads = (leadsData?.list || []).map((r) => ({
      ho_ten: r.ho_ten,
      so_dien_thoai: r.so_dien_thoai,
      tuoi: r.tuoi,
      muc_tieu: r.muc_tieu,
      thoi_gian: r.thoi_gian,
    }));
    return json(200, { total: leads.length, leads });
  } catch (err) {
    return json(500, { error: err.message });
  }
};
