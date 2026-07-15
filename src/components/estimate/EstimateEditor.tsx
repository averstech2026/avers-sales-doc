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

          tasks: [{ id: uuidv4(), name: 'Новая задача', description: '', hours: { ...EMPTY_HOURS } }],

        },

      ],

    });

  };



  const removeSection = (sectionId: string) => {

    if (estimate.sections.length <= 1) return;

    update({ sections: estimate.sections.filter((s) => s.id !== sectionId) });

  };



  const addTask = (sectionId: string) => {

    updateSection(sectionId, {

      tasks: [

        ...(estimate.sections.find((s) => s.id === sectionId)?.tasks || []),

        { id: uuidv4(), name: 'Новая задача', description: '', hours: { ...EMPTY_HOURS } },

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

        <label className="field">

          <span>Название проекта</span>

          <input

            type="text"

            value={estimate.projectName}

            onChange={(e) => update({ projectName: e.target.value })}

          />

        </label>

        <label className="field">

          <span>Заказчик</span>

          <input

            type="text"

            value={estimate.clientName}

            onChange={(e) => update({ clientName: e.target.value })}

            placeholder="ООО «ВЗЛП»"

          />

        </label>

        <div className="field field--wide personalization-section">

          <EstimateLogoSettings estimate={estimate} onChange={update} />

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

                  onAddTask={() => addTask(section.id)}

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

  onAddTask: () => void;

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



      <div className="estimate-table__add-row">

        <button type="button" className="estimate-editor__add-btn" onClick={onAddTask}>

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

interface TaskRowProps {
  task: Task;
  rates: Rates;
  onTaskChange: (patch: Partial<Task>) => void;
  onHoursChange: (roleId: keyof Rates, value: number) => void;
  onRemove: () => void;
}

function TaskRow({ task, rates, onTaskChange, onHoursChange, onRemove }: TaskRowProps) {
  const hasDescription = Boolean(task.description.trim());
  const [descOpen, setDescOpen] = useState(hasDescription);
  const titleRef = useRef<HTMLTextAreaElement>(null);

  const resizeTitleField = useCallback(() => {
    const field = titleRef.current;
    if (!field) return;
    field.style.height = 'auto';
    field.style.height = `${field.scrollHeight}px`;
  }, []);

  useEffect(() => {
    setDescOpen(Boolean(task.description.trim()));
  }, [task.id]);

  useEffect(() => {
    if (task.description.trim()) {
      setDescOpen(true);
    }
  }, [task.description]);

  useEffect(() => {
    resizeTitleField();
  }, [task.name, resizeTitleField]);

  return (
    <div className={`estimate-row-grid estimate-table__task-row${descOpen ? ' estimate-table__task-row--expanded' : ''}`} role="row">
      <div className="estimate-grid__task task-name-cell" role="cell">
        <div className="task-main-row">
          <textarea
            ref={titleRef}
            className="inline-input task-title-input"
            rows={1}
            value={task.name}
            onChange={(e) => onTaskChange({ name: e.target.value })}
            onInput={resizeTitleField}
            onKeyDown={(e) => {
              if (e.key === 'Enter') e.preventDefault();
            }}
            placeholder="Название задачи"
          />
          <button
            type="button"
            className={`btn-toggle-description${descOpen ? ' is-active' : ''}`}
            onClick={() => setDescOpen((open) => !open)}
            title="Добавить/изменить описание"
            aria-label="Добавить или изменить описание задачи"
            aria-expanded={descOpen}
          >
            📝
          </button>
        </div>
        <div className={`task-description-wrapper${descOpen ? ' is-visible' : ''}`}>
          <textarea
            className="task-desc-input"
            rows={2}
            value={task.description}
            onChange={(e) => onTaskChange({ description: e.target.value })}
            placeholder="Добавьте подробное описание задачи, если необходимо..."
          />
        </div>
      </div>

      {ROLES.map((role) => (
        <div key={role.id} className="estimate-grid__hour" role="cell">
          <input
            type="number"
            className="hour-input"
            min={0}
            step={1}
            value={task.hours[role.id] || ''}
            onChange={(e) => onHoursChange(role.id, Number(e.target.value) || 0)}
            placeholder="0"
          />
        </div>
      ))}

      <div className="estimate-grid__cost estimate-table__cost" role="cell">
        {formatCurrency(calculateTaskCost(task.hours, rates))}
      </div>

      <div className="estimate-grid__actions" role="cell">
        <DeleteRowButton onClick={onRemove} title="Удалить задачу" />
      </div>
    </div>
  );
}
