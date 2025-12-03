interface Field {
  name: string;
  type: "numberInput" | "textarea" | "dateInput" | "path";
  required: boolean;
  placement: "path" | "body" | "query";
}

// Тип для элемента в customRoutesConfig
interface CustomRoute {
  url: string;
  method: "get" | "post" | "delete" | "put" | "patch"; // можно расширить по нужным методам
  fields: Field[];
}

// Основной тип для объекта
export interface BotConfig {
  broadcast: boolean;
  subscriptions: boolean;
  promocodes: boolean;
  reports: boolean;
  referral: boolean;
  customRoutesConfig: CustomRoute[];
}

export interface Bot {
  id: string;
  name: string;
  apiUrl: string;
  token: string;
  config: BotConfig;
  createdAt: Date;
  updatedAt: Date;
}
