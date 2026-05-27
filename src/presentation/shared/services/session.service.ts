import { Injectable, inject, signal } from '@angular/core';
import { UiFeedbackService } from './ui-feedback.service';
import { LocaleService } from './locale.service';

interface BillflowSession {
  id?: string;
  employeeId?: string;
  email?: string;
  role?: string;
  user?: { name?: string; firstName?: string; fullName?: string };
}

@Injectable({ providedIn: 'root' })
export class SessionService {
  readonly displayName = signal('Usuario');
  readonly userInitials = signal('US');
  private readonly feedback = inject(UiFeedbackService);
  private readonly localeService = inject(LocaleService);

  init(): void {
    if (typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem('billflow-session');
      if (!raw) return;
      const session = JSON.parse(raw) as BillflowSession;
      const candidate = session.employeeId
        || session.id
        || session.email?.split('@')[0]
        || session.user?.fullName
        || session.user?.name
        || session.user?.firstName
        || 'Usuario';
      this.displayName.set(candidate === 'Usuario' ? candidate : candidate.toUpperCase());
      if (candidate !== 'Usuario') {
        this.userInitials.set(
          candidate
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part[0]?.toUpperCase() ?? '')
            .join(''),
        );
      } else {
        this.userInitials.set('US');
      }
    } catch {
      this.displayName.set('Usuario');
      this.userInitials.set('US');
    }
  }

  hasStoredSession(): boolean {
    if (typeof window === 'undefined') return false;

    try {
      return Boolean(window.localStorage.getItem('billflow-session'));
    } catch {
      return false;
    }
  }

  async logout(): Promise<void> {
    const locale = this.localeService.locale();
    const confirmed = await this.feedback.confirm(
      locale === 'es' ? 'Cerrar sesión' : 'Sign out',
      locale === 'es'
        ? '¿Seguro que querés salir del panel?'
        : 'Are you sure you want to leave the dashboard?',
      locale === 'es' ? 'Cerrar sesión' : 'Sign out',
      locale === 'es' ? 'Cancelar' : 'Cancel',
    );
    if (!confirmed || typeof window === 'undefined') return;
    window.localStorage.removeItem('billflow-session');
    window.location.replace('/auth');
  }

  openNotifications(): void {
    const locale = this.localeService.locale();
    void this.feedback.toast(
      'info',
      locale === 'es' ? 'Notificaciones' : 'Notifications',
      locale === 'es'
        ? 'Tenés 3 movimientos críticos esperando revisión.'
        : 'You have 3 critical movements waiting for review.',
    );
  }

  async openUserSettings(): Promise<void> {
    const locale = this.localeService.locale();
    await this.feedback.alert(
      'info',
      locale === 'es' ? 'Configuración' : 'Settings',
      locale === 'es'
        ? 'Acá podés actualizar tu perfil y preferencias.'
        : 'You can update your profile and preferences here.',
    );
  }
}
