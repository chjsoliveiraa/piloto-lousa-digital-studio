/**
 * Main React Application Component
 */

import { useState } from 'react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'home' | 'templates' | 'resources' | 'build'>('home');

  return (
    <div className="flex h-screen bg-gray-900 text-gray-100">
      {/* Sidebar Navigation */}
      <nav className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
        <div className="p-6 border-b border-gray-700">
          <h1 className="text-xl font-bold text-white">Lousa Digital</h1>
          <p className="text-sm text-gray-400">Studio Tool</p>
        </div>
        
        <div className="flex-1 p-4">
          <NavButton 
            active={activeTab === 'home'} 
            onClick={() => setActiveTab('home')}
          >
            Home
          </NavButton>
          <NavButton 
            active={activeTab === 'templates'} 
            onClick={() => setActiveTab('templates')}
          >
            Template Builder
          </NavButton>
          <NavButton 
            active={activeTab === 'resources'} 
            onClick={() => setActiveTab('resources')}
          >
            Resource Manager
          </NavButton>
          <NavButton 
            active={activeTab === 'build'} 
            onClick={() => setActiveTab('build')}
          >
            Build Package
          </NavButton>
        </div>
        
        <div className="p-4 border-t border-gray-700 text-xs text-gray-500">
          v1.0.0
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto">
        {activeTab === 'home' && <HomePage />}
        {activeTab === 'templates' && <TemplateBuilderPage />}
        {activeTab === 'resources' && <ResourceManagerPage />}
        {activeTab === 'build' && <BuildPackagePage />}
      </main>
    </div>
  );
}

interface NavButtonProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

function NavButton({ active, onClick, children }: NavButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`
        w-full text-left px-4 py-2 rounded-lg mb-1 transition-colors
        ${active 
          ? 'bg-primary-600 text-white' 
          : 'text-gray-300 hover:bg-gray-700'
        }
      `}
    >
      {children}
    </button>
  );
}

// Placeholder Pages
function HomePage() {
  return (
    <div className="p-8">
      <h2 className="text-3xl font-bold mb-4">Welcome to Studio Tool</h2>
      <p className="text-gray-400 mb-6">
        Create, edit, and package extensions for Lousa Digital platform.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <Card
          title="Template Pack"
          description="Create lesson templates with pre-configured pages and objects"
        />
        <Card
          title="Tool Plugin"
          description="Develop custom didactic tools and widgets"
        />
        <Card
          title="Theme Pack"
          description="Design visual themes and color palettes"
        />
        <Card
          title="Resource Pack"
          description="Bundle images, videos, and audio resources"
        />
      </div>
    </div>
  );
}

function TemplateBuilderPage() {
  return (
    <div className="p-8">
      <h2 className="text-3xl font-bold mb-4">Template Builder</h2>
      <p className="text-gray-400">Visual template builder coming soon...</p>
    </div>
  );
}

function ResourceManagerPage() {
  return (
    <div className="p-8">
      <h2 className="text-3xl font-bold mb-4">Resource Manager</h2>
      <p className="text-gray-400">Cloud resource management coming soon...</p>
    </div>
  );
}

function BuildPackagePage() {
  return (
    <div className="p-8">
      <h2 className="text-3xl font-bold mb-4">Build Package</h2>
      <p className="text-gray-400">Package builder coming soon...</p>
    </div>
  );
}

interface CardProps {
  title: string;
  description: string;
}

function Card({ title, description }: CardProps) {
  return (
    <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 hover:border-primary-500 transition-colors cursor-pointer">
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-400 text-sm">{description}</p>
    </div>
  );
}
