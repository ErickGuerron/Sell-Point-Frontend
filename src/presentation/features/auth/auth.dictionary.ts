export type AuthLocale = 'en' | 'es';
export type AuthMode = 'login' | 'signup';

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
    forgotPassword: string;
    submit: string;
  };
  signup: {
    title: string;
    subtitle: string;
    nameLabel: string;
    namePlaceholder: string;
    emailLabel: string;
    emailPlaceholder: string;
    passwordLabel: string;
    passwordPlaceholder: string;
    submit: string;
  };
  switchPanel: {
    login: {
      eyebrow: string;
      title: string;
      description: string;
      action: string;
    };
    signup: {
      eyebrow: string;
      title: string;
      description: string;
      action: string;
    };
  };
}

export const AUTH_TEXT: Record<AuthLocale, AuthText> = {
  en: {
    brand: 'BillFlow',
    language: 'EN',
    login: {
      title: 'Sign In',
      subtitle: 'Enter your details to access your dashboard.',
      emailLabel: 'Email Address',
      emailPlaceholder: 'name@company.com',
      passwordLabel: 'Password',
      passwordPlaceholder: '••••••••',
      forgotPassword: 'Forgot Password?',
      submit: 'Sign In'
    },
    signup: {
      title: 'Create Account',
      subtitle: 'Start your high-energy billing journey today.',
      nameLabel: 'Full Name',
      namePlaceholder: 'John Doe',
      emailLabel: 'Email Address',
      emailPlaceholder: 'name@company.com',
      passwordLabel: 'Password',
      passwordPlaceholder: 'Create a strong password',
      submit: 'Sign Up'
    },
    switchPanel: {
      login: {
        eyebrow: 'New Here?',
        title: 'Join BillFlow',
        description: 'Accelerate your billing with a secure, modern workspace built for growth.',
        action: 'Switch to Sign Up'
      },
      signup: {
        eyebrow: 'Welcome Back!',
        title: 'Access your dashboard',
        description: 'Continue your momentum and keep your billing operations moving.',
        action: 'Switch to Login'
      }
    }
  },
  es: {
    brand: 'BillFlow',
    language: 'ES',
    login: {
      title: 'Ingresar',
      subtitle: 'Ingresá tus datos para acceder al panel.',
      emailLabel: 'Correo electrónico',
      emailPlaceholder: 'nombre@empresa.com',
      passwordLabel: 'Contraseña',
      passwordPlaceholder: '••••••••',
      forgotPassword: '¿Olvidaste tu contraseña?',
      submit: 'Ingresar'
    },
    signup: {
      title: 'Crear cuenta',
      subtitle: 'Empezá hoy mismo tu flujo de facturación.',
      nameLabel: 'Nombre completo',
      namePlaceholder: 'Juan Pérez',
      emailLabel: 'Correo electrónico',
      emailPlaceholder: 'nombre@empresa.com',
      passwordLabel: 'Contraseña',
      passwordPlaceholder: 'Creá una contraseña segura',
      submit: 'Registrarme'
    },
    switchPanel: {
      login: {
        eyebrow: '¿Nuevo por acá?',
        title: 'Sumate a BillFlow',
        description: 'Acelerá tu facturación con un espacio seguro y moderno, pensado para crecer.',
        action: 'Ir a registro'
      },
      signup: {
        eyebrow: '¡Bienvenido de nuevo!',
        title: 'Accedé a tu panel',
        description: 'Seguí con tu trabajo y mantené en marcha la operación de facturación.',
        action: 'Ir a ingreso'
      }
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

export function normalizeAuthMode(value: string | null | undefined): AuthMode {
  return value === 'signup' ? 'signup' : 'login';
}
