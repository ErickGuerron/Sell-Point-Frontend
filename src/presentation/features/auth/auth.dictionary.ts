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
    showPasswordAria: string;
    hidePasswordAria: string;
forgotPassword: string;
    submit: string;
    help: string;
    rememberMe: string;
    googleLogin: string;
    orText: string;
  };
  recovery: {
    title: string;
    subtitle: string;
    emailLabel: string;
    emailPlaceholder: string;
    submit: string;
    backToLogin: string;
    help: string;
    success: string;
    rateLimited: string;
    error: string;
    validation: {
      emailRequired: string;
      emailInvalid: string;
      formInvalid: string;
    };
  };
  reset: {
    title: string;
    subtitle: string;
    passwordLabel: string;
    passwordPlaceholder: string;
    confirmPasswordLabel: string;
    confirmPasswordPlaceholder: string;
    submit: string;
    backToLogin: string;
success: string;
    invalidToken: string;
    tokenExpired: string;
    error: string;
    securityTitle: string;
    securityDescription: string;
    criteria: {
      minLength: string;
      numberOrSymbol: string;
      matchesConfirmation: string;
    };
    validation: {
      passwordRequired: string;
      passwordMinLength: string;
      confirmPasswordRequired: string;
      passwordsMismatch: string;
      formInvalid: string;
    };
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
    footer: string;
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
    googleLoginFailed: string;
  };
  panel: {
    title: string;
    description: string;
    slideLabel: string;
  };
}

export interface AuthLoginPayload {
  identifier: string;
  secret: string;
  rememberMe?: boolean;
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
      showPasswordAria: 'Show password',
      hidePasswordAria: 'Hide password',
forgotPassword: 'Forgot your password?',
      submit: 'Unlock Terminal',
      help: 'Need help? Contact IT Support',
      googleLogin: 'Continue with Google',
      orText: 'or',
      rememberMe: 'Remember me',
    },
    recovery: {
      title: 'Recover Access',
      subtitle: 'Enter your email and we will send you reset instructions.',
      emailLabel: 'Email',
      emailPlaceholder: 'e.g. employee@company.com',
      submit: 'Send Reset Link',
      backToLogin: 'Back to login',
      help: 'Need help? Contact IT Support',
      success: 'If the account exists, we sent password reset instructions.',
      rateLimited: 'You already requested a reset recently. Please wait a few minutes and try again.',
      error: 'We could not send the reset link. Please try again.',
      validation: {
        emailRequired: 'Email is required.',
        emailInvalid: 'Enter a valid email address.',
        formInvalid: 'Please enter a valid email address.',
      },
    },
    reset: {
      title: 'Set a new password',
      subtitle: 'Choose a secure password to recover access to your terminal.',
      passwordLabel: 'New password',
      passwordPlaceholder: 'At least 8 characters',
      confirmPasswordLabel: 'Confirm password',
      confirmPasswordPlaceholder: 'Repeat your new password',
      submit: 'Update password',
      backToLogin: 'Back to login',
      success: 'Password updated successfully. Redirecting to login...',
invalidToken: 'This reset link is invalid or expired.',
      tokenExpired: 'This reset link has expired. Please request a new one.',
      error: 'We could not reset your password. Please request a new link.',
      securityTitle: 'Secure your point of sale access',
      securityDescription: 'Protect terminal operations, inventory movements, and sales activity with a stronger password reset flow.',
      criteria: {
        minLength: 'Minimum 8 characters',
        numberOrSymbol: 'At least one number or symbol',
        matchesConfirmation: 'Confirmation matches the new password',
      },
      validation: {
        passwordRequired: 'New password is required.',
        passwordMinLength: 'Password must be at least 8 characters.',
        confirmPasswordRequired: 'Please confirm your new password.',
        passwordsMismatch: 'Passwords do not match.',
        formInvalid: 'Please complete the reset form correctly.',
      },
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
      footer: 'Your default mail client will open securely.',
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
      googleLoginFailed: 'Google login failed.',
    },
    panel: {
      title: 'Welcome to BillFlow POS',
      description: 'Precision billing for high-energy growth. Access your terminal to manage sales, inventory, and analytics.',
      slideLabel: 'Slide'
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
      showPasswordAria: 'Mostrar contraseña',
      hidePasswordAria: 'Ocultar contraseña',
forgotPassword: '¿Olvidaste tu contraseña?',
      submit: 'Desbloquear Terminal',
      help: '¿Necesitás ayuda? Contactá al Soporte IT',
      googleLogin: 'Ingresar con Google',
      orText: 'o',
      rememberMe: 'Recordarme',
    },
    recovery: {
      title: 'Recuperar acceso',
      subtitle: 'Ingresá tu correo y te enviaremos las instrucciones para restablecerla.',
      emailLabel: 'Correo electrónico',
      emailPlaceholder: 'ej. empleado@empresa.com',
      submit: 'Enviar enlace',
      backToLogin: 'Volver al login',
      help: '¿Necesitás ayuda? Contactá al Soporte IT',
      success: 'Si la cuenta existe, enviamos las instrucciones para restablecer la contraseña.',
      rateLimited: 'Ya pediste un enlace recientemente. Esperá unos minutos y volvé a intentar.',
      error: 'No pudimos enviar el enlace de recuperación. Intentá de nuevo.',
      validation: {
        emailRequired: 'El correo es obligatorio.',
        emailInvalid: 'Ingresá un correo válido.',
        formInvalid: 'Ingresá un correo válido para continuar.',
      },
    },
    reset: {
      title: 'Definí una nueva contraseña',
      subtitle: 'Elegí una contraseña segura para recuperar el acceso a tu terminal.',
      passwordLabel: 'Nueva contraseña',
      passwordPlaceholder: 'Al menos 8 caracteres',
      confirmPasswordLabel: 'Confirmar contraseña',
      confirmPasswordPlaceholder: 'Repetí tu nueva contraseña',
      submit: 'Actualizar contraseña',
      backToLogin: 'Volver al login',
      success: 'La contraseña se actualizó correctamente. Redirigiendo al login...',
invalidToken: 'Este enlace de recuperación es inválido o expiró.',
      tokenExpired: 'Este enlace de recuperación expiró. Pedí uno nuevo.',
      error: 'No pudimos restablecer tu contraseña. Pedí un enlace nuevo.',
      securityTitle: 'Protegé el acceso a tu punto de venta',
      securityDescription: 'Reforzá la seguridad de la terminal, las ventas y los movimientos de inventario con una contraseña más robusta.',
      criteria: {
        minLength: 'Mínimo 8 caracteres',
        numberOrSymbol: 'Al menos un número o símbolo',
        matchesConfirmation: 'La confirmación coincide con la nueva contraseña',
      },
      validation: {
        passwordRequired: 'La nueva contraseña es obligatoria.',
        passwordMinLength: 'La contraseña debe tener al menos 8 caracteres.',
        confirmPasswordRequired: 'Confirmá tu nueva contraseña.',
        passwordsMismatch: 'Las contraseñas no coinciden.',
        formInvalid: 'Completá correctamente el formulario de recuperación.',
      },
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
      footer: 'Tu cliente de correo predeterminado se abrirá de forma segura.',
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
      googleNetworkError: 'Error de conexión. Verifique su internet.',
      googleLoginFailed: 'Falló el inicio de sesión con Google.',
    },
    panel: {
      title: 'Bienvenido a BillFlow POS',
      description: 'Facturación precisa para crecimiento acelerado. Accede a tu terminal para gestionar ventas, inventario y métricas.',
      slideLabel: 'Diapositiva'
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

