import React, { useRef, useState } from 'react';
import './App.css';
import 'bulma/css/bulma.min.css';
import { Header } from './components/Header';
import { ConnectionStatus } from './components/ConnectionStatus';
import { InputField } from './components/InputField';
import { FieldWithButton } from './components/FieldWithButton';
// import { AddButton } from './components/AddButton';
import { ActionButtons } from './components/ActionButtons';
import { StatusMessage } from './components/StatusMessage';
import { sendToAnki } from './services/ankiService';
import { SettingsModal, DEFAULT_SETTINGS, SETTINGS_KEY, type AnkiSettings } from './components/SettingsModal';
import { loadJson } from './utils/storage';

function App() {
  // Settings state
  const [settings, setSettings] = useState<AnkiSettings>(() => loadJson<AnkiSettings>(SETTINGS_KEY, DEFAULT_SETTINGS));
  const [showSettings, setShowSettings] = useState(false);

  // Requested fields
  const [targetWord, setTargetWord] = useState('');
  const [sentence, setSentence] = useState('');
  const [sentenceTranslation, setSentenceTranslation] = useState('');
  const [definition, setDefinition] = useState('');
  const [exampleSentences, setExampleSentences] = useState('');
  const [notes, setNotes] = useState('');
  const [audioSentence, setAudioSentence] = useState<File | null>(null);
  const [audioWord, setAudioWord] = useState<File | null>(null);
  const [images, setImages] = useState<File[]>([]);
  const [memeMode, setMemeMode] = useState(false);
  const [modifySyntax, setModifySyntax] = useState(false);
  const [status, setStatus] = useState({ message: '', type: '', visible: false });
  const [isLoading, setIsLoading] = useState(false);

  const sentenceAudioInputRef = useRef<HTMLInputElement | null>(null);
  const wordAudioInputRef = useRef<HTMLInputElement | null>(null);
  const imagesInputRef = useRef<HTMLInputElement | null>(null);

  const clearForm = () => {
    setTargetWord('');
    setSentence('');
    setSentenceTranslation('');
    setDefinition('');
    setExampleSentences('');
    setNotes('');
    setAudioSentence(null);
    setAudioWord(null);
    setImages([]);
    setMemeMode(false);
    setModifySyntax(false);
    showStatus('Form cleared', 'info');
  };

  const showStatus = (message: string, type: string = 'info') => {
    setStatus({ message, type, visible: true });
    setTimeout(() => {
      setStatus(prev => ({ ...prev, visible: false }));
    }, 5000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    showStatus('Sending...', 'info');

    try {
      // Map to Anki note fields
      const front = targetWord.trim();
      const sections: string[] = [];
      if (modifySyntax) sections.push('<em>syntax: modified</em>');
      if (definition.trim()) sections.push(`<strong>Definition</strong><br>${definition.trim()}`);
      if (sentence.trim()) sections.push(`<strong>Sentence</strong><br>${sentence.trim()}`);
      if (sentenceTranslation.trim()) sections.push(`<strong>Translation</strong><br>${sentenceTranslation.trim()}`);
      if (exampleSentences.trim()) sections.push(`<strong>Examples</strong><br>${exampleSentences.trim()}`);
      if (notes.trim()) sections.push(`<strong>Notes</strong><br>${notes.trim()}`);
      if (memeMode) sections.push('<em>meme mode: on</em>');
      // Compose back according to settings.sectionOrder and sectionToField
      const keyToHtml: Record<string, string> = {
        targetWord: front ? `<strong>Word</strong><br>${front}` : '',
        definition: definition.trim() ? `<strong>Definition</strong><br>${definition.trim()}` : '',
        sentence: sentence.trim() ? `<strong>Sentence</strong><br>${sentence.trim()}` : '',
        sentenceTranslation: sentenceTranslation.trim() ? `<strong>Translation</strong><br>${sentenceTranslation.trim()}` : '',
        exampleSentences: exampleSentences.trim() ? `<strong>Examples</strong><br>${exampleSentences.trim()}` : '',
        notes: notes.trim() ? `<strong>Notes</strong><br>${notes.trim()}` : '',
        // Audio and images are not HTML-composed here; handled separately
        sentenceAudio: '',
        wordAudio: '',
        images: '',
      };
      const orderedHtml: string[] = [];
      settings.sectionOrder.forEach((key) => {
        if (key === 'targetWord' || key === 'sentenceAudio' || key === 'wordAudio' || key === 'images') return; // handled elsewhere
        const html = keyToHtml[key];
        if (html) orderedHtml.push(html);
      });
      let back = orderedHtml.join('<br><br>');

      // Prepare per-field overrides if user mapped sections to fields
      const fields: Record<string, string> = {};
      // Front always goes to configured front field
      fields[settings.frontFieldName] = front;
      // Sections mapped to specific fields
      settings.sectionOrder.forEach((key) => {
        const targetField = settings.sectionToField[key];
        const html = keyToHtml[key];
        if (targetField && html) {
          fields[targetField] = [fields[targetField], html].filter(Boolean).join('<br><br>');
        }
      });
      // If any section was mapped away, recompute back with only unmapped ones
      const unmappedHtml: string[] = [];
      settings.sectionOrder.forEach((key) => {
        if (key === 'targetWord' || key === 'sentenceAudio' || key === 'wordAudio' || key === 'images') return; // do not append these to Back by default
        if (!settings.sectionToField[key]) {
          const html = keyToHtml[key];
          if (html) unmappedHtml.push(html);
        }
      });
      back = unmappedHtml.join('<br><br>');

      // Audio placement mapping (override with section mapping if set)
      const a1 = settings.sectionToField['sentenceAudio']
        ? { mode: 'field', fieldName: settings.sectionToField['sentenceAudio'] }
        : settings.audio1Target;
      const a2 = settings.sectionToField['wordAudio']
        ? { mode: 'field', fieldName: settings.sectionToField['wordAudio'] }
        : settings.audio2Target;

      await sendToAnki({
        deckName: settings.deckName,
        modelName: settings.modelName,
        frontFieldName: settings.frontFieldName,
        backFieldName: settings.backFieldName,
        front,
        back,
        fields: Object.keys(fields).length ? fields : undefined,
        audio1: audioSentence,
        audio2: audioWord,
        appendAudio1To: a1.mode === 'field' ? 'none' : (a1.mode as any),
        appendAudio2To: a2.mode === 'field' ? 'none' : (a2.mode as any),
        appendAudio1ToFieldName: a1.mode === 'field' ? a1.fieldName : undefined,
        appendAudio2ToFieldName: a2.mode === 'field' ? a2.fieldName : undefined,
        images,
        appendImagesTo: settings.sectionToField['images'] ? 'none' : 'back',
        appendImagesToFieldName: settings.sectionToField['images'] || undefined,
        allowDuplicate: settings.allowDuplicate,
      });
      showStatus('Note added successfully!', 'success');
      clearForm();
    } catch (error: any) {
      showStatus(`Error: ${error.message || error}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app-container">
      <Header onOpenSettings={() => setShowSettings(true)} />
      <ConnectionStatus />

      <div className="container form-container">
        <form onSubmit={handleSubmit}>
          <div className="columns is-multiline">
            {/* Target word with inline toggle */}
            <div className="column is-12">
              <div className="section-box">
                <InputField
                  label="Target word"
                  icon="fas fa-bullseye"
                  value={targetWord}
                  onChange={setTargetWord}
                  placeholder="The word you want to learn"
                  trailingIcon="fas fa-clipboard"
                  textarea
                  rows={1}
                />
              </div>
            </div>

            {/* Sentence */}
            <div className="column is-12">
              <div className="section-box">
                <FieldWithButton
                  label="Sentence"
                  icon="fas fa-quote-left"
                  value={sentence}
                  onChange={setSentence}
                  placeholder="Sentence the target word is in"
                  textarea
                  rows={3}
                  buttonLabel="CREATE"
                  buttonIcon="fas fa-wand-magic-sparkles"
                  onButtonClick={() => console.log('Create sentence')}
                />
              </div>
            </div>

            {/* Sentence translation */}
            <div className="column is-12">
              <div className="section-box">
                <FieldWithButton
                  label="Sentence translation"
                  icon="fas fa-language"
                  value={sentenceTranslation}
                  onChange={setSentenceTranslation}
                  placeholder="You can enter a translation here"
                  textarea
                  rows={3}
                  buttonLabel="CREATE"
                  buttonIcon="fas fa-wand-magic-sparkles"
                  onButtonClick={() => console.log('Create translation')}
                />
              </div>
            </div>

            {/* Definition */}
            <div className="column is-12">
              <div className="section-box">
                <FieldWithButton
                  label="Definition"
                  icon="fas fa-book"
                  value={definition}
                  onChange={setDefinition}
                  placeholder="The meaning(s) of the target word"
                  textarea
                  rows={3}
                  buttonLabel="SEARCH"
                  buttonIcon="fas fa-wand-magic-sparkles"
                  onButtonClick={() => console.log('Search definitions')}
                />
              </div>
            </div>

            {/* Example sentences */}
            <div className="column is-12">
              <div className="section-box">
                <FieldWithButton
                  label="Example sentences"
                  icon="fas fa-list-ul"
                  value={exampleSentences}
                  onChange={setExampleSentences}
                  placeholder="Supplementary examples"
                  textarea
                  rows={3}
                  buttonLabel="SEARCH"
                  buttonIcon="fas fa-wand-magic-sparkles"
                  onButtonClick={() => console.log('Search example sentences')}
                />
              </div>
            </div>

            {/* Notes */}
            <div className="column is-12">
              <div className="section-box">
                <FieldWithButton
                  label="Notes"
                  icon="fas fa-sticky-note"
                  value={notes}
                  onChange={setNotes}
                  placeholder="Any tips for remembering this? Enter them here"
                  textarea
                  rows={3}
                  buttonLabel="CREATE"
                  buttonIcon="fas fa-wand-magic-sparkles"
                  onButtonClick={() => console.log('Create notes')}
                />
              </div>
            </div>

            {/* Audio - Sentence */}
            <div className="column is-12">
              <div className="section-box">
                <div className="label-row">
                  <label className="label"><span className="icon"><i className="fas fa-microphone"></i></span>Sentence audio</label>
                  <button type="button" className="label-link" onClick={() => console.log('Create TTS for sentence')}>
                    <span>CREATE</span>
                    <i className="fas fa-wand-magic-sparkles"></i>
                  </button>
                </div>
                <input
                  ref={sentenceAudioInputRef}
                  type="file"
                  accept="audio/*"
                  style={{ display: 'none' }}
                  onChange={(e) => setAudioSentence(e.target.files?.[0] || null)}
                />
                <div className="upload-pill" onClick={() => sentenceAudioInputRef.current?.click()}>
                  <span className="icon"><i className="fas fa-plus"></i></span>
                  <span>ADD</span>
                </div>
                {audioSentence && <p className="help">Selected: {audioSentence.name}</p>}
              </div>
            </div>

            {/* Audio - Word */}
            <div className="column is-12">
              <div className="section-box">
                <div className="label-row">
                  <label className="label"><span className="icon"><i className="fas fa-microphone-lines"></i></span>Word audio</label>
                  <button type="button" className="label-link" onClick={() => console.log('Search word audio')}>
                    <span>SEARCH</span>
                    <i className="fas fa-wand-magic-sparkles"></i>
                  </button>
                </div>
                <input
                  ref={wordAudioInputRef}
                  type="file"
                  accept="audio/*"
                  style={{ display: 'none' }}
                  onChange={(e) => setAudioWord(e.target.files?.[0] || null)}
                />
                <div className="upload-pill" onClick={() => wordAudioInputRef.current?.click()}>
                  <span className="icon"><i className="fas fa-plus"></i></span>
                  <span>ADD</span>
                </div>
                {audioWord && <p className="help">Selected: {audioWord.name}</p>}
              </div>
            </div>

            {/* Images */}
            <div className="column is-12">
              <div className="section-box">
                <div className="label-row">
                  <label className="label"><span className="icon"><i className="fas fa-images"></i></span>Images</label>
                  
                  <button type="button" className="label-link" onClick={() => console.log('Search images')}>
                    <span>SEARCH</span>
                    <i className="fas fa-wand-magic-sparkles"></i>
                  </button>
                </div>
                <input
                  ref={imagesInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const selected = Array.from(e.target.files || []);
                    if (selected.length) {
                      setImages(prev => [...prev, ...selected]);
                    }
                    // reset input to allow re-selecting same file(s)
                    if (imagesInputRef.current) imagesInputRef.current.value = '' as any;
                  }}
                />
                <div className="upload-pill" onClick={() => imagesInputRef.current?.click()}>
                  <span className="icon"><i className="fas fa-plus"></i></span>
                  <span>ADD</span>
                </div>
                {images.length > 0 && (
                  <p className="help">{images.length} image{images.length > 1 ? 's' : ''} selected</p>
                )}
              </div>
            </div>
          </div>

          <ActionButtons onClear={clearForm} isLoading={isLoading} />
        </form>

        <StatusMessage message={status.message} type={status.type} visible={status.visible} />
      </div>
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        onSave={(s) => setSettings(s)}
      />
    </div>
  );
}

export { App };
