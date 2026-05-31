import type { AppLocale } from '../services/locale.service';

export interface SharedSessionCopy {
  logoutTitle: string;
  logoutMessage: string;
  logoutConfirm: string;
  logoutCancel: string;
  notificationsTitle: string;
  notificationsMessage: string;
}

export interface SharedSsrFallbackCopy {
  unknownCustomer: string;
  invoiceIssuedLabel: string;
  invoiceCancelledLabel: string;
}

export interface SharedTranslations {
  session: SharedSessionCopy;
  ssr: SharedSsrFallbackCopy;
}

const SHARED_TRANSLATIONS: Record<AppLocale, SharedTranslations> = {
  en: {
    session: {
      logoutTitle: 'Sign out',
      logoutMessage: 'Are you sure you want to leave the dashboard?',
      logoutConfirm: 'Sign out',
      logoutCancel: 'Cancel',
      notificationsTitle: 'Notifications',
      notificationsMessage: 'You have 3 critical movements waiting for review.',
    },
    ssr: {
      unknownCustomer: 'Unnamed customer',
      invoiceIssuedLabel: 'ISSUED',
      invoiceCancelledLabel: 'CANCELLED',
    },
  },
  es: {
    session: {
      logoutTitle: 'Cerrar sesión',
      logoutMessage: '¿Seguro que querés salir del panel?',
      logoutConfirm: 'Cerrar sesión',
      logoutCancel: 'Cancelar',
      notificationsTitle: 'Notificaciones',
      notificationsMessage: 'Tenés 3 movimientos críticos esperando revisión.',
    },
    ssr: {
      unknownCustomer: 'Cliente sin nombre',
      invoiceIssuedLabel: 'EMITIDA',
      invoiceCancelledLabel: 'CANCELADA',
    },
  },
};

export function getSharedTranslations(locale: AppLocale | null | undefined): SharedTranslations {
  return SHARED_TRANSLATIONS[locale === 'en' ? 'en' : 'es'];
}
