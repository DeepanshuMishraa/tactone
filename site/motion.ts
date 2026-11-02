/** Scroll-linked motion for the site. Both hooks observe the DOM and leave rendering to CSS. */

import { useEffect, useState } from "react";

/** Marks each `[data-reveal]` element with `data-in` the first time it scrolls into view. */
export function useReveal() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.setAttribute("data-in", "");
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 },
    );
    for (const element of document.querySelectorAll("[data-reveal]")) observer.observe(element);
    return () => observer.disconnect();
  }, []);
}

/** The id of the section nearest the top of the viewport, for a table of contents. */
export function useActiveSection(ids: readonly string[]) {
  const [active, setActive] = useState(ids[0] ?? "");
  useEffect(() => {
    const visible = new Set<string>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target.id);
          else visible.delete(entry.target.id);
        }
        const first = ids.find((id) => visible.has(id));
        if (first !== undefined) setActive(first);
      },
      { rootMargin: "-15% 0px -70% 0px" },
    );
    for (const id of ids) {
      const element = document.getElementById(id);
      if (element !== null) observer.observe(element);
    }
    return () => observer.disconnect();
  }, [ids]);
  return active;
}

declare module "react" {
  interface CSSProperties {
    /** Position in a staggered group. CSS turns it into a delay. */
    "--i"?: number;
  }
}
