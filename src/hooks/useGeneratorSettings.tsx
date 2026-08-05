import { useState, useEffect } from 'react';

export type AIProvider = 'lovable' | 'google' | 'ollama';

interface GeneratorSettings {
  provider: AIProvider;
  /** @deprecated kept for migration of older stored settings */
  useLocalLLM: boolean;
  ollamaUrl: string;
  ollamaModel: string;
  googleApiKey: string;
  googleModel: string;
}

const STORAGE_KEY = 'vtm-generator-settings';

const defaultSettings: GeneratorSettings = {
  provider: 'lovable',
  useLocalLLM: false,
  ollamaUrl: 'http://localhost:11434',
  ollamaModel: 'llama3.2',
  googleApiKey: '',
  googleModel: 'gemini-2.5-flash',
};

function migrate(raw: Partial<GeneratorSettings>): GeneratorSettings {
  const merged = { ...defaultSettings, ...raw };
  if (!raw.provider) {
    merged.provider = raw.useLocalLLM ? 'ollama' : 'lovable';
  }
  merged.useLocalLLM = merged.provider === 'ollama';
  return merged;
}

export function useGeneratorSettings() {
  const [settings, setSettings] = useState<GeneratorSettings>(defaultSettings);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setSettings(migrate(JSON.parse(stored)));
      } catch {
        setSettings(defaultSettings);
      }
    }
    setIsLoaded(true);
  }, []);

  const updateSettings = (updates: Partial<GeneratorSettings>) => {
    const newSettings = migrate({ ...settings, ...updates });
    setSettings(newSettings);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
  };

  return { settings, updateSettings, isLoaded };
}
