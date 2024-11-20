import { Relate } from "@/app/interfaces/relate";
import { Source } from "@/app/interfaces/source";
import { fetchStream } from "@/app/utils/fetch-stream";
import { Console } from "console";

const LLM_SPLIT = "__LLM_RESPONSE__";
const RELATED_SPLIT = "__RELATED_QUESTIONS__";

export const parseStreaming = async (
  controller: AbortController,
  query: string,
  model: string,
  search_uuid: string,
  onSources: (value: Source[]) => void,
  onMarkdown: (value: string) => void,
  onRelates: (value: Relate[]) => void,
  onError?: (status: number) => void,
) => {
  const decoder = new TextDecoder();
  let uint8Array = new Uint8Array();
  let chunks = "";
  let sourcesEmitted = false;
  const response = await fetch(`/api/query`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "*./*",
    },
    signal: controller.signal,
    body: JSON.stringify({
      query,
      model,
      search_uuid,
    }),
  });
  if (response.status !== 200) {
    onError?.(response.status);
    return;
  }
  const markdownParse = (text: string) => {
    onMarkdown(
      text
        .replace(/\[\[([cC])itation/g, "[citation")
        .replace(/[cC]itation:(\d+)]]/g, "citation:$1]")
        .replace(/\[\[([cC]itation:\d+)]](?!])/g, `[$1]`)
        .replace(/\[[cC]itation:(\d+)]/g, "[citation]($1)"),
    );
  };
  fetchStream(
    response,
    (chunk) => {
      uint8Array = new Uint8Array([...uint8Array, ...chunk]);
      chunks = decoder.decode(uint8Array, { stream: true });
      if (chunks.includes(LLM_SPLIT)) {
        const [sources, rest] = chunks.split(LLM_SPLIT);
        if (!sourcesEmitted) {
          try {
            onSources(JSON.parse(sources).contexts);
          } catch (e) {
            onSources([]);
          }
        }
        sourcesEmitted = true;
        if (rest.includes(RELATED_SPLIT)) {
          const [md] = rest.split(RELATED_SPLIT);
          markdownParse(md);
        } else {
          markdownParse(rest);
        }
      }
    },
    () => {
      const [_, relates] = chunks.split(RELATED_SPLIT);

      try {
        // 使用正则表达式匹配 {} 中的内容
        const regex = /\{\s*"question":\s*"(.*?)"\s*\}/g;
        const matches = [];
        let match;
        while ((match = regex.exec(relates)) !== null) {
          console.log("match---",match)
          console.log("match[1]---",match[1])
          matches.push({ question: match[1] });
        }
    
        if (matches.length > 0) {
          onRelates(matches);
        } 
      } catch (e) {
        console.log("错误", e);
        onRelates([{ question: "没有" }, { question: "没有" }, { question: "没有" }]);
      }
    },
  );
};
