// src/hooks/useInView.js
import { useState, useEffect, useRef } from "react";

export function useInView(options = {}) {
  const [isInView, setIsInView] = useState(false);
  const [hasBeenInView, setHasBeenInView] = useState(false);
  const ref = useRef();

  const {
    threshold = 0.1,
    rootMargin = "0px",
    triggerOnce = true,
    root = null,
  } = options;

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // Fallback para navegadores que no soportan IntersectionObserver (defer para evitar setState síncrono en effect)
    if (!window.IntersectionObserver) {
      queueMicrotask(() => {
        setIsInView(true);
        setHasBeenInView(true);
      });
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        const inView = entry.isIntersecting;
        setIsInView(inView);

        if (inView && !hasBeenInView) {
          setHasBeenInView(true);
        }

        // Si triggerOnce es true y ya se vio una vez, desconectar el observer
        if (inView && triggerOnce && !hasBeenInView) {
          observer.unobserve(element);
        }
      },
      {
        threshold,
        rootMargin,
        root,
      }
    );

    observer.observe(element);

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, [threshold, rootMargin, triggerOnce, hasBeenInView, root]);

  return {
    ref,
    isInView: triggerOnce ? hasBeenInView : isInView,
    hasBeenInView,
  };
}

// Hook para animaciones múltiples
export function useInViewMultiple(options = {}) {
  const [elements, setElements] = useState(new Map());
  const refs = useRef(new Map());

  const { threshold = 0.1, rootMargin = "0px" } = options;

  const createRef = (id) => {
    if (!refs.current.has(id)) {
      refs.current.set(id, { current: null });
    }
    return refs.current.get(id);
  };

  useEffect(() => {
    if (!window.IntersectionObserver) {
      const allVisible = new Map();
      refs.current.forEach((ref, id) => {
        allVisible.set(id, true);
      });
      queueMicrotask(() => setElements(allVisible));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const updates = new Map(elements);

        entries.forEach((entry) => {
          const id = entry.target.dataset.animationId;
          if (id) {
            updates.set(id, entry.isIntersecting);
          }
        });

        setElements(updates);
      },
      { threshold, rootMargin }
    );

    // Observar todos los elementos actuales
    refs.current.forEach((ref, id) => {
      if (ref.current) {
        ref.current.dataset.animationId = id;
        observer.observe(ref.current);
      }
    });

    return () => {
      observer.disconnect();
    };
  }, [threshold, rootMargin]);

  const getRef = (id) => {
    const ref = createRef(id);
    return {
      ref,
      isInView: elements.get(id) || false,
    };
  };

  return { getRef };
}

// Hook para scroll animations
export function useScrollAnimation() {
  const [scrollY, setScrollY] = useState(0);
  const [scrollDirection, setScrollDirection] = useState("down");

  useEffect(() => {
    let lastScrollY = window.scrollY;

    const updateScrollY = () => {
      const currentScrollY = window.scrollY;
      setScrollDirection(currentScrollY > lastScrollY ? "down" : "up");
      setScrollY(currentScrollY);
      lastScrollY = currentScrollY;
    };

    const throttledUpdateScrollY = throttle(updateScrollY, 16); // ~60fps

    window.addEventListener("scroll", throttledUpdateScrollY);

    return () => {
      window.removeEventListener("scroll", throttledUpdateScrollY);
    };
  }, []);

  return { scrollY, scrollDirection };
}

// Utilidad de throttle
function throttle(func, delay) {
  let timeoutId;
  let lastExecTime = 0;

  return function (...args) {
    const currentTime = Date.now();

    if (currentTime - lastExecTime > delay) {
      func.apply(this, args);
      lastExecTime = currentTime;
    } else {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func.apply(this, args);
        lastExecTime = Date.now();
      }, delay - (currentTime - lastExecTime));
    }
  };
}
