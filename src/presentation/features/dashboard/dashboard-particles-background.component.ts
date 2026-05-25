import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import type { AfterViewInit, OnDestroy } from '@angular/core';
import { tsParticles } from '@tsparticles/engine';
import type { ISourceOptions } from '@tsparticles/engine';
import { loadSlim } from '@tsparticles/slim';

@Component({
  selector: 'billflow-dashboard-particles-background',
  standalone: true,
  imports: [CommonModule],
  host: { class: 'app-dashboard-bg' },
  template: `
    <div class="app-dashboard-bg__gradient"></div>

    <div class="absolute inset-0 opacity-95">
      <div class="app-dashboard-bg__orb app-dashboard-bg__orb--one"></div>
      <div class="app-dashboard-bg__orb app-dashboard-bg__orb--two"></div>
      <div class="app-dashboard-bg__orb app-dashboard-bg__orb--three"></div>
    </div>

    <div id="billflow-dashboard-particles" class="app-dashboard-bg__particles"></div>
  `,
})
export class DashboardParticlesBackgroundComponent implements AfterViewInit, OnDestroy {
  private initialized = false;

  options: ISourceOptions = {
    fullScreen: { enable: false },
    background: { color: { value: 'transparent' } },
    fpsLimit: 60,
    particles: {
      number: { value: 34, density: { enable: true, width: 1280, height: 720 } },
      color: { value: ['#3525cd', '#39b8fd', '#c3c0ff', '#4f46e5', '#006591'] },
      links: {
        enable: true,
        color: '#4f46e5',
        distance: 150,
        opacity: 0.1,
        width: 1,
      },
      move: {
        enable: true,
        speed: 0.45,
        direction: 'none',
        outModes: { default: 'out' },
      },
      opacity: { value: { min: 0.18, max: 0.42 } },
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
    await tsParticles.load({ id: 'billflow-dashboard-particles', options: this.options });
    this.initialized = true;
  }

  async ngOnDestroy(): Promise<void> {
    if (typeof window === 'undefined') return;
    const container = tsParticles.domItem('billflow-dashboard-particles');
    await container?.destroy();
  }
}
