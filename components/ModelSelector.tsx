'use client';

import { Bot, Zap } from 'lucide-react';

type Model = 'gpt-4o' | 'gpt-4o-mini';

interface ModelSelectorProps {
  value: Model;
  onChange: (model: Model) => void;
  disabled?: boolean;
}

export default function ModelSelector({ value, onChange, disabled }: ModelSelectorProps) {
  return (
    <div className="flex items-center gap-1 bg-navy-900/60 border border-navy-700/60 rounded-xl p-1">
      <button
        onClick={() => onChange('gpt-4o-mini')}
        disabled={disabled}
        className={value === 'gpt-4o-mini' ? 'model-btn-active' : 'model-btn-inactive'}
        title="GPT-4o Mini — Rápido y económico"
      >
        <Zap className="w-3.5 h-3.5" />
        <span>Mini</span>
      </button>
      <button
        onClick={() => onChange('gpt-4o')}
        disabled={disabled}
        className={value === 'gpt-4o' ? 'model-btn-active' : 'model-btn-inactive'}
        title="GPT-4o — Máxima capacidad"
      >
        <Bot className="w-3.5 h-3.5" />
        <span>GPT-4o</span>
      </button>
    </div>
  );
}
