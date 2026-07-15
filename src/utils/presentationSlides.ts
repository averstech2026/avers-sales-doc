export type PresentationSlideAssetKey = 'about' | 'recognition' | 'qr';

export interface PresentationSlideAssetDef {
  key: PresentationSlideAssetKey;
  title: string;
  description: string;
  defaultFile: string;
  /** Max output width when compressing uploads */
  maxWidth: number;
  hint: string;
}

export interface PresentationSlideOverrides {
  aboutImageDataUrl?: string | null;
  recognitionImageDataUrl?: string | null;
  qrImageDataUrl?: string | null;
  updatedAt?: string;
  updatedByUid?: string;
  updatedByName?: string;
}

export interface ResolvedSlideAssets {
  aboutImageSrc: string;
  recognitionImageSrc: string;
  qrImageSrc: string;
  aboutIsCustom: boolean;
  recognitionIsCustom: boolean;
  qrIsCustom: boolean;
}

export const PRESENTATION_SLIDES_SETTINGS_DOC = 'presentation_slides';

export const PRESENTATION_SLIDE_ASSETS: PresentationSlideAssetDef[] = [
  {
    key: 'about',
    title: 'Слайд «О компании»',
    description: 'Фото в правой колонке: команда разработки / рабочее место.',
    defaultFile: 'dev-team.png',
    maxWidth: 1400,
    hint: 'Рекомендуется горизонтальное фото 4:3 или 3:2, без текста на изображении.',
  },
  {
    key: 'recognition',
    title: 'Слайд «Распознавание еды»',
    description: 'Фото оборудования Умной кассы в правой колонке.',
    defaultFile: 'smart-kassa.png',
    maxWidth: 1400,
    hint: 'Лучше кадр с киоском на светлом фоне, без лишнего текста вокруг.',
  },
  {
    key: 'qr',
    title: 'QR-код видео',
    description: 'QR на слайде «Распознавание еды» со ссылкой на видео демо.',
    defaultFile: 'qr-video.png',
    maxWidth: 512,
    hint: 'Квадратный PNG/JPG с QR-кодом. Замените, если сменилась ссылка на видео.',
  },
];

export function defaultSlideAssetUrl(fileName: string): string {
  return `${import.meta.env.BASE_URL}assets/slides/${fileName}`;
}

export function getDefaultSlideAssets(): ResolvedSlideAssets {
  return {
    aboutImageSrc: defaultSlideAssetUrl('dev-team.png'),
    recognitionImageSrc: defaultSlideAssetUrl('smart-kassa.png'),
    qrImageSrc: defaultSlideAssetUrl('qr-video.png'),
    aboutIsCustom: false,
    recognitionIsCustom: false,
    qrIsCustom: false,
  };
}

export function resolveSlideAssets(
  overrides?: PresentationSlideOverrides | null
): ResolvedSlideAssets {
  const defaults = getDefaultSlideAssets();
  const about = overrides?.aboutImageDataUrl?.trim() || null;
  const recognition = overrides?.recognitionImageDataUrl?.trim() || null;
  const qr = overrides?.qrImageDataUrl?.trim() || null;

  return {
    aboutImageSrc: about || defaults.aboutImageSrc,
    recognitionImageSrc: recognition || defaults.recognitionImageSrc,
    qrImageSrc: qr || defaults.qrImageSrc,
    aboutIsCustom: Boolean(about),
    recognitionIsCustom: Boolean(recognition),
    qrIsCustom: Boolean(qr),
  };
}

export function getOverrideField(
  key: PresentationSlideAssetKey
): keyof PresentationSlideOverrides {
  if (key === 'about') return 'aboutImageDataUrl';
  if (key === 'recognition') return 'recognitionImageDataUrl';
  return 'qrImageDataUrl';
}

/** Resize & compress image to keep Firestore docs under size limits. */
export function compressImageFile(
  file: File,
  maxWidth: number,
  quality = 0.85
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Можно загружать только изображения'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Не удалось прочитать файл'));
    reader.onload = () => {
      const src = String(reader.result || '');
      const img = new Image();
      img.onerror = () => reject(new Error('Некорректный файл изображения'));
      img.onload = () => {
        const scale = Math.min(1, maxWidth / Math.max(img.width, 1));
        const width = Math.max(1, Math.round(img.width * scale));
        const height = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas недоступен'));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const mime = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        resolve(canvas.toDataURL(mime, quality));
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  });
}
