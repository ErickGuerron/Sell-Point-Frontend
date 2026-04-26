import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import type { AfterViewInit, OnDestroy } from '@angular/core';
import { tsParticles } from '@tsparticles/engine';
import type { ISourceOptions } from '@tsparticles/engine';
import { loadSlim } from '@tsparticles/slim';

@Component({
  selector: 'billflow-auth-particles-background',
  standalone: true,
  imports: [CommonModule],
  host: { class: 'app-auth-bg' },
  template: `
    <div class="app-auth-bg__gradient"></div>

    <div class="absolute inset-0 opacity-95">
      <div class="app-auth-bg__orb app-auth-bg__orb--one"></div>
      <div class="app-auth-bg__orb app-auth-bg__orb--two"></div>
      <div class="app-auth-bg__orb app-auth-bg__orb--three"></div>
    </div>

    <div id="billflow-auth-particles" class="app-auth-bg__particles"></div>
  `,
})
export class AuthParticlesBackgroundComponent implements AfterViewInit, OnDestroy {
  private initialized = false;

  options: ISourceOptions = {
    fullScreen: { enable: false },
    background: { color: { value: 'transparent' } },
    fpsLimit: 60,
    particles: {
      number: { value: 42, density: { enable: true, width: 1280, height: 720 } },
      color: { value: ['#3525cd', '#39b8fd', '#c3c0ff', '#4f46e5'] },
      links: {
        enable: true,
        color: '#4f46e5',
        distance: 140,
        opacity: 0.14,
        width: 1,
      },
      move: {
        enable: true,
        speed: 0.65,
        direction: 'none',
        outModes: { default: 'out' },
      },
      opacity: { value: { min: 0.2, max: 0.45 } },
      size: { value: { min: 1, max: 3 } },
      shape: { type: 'circle' },
    },
    interactivity: {
      events: {
        onHover: { enable: true, mode: 'repulse' },
        onClick: { enable: false, mode: 'push' },
      },
      modes: {
        repulse: { distance: 120, duration: 0.3 },
      },
    },
    detectRetina: true,
  };

  async ngAfterViewInit(): Promise<void> {
    if (this.initialized || typeof window === 'undefined') return;
    await loadSlim(tsParticles);
    await tsParticles.load({ id: 'billflow-auth-particles', options: this.options });
    this.initialized = true;
  }

  async ngOnDestroy(): Promise<void> {
    if (typeof window === 'undefined') return;
    const container = tsParticles.domItem('billflow-auth-particles');
    await container?.destroy();
  }
}
