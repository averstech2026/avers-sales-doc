import { useCallback, useEffect, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

import { ROLES } from '../../constants/roles';

import type { Estimate, Section, Task, Rates } from '../../types';

import {

  calculateSectionTotals,

  calculateTaskCost,

  formatCurrency,

} from '../../utils/calculator';

import { EstimateLogoSettings } from './EstimateLogoSettings';
import { PresentationSlidesSelector } from './PresentationSlidesSelector';
import { ClientCompanyPicker } from './ClientCompanyPicker';



interface EstimateEditorProps {

  estimate: Estimate;

  onChange: (estimate: Estimate) => void;

}



const EMPTY_HOURS = {

  consultant: 0,

  architect: 0,

  backend: 0,

  frontend: 0,

  engineer: 0,

  designer: 0,

} as const;



function DeleteRowButton({ onClick, title }: { onClick: () => void; title: string }) {

  return (

    <button

      type="button"

      className="estimate-table__delete-btn"

      onClick={onClick}

      title={title}

      aria-label={title}

    >

      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">

        <path

          d="M6 6l12 12M18 6L6 18"

          stroke="currentColor"

          strokeWidth="2"

          strokeLinecap="round"

        />

      </svg>

    </button>

  );

}



export function EstimateEditor({ estimate, onChange }: EstimateEditorProps) {

  const update = (patch: Partial<Estimate>) =>

    onChange({ ...estimate, ...patch, updatedAt: new Date().toISOString() });



  const updateSection = (sectionId: string, patch: Partial<Section>) => {

    update({

      sections: estimate.sections.map((s) =>

        s.id === sectionId ? { ...s, ...patch } : s

      ),

    });

  };



  const updateTask = (sectionId: string, taskId: string, patch: Partial<Task>) => {

    update({

      sections: estimate.sections.map((s) =>

        s.id === sectionId

          ? {

              ...s,

              tasks: s.tasks.map((t) => (t.id === taskId ? { ...t, ...patch } : t)),

            }

          : s

      ),

    });

  };



  const addSection = () => {

    const num = estimate.sections.length + 1;

    update({

      sections: [

        ...estimate.sections,

        {

          id: uuidv4(),

          name: `${num}. Новый этап`,

          tasks: [{ id: uuidv4(), name: '', description: '', hours: { ...EMPTY_HOURS } }],

        },

      ],

    });

  };



  const removeSection = (sectionId: string) => {

    if (estimate.sections.length <= 1) return;

    update({ sections: estimate.sections.filter((s) => s.id !== sectionId) });

  };



  const addTask = (sectionId: string, name: string) => {
    updateSection(sectionId, {
      tasks: [
        ...(estimate.sections.find((s) => s.id === sectionId)?.tasks || []),
        { id: uuidv4(), name, description: '', hours: { ...EMPTY_HOURS } },
      ],
    });
  };



  const removeTask = (sectionId: string, taskId: string) => {

    const section = estimate.sections.find((s) => s.id === sectionId);

    if (!section || section.tasks.length <= 1) return;

    updateSection(sectionId, { tasks: section.tasks.filter((t) => t.id !== taskId) });

  };



  const updateHours = (

    sectionId: string,

    taskId: string,

    roleId: keyof Rates,

    value: number

  ) => {

    const section = estimate.sections.find((s) => s.id === sectionId);

    const task = section?.tasks.find((t) => t.id === taskId);

    if (!task) return;

    updateTask(sectionId, taskId, {

      hours: { ...task.hours, [roleId]: Math.max(0, value) },

    });

  };



  return (

    <div className="estimate-editor">

      <div className="estimate-editor__meta">

        <label className="field field--wide">

          <span>Название проекта</span>

          <input

            type="text"

            value={estimate.projectName}

            onChange={(e) => update({ projectName: e.target.value })}

          />

        </label>

        <div className="field--wide">

          <ClientCompanyPicker estimate={estimate} onChange={update} />

        </div>

        <div className="field field--wide personalization-section">

          <EstimateLogoSettings estimate={estimate} onChange={update} />

        </div>

        <div className="field field--wide">

          <PresentationSlidesSelector estimate={estimate} onChange={update} />

        </div>

        <label className="field field--wide">

          <span>Описание проекта</span>

          <textarea

            rows={2}

            value={estimate.description}

            onChange={(e) => update({ description: e.target.value })}

            placeholder="Краткое описание для коммерческого предложения"

          />

        </label>

      </div>



      <div className="estimate-table-wrap">

        <div className="estimate-table" role="table">

          <div className="estimate-header-grid" role="row">

            <div className="estimate-grid__head estimate-grid__head--task" role="columnheader">
              Задача
            </div>

            {ROLES.map((r) => (

              <div

                key={r.id}

                className="estimate-grid__head estimate-grid__head--hour"

                role="columnheader"

                title={r.name}

              >

                <span className="estimate-table__role-header">

                  <span className="estimate-table__role-short">{r.shortName}</span>

                  <span className="estimate-table__role-rate">{estimate.rates[r.id]} ₽</span>

                </span>

              </div>

            ))}

            <div className="estimate-grid__head estimate-grid__head--cost" role="columnheader">

              Стоимость

            </div>

            <div

              className="estimate-grid__head estimate-grid__head--actions"

              role="columnheader"

              aria-label="Действия"

            />

          </div>



          <div className="estimate-table__body" role="rowgroup">

            {estimate.sections.map((section) => {

              const sectionTotals = calculateSectionTotals(section, estimate.rates);

              return (

                <SectionBlock

                  key={section.id}

                  section={section}

                  sectionTotals={sectionTotals}

                  rates={estimate.rates}

                  onSectionNameChange={(name) => updateSection(section.id, { name })}

                  onRemoveSection={() => removeSection(section.id)}

                  onAddTask={(name) => addTask(section.id, name)}

                  onRemoveTask={(taskId) => removeTask(section.id, taskId)}

                  onTaskChange={(taskId, patch) => updateTask(section.id, taskId, patch)}

                  onHoursChange={(taskId, roleId, value) =>

                    updateHours(section.id, taskId, roleId, value)

                  }

                />

              );

            })}

          </div>

        </div>

        <div className="btn-add-section-container">
          <button type="button" className="btn-add-section" onClick={addSection}>
            + Добавить раздел
          </button>
        </div>
      </div>
    </div>
  );
}



interface SectionBlockProps {
  section: Section;
  sectionTotals: ReturnType<typeof calculateSectionTotals>;
  rates: Rates;
  onSectionNameChange: (name: string) => void;
  onRemoveSection: () => void;
  onAddTask: (name: string) => void;
  onRemoveTask: (taskId: string) => void;
  onTaskChange: (taskId: string, patch: Partial<Task>) => void;
  onHoursChange: (taskId: string, roleId: keyof Rates, value: number) => void;
}

function SectionBlock({
  section,
  sectionTotals,
  rates,
  onSectionNameChange,
  onRemoveSection,
  onAddTask,
  onRemoveTask,
  onTaskChange,
  onHoursChange,
}: SectionBlockProps) {
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [draftName, setDraftName] = useState('');
  const draftContainerRef = useRef<HTMLDivElement>(null);
  const draftInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isAddingTask) return;
    const frame = requestAnimationFrame(() => {
      draftInputRef.current?.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [isAddingTask]);

  useEffect(() => {
    if (!isAddingTask) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (draftContainerRef.current?.contains(event.target as Node)) return;
      setIsAddingTask(false);
      setDraftName('');
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [isAddingTask]);

  const handleStartAddTask = () => {
    setDraftName('');
    setIsAddingTask(true);
  };

  const handleSaveNewTask = () => {
    const name = draftName.trim();
    if (name) {
      onAddTask(name);
    }
    setIsAddingTask(false);
    setDraftName('');
  };

  const handleCancelNewTask = () => {
    setIsAddingTask(false);
    setDraftName('');
  };

  return (
    <>
      <div className="estimate-row-grid estimate-table__section-row" role="row">
        <div className="estimate-grid__section-name" role="cell">
          <input
            className="section-header__name"
            value={section.name}
            onChange={(e) => onSectionNameChange(e.target.value)}
          />
        </div>

        <div className="estimate-grid__actions" role="cell">
          <DeleteRowButton onClick={onRemoveSection} title="Удалить раздел" />
        </div>
      </div>

      {section.tasks.map((task) => (
        <TaskRow
          key={task.id}
          task={task}
          rates={rates}
          onTaskChange={(patch) => onTaskChange(task.id, patch)}
          onHoursChange={(roleId, value) => onHoursChange(task.id, roleId, value)}
          onRemove={() => onRemoveTask(task.id)}
        />
      ))}

      {isAddingTask && (
        <div ref={draftContainerRef} className="task-edit-container" role="form" aria-label="Новая задача">
          <div className="task-input-wrapper">
            <input
              ref={draftInputRef}
              type="text"
              className="task-inline-input"
              placeholder="Введите название задачи..."
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSaveNewTask();
                }
                if (e.key === 'Escape') {
                  e.preventDefault();
                  handleCancelNewTask();
                }
              }}
              aria-label="Название новой задачи"
            />
          </div>
          <div className="task-control-buttons">
            <button type="button" className="btn-save-task" onClick={handleSaveNewTask}>
              Сохранить
            </button>
            <button type="button" className="btn-cancel-task" onClick={handleCancelNewTask}>
              Отмена
            </button>
          </div>
        </div>
      )}

      <div className="estimate-table__add-row">
        <button
          type="button"
          className="estimate-editor__add-btn"
          onClick={handleStartAddTask}
          disabled={isAddingTask}
        >
          + Добавить задачу
        </button>
      </div>



      <div className="estimate-total-row-grid estimate-table__total-row" role="row">

        <div className="estimate-grid__task estimate-grid__label" role="cell">

          <strong>Итого по разделу</strong>

        </div>

        {ROLES.map((role) => (

          <div

            key={role.id}

            className="estimate-grid__hour estimate-table__total-hours"

            role="cell"

          >

            {sectionTotals.hours[role.id] || 0}

          </div>

        ))}

        <div

          className="estimate-grid__cost estimate-table__cost estimate-table__cost--total"

          role="cell"

        >

          {formatCurrency(sectionTotals.cost)}

        </div>

        <div className="estimate-grid__actions" role="cell" aria-hidden="true" />

      </div>

    </>

  );

}

function HourStepper({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  const hours = Math.max(0, value || 0);

  const stepHour = (delta: number) => {
    onChange(Math.max(0, Math.min(999, hours + delta)));
  };

  const handleHourInput = (raw: string) => {
    if (raw === '') {
      onChange(0);
      return;
    }
    const parsed = parseInt(raw, 10);
    if (Number.isNaN(parsed) || parsed < 0) {
      onChange(0);
      return;
    }
    onChange(Math.min(999, parsed));
  };

  return (
    <div className="hour-stepper">
      <button
        type="button"
        className="stepper-btn minus"
        onClick={() => stepHour(-1)}
        aria-label="Уменьшить часы"
      >
        –
      </button>
      <input
        type="number"
        className="stepper-input"
        value={hours || ''}
        min={0}
        max={999}
        placeholder="0"
        onChange={(e) => handleHourInput(e.target.value)}
      />
      <button
        type="button"
        className="stepper-btn plus"
        onClick={() => stepHour(1)}
        aria-label="Увеличить часы"
      >
        +
      </button>
    </div>
  );
}

interface TaskRowProps {
  task: Task;
  rates: Rates;
  onTaskChange: (patch: Partial<Task>) => void;
  onHoursChange: (roleId: keyof Rates, value: number) => void;
  onRemove: () => void;
}

function TaskRow({ task, rates, onTaskChange, onHoursChange, onRemove }: TaskRowProps) {
  const hasDescription = Boolean(task.description.trim());
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [descDraft, setDescDraft] = useState(task.description);
  const titleRef = useRef<HTMLTextAreaElement>(null);
  const descInputRef = useRef<HTMLTextAreaElement>(null);

  const resizeTitleField = useCallback(() => {
    const field = titleRef.current;
    if (!field) return;
    field.style.height = 'auto';
    field.style.height = `${field.scrollHeight}px`;
  }, []);

  const resizeDescField = useCallback(() => {
    const field = descInputRef.current;
    if (!field) return;
    field.style.height = 'auto';
    field.style.height = `${field.scrollHeight}px`;
  }, []);

  useEffect(() => {
    setIsEditingDesc(false);
    setDescDraft(task.description);
  }, [task.id]);

  useEffect(() => {
    resizeTitleField();
  }, [task.name, resizeTitleField]);

  useEffect(() => {
    if (!isEditingDesc) {
      setDescDraft(task.description);
      return;
    }
    const frame = requestAnimationFrame(() => {
      resizeDescField();
      descInputRef.current?.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [isEditingDesc, task.description, resizeDescField]);

  const showDescription = isEditingDesc || hasDescription;

  const handleToggleDesc = () => {
    if (isEditingDesc) {
      setDescDraft(task.description);
      setIsEditingDesc(false);
      return;
    }
    setDescDraft(task.description);
    setIsEditingDesc(true);
  };

  const handleSaveDesc = () => {
    onTaskChange({ description: descDraft });
    setIsEditingDesc(false);
  };

  const handleCancelDesc = () => {
    setDescDraft(task.description);
    setIsEditingDesc(false);
  };

  return (
    <div
      className={`estimate-row-grid estimate-table__task-row${showDescription ? ' estimate-table__task-row--expanded' : ''}`}
      role="row"
    >
      <div className="estimate-grid__task task-info-col task-cell" role="cell">
        <div className="task-cell-inner">
          <div className="task-title-wrapper" role="group" aria-label="Название задачи">
            <textarea
              ref={titleRef}
              className="inline-input task-title-input task-title-text"
              rows={1}
              value={task.name}
              onChange={(e) => onTaskChange({ name: e.target.value })}
              onInput={resizeTitleField}
              onKeyDown={(e) => {
                if (e.key === 'Enter') e.preventDefault();
              }}
              placeholder="Название задачи"
              aria-label="Название задачи"
            />
          </div>

          {isEditingDesc ? (
            <div className="task-description-editor">
              <textarea
                ref={descInputRef}
                className="task-desc-input"
                rows={2}
                value={descDraft}
                onChange={(e) => setDescDraft(e.target.value)}
                onInput={resizeDescField}
                placeholder="Введите примечание к задаче (например, конкретные требования или состав работ)..."
              />
              <div className="task-desc-actions">
                <button type="button" className="btn-desc-save" onClick={handleSaveDesc}>
                  Сохранить
                </button>
                <button type="button" className="btn-desc-cancel" onClick={handleCancelDesc}>
                  Отмена
                </button>
              </div>
            </div>
          ) : hasDescription ? (
            <div className="task-note-container updated-note-style">
              <button
                type="button"
                className="note-edit-trigger"
                onClick={handleToggleDesc}
                title="Редактировать примечание"
                aria-label="Редактировать примечание к задаче"
              >
                <svg
                  className="note-pencil-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </button>
              <span className="task-note-text">{task.description}</span>
            </div>
          ) : (
            <div className="add-note-btn-wrapper">
              <button
                type="button"
                className="elegant-text-note-btn"
                onClick={handleToggleDesc}
                aria-label="Добавить примечание к задаче"
              >
                + примечание
              </button>
            </div>
          )}
        </div>
      </div>

      {ROLES.map((role) => (
        <div key={role.id} className="estimate-grid__hour task-values-col" role="cell">
          <HourStepper
            value={task.hours[role.id] || 0}
            onChange={(next) => onHoursChange(role.id, next)}
          />
        </div>
      ))}

      <div className="estimate-grid__cost estimate-table__cost task-values-col" role="cell">
        {formatCurrency(calculateTaskCost(task.hours, rates))}
      </div>

      <div className="estimate-grid__actions task-values-col" role="cell">
        <DeleteRowButton onClick={onRemove} title="Удалить задачу" />
      </div>
    </div>
  );
}
