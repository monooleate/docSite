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
      open={isSummaryOpened(title, props.url)}
      name={title}
      class={entries.length === 0 ? "no-content" : ""}
    >
      <summary class="my-2 block bg-lightBackground text-lightText dark:bg-darkBackground dark:text-darkText">
        <a
          href={href}
          class="bg-lightBackground text-lightText dark:bg-darkBackground dark:text-darkText hover:text-gray-600 aria-[current]:text-green-700 aria-[current]:hover:underline font-bold"
        >
          {title}
        </a>
      </summary>
      {entries.length > 0 && (
        <ul class="ml-2 border-l border-gray-250 bg-lightBackground text-lightText dark:bg-darkBackground dark:text-darkText py-2 nested list-outside">
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
    <li class="py-[1px] bg-lightBackground text-lightText dark:bg-darkBackground dark:text-darkText">
      <a
        href={href}
        class="aria-[current]:text-green-700 aria-[current]:border-green-600 aria-[current]:bg-green-50 border-l-4 border-transparent px-4 py-0.5 transition-colors hover:text-green-500 font-normal block"
      >
        {title}
      </a>
    </li>
  );
}

function isSummaryOpened(title: string, url: string): boolean {
  return Boolean(url.includes(title.toLowerCase().split(" ")[0]));
}
