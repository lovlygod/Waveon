import { motion } from 'framer-motion';
import type { ReactElement } from 'react';
import { GlassCard } from '@/components/common/GlassCard';

interface SettingsPageProps {
  animationsEnabled: boolean;
  confirmBeforeDelete: boolean;
  compactMode: boolean;
  setAnimationsEnabled: (value: boolean) => void;
  setConfirmBeforeDelete: (value: boolean) => void;
  setCompactMode: (value: boolean) => void;
  getRevealMotion: (delay?: number, y?: number) => Record<string, unknown>;
  getScaleInMotion: (delay?: number) => Record<string, unknown>;
}

export function SettingsPage({
  animationsEnabled,
  confirmBeforeDelete,
  compactMode,
  setAnimationsEnabled,
  setConfirmBeforeDelete,
  setCompactMode,
  getRevealMotion,
  getScaleInMotion
}: SettingsPageProps): ReactElement {
  const settings = [
    {
      title: 'Анимация',
      description: 'Плавные появления и эффекты наведения в интерфейсе.',
      enabled: animationsEnabled,
      onToggle: () => setAnimationsEnabled(!animationsEnabled)
    },
    {
      title: 'Подтверждение удаления',
      description: 'Показывать подтверждение перед удалением треков и плейлистов.',
      enabled: confirmBeforeDelete,
      onToggle: () => setConfirmBeforeDelete(!confirmBeforeDelete)
    },
    {
      title: 'Компактный режим',
      description: 'Уменьшает высоту элементов в списках библиотеки и плейлистов.',
      enabled: compactMode,
      onToggle: () => setCompactMode(!compactMode)
    }
  ];

  return (
    <motion.section className="space-y-6" {...getRevealMotion()}>
      <motion.div {...getScaleInMotion()}>
        <GlassCard className="p-6">
          <div className="max-w-3xl">
            <h2 className="text-2xl font-semibold text-white">Настройки приложения</h2>
            <p className="mt-2 text-sm text-[#9f9f9f]">Минималистичные параметры интерфейса и поведения приложения.</p>
          </div>
        </GlassCard>
      </motion.div>

      <motion.div {...getScaleInMotion(0.05)}>
        <GlassCard className="p-5">
          <div className="rounded-2xl border border-white/10 bg-[#121212] px-4 py-2">
            {settings.map((setting, index) => (
              <div
                key={setting.title}
                className={`flex items-center justify-between gap-4 py-4 ${index < settings.length - 1 ? 'border-b border-white/10' : ''}`}
              >
                <div>
                  <h3 className="text-lg font-semibold text-white">{setting.title}</h3>
                  <p className="mt-1 text-sm text-[#9f9f9f]">{setting.description}</p>
                </div>

                <button
                  onClick={setting.onToggle}
                  className={`relative inline-flex h-7 w-14 shrink-0 items-center rounded-full border transition ${
                    setting.enabled ? 'border-[#6d5cff] bg-[#6d5cff]/25' : 'border-white/10 bg-white/5'
                  }`}
                  aria-label={`Переключить ${setting.title}`}
                >
                  <span className={`absolute h-5 w-5 rounded-full bg-white shadow-lg transition-transform ${setting.enabled ? 'translate-x-[31px]' : 'translate-x-1'}`} />
                </button>
              </div>
            ))}
          </div>
        </GlassCard>
      </motion.div>
    </motion.section>
  );
}
