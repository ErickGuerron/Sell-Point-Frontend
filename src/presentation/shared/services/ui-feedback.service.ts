import { Injectable } from '@angular/core';

type ToastIcon = 'success' | 'error' | 'warning' | 'info' | 'question';

@Injectable({ providedIn: 'root' })
export class UiFeedbackService {
  private isDarkMode() {
    return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  private async loadSwal() {
    const { default: Swal } = await import('sweetalert2');
    return Swal;
  }

  async toast(icon: ToastIcon, title: string, text?: string) {
    const Swal = await this.loadSwal();
    const dark = this.isDarkMode();

    return Swal.fire({
      toast: true,
      position: 'top-end',
      icon,
      title,
      text,
      showConfirmButton: false,
      timer: 2600,
      timerProgressBar: true,
      background: dark ? 'rgba(17, 24, 43, 0.96)' : '#ffffff',
      color: dark ? '#eef0ff' : '#131b2e',
      iconColor: dark ? '#c3c0ff' : '#3525cd',
    });
  }

  async alert(icon: ToastIcon, title: string, text?: string) {
    const Swal = await this.loadSwal();
    const dark = this.isDarkMode();

    return Swal.fire({
      icon,
      title,
      text,
      confirmButtonText: 'Entendido',
      background: dark ? '#11182b' : '#ffffff',
      color: dark ? '#eef0ff' : '#131b2e',
      confirmButtonColor: '#3525cd',
    });
  }

  async alertHtml(icon: ToastIcon, title: string, html: string) {
    const Swal = await this.loadSwal();
    const dark = this.isDarkMode();

    return Swal.fire({
      icon,
      title,
      html,
      confirmButtonText: 'Entendido',
      background: dark ? '#11182b' : '#ffffff',
      color: dark ? '#eef0ff' : '#131b2e',
      confirmButtonColor: '#3525cd',
    });
  }

  async confirm(title: string, text: string, confirmButtonText = 'Confirmar', cancelButtonText = 'Cancelar') {
    const Swal = await this.loadSwal();
    const dark = this.isDarkMode();

    const result = await Swal.fire({
      icon: 'question',
      title,
      text,
      showCancelButton: true,
      confirmButtonText,
      cancelButtonText,
      background: dark ? '#11182b' : '#ffffff',
      color: dark ? '#eef0ff' : '#131b2e',
      confirmButtonColor: '#3525cd',
      cancelButtonColor: dark ? '#374151' : '#94a3b8',
    });

    return result.isConfirmed;
  }
}
