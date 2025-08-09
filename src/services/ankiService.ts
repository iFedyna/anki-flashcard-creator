interface CardData {
  deckName: string;
  modelName: string;
  frontFieldName: string; // Anki field to place front content
  backFieldName: string;  // Default Anki field to place back/other content
  front: string;
  back: string; // If full back is precomposed
  // Full fields map (overrides front/back when provided)
  fields?: Record<string, string>;
  // Optional extras retained for backward compatibility (unused unless mapped externally)
  extra1?: string;
  extra2?: string;
  audio1: File | null; // Typically sentence audio
  audio2: File | null; // Typically word audio
  // Where to append audio markers
  appendAudio1To?: 'front' | 'back' | 'none';
  appendAudio2To?: 'front' | 'back' | 'none';
  // Or explicitly specify field names for audios
  appendAudio1ToFieldName?: string;
  appendAudio2ToFieldName?: string;
  // Images support
  images?: File[];
  appendImagesTo?: 'front' | 'back' | 'none';
  appendImagesToFieldName?: string;
  allowDuplicate?: boolean;
  tags?: string[];
}

const getBase64 = (file: File | null): Promise<{ filename: string; data: string } | null> => {
  return new Promise((resolve, reject) => {
    if (!file) {
      resolve(null);
      return;
    }
    
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64Data = result.substring(result.indexOf(',') + 1);
      resolve({ filename: file.name, data: base64Data });
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};

const getAnkiEndpoint = (): string => {
  // During development, go through Vite proxy to avoid CORS
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return '/anki';
  }
  // Default direct endpoint
  return 'http://127.0.0.1:8765';
};

const ankiConnectInvoke = (action: string, version: number, params: any = {}, timeoutMs: number = 5000) => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.timeout = timeoutMs;
    xhr.addEventListener('error', () => reject(new Error('Failed to issue request.')));
    xhr.addEventListener('timeout', () => reject(new Error('AnkiConnect request timed out.')));
    xhr.addEventListener('load', () => {
      try {
        const response = JSON.parse(xhr.responseText);
        if (Object.getOwnPropertyNames(response).length !== 2) {
          throw new Error('Response has an unexpected number of fields.');
        }
        if (!Object.prototype.hasOwnProperty.call(response, 'result')) {
          throw new Error("Response is missing required 'result' field.");
        }
        if (!Object.prototype.hasOwnProperty.call(response, 'error')) {
          throw new Error("Response is missing required 'error' field.");
        }
        if (response.error) {
          throw new Error(response.error);
        }
        resolve(response.result);
      } catch (e) {
        reject(e);
      }
    });

    xhr.open('POST', getAnkiEndpoint());
    xhr.send(JSON.stringify({ action, version, params }));
  });
};

// Public AnkiConnect helpers
const getDeckNames = async (): Promise<string[]> => {
  return ankiConnectInvoke('deckNames', 6, {}) as Promise<string[]>;
};

const getModelNames = async (): Promise<string[]> => {
  return ankiConnectInvoke('modelNames', 6, {}) as Promise<string[]>;
};

const getModelFieldNames = async (modelName: string): Promise<string[]> => {
  return ankiConnectInvoke('modelFieldNames', 6, { modelName }) as Promise<string[]>;
};

const sendToAnki = async (cardData: CardData): Promise<any> => {
  const {
    deckName,
    modelName,
    frontFieldName,
    backFieldName,
    front,
    back,
    fields,
    audio1,
    audio2,
    appendAudio1To = 'front',
    appendAudio2To = 'back',
    appendAudio1ToFieldName,
    appendAudio2ToFieldName,
    images = [],
    appendImagesTo = 'back',
    appendImagesToFieldName,
    allowDuplicate = false,
    tags = ['web-creator']
  } = cardData;
  
  try {
    const audioData1 = await getBase64(audio1);
    const audioData2 = await getBase64(audio2);
    const imageDatas: Array<{ filename: string; data: string }> = [];
    for (const img of images) {
      const d = await getBase64(img);
      if (d) imageDatas.push(d);
    }

    const computedFields: Record<string, string> = fields ?? {
      [frontFieldName]: front,
      [backFieldName]: back,
    };

    const note: any = {
      deckName,
      modelName,
      fields: computedFields,
      options: {
        allowDuplicate
      },
      tags
    };

    if (audioData1) {
      await ankiConnectInvoke('storeMediaFile', 6, {
        filename: `_${audioData1.filename}`,
        data: audioData1.data
      });
      const audio1Field = appendAudio1ToFieldName
        ? appendAudio1ToFieldName
        : appendAudio1To === 'front' ? frontFieldName
        : appendAudio1To === 'back' ? backFieldName
        : '';
      if (audio1Field) {
        note.fields[audio1Field] = (note.fields[audio1Field] || '') + `[sound:_${audioData1.filename}]`;
      }
    }

    if (audioData2) {
      await ankiConnectInvoke('storeMediaFile', 6, {
        filename: `_${audioData2.filename}`,
        data: audioData2.data
      });
      const audio2Field = appendAudio2ToFieldName
        ? appendAudio2ToFieldName
        : appendAudio2To === 'front' ? frontFieldName
        : appendAudio2To === 'back' ? backFieldName
        : '';
      if (audio2Field) {
        note.fields[audio2Field] = (note.fields[audio2Field] || '') + `[sound:_${audioData2.filename}]`;
      }
    }

    if (imageDatas.length > 0) {
      // Store images first
      for (const img of imageDatas) {
        await ankiConnectInvoke('storeMediaFile', 6, {
          filename: `_${img.filename}`,
          data: img.data
        });
      }
      const imagesField = appendImagesToFieldName
        ? appendImagesToFieldName
        : appendImagesTo === 'front' ? frontFieldName
        : appendImagesTo === 'back' ? backFieldName
        : '';
      if (imagesField) {
        const html = imageDatas.map(d => `<img src="_${d.filename}" />`).join('<br>');
        note.fields[imagesField] = [note.fields[imagesField] || '', html].filter(Boolean).join('<br>');
      }
    }

    return await ankiConnectInvoke('addNote', 6, { note });
  } catch (error) {
    throw error;
  }
};

export { sendToAnki, getDeckNames, getModelNames, getModelFieldNames };
export type { CardData };

/**
 * Lightweight connectivity check against AnkiConnect.
 * Returns true if AnkiConnect responds to a version request within timeout.
 */
const checkAnkiConnection = async (): Promise<boolean> => {
  try {
    await ankiConnectInvoke('version', 6, {}, 2000);
    return true;
  } catch {
    return false;
  }
};

export { checkAnkiConnection };
