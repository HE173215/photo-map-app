/**
 * Service to interact with the Google Gemini AI API for photo description generation.
 * All operations require valid API keys and network connectivity. No mock fallbacks are used.
 */

/**
 * Generate description using Google Gemini API
 * @param {string} base64Image - Base64 encoded image data (without data:image/jpeg;base64 prefix)
 * @param {string} apiKey - Google Gemini API Key
 * @returns {Promise<string>} Generated description text
 */
export const generateImageDescription = async (base64Image, apiKey) => {
  if (!apiKey || apiKey.trim() === '') {
    throw new Error('Chưa thiết lập Gemini API Key. Vui lòng cấu hình biến EXPO_PUBLIC_GEMINI_API_KEY trong file .env.');
  }

  console.log('GeminiService: Khởi tạo kết nối tới Gemini API...');
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  try {
    console.log('GeminiService: Đang gửi request POST chứa ảnh Base64...');
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: "Hãy viết một mô tả ngắn gọn (khoảng 3-4 câu) nhưng chi tiết, sống động và đầy cảm xúc bằng tiếng Việt cho bức ảnh này. Tập trung mô tả các chủ thể, màu sắc chính và cảm nhận chung."
              },
              {
                inlineData: {
                  mimeType: "image/jpeg",
                  data: base64Image
                }
              }
            ]
          }
        ]
      })
    });

    console.log('GeminiService: Phản hồi nhận được, Status Code:', response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('GeminiService: Lỗi API Gemini trả về:', errorData);
      throw new Error(errorData.error?.message || `Lỗi HTTP! Trạng thái: ${response.status}`);
    }

    const data = await response.json();
    console.log('GeminiService: Phân tích cú pháp JSON phản hồi thành công.');
    
    // Extract description from response body
    const candidate = data.candidates?.[0];
    const textPart = candidate?.content?.parts?.[0]?.text;
    
    if (textPart) {
      return textPart.trim();
    } else {
      throw new Error('Cấu trúc dữ liệu trả về từ Gemini API không hợp lệ.');
    }
  } catch (error) {
    console.error('Error in generateImageDescription:', error);
    throw error;
  }
};
