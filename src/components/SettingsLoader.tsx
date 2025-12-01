import { useEffect } from 'react';
import { initSettingsListener } from '../store/settingsStore';

export default function SettingsLoader() {
  useEffect(() => {
    initSettingsListener();
  }, []);

  return null; // No renderiza nada visual
}