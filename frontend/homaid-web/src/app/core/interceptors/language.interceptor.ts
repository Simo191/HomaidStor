import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { LanguageService } from '../services/language.service';

export const languageInterceptor: HttpInterceptorFn = (req, next) => {
  const lang = inject(LanguageService);
  const lc = lang.current();
  if (req.params.has('lang')) {
    return next(req);
  }
  return next(req.clone({
    setParams: { lang: lc },
    setHeaders: { 'Accept-Language': lc }
  }));
};
