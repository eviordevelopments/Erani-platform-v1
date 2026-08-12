"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "./AuthContext";

export interface ChatThread {
  id: string;
  organization_id: string;
  project_id: string | null;
  user_id: string;
  title: string;
  created_at: string;
}

export interface Project {
  id: string;
  name: string;
  files?: { id: string; name: string; type: string }[];
}

export interface ChatMessage {
  id: string;
  thread_id: string;
  user_id: string;
  role: 'user' | 'assistant';
  content: string;
  type: 'text' | 'image' | 'file';
  file_url: string | null;
  created_at: string;
}

interface ChatContextType {
  threads: ChatThread[];
  activeThread: ChatThread | null;
  messages: ChatMessage[];
  loadingThreads: boolean;
  loadingMessages: boolean;
  activeProjectId: string | null;
  setActiveProjectId: (id: string | null) => void;
  setActiveThreadId: (id: string | null) => void;
  createThread: (title?: string) => Promise<ChatThread | null>;
  sendMessage: (content: string, role?: 'user' | 'assistant', type?: 'text' | 'image' | 'file', fileUrl?: string | null) => Promise<void>;
  deleteThread: (id: string) => Promise<void>;
  isChatSidebarOpen: boolean;
  setIsChatSidebarOpen: (isOpen: boolean) => void;
  projects: Project[];
  selectedProjectName: string;
  setSelectedProjectName: (name: string) => void;
  needsSync: boolean;
  setNeedsSync: (sync: boolean) => void;
  loadThread: (id: string) => void;
}

const ChatContext = createContext<ChatContextType>({
  threads: [],
  activeThread: null,
  messages: [],
  loadingThreads: true,
  loadingMessages: false,
  activeProjectId: null,
  setActiveProjectId: () => {},
  setActiveThreadId: () => {},
  createThread: async () => null,
  sendMessage: async () => {},
  deleteThread: async () => {},
  isChatSidebarOpen: true,
  setIsChatSidebarOpen: () => {},
  projects: [],
  selectedProjectName: "Selecciona un Proyecto",
  setSelectedProjectName: () => {},
  needsSync: false,
  setNeedsSync: () => {},
  loadThread: () => {},
});

export const ChatProvider = ({ children }: { children: React.ReactNode }) => {
  const { profile, user } = useAuth();
  
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const activeThreadIdRef = React.useRef<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isChatSidebarOpen, setIsChatSidebarOpen] = useState(true);
  const [needsSync, setNeedsSync] = useState(false);
  
  const loadThread = (id: string) => {
    setActiveThreadId(id);
    setNeedsSync(true);
  };
  
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectName, setSelectedProjectName] = useState<string>("Selecciona un Proyecto");

  // Fetch projects
  useEffect(() => {
    if (profile?.organization_id) {
      const fetchProjects = async () => {
        const { data, error } = await supabase
          .from('audits')
          .select('id, metadata')
          .eq('organization_id', profile.organization_id)
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          const mappedProjects = data.map((d: any) => ({
            id: d.id,
            name: d.metadata?.name || 'Proyecto sin nombre',
            files: d.metadata?.files || []
          }));
          setProjects(mappedProjects);
          // Set initial only if not already set
          if (!activeProjectId) {
            setSelectedProjectName(mappedProjects[0].name);
            setActiveProjectId(mappedProjects[0].id);
          }
        }
      };
      fetchProjects();
    }
  }, [profile?.organization_id, activeProjectId]);

  // Fetch threads when profile is ready
  useEffect(() => {
    if (!profile?.organization_id || !user?.id) {
      setThreads([]);
      setLoadingThreads(false);
      return;
    }

    const fetchThreads = async () => {
      setLoadingThreads(true);
      const { data, error } = await supabase
        .from('chat_threads')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('created_at', { ascending: false });
        
      if (!error && data) {
        setThreads(data);
        if (data.length > 0 && !activeThreadId) {
          setActiveThreadId(data[0].id);
        }
      }
      setLoadingThreads(false);
    };

    fetchThreads();
  }, [profile, user]);

  // Fetch messages when activeThreadId changes
  useEffect(() => {
    activeThreadIdRef.current = activeThreadId;
    if (!activeThreadId) {
      setMessages([]);
      return;
    }

    const fetchMessages = async () => {
      setLoadingMessages(true);
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('thread_id', activeThreadId)
        .order('created_at', { ascending: true });

      if (!error && data) {
        setMessages(data);
      } else {
        setMessages([]);
      }
      setLoadingMessages(false);
    };

    fetchMessages();
  }, [activeThreadId]);

  const activeThread = threads.find(t => t.id === activeThreadId) || null;

  const createThread = async (title: string = "Nueva Conversación") => {
    if (!profile?.organization_id || !user?.id) return null;

    let insertData: any = {
      organization_id: profile.organization_id,
      user_id: user.id,
      title
    };
    
    // Only pass project_id if it's a valid string
    if (activeProjectId && activeProjectId.length > 5) {
      insertData.project_id = activeProjectId;
    }

    let { data, error } = await supabase
      .from('chat_threads')
      .insert(insertData)
      .select()
      .single();

    // Fallback if project_id column does not exist (error 42703) or UUID invalid
    if (error && (error.code === '42703' || error.message?.includes('project_id') || error.code === '22P02')) {
      const fallbackData = {
        organization_id: profile.organization_id,
        user_id: user.id,
        title
      };
      const fallbackResult = await supabase
        .from('chat_threads')
        .insert(fallbackData)
        .select()
        .single();
      data = fallbackResult.data;
      error = fallbackResult.error;
    }

    if (!error && data) {
      setThreads(prev => [data, ...prev]);
      setActiveThreadId(data.id);
      activeThreadIdRef.current = data.id;
      return data;
    } else if (error) {
      console.error("Error creating thread:", error.message || error);
    }
    return null;
  };

  const deleteThread = async (id: string) => {
    const { error } = await supabase.from('chat_threads').delete().eq('id', id);
    if (!error) {
      setThreads(prev => prev.filter(t => t.id !== id));
      if (activeThreadId === id) {
        setActiveThreadId(null);
      }
    }
  };

  const sendMessage = async (
    content: string, 
    role: 'user' | 'assistant' = 'user', 
    type: 'text' | 'image' | 'file' = 'text', 
    fileUrl: string | null = null
  ) => {
    if (!user?.id) return;
    
    // Auto-create thread if none exists
    let currentThreadId = activeThreadIdRef.current;
    if (!currentThreadId) {
      const safeContent = content || "Nueva conversación";
      const newThread = await createThread(safeContent.substring(0, 30) + "...");
      if (!newThread) return;
      currentThreadId = newThread.id;
      activeThreadIdRef.current = currentThreadId;
    }

    const newMessage = {
      thread_id: currentThreadId,
      user_id: user.id,
      role,
      content,
      type,
      file_url: fileUrl
    };

    // Optimistic UI update
    const tempId = Date.now().toString();
    setMessages(prev => [...prev, { ...newMessage, id: tempId, created_at: new Date().toISOString() } as ChatMessage]);

    const { data, error } = await supabase
      .from('chat_messages')
      .insert(newMessage)
      .select()
      .single();

    if (!error && data) {
      setMessages(prev => prev.map(m => m.id === tempId ? data : m));
    } else {
      // Revert on error
      setMessages(prev => prev.filter(m => m.id !== tempId));
      console.error("Error sending message:", error);
    }
  };

  return (
    <ChatContext.Provider value={{
      threads,
      activeThread,
      messages,
      loadingThreads,
      loadingMessages,
      activeProjectId,
      setActiveProjectId,
      setActiveThreadId,
      createThread,
      sendMessage,
      deleteThread,
      isChatSidebarOpen,
      setIsChatSidebarOpen,
      projects,
      selectedProjectName,
      setSelectedProjectName,
      needsSync,
      setNeedsSync,
      loadThread
    }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => useContext(ChatContext);
