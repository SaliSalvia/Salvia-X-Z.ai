import { useEffect, useMemo, useState } from 'react';
import {
  SAMPLE_CONVERSATIONS,
  type ChatCodeBlock,
  type Conversation,
  type EffortLevel,
  type WorkspaceMode,
  type ZaiModelId,
} from './data/zaiCatalog';
import {
  buildAssistantReply,
  extractConversationArtifacts,
  filterConversations,
  validatePrompt,
} from './utils/portalLogic';
import { PortalHeader } from './components/PortalHeader';
import { SidebarDrawer } from './components/SidebarDrawer';
import { ModeGrid } from './components/ModeGrid';
import { ChatThread } from './components/ChatThread';
import { ComposerBar } from './components/ComposerBar';
import { PreviewSheet, type ActivePreview } from './components/PreviewSheet';
import { ControlSheet } from './components/ControlSheet';
import { ArtifactsDrawer } from './components/ArtifactsDrawer';

const STORAGE_KEY_THEME = 'salix_portal_theme';
const STORAGE_KEY_CONVS = 'salix_portal_conversations';

export function App() {
  const [dark, setDark] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY_THEME) === 'dark';
    } catch {
      return false;
    }
  });
  const [enhancedMobile, setEnhancedMobile] = useState(true);
  const [mobileFrame, setMobileFrame] = useState(false);

  const [conversations, setConversations] = useState<Conversation[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CONVS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // Fall back to default seeded conversations
    }
    return SAMPLE_CONVERSATIONS;
  });
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [activeModel, setActiveModel] = useState<ZaiModelId>('GLM-5.3-Flash');
  const [effort, setEffort] = useState<EffortLevel>('متعادل');

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [artifactsOpen, setArtifactsOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [signedIn, setSignedIn] = useState(true);

  const [prompt, setPrompt] = useState('');
  const [deepThink, setDeepThink] = useState(false);
  const [webSearch, setWebSearch] = useState(false);
  const [attachmentName, setAttachmentName] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const [preview, setPreview] = useState<ActivePreview | null>(null);
  const [previewExpanded, setPreviewExpanded] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    try {
      localStorage.setItem(STORAGE_KEY_THEME, dark ? 'dark' : 'light');
    } catch {
      // Ignore storage errors
    }
  }, [dark]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CONVS, JSON.stringify(conversations));
    } catch {
      // Ignore storage errors
    }
  }, [conversations]);

  const activeConversation = useMemo(
    () => conversations.find((c) => c.id === activeConvId) ?? null,
    [conversations, activeConvId]
  );

  const activeArtifacts = useMemo(
    () => extractConversationArtifacts(activeConversation),
    [activeConversation]
  );

  const filteredConversations = useMemo(
    () => filterConversations(conversations, searchQuery),
    [conversations, searchQuery]
  );

  const handleSelectMode = (mode: WorkspaceMode) => {
    setPrompt(mode.starterPrompt);
    setValidationError(null);
  };

  const handleSend = () => {
    const err = validatePrompt(prompt, Boolean(attachmentName));
    if (err) {
      setValidationError(err);
      return;
    }
    setValidationError(null);

    const text = prompt.trim() || `تحلیل فایل پیوست‌شده: ${attachmentName}`;
    const userMsg = {
      id: `user-${Date.now()}`,
      role: 'user' as const,
      text,
      timestamp: 'هم‌اکنون',
    };
    const assistantMsg = buildAssistantReply({
      prompt: text,
      model: activeModel,
      effort,
      deepThink,
      webSearch,
      attachmentName,
    });

    if (activeConversation) {
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeConversation.id
            ? {
                ...c,
                model: activeModel,
                updatedAt: 'هم‌اکنون',
                messages: [...c.messages, userMsg, assistantMsg],
              }
            : c
        )
      );
    } else {
      const newConv: Conversation = {
        id: `conv-${Date.now()}`,
        title: text.slice(0, 38) + (text.length > 38 ? '…' : ''),
        model: activeModel,
        updatedAt: 'هم‌اکنون',
        messages: [userMsg, assistantMsg],
      };
      setConversations((prev) => [newConv, ...prev]);
      setActiveConvId(newConv.id);
    }

    setPrompt('');
    setAttachmentName(null);
  };

  const handlePreviewCode = (block: ChatCodeBlock) => {
    setPreview({
      filename: block.filename,
      lang: block.lang,
      code: block.code,
      minimized: false,
    });
  };

  const handleDeleteConversation = (id: string) => {
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeConvId === id) setActiveConvId(null);
  };

  const handleResetSession = () => {
    setConversations(SAMPLE_CONVERSATIONS);
    setActiveConvId(null);
    setPrompt('');
    setAttachmentName(null);
    setPreview(null);
    setValidationError(null);
  };

  return (
    <div className="flex h-full w-full justify-center bg-[#F3F4F6] dark:bg-[#050608]">
      <div
        className={`flex h-full flex-col bg-white dark:bg-[#0B0C0F] transition-all ${
          mobileFrame
            ? 'w-full max-w-[412px] border-x border-[#E5E7EB] shadow-xl dark:border-[#262A35]'
            : 'w-full'
        }`}
      >
        <PortalHeader
          activeModel={activeModel}
          effort={effort}
          dark={dark}
          mobileFrame={mobileFrame}
          artifactsCount={activeArtifacts.length}
          onSelectModel={setActiveModel}
          onSelectEffort={setEffort}
          onToggleSidebar={() => setSidebarOpen(true)}
          onOpenArtifacts={() => setArtifactsOpen(true)}
          onNewChat={() => {
            setActiveConvId(null);
            setValidationError(null);
          }}
          onToggleTheme={() => setDark((d) => !d)}
          onOpenMenu={() => setMenuOpen(true)}
        />

        <main className="flex-1 overflow-y-auto">
          {activeConversation ? (
            <ChatThread
              messages={activeConversation.messages}
              modelLabel={activeConversation.model}
              onPreviewCode={handlePreviewCode}
            />
          ) : (
            <ModeGrid enhancedMobile={enhancedMobile} onSelectMode={handleSelectMode} />
          )}
        </main>

        <ComposerBar
          value={prompt}
          activeModel={activeModel}
          deepThink={deepThink}
          webSearch={webSearch}
          attachmentName={attachmentName}
          validationError={validationError}
          onChange={(v) => {
            setPrompt(v);
            if (validationError) setValidationError(null);
          }}
          onToggleDeepThink={() => setDeepThink((v) => !v)}
          onToggleWebSearch={() => setWebSearch((v) => !v)}
          onAttachFile={setAttachmentName}
          onOpenModelPicker={() => setMenuOpen(true)}
          onSubmit={handleSend}
        />

        <SidebarDrawer
          open={sidebarOpen}
          conversations={filteredConversations}
          activeId={activeConvId}
          searchQuery={searchQuery}
          signedIn={signedIn}
          onSearchChange={setSearchQuery}
          onSelectConversation={(id) => setActiveConvId(id)}
          onDeleteConversation={handleDeleteConversation}
          onNewChat={() => setActiveConvId(null)}
          onSyncHistory={() => {
            setConversations((prev) =>
              prev.map((c) => ({ ...c, updatedAt: c.updatedAt || 'همگام‌سازی‌شده' }))
            );
          }}
          onToggleSignIn={() => setSignedIn((s) => !s)}
          onClose={() => setSidebarOpen(false)}
        />

        <ArtifactsDrawer
          open={artifactsOpen}
          artifacts={activeArtifacts}
          onPreviewArtifact={handlePreviewCode}
          onClose={() => setArtifactsOpen(false)}
        />

        <PreviewSheet
          preview={preview}
          expanded={previewExpanded}
          onExpandToggle={() => setPreviewExpanded((e) => !e)}
          onMinimize={() => setPreview((p) => (p ? { ...p, minimized: true } : null))}
          onRestore={() => setPreview((p) => (p ? { ...p, minimized: false } : null))}
          onClose={() => setPreview(null)}
        />

        <ControlSheet
          open={menuOpen}
          dark={dark}
          enhancedMobile={enhancedMobile}
          mobileFrame={mobileFrame}
          onClose={() => setMenuOpen(false)}
          onSelectMode={handleSelectMode}
          onToggleTheme={() => setDark((d) => !d)}
          onToggleEnhance={() => setEnhancedMobile((e) => !e)}
          onToggleViewport={() => setMobileFrame((f) => !f)}
          onNewChat={() => setActiveConvId(null)}
          onResetSession={handleResetSession}
        />
      </div>
    </div>
  );
}

export default App;
