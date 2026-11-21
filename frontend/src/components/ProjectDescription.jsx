import { useLayoutEffect, useRef, useState } from 'react';

// Project description for a project card: clamped to two lines, with a
// "Show more" / "Show less" toggle that sits inline at the end of the text
// (same size as the description) and only appears if the text is cut off.
export default function ProjectDescription({ text }) {
  const ref = useRef(null);
  const [expanded, setExpanded] = useState(false);
  const [isClamped, setIsClamped] = useState(false);

  // While collapsed, check whether the text overflows the clamped box (also
  // re-check when the tile is resized). While expanded we keep the last
  // answer so the "Show less" button doesn't disappear.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || expanded) return undefined;

    const measure = () => setIsClamped(el.scrollHeight > el.clientHeight + 1);
    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [text, expanded]);

  if (!text) return <div className="project-card-description-area" />;

  const toggle = () => setExpanded((e) => !e);

  return (
    <div className="project-card-description-area">
      <p
        ref={ref}
        className={`project-card-description${expanded ? '' : ' project-card-description-clamped'}`}
      >
        {text}
        {isClamped && !expanded && (
          <button
            type="button"
            className="link-button project-card-toggle project-card-toggle-overlay"
            aria-expanded={false}
            onClick={toggle}
          >
            Show more
          </button>
        )}
        {expanded && (
          <>
            {' '}
            <button
              type="button"
              className="link-button project-card-toggle"
              aria-expanded
              onClick={toggle}
            >
              Show less
            </button>
          </>
        )}
      </p>
    </div>
  );
}
