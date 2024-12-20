import type {
  TableOfContentsCategory,
  TableOfContentsCategoryEntry,
} from "../data/docs.ts";

export function SidebarCategory(props: {
  category: TableOfContentsCategory;
  url: string;
}) {
  const { title, href, entries } = props.category;

  return (
    <details
      key={title}
      open={(isSummaryOpened(title, props.url) || entries.length === 0)
        ? true
        : false}
    > 
      <summary class="my-2 block">
        <a
          href={href}
          class="hover:text-gray-600 dark:aria-[current]:text-green-400 aria-[current]:text-green-600 aria-[current]:hover:underline font-bold"
        >
          {title}
        </a>
      </summary>
      {entries.length > 0 && (
        <ul class="ml-2 border-l border-gray-250 py-2">
          {entries.map((entry) => (
            <SidebarEntry key={entry.href} entry={entry} />
          ))}
        </ul>
      )}
    </details>
  );
}

export function SidebarEntry(props: {
  entry: TableOfContentsCategoryEntry;
}) {
  const { title, href } = props.entry;

  return (
    <li class="py-[1px]">
      <a
        href={href}
        class="aria-[current]:text-green-600 dark:aria-[current]:border-green-400 aria-[current]:bg-green-50 border-l-4 border-transparent px-4 py-0.5 transition-colors hover:text-green-500 font-normal block"
      >
        {title}
      </a>
    </li>
  );
}

function isSummaryOpened(title: string, url: string): boolean {
  return Boolean(url.includes(title.toLowerCase().split(" ")[0]));
}
