import { FC } from "react";

export const Footer: FC = () => {
  return (
    <div className="text-center flex flex-col items-center text-xs text-zinc-700 gap-1">
      <div className="text-zinc-400">
        注意：本项目基于 Lama3 系列模型和谷歌搜索, 致力于打造您的专属文档助理
      </div>
    </div>
  );
};
