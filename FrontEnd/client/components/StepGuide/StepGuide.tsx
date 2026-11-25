import React, { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Compass,
  ChevronRight,
  ChevronLeft,
  X,
  CheckCircle2,
  HelpCircle,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsHighContrast } from "@/hooks/useTheme";
import {
  isGuideCompleted,
  setGuideCompleted,
  getCurrentUserEmail,
  isTesterEmail,
  resetModuleGuide,
} from "@/lib/stepGuide";
import { MODULE_GUIDES, StepItem } from "./stepGuideConfig";

export interface StepGuideProps {
  moduleName: string;
  customSteps?: StepItem[];
  customTitle?: string;
  forceShow?: boolean;
  onFinish?: () => void;
  showHelpButton?: boolean;
  onStepChange?: (stepIndex: number, currentStep: StepItem) => void;
}

interface TargetBox {
  top: number;
  left: number;
  width: number;
  height: number;
  bottom: number;
  right: number;
}

export function StepGuide({
  moduleName,
  customSteps,
  customTitle,
  forceShow = false,
  onFinish,
  showHelpButton = true,
  onStepChange,
}: StepGuideProps) {
  const isHC = useIsHighContrast();
  const config = MODULE_GUIDES[moduleName];
  const steps = customSteps || config?.steps || [];
  const moduleTitle = customTitle || config?.moduleTitle || "Panduan ARAHIN";

  const [isOpen, setIsOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [targetBox, setTargetBox] = useState<TargetBox | null>(null);
  const [popoverPos, setPopoverPos] = useState<{ top: number; left: number }>({
    top: 0,
    left: 0,
  });
  const [isCentered, setIsCentered] = useState(false);

  const cardRef = useRef<HTMLDivElement>(null);
  const userEmail = getCurrentUserEmail();
  const isTester = isTesterEmail(userEmail);

  // Cek apakah step guide harus terbuka otomatis untuk modul ini
  useEffect(() => {
    if (steps.length === 0) return;

    const alreadyDone = isGuideCompleted(moduleName, userEmail);

    if (forceShow || !alreadyDone) {
      // Beri sedikit jeda agar DOM selesai dirender
      const timer = setTimeout(() => {
        setIsOpen(true);
        setActiveStep(0);
      }, 450);
      return () => clearTimeout(timer);
    }
  }, [moduleName, forceShow, userEmail, steps.length]);

  // Perhitungan posisi target dan popover
  const updatePosition = useCallback(() => {
    if (!isOpen || steps.length === 0) return;
    const currentStep = steps[activeStep];
    if (!currentStep) return;

    const element = document.querySelector(currentStep.target) as HTMLElement | null;

    if (!element) {
      setTargetBox(null);
      setIsCentered(true);
      return;
    }

    // Elemen ditemukan: scroll ke elemen jika di luar layar
    const rect = element.getBoundingClientRect();
    const isOutOfViewport =
      rect.top < 0 ||
      rect.bottom > window.innerHeight ||
      rect.left < 0 ||
      rect.right > window.innerWidth;

    if (isOutOfViewport) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "nearest",
      });
    }

    const updatedRect = element.getBoundingClientRect();
    const pad = currentStep.highlightPadding ?? (window.innerWidth < 640 ? 4 : 8);

    const box: TargetBox = {
      top: updatedRect.top,
      left: updatedRect.left,
      width: updatedRect.width,
      height: updatedRect.height,
      bottom: updatedRect.bottom,
      right: updatedRect.right,
    };
    setTargetBox(box);
    setIsCentered(false);

    // Hitung posisi popover card
    const cardEl = cardRef.current;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const cardWidth = cardEl ? cardEl.offsetWidth : Math.min(350, viewportWidth - 28);
    const cardHeight = cardEl ? cardEl.offsetHeight : 210;
    const margin = 12;

    // Khusus perangkat mobile (layar < 640px)
    if (viewportWidth < 640) {
      let mobileTop = 16;
      if (box.top > viewportHeight / 2) {
        // Target berada di area bawah layar -> letakkan kartu di atas target
        mobileTop = Math.max(16, box.top - cardHeight - margin);
      } else {
        // Target berada di area atas layar -> letakkan kartu di bawah target
        mobileTop = Math.min(viewportHeight - cardHeight - 16, box.bottom + margin);
      }
      const mobileLeft = Math.max(14, (viewportWidth - cardWidth) / 2);
      setPopoverPos({ top: mobileTop, left: mobileLeft });
      return;
    }

    let prefPos = currentStep.position || "auto";

    let top = 0;
    let left = 0;

    if (prefPos === "bottom") {
      top = box.bottom + margin;
      left = box.left + box.width / 2 - cardWidth / 2;

      // Jika terpotong di bawah, balik ke atas
      if (top + cardHeight > viewportHeight - 16) {
        top = Math.max(16, box.top - cardHeight - margin);
      }
    } else if (prefPos === "top") {
      top = box.top - cardHeight - margin;
      left = box.left + box.width / 2 - cardWidth / 2;

      // Jika terpotong di atas, balik ke bawah
      if (top < 16) {
        top = Math.min(viewportHeight - cardHeight - 16, box.bottom + margin);
      }
    } else if (prefPos === "right") {
      left = box.right + margin;
      top = box.top + box.height / 2 - cardHeight / 2;

      if (left + cardWidth > viewportWidth - 16) {
        // Balik ke bawah atau kiri
        if (box.left - cardWidth - margin > 16) {
          left = box.left - cardWidth - margin;
        } else {
          top = box.bottom + margin;
          left = box.left + box.width / 2 - cardWidth / 2;
        }
      }
    } else if (prefPos === "left") {
      left = box.left - cardWidth - margin;
      top = box.top + box.height / 2 - cardHeight / 2;

      if (left < 16) {
        // Balik ke kanan atau bawah
        if (box.right + cardWidth + margin < viewportWidth - 16) {
          left = box.right + margin;
        } else {
          top = box.bottom + margin;
          left = box.left + box.width / 2 - cardWidth / 2;
        }
      }
    } else {
      // Auto: preferensi bawah
      top = box.bottom + margin;
      left = box.left + box.width / 2 - cardWidth / 2;
      if (top + cardHeight > viewportHeight - 16) {
        top = Math.max(16, box.top - cardHeight - margin);
      }
    }

    // Pastikan tidak meluap keluar batas horizontal layar
    left = Math.max(16, Math.min(viewportWidth - cardWidth - 16, left));
    top = Math.max(16, Math.min(viewportHeight - cardHeight - 16, top));

    setPopoverPos({ top, left });
  }, [isOpen, steps, activeStep]);

  useEffect(() => {
    if (!isOpen) return;

    if (onStepChange && steps[activeStep]) {
      onStepChange(activeStep, steps[activeStep]);
    }

    updatePosition();
    const t1 = setTimeout(updatePosition, 100);
    const t2 = setTimeout(updatePosition, 250);
    const t3 = setTimeout(updatePosition, 450);

    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [isOpen, activeStep, updatePosition, onStepChange, steps]);

  // Keyboard navigation (ESC, Arrow keys, Enter)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleDismiss();
      } else if (e.key === "ArrowRight" || e.key === "Enter") {
        handleNext();
      } else if (e.key === "ArrowLeft") {
        handlePrev();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, activeStep, steps.length]);

  const handleNext = () => {
    if (activeStep < steps.length - 1) {
      const nextIdx = activeStep + 1;
      setActiveStep(nextIdx);
      if (onStepChange && steps[nextIdx]) {
        onStepChange(nextIdx, steps[nextIdx]);
      }
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (activeStep > 0) {
      const prevIdx = activeStep - 1;
      setActiveStep(prevIdx);
      if (onStepChange && steps[prevIdx]) {
        onStepChange(prevIdx, steps[prevIdx]);
      }
    }
  };

  const handleComplete = () => {
    setGuideCompleted(moduleName, userEmail);
    setIsOpen(false);
    if (onFinish) onFinish();
  };

  const handleDismiss = () => {
    setGuideCompleted(moduleName, userEmail);
    setIsOpen(false);
  };

  const handleManualOpen = () => {
    resetModuleGuide(moduleName, userEmail);
    setActiveStep(0);
    setIsOpen(true);
  };

  if (steps.length === 0) return null;

  const currentStep = steps[activeStep];
  const isFirst = activeStep === 0;
  const isLast = activeStep === steps.length - 1;
  const pad = currentStep?.highlightPadding ?? 8;

  const spotlightStyle = isHC
    ? {
        border: "3px solid #ffff00",
        boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.9)",
      }
    : {
        border: "2px solid hsl(186 100% 27%)",
        boxShadow: "0 0 0 9999px rgba(15, 23, 42, 0.72)",
      };

  const cardStyle = isHC
    ? "bg-black border-4 border-[#ffff00] text-white shadow-2xl"
    : "bg-card border border-border text-card-foreground shadow-2xl";

  const guidePortal = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[99990] overflow-hidden select-none pointer-events-auto">
          {/* Target Element Spotlight Highlight */}
          {targetBox && !isCentered && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className={`fixed rounded-xl z-[99991] ${
                currentStep?.clickableTarget
                  ? "cursor-pointer pointer-events-auto"
                  : "pointer-events-none"
              }`}
              style={{
                top: targetBox.top - pad,
                left: targetBox.left - pad,
                width: targetBox.width + pad * 2,
                height: targetBox.height + pad * 2,
                ...spotlightStyle,
              }}
              onClick={() => {
                if (currentStep?.clickableTarget) {
                  const el = document.querySelector(currentStep.target) as HTMLElement | null;
                  if (el) {
                    el.click();
                  }
                  handleNext();
                }
              }}
            >
              <div
                className={`absolute -inset-1.5 rounded-xl border border-dashed animate-pulse pointer-events-none ${
                  isHC ? "border-[#ffff00]/60" : "border-primary/50"
                }`}
              />
            </motion.div>
          )}

          {/* Full Backdrop if no target found (centered modal fallback) */}
          {(isCentered || !targetBox) && (
            <div
              className={`fixed inset-0 z-[99991] ${
                isHC ? "bg-black/90" : "bg-slate-950/75 backdrop-blur-[2px]"
              }`}
              onClick={handleDismiss}
            />
          )}

          {/* Floating Tooltip / Popover Card */}
          <div
            ref={cardRef}
            className={`fixed z-[99995] w-[92vw] max-w-sm sm:max-w-md max-h-[85vh] overflow-y-auto rounded-2xl p-4 sm:p-5 ${cardStyle}`}
            style={
              isCentered || !targetBox
                ? {
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                  }
                : {
                    top: popoverPos.top,
                    left: popoverPos.left,
                  }
            }
          >
            {/* Header: Module badge, Step counter & Close button */}
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                    isHC
                      ? "bg-[#ffff00] text-black"
                      : "bg-primary/10 text-primary"
                  }`}
                >
                  {moduleTitle}
                </span>
                <span
                  className={`text-xs font-semibold ${
                    isHC ? "text-[#ffff00]" : "text-muted-foreground"
                  }`}
                >
                  {activeStep + 1} / {steps.length}
                </span>
              </div>

              <button
                onClick={handleDismiss}
                className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Tutup Panduan"
                title="Tutup Panduan"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Step Content */}
            <div className="mb-4">
              <h3
                className={`text-base font-bold mb-1 ${
                  isHC ? "text-[#ffff00]" : "text-foreground"
                }`}
              >
                {currentStep.title}
              </h3>
              <p
                className={`text-sm leading-relaxed ${
                  isHC ? "text-white" : "text-muted-foreground"
                }`}
              >
                {currentStep.description}
              </p>
            </div>

            {/* Footer Navigation: Dots & Buttons */}
            <div className="flex items-center justify-between pt-3 border-t border-border">
              {/* Step indicator dots */}
              <div className="flex items-center gap-1">
                {steps.map((_, i) => (
                  <span
                    key={i}
                    className={`h-1.5 rounded-full transition-all ${
                      i === activeStep
                        ? isHC
                          ? "w-5 bg-[#ffff00]"
                          : "w-5 bg-primary"
                        : isHC
                          ? "w-1.5 bg-white/40"
                          : "w-1.5 bg-muted-foreground/30"
                    }`}
                  />
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                {!isLast && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDismiss}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Lewati
                  </Button>
                )}

                {!isFirst && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrev}
                    className="text-xs flex items-center gap-1"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                    Kembali
                  </Button>
                )}

                <Button
                  size="sm"
                  onClick={handleNext}
                  className={`text-xs font-bold flex items-center gap-1 shadow-sm ${
                    isHC
                      ? "bg-[#ffff00] text-black hover:bg-[#ffff00]/90"
                      : "bg-primary text-primary-foreground hover:bg-primary/90"
                  }`}
                >
                  {isLast ? (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Selesai
                    </>
                  ) : (
                    <>
                      Lanjut
                      <ChevronRight className="h-3.5 w-3.5" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );

  return (
    <>
      {/* Portal modal ke document.body */}
      {typeof document !== "undefined" && createPortal(guidePortal, document.body)}

      {/* Floating Helper Button di Pojok Kanan Bawah */}
      {showHelpButton && !isOpen && (
        <button
          onClick={handleManualOpen}
          aria-label="Buka Panduan Langkah Fitur"
          title={`Buka Panduan: ${moduleTitle}${isTester ? " (Mode Akun Tester)" : ""}`}
          className={`fixed bottom-5 right-5 z-40 flex items-center gap-2 px-3.5 py-2 rounded-full shadow-lg transition-all hover:scale-105 active:scale-95 text-xs font-bold border backdrop-blur-md ${
            isHC
              ? "bg-black text-[#ffff00] border-2 border-[#ffff00] hover:bg-[#ffff00]/20"
              : "bg-background/90 text-primary border-primary/30 hover:border-primary shadow-primary/10 hover:bg-muted"
          }`}
        >
          <HelpCircle className="h-4 w-4" />
          <span className="hidden sm:inline">Panduan Fitur</span>
          {isTester && (
            <span className="bg-emerald-500 text-white text-[9px] px-1.5 py-0.2 rounded-full uppercase">
              Tester
            </span>
          )}
        </button>
      )}
    </>
  );
}
