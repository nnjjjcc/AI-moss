"use client";
import React, { FC, useState } from "react";
import { getSearchUrl } from "@/app/utils/get-search-url";
import { ArrowRight, FileInput } from "lucide-react";
import { nanoid } from "nanoid";
import { useRouter } from "next/navigation";
import { Button, Modal, Upload, message } from 'antd';
import { InboxOutlined, UploadOutlined } from '@ant-design/icons';
import { UploadProps, Switch} from 'antd';

const { Dragger } = Upload;

export const Search: FC = () => {
  const [value, setValue] = useState("");
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const showModal = () => {
    setIsModalOpen(true);
  };

  const handleOk = () => {
    setIsModalOpen(false);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  const props: UploadProps = {
    name: 'file',
    multiple: true,
    customRequest: async ({ file, onSuccess, onError }) => {
      const formData = new FormData();
      formData.append('file', file);
  
      try {
        const controller = new AbortController();
        const response = await fetch('http://127.0.0.1:8080/embed', {  // 修改此处为后端接口路径
          method: 'POST',
          headers: {
            Accept: '*/*',
          },
          signal: controller.signal,
          body: formData,
        });
  
        // 检查响应状态码是否为 200
        if (response.ok) {
          const result = await response.json();
          onSuccess(result, file);
          message.success(`${file.name} file uploaded successfully.`);
        } else {
          // 如果响应状态码不是 200，抛出错误
          const errorResult = await response.json();
          throw new Error(errorResult.error || 'Upload failed');
        }
      } catch (error) {
        console.log("响应错误:", error);
        onError(error);
        message.error(`${file.name} file upload failed.`);
      }
    },
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (value) {
          console.log("[search值]", value);
          setValue("");
          router.push(getSearchUrl(encodeURIComponent(value), nanoid()));
        }
      }}
    >
      <label
        className="relative bg-white flex items-center justify-center border ring-8 ring-zinc-300/20 py-2 px-2 rounded-lg gap-2 focus-within:border-zinc-300"
        htmlFor="search-bar"
      >
        <input
          id="search-bar"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          autoFocus
          placeholder="问我任何问题..."
          className="px-2 pr-6 w-full rounded-md flex-1 outline-none bg-white"
        />
        <div>
        <Switch checkedChildren="文档" unCheckedChildren="日常" defaultChecked className="background-color:#cb83f6"/>
        </div>
        <button
          type="button"
          onClick={showModal}
          title="上传"
          className="w-auto py-1 px-2 bg-black border-black text-white fill-white active:scale-95 border overflow-hidden relative rounded-xl"
        >
          <FileInput size={16} />
        </button>
        <Modal title="上传PDF-开启你的专属文档助理" open={isModalOpen} onOk={handleOk} onCancel={handleCancel}>
          <Dragger {...props}>
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">点击或拖动文件到此区域进行上传</p>
            <p className="ant-upload-hint">
              支持单个或批量上传。严禁上传违规数据或其他被禁止的文件。
            </p>
          </Dragger>
        </Modal>
        <button
          type="submit"
          title="发送"
          className="w-auto py-1 px-2 bg-black border-black text-white fill-white active:scale-95 border overflow-hidden relative rounded-xl"
        >
          <ArrowRight size={16} />
        </button>
      </label>
    </form>
  );
};

export default Search;