/**
 * Справочник продуктов, оборудования и стандартных услуг ООО «Аверс Технолоджи».
 * Дефолтные демо-данные + runtime-кэш для редактора КП.
 */

export interface SoftwareProduct {
  id: string;
  name: string;
  description: string;
  oneTimePrice: number;
  subscriptionPrice: number;
  unit: string;
}

export interface ServiceProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  unit: string;
}

/** Оборудование / комплектующие — единая цена продажи */
export interface HardwareProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  unit: string;
}

export type CatalogItemProduct = SoftwareProduct | ServiceProduct | HardwareProduct;

export interface ProductsDirectory {
  software: SoftwareProduct[];
  services: ServiceProduct[];
  hardware: HardwareProduct[];
}

/** Демо-каталог — сидится в Firestore, если коллекция пуста */
export const DEFAULT_PRODUCTS_DIRECTORY: ProductsDirectory = {
  software: [
    {
      id: 'avers_front',
      name: 'Аверс. Фронт',
      description: 'Модуль кассира и кассовое ПО для точек питания',
      oneTimePrice: 25000,
      subscriptionPrice: 1500,
      unit: 'лиц.',
    },
    {
      id: 'avers_web',
      name: 'Аверс. Веб',
      description: 'Портал отчетов, личный кабинет и аналитика сети',
      oneTimePrice: 45000,
      subscriptionPrice: 3000,
      unit: 'лиц.',
    },
    {
      id: 'avers_kitchen',
      name: 'Аверс. Кухня',
      description: 'Интерактивное табло поваров для контроля заказов',
      oneTimePrice: 15000,
      subscriptionPrice: 1000,
      unit: 'экз.',
    },
  ],
  services: [
    {
      id: 'install_po',
      name: 'Установка и настройка кассового ПО',
      description: 'Пусконаладка на терминале заказчика',
      price: 5000,
      unit: 'услуга',
    },
    {
      id: 'acquiring',
      name: 'Подключение эквайринга',
      description: 'Интеграция банковского терминала с кассовым модулем',
      price: 3000,
      unit: 'терм.',
    },
    {
      id: 'training',
      name: 'Обучение персонала работе с ПО',
      description: 'Инструктаж кассиров и администраторов (до 5 человек)',
      price: 4000,
      unit: 'сессия',
    },
  ],
  hardware: [],
};

/** @deprecated используйте DEFAULT_PRODUCTS_DIRECTORY или loadProductsDirectory() */
export const PRODUCTS_DIRECTORY = DEFAULT_PRODUCTS_DIRECTORY;

let catalogCache: ProductsDirectory = {
  software: [...DEFAULT_PRODUCTS_DIRECTORY.software],
  services: [...DEFAULT_PRODUCTS_DIRECTORY.services],
  hardware: [...DEFAULT_PRODUCTS_DIRECTORY.hardware],
};

export function setProductsCatalogCache(directory: ProductsDirectory): void {
  catalogCache = {
    software: [...directory.software],
    services: [...directory.services],
    hardware: [...(directory.hardware ?? [])],
  };
}

export function getProductsCatalogCache(): ProductsDirectory {
  return catalogCache;
}

export function findSoftwareProduct(catalogId: string): SoftwareProduct | undefined {
  return catalogCache.software.find((p) => p.id === catalogId);
}

export function findServiceProduct(catalogId: string): ServiceProduct | undefined {
  return catalogCache.services.find((p) => p.id === catalogId);
}

export function findHardwareProduct(catalogId: string): HardwareProduct | undefined {
  return catalogCache.hardware.find((p) => p.id === catalogId);
}

export function catalogProductsToDirectory(
  products: Array<{
    id: string;
    type: 'software' | 'service' | 'hardware';
    name: string;
    description: string;
    unit: string;
    oneTimePrice?: number;
    subscriptionPrice?: number;
    price?: number;
  }>
): ProductsDirectory {
  const software: SoftwareProduct[] = [];
  const services: ServiceProduct[] = [];
  const hardware: HardwareProduct[] = [];

  for (const item of products) {
    if (item.type === 'software') {
      software.push({
        id: item.id,
        name: item.name,
        description: item.description,
        oneTimePrice: Number(item.oneTimePrice) || 0,
        subscriptionPrice: Number(item.subscriptionPrice) || 0,
        unit: item.unit || 'лиц.',
      });
    } else if (item.type === 'hardware') {
      hardware.push({
        id: item.id,
        name: item.name,
        description: item.description,
        price: Number(item.price) || 0,
        unit: item.unit || 'шт.',
      });
    } else {
      services.push({
        id: item.id,
        name: item.name,
        description: item.description,
        price: Number(item.price) || 0,
        unit: item.unit || 'услуга',
      });
    }
  }

  software.sort((a, b) => a.name.localeCompare(b.name, 'ru'));
  services.sort((a, b) => a.name.localeCompare(b.name, 'ru'));
  hardware.sort((a, b) => a.name.localeCompare(b.name, 'ru'));

  return { software, services, hardware };
}
