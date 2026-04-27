"use client";

import Sidebar from "@/components/Sidebar";
import ChatSidebar from "@/components/chat/ChatSidebar";
import ChatInterface from "@/components/chat/ChatInterface";
import { motion } from "framer-motion";
import { useDashboard } from "@/context/DashboardContext";

export default function AgentPage() {
  const { isSidebarCollapsed } = useDashboard();

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      
      <main 
        className="flex-1 flex transition-all duration-300"
        style={{ marginLeft: isSidebarCollapsed ? "100px" : "300px" }}
      >
        <div className="flex-1 p-6 flex gap-6 h-screen overflow-hidden">
           <ChatSidebar />
           <ChatInterface />
        </div>
      </main>

      {/* Decorative Background Elements */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-[10%] right-[10%] w-[500px] h-[500px] bg-erani-blue/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[10%] left-[20%] w-[500px] h-[500px] bg-erani-purple/5 blur-[120px] rounded-full" />
      </div>
    </div>
  );
}
