import { useState } from 'react';
import { parseTechnicalSpec } from '../../utils/aiParser';
import { isYandexParseConfigured } from '../../utils/yandexParseUrl';
import { createSection, createTask } from '../../utils/estimateFactory';
import { totalHours } from '../../utils/calculator';
import { EMPTY_HOURS } from '../../constants/roles';
import type { AiParseResult, RoleHours, Section } from '../../types';

interface AiParsePanelProps {
  onApply: (sections: Section[]) => void;
}

type PreviewTask = {
  id: string;
  sectionName: string;
  name: string;
  description: string;
  hours: RoleHours;
};

function flattenParsedTasks(result: AiParseResult): PreviewTask[] {
  const items: PreviewTask[] = [];
  result.sections.forEach((section, sectionIdx) => {
    section.tasks.forEach((task, taskIdx) => {
      items.push({
        id: `${sectionIdx}-${taskIdx}`,
        sectionName: section.name,
        name: task.name,
        description: task.description,
        hours: { ...EMPTY_HOURS(), ...task.hours },
      });
    });
  });
  return items;
}

function buildSectionsFromSelected(items: PreviewTask[], selectedIds: Set<string>): Section[] {
  const bySection = new Map<string, PreviewTask[]>();

  for (const item of items) {
    if (!selectedIds.has(item.id)) continue;
    const list = bySection.get(item.sectionName) ?? [];
    list.push(item);
    bySection.set(item.sectionName, list);
  }

  return Array.from(bySection.entries()).map(([name, tasks], idx) =>
    createSection(
      `${idx + 3}. ${name}`,
      tasks.map((t) => createTask(t.name, t.description, t.hours))
    )
  );
}

export function AiParsePanel({ onApply }: AiParsePanelProps) {
  const yandexReady = isYandexParseConfigured();
  const [step, setStep] = useState<'input' | 'preview'>('input');
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [source, setSource] = useState<'ai' | 'rules' | null>(null);
  const [provider, setProvider] = useState<'yandex' | 'openai' | null>(null);
  const [yandexFailed, setYandexFailed] = useState(false);
  const [parsedItems, setParsedItems] = useState<PreviewTask[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const selectedCount = selectedIds.size;

  const handleParse = async () => {
    if (!text.trim()) {
      setError('Пожалуйста, введите текст ТЗ.');
      return;
    }

    setLoading(true);
    setSource(null);
    setProvider(null);
    setYandexFailed(false);
    setError(null);
    setParsedItems([]);
    setSelectedIds(new Set());

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

      const items = flattenParsedTasks(result);
      setParsedItems(items);
      setSelectedIds(new Set(items.map((item) => item.id)));
      setStep('preview');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Неизвестная ошибка');
    } finally {
      setLoading(false);
    }
  };

  const toggleItem = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const backToInput = () => {
    setStep('input');
    setError(null);
  };

  const commitSelected = () => {
    if (selectedCount === 0) {
      setError('Пожалуйста, выберите хотя бы одну позицию.');
      return;
    }
    setError(null);
    onApply(buildSectionsFromSelected(parsedItems, selectedIds));
  };

  const grouped = parsedItems.reduce<Record<string, PreviewTask[]>>((acc, item) => {
    (acc[item.sectionName] ??= []).push(item);
    return acc;
  }, {});

  const sourceLabel =
    source === 'ai'
      ? provider === 'yandex'
        ? '✦ AI-анализ (YandexGPT)'
        : '✦ AI-анализ (OpenAI)'
      : yandexFailed
        ? '⚠ YandexGPT недоступен — шаблонный разбор'
        : '✦ Умный разбор по ключевым словам';

  return (
    <div className="modal-tz-content">
      {step === 'input' && (
        <div id="tz-step-input" className="tz-step-container">
          <div className="tz-modal-header-desc">
            {yandexReady ? (
              <>
                Подключён <strong>YandexGPT</strong> — вставьте текст ТЗ и нажмите «Разобрать ТЗ».
                Анализ занимает 15–30 секунд.
              </>
            ) : (
              <>YandexGPT не настроен — будет использован шаблонный разбор по ключевым словам.</>
            )}
          </div>

          <div className="tz-input-wrapper">
            <textarea
              id="tz-input-textarea"
              className="ai-panel__textarea"
              rows={8}
              placeholder="Вставьте ТЗ заказчика: описание функционала, интеграций, требований к интерфейсу..."
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                if (error) setError(null);
              }}
            />
          </div>

          {error && <div className="tz-modal-error">{error}</div>}

          <div className="tz-modal-footer-actions">
            <button
              type="button"
              id="btn-run-tz-parse"
              className="btn btn--primary"
              onClick={handleParse}
              disabled={loading || !text.trim()}
            >
              {loading && <span className="loader-spinner" aria-hidden="true" />}
              <span className="btn-text">
                {loading
                  ? yandexReady
                    ? 'YandexGPT анализирует…'
                    : 'Анализируем…'
                  : 'Разобрать ТЗ'}
              </span>
            </button>
          </div>
        </div>
      )}

      {step === 'preview' && (
        <div id="tz-step-preview" className="tz-step-container">
          <div className="tz-modal-header-desc">
            ✨ <strong>Готово!</strong> Проверьте распознанные позиции. Выберите галочками те,
            которые хотите добавить в смету:
          </div>

          {source && <div className="ai-panel__source tz-preview-source">{sourceLabel}</div>}

          <div id="tz-preview-list" className="tz-preview-scroll-area">
            {parsedItems.length === 0 ? (
              <div className="tz-preview-empty">
                Не удалось распознать позиции. Попробуйте изменить текст ТЗ.
              </div>
            ) : (
              Object.entries(grouped).map(([sectionName, tasks]) => (
                <div key={sectionName} className="preview-category-group">
                  <div className="preview-category-title">{sectionName}</div>
                  {tasks.map((item) => (
                    <div
                      key={item.id}
                      className="preview-item-row"
                      id={`preview-row-${item.id}`}
                      onClick={() => toggleItem(item.id)}
                    >
                      <label
                        className="custom-checkbox-container"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          className="real-checkbox"
                          checked={selectedIds.has(item.id)}
                          onChange={() => toggleItem(item.id)}
                          data-id={item.id}
                          aria-label={item.name}
                        />
                        <span className="custom-checkbox-checkmark" aria-hidden="true">
                          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                            <path
                              d="M1.5 4L4 6.5L8.5 1.5"
                              stroke="white"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </span>
                      </label>

                      <div className="preview-item-info">
                        <div className="preview-item-name">{item.name}</div>
                        {item.description ? (
                          <div className="preview-item-desc">{item.description}</div>
                        ) : null}
                      </div>

                      <div className="preview-item-meta">
                        <span className="preview-item-type-badge">Задача</span>
                        <span className="preview-item-price">{totalHours(item.hours)} ч</span>
                      </div>
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>

          {error && <div className="tz-modal-error">{error}</div>}

          <div className="tz-modal-footer-actions preview-footer">
            <button type="button" className="btn-secondary-link" onClick={backToInput}>
              ← Вернуться к вводу
            </button>
            <button
              type="button"
              id="btn-add-selected-to-estimate"
              className="btn btn-save"
              onClick={commitSelected}
              disabled={parsedItems.length === 0}
            >
              Добавить в смету (<span id="selected-count">{selectedCount}</span>)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
