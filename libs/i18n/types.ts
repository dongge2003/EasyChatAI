export type Locale = 'en' | 'zh';

export interface I18nMessages {
  [key: string]: string | string[] | I18nMessages;
}
