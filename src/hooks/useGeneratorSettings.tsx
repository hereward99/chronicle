import { useState, useEffect } from 'react';

interface GeneratorSettings {
  useLocalLLM: boolean;
  ollamaUrl: string;
  ollamaModel: string;
}

const STORAGE_KEY = 'vtm-generator-settings';

const defaultSettings: GeneratorSettings = {
  useLocalLLM: false,
  ollamaUrl: 'http://localhost:11434',
  ollamaModel: 'llama3.2',
};

export function useGeneratorSettings() {
  const [settings, setSettings] = useState<GeneratorSettings>(defaultSettings);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setSettings({ ...defaultSettings, ...JSON.parse(stored) });
      } catch {
        setSettings(defaultSettings);
      }
    }
    setIsLoaded(true);
  }, []);

  const updateSettings = (updates: Partial<GeneratorSettings>) => {
    const newSettings = { ...settings, ...updates };
    setSettings(newSettings);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
  };

  return { settings, updateSettings, isLoaded };
}
