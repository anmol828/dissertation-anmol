import { motion, useReducedMotion } from "framer-motion";

/**
 * Shared scroll-reveal primitives.
 *
 * <Reveal>            -> single element that fades/slides in on scroll
 * <RevealGroup>       -> staggers its <Reveal> children as they enter the viewport
 *
 * All motion respects prefers-reduced-motion and only animates once.
 */

const EASE = [0.22, 1, 0.36, 1];

export const fadeInUp = {
    hidden: { opacity: 0, y: 24 },
    show: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.6, ease: EASE },
    },
};

const staggerContainer = {
    hidden: {},
    show: {
        transition: { staggerChildren: 0.1, delayChildren: 0.05 },
    },
};

export function Reveal({
    as = "div",
    children,
    className = "",
    delay = 0,
    y = 24,
    once = true,
    amount = 0.2,
    ...rest
}) {
    const reduceMotion = useReducedMotion();
    const MotionTag = motion[as] || motion.div;

    const variants = reduceMotion
        ? { hidden: { opacity: 0 }, show: { opacity: 1 } }
        : {
            hidden: { opacity: 0, y },
            show: {
                opacity: 1,
                y: 0,
                transition: { duration: 0.6, ease: EASE, delay },
            },
        };

    return (
        <MotionTag
            className={className}
            variants={variants}
            initial="hidden"
            whileInView="show"
            viewport={{ once, amount }}
            {...rest}
        >
            {children}
        </MotionTag>
    );
}

export function RevealGroup({
    as = "div",
    children,
    className = "",
    once = true,
    amount = 0.15,
    ...rest
}) {
    const MotionTag = motion[as] || motion.div;

    return (
        <MotionTag
            className={className}
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once, amount }}
            {...rest}
        >
            {children}
        </MotionTag>
    );
}

/**
 * Child item meant to live inside a <RevealGroup>.
 * It inherits the parent's stagger timing instead of using whileInView itself.
 */
export function RevealItem({
    as = "div",
    children,
    className = "",
    y = 24,
    ...rest
}) {
    const reduceMotion = useReducedMotion();
    const MotionTag = motion[as] || motion.div;

    const variants = reduceMotion
        ? { hidden: { opacity: 0 }, show: { opacity: 1 } }
        : {
            hidden: { opacity: 0, y },
            show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } },
        };

    return (
        <MotionTag className={className} variants={variants} {...rest}>
            {children}
        </MotionTag>
    );
}
