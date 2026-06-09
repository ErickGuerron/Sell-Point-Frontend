export interface ProfileCopy {
  moduleLabel: string;
  title: string;
  description: string;
  userInfo: string;
  editInfo: string;
  editInfoDesc: string;
  editProfileButton: string;
  backToProfile: string;
  securityTitle: string;
  securityDesc: string;
  changePasswordButton: string;
  backToSecurity: string;
  sessionInfo: string;
  name: string;
  email: string;
  firstName: string;
  lastName: string;
  cedula: string;
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
  saveChanges: string;
  resetChanges: string;
  saving: string;
  profileUpdated: string;
  profileUpdateError: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  passwordMinHint: string;
  passwordMismatch: string;
  passwordUpdated: string;
  passwordUpdateError: string;
}

export const PROFILE_TEXT: Record<'es' | 'en', ProfileCopy> = {
  es: {
    moduleLabel: 'Mi Cuenta',
    title: 'Perfil de Usuario',
    description: 'Información personal y estado de tu cuenta en el sistema.',
    userInfo: 'Datos Personales',
    editInfo: 'Editar Perfil',
    editInfoDesc: 'Actualiza tu nombre, apellido y correo electrónico.',
    editProfileButton: 'Editar perfil',
    backToProfile: 'Volver',
    securityTitle: 'Seguridad',
    securityDesc: 'Cambia tu contraseña sin afectar tu sesión actual.',
    changePasswordButton: 'Cambiar contraseña',
    backToSecurity: 'Cancelar',
    sessionInfo: 'Información de la Sesión',
    name: 'Nombre Completo',
    email: 'Correo Electrónico',
    firstName: 'Nombre',
    lastName: 'Apellido',
    cedula: 'Cédula',
    role: 'Rol en el Sistema',
    status: 'Estado de la Cuenta',
    active: 'Activa',
    blocked: 'Bloqueada',
    failedAttempts: 'Intentos Fallidos de Inicio de Sesión',
    failedAttemptsDesc: 'intento(s) fallido(s) desde el último inicio de sesión exitoso',
    loading: 'Cargando perfil…',
    errorTitle: 'Error al cargar el perfil',
    errorText: 'No se pudo obtener la información del usuario. Verifique la conexión con el backend e intente de nuevo.',
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
    googleLinkDesc: 'Vincule su cuenta de Google para iniciar sesión más rápido.',
    googleLinkButton: 'Vincular Google',
    googleUnlinkButton: 'Desvincular',
    googleLinkedLabel: 'Google vinculado',
    googleLinkedStatus: 'Cuenta de Google vinculada',
    googleLoading: 'Cargando…',
    googleEmailMismatch: 'El correo de Google no coincide con el de tu cuenta.',
    googleDuplicateLink: 'Esta cuenta de Google ya está vinculada a otro usuario.',
    googleTokenInvalid: 'La verificación de Google falló. Intente de nuevo.',
    googleEmailNotVerified: 'El correo de tu cuenta de Google debe estar verificado.',
    googleNoAccount: 'No se encontró cuenta para este usuario de Google. Registrate primero.',
    googleNetworkError: 'Error de conexión. Verifique su internet.',
    googleUnlinkConfirmTitle: 'Desvincular cuenta de Google',
    googleUnlinkConfirmMessage: '¿Seguro que quiere desvincular su cuenta de Google?',
    googleUnlinkConfirmAction: 'Desvincular',
    googleUnlinkConfirmCancel: 'Cancelar',
    saveChanges: 'Guardar cambios',
    resetChanges: 'Restablecer',
    saving: 'Guardando…',
    profileUpdated: 'Perfil actualizado correctamente',
    profileUpdateError: 'No se pudo actualizar el perfil',
    currentPassword: 'Contraseña actual',
    newPassword: 'Nueva contraseña',
    confirmPassword: 'Confirmar contraseña',
    passwordMinHint: 'Mínimo 8 caracteres',
    passwordMismatch: 'La confirmación no coincide',
    passwordUpdated: 'Contraseña actualizada correctamente',
    passwordUpdateError: 'No se pudo cambiar la contraseña',
  },
  en: {
    moduleLabel: 'My Account',
    title: 'User Profile',
    description: 'Personal information and account status in the system.',
    userInfo: 'Personal Details',
    editInfo: 'Edit Profile',
    editInfoDesc: 'Update your first name, last name, and email address.',
    editProfileButton: 'Edit profile',
    backToProfile: 'Back',
    securityTitle: 'Security',
    securityDesc: 'Change your password without affecting your current session.',
    changePasswordButton: 'Change password',
    backToSecurity: 'Cancel',
    sessionInfo: 'Session Information',
    name: 'Full Name',
    email: 'Email Address',
    firstName: 'First Name',
    lastName: 'Last Name',
    cedula: 'ID Number',
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
    saveChanges: 'Save changes',
    resetChanges: 'Reset',
    saving: 'Saving…',
    profileUpdated: 'Profile updated successfully',
    profileUpdateError: 'Could not update profile',
    currentPassword: 'Current password',
    newPassword: 'New password',
    confirmPassword: 'Confirm password',
    passwordMinHint: 'Minimum 8 characters',
    passwordMismatch: 'Confirmation does not match',
    passwordUpdated: 'Password updated successfully',
    passwordUpdateError: 'Could not change password',
  },
};
