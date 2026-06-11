import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const PORT = 3000;

// Lazy initialization of Gemini client to support dynamic customer API keys
function getGeminiClient(customApiKey?: string): GoogleGenAI {
  const apiKey = customApiKey || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured. Please supply your API key in the configuration bar.");
  }
  return new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Robust retry wrapper to handle 503 Service Unavailable / Spikes in demand gracefully
async function generateContentWithRetry(params: any, customApiKey?: string, maxRetries = 3, initialDelay = 1000): Promise<any> {
  let attempt = 0;
  while (true) {
    try {
      const ai = getGeminiClient(customApiKey);
      return await ai.models.generateContent(params);
    } catch (error: any) {
      attempt++;
      const errorStr = JSON.stringify(error) || error.message || "";
      const isTransient = 
        error.status === 503 || 
        error.status === 429 ||
        error.code === 503 ||
        error.code === 429 ||
        errorStr.includes("503") ||
        errorStr.includes("429") ||
        errorStr.includes("UNAVAILABLE") ||
        errorStr.includes("RESOURCE_EXHAUSTED") ||
        errorStr.toLowerCase().includes("high demand") ||
        errorStr.toLowerCase().includes("temporary");

      if (isTransient && attempt < maxRetries) {
        const delay = initialDelay * Math.pow(2, attempt - 1);
        console.warn(`Gemini generation transient error (attempt ${attempt}/${maxRetries}): ${error.message || errorStr}. Retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
}

function buildSystemPromptWithCustomReference(basePrompt: string, customTemplate?: string, customDocLink?: string): string {
  let prompt = basePrompt;
  if (customTemplate && customTemplate.trim()) {
    // If there is custom template, state that the AI MUST strictly follow this template
    prompt += `\n\n=== QUY ĐỊNH PHONG CÁCH & KHUNG MẪU KỊCH BẢN THAM CHIẾU CỦA KHÁCH HÀNG (YÊU CẦU BẮT BUỘC) ===\nBạn PHẢI biên soạn, viết kịch bản video hoặc phản hồi dựa theo đúng cấu trúc phân đoạn, phân chia vai trò, phong cách học thuật và cách định dạng của khung kịch bản mẫu sau đây của khách hàng:\n\n${customTemplate.trim()}\n\n=== KẾT THÚC YÊU CẦU MẪU THAM CHIẾU ===`;
  }
  if (customDocLink && customDocLink.trim()) {
    prompt += `\n\n=== ĐƯỜNG DẪN FILE TÀI LIỆU SÁNG TÁC / HỌC FORMAT (.DOC) KHÁCH HÀNG ĐÍNH KÈM ===\nHãy phân tích sâu sắc, tự động học hỏi phong cách, cấu trúc kịch bản và các quy chuẩn viết từ tài liệu hoặc file .doc đính kèm dưới đây:\nLink tài liệu dắt tay: ${customDocLink.trim()}\n======================================================`;
  }
  return prompt;
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // 1. API: Check Gemini Setup Status
  app.get("/api/status", (req, res) => {
    const customApiKey = (req.headers["x-gemini-api-key"] as string) || (req.query.customApiKey as string);
    res.json({
      hasApiKey: !!customApiKey || !!process.env.GEMINI_API_KEY
    });
  });

  // 2. API: Auto-suggest whole course structure for a topic in Visual Storytelling & Pacing
  app.post("/api/suggest-structure", async (req, res) => {
    const { topic, customTemplate, customDocLink, customApiKey } = req.body;
    const resolvedApiKey = customApiKey || (req.headers["x-gemini-api-key"] as string);
    if (!topic) {
      return res.status(400).json({ error: "Vui lòng cung cấp chủ đề." });
    }

    try {
      const systemPrompt = `Bạn là Giám đốc Học thuật của **Media Duy Lâm**, chuyên gia hàng đầu về Đạo diễn hình ảnh, Biên kịch và dựng phim (Visual Storytelling và Video Pacing). Bạn giảng dạy bằng lối 'Ẩn dụ thị giác' (Visual Metaphors) lôi cuốn và đầy tính điện ảnh chứ không giảng lý thuyết suông khô cứng.
Nhiệm vụ của bạn là xây dựng cấu trúc bài giảng tối ưu cho một chủ đề được cung cấp. Bài giảng phải bao gồm từ 2 đến 3 chương mục (sections) lớn.

LƯU Ý ĐẶC BIỆT VỀ TRÌNH BÀY: Luôn chèn các dấu xuống dòng kép (\\n\\n) giữa các phân cảnh, giữa dòng mô tả (Visual: ...) và lời thoại nhân vật (Voiceover, Director...) để phần kịch bản thông thoáng, chia nhỏ các dòng thoại, tuyệt đối không viết một đoạn văn quá dài liền tù tì.

Hãy trả về kết quả định dạng JSON rành mạch gồm các chương mục bài học.`;

      const enrichedPrompt = buildSystemPromptWithCustomReference(systemPrompt, customTemplate, customDocLink);

      const response = await generateContentWithRetry({
        model: "gemini-3.5-flash",
        contents: `Gợi ý hệ thống chương mục bài giảng chi tiết về chủ đề: "${topic}"`,
        config: {
          systemInstruction: enrichedPrompt,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            description: "Mảng các chương mục bài giảng gợi ý",
            items: {
              type: Type.OBJECT,
              properties: {
                title: {
                  type: Type.STRING,
                  description: "Tiêu đề của chương mục lớn (tiếng Việt)"
                },
                videoContent: {
                  type: Type.STRING,
                  description: "Kịch bản bài giảng chi tiết (tiếng Việt) viết đúng chuẩn format Academic Director Media Duy Lâm"
                }
              },
              required: ["title", "videoContent"]
            }
          }
        }
      }, resolvedApiKey);

      const parsedData = JSON.parse(response.text || "[]");
      const mappedData = parsedData.map((item: any) => ({
        title: item.title,
        coreKnowledge: "",
        videoContent: item.videoContent
      }));

      res.json({ success: true, sections: mappedData });
    } catch (error: any) {
      console.error("Gemini Suggest Structure Error:", error);
      // Graceful fallback with high-quality default content when Gemini is unavailable / key is missing or overloaded (503)
      return res.json({
        success: true,
        isFallback: true,
        message: "Hệ thống tự động sử dụng lộ trình mẫu bài giảng phễu YouTube chất lượng cao do kết nối của bạn hoặc máy chủ Gemini đang bận.",
        sections: [
          {
            title: `Chương 1: Quy Tắc 1/3 Nâng Cao & Ngôn Ngữ Không Gian`,
            coreKnowledge: "",
            videoContent: `Chào bạn, tôi là Giám đốc Học thuật của **Media Duy Lâm**. Rất vui được đồng hành cùng bạn trong hành trình nâng cấp tư duy kể chuyện hình ảnh.

Dưới đây là kịch bản chi tiết cho video YouTube thuộc chuỗi **Visual Storytelling Foundation**, tập trung vào việc biến một kỹ thuật cơ bản thành một công cụ kể chuyện đầy ẩn dụ.

---

# KỊCH BẢN VIDEO: QUY TẮC 1/3 NÂNG CAO & NGHỆ THUẬT ẨN DỤ (VISUAL METAPHOR)

**Người trình bày:** Academic Director – Media Duy Lâm
**Thời lượng dự kiến:** 6-8 phút.

---

### PHẦN 1: THE CINEMATIC HOOK (0:00 - 1:15)

**(Visual: Khung hình đen hoàn toàn. Một tiếng tích tắc đồng hồ. Sau đó, một khung hình xuất hiện: Một người đàn ông ngồi cô độc ở 1/3 góc dưới bên trái, xung quanh là khoảng không mênh mông chiếm 2/3 còn lại. Ánh sáng gắt đổ bóng dài.)**

**Voiceover:** 
Bạn được dạy rằng: "Hãy đặt chủ thể vào các điểm giao nhau để ảnh trông cân đối hơn." 
Nhưng nếu mục đích của chúng ta không phải là sự "cân đối"? Nếu chúng ta muốn khán giả cảm thấy sự ngột ngạt, sự cô độc, hay một nỗi sợ vô hình đang bủa vây nhân vật?

Đó là lúc bạn cần bước ra khỏi định nghĩa cơ bản của sách giáo khoa. Quy tắc 1/3 không phải là một cái lồng để nhốt chủ thể, nó là một **thước đo tâm lý**. 

Hôm nay, tại Visual Storytelling Foundation, chúng ta sẽ không học cách "đặt máy cho đúng". Chúng ta sẽ học cách dùng Quy tắc 1/3 để kiến tạo một **Ẩn dụ hình ảnh (Visual Metaphor)**.

---

### PHẦN 2: TỐI GIẢN LÝ THUYẾT (1:15 - 2:45)

**(Visual: Đồ họa Motion Graphics đơn giản, hiện lưới 3x3 lên các đoạn phim mẫu của Duy Lâm)**

**Director:** 
Nhắc lại rất nhanh: Quy tắc 1/3 chia khung hình thành 9 phần bằng nhau. 4 điểm giao nhau là "điểm vàng" thu hút thị giác. 

Nhưng ở cấp độ nâng cao, hãy quên những con số đi. Hãy tập trung vào **Không gian (Space)** mà quy tắc này tạo ra. Chúng ta có hai khái niệm chính:
1.  **Positive Space (Không gian dương):** Nơi chứa chủ thể.
2.  **Negative Space (Không gian âm):** Khoảng trống bao quanh.

Quy tắc 1/3 thực chất là bài toán về **Tỉ lệ tương quan** giữa cái hiện hữu và cái vô hình. Khi bạn dịch chuyển chủ thể sang 1/3 bên cạnh, bạn không chỉ làm "đẹp" khung hình, bạn đang trao cho khoảng trống còn lại một "quyền lực" để kể chuyện.

---

### PHẦN 3: VẬN DỤNG ẨN DỤ HÌNH ẢNH (2:45 - 5:30)

**(Visual: Chia màn hình làm hai. Một bên là quy tắc 1/3 thông thường, một bên là cách áp dụng ẩn dụ)**

**Director:** 
Hãy xem cách chúng ta biến đường kẻ thành ngôn ngữ ẩn dụ qua 3 ví dụ kinh điển:

**1. Ẩn dụ về Sự Áp Chế (The Oppression):**
Thay vì đặt mắt nhân vật ở đường kẻ 1/3 phía trên, hãy dìm họ xuống sát đường kẻ 1/3 phía dưới. 
*   **Kết quả:** Khoảng trống 2/3 phía trên đầu (Headroom quá lớn) trở thành một "áp lực vô hình" của xã hội, của số phận đang đè nặng lên vai nhân vật. Đây là ẩn dụ cho sự thấp bé và bất lực.

**2. Ẩn dụ về Tương Lai & Quá Khứ (Looking Space):**
*   Nếu nhân vật nhìn vào khoảng trống rộng (2/3 khung hình): Đó là ẩn dụ của sự tự do, hy vọng hoặc một hành trình dài phía trước.
*   Nhưng nếu bạn đặt họ sát mép khung hình và nhìn vào "bức tường" gần nhất (Short-siding): Bạn đang tạo ra một ẩn dụ về sự bế tắc, hoài nghi hoặc một bí mật đang bị che giấu ngay sau lưng họ.

**3. Ẩn dụ về Sự Cô Lập (The Isolation):**
Sử dụng các điểm giao nhau ở góc xa nhất của khung hình, đồng thời kết hợp với các đường dẫn (Leading lines) không hướng về phía nhân vật. 
*   **Kết quả:** Quy tắc 1/3 lúc này đóng vai trò tách biệt chủ thể ra khỏi dòng chảy của thế giới xung quanh. Nhân vật hiện diện ở đó, nhưng không thuộc về đó.

---

### PHẦN 4: LỒNG GHÉP CTA (5:30 - Kết thúc)

**(Visual: Director xuất hiện trực tiếp trước ống kính, hậu trường là một buổi chấm bài thực tế, màn hình đang chỉnh sửa timeline Premiere/DaVinci)**

**Director:** 
Bạn thấy đấy, hiểu về quy tắc 1/3 chỉ mất 5 phút. Nhưng để biết khi nào cần "phá" nó, khi nào cần nén không gian để tạo ra một ẩn dụ khiến người xem phải rùng mình, đó lại là một câu chuyện khác về **Cảm quan (Feeling)** và **Nhịp điệu (Pacing)**.

Những gì tôi vừa chia sẻ chỉ là bề nổi của một tảng băng chìm trong thế giới Visual Storytelling. Trong điện ảnh, một khung hình đẹp là chưa đủ, nó phải là một khung hình "biết nói" trong một dòng chảy thời gian chính xác.

Nếu bạn đang cảm thấy mình có kỹ thuật nhưng hình ảnh vẫn "rỗng", thiếu hồn, hoặc bạn loay hoay không biết nhịp cắt của mình đã đủ để truyền tải ẩn dụ hay chưa... 

...Hãy tham gia **Gói Subscription Đồng Hành của Duy Lâm**. 

Tại đây, không có những bài giảng lý thuyết khô khan lặp lại. Bạn sẽ được:
*   Tôi trực tiếp chữa bài 1-1 trên chính sản phẩm của bạn.
*   Căn chỉnh từng frame hình, tinh chỉnh Pacing để đạt được sự tinh tế trong ẩn dụ.
*   Đào tạo tư duy chiều sâu thay vì chỉ là kỹ thuật bấm máy.

Link đăng ký tôi để ngay dưới phần mô tả. Đừng chỉ học cách nhìn, hãy học cách kể.
Tôi là Giám đốc học thuật tại Media Duy Lâm. Hẹn gặp lại bạn trong những buổi chữa bài chuyên sâu.

**(Visual: Logo Media Duy Lâm hiện lên. Nhạc outro cinematic sang trọng.)**`
          }
        ]
      });
    }
  });

  // 3. API: Generate or Expand specific Card Content
  app.post("/api/generate-card", async (req, res) => {
    const { title, details, customTemplate, customDocLink, customApiKey } = req.body;
    const resolvedApiKey = customApiKey || (req.headers["x-gemini-api-key"] as string);
    if (!title) {
      return res.status(400).json({ error: "Vui lòng cung cấp tiêu đề bài học." });
    }

    try {
      const systemPrompt = `Bạn là Giám đốc Học thuật của **Media Duy Lâm**, chuyên gia hàng đầu về Đạo diễn hình ảnh, Biên kịch và dựng phim (Visual Storytelling và Video Pacing). Bạn giảng dạy bằng lối 'Ẩn dụ thị giác' (Visual Metaphors) lôi cuốn và đầy tính điện ảnh.
Luôn chú trọng dùng các dấu xuống dòng kép (\\n\\n) để phân tách rõ ràng, ngắn gọn giữa các phần, phân chia các câu thoại của Voiceover/Director và các chỉ dẫn Visual, không để kịch bản bị dính liền thành đoạn văn quá dài dồn dập.
Dựa vào tiêu đề bài học và mô tả bổ sung (nếu có), hãy viết kịch bản bài học (Lesson Lecture Script) sâu sắc, lôi cuốn theo ĐÚNG HOÀN TOÀN cấu trúc kịch bản học thuật của Media Duy Lâm:

Chào bạn, tôi là Giám đốc Học thuật của **Media Duy Lâm**. Rất vui được đồng hành cùng bạn trong hành trình nâng cấp tư duy kể chuyện hình ảnh.

Dưới đây là kịch bản chi tiết cho video YouTube thuộc chuỗi **Visual Storytelling Foundation**, tập trung vào việc biến một kỹ thuật cơ bản thành một công cụ kể chuyện đầy ẩn dụ.

---

# KỊCH BẢN VIDEO: [TÊN BÀI HỌC VIẾT IN HOA]

**Người trình bày:** Academic Director – Media Duy Lâm
**Thời lượng dự kiến:** 6-8 phút.

---

### PHẦN 1: THE CINEMATIC HOOK (0:00 - 1:15)

**(Visual: [Mô tả chi tiết phân cảnh mở đầu đầy nghệ thuật điện ảnh, sử dụng góc máy trung, cận hoặc cận cực, hiệu ứng ánh sáng và âm thanh])**

**Voiceover:** 
[Lời thoại lôi cuốn khơi mở vấn đề kịch tính, chứa đựng các tư duy bùng nổ, tránh dùng lời chào tẻ nhạt]

---

### PHẦN 2: TỐI GIẢN LÝ THUYẾT (1:15 - 2:45)

**(Visual: [Mô tả đồ họa chuyển cảnh Motion Graphics hoặc minh họa đoạn phim mẫu])**

**Director:** 
[Tóm tắt lý thuyết cốt lõi cực kỳ tinh giản, dễ tiếp cận, tập trung vào phần cảm nhận không gian và nhịp độ]

---

### PHẦN 3: VẬN DỤNG ẨN DỤ HÌNH ẢNH (2:45 - 5:30)

**(Visual: [Mô tả cụ thể sự áp dụng ẩn dụ gợi ý bằng đồ vật thường nhật làm mỏ neo ghi nhớ])**

**Director:**
[Giải thích 2-3 ví dụ cụ thể bộc lộ ẩn dụ thị giác sắc sảo, tích hợp bối cảnh, chuyển động camera và âm thanh sfx]

---

### PHẦN 4: LỒNG GHÉP CTA (5:30 - Kết thúc)

**(Visual: Director xuất hiện trực tiếp trước ống kính, hậu trường là một buổi chấm bài thực tế, màn hình đang chỉnh sửa timeline Premiere/DaVinci)**

**Director:**
[Lời nhắn nhủ đẫm chất tư duy nghệ thuật]

...Hãy tham gia **Gói Subscription Đồng Hành của Duy Lâm**.

Tại đây, không có những bài giảng lý thuyết khô khan lặp lại. Bạn sẽ được:
*   Tôi trực tiếp chữa bài 1-1 trên chính sản phẩm của bạn.
*   Căn chỉnh từng frame hình, tinh chỉnh Pacing để đạt được sự tinh tế trong ẩn dụ.
*   Đào tạo tư duy chiều sâu thay vì chỉ là kỹ thuật bấm máy.

Link đăng ký tôi để ngay dưới phần mô tả. Đừng chỉ học cách nhìn, hãy học cách kể.
Tôi là Giám đốc học thuật tại Media Duy Lâm. Hẹn gặp lại bạn trong những buổi chữa bài chuyên sâu.

**(Visual: Logo Media Duy Lâm hiện lên. Nhạc outro cinematic sang trọng.)**

Trả về kết quả định dạng JSON.`;

      const enrichedPrompt = buildSystemPromptWithCustomReference(systemPrompt, customTemplate, customDocLink);

      const response = await generateContentWithRetry({
        model: "gemini-3.5-flash",
        contents: `Hãy sinh kịch bản bài giảng chất lượng cao cho bài: "${title}". Gợi ý bối cảnh hoặc mô tả bổ sung: "${details || 'Không có'}"`,
        config: {
          systemInstruction: enrichedPrompt,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              videoContent: {
                type: Type.STRING,
                description: "Nội dung Kịch bản bài giảng đầy đủ, chi tiết (tiếng Việt), bám sát 100% định dạng cốt lõi của Media Duy Lâm"
              }
            },
            required: ["videoContent"]
          }
        }
      }, resolvedApiKey);

      const parsedData = JSON.parse(response.text || "{}");
      res.json({
        success: true,
        coreKnowledge: "",
        videoContent: parsedData.videoContent || ""
      });
    } catch (error: any) {
      console.error("Gemini Generate Card Error:", error);
      return res.json({
        success: true,
        isFallback: true,
        coreKnowledge: "",
        videoContent: `Chào bạn, tôi là Giám đốc Học thuật của **Media Duy Lâm**. Rất vui được đồng hành cùng bạn trong hành trình nâng cấp tư duy kể chuyện hình ảnh.

Dưới đây là kịch bản chi tiết cho video YouTube thuộc chuỗi **Visual Storytelling Foundation**, tập trung vào cách bóc tách một kỹ thuật cơ bản thành một công cụ kể chuyện đầy ẩn dụ.

---

# KỊCH BẢN VIDEO: ${title.toUpperCase()}

**Người trình bày:** Academic Director – Media Duy Lâm
**Thời lượng dự kiến:** 6-8 phút.

---

### PHẦN 1: THE CINEMATIC HOOK (0:00 - 1:15)

**(Visual: Một studio sáng ấm. Director lật mở một cuốn sách mộc mạc bên bộ ấm chén nghi ngút khói trà.)**

**Voiceover:** 
Có phải bạn vẫn bận rộn đặt máy quay cho thật chuẩn chỉ, thật tròn vai? Nhưng để chạm thấu cảm xúc người xem, kỹ thuật chỉ là phần vỏ bọc bên ngoài. Cái cốt lõi tinh thần bên trong phải xuất phát từ một hình ảnh ẩn dụ kiều diễm.

---

### PHẦN 2: TỐI GIẢN LÝ THUYẾT (1:15 - 2:45)

**(Visual: Slide đồ họa vẽ tay giản dị bộc lộ ý thức chủ quan)**

**Director:** 
Chúng ta chuyển dịch từ việc xem (vision) sang hiểu (insight). Một ý tưởng khó nuốt cần được quy đổi thành sự chuyển động quen thuộc ví dụ như giọt thạch nhũ đá tan, bóng tối chênh chếch...

---

### PHẦN 3: VẬN DỤNG ẨN DỤ HÌNH ẢNH (2:45 - 5:30)

**(Visual: Lồng khung hình so sánh song song)**

**Director:** 
Hãy ứng dụng kỹ thuật bẻ gãy bút chì tượng trưng cho khai phóng tinh thần, và tiếng chuông đồng thanh tịnh làm dứt điểm những vương vấn trong tư duy người coi.

---

### PHẦN 4: LỒNG GHÉP CTA (5:30 - Kết thúc)

**(Visual: Director nở nụ cười tươi bộc lộ hậu trường làm phim tấp nập của Media Duy Lâm)**

**Director:** 
Giáo lý thì hữu hạn, nhưng tư duy sáng tạo nghệ thuật là đại dương vô biên...

...Hãy tham gia **Gói Subscription Đồng Hành của Duy Lâm**.

Tại đây, bạn sẽ được:
*   Tôi trực tiếp chữa bài 1-1 trên chính sản phẩm của bạn.
*   Căn chỉnh từng frame hình, tinh chỉnh Pacing để đạt được sự tinh tế trong ẩn dụ.
*   Đào tạo tư duy chiều sâu thay vì chỉ là kỹ thuật bấm máy.

Link đăng ký tôi để ngay dưới phần mô tả. Đừng chỉ học cách nhìn, hãy học cách kể.
Tôi là Giám đốc học thuật tại Media Duy Lâm. Hẹn gặp lại bạn trong những buổi chữa bài chuyên sâu.

**(Visual: Logo Media Duy Lâm hiện lên. Nhạc outro cinematic sang trọng.)**`
      });
    }
  });

  // 4. API: Optimize or rewrite card with a specific pacing / storytelling goal
  app.post("/api/optimize-card", async (req, res) => {
    const { videoContent, goal, customTemplate, customDocLink, customApiKey } = req.body;
    const resolvedApiKey = customApiKey || (req.headers["x-gemini-api-key"] as string);
    if (!videoContent || !goal) {
      return res.status(400).json({ error: "Thiếu kịch bản bài giảng để tối ưu hóa." });
    }

    try {
      const systemPrompt = `Bạn là biên tập viên kịch bản xuất sắc kiêm Giám đốc Học thuật tại **Media Duy Lâm**.
Hãy tối ưu hóa kịch bản bài giảng bên dưới dựa trên mục tiêu kịch tính hoặc nghệ thuật của người dùng.
ĐẶC BIỆT, bạn PHẢI duy trì và hiệu chỉnh kịch bản theo ĐÚNG định dạng cốt lõi của Media Duy Lâm (bắt đầu bằng lời ngỏ Giám đốc Học thuật, chia làm 4 phần: THE CINEMATIC HOOK, TỐI GIẢN LÝ THUYẾT, VẬN DỤNG ẨN DỤ HÌNH ẢNH, LỒNG GHÉP CTA gói Subscription Đồng hành của Duy Lâm, kết thúc bằng Outro Logo và Nhạc cinematic).
LƯU Ý CỰC KỲ QUAN TRỌNG VỀ TRÌNH BÀY: Hãy luôn tạo các dấu xuống dòng kép (\\n\\n) giữa các dòng chỉ dẫn Visual và các dòng thoại Voiceover/Director. Tuyệt đối không để dính liền tù tì thành khối văn bản quá dài; hãy phân tách rành mạch cho học viên cực kỳ dễ bám nhịp.
Hãy gia tăng mạnh mẽ tính ẩn dụ điện ảnh, chỉ dẫn máy quay chi phối cảm quan người xem.
Trả về định dạng JSON gồm kịch bản mới (videoContent) và phần giải thích ngắn gọn, súc tích (explanation).`;

      const enrichedPrompt = buildSystemPromptWithCustomReference(systemPrompt, customTemplate, customDocLink);

      const response = await generateContentWithRetry({
        model: "gemini-3.5-flash",
        contents: `Hãy tối ưu hóa kịch bản bài giảng sau theo mục tiêu yêu cầu: "${goal}"
---
KỊCH BẢN BÀI GIẢNG HIỆN TẠI:
${videoContent}`,
        config: {
          systemInstruction: enrichedPrompt,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              videoContent: {
                type: Type.STRING,
                description: "Kịch bản bài giảng mới sau khi tối ưu bám sát 100% định dạng 4 PHẦN của Media Duy Lâm"
              },
              explanation: {
                type: Type.STRING,
                description: "Giải thích tóm tắt các nâng cấp bằng tiếng Việt"
              }
            },
            required: ["videoContent", "explanation"]
          }
        }
      }, resolvedApiKey);

      const parsedData = JSON.parse(response.text || "{}");
      res.json({
        success: true,
        coreKnowledge: "",
        videoContent: parsedData.videoContent || "",
        explanation: parsedData.explanation || "Đã nâng cấp tư duy kịch bản thành công!"
      });
    } catch (error: any) {
      console.error("Gemini Optimize Card Error:", error);
      return res.json({
        success: true,
        isFallback: true,
        coreKnowledge: "",
        videoContent: `${videoContent}\n\n[Tối ưu hóa hành trình: ${goal}]\n• Bổ sung: Nâng tột độ nhịp điệu kể chuyện bằng cách cài đặt góc máy Close-up di chuyển dồn dập, đồng âm SFX nhấn chìm xung đột bối cảnh của Media Duy Lâm.`,
        explanation: `Do máy chủ Gemini đang tạm bận, hệ thống tự động gắn thêm các gợi ý điện ảnh cho mục tiêu "${goal}" ngay cuối kịch bản bài giảng của bạn.`
      });
    }
  });



  // 5. API: Specific Lesson Card Script Optimization Chat Chatbot
  app.post("/api/chat-card-optimize", async (req, res) => {
    const { messages, cardTitle, cardScript, customTemplate, customDocLink, customApiKey } = req.body;
    const resolvedApiKey = customApiKey || (req.headers["x-gemini-api-key"] as string);
    if (!cardScript || !cardTitle) {
      return res.status(400).json({ error: "Thiếu dữ liệu của bài học để tối ưu." });
    }

    try {
      const systemPrompt = `Bạn là Giám đốc Học thuật kiêm chuyên gia tư vấn Biên kịch và Pacing cao cấp tại **Media Duy Lâm**.
Bạn đang đồng hành hỗ trợ người dùng tối ưu hóa KỊCH BẢN BÀI GIẢNG (Lesson Lecture Script) có tiêu đề "${cardTitle}".
Kịch bản này được thiết kế để giảng dạy chuyên sâu, kết hợp phong phú các "Ẩn dụ thị giác" (Visual Metaphors) lôi cuốn, sinh động, dễ tiếp thu và có nhịp độ tốt.

LƯU Ý QUAN TRỌNG VỀ TRÌNH BÀY: Luôn chèn các dấu xuống dòng kép (\\n\\n) để phân đoạn rõ ràng giữa các dòng (Visual: ...) và các dòng lời dẫn thoại của Voiceover/Director. Tuyệt đối không để dính liền tù tì thành khối văn bản dồn dập.

Nhiệm vụ của bạn:
1. Trò chuyện, phản hồi các băn khoăn của người dùng về kịch bản này dưới góc nhìn điện ảnh súc tích của Media Duy Lâm.
2. Đề xuất các cải tiến đột phá: lồng ghép tư duy ẩn dụ thị giác bằng vật dụng thường nhật (ví dụ: dùng chén trà nóng, chiếc gối, ngọn nến...), chỉ dẫn camera, cỡ cảnh, nhịp pacing và âm thanh sfx phù hợp.
3. ĐẶC BIỆT: Gần cuối câu trả lời của bạn, nếu có bản thảo kịch bản giảng dạy hoàn thiện mới, hãy bọc nó kín đáo trong khối có định dạng sau:
===BẢN THẢO GỢI Ý===
Chào bạn, tôi là Giám đốc Học thuật của **Media Duy Lâm**. Rất vui được đồng hành cùng bạn trong hành trình nâng cấp tư duy kể chuyện hình ảnh.

Dưới đây là kịch bản chi tiết cho video YouTube thuộc chuỗi **Visual Storytelling Foundation**, tập trung vào việc biến một kỹ thuật cơ bản thành một công cụ kể chuyện đầy ẩn dụ.

---

# KỊCH BẢN VIDEO: [TIÊU ĐỀ VIẾT IN HOA CHI TIẾT]

**Người trình bày:** Academic Director – Media Duy Lâm
**Thời lượng dự kiến:** 6-8 phút.

---

### PHẦN 1: THE CINEMATIC HOOK (0:00 - 1:15)

**(Visual: [Mô tả chi tiết phân cảnh mở đầu đầy nghệ thuật điện ảnh, sử dụng góc máy trung, cận, hoặc siêu cận, hiệu ứng ánh sáng và âm thanh sfx cụ thể])**

**Voiceover:** 
[Lời thoại lôi cuốn khơi mở vấn đề kịch tính, chứa đựng các tư duy bùng nổ, tránh dùng lời chào tẻ nhạt]

---

### PHẦN 2: TỐI GIẢN LÝ THUYẾT (1:15 - 2:45)

**(Visual: [Mô tả đồ họa chuyển động Motion Graphics đơn giản hoặc minh họa đoạn phim mẫu của Duy Lâm])**

**Director:** 
[Tóm tắt lý thuyết cốt lõi một cách cực kỳ tinh giản, dễ tiếp cận, tập trung vào phần cảm nhận không gian và nhịp độ]

---

### PHẦN 3: VẬN DỤNG ẨN DỤ HÌNH ẢNH (2:45 - 5:30)

**(Visual: [Mô tả so sánh sự áp dụng ẩn dụ thị giác bằng đồ vật quen thuộc hàng ngày])**

**Director:**
[Giải thích chi tiết 2-3 ví dụ ẩn dụ thị giác cụ thể liên kết chặt chẽ với bài học, chỉ rõ bối cảnh quay, chuyển động camera, cỡ cảnh và âm thanh sfx hỗ trợ]

---

### PHẦN 4: LỒNG GHÉP CTA (5:30 - Kết thúc)

**(Visual: Director xuất hiện trực tiếp trước ống kính, hậu trường là một buổi chấm bài thực tế, màn hình đang chỉnh sửa timeline Premiere/DaVinci)**

**Director:**
[Lời khuyên nhủ sâu rộng về cảm quan nghệ thuật thay vì chỉ nắm kỹ thuật thô sơ]

...Hãy tham gia **Gói Subscription Đồng Hành của Duy Lâm**.

Tại đây, không có những bài giảng lý thuyết khô khan lặp lại. Bạn sẽ được:
*   Tôi trực tiếp chữa bài 1-1 trên chính sản phẩm của bạn.
*   Căn chỉnh từng frame hình, tinh chỉnh Pacing để đạt được sự tinh tế trong ẩn dụ.
*   Đào tạo tư duy chiều sâu thay vì chỉ là kỹ thuật bấm máy.

Link đăng ký tôi để ngay dưới phần mô tả. Đừng chỉ học cách nhìn, hãy học cách kể.
Tôi là Giám đốc học thuật tại Media Duy Lâm. Hẹn gặp lại bạn trong những buổi chữa bài chuyên sâu.

**(Visual: Logo Media Duy Lâm hiện lên. Nhạc outro cinematic sang trọng.)**
===HẾT BẢN THẢO===
để hệ thống có thể giúp người dùng bấm "Áp dụng" ghi đè nhanh lên kịch bản hiện tại!

Hãy hồi đáp bằng Tiếng Việt tinh tế, biểu đạt trực quan và dễ hiểu.`;

      const formattedMessages = (messages || []).map((msg: any) => ({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.content }]
      }));

      // Injects the current script context into model
      formattedMessages.unshift({
        role: "user",
        parts: [{ text: `Kịch bản hiện tại của bài học "${cardTitle}" là:\n${cardScript}\n\nHãy hướng dẫn và tối ưu hóa nó dựa trên kịch bản gốc này.` }]
      });

      const enrichedPrompt = buildSystemPromptWithCustomReference(systemPrompt, customTemplate, customDocLink);

      const response = await generateContentWithRetry({
        model: "gemini-3.5-flash",
        contents: formattedMessages,
        config: {
          systemInstruction: enrichedPrompt
        }
      }, resolvedApiKey);

      res.json({ success: true, answer: response.text });
    } catch (error: any) {
      console.error("Gemini Card Optimize Chat Error:", error);
      return res.json({
        success: true,
        isFallback: true,
        answer: `Chào bạn, máy chủ xử lý AI đang tạm bận. Dưới đây là gợi ý tối ưu ngoại tuyến cho kịch bản bài học "${cardTitle}":\n\n1. **Tạo đối thoại mâu thuẫn**: Hãy mở đầu bằng một câu phủ định gây tò mò.\n2. **Ẩn dụ chiếc tách rỗng**: Giống như triết lý chiếc tách rỗng để tiếp nhận nước mới, hãy so sánh tư duy học tập với hành động rót trà tràn cốc.\n\n===BẢN THẢO GỢI Ý===\n• Lời thoại giảng dạy:\n  - "Đừng cố nhồi nhét bài học khi tư duy của bạn đã quá chật chội. Hãy nhìn chiếc tách trà này, nếu tôi tiếp tục đổ thêm trà nóng, nó chỉ làm bỏng tay bạn mà không giữ được giọt nước tinh túy nào."\n• Ẩn dụ thị giác & phân cảnh minh họa:\n  - Cận cảnh dòng trà xanh nóng ấm đổ tràn trề qua nắp tách rỉ từng đợt sủi bọt xuống bàn gỗ sẫm.\n  - Camera: Thiết lập chế độ quay chậm 60fps góc nhìn thứ nhất (POV).\n===HẾT BẢN THẢO===`
      });
    }
  });

  // 6. API: Chat and Q&A Assistant about film pacing / storytelling
  app.post("/api/chat-assistant", async (req, res) => {
    const { messages, topic, currentSyllabus, customTemplate, customDocLink, customApiKey } = req.body;
    const resolvedApiKey = customApiKey || (req.headers["x-gemini-api-key"] as string);
    
    try {
      const systemPrompt = `Bạn là "Gemini Pacing Pro" - Trợ lý AI chuyên sâu về Kết cấu câu chuyện bằng hình ảnh (Visual Storytelling) và Nhịp điệu phim (Video Pacing).
Nhiệm vụ của bạn là tư vấn, giải đáp thắc mắc, gợi ý phân cảnh, tối ưu hóa nhịp điệu cho kịch bản của người dùng.
Chủ đề tổng quan: ${topic || "Visual Storytelling và Pacing trong video"}.
Dưới đây là sơ đồ bài giảng hiện tại của họ (để bạn bám sát tư vấn hoặc phân tích):
${JSON.stringify(currentSyllabus || [], null, 2)}

Hãy hồi đáp bằng Tiếng Việt tinh tế, truyền cảm hứng, chuyên nghiệp, đưa ra các ví dụ cụ thể của các đạo diễn nổi tiếng như Edgar Wright (nhịp nhanh, chuyển động hài hước), Christopher Nolan (dựng phi tuyến tính), Denis Villeneuve (slow-burn pacing kịch tính nhẹ nhàng), Alfred Hitchcock (tạo hồi hộp suspense). Tránh nói lý thuyết rỗng tuếch.`;

      const formattedMessages = (messages || []).map((msg: any) => ({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.content }]
      }));

      const enrichedPrompt = buildSystemPromptWithCustomReference(systemPrompt, customTemplate, customDocLink);

      const response = await generateContentWithRetry({
        model: "gemini-3.5-flash",
        contents: formattedMessages,
        config: {
          systemInstruction: enrichedPrompt
        }
      }, resolvedApiKey);

      res.json({ success: true, answer: response.text });
    } catch (error: any) {
      console.error("Gemini Chat Error:", error);
      return res.json({
        success: true,
        isFallback: true,
        answer: `Xin chào! Tôi là Trợ lý Dựng phim & Pacing. Hiện tại máy chủ xử lý AI đang quá tải tạm thời, tôi sẽ hỗ trợ phân tích thông qua bộ não ngoại tuyến của mình:\n\nĐể xây dựng kịch bản có "Pacing" xuất sắc hơn:\n\n1. **Quy tắc Edgar Wright**: Hãy kết hợp SFX (nhịp gõ, tiếng sột soạt, đóng mở cửa) trực tiếp làm động lực nhịp dựng. Ví dụ, mỗi cú quay đầu của nhân vật là một tiếng động vút mạnh (whoosh).\n2. **Kịch tính của Denis Villeneuve**: Đừng sợ các cú máy dài đơn giản (long-take). Bí quyết là giữ chuyển động tối thiểu bên trong khung hình để khán giả tập trung tối đa sự chú ý trước khi tung ra cú nổ âm thanh sấm sét.\n\nBạn muốn tìm hiểu thêm về kỹ thuật dựng hình cụ thể nào? Hãy gõ câu hỏi cho tôi xem nhé!`
      });
    }
  });

  // Serve client-side routes / assets
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server runs on http://localhost:${PORT}`);
  });
}

startServer();
