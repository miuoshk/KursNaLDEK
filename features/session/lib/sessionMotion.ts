import type { Variants } from "framer-motion";

export const questionVariants: Variants = {
  enter: { opacity: 0, x: 40 },
  center: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.25, ease: "easeOut" },
  },
  exit: { opacity: 0, x: -40, transition: { duration: 0.15, ease: "easeIn" } },
};

export const optionsContainerVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } },
};

export const optionVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2 } },
};

export const feedbackVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: "easeOut" },
  },
};
