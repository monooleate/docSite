import { useEffect, useRef, useState } from "preact/hooks";
import type { MarkdownHeading } from "../utils/markdown.ts";

export interface TableOfContentsProps {
  headings: MarkdownHeading[];
}

function setActiveLink(
  container: HTMLElement,
  marker: HTMLElement,
  id: string,
) {
  container.querySelectorAll(`a`).forEach((link) =>
    link.classList.remove("active")
  );
  const tocLink = container.querySelector(
    `a[href="#${id}"]`,
  ) as HTMLElement;

  if (tocLink === null) return;

  tocLink.classList.add("active");

  const rect = tocLink
    .getBoundingClientRect();
  const markerRect = marker.getBoundingClientRect();

  const top = tocLink.offsetTop + (rect.height / 2) -
    (markerRect.height / 2);
  marker.style.cssText = `transform: translate3d(0, ${top}px, 0); opacity: 1`;
}

export function TableOfContents({ headings }: TableOfContentsProps) {
  const ref = useRef<HTMLDivElement>(null);
  const refMarker = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    const container = ref.current;

    const activeList = new Array(headings.length).fill(false);
    const visibleList = new Array(headings.length).fill(false);

    const marker = refMarker.current!;
    const observer = new IntersectionObserver((entries) => {
      for (let i = 0; i < entries.length; i++) {
        const entry = entries[i];
        const target = entry.target;

        for (let j = 0; j < headings.length; j++) {
          const heading = headings[j];
          if (heading.id === target.id) {
            const active = entry.isIntersecting ||
              entry.boundingClientRect.top < 0;
            activeList[j] = active;
            visibleList[j] = entry.isIntersecting;
          }
        }
      }

      // Reset links
      for (let i = 0; i < headings.length; i++) {
        const id = headings[i].id;
        const tocLink = container.querySelector(
          `a[href="#${id}"]`,
        );
        if (tocLink !== null) {
          tocLink.classList.remove("active");
        }
      }

      let activeIdx = visibleList.indexOf(true);
      if (activeIdx < 0) {
        activeIdx = activeList.lastIndexOf(true);
      }

      if (activeIdx > -1) {
        const id = headings[activeIdx].id;
        setActiveLink(container, marker, id);
      } else {
        marker.style.cssText = `transform: translate3d(0, 0, 0); opacity: 0`;
      }
    });

    document.querySelectorAll(
      ".markdown-body h2, .markdown-body h3, .markdown-body h4, .markdown-body h5, .markdown-body h6",
    ).forEach((elem) => {
      observer.observe(elem);
    });

    return () => {
      observer.disconnect();
    };
  }, [headings]);

  return (
    <div
      ref={ref}
      class="xl:order-2 w-36 lg:w-48 xl:max-w-xs xl:top-14 shrink-0"
    >
      {headings.length > 0 && (
        <>
        {/* For mobile */}
          <div class="xl:hidden my-2">
            <button
              id="toc-outline-btn"
              onClick={() => setIsOpen((v) => !v)}
              class="bg-gray-100 dark:bg-darkBackground dark:text-darkText py-2 px-4 rounded border border-gray-300 flex items-center hover:border-green-600 transition-colors text-sm"
            >
              On this page
              <svg
                class={`w-4 h-4 inline-block ml-2 -rotate-90 [&.active]:rotate-0 ${
                  isOpen ? "active" : ""
                }`}
              >
                <use href="/icons.svg#arrow-down" />
              </svg>
            </button>
            {isOpen && (
              <div class="absolute truncate top-[48px] left-3/4 w-72 transform -translate-x-1/2 bg-white rounded-lg shadow dark:bg-gray-700 mt-2 px-4 border-b border-gray-250 text-[16px] leading-10">
                <nav aria-labelledby="toc-outline-btn">
                  <ul>
                    <li>
                      <a
                        href={`#`}
                        class="block border-b border-gray-250 bg-lightBackground text-lightText dark:bg-darkBackground dark:text-darkText"
                        onClick={() => setIsOpen((v) => !v)}
                      >
                        Return to top
                      </a>
                    </li>
                    {headings.map((heading) => {
                      return (
                        <li key={heading.id}>
                          <a
                            href={`#${heading.id}`}
                            class="block bg-lightBackground text-lightText  dark:bg-darkBackground dark:text-darkText"
                            onClick={() => setIsOpen((v) => !v)}
                            dangerouslySetInnerHTML={{ __html: heading.html }}
                          />
                        </li>
                      );
                    })}
                  </ul>
                </nav>
              </div>
            )}
          </div>
          {/* For desktop */}
          <div class="hidden xl:block xl:sticky xl:top-28">
            <div class="relative">
              <div
                ref={refMarker}
                class="marker w-[2px] bg-green-400 h-7 dark:text-darkText absolute top-0 opacity-0 transition-all"
              />
              <div role="heading" aria-level={2} class="pb-3 pl-1 font-semibold">
                On this page
              </div>
              <div class="pl-4 border-l border-gray-250 text-[13px] leading-7">
                <nav aria-labelledby="doc-outline-aria-label">
                  <span id="doc-outline-aria-label" class="sr-only">
                    Table of Contents for current page
                  </span>
                  <ul>
                    {headings.map((heading) => {
                      return (
                        <li key={heading.id} class="pb-3">
                          <a
                            href={`#${heading.id}`}
                            class="block text-base truncate transition-colors bg-lightBackground text-lightText dark:bg-darkBackground dark:text-darkText [&.active]:text-green-600"
                            onClick={() => {
                              setActiveLink(
                                ref.current!,
                                refMarker.current!,
                                heading.id,
                              );
                            }}
                            dangerouslySetInnerHTML={{ __html: heading.html }}
                          />
                        </li>
                      );
                    })}
                  </ul>
                </nav>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
