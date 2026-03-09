import { useState, useEffect, useCallback } from "react";
import { 
  Mail, 
  Plus, 
  Trash2, 
  RefreshCw, 
  User, 
  ChevronRight, 
  Inbox, 
  Clock, 
  Search,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface Account {
  email: string;
  accountId: string;
  activeEmail: boolean;
}

interface Message {
  messageId: string;
  subject: string;
  createdAt: string;
  from: {
    address: string;
    name: string;
  };
  intro?: string;
  body?: string;
  html?: string;
}

export default function App() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [activeAccount, setActiveAccount] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAccounts = useCallback(async () => {
    try {
      const res = await fetch("/api/accounts");
      const data = await res.json();
      if (data.data && Array.isArray(data.data.accounts)) {
        setAccounts(data.data.accounts);
        const active = data.data.accounts.find((a: Account) => a.activeEmail);
        if (active) setActiveAccount(active.email);
      }
    } catch (err) {
      setError("Failed to fetch accounts");
    }
  }, []);

  const fetchMessages = useCallback(async (email: string) => {
    if (!email) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/messages/${email}`);
      const data = await res.json();
      if (data.data && Array.isArray(data.data.messages)) {
        setMessages(data.data.messages);
      }
    } catch (err) {
      setError("Failed to fetch messages");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createAccount = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/accounts/create", { method: "POST" });
      const data = await res.json();
      if (data.data) {
        await fetchAccounts();
        setActiveAccount(data.data.email);
      }
    } catch (err) {
      setError("Failed to create account");
    } finally {
      setIsLoading(false);
    }
  };

  const switchAccount = async (email: string) => {
    setIsLoading(true);
    try {
      await fetch("/api/accounts/use", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setActiveAccount(email);
      await fetchAccounts();
    } catch (err) {
      setError("Failed to switch account");
    } finally {
      setIsLoading(false);
    }
  };

  const showMessage = async (id: string) => {
    if (!activeAccount) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/messages/${activeAccount}/${id}`);
      const data = await res.json();
      if (data.data) {
        setSelectedMessage(data.data);
      }
    } catch (err) {
      setError("Failed to fetch message details");
    } finally {
      setIsLoading(false);
    }
  };

  const deleteMessage = async (id: string) => {
    if (!activeAccount) return;
    try {
      await fetch(`/api/messages/${activeAccount}/${id}`, { method: "DELETE" });
      setMessages(messages.filter(m => m.messageId !== id));
      if (selectedMessage?.messageId === id) setSelectedMessage(null);
    } catch (err) {
      setError("Failed to delete message");
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  useEffect(() => {
    if (activeAccount) {
      fetchMessages(activeAccount);
    }
  }, [activeAccount, fetchMessages]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPolling && activeAccount) {
      interval = setInterval(() => fetchMessages(activeAccount), 5000);
    }
    return () => clearInterval(interval);
  }, [isPolling, activeAccount, fetchMessages]);

  return (
    <div className="flex h-screen bg-[#E4E3E0] text-[#141414] font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-72 border-r border-[#141414] flex flex-col bg-[#E4E3E0]">
        <div className="p-6 border-b border-[#141414]">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 bg-[#141414] rounded flex items-center justify-center">
              <Mail className="text-[#E4E3E0] w-5 h-5" />
            </div>
            <h1 className="font-mono text-sm font-bold tracking-tighter uppercase">Agent Email CLI</h1>
          </div>
          
          <button 
            onClick={createAccount}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 py-3 border border-[#141414] hover:bg-[#141414] hover:text-[#E4E3E0] transition-colors font-mono text-xs uppercase tracking-widest disabled:opacity-50"
          >
            <Plus size={14} />
            Create Mailbox
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          <div className="px-2 py-1">
            <span className="font-serif italic text-[11px] opacity-50 uppercase tracking-widest">Accounts</span>
          </div>
          {accounts.map((acc) => (
            <button
              key={acc.email}
              onClick={() => switchAccount(acc.email)}
              className={`w-full flex items-center gap-3 p-3 text-left transition-all ${
                activeAccount === acc.email 
                  ? "bg-[#141414] text-[#E4E3E0]" 
                  : "hover:bg-[#141414]/5"
              }`}
            >
              <User size={16} className={activeAccount === acc.email ? "opacity-100" : "opacity-40"} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-mono truncate">{acc.email}</p>
                <p className="text-[10px] opacity-50 truncate">ID: {acc.accountId}</p>
              </div>
              {activeAccount === acc.email && <CheckCircle2 size={12} />}
            </button>
          ))}
        </div>

        <div className="p-4 border-t border-[#141414] bg-[#141414]/5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono uppercase tracking-widest opacity-50">Status</span>
            <div className="flex items-center gap-1.5">
              <div className={`w-1.5 h-1.5 rounded-full ${isPolling ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
              <span className="text-[10px] font-mono uppercase">{isPolling ? "Polling" : "Idle"}</span>
            </div>
          </div>
          <button 
            onClick={() => setIsPolling(!isPolling)}
            className="w-full py-2 border border-[#141414] text-[10px] font-mono uppercase tracking-widest hover:bg-[#141414] hover:text-[#E4E3E0] transition-colors"
          >
            {isPolling ? "Stop Polling" : "Start Auto-Refresh"}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 border-b border-[#141414] flex items-center justify-between px-6 bg-[#E4E3E0]/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Inbox size={18} />
              <span className="font-serif italic text-sm">Inbox</span>
            </div>
            <div className="h-4 w-px bg-[#141414]/20" />
            <span className="font-mono text-[11px] opacity-60 truncate max-w-[200px]">
              {activeAccount || "No active mailbox"}
            </span>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => activeAccount && fetchMessages(activeAccount)}
              disabled={isLoading || !activeAccount}
              className="p-2 hover:bg-[#141414]/5 rounded transition-colors disabled:opacity-30"
            >
              <RefreshCw size={18} className={isLoading ? "animate-spin" : ""} />
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Message List */}
          <div className="w-1/2 border-r border-[#141414] overflow-y-auto bg-[#E4E3E0]">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center opacity-30 p-12 text-center">
                <Inbox size={48} strokeWidth={1} className="mb-4" />
                <p className="font-serif italic text-lg">No messages found</p>
                <p className="text-xs font-mono mt-2">Waiting for incoming traffic...</p>
              </div>
            ) : (
              <div className="divide-y divide-[#141414]">
                {messages.map((msg) => (
                  <button
                    key={msg.messageId}
                    onClick={() => showMessage(msg.messageId)}
                    className={`w-full text-left p-6 transition-all group ${
                      selectedMessage?.messageId === msg.messageId 
                        ? "bg-[#141414] text-[#E4E3E0]" 
                        : "hover:bg-[#141414]/5"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-mono text-[10px] uppercase tracking-widest opacity-60">
                        {new Date(msg.createdAt).toLocaleTimeString()}
                      </span>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteMessage(msg.messageId);
                          }}
                          className="p-1 hover:bg-red-500 hover:text-white rounded"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    <h3 className="font-bold text-sm mb-1 truncate">{msg.subject}</h3>
                    <p className={`text-xs truncate ${selectedMessage?.messageId === msg.messageId ? "opacity-70" : "opacity-50"}`}>
                      From: {msg.from.address}
                    </p>
                    {msg.intro && (
                      <p className={`text-[11px] mt-2 line-clamp-2 italic font-serif ${selectedMessage?.messageId === msg.messageId ? "opacity-60" : "opacity-40"}`}>
                        {msg.intro}
                      </p>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Message Detail */}
          <div className="flex-1 overflow-y-auto bg-[#E4E3E0]">
            <AnimatePresence mode="wait">
              {selectedMessage ? (
                <motion.div
                  key={selectedMessage.messageId}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-10"
                >
                  <div className="max-w-3xl mx-auto">
                    <div className="mb-10 pb-10 border-b border-[#141414]/10">
                      <div className="flex justify-between items-start mb-6">
                        <div className="space-y-1">
                          <span className="font-mono text-[10px] uppercase tracking-widest opacity-50 block">Subject</span>
                          <h2 className="text-2xl font-bold tracking-tight">{selectedMessage.subject}</h2>
                        </div>
                        <button 
                          onClick={() => setSelectedMessage(null)}
                          className="p-2 hover:bg-[#141414]/5 rounded"
                        >
                          <X size={20} />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-8">
                        <div>
                          <span className="font-mono text-[10px] uppercase tracking-widest opacity-50 block mb-1">From</span>
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-[#141414]/10 flex items-center justify-center text-[10px] font-bold">
                              {selectedMessage.from.address[0].toUpperCase()}
                            </div>
                            <span className="text-xs font-medium">{selectedMessage.from.name || selectedMessage.from.address}</span>
                          </div>
                          <span className="text-[10px] opacity-40 ml-8">{selectedMessage.from.address}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-mono text-[10px] uppercase tracking-widest opacity-50 block mb-1">Received</span>
                          <div className="flex items-center justify-end gap-2 text-xs">
                            <Clock size={12} />
                            {new Date(selectedMessage.createdAt).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="prose prose-sm max-w-none">
                      {selectedMessage.html ? (
                        <div 
                          className="bg-white p-6 rounded border border-[#141414]/10 shadow-inner overflow-auto max-h-[600px]"
                          dangerouslySetInnerHTML={{ __html: selectedMessage.html }} 
                        />
                      ) : (
                        <div className="font-serif text-lg leading-relaxed whitespace-pre-wrap opacity-80">
                          {selectedMessage.body || selectedMessage.intro}
                        </div>
                      )}
                    </div>

                    <div className="mt-12 pt-8 border-t border-[#141414]/10 flex justify-between items-center">
                      <div className="flex gap-4">
                        <button 
                          onClick={() => deleteMessage(selectedMessage.messageId)}
                          className="flex items-center gap-2 px-4 py-2 border border-red-500/20 text-red-600 hover:bg-red-500 hover:text-white transition-all rounded text-xs font-mono uppercase tracking-widest"
                        >
                          <Trash2 size={14} />
                          Delete Message
                        </button>
                      </div>
                      <span className="font-mono text-[10px] opacity-30 uppercase tracking-widest">
                        Message ID: {selectedMessage.messageId}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center opacity-20 p-12 text-center">
                  <Mail size={64} strokeWidth={1} className="mb-4" />
                  <p className="font-serif italic text-xl">Select a message to read</p>
                  <p className="text-xs font-mono mt-2 uppercase tracking-widest">Secure Inbox Environment</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* Error Toast */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 right-6 bg-red-600 text-white px-6 py-4 rounded shadow-2xl flex items-center gap-3 z-50"
          >
            <AlertCircle size={20} />
            <div className="flex-1">
              <p className="text-xs font-bold uppercase tracking-widest">Error</p>
              <p className="text-sm">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="p-1 hover:bg-white/20 rounded">
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading Overlay */}
      {isLoading && !messages.length && (
        <div className="fixed inset-0 bg-[#E4E3E0]/80 backdrop-blur-[2px] z-[100] flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <RefreshCw size={32} className="animate-spin opacity-40" />
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] opacity-40">Processing</span>
          </div>
        </div>
      )}
    </div>
  );
}
