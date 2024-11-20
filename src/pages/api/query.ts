// NEXT-NODE : 引入所需模块
import type { NextApiRequest, NextApiResponse } from "next";
import { Readable } from "stream";
import SerperApi from "../../utils/serper.api";

const FLASK_BACKEND_URL = "http://127.0.0.1:8080"; //  后端接口URL

/**
 * API 处理函数：处理 API 请求，从 Flask 后端获取回答，并将响应打印到控制台。
 * @param {NextApiRequest} req - 请求对象。
 * @param {NextApiResponse} res - 响应对象。
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { query, rid, model } = req.body;
  try {
    // 设置响应头并将流内容发送给客户端
    res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
    res.setHeader("Transfer-Encoding", "chunked");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("X-Accel-Buffering", "no");
    // 创建一个Readable流用于响应
    const readable = new Readable({ read() { } });
    readable.pipe(res);

    // 第一步：获取与用户问题相关的数据
    const serperData = await SerperApi(query);

    const initialPayload = createInitialPayload(query, rid, serperData);
    readable.push(initialPayload);
    
       // 第二步：请求生成回答
    const stream = await requestCompletion(query, serperData, "answer", readable, "false");

       for await (const chunk of stream) {
         console.log("");
       }
    readable.push("\n\n__RELATED_QUESTIONS__\n\n");
    const stream1 = await requestCompletion(query, serperData, "answer", readable, "true");
       
       for await (const chunk of stream1) {
         console.log("");
       }

       
       readable.push(null); // 结束流

  } catch (error) {
    console.error("从 Flask 后端获取数据时出错:", error);
    res.status(500).json({ error: "从后端获取数据时发生错误。" });
  }
}
/**
 * 请求OpenAI生成回答。
 * @param {OpenAI} openai OpenAI客户端实例。
 * @param {string} query 用户查询。
 * @param {Object[]} serperData 从SerperApi获取的数据。
 * @returns {AsyncIterableIterator<any>} OpenAI生成回答的流。
 */

async function* requestCompletion(query: string, serperData: any, type: string,readable:any,relate: string) {
  const messages = createOpenAIMessages(query, serperData, type ,relate);
  const response = await fetch(`${FLASK_BACKEND_URL}/query`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ messages }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  let done = false;
  while (!done) {
    const { value, done: readerDone } = await reader.read();
    done = readerDone;
    if (value) {
      const text = decoder.decode(value, { stream: true });
      if(relate==='false') {
        readable.push(text);
      }
      else {
        readable.push(text);
      }
      
      yield { message: text };
    }
  }
}
/**
 * 创建初始请求负载。
 * @param {string} query 用户查询。
 * @param {string} rid 请求ID。
 * @param {Object[]} serperData 从SerperApi获取的数据。
 * @returns {string} 初始请求负载。
 */
function createInitialPayload(query: string, rid: string, serperData: any) {
  return `{"query": "${query.trim()}", "rid": "${rid}", "contexts": ${JSON.stringify(serperData)}}\n\n__LLM_RESPONSE__\n\n`;
}
/**
 * 根据用户查询和相关上下文生成OpenAI请求的消息体。
 * @param {string} query 用户查询。
 * @param {Object[]} serperData 相关上下文数据。
 * @returns {Object[]} OpenAI请求的消息体。
 */
function createOpenAIMessages(query: string, serperData: any, type: any, relate: string): any {
  const systemMessageContent =
    type === "answer"
      ? generateSystemMessageContent(serperData)
      : generateRelatedMessageContent(serperData);
  return [
    { role: "system", content: systemMessageContent },
    { role: "user", content: query },
    { role: "relate", content: relate },
  ];
}
/**
 * 回答部分Prompt
 * @param {Object[]} serperData 相关上下文数据。
 * @returns {string} 系统消息内容。
 */
function generateSystemMessageContent(serperData: any) {
  return `

  ${serperData.map((c: any) => c.snippet).join("\n\n")}

  这是你可以参考的信息，最终使用中文给出答案 `;
}

/**
 * 相关问题的Prompt
 * @param {Object[]} serperData 相关上下文数据。
 * @returns {string} 系统消息内容。
 */
function generateRelatedMessageContent(serperData: any) {
  return `
  You are a helpful assistant that helps the user to ask related questions, based on user's original question and the related contexts. Please identify worthwhile topics that can be follow-ups, and write questions no longer than 20 words each. Please make sure that specifics, like events, names, locations, are included in follow up questions so they can be asked standalone. For example, if the original question asks about "the Manhattan project", in the follow up question, do not just say "the project", but use the full name "the Manhattan project". Your related questions must be in the same language as the original question.
  
  Here are the contexts of the question:

  ${serperData.map((c: any) => c.snippet).join("\n\n")}

  Remember, based on the original question and related contexts, suggest three such further questions. Do NOT repeat the original question. Each related question should be no longer than 20 words. Here is the original question:
  `;
}

async function generateRelatedQuestions(
  query: string,
  serperData: any,
) {
  const chatCompletion = await requestCompletion(query,serperData,"relate")
  return transformString(chatCompletion.choices[0].message.content);
}

/**
 * 工具函数：将字符串按行分割，并转换为问题对象数组。
 * @param {any} str 待转换的字符串。
 * @returns {Object[]} 转换后的问题对象数组。
 */
function transformString(str: any) {
  return str.split("\n").map((line: any) => ({ question: line }));
}
