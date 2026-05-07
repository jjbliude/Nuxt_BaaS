// h:\work\my-backend-agent\app\server\chat.ts

// 1. 定义 DeepSeek (OpenAI 兼容) 的返回结构
interface DeepSeekResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

import { serverSupabaseClient } from "#supabase/server";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const userPrompt = body.prompt;
  const db = await serverSupabaseClient(event);

  // 2. 适配 DeepSeek-V4-Flash 接口
  // 注意：在 Nuxt 3 中，通过 process.env 访问变量需要确保已加载或在 runtimeConfig 中定义
  const response = await $fetch<DeepSeekResponse>(
    "https://api.deepseek.com/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.DEEPSEEK_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: {
        model: "deepseek-v4-flash",
        messages: [
          { role: "system", content: "你是一个专业的 AI 助手。" },
          { role: "user", content: userPrompt },
        ],
        stream: false,
      },
    },
  );

  // 3. 安全提取内容
  const aiText = response.choices?.[0]?.message?.content || "AI 暂时无法回答。";

  // 4. 将 AI 的回复存入数据库
  await db.from("messages").insert([{ role: "assistant", content: aiText }]);

  return { status: "ok" };
});
