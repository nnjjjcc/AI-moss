import axios from "axios";

async function SerperApi(query: any) {
  if (!query) return "";
  let data = JSON.stringify({
    q: query,
    gl: "cn",
    hl: "zh-cn",
  });

  let config = {
    method: 'post',
    url: 'https://google.serper.dev/search',
    headers: { 
      'X-API-KEY': '81c29c13a6ce8ca244c14c68e0641e6c03de1aa4', 
      'Content-Type': 'application/json'
    },
    data : data
  };

  const res = await axios(config);
  console.log("[super data]:",res)
  return res.data.organic;
}

export default SerperApi;
