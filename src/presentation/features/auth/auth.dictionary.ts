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
  validation: {
    employeeRequired: string;
    employeeMinLength: string;
    pinRequired: string;
    pinMinLength: string;
    formInvalid: string;
  };
  support: {
    title: string;
    description: string;
    close: string;
    issueLabel: string;
    detailsLabel: string;
    detailsPlaceholder: string;
    services: {
      gmail: string;
      outlook: string;
      yahoo: string;
    };
    issues: {
      login: string;
      access: string;
      bug: string;
      other: string;
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
    validation: {
      employeeRequired: 'Employee ID or email is required.',
      employeeMinLength: 'Employee ID or email must be at least 3 characters.',
      pinRequired: 'PIN or password is required.',
      pinMinLength: 'PIN or password must be at least 4 characters.',
      formInvalid: 'Please complete the required login fields.'
    },
    support: {
      title: 'Contact IT Support',
      description: 'Choose your email service to send a message to',
      close: 'Close',
      issueLabel: 'What do you need help with?',
      detailsLabel: 'Additional details',
      detailsPlaceholder: 'Add context, error messages, device info, or anything relevant...',
      services: {
        gmail: 'Open Gmail',
        outlook: 'Open Outlook',
        yahoo: 'Open Yahoo Mail'
      },
      issues: {
        login: 'Login / access problem',
        access: 'Need account or role access',
        bug: 'Bug / unexpected behavior',
        other: 'Other'
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
    validation: {
      employeeRequired: 'El ID de empleado o correo es obligatorio.',
      employeeMinLength: 'El ID de empleado o correo debe tener al menos 3 caracteres.',
      pinRequired: 'El PIN o contraseña es obligatorio.',
      pinMinLength: 'El PIN o contraseña debe tener al menos 4 caracteres.',
      formInvalid: 'Completá los campos obligatorios para ingresar.'
    },
    support: {
      title: 'Contactar Soporte IT',
      description: 'Elegí tu servicio de correo para enviar un mensaje a',
      close: 'Cerrar',
      issueLabel: '¿Con qué necesitás ayuda?',
      detailsLabel: 'Detalles adicionales',
      detailsPlaceholder: 'Sumá contexto, mensajes de error, dispositivo o cualquier dato relevante...',
      services: {
        gmail: 'Abrir Gmail',
        outlook: 'Abrir Outlook',
        yahoo: 'Abrir Yahoo Mail'
      },
      issues: {
        login: 'Problema de acceso / login',
        access: 'Necesito acceso o roles',
        bug: 'Bug / comportamiento inesperado',
        other: 'Otro'
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
