import { useState, useEffect } from "react";

// ─── Constants ────────────────────────────────────────────────────────────────

const COACH_NAME = import.meta.env.VITE_COACH_NAME || "Lam Sơn";
const COACH_LOCATION = import.meta.env.VITE_COACH_LOCATION || "Rạch Giá";

const GOALS = [
  { value: "Giảm cân", label: "Giảm cân" },
  { value: "Tăng cân / tăng cơ", label: "Tăng cân / tăng cơ" },
  { value: "Cải thiện sức khỏe tổng thể", label: "Cải thiện sức khỏe tổng thể" },
  { value: "Tăng năng lượng, giảm mệt mỏi", label: "Tăng năng lượng, giảm mệt mỏi" },
];

const ACTIVITY_LEVELS = [
  { value: "Ít vận động (ngồi hầu hết thời gian)", label: "Ít vận động" },
  { value: "Nhẹ (đi bộ, việc nhà)", label: "Nhẹ (đi bộ, việc nhà)" },
  { value: "Vừa (tập 3–4 buổi/tuần)", label: "Vừa (tập 3–4 buổi/tuần)" },
  { value: "Nhiều (tập thể thao thường xuyên)", label: "Nhiều (thể thao thường xuyên)" },
];

const ISSUES = [
  { value: "Hay mệt mỏi, thiếu năng lượng", label: "Hay mệt mỏi, thiếu năng lượng" },
  { value: "Khó ngủ hoặc ngủ không sâu", label: "Khó ngủ hoặc ngủ không sâu" },
  { value: "Tiêu hóa kém (đầy bụng, táo bón)", label: "Tiêu hóa kém" },
  { value: "Da xỉn màu, tóc rụng", label: "Da xỉn màu, tóc rụng" },
  { value: "Hay bị cảm cúm, sức đề kháng kém", label: "Sức đề kháng kém" },
  { value: "Thừa cân, mỡ bụng nhiều", label: "Thừa cân, mỡ bụng nhiều" },
  { value: "Thiếu cân, gầy yếu", label: "Thiếu cân, gầy yếu" },
  { value: "Đau mỏi vai gáy, lưng (do ngồi nhiều)", label: "Đau mỏi vai gáy, lưng" },
];

const SYSTEM_PROMPT = `Bạn là trợ lý tư vấn sức khỏe sơ bộ cho Club Nutrition của Coach ${COACH_NAME}. Coach ${COACH_NAME} là Thành Viên Độc Lập Herbalife.

NHIỆM VỤ: Đọc thông tin khách tự cung cấp → phân tích sơ bộ → gợi ý hướng cải thiện.

PHONG CÁCH:
- Ấm áp, gần gũi như người bạn đã đi trước — không phán xét
- Ngắn gọn, thực tế, dùng số liệu cụ thể khi có thể
- Tiếng Việt tự nhiên, không văn hoa hoa mỹ
- KHÔNG dùng: "hành trình", "trân trọng", "đồng hành", "lan tỏa", "tâm huyết"

CẤU TRÚC TRẢ LỜI (đúng thứ tự, dùng emoji đầu mỗi mục):
1. 👋 Lời mở (1 câu ấm áp, gọi tên khách)
2. 📊 Nhận xét sơ bộ về tình trạng hiện tại (2–3 điểm cụ thể dựa trên thông tin khách cung cấp)
3. ⚡ Điều cần chú ý nhất (1 điểm ưu tiên hàng đầu)
4. 🎯 Hướng cải thiện gợi ý (2–3 bước cụ thể, thực tế)
5. 📅 CTA mềm: Mời đặt lịch đo chỉ số miễn phí với Coach ${COACH_NAME} để có kế hoạch cá nhân hóa

TUYỆT ĐỐI KHÔNG:
- Chẩn đoán bệnh hoặc đề cập tên bệnh cụ thể
- Hứa hẹn kết quả giảm cân bao nhiêu kg trong bao lâu
- Gợi ý thuốc hoặc thực phẩm chức năng cụ thể theo tên thương mại
- Tạo áp lực hoặc hù dọa về sức khỏe
- Nếu khách có dấu hiệu vấn đề y tế nghiêm trọng → nhẹ nhàng khuyên gặp bác sĩ

DISCLAIMER bắt buộc cuối phản hồi (xuống dòng, in nghiêng):
"*Phân tích này chỉ mang tính tham khảo dựa trên thông tin bạn tự cung cấp, không phải chẩn đoán y khoa. Kết quả thực tế tùy thuộc vào từng cá nhân.*"`;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function calcBMI(weight, height) {
  if (!weight || !height) return null;
  return (weight / Math.pow(height / 100, 2)).toFixed(1);
}

function bmiLabel(bmi) {
  const b = parseFloat(bmi);
  if (b < 18.5) return { text: "Thiếu cân", color: "#3B82F6" };
  if (b < 23) return { text: "Bình thường", color: "#00833D" };
  if (b < 25) return { text: "Thừa cân nhẹ", color: "#F59E0B" };
  return { text: "Thừa cân", color: "#EF4444" };
}

function buildUserPrompt(data) {
  const bmi = calcBMI(data.can_nang, data.chieu_cao);
  return `Thông tin khách hàng:
- Tên: ${data.ho_ten}
- Tuổi: ${data.tuoi} | Giới tính: ${data.gioi_tinh}
- Nghề nghiệp: ${data.nghe_nghiep || "Không cung cấp"}
- Cân nặng: ${data.can_nang}kg | Chiều cao: ${data.chieu_cao}cm | BMI ước tính: ${bmi}
- Mục tiêu: ${data.muc_tieu}
- Mức vận động: ${data.muc_van_dong}
- Vấn đề đang gặp: ${data.van_de.length ? data.van_de.join(", ") : "Không ghi rõ"}
- Ghi chú thêm: ${data.ghi_chu || "Không có"}

Hãy phân tích sức khỏe sơ bộ và gợi ý hướng cải thiện cho ${data.ho_ten}.`;
}

function formatResponse(text) {
  return text
    .split("\n")
    .map((line) => {
      if (!line.trim()) return "<br/>";
      line = line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
      line = line.replace(/\*(.*?)\*/g, "<em>$1</em>");
      return `<p>${line}</p>`;
    })
    .join("");
}

// ─── API Calls ────────────────────────────────────────────────────────────────

async function callClaudeAPI(formData) {
  const response = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1200,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: buildUserPrompt(formData) }],
    }),
  });
  if (!response.ok) throw new Error(`Claude API error: ${response.status}`);
  const data = await response.json();
  return data.content[0].text;
}

// ✅ Lưu qua serverless function — token an toàn, không lộ ra browser
async function saveToNocoDB(formData, aiResult) {
  const bmi = calcBMI(formData.can_nang, formData.chieu_cao);
  await fetch("/api/save-response", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ten_gsv: COACH_NAME,
      ho_ten: formData.ho_ten,
      so_dien_thoai: formData.so_dien_thoai,
      tuoi: parseInt(formData.tuoi),
      gioi_tinh: formData.gioi_tinh,
      nghe_nghiep: formData.nghe_nghiep || "",
      can_nang: parseFloat(formData.can_nang),
      chieu_cao: parseFloat(formData.chieu_cao),
      bmi: parseFloat(bmi),
      muc_tieu: formData.muc_tieu,
      muc_van_dong: formData.muc_van_dong,
      van_de: formData.van_de.join(", "),
      ghi_chu: formData.ghi_chu || "",
      ket_qua_ai: aiResult,
      thoi_gian: new Date().toISOString(),
      trang_thai: "chua_tu_van",
      nguon: "chatbot_web",
    }),
  });
}

async function sendTelegram(formData) {
  const botToken = import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
  const chatId = import.meta.env.VITE_TELEGRAM_CHAT_ID;
  if (!botToken || !chatId) return;
  const bmi = calcBMI(formData.can_nang, formData.chieu_cao);
  const msg = `🔔 LEAD MỚI — Club Nutrition Chatbot

👤 Tên: ${formData.ho_ten}
📱 SĐT: ${formData.so_dien_thoai}
🎂 Tuổi: ${formData.tuoi} | ${formData.gioi_tinh}
💼 Nghề: ${formData.nghe_nghiep || "Không cung cấp"}
⚖️ BMI: ${bmi} (${formData.can_nang}kg / ${formData.chieu_cao}cm)
🎯 Mục tiêu: ${formData.muc_tieu}
⚡ Vấn đề: ${formData.van_de.join(", ") || "Không ghi rõ"}
🕐 Lúc: ${new Date().toLocaleString("vi-VN")}

→ Xem NocoDB để theo dõi`;
  await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text: msg }),
  });
}

async function sendZaloNotify(formData) {
  const accessToken = import.meta.env.VITE_ZALO_ACCESS_TOKEN;
  const selfId = import.meta.env.VITE_ZALO_SELF_ID;
  if (!accessToken || !selfId) return;

  const bmi = calcBMI(formData.can_nang, formData.chieu_cao);
  const msg =
    `🔔 LEAD MỚI — Club Nutrition\n` +
    `👤 ${formData.ho_ten} | 📱 ${formData.so_dien_thoai}\n` +
    `🎂 ${formData.tuoi} tuổi | ${formData.gioi_tinh}\n` +
    `💼 ${formData.nghe_nghiep || "Không cung cấp"}\n` +
    `⚖️ BMI: ${bmi} (${formData.can_nang}kg / ${formData.chieu_cao}cm)\n` +
    `🎯 ${formData.muc_tieu}\n` +
    `⚡ ${formData.van_de.join(", ") || "Không ghi rõ"}\n` +
    `🕐 ${new Date().toLocaleString("vi-VN")}`;

  await fetch("https://openapi.zalo.me/v3.0/oa/message/cs", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "access_token": accessToken,
    },
    body: JSON.stringify({
      recipient: { user_id: selfId },
      message: { text: msg },
    }),
  });
}

// ─── Components ───────────────────────────────────────────────────────────────

function ProgressBar({ step }) {
  return (
    <div style={{ marginBottom: "24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
        <span style={{ fontSize: "13px", color: step >= 1 ? "#00833D" : "#9CA3AF", fontWeight: step === 1 ? "600" : "400" }}>
          Bước 1 — Thông tin cơ bản
        </span>
        <span style={{ fontSize: "13px", color: step >= 2 ? "#00833D" : "#9CA3AF", fontWeight: step === 2 ? "600" : "400" }}>
          Bước 2 — Tình trạng sức khỏe
        </span>
      </div>
      <div style={{ height: "6px", background: "#E5F4EC", borderRadius: "99px", overflow: "hidden" }}>
        <div
          style={{
            height: "100%",
            width: step === 1 ? "50%" : "100%",
            background: "#00833D",
            borderRadius: "99px",
            transition: "width 0.4s ease",
          }}
        />
      </div>
    </div>
  );
}

function InputField({ label, required, error, children }) {
  return (
    <div style={{ marginBottom: "16px" }}>
      <label style={{ display: "block", fontSize: "14px", fontWeight: "600", color: "#1F2937", marginBottom: "6px" }}>
        {label} {required && <span style={{ color: "#EF4444" }}>*</span>}
      </label>
      {children}
      {error && <p style={{ fontSize: "12px", color: "#EF4444", marginTop: "4px" }}>{error}</p>}
    </div>
  );
}

const inputStyle = (hasError) => ({
  width: "100%",
  padding: "10px 14px",
  border: `1.5px solid ${hasError ? "#EF4444" : "#D1FAE5"}`,
  borderRadius: "8px",
  fontSize: "15px",
  color: "#1F2937",
  background: "#fff",
  outline: "none",
  boxSizing: "border-box",
  fontFamily: "inherit",
  transition: "border-color 0.2s",
});

function TextInput({ value, onChange, placeholder, type = "text", hasError }) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        ...inputStyle(hasError),
        borderColor: hasError ? "#EF4444" : focused ? "#00833D" : "#D1FAE5",
      }}
    />
  );
}

function RadioGroup({ options, value, onChange }) {
  return (
    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
      {options.map((opt) => (
        <label
          key={opt.value}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "8px 16px",
            border: `1.5px solid ${value === opt.value ? "#00833D" : "#D1FAE5"}`,
            borderRadius: "8px",
            cursor: "pointer",
            background: value === opt.value ? "#F0FAF5" : "#fff",
            fontSize: "14px",
            fontWeight: value === opt.value ? "600" : "400",
            color: value === opt.value ? "#00833D" : "#4B5563",
            transition: "all 0.2s",
            userSelect: "none",
          }}
        >
          <input
            type="radio"
            value={opt.value}
            checked={value === opt.value}
            onChange={() => onChange(opt.value)}
            style={{ display: "none" }}
          />
          {opt.label}
        </label>
      ))}
    </div>
  );
}

function SelectInput({ options, value, onChange, placeholder, hasError }) {
  const [focused, setFocused] = useState(false);
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        ...inputStyle(hasError),
        appearance: "none",
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2300833D'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`,
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right 12px center",
        backgroundSize: "18px",
        paddingRight: "40px",
        borderColor: hasError ? "#EF4444" : focused ? "#00833D" : "#D1FAE5",
        color: value ? "#1F2937" : "#9CA3AF",
      }}
    >
      <option value="" disabled>{placeholder}</option>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  );
}

function CheckboxGroup({ options, value, onChange }) {
  const toggle = (v) => {
    if (value.includes(v)) onChange(value.filter((x) => x !== v));
    else onChange([...value, v]);
  };
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
      {options.map((opt) => {
        const checked = value.includes(opt.value);
        return (
          <label
            key={opt.value}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "8px",
              padding: "10px 12px",
              border: `1.5px solid ${checked ? "#00833D" : "#D1FAE5"}`,
              borderRadius: "8px",
              cursor: "pointer",
              background: checked ? "#F0FAF5" : "#fff",
              fontSize: "13px",
              color: checked ? "#00833D" : "#4B5563",
              fontWeight: checked ? "600" : "400",
              transition: "all 0.2s",
              userSelect: "none",
              lineHeight: "1.3",
            }}
          >
            <div
              style={{
                width: "16px",
                height: "16px",
                minWidth: "16px",
                border: `2px solid ${checked ? "#00833D" : "#D1D5DB"}`,
                borderRadius: "4px",
                background: checked ? "#00833D" : "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginTop: "1px",
              }}
            >
              {checked && (
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
            <input type="checkbox" checked={checked} onChange={() => toggle(opt.value)} style={{ display: "none" }} />
            {opt.label}
          </label>
        );
      })}
    </div>
  );
}

function LoadingDots() {
  return (
    <div style={{ display: "flex", gap: "6px", justifyContent: "center", alignItems: "center", padding: "8px 0" }}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            width: "10px",
            height: "10px",
            background: "#00833D",
            borderRadius: "50%",
            animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

function Toast({ message, show }) {
  if (!show) return null;
  return (
    <div
      style={{
        position: "fixed",
        bottom: "24px",
        left: "50%",
        transform: "translateX(-50%)",
        background: "#00833D",
        color: "#fff",
        padding: "12px 24px",
        borderRadius: "10px",
        fontSize: "14px",
        fontWeight: "600",
        boxShadow: "0 4px 20px rgba(0,131,61,0.3)",
        zIndex: 999,
        animation: "fadeIn 0.3s ease",
      }}
    >
      {message}
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function App() {
  const [step, setStep] = useState(0); // 0=hero, 1=formA, 2=formB, 3=loading, 4=result
  const [form, setForm] = useState({
    ho_ten: "", so_dien_thoai: "", tuoi: "", gioi_tinh: "", nghe_nghiep: "",
    can_nang: "", chieu_cao: "", muc_tieu: "", muc_van_dong: "", van_de: [], ghi_chu: "",
  });
  const [errors, setErrors] = useState({});
  const [aiResult, setAiResult] = useState("");
  const [toast, setToast] = useState({ show: false, message: "" });
  const [loadingMsg, setLoadingMsg] = useState("Đang phân tích thông tin của bạn...");

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [step]);

  const setField = (key) => (val) => setForm((f) => ({ ...f, [key]: val }));

  const showToast = (message) => {
    setToast({ show: true, message });
    setTimeout(() => setToast({ show: false, message: "" }), 3000);
  };

  const validateA = () => {
    const e = {};
    if (!form.ho_ten.trim()) e.ho_ten = "Vui lòng nhập họ tên";
    if (!form.so_dien_thoai.trim()) e.so_dien_thoai = "Vui lòng nhập số điện thoại";
    else if (!/^(0|\+84)[0-9]{8,10}$/.test(form.so_dien_thoai.replace(/\s/g, "")))
      e.so_dien_thoai = "Số điện thoại không hợp lệ";
    if (!form.tuoi) e.tuoi = "Vui lòng nhập tuổi";
    else if (form.tuoi < 10 || form.tuoi > 100) e.tuoi = "Tuổi không hợp lệ";
    if (!form.gioi_tinh) e.gioi_tinh = "Vui lòng chọn giới tính";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateB = () => {
    const e = {};
    if (!form.can_nang) e.can_nang = "Vui lòng nhập cân nặng";
    else if (form.can_nang < 20 || form.can_nang > 250) e.can_nang = "Cân nặng không hợp lệ";
    if (!form.chieu_cao) e.chieu_cao = "Vui lòng nhập chiều cao";
    else if (form.chieu_cao < 100 || form.chieu_cao > 250) e.chieu_cao = "Chiều cao không hợp lệ";
    if (!form.muc_tieu) e.muc_tieu = "Vui lòng chọn mục tiêu";
    if (!form.muc_van_dong) e.muc_van_dong = "Vui lòng chọn mức vận động";
    const bmi = calcBMI(form.can_nang, form.chieu_cao);
    if (bmi && (parseFloat(bmi) < 10 || parseFloat(bmi) > 60)) {
      e.can_nang = "Vui lòng kiểm tra lại cân nặng / chiều cao";
      e.chieu_cao = " ";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNextA = () => {
    if (validateA()) { setStep(2); setErrors({}); }
  };

  const handleSubmit = async () => {
    if (!validateB()) return;
    setStep(3);
    setErrors({});

    const msgs = [
      "Đang phân tích thông tin của bạn...",
      "AI đang tính toán chỉ số sức khỏe...",
      "Đang soạn gợi ý phù hợp với bạn...",
    ];
    let mi = 0;
    const interval = setInterval(() => {
      mi = (mi + 1) % msgs.length;
      setLoadingMsg(msgs[mi]);
    }, 1800);

    try {
      const result = await callClaudeAPI(form);
      clearInterval(interval);
      setAiResult(result);
      setStep(4);
      Promise.all([
        saveToNocoDB(form, result).then(() => showToast("✅ Kết quả đã được lưu lại!")).catch(() => {}),
        sendTelegram(form).catch(() => {}),
        sendZaloNotify(form).catch(() => {}),
      ]);
    } catch (err) {
      clearInterval(interval);
      setStep("error");
    }
  };

  const handleRetry = () => {
    handleSubmit();
  };

  const bmi = calcBMI(form.can_nang, form.chieu_cao);
  const bmiInfo = bmi ? bmiLabel(bmi) : null;

  return (
    <>
      {/* Header */}
      <header style={{
        background: "#00833D",
        padding: "14px 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        zIndex: 10,
        boxShadow: "0 2px 12px rgba(0,131,61,0.2)",
      }}>
        <div>
          <div style={{ color: "#fff", fontWeight: "800", fontSize: "17px", letterSpacing: "-0.3px" }}>
            Club Nutrition · {COACH_NAME} · {COACH_LOCATION}
          </div>
          <div style={{ color: "#A7F3D0", fontSize: "12px", fontWeight: "500", marginTop: "2px" }}>
            Hiểu cơ thể — Sống chủ động
          </div>
        </div>
      </header>

      <main style={{ maxWidth: "480px", margin: "0 auto", padding: "0 0 80px" }}>

        {/* Hero */}
        {step === 0 && (
          <div>
            <div style={{ padding: "32px 20px 24px", textAlign: "center" }}>
              <div style={{
                display: "inline-block",
                background: "#E8F8EF",
                color: "#00833D",
                fontSize: "12px",
                fontWeight: "700",
                padding: "5px 14px",
                borderRadius: "99px",
                marginBottom: "16px",
                letterSpacing: "0.5px",
              }}>
                MIỄN PHÍ · CHỈ 3 PHÚT
              </div>
              <h1 style={{ fontSize: "26px", fontWeight: "800", color: "#1F2937", lineHeight: "1.25", marginBottom: "14px" }}>
                Kiểm tra sức khỏe<br />
                <span style={{ color: "#00833D" }}>sơ bộ của bạn</span>
              </h1>
              <p style={{ fontSize: "15px", color: "#6B7280", lineHeight: "1.6", marginBottom: "28px" }}>
                Nhập thông tin → AI phân tích → Coach {COACH_NAME} liên hệ tư vấn chi tiết tại Club Nutrition
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "28px", textAlign: "left" }}>
                {[
                  ["📊", "Phân tích BMI và tình trạng cơ thể"],
                  ["⚡", "Gợi ý cải thiện phù hợp mục tiêu"],
                  ["📅", `Tư vấn 1-1 miễn phí với Coach ${COACH_NAME}`],
                ].map(([icon, text]) => (
                  <div key={text} style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    background: "#fff",
                    border: "1.5px solid #D1FAE5",
                    borderRadius: "10px",
                    padding: "12px 16px",
                    fontSize: "14px",
                    color: "#374151",
                    fontWeight: "500",
                  }}>
                    <span style={{ fontSize: "20px" }}>{icon}</span>
                    {text}
                  </div>
                ))}
              </div>

              <button
                onClick={() => setStep(1)}
                style={{
                  width: "100%",
                  background: "#00833D",
                  color: "#fff",
                  border: "none",
                  borderRadius: "12px",
                  padding: "16px",
                  fontSize: "17px",
                  fontWeight: "700",
                  cursor: "pointer",
                  boxShadow: "0 4px 16px rgba(0,131,61,0.3)",
                  fontFamily: "inherit",
                }}
              >
                Bắt đầu ngay →
              </button>
              <p style={{ fontSize: "12px", color: "#9CA3AF", marginTop: "12px" }}>
                Thông tin của bạn được bảo mật tuyệt đối
              </p>
            </div>
          </div>
        )}

        {/* Form 1A */}
        {step === 1 && (
          <div style={{ padding: "24px 20px" }}>
            <ProgressBar step={1} />
            <h2 style={{ fontSize: "20px", fontWeight: "700", color: "#1F2937", marginBottom: "4px" }}>
              Thông tin cơ bản
            </h2>
            <p style={{ fontSize: "14px", color: "#6B7280", marginBottom: "24px" }}>
              Giúp Coach {COACH_NAME} hiểu bạn hơn trước khi phân tích
            </p>

            <InputField label="Họ và tên" required error={errors.ho_ten}>
              <TextInput value={form.ho_ten} onChange={setField("ho_ten")} placeholder="Ví dụ: Nguyễn Thị Mai" hasError={!!errors.ho_ten} />
            </InputField>

            <InputField label="Số điện thoại" required error={errors.so_dien_thoai}>
              <TextInput value={form.so_dien_thoai} onChange={setField("so_dien_thoai")} placeholder="0912 345 678" type="tel" hasError={!!errors.so_dien_thoai} />
            </InputField>

            <InputField label="Tuổi" required error={errors.tuoi}>
              <TextInput value={form.tuoi} onChange={setField("tuoi")} placeholder="35" type="number" hasError={!!errors.tuoi} />
            </InputField>

            <InputField label="Giới tính" required error={errors.gioi_tinh}>
              <RadioGroup
                options={[{ value: "Nam", label: "Nam" }, { value: "Nữ", label: "Nữ" }]}
                value={form.gioi_tinh}
                onChange={setField("gioi_tinh")}
              />
            </InputField>

            <InputField label="Nghề nghiệp" error={errors.nghe_nghiep}>
              <input
                type="text"
                value={form.nghe_nghiep}
                onChange={(e) => setField("nghe_nghiep")(e.target.value)}
                placeholder="Văn phòng / Kinh doanh / Nội trợ / Khác"
                style={{
                  ...inputStyle(false),
                  borderColor: "#D1FAE5",
                  ime: "active",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#00833D")}
                onBlur={(e) => (e.target.style.borderColor = "#D1FAE5")}
              />
            </InputField>

            <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
              <button
                onClick={() => setStep(0)}
                style={{
                  flex: 1,
                  background: "#fff",
                  color: "#6B7280",
                  border: "1.5px solid #E5E7EB",
                  borderRadius: "12px",
                  padding: "14px",
                  fontSize: "15px",
                  fontWeight: "600",
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                ← Quay lại
              </button>
              <button
                onClick={handleNextA}
                style={{
                  flex: 2,
                  background: "#00833D",
                  color: "#fff",
                  border: "none",
                  borderRadius: "12px",
                  padding: "14px",
                  fontSize: "15px",
                  fontWeight: "700",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  boxShadow: "0 4px 12px rgba(0,131,61,0.25)",
                }}
              >
                Tiếp theo →
              </button>
            </div>
          </div>
        )}

        {/* Form 1B */}
        {step === 2 && (
          <div style={{ padding: "24px 20px" }}>
            <ProgressBar step={2} />
            <h2 style={{ fontSize: "20px", fontWeight: "700", color: "#1F2937", marginBottom: "4px" }}>
              Tình trạng sức khỏe
            </h2>
            <p style={{ fontSize: "14px", color: "#6B7280", marginBottom: "24px" }}>
              Càng chi tiết, AI phân tích càng chính xác
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "14px", fontWeight: "600", color: "#1F2937", marginBottom: "6px" }}>
                  Cân nặng (kg) <span style={{ color: "#EF4444" }}>*</span>
                </label>
                <TextInput value={form.can_nang} onChange={setField("can_nang")} placeholder="60" type="number" hasError={!!errors.can_nang} />
                {errors.can_nang && <p style={{ fontSize: "12px", color: "#EF4444", marginTop: "4px" }}>{errors.can_nang}</p>}
              </div>
              <div>
                <label style={{ display: "block", fontSize: "14px", fontWeight: "600", color: "#1F2937", marginBottom: "6px" }}>
                  Chiều cao (cm) <span style={{ color: "#EF4444" }}>*</span>
                </label>
                <TextInput value={form.chieu_cao} onChange={setField("chieu_cao")} placeholder="160" type="number" hasError={!!errors.chieu_cao} />
                {errors.chieu_cao && errors.chieu_cao !== " " && <p style={{ fontSize: "12px", color: "#EF4444", marginTop: "4px" }}>{errors.chieu_cao}</p>}
              </div>
            </div>

            {bmi && (
              <div style={{
                background: "#F0FAF5",
                border: `1.5px solid ${bmiInfo.color}22`,
                borderLeft: `4px solid ${bmiInfo.color}`,
                borderRadius: "8px",
                padding: "10px 14px",
                marginBottom: "16px",
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}>
                <span style={{ fontSize: "20px" }}>⚖️</span>
                <div>
                  <span style={{ fontSize: "13px", color: "#6B7280" }}>BMI ước tính: </span>
                  <span style={{ fontSize: "16px", fontWeight: "700", color: bmiInfo.color }}>{bmi}</span>
                  <span style={{ fontSize: "13px", color: bmiInfo.color, fontWeight: "600", marginLeft: "8px" }}>— {bmiInfo.text}</span>
                </div>
              </div>
            )}

            <InputField label="Mục tiêu chính" required error={errors.muc_tieu}>
              <SelectInput
                options={GOALS}
                value={form.muc_tieu}
                onChange={setField("muc_tieu")}
                placeholder="Chọn mục tiêu của bạn..."
                hasError={!!errors.muc_tieu}
              />
            </InputField>

            <InputField label="Mức vận động hàng ngày" required error={errors.muc_van_dong}>
              <SelectInput
                options={ACTIVITY_LEVELS}
                value={form.muc_van_dong}
                onChange={setField("muc_van_dong")}
                placeholder="Chọn mức vận động..."
                hasError={!!errors.muc_van_dong}
              />
            </InputField>

            <InputField label="Vấn đề bạn đang gặp phải" error={null}>
              <CheckboxGroup options={ISSUES} value={form.van_de} onChange={setField("van_de")} />
            </InputField>

            <InputField label="Ghi chú thêm" error={null}>
              <textarea
                value={form.ghi_chu}
                onChange={(e) => setField("ghi_chu")(e.target.value)}
                placeholder={`Anh/chị muốn Coach ${COACH_NAME} biết thêm điều gì?`}
                rows={3}
                style={{
                  ...inputStyle(false),
                  resize: "vertical",
                  lineHeight: "1.5",
                  borderColor: "#D1FAE5",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#00833D")}
                onBlur={(e) => (e.target.style.borderColor = "#D1FAE5")}
              />
            </InputField>

            <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
              <button
                onClick={() => { setStep(1); setErrors({}); }}
                style={{
                  flex: 1,
                  background: "#fff",
                  color: "#6B7280",
                  border: "1.5px solid #E5E7EB",
                  borderRadius: "12px",
                  padding: "14px",
                  fontSize: "15px",
                  fontWeight: "600",
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                ← Quay lại
              </button>
              <button
                onClick={handleSubmit}
                style={{
                  flex: 2,
                  background: "#00833D",
                  color: "#fff",
                  border: "none",
                  borderRadius: "12px",
                  padding: "14px",
                  fontSize: "15px",
                  fontWeight: "700",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  boxShadow: "0 4px 12px rgba(0,131,61,0.25)",
                }}
              >
                🔍 Phân tích ngay
              </button>
            </div>
          </div>
        )}

        {/* Loading */}
        {step === 3 && (
          <div style={{ padding: "60px 20px", textAlign: "center" }}>
            <div style={{
              width: "72px",
              height: "72px",
              background: "#E8F8EF",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
              fontSize: "32px",
            }}>
              🔬
            </div>
            <h2 style={{ fontSize: "18px", fontWeight: "700", color: "#1F2937", marginBottom: "8px" }}>
              AI đang phân tích...
            </h2>
            <p style={{ fontSize: "14px", color: "#6B7280", marginBottom: "24px" }}>{loadingMsg}</p>
            <LoadingDots />
            <p style={{ fontSize: "12px", color: "#9CA3AF", marginTop: "20px" }}>
              Thường mất 5–10 giây
            </p>
          </div>
        )}

        {/* Error */}
        {step === "error" && (
          <div style={{ padding: "60px 20px", textAlign: "center" }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>⚠️</div>
            <h2 style={{ fontSize: "18px", fontWeight: "700", color: "#1F2937", marginBottom: "8px" }}>
              Hệ thống đang bận
            </h2>
            <p style={{ fontSize: "14px", color: "#6B7280", marginBottom: "24px" }}>
              Vui lòng thử lại sau 30 giây
            </p>
            <button
              onClick={handleRetry}
              style={{
                background: "#00833D",
                color: "#fff",
                border: "none",
                borderRadius: "12px",
                padding: "14px 28px",
                fontSize: "15px",
                fontWeight: "700",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Thử lại
            </button>
          </div>
        )}

        {/* Result */}
        {step === 4 && (
          <div style={{ padding: "24px 20px" }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background: "#E8F8EF",
              border: "1.5px solid #A7F3D0",
              borderRadius: "10px",
              padding: "10px 14px",
              marginBottom: "20px",
            }}>
              <span style={{ fontSize: "18px" }}>✅</span>
              <span style={{ fontSize: "13px", color: "#00833D", fontWeight: "600" }}>
                Phân tích hoàn tất cho {form.ho_ten}
              </span>
            </div>

            {bmi && (
              <div style={{
                background: "#fff",
                border: "1.5px solid #D1FAE5",
                borderRadius: "10px",
                padding: "14px 16px",
                marginBottom: "16px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}>
                <div>
                  <p style={{ fontSize: "12px", color: "#6B7280", marginBottom: "2px" }}>Chỉ số BMI của bạn</p>
                  <p style={{ fontSize: "24px", fontWeight: "800", color: bmiInfo.color }}>{bmi}</p>
                </div>
                <div style={{
                  background: `${bmiInfo.color}15`,
                  color: bmiInfo.color,
                  padding: "6px 14px",
                  borderRadius: "99px",
                  fontSize: "13px",
                  fontWeight: "700",
                }}>
                  {bmiInfo.text}
                </div>
              </div>
            )}

            <div
              className="result-card"
              style={{
                background: "#F9FFFE",
                border: "1.5px solid #D1FAE5",
                borderLeft: "4px solid #00833D",
                borderRadius: "12px",
                padding: "20px",
                marginBottom: "20px",
                lineHeight: "1.7",
                fontSize: "15px",
                color: "#1F2937",
              }}
              dangerouslySetInnerHTML={{ __html: formatResponse(aiResult) }}
            />

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <a
                href={`tel:${import.meta.env.VITE_COACH_PHONE || "0932955313"}`}
                style={{
                  display: "block",
                  background: "#00833D",
                  color: "#fff",
                  border: "none",
                  borderRadius: "12px",
                  padding: "16px",
                  fontSize: "16px",
                  fontWeight: "700",
                  textAlign: "center",
                  textDecoration: "none",
                  boxShadow: "0 4px 16px rgba(0,131,61,0.3)",
                  fontFamily: "inherit",
                }}
              >
                📞 Gọi ngay cho Coach {COACH_NAME}
              </a>
              <div style={{ display: "flex", gap: "10px" }}>
                <a
                  href={`https://zalo.me/${(import.meta.env.VITE_COACH_PHONE || "0932955313").replace(/^0/, "84")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    flex: 1,
                    display: "block",
                    background: "#0068FF",
                    color: "#fff",
                    borderRadius: "12px",
                    padding: "14px",
                    fontSize: "15px",
                    fontWeight: "700",
                    textAlign: "center",
                    textDecoration: "none",
                    fontFamily: "inherit",
                  }}
                >
                  💬 Nhắn Zalo
                </a>
                <a
                  href={`sms:${import.meta.env.VITE_COACH_PHONE || "0932955313"}?body=Chào Coach ${COACH_NAME}, em vừa làm khảo sát sức khỏe và muốn đặt lịch tư vấn ạ!`}
                  style={{
                    flex: 1,
                    display: "block",
                    background: "#6B7280",
                    color: "#fff",
                    borderRadius: "12px",
                    padding: "14px",
                    fontSize: "15px",
                    fontWeight: "700",
                    textAlign: "center",
                    textDecoration: "none",
                    fontFamily: "inherit",
                  }}
                >
                  📱 Nhắn SMS
                </a>
              </div>
              <button
                onClick={() => { setStep(0); setForm({ ho_ten: "", so_dien_thoai: "", tuoi: "", gioi_tinh: "", nghe_nghiep: "", can_nang: "", chieu_cao: "", muc_tieu: "", muc_van_dong: "", van_de: [], ghi_chu: "" }); setAiResult(""); }}
                style={{
                  background: "#fff",
                  color: "#00833D",
                  border: "1.5px solid #00833D",
                  borderRadius: "12px",
                  padding: "14px",
                  fontSize: "15px",
                  fontWeight: "600",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  textAlign: "center",
                }}
              >
                Phân tích cho người khác
              </button>
            </div>
          </div>
        )}
      </main>

      <footer style={{
        background: "#fff",
        borderTop: "1px solid #E5E7EB",
        padding: "20px",
        textAlign: "center",
        fontSize: "12px",
        color: "#9CA3AF",
        lineHeight: "1.6",
      }}>
        <p style={{ fontWeight: "600", color: "#6B7280", marginBottom: "4px" }}>
          Club Nutrition · {COACH_NAME} · {COACH_LOCATION}
        </p>
        <p>Thông tin chỉ mang tính tham khảo, không phải chẩn đoán y khoa</p>
      </footer>

      <Toast message={toast.message} show={toast.show} />
    </>
  );
}
