import {
  Directive,
  Input,
  TemplateRef,
  ViewContainerRef,
  inject,
} from '@angular/core';
import { PermissionsService, type Permission } from '../services/permissions.service';

/**
 * Structural directive that shows/hides elements based on user permissions.
 *
 * @usage
 *   <button *hasPermission="'products:create'">Crear Producto</button>
 *   <ng-container *hasPermission="'employees:read'; else noAccess">
 *     <employee-list />
 *   </ng-container>
 *   <ng-template #noAccess>No tienes acceso</ng-template>
 */
@Directive({
  selector: '[hasPermission]',
  standalone: true,
})
export class HasPermissionDirective {
  private readonly templateRef = inject(TemplateRef<unknown>);
  private readonly viewContainer = inject(ViewContainerRef);
  private readonly permissions = inject(PermissionsService);

  @Input('hasPermission') permission!: Permission | string;

  /**
   * Optional: show the element when user does NOT have the permission.
   * By default (elseBlock = false), the element shows only when user HAS the permission.
   * Set to true to invert the logic — element shows when user LACKS the permission.
   *
   * @usage
   *   <div *hasPermission="'products:create'; elseBlock true">Solo si NO puedo crear</div>
   */
  @Input('hasPermissionElseBlock') elseBlock = false;

  private hasView = false;

  ngOnInit(): void {
    this.updateView();
  }

  private updateView(): void {
    if (!this.permission) return;

    const hasPermission = this.permissions.hasPermission(this.permission);

    // If using elseBlock, invert the condition
    const shouldShow = this.elseBlock ? !hasPermission : hasPermission;

    if (shouldShow && !this.hasView) {
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.hasView = true;
    } else if (!shouldShow && this.hasView) {
      this.viewContainer.clear();
      this.hasView = false;
    }
  }
}

/**
 * Structural directive that shows elements only when the current user IS admin.
 *
 * @usage
 *   <button *appIsAdmin>Panel de Admin</button>
 */
@Directive({
  selector: '[appIsAdmin]',
  standalone: true,
})
export class IsAdminDirective {
  private readonly templateRef = inject(TemplateRef<unknown>);
  private readonly viewContainer = inject(ViewContainerRef);
  private readonly permissions = inject(PermissionsService);

  private hasView = false;

  ngOnInit(): void {
    this.updateView();
  }

  private updateView(): void {
    const isAdmin = this.permissions.isAdmin();

    if (isAdmin && !this.hasView) {
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.hasView = true;
    } else if (!isAdmin && this.hasView) {
      this.viewContainer.clear();
      this.hasView = false;
    }
  }
}

/**
 * Structural directive that shows elements only when the current user is NOT admin.
 * Useful to hide admin-only UI elements from regular employees.
 *
 * @usage
 *   <div *isNotAdmin>No eres admin</div>
 */
@Directive({
  selector: '[isNotAdmin]',
  standalone: true,
})
export class IsNotAdminDirective {
  private readonly templateRef = inject(TemplateRef<unknown>);
  private readonly viewContainer = inject(ViewContainerRef);
  private readonly permissions = inject(PermissionsService);

  private hasView = false;

  ngOnInit(): void {
    this.updateView();
  }

  private updateView(): void {
    const isNotAdmin = !this.permissions.isAdmin();

    if (isNotAdmin && !this.hasView) {
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.hasView = true;
    } else if (!isNotAdmin && this.hasView) {
      this.viewContainer.clear();
      this.hasView = false;
    }
  }
}