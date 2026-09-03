/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef } from "react";

export interface ModalEntry {
  id: string;
  close: () => void;
}

class NavigationManager {
  private viewHistory: string[] = [];
  private modalStack: ModalEntry[] = [];
  private viewChangeHandler: ((view: string) => void) | null = null;
  private fallbackHandler: (() => void) | null = null;
  private isUserLoggedIn: boolean = false;
  private isAdminLoggedIn: boolean = false;
  private isPoppingInternally: boolean = false;

  constructor() {
    // Initial safe state
    if (typeof window !== "undefined") {
      (window as any).__smartlink_navigateBack = () => this.navigateBack();
    }
  }

  public setSessionStatus(userLoggedIn: boolean, adminLoggedIn: boolean): void {
    this.isUserLoggedIn = userLoggedIn;
    this.isAdminLoggedIn = adminLoggedIn;
  }

  public registerViewChangeHandler(handler: (view: string) => void): () => void {
    this.viewChangeHandler = handler;
    return () => {
      if (this.viewChangeHandler === handler) {
        this.viewChangeHandler = null;
      }
    };
  }

  public registerFallbackHandler(handler: () => void): () => void {
    this.fallbackHandler = handler;
    return () => {
      if (this.fallbackHandler === handler) {
        this.fallbackHandler = null;
      }
    };
  }

  /**
   * Tracks a new page or view navigation.
   */
  public pushView(view: string, route?: string, replace: boolean = false): void {
    if (this.viewHistory.length === 0) {
      this.viewHistory.push(view);
    } else if (replace) {
      this.viewHistory[this.viewHistory.length - 1] = view;
    } else {
      const currentTop = this.viewHistory[this.viewHistory.length - 1];
      if (currentTop !== view) {
        this.viewHistory.push(view);
      }
    }

    if (typeof window !== "undefined") {
      const stateObj = {
        view,
        isModal: false,
        stackLength: this.viewHistory.length
      };
      const targetUrl = route || window.location.pathname;

      try {
        if (replace) {
          window.history.replaceState(stateObj, document.title, targetUrl);
        } else {
          if (window.history.state?.view !== view || window.location.pathname !== targetUrl) {
            window.history.pushState(stateObj, document.title, targetUrl);
          }
        }
      } catch (err) {
        console.warn("History pushState error:", err);
      }
    }
  }

  public getViewHistory(): string[] {
    return [...this.viewHistory];
  }

  public getCurrentView(): string {
    return this.viewHistory[this.viewHistory.length - 1] || "HOME";
  }

  /**
   * Registers an open modal, dialog, or drawer onto the modal stack.
   * Pushes a history entry so standard browser Back closes this modal without changing the page.
   */
  public pushModal(id: string, closeFn: () => void): void {
    // Avoid duplicate push for the same modal id if already top of stack
    const existingIndex = this.modalStack.findIndex(m => m.id === id);
    if (existingIndex !== -1) {
      // Move to top
      const [existing] = this.modalStack.splice(existingIndex, 1);
      existing.close = closeFn;
      this.modalStack.push(existing);
      return;
    }

    this.modalStack.push({ id, close: closeFn });

    if (typeof window !== "undefined") {
      try {
        const stateObj = {
          view: this.getCurrentView(),
          isModal: true,
          modalId: id,
          modalDepth: this.modalStack.length
        };
        window.history.pushState(stateObj, document.title, window.location.pathname + window.location.search);
      } catch (err) {
        console.warn("Modal pushState error:", err);
      }
    }
  }

  /**
   * Removes a modal from the stack if closed directly by user UI action (e.g., clicking close X).
   */
  public removeModal(id: string): void {
    const index = this.modalStack.findIndex(m => m.id === id);
    if (index !== -1) {
      const isTop = index === this.modalStack.length - 1;
      this.modalStack.splice(index, 1);

      // If this modal was the top history entry, pop it so we don't leave a dead modal state in browser history
      if (isTop && typeof window !== "undefined" && window.history.state?.isModal && window.history.state?.modalId === id) {
        try {
          this.isPoppingInternally = true;
          window.history.back();
          setTimeout(() => {
            this.isPoppingInternally = false;
          }, 50);
        } catch (e) {
          this.isPoppingInternally = false;
        }
      }
    }
  }

  public hasOpenModals(): boolean {
    return this.modalStack.length > 0;
  }

  public getModalCount(): number {
    return this.modalStack.length;
  }

  /**
   * Strictly returns to the immediate previous page or pop-up.
   * If a pop-up is open, closes it first.
   * If no pop-up is open, steps back to the immediate previous page.
   * Never skips or jumps to homepage when in an authenticated session.
   */
  public navigateBack(): boolean {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    document.documentElement.scrollTop = 0;
    if (document.body) document.body.scrollTop = 0;

    // 1. If any modal is open, strictly close the top-most modal
    if (this.modalStack.length > 0) {
      const topModal = this.modalStack.pop();
      if (topModal) {
        try {
          topModal.close();
        } catch (err) {
          console.error("Error closing modal:", err);
        }
      }

      // If browser history was holding this modal's state, step it back
      if (typeof window !== "undefined" && window.history.state?.isModal) {
        try {
          this.isPoppingInternally = true;
          window.history.back();
          setTimeout(() => {
            this.isPoppingInternally = false;
          }, 50);
        } catch (e) {
          this.isPoppingInternally = false;
        }
      }
      return true;
    }

    // 2. If no modal is open, step back to immediate previous page in view stack
    if (this.viewHistory.length > 1) {
      this.viewHistory.pop(); // Pop current view
      let prevView = this.viewHistory[this.viewHistory.length - 1];

      // Never jump to unauthenticated HOME if the user or admin is signed in
      const unauthViews = ["HOME", "ADMIN_LOGIN", "FORGOT_PASSWORD", "RESET_PASSWORD", "VERIFY_EMAIL", "AUTH_ACTION"];
      if ((this.isUserLoggedIn || this.isAdminLoggedIn) && unauthViews.includes(prevView)) {
        // Find the most recent authenticated view in stack, or default to DASHBOARD
        const lastAuthView = [...this.viewHistory].reverse().find(v => !unauthViews.includes(v));
        prevView = lastAuthView || (this.isAdminLoggedIn ? "ADMIN_DASHBOARD" : "DASHBOARD");
        // Update history top to this safe view
        this.viewHistory = [prevView];
      }

      if (this.viewChangeHandler) {
        this.viewChangeHandler(prevView);
        return true;
      }
    }

    // 3. If at the bottom of the stack, fall back safely without jumping to HOME unexpectedly
    if (this.fallbackHandler) {
      this.fallbackHandler();
      return true;
    }

    if (this.isUserLoggedIn && this.getCurrentView() !== "DASHBOARD") {
      if (this.viewChangeHandler) {
        this.viewChangeHandler("DASHBOARD");
        return true;
      }
    } else if (this.isAdminLoggedIn && this.getCurrentView() !== "ADMIN_DASHBOARD") {
      if (this.viewChangeHandler) {
        this.viewChangeHandler("ADMIN_DASHBOARD");
        return true;
      }
    }

    return false;
  }

  /**
   * Internal popstate listener that coordinates with browser Back / Forward buttons.
   */
  public handlePopState(e: PopStateEvent, routeToViewMap: Record<string, string>): void {
    if (this.isPoppingInternally) {
      return;
    }

    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    document.documentElement.scrollTop = 0;
    if (document.body) document.body.scrollTop = 0;

    // A) If a modal is open, close the top modal immediately and prevent page skip
    if (this.modalStack.length > 0) {
      const topModal = this.modalStack.pop();
      if (topModal) {
        try {
          topModal.close();
        } catch (err) {
          console.error("Error closing modal on popstate:", err);
        }
      }
      return;
    }

    // B) Page navigation popstate
    let targetView = e.state?.view;
    if (!targetView) {
      const path = window.location.pathname;
      targetView = routeToViewMap[path] || (this.isUserLoggedIn ? "DASHBOARD" : (this.isAdminLoggedIn ? "ADMIN_DASHBOARD" : "HOME"));
    }

    // Never jump to HOME if signed in
    const unauthViews = ["HOME", "ADMIN_LOGIN", "FORGOT_PASSWORD", "RESET_PASSWORD", "VERIFY_EMAIL", "AUTH_ACTION"];
    if ((this.isUserLoggedIn || this.isAdminLoggedIn) && unauthViews.includes(targetView)) {
      targetView = this.isAdminLoggedIn ? "ADMIN_DASHBOARD" : "DASHBOARD";
    }

    // Keep internal stack in sync
    const lastIndex = this.viewHistory.lastIndexOf(targetView);
    if (lastIndex !== -1) {
      this.viewHistory = this.viewHistory.slice(0, lastIndex + 1);
    } else {
      this.viewHistory.push(targetView);
    }

    if (this.viewChangeHandler) {
      this.viewChangeHandler(targetView);
    }
  }
}

export const navigationManager = new NavigationManager();

/**
 * React Hook for any component that opens a modal, popup, or slide-over.
 * Ensures the modal is registered with the Back button stack so clicking back
 * closes the modal before navigating away from the page.
 */
export function useModalBackHandler(isOpen: boolean, modalId: string, onClose: () => void) {
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;

    navigationManager.pushModal(modalId, () => {
      onCloseRef.current();
    });

    return () => {
      navigationManager.removeModal(modalId);
    };
  }, [isOpen, modalId]);
}
