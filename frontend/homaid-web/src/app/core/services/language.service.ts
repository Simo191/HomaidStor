import { DOCUMENT } from '@angular/common';
import { Injectable, computed, inject, signal } from '@angular/core';
import { environment } from '../../../environments/environment';
import { StorageService } from './storage.service';

export type SupportedLanguage = 'fr' | 'ar' | 'en';

const STORAGE_KEY = 'homaid.lang';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private doc = inject(DOCUMENT);
  private storage = inject(StorageService);

  private _current = signal<SupportedLanguage>(this.detectInitial());

  readonly current = this._current.asReadonly();
  readonly isRtl = computed(() => this._current() === 'ar');

  constructor() {
    this.applyToDom(this._current());
  }

  set(lang: SupportedLanguage): void {
    if (!environment.supportedLanguages.includes(lang)) return;
    this._current.set(lang);
    this.storage.set(STORAGE_KEY, lang);
    this.applyToDom(lang);
  }

  private detectInitial(): SupportedLanguage {
    const stored = this.storage.get<SupportedLanguage>(STORAGE_KEY);
    if (stored && environment.supportedLanguages.includes(stored)) return stored;
    const nav = (this.doc.defaultView?.navigator?.language || 'fr').slice(0, 2) as SupportedLanguage;
    return environment.supportedLanguages.includes(nav) ? nav : (environment.defaultLanguage as SupportedLanguage);
  }

  private applyToDom(lang: SupportedLanguage): void {
    const html = this.doc.documentElement;
    html.setAttribute('lang', lang);
    html.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
  }
}
