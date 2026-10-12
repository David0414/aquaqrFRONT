import { useLayoutEffect, useRef } from 'react';

export default function useRechargeViewport() {
  const screen = useRef(null), viewport = useRef(null), content = useRef(null);

  useLayoutEffect(() => {
    const html = document.documentElement, body = document.body;
    const previous = {
      htmlOverflow: html.style.overflow, bodyOverflow: body.style.overflow,
      htmlOverscroll: html.style.overscrollBehavior, bodyOverscroll: body.style.overscrollBehavior,
      height: html.style.getPropertyValue('--recharge-viewport-height'),
      top: html.style.getPropertyValue('--recharge-viewport-top'),
    };
    html.style.overflow = 'hidden'; body.style.overflow = 'hidden';
    html.style.overscrollBehavior = 'none'; body.style.overscrollBehavior = 'none';
    let frame;
    const fit = () => {
      frame = undefined;
      if (!screen.current || !viewport.current || !content.current) return;
      const visual = window.visualViewport;
      html.style.setProperty('--recharge-viewport-height', `${visual?.height || window.innerHeight}px`);
      html.style.setProperty('--recharge-viewport-top', `${visual?.offsetTop || 0}px`);
      screen.current.classList.toggle('recharge-keyboard-open', Boolean(visual && window.innerHeight - visual.height > 120 && visual.scale <= 1.05));
      // Measure the natural layout, so scaling never changes the next measurement.
      const availableWidth = viewport.current.clientWidth;
      content.current.style.width = `${availableWidth}px`;
      const height = content.current.offsetHeight, width = content.current.scrollWidth;
      const scale = Math.min(1, Math.max(0, viewport.current.clientHeight - 2) / Math.max(1, height),
        availableWidth / Math.max(1, width));
      // Keep the full screen width when a short viewport requires a smaller layout.
      content.current.style.width = `${scale > 0 ? availableWidth / scale : availableWidth}px`;
      content.current.style.setProperty('--recharge-fit', String(scale));
    };
    const schedule = () => { if (frame === undefined) frame = requestAnimationFrame(fit); };
    const observer = new ResizeObserver(schedule);
    observer.observe(viewport.current); observer.observe(content.current);
    window.addEventListener('resize', schedule);
    window.visualViewport?.addEventListener('resize', schedule);
    window.visualViewport?.addEventListener('scroll', schedule);
    fit();
    return () => {
      if (frame !== undefined) cancelAnimationFrame(frame);
      observer.disconnect(); window.removeEventListener('resize', schedule);
      window.visualViewport?.removeEventListener('resize', schedule);
      window.visualViewport?.removeEventListener('scroll', schedule);
      html.style.overflow = previous.htmlOverflow; body.style.overflow = previous.bodyOverflow;
      html.style.overscrollBehavior = previous.htmlOverscroll; body.style.overscrollBehavior = previous.bodyOverscroll;
      for (const [key, value] of [['height', previous.height], ['top', previous.top]]) {
        if (value) html.style.setProperty(`--recharge-viewport-${key}`, value);
        else html.style.removeProperty(`--recharge-viewport-${key}`);
      }
    };
  }, []);

  return { screen, viewport, content };
}
