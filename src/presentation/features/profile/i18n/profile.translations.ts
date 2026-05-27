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
  },
};
