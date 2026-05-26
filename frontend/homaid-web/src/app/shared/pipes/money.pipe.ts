import { Pipe, PipeTransform, inject } from '@angular/core';
import { LanguageService } from '../../core/services/language.service';

@Pipe({ name: 'money', standalone: true, pure: false })
export class MoneyPipe implements PipeTransform {
  private lang = inject(LanguageService);

  transform(value: number | null | undefined, currency = 'MAD'): string {
    if (value === null || value === undefined || Number.isNaN(value)) return '';
    const locale = this.lang.current() === 'ar' ? 'ar-MA' : this.lang.current() === 'en' ? 'en-US' : 'fr-MA';
    try {
      return new Intl.NumberFormat(locale, { style: 'currency', currency, maximumFractionDigits: 2 }).format(value);
    } catch {
      return `${value.toFixed(2)} ${currency}`;
    }
  }
}
