import React, { useEffect } from 'react';
import { useStore } from './store';
import { SidebarLeft } from './components/SidebarLeft';
import { SidebarRight } from './components/SidebarRight';
import { Editor } from './components/Editor';
import { Home } from './components/Home';

const App: React.FC = () => {
  const { loadData, isLoading, view } = useStore();

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-6 h-6 border-2 border-slate-300 border-t-slate-800 rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (view === 'home') {
    return <Home />;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white text-[#37352F]">
      {/* Left Sidebar: Book & Chapter Management */}
      <SidebarLeft />
      
      {/* Main Content: Editor */}
      <main className="flex-1 relative min-w-[400px] flex flex-col">
        <Editor />
      </main>
      
      {/* Right Sidebar: Table of Contents */}
      <SidebarRight />
    </div>
  );
};

export default App;
