'use client';

import { useState } from 'react';

export type Theme = {
  name: string;
  gradients: string[];
  primaryColor: string;
  accentColor: string;
};

export const PRESET_THEMES: Theme[] = [
  {
    name: 'Vibrant',
    gradients: [
      'bg-gradient-to-br from-purple-600 to-blue-600',
      'bg-gradient-to-br from-orange-500 to-pink-600',
      'bg-gradient-to-br from-green-500 to-teal-600',
      'bg-gradient-to-br from-yellow-500 to-red-600',
      'bg-gradient-to-br from-indigo-600 to-purple-700',
    ],
    primaryColor: '#8b5cf6',
    accentColor: '#ec4899',
  },
  {
    name: 'Ocean',
    gradients: [
      'bg-gradient-to-br from-blue-600 to-cyan-500',
      'bg-gradient-to-br from-teal-500 to-blue-600',
      'bg-gradient-to-br from-cyan-400 to-blue-700',
      'bg-gradient-to-br from-blue-500 to-indigo-600',
      'bg-gradient-to-br from-sky-400 to-blue-600',
    ],
    primaryColor: '#0ea5e9',
    accentColor: '#06b6d4',
  },
  {
    name: 'Sunset',
    gradients: [
      'bg-gradient-to-br from-orange-500 to-red-600',
      'bg-gradient-to-br from-yellow-400 to-orange-600',
      'bg-gradient-to-br from-red-500 to-pink-600',
      'bg-gradient-to-br from-amber-500 to-red-500',
      'bg-gradient-to-br from-orange-600 to-rose-600',
    ],
    primaryColor: '#f97316',
    accentColor: '#dc2626',
  },
  {
    name: 'Forest',
    gradients: [
      'bg-gradient-to-br from-green-600 to-emerald-700',
      'bg-gradient-to-br from-lime-500 to-green-700',
      'bg-gradient-to-br from-emerald-500 to-teal-600',
      'bg-gradient-to-br from-green-500 to-cyan-600',
      'bg-gradient-to-br from-teal-600 to-green-700',
    ],
    primaryColor: '#10b981',
    accentColor: '#14b8a6',
  },
  {
    name: 'Royal',
    gradients: [
      'bg-gradient-to-br from-purple-700 to-indigo-800',
      'bg-gradient-to-br from-indigo-600 to-purple-700',
      'bg-gradient-to-br from-violet-600 to-purple-700',
      'bg-gradient-to-br from-purple-600 to-fuchsia-700',
      'bg-gradient-to-br from-indigo-700 to-violet-800',
    ],
    primaryColor: '#7c3aed',
    accentColor: '#6366f1',
  },
  {
    name: 'Monochrome',
    gradients: [
      'bg-gradient-to-br from-gray-800 to-gray-900',
      'bg-gradient-to-br from-slate-700 to-gray-900',
      'bg-gradient-to-br from-gray-700 to-slate-900',
      'bg-gradient-to-br from-zinc-800 to-gray-900',
      'bg-gradient-to-br from-neutral-800 to-slate-900',
    ],
    primaryColor: '#1f2937',
    accentColor: '#4b5563',
  },
];

type ThemeSelectorProps = {
  selectedTheme: Theme;
  onThemeChange: (theme: Theme) => void;
};

export function ThemeSelector({ selectedTheme, onThemeChange }: ThemeSelectorProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Choose Your Theme</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {PRESET_THEMES.map((theme) => (
          <button
            key={theme.name}
            onClick={() => onThemeChange(theme)}
            className={`p-4 rounded-xl border-2 transition-all ${
              selectedTheme.name === theme.name
                ? 'border-blue-600 bg-blue-50 scale-105'
                : 'border-gray-200 hover:border-gray-400'
            }`}
          >
            <div className="space-y-2">
              <div className="font-semibold text-gray-900">{theme.name}</div>
              <div className="flex gap-1">
                {theme.gradients.slice(0, 3).map((gradient, i) => (
                  <div
                    key={i}
                    className={`h-8 flex-1 rounded ${gradient}`}
                  />
                ))}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

type CustomColorPickerProps = {
  onCustomColors: (primary: string, accent: string) => void;
};

export function CustomColorPicker({ onCustomColors }: CustomColorPickerProps) {
  const [primary, setPrimary] = useState('#8b5cf6');
  const [accent, setAccent] = useState('#ec4899');

  const handleApply = () => {
    onCustomColors(primary, accent);
  };

  return (
    <div className="space-y-4 p-6 bg-gray-50 rounded-xl">
      <h3 className="text-lg font-semibold text-gray-900">Custom Brand Colors</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Primary Color
          </label>
          <div className="flex gap-2 items-center">
            <input
              type="color"
              value={primary}
              onChange={(e) => setPrimary(e.target.value)}
              className="h-12 w-16 rounded border-2 border-gray-300 cursor-pointer"
            />
            <input
              type="text"
              value={primary}
              onChange={(e) => setPrimary(e.target.value)}
              className="flex-1 px-3 py-2 border-2 border-gray-300 rounded-lg font-mono text-sm"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Accent Color
          </label>
          <div className="flex gap-2 items-center">
            <input
              type="color"
              value={accent}
              onChange={(e) => setAccent(e.target.value)}
              className="h-12 w-16 rounded border-2 border-gray-300 cursor-pointer"
            />
            <input
              type="text"
              value={accent}
              onChange={(e) => setAccent(e.target.value)}
              className="flex-1 px-3 py-2 border-2 border-gray-300 rounded-lg font-mono text-sm"
            />
          </div>
        </div>
      </div>
      <button
        onClick={handleApply}
        className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
      >
        Apply Custom Colors
      </button>
    </div>
  );
}
