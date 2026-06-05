import { registerLocaleData } from '@angular/common';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import localeAr from '@angular/common/locales/ar';
import localeEn from '@angular/common/locales/en';
import localeFr from '@angular/common/locales/fr';
import { ApplicationConfig, LOCALE_ID, inject, provideAppInitializer, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { TranslateService, provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import { provideQuillConfig } from 'ngx-quill';
import { firstValueFrom } from 'rxjs';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { languageInterceptor } from './core/interceptors/language.interceptor';
import { LanguageService } from './core/services/language.service';

registerLocaleData(localeFr, 'fr');
registerLocaleData(localeAr, 'ar');
registerLocaleData(localeEn, 'en');

function localeIdFactory(): string {
  try {
    const stored = JSON.parse(localStorage.getItem('homaid.lang') ?? '""');
    if (stored === 'fr' || stored === 'ar' || stored === 'en') return stored;
  } catch { /* ignore */ }
  return 'fr';
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    { provide: LOCALE_ID, useFactory: localeIdFactory },
    provideRouter(routes, withInMemoryScrolling({ scrollPositionRestoration: 'top', anchorScrolling: 'enabled' })),
    provideHttpClient(withInterceptors([authInterceptor, languageInterceptor])),
    provideQuillConfig({ theme: 'snow' }),
    provideTranslateService({ fallbackLang: 'fr' }),
    provideTranslateHttpLoader({ prefix: '/i18n/', suffix: '.json' }),
    provideAppInitializer(async () => {
      const translate = inject(TranslateService);
      const lang = inject(LanguageService);
      translate.addLangs(['fr', 'ar', 'en']);
      await firstValueFrom(translate.use(lang.current()));
    })
  ]
};
