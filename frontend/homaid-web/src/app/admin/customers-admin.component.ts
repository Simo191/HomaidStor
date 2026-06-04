import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-customers-admin',
  standalone: true,
  imports: [CommonModule],
  template: `
<h1 class="h3 mb-3">Clients</h1>
<div class="card">
  <div class="card-body text-center text-muted py-5">
    <i class="bi bi-people display-4"></i>
    <p class="mt-3">La gestion fine des clients arrivera en V2.<br>
    Pour l'instant, la liste des clients enregistrés est visible côté base de données.</p>
    <p class="small mt-3">
      Requête utile en attendant :<br>
      <code>SELECT "Email", "FirstName", "LastName", "Phone", "CreatedAt" FROM customers ORDER BY "CreatedAt" DESC;</code>
    </p>
  </div>
</div>
  `
})
export class CustomersAdminComponent {}
