"use client";
import { Footer } from "@/app/components/footer";
import { Logo } from "@/app/components/logo";
import { PresetQuery } from "@/app/components/preset-query";
import { Search } from "@/app/components/search";
import { Model } from "@/app/components/model";
import React from "react";

export default function Home() {
  return (
    <div className="relative min-h-screen">
    <div className="absolute inset-0 flex">

      {/* 主内容区域 */}
      <div className="flex-1 flex items-center justify-center">
        <div className="relative flex flex-col gap-8 px-4 -mt-24">
          <Logo />
          <Search />
          <div className="flex gap-2 flex-wrap justify-center">
            <PresetQuery query="🍂 用一百句文案迎接秋天" />
            <PresetQuery query="👾 制定新的offer收割计划" />
            <PresetQuery query="🦈 摸鱼必会的一百招" />
          </div>
          <Footer />
        </div>
      </div>
    </div>
  </div>
  );
}
