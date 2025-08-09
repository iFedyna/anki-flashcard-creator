import React, { useEffect, useState } from 'react';
import { getDeckNames, getModelNames, getModelFieldNames } from '../services/ankiService';
import { loadJson, saveJson } from '../utils/storage';

export interface AnkiSettings {
  deckName: string;
  modelName: string;
  frontFieldName: string;
  backFieldName: string;
  // Reordering of app sections for composing back field
  sectionOrder: string[]; // array of app section keys in desired order
  // Mapping app sections to specific Anki fields (optional). If empty, sections go into backFieldName.
  sectionToField: Record<string, string>;
  // Audio placement
  audio1Target: { mode: 'front' | 'back' | 'field' | 'none'; fieldName?: string };
  audio2Target: { mode: 'front' | 'back' | 'field' | 'none'; fieldName?: string };
  allowDuplicate: boolean;
}

export interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (settings: AnkiSettings) => void;
}

const DEFAULT_SETTINGS: AnkiSettings = {
  deckName: 'Default',
  modelName: 'Basic',
  frontFieldName: 'Front',
  backFieldName: 'Back',
  sectionOrder: ['targetWord', 'definition', 'sentence', 'sentenceTranslation', 'exampleSentences', 'notes', 'sentenceAudio', 'wordAudio', 'images'],
  sectionToField: {},
  audio1Target: { mode: 'front' },
  audio2Target: { mode: 'back' },
  allowDuplicate: false,
};

const SETTINGS_KEY = 'anki_settings_v1';

const useSettingsState = () => {
  const allSections = ['targetWord', 'definition', 'sentence', 'sentenceTranslation', 'exampleSentences', 'notes', 'sentenceAudio', 'wordAudio', 'images'];
  const normalize = (s: AnkiSettings): AnkiSettings => {
    const existingOrder = Array.isArray(s.sectionOrder) ? s.sectionOrder : [];
    const mergedOrder = Array.from(new Set([...existingOrder.filter(k => allSections.includes(k)), ...allSections]));
    return { ...DEFAULT_SETTINGS, ...s, sectionOrder: mergedOrder, sectionToField: s.sectionToField || {} };
  };
  const [state, setStateRaw] = useState<AnkiSettings>(() => normalize(loadJson<AnkiSettings>(SETTINGS_KEY, DEFAULT_SETTINGS)));
  const save = (next: AnkiSettings) => {
    const normalized = normalize(next);
    setStateRaw(normalized);
    saveJson(SETTINGS_KEY, normalized);
  };
  return { state, setState: save };
};

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onSave }) => {
  const { state, setState } = useSettingsState();
  const [decks, setDecks] = useState<string[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [fields, setFields] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [deckNames, modelNames] = await Promise.all([getDeckNames(), getModelNames()]);
        if (cancelled) return;
        setDecks(deckNames);
        setModels(modelNames);
      } catch (e: any) {
        setError(e?.message || 'Failed to load decks/models');
      } finally {
        setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [isOpen]);

  useEffect(() => {
    if (!state.modelName) return;
    let cancelled = false;
    const loadFields = async () => {
      try {
        const f = await getModelFieldNames(state.modelName);
        if (cancelled) return;
        setFields(f);
      } catch (e) {
        // ignore
      }
    };
    loadFields();
    return () => { cancelled = true; };
  }, [state.modelName]);

  const handleSave = () => {
    onSave(state);
    onClose();
  };

  const update = (patch: Partial<AnkiSettings>) => setState({ ...state, ...patch });

  const reorderSection = (from: number, to: number) => {
    if (from === to) return;
    const next = [...state.sectionOrder];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    update({ sectionOrder: next });
  };

  const sectionLabels: Record<string, string> = {
    targetWord: 'Target word',
    definition: 'Definition',
    sentence: 'Sentence',
    sentenceTranslation: 'Translation',
    exampleSentences: 'Examples',
    notes: 'Notes',
    sentenceAudio: 'Sentence audio',
    wordAudio: 'Word audio',
    images: 'Images',
  };

  if (!isOpen) return null;

  return (
    <div className="modal is-active">
      <div className="modal-background" onClick={onClose}></div>
      <div className="modal-card">
        <header className="modal-card-head">
          <p className="modal-card-title">Anki Settings</p>
          <button className="delete" aria-label="close" onClick={onClose}></button>
        </header>
        <section className="modal-card-body">
          {loading && <p>Loading...</p>}
          {error && <p className="has-text-danger">{error}</p>}

          <div className="field">
            <label className="label">Deck</label>
            <div className="control">
              <div className="select is-fullwidth">
                <select
                  value={state.deckName}
                  onChange={(e) => update({ deckName: e.target.value })}
                >
                  {decks.map((d) => (<option key={d} value={d}>{d}</option>))}
                </select>
              </div>
            </div>
          </div>

          <div className="field">
            <label className="label">Note type (model)</label>
            <div className="control">
              <div className="select is-fullwidth">
                <select
                  value={state.modelName}
                  onChange={(e) => update({ modelName: e.target.value })}
                >
                  {models.map((m) => (<option key={m} value={m}>{m}</option>))}
                </select>
              </div>
            </div>
          </div>

          <div className="field is-horizontal">
            <div className="field-body">
              <div className="field">
                <label className="label">Front field</label>
                <div className="control">
                  <div className="select is-fullwidth">
                    <select
                      value={state.frontFieldName}
                      onChange={(e) => update({ frontFieldName: e.target.value })}
                    >
                      {fields.map((f) => (<option key={f} value={f}>{f}</option>))}
                    </select>
                  </div>
                </div>
              </div>
              <div className="field">
                <label className="label">Back field</label>
                <div className="control">
                  <div className="select is-fullwidth">
                    <select
                      value={state.backFieldName}
                      onChange={(e) => update({ backFieldName: e.target.value })}
                    >
                      {fields.map((f) => (<option key={f} value={f}>{f}</option>))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <hr />
          <p className="mb-2"><strong>Sections order and mapping</strong></p>
          <p className="is-size-7 mb-3">Choose which app sections are appended to the Back field (or map to specific Anki fields). Use arrows to reorder.</p>

          {state.sectionOrder.map((key, idx) => (
            <div className="field is-grouped" key={key}>
              <div className="control" style={{ minWidth: 180, paddingTop: 7 }}>
                {sectionLabels[key] || key}
              </div>
              <div className="control">
                <div className="select">
                  <select
                    value={state.sectionToField[key] || ''}
                    onChange={(e) => update({ sectionToField: { ...state.sectionToField, [key]: e.target.value } })}
                  >
                    <option value="">Append to Back</option>
                    {fields.map((f) => (<option key={f} value={f}>{f}</option>))}
                  </select>
                </div>
              </div>
              <div className="control">
                <button type="button" className="button is-small" onClick={() => reorderSection(idx, Math.max(0, idx - 1))} disabled={idx === 0}>
                  <span className="icon"><i className="fas fa-arrow-up"></i></span>
                </button>
              </div>
              <div className="control">
                <button type="button" className="button is-small" onClick={() => reorderSection(idx, Math.min(state.sectionOrder.length - 1, idx + 1))} disabled={idx === state.sectionOrder.length - 1}>
                  <span className="icon"><i className="fas fa-arrow-down"></i></span>
                </button>
              </div>
            </div>
          ))}

          <hr />
          <p className="mb-2"><strong>Audio placement</strong></p>
          <div className="field is-horizontal">
            <div className="field-body">
              <div className="field">
                <label className="label">Audio 1</label>
                <div className="control">
                  <div className="select is-fullwidth">
                    <select
                      value={state.audio1Target.mode + (state.audio1Target.mode === 'field' ? `:${state.audio1Target.fieldName || ''}` : '')}
                      onChange={(e) => {
                        const [mode, fieldName] = e.target.value.split(':');
                        update({ audio1Target: { mode: mode as any, fieldName } });
                      }}
                    >
                      <option value="front">Append to Front</option>
                      <option value="back">Append to Back</option>
                      <option value="none">Do not append</option>
                      {fields.map((f) => (<option key={f} value={`field:${f}`}>Append to field: {f}</option>))}
                    </select>
                  </div>
                </div>
              </div>
              <div className="field">
                <label className="label">Audio 2</label>
                <div className="control">
                  <div className="select is-fullwidth">
                    <select
                      value={state.audio2Target.mode + (state.audio2Target.mode === 'field' ? `:${state.audio2Target.fieldName || ''}` : '')}
                      onChange={(e) => {
                        const [mode, fieldName] = e.target.value.split(':');
                        update({ audio2Target: { mode: mode as any, fieldName } });
                      }}
                    >
                      <option value="front">Append to Front</option>
                      <option value="back">Append to Back</option>
                      <option value="none">Do not append</option>
                      {fields.map((f) => (<option key={f} value={`field:${f}`}>Append to field: {f}</option>))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="field">
            <label className="checkbox">
              <input
                type="checkbox"
                checked={state.allowDuplicate}
                onChange={(e) => update({ allowDuplicate: e.target.checked })}
                style={{ marginRight: 8 }}
              />
              Allow duplicates
            </label>
          </div>
        </section>
        <footer className="modal-card-foot">
          <button className="button is-success" onClick={handleSave}>Save</button>
          <button className="button" onClick={onClose}>Cancel</button>
        </footer>
      </div>
    </div>
  );
};

export { SettingsModal, DEFAULT_SETTINGS, SETTINGS_KEY };
