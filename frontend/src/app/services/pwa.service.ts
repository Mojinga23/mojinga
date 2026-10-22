import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PwaService {
  private deferredPrompt: any = null;
  private isInstallableSubject = new BehaviorSubject<boolean>(false);
  public isInstallable$ = this.isInstallableSubject.asObservable();

  private isStandaloneSubject = new BehaviorSubject<boolean>(false);
  public isStandalone$ = this.isStandaloneSubject.asObservable();

  constructor() {
    this.checkStandalone();
    this.initInstallPromptListener();
  }

  private checkStandalone(): void {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    this.isStandaloneSubject.next(isStandalone);
  }

  private initInstallPromptListener(): void {
    window.addEventListener('beforeinstallprompt', (e: Event) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      // Stash the event so it can be triggered later.
      this.deferredPrompt = e;
      this.isInstallableSubject.next(true);
      console.log('PWA beforeinstallprompt event captured');
    });

    window.addEventListener('appinstalled', () => {
      this.deferredPrompt = null;
      this.isInstallableSubject.next(false);
      this.isStandaloneSubject.next(true);
      console.log('PWA installed successfully');
    });
  }

  async promptInstall(): Promise<boolean> {
    if (!this.deferredPrompt) {
      // If native prompt not available yet (e.g. Chrome desktop or iOS), show helpful instructions
      return false;
    }
    // Show the prompt
    this.deferredPrompt.prompt();
    // Wait for the user to respond to the prompt
    const { outcome } = await this.deferredPrompt.userChoice;
    console.log(`User response to install prompt: ${outcome}`);
    this.deferredPrompt = null;
    this.isInstallableSubject.next(false);
    return outcome === 'accepted';
  }
}
