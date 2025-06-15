"use client"

import { useToast } from "@/hooks/use-toast"
import { motion, AnimatePresence } from "framer-motion"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      <AnimatePresence mode="popLayout">
        {toasts.map(function ({ id, title, description, action, ...props }) {
          return (
            <Toast key={id} {...props}>
              <motion.div 
                className="grid gap-2 flex-1"
                initial={{ opacity: 0, x: -8 }}
                animate={{ 
                  opacity: 1, 
                  x: 0,
                  transition: { 
                    delay: 0.1, 
                    duration: 0.2,
                    ease: [0.16, 1, 0.3, 1]
                  }
                }}
                exit={{ 
                  opacity: 0, 
                  x: 8,
                  transition: { duration: 0.15 }
                }}
              >
                {title && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ 
                      opacity: 1, 
                      y: 0,
                      transition: { delay: 0.15, duration: 0.2 }
                    }}
                  >
                    <ToastTitle>{title}</ToastTitle>
                  </motion.div>
                )}
                {description && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ 
                      opacity: 1, 
                      y: 0,
                      transition: { delay: 0.2, duration: 0.2 }
                    }}
                  >
                    <ToastDescription>{description}</ToastDescription>
                  </motion.div>
                )}
              </motion.div>
              {action && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ 
                    opacity: 1, 
                    scale: 1,
                    transition: { delay: 0.25, duration: 0.15 }
                  }}
                >
                  {action}
                </motion.div>
              )}
              <ToastClose />
            </Toast>
          )
        })}
      </AnimatePresence>
      <ToastViewport />
    </ToastProvider>
  )
}
