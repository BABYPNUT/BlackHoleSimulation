"use client"

import dynamic from "next/dynamic"

const BlackHoleScene = dynamic(() => import("@/components/black-hole-scene"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-screen bg-[#000003] flex items-center justify-center">
      <div className="text-white text-lg opacity-80">Loading simulation...</div>
    </div>
  ),
})

export default function Page() {
  return <BlackHoleScene />
}
