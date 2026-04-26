export type AuthLocale = 'en' | 'es';

export interface AuthText {
  brand: string;
  language: string;
  login: {
    title: string;
    subtitle: string;
    employeeLabel: string;
    employeePlaceholder: string;
    pinLabel: string;
    pinPlaceholder: string;
    submit: string;
    help: string;
  };
  panel: {
    title: string;
    description: string;
  };
}

export const AUTH_TEXT: Record<AuthLocale, AuthText> = {
  en: {
    brand: 'BillFlow',
    language: 'EN',
    login: {
      title: 'Terminal Access',
      subtitle: 'Enter your credentials to unlock your register.',
      employeeLabel: 'Employee ID or Email',
      employeePlaceholder: 'e.g. EMP-1042',
      pinLabel: 'PIN or Password',
      pinPlaceholder: '••••••••',
      submit: 'Unlock Terminal',
      help: 'Need help? Contact IT Support'
    },
    panel: {
      title: 'Welcome to<br/>BillFlow POS',
      description: 'Precision billing for high-energy growth. Access your terminal to manage sales, inventory, and analytics.'
    }
  },
  es: {
    brand: 'BillFlow',
    language: 'ES',
    login: {
      title: 'Acceso a Terminal',
      subtitle: 'Ingresa tus credenciales para desbloquear tu caja.',
      employeeLabel: 'ID de Empleado o Correo',
      employeePlaceholder: 'ej. EMP-1042',
      pinLabel: 'PIN o Contraseña',
      pinPlaceholder: '••••••••',
      submit: 'Desbloquear Terminal',
      help: '¿Necesitás ayuda? Contactá al Soporte IT'
    },
    panel: {
      title: 'Bienvenido a<br/>BillFlow POS',
      description: 'Facturación precisa para crecimiento acelerado. Accede a tu terminal para gestionar ventas, inventario y métricas.'
    }
  }
};

export function detectAuthLocale(): AuthLocale {
  if (typeof window === 'undefined') return 'en';

  const stored = window.localStorage.getItem('billflow-lang');
  if (stored === 'es' || stored === 'en') return stored;

  const browser = (window.navigator.language || window.navigator.languages?.[0] || 'en').toLowerCase();
  return browser.startsWith('es') ? 'es' : 'en';
}
