import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { PaymentMethod, PlaceOrderRequest, ShippingMethod } from '../../core/models/order.models';
import { ApiException } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { CartService } from '../../core/services/cart.service';
import { OrderService, ShippingService } from '../../core/services/order.service';
import { ToastService } from '../../core/services/toast.service';
import { MoneyPipe } from '../../shared/pipes/money.pipe';

interface CheckoutForm {
  // Contact (toujours obligatoire — même invité)
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  // Adresse de livraison
  street: string;
  streetComplement: string;
  city: string;
  region: string;
  postalCode: string;
  countryCode: string;
  // Paiement + notes
  shippingMethodId: string;
  paymentMethod: PaymentMethod;
  customerNotes: string;
  // Création de compte (opt-in invité)
  createAccount: boolean;
  password: string;
}

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MoneyPipe],
  template: `
<div class="container my-4">
  <h1 class="h3 mb-4"><i class="bi bi-credit-card text-primary"></i> Finaliser ma commande</h1>

  @if (cart.isEmpty()) {
    <div class="alert alert-warning">
      <i class="bi bi-cart-x me-2"></i>Votre panier est vide.
      <a routerLink="/catalog" class="alert-link">Retour au catalogue</a>
    </div>
  } @else {
    <form #f="ngForm" (ngSubmit)="submit(f)" novalidate>
      <div class="row g-4">

        <!-- COL GAUCHE : FORMULAIRE -->
        <div class="col-lg-8">

          <!-- Bandeau invité/client -->
          @if (!auth.isAuthenticated()) {
            <div class="alert alert-info d-flex justify-content-between align-items-center">
              <span><i class="bi bi-info-circle me-2"></i>
                Vous commandez en tant qu'<strong>invité</strong> — pas besoin de créer un compte.
              </span>
              <a routerLink="/login" [queryParams]="{ returnUrl: '/checkout' }" class="btn btn-sm btn-outline-primary">
                Se connecter
              </a>
            </div>
          } @else {
            <div class="alert alert-success">
              <i class="bi bi-person-check me-2"></i>
              Connecté en tant que <strong>{{ auth.user()?.fullName }}</strong> ({{ auth.user()?.email }})
            </div>
          }

          <!-- 1. Contact -->
          <div class="card mb-3">
            <div class="card-header bg-white"><strong>1. Vos coordonnées</strong></div>
            <div class="card-body">
              <div class="row g-3">
                <div class="col-md-6">
                  <label class="form-label">Prénom <span class="text-danger">*</span></label>
                  <input type="text" name="firstName" class="form-control" [(ngModel)]="form.firstName" required maxlength="80">
                </div>
                <div class="col-md-6">
                  <label class="form-label">Nom <span class="text-danger">*</span></label>
                  <input type="text" name="lastName" class="form-control" [(ngModel)]="form.lastName" required maxlength="80">
                </div>
                <div class="col-md-6">
                  <label class="form-label">Email <span class="text-danger">*</span></label>
                  <input type="email" name="email" class="form-control" [(ngModel)]="form.email" required email>
                </div>
                <div class="col-md-6">
                  <label class="form-label">Téléphone <span class="text-danger">*</span></label>
                  <input type="tel" name="phone" class="form-control" [(ngModel)]="form.phone" required maxlength="30"
                         placeholder="+212 6 00 00 00 00">
                </div>
              </div>
            </div>
          </div>

          <!-- 2. Adresse -->
          <div class="card mb-3">
            <div class="card-header bg-white"><strong>2. Adresse de livraison</strong></div>
            <div class="card-body">
              <div class="row g-3">
                <div class="col-md-8">
                  <label class="form-label">Adresse <span class="text-danger">*</span></label>
                  <input type="text" name="street" class="form-control" [(ngModel)]="form.street" required
                         placeholder="N°, rue, quartier">
                </div>
                <div class="col-md-4">
                  <label class="form-label">Complément</label>
                  <input type="text" name="streetComplement" class="form-control" [(ngModel)]="form.streetComplement"
                         placeholder="Appt, étage...">
                </div>
                <div class="col-md-5">
                  <label class="form-label">Ville <span class="text-danger">*</span></label>
                  <input type="text" name="city" class="form-control" [(ngModel)]="form.city" required>
                </div>
                <div class="col-md-4">
                  <label class="form-label">Région</label>
                  <input type="text" name="region" class="form-control" [(ngModel)]="form.region">
                </div>
                <div class="col-md-3">
                  <label class="form-label">Code postal</label>
                  <input type="text" name="postalCode" class="form-control" [(ngModel)]="form.postalCode">
                </div>
                <div class="col-md-6">
                  <label class="form-label">Pays <span class="text-danger">*</span></label>
                  <select name="countryCode" class="form-select" [(ngModel)]="form.countryCode"
                          (ngModelChange)="onCountryChange($event)" required>
                    <option value="MA">🇲🇦 Maroc</option>
                    <option value="FR">🇫🇷 France</option>
                    <option value="ES">🇪🇸 Espagne</option>
                    <option value="BE">🇧🇪 Belgique</option>
                    <option value="DE">🇩🇪 Allemagne</option>
                    <option value="GB">🇬🇧 Royaume-Uni</option>
                    <option value="US">🇺🇸 États-Unis</option>
                    <option value="CA">🇨🇦 Canada</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <!-- 3. Livraison -->
          <div class="card mb-3">
            <div class="card-header bg-white"><strong>3. Mode de livraison</strong></div>
            <div class="card-body">
              @if (loadingMethods()) {
                <div class="text-center"><div class="spinner-border spinner-border-sm"></div></div>
              } @else if (shippingMethods().length === 0) {
                <div class="alert alert-warning mb-0">Aucun mode de livraison disponible pour ce pays.</div>
              } @else {
                @for (m of shippingMethods(); track m.id) {
                  <div class="form-check border rounded p-3 mb-2 shipping-option"
                       [class.border-primary]="form.shippingMethodId === m.id"
                       [class.bg-light]="form.shippingMethodId === m.id">
                    <input class="form-check-input" type="radio" name="shippingMethodId"
                           [id]="'ship-' + m.id" [value]="m.id" [(ngModel)]="form.shippingMethodId" required>
                    <label class="form-check-label d-flex justify-content-between align-items-center w-100" [for]="'ship-' + m.id">
                      <span>
                        <strong>{{ m.name }}</strong>
                        <small class="d-block text-muted">{{ m.estimatedMinDays }}-{{ m.estimatedMaxDays }} jours ouvrés</small>
                      </span>
                      <span class="fw-bold text-primary">
                        @if (m.freeShippingThreshold && cart.subtotal() >= m.freeShippingThreshold) {
                          <span class="text-success">Gratuit</span>
                        } @else {
                          {{ m.baseFee | money:cart.currency() }}
                        }
                      </span>
                    </label>
                  </div>
                }
              }
            </div>
          </div>

          <!-- 4. Paiement -->
          <div class="card mb-3">
            <div class="card-header bg-white"><strong>4. Mode de paiement</strong></div>
            <div class="card-body">
              @if (form.countryCode === 'MA') {
                <div class="form-check border rounded p-3 mb-2"
                     [class.border-primary]="form.paymentMethod === 'CashOnDelivery'"
                     [class.bg-light]="form.paymentMethod === 'CashOnDelivery'">
                  <input class="form-check-input" type="radio" name="paymentMethod"
                         id="pay-cod" value="CashOnDelivery" [(ngModel)]="form.paymentMethod">
                  <label class="form-check-label" for="pay-cod">
                    <strong><i class="bi bi-cash-coin"></i> Paiement à la livraison (cash)</strong>
                    <small class="d-block text-muted">Vous payez en espèces lorsque le livreur vous remet votre commande.</small>
                  </label>
                </div>
              } @else {
                <div class="form-check border rounded p-3 mb-2 border-primary bg-light">
                  <input class="form-check-input" type="radio" name="paymentMethod"
                         id="pay-bank" value="BankTransfer" [(ngModel)]="form.paymentMethod" checked>
                  <label class="form-check-label" for="pay-bank">
                    <strong><i class="bi bi-bank"></i> Virement bancaire préalable</strong>
                    <small class="d-block text-muted">Vous recevrez par email un RIB pour effectuer le virement.
                      Votre commande sera préparée dès réception du paiement.</small>
                  </label>
                </div>
              }
            </div>
          </div>

          <!-- 5. Notes + opt-in compte -->
          <div class="card mb-3">
            <div class="card-header bg-white"><strong>5. Note pour la livraison (optionnel)</strong></div>
            <div class="card-body">
              <textarea name="customerNotes" class="form-control" rows="2" [(ngModel)]="form.customerNotes"
                        placeholder="Sonner avant de monter, livrer le matin..." maxlength="2000"></textarea>

              @if (!auth.isAuthenticated()) {
                <hr>
                <div class="form-check">
                  <input class="form-check-input" type="checkbox" id="createAccount" name="createAccount"
                         [(ngModel)]="form.createAccount">
                  <label class="form-check-label" for="createAccount">
                    Créer un compte avec ces informations (suivre mes commandes facilement)
                  </label>
                </div>
                @if (form.createAccount) {
                  <div class="mt-2">
                    <label class="form-label small">Mot de passe (min. 8 caractères)</label>
                    <input type="password" name="password" class="form-control" [(ngModel)]="form.password"
                           minlength="8" maxlength="100" [required]="form.createAccount">
                  </div>
                }
              }
            </div>
          </div>
        </div>

        <!-- COL DROITE : RÉSUMÉ -->
        <div class="col-lg-4">
          <div class="card sticky-top" style="top:80px">
            <div class="card-header bg-white"><strong>Votre commande</strong></div>
            <div class="card-body">
              @for (line of cart.lines(); track line.productId) {
                <div class="d-flex gap-2 mb-2 small">
                  <img [src]="line.imageUrl || 'https://picsum.photos/seed/' + line.slug + '/60/60'"
                       [alt]="line.name" class="rounded" style="width:50px; height:50px; object-fit:cover">
                  <div class="flex-grow-1">
                    <div class="fw-semibold">{{ line.name }}</div>
                    <small class="text-muted">× {{ line.quantity }}</small>
                  </div>
                  <div class="text-end fw-bold">
                    {{ (line.unitPrice * line.quantity) | money:line.currency }}
                  </div>
                </div>
              }
              <hr>
              <div class="d-flex justify-content-between mb-1">
                <span>Sous-total</span>
                <span>{{ cart.subtotal() | money:cart.currency() }}</span>
              </div>
              <div class="d-flex justify-content-between mb-1">
                <span>Livraison</span>
                <span>
                  @if (shippingFee() === 0 && form.shippingMethodId) {
                    <span class="text-success">Gratuit</span>
                  } @else {
                    {{ shippingFee() | money:cart.currency() }}
                  }
                </span>
              </div>
              <hr>
              <div class="d-flex justify-content-between mb-3">
                <strong>Total</strong>
                <strong class="text-primary fs-5">{{ total() | money:cart.currency() }}</strong>
              </div>
              <button type="submit" class="btn btn-primary w-100" [disabled]="submitting() || !form.shippingMethodId">
                @if (submitting()) {
                  <span class="spinner-border spinner-border-sm me-2"></span>Envoi...
                } @else {
                  <i class="bi bi-check-circle"></i> Confirmer la commande
                }
              </button>
              <p class="small text-muted text-center mt-2 mb-0">
                <i class="bi bi-shield-lock"></i> Vos données sont protégées (RGPD + loi 09-08).
              </p>
            </div>
          </div>
        </div>
      </div>
    </form>
  }
</div>
  `,
  styles: [`
    .shipping-option { cursor: pointer; transition: background .15s; }
    .shipping-option:hover { background:#fafbfd; }
  `]
})
export class CheckoutComponent {
  readonly cart = inject(CartService);
  readonly auth = inject(AuthService);
  private orders = inject(OrderService);
  private shipping = inject(ShippingService);
  private toast = inject(ToastService);
  private router = inject(Router);

  shippingMethods = signal<ShippingMethod[]>([]);
  loadingMethods = signal(false);
  submitting = signal(false);

  form: CheckoutForm = {
    firstName: '', lastName: '', email: '', phone: '',
    street: '', streetComplement: '', city: '', region: '', postalCode: '', countryCode: 'MA',
    shippingMethodId: '',
    paymentMethod: 'CashOnDelivery',
    customerNotes: '',
    createAccount: false, password: ''
  };

  shippingFee = computed(() => {
    const m = this.shippingMethods().find(x => x.id === this.form.shippingMethodId);
    if (!m) return 0;
    if (m.freeShippingThreshold && this.cart.subtotal() >= m.freeShippingThreshold) return 0;
    return m.baseFee;
  });

  total = computed(() => this.cart.subtotal() + this.shippingFee());

  constructor() {
    // Préremplir si connecté
    const user = this.auth.user();
    if (user) {
      const parts = user.fullName.split(' ');
      this.form.firstName = parts[0] || '';
      this.form.lastName = parts.slice(1).join(' ') || '';
      this.form.email = user.email;
    }

    this.loadShippingMethods(this.form.countryCode);

    // Auto-switch payment method when country changes
    effect(() => {
      if (this.form.countryCode !== 'MA' && this.form.paymentMethod === 'CashOnDelivery') {
        this.form.paymentMethod = 'BankTransfer';
      }
    });
  }

  onCountryChange(code: string): void {
    this.form.countryCode = code;
    this.form.shippingMethodId = '';
    if (code !== 'MA') this.form.paymentMethod = 'BankTransfer';
    else this.form.paymentMethod = 'CashOnDelivery';
    this.loadShippingMethods(code);
  }

  private loadShippingMethods(country: string): void {
    this.loadingMethods.set(true);
    this.shipping.getMethodsForCountry(country).subscribe({
      next: ms => {
        this.shippingMethods.set(ms);
        if (ms.length > 0) this.form.shippingMethodId = ms[0].id;
        this.loadingMethods.set(false);
      },
      error: () => { this.shippingMethods.set([]); this.loadingMethods.set(false); }
    });
  }

  submit(f: NgForm): void {
    if (f.invalid) {
      this.toast.error('Merci de compléter tous les champs obligatoires.');
      Object.values(f.controls).forEach(c => c.markAsTouched());
      return;
    }
    if (!this.form.shippingMethodId) {
      this.toast.error('Sélectionnez un mode de livraison.');
      return;
    }

    this.submitting.set(true);
    this.placeOrder();
  }

  private placeOrder(): void {
    const req: PlaceOrderRequest = {
      items: this.cart.lines().map(l => ({ productId: l.productId, quantity: l.quantity })),
      shippingAddress: {
        fullName: `${this.form.firstName} ${this.form.lastName}`.trim(),
        phone: this.form.phone,
        street: this.form.street,
        streetComplement: this.form.streetComplement || undefined,
        city: this.form.city,
        region: this.form.region || undefined,
        postalCode: this.form.postalCode || undefined,
        countryCode: this.form.countryCode
      },
      shippingMethodId: this.form.shippingMethodId,
      paymentMethod: this.form.paymentMethod,
      customerNotes: this.form.customerNotes || undefined,
      guestEmail: this.form.email,
      guestPhone: this.form.phone,
      guestFirstName: this.form.firstName,
      guestLastName: this.form.lastName
    };

    // Si checkbox "créer un compte" cochée, on inscrit le client d'abord
    if (this.form.createAccount && !this.auth.isAuthenticated()) {
      this.auth.register({
        email: this.form.email, phone: this.form.phone,
        firstName: this.form.firstName, lastName: this.form.lastName,
        password: this.form.password
      }).subscribe({
        next: () => this.sendOrder(req),
        error: (e: ApiException) => {
          this.toast.error(`Création de compte impossible : ${e.message}`);
          this.submitting.set(false);
        }
      });
    } else {
      this.sendOrder(req);
    }
  }

  private sendOrder(req: PlaceOrderRequest): void {
    this.orders.placeOrder(req).subscribe({
      next: order => {
        this.cart.clear();
        this.toast.success(`Commande ${order.orderNumber} confirmée !`);
        this.router.navigate(['/order-success', order.orderNumber], { state: { order } });
      },
      error: (e: ApiException) => {
        this.toast.error(e.message || 'Erreur lors de la commande');
        this.submitting.set(false);
      }
    });
  }
}
