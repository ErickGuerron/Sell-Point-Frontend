export type AuthLocale = 'en' | 'es';

export interface AuthText {
  brand: string;
  language: string;
  login: {
    title: string;
    subtitle: string;
    emailLabel: string;
    emailPlaceholder: string;
    passwordLabel: string;
    passwordPlaceholder: string;
    submit: string;
    help: string;
    googleLogin: string;
    orText: string;
  };
  validation: {
    emailRequired: string;
    emailInvalid: string;
    passwordRequired: string;
    passwordMinLength: string;
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
    blockedTitle: string;
    blockedMessage: string;
    blockedContact: string;
    googleVerificationFailed: string;
    googleEmailNotVerified: string;
    googleEmailMismatch: string;
    googleDuplicateLink: string;
    googleNoAccount: string;
    googleNetworkError: string;
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
      emailLabel: 'Email',
      emailPlaceholder: 'e.g. employee@company.com',
      passwordLabel: 'Password',
      passwordPlaceholder: '••••••••',
      submit: 'Unlock Terminal',
      help: 'Need help? Contact IT Support',
      googleLogin: 'Continue with Google',
      orText: 'or',
    },
    validation: {
      emailRequired: 'Email is required.',
      emailInvalid: 'Enter a valid email address.',
      passwordRequired: 'Password is required.',
      passwordMinLength: 'Password must be at least 4 characters.',
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
      invalid: 'Invalid email or password.',
      blockedTitle: 'Account Locked',
      blockedMessage: 'Your account has been locked due to multiple failed login attempts.',
      blockedContact: 'Please contact your administrator to restore access.',
      googleVerificationFailed: 'Google verification failed. Please try again.',
      googleEmailNotVerified: 'Your Google account email must be verified.',
      googleEmailMismatch: 'Google email does not match your account email.',
      googleDuplicateLink: 'This Google account is already linked to another user.',
      googleNoAccount: 'No account found for this Google user. Please register first.',
      googleNetworkError: 'Connection error. Please check your internet.',
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
      subtitle: 'Ingresá tus credenciales para desbloquear tu caja.',
      emailLabel: 'Correo Electrónico',
      emailPlaceholder: 'ej. empleado@empresa.com',
      passwordLabel: 'Contraseña',
      passwordPlaceholder: '••••••••',
      submit: 'Desbloquear Terminal',
      help: '¿Necesitás ayuda? Contactá al Soporte IT',
      googleLogin: 'Ingresar con Google',
      orText: 'o',
    },
    validation: {
      emailRequired: 'El correo es obligatorio.',
      emailInvalid: 'Ingresá un correo válido.',
      passwordRequired: 'La contraseña es obligatoria.',
      passwordMinLength: 'La contraseña debe tener al menos 4 caracteres.',
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
      invalid: 'Correo o contraseña inválidos.',
      blockedTitle: 'Cuenta Bloqueada',
      blockedMessage: 'Tu cuenta ha sido bloqueada por múltiples intentos de inicio de sesión fallidos.',
      blockedContact: 'Contactá a tu administrador para restablecer el acceso.',
      googleVerificationFailed: 'La verificación de Google falló. Intentá de nuevo.',
      googleEmailNotVerified: 'El correo de tu cuenta de Google debe estar verificado.',
      googleEmailMismatch: 'El correo de Google no coincide con el de tu cuenta.',
      googleDuplicateLink: 'Esta cuenta de Google ya está vinculada a otro usuario.',
      googleNoAccount: 'No se encontró cuenta para este usuario de Google. Registrate primero.',
      googleNetworkError: 'Error de conexión. Verificá tu internet.',
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
