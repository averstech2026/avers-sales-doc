import { useState } from 'react';
import { parseTechnicalSpec } from '../../utils/aiParser';
import { isYandexParseConfigured } from '../../utils/yandexParseUrl';
import { createSection, createTask } from '../../utils/estimateFactory';
import type { Section } from '../../types';

interface AiParsePanelProps {
  onApply: (sections: Section[]) => void;
}

export function AiParsePanel({ onApply }: AiParsePanelProps) {
  const yandexReady = isYandexParseConfigured();
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [source, setSource] = useState<'ai' | 'rules' | null>(null);
  const [provider, setProvider] = useState<'yandex' | 'openai' | null>(null);
  const [yandexFailed, setYandexFailed] = useState(false);
  const [preview, setPreview] = useState<string[]>([]);

  const handleParse = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setSource(null);
    setProvider(null);
    setYandexFailed(false);
    setPreview([]);

    try {
      const {
        result,
        source: src,
        provider: aiProvider,
        yandexFailed: failedYandex,
      } = await parseTechnicalSpec(text);
      setSource(src);
      setProvider(aiProvider ?? null);
      setYandexFailed(failedYandex);
      setPreview(result.sections.map((s) => `${s.name} (${s.tasks.length} задач)`));

      const sections = result.sections.map((s, idx) =>
        createSection(
          `${idx + 3}. ${s.name}`,
          s.tasks.map((t) => createTask(t.name, t.description, t.hours))
        )
      );
      onApply(sections);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ai-panel">
      <div className="ai-panel__header">
        <h3>Умный разбор ТЗ</h3>
        {yandexReady ? (
          <p>
            Подключён <strong>YandexGPT</strong> — вставьте текст ТЗ и нажмите «Разобрать ТЗ».
            Анализ занимает 15–30 секунд.
          </p>
        ) : (
          <p>
            YandexGPT не настроен — будет использован шаблонный разбор по ключевым словам.
          </p>
        )}
      </div>
      <textarea
        className="ai-panel__textarea"
        rows={8}
        placeholder="Вставьте ТЗ заказчика: описание функционала, интеграций, требований к интерфейсу..."
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <div className="ai-panel__actions">
        <button
          type="button"
          className="btn btn--primary"
          onClick={handleParse}
          disabled={loading || !text.trim()}
        >
          {loading
            ? yandexReady
              ? 'YandexGPT анализирует…'
              : 'Анализ…'
            : 'Разобрать ТЗ'}
        </button>
        {source && (
          <span className="ai-panel__source">
            {source === 'ai'
              ? provider === 'yandex'
                ? '✦ AI-анализ (YandexGPT)'
                : '✦ AI-анализ (OpenAI)'
              : yandexFailed
                ? '⚠ YandexGPT недоступен — шаблонный разбор'
                : '✦ Умный разбор по ключевым словам'}
          </span>
        )}
      </div>
      {preview.length > 0 && (
        <ul className="ai-panel__preview">
          {preview.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
