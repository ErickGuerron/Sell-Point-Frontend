export interface ProfileCopy {
  moduleLabel: string;
  title: string;
  description: string;
  userInfo: string;
  sessionInfo: string;
  name: string;
  email: string;
  role: string;
  status: string;
  active: string;
  blocked: string;
  failedAttempts: string;
  failedAttemptsDesc: string;
  loading: string;
  errorTitle: string;
  errorText: string;
  retry: string;
  sidebarDashboard: string;
  sidebarInvoices: string;
  sidebarProducts: string;
  sidebarCustomers: string;
  sidebarEmployees: string;
  signOut: string;
  settings: string;
  notifications: string;
  languageToggle: string;
  sessionLabel: string;
  googleLinkTitle: string;
  googleLinkDesc: string;
  googleLinkButton: string;
  googleUnlinkButton: string;
  googleLinkedLabel: string;
  googleLinkedStatus: string;
  googleLoading: string;
  googleEmailMismatch: string;
  googleDuplicateLink: string;
  googleTokenInvalid: string;
  googleEmailNotVerified: string;
  googleNoAccount: string;
  googleNetworkError: string;
  googleUnlinkConfirmTitle: string;
  googleUnlinkConfirmMessage: string;
  googleUnlinkConfirmAction: string;
  googleUnlinkConfirmCancel: string;
}

export const PROFILE_TEXT: Record<'es' | 'en', ProfileCopy> = {
  es: {
    moduleLabel: 'Mi Cuenta',
    title: 'Perfil de Usuario',
    description: 'Información personal y estado de tu cuenta en el sistema.',
    userInfo: 'Datos Personales',
    sessionInfo: 'Información de la Sesión',
    name: 'Nombre Completo',
    email: 'Correo Electrónico',
    role: 'Rol en el Sistema',
    status: 'Estado de la Cuenta',
    active: 'Activa',
    blocked: 'Bloqueada',
    failedAttempts: 'Intentos Fallidos de Inicio de Sesión',
    failedAttemptsDesc: 'intento(s) fallido(s) desde el último inicio de sesión exitoso',
    loading: 'Cargando perfil…',
    errorTitle: 'Error al cargar el perfil',
    errorText: 'No se pudo obtener la información del usuario. Verificá la conexión con el backend e intentá de nuevo.',
    retry: 'Reintentar',
    sidebarDashboard: 'Panel',
    sidebarInvoices: 'Facturas',
    sidebarProducts: 'Productos',
    sidebarCustomers: 'Clientes',
    sidebarEmployees: 'Empleados',
    signOut: 'Cerrar sesión',
    settings: 'Configuración',
    notifications: 'Notificaciones',
    languageToggle: 'English',
    sessionLabel: 'Sesión',
    googleLinkTitle: 'Cuenta de Google',
    googleLinkDesc: 'Vinculá tu cuenta de Google para iniciar sesión más rápido.',
    googleLinkButton: 'Vincular Google',
    googleUnlinkButton: 'Desvincular',
    googleLinkedLabel: 'Google vinculado',
    googleLinkedStatus: 'Cuenta de Google vinculada',
    googleLoading: 'Cargando…',
    googleEmailMismatch: 'El correo de Google no coincide con el de tu cuenta.',
    googleDuplicateLink: 'Esta cuenta de Google ya está vinculada a otro usuario.',
    googleTokenInvalid: 'La verificación de Google falló. Intentá de nuevo.',
    googleEmailNotVerified: 'El correo de tu cuenta de Google debe estar verificado.',
    googleNoAccount: 'No se encontró cuenta para este usuario de Google. Registrate primero.',
    googleNetworkError: 'Error de conexión. Verificá tu internet.',
    googleUnlinkConfirmTitle: 'Desvincular cuenta de Google',
    googleUnlinkConfirmMessage: '¿Seguro que querés desvincular tu cuenta de Google?',
    googleUnlinkConfirmAction: 'Desvincular',
    googleUnlinkConfirmCancel: 'Cancelar',
  },
  en: {
    moduleLabel: 'My Account',
    title: 'User Profile',
    description: 'Personal information and account status in the system.',
    userInfo: 'Personal Details',
    sessionInfo: 'Session Information',
    name: 'Full Name',
    email: 'Email Address',
    role: 'System Role',
    status: 'Account Status',
    active: 'Active',
    blocked: 'Blocked',
    failedAttempts: 'Failed Login Attempts',
    failedAttemptsDesc: 'failed attempt(s) since last successful login',
    loading: 'Loading profile…',
    errorTitle: 'Could not load profile',
    errorText: 'Failed to fetch user information. Please check the backend connection and try again.',
    retry: 'Retry',
    sidebarDashboard: 'Dashboard',
    sidebarInvoices: 'Invoices',
    sidebarProducts: 'Products',
    sidebarCustomers: 'Customers',
    sidebarEmployees: 'Employees',
    signOut: 'Sign out',
    settings: 'Settings',
    notifications: 'Notifications',
    languageToggle: 'Español',
    sessionLabel: 'Session',
    googleLinkTitle: 'Google Account',
    googleLinkDesc: 'Link your Google account for faster sign-in.',
    googleLinkButton: 'Link Google',
    googleUnlinkButton: 'Unlink',
    googleLinkedLabel: 'Google linked',
    googleLinkedStatus: 'Google account linked',
    googleLoading: 'Loading…',
    googleEmailMismatch: 'Google email does not match your account email.',
    googleDuplicateLink: 'This Google account is already linked to another user.',
    googleTokenInvalid: 'Google verification failed. Please try again.',
    googleEmailNotVerified: 'Your Google account email must be verified.',
    googleNoAccount: 'No account found for this Google user. Please register first.',
    googleNetworkError: 'Connection error. Please check your internet.',
    googleUnlinkConfirmTitle: 'Unlink Google account',
    googleUnlinkConfirmMessage: 'Are you sure you want to unlink your Google account?',
    googleUnlinkConfirmAction: 'Unlink',
    googleUnlinkConfirmCancel: 'Cancel',
  },
};
