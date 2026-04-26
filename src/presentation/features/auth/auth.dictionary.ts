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
  support: {
    title: string;
    description: string;
    close: string;
    services: {
      gmail: string;
      outlook: string;
      yahoo: string;
    };
  };
  feedback: {
    success: string;
    invalid: string;
  };
  panel: {
    title: string;
    description: string;
  };
}

export interface AuthLoginPayload {
  identifier: string;
  secret: string;
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
    support: {
      title: 'Contact IT Support',
      description: 'Choose your email service to send a message to guerronerick.10d@gmail.com.',
      close: 'Close',
      services: {
        gmail: 'Open Gmail',
        outlook: 'Open Outlook',
        yahoo: 'Open Yahoo Mail'
      }
    },
    feedback: {
      success: 'Login successful.',
      invalid: 'Invalid employee ID/email or PIN/password.'
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
    support: {
      title: 'Contactar Soporte IT',
      description: 'Elegí tu servicio de correo para enviar un mensaje a guerronerick.10d@gmail.com.',
      close: 'Cerrar',
      services: {
        gmail: 'Abrir Gmail',
        outlook: 'Abrir Outlook',
        yahoo: 'Abrir Yahoo Mail'
      }
    },
    feedback: {
      success: 'Inicio de sesión correcto.',
      invalid: 'ID/correo o PIN/contraseña inválidos.'
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
