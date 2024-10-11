import type {
  TableOfContentsCategory,
  TableOfContentsCategoryEntry,
} from "../data/docs.ts";

export function SidebarCategory(props: {
  category: TableOfContentsCategory;
}) {
  const { title, href, entries } = props.category;

  return (
    <li class="my-2 block bg-lightBackground text-lightText dark:bg-darkBackground dark:text-darkText">
      <a
        href={href}
        class="bg-lightBackground text-lightText dark:bg-darkBackground dark:text-darkText hover:text-gray-600 aria-[current]:text-green-700 aria-[current]:hover:underline font-bold"
      >
        {title}
      </a>
      {entries.length > 0 && (
        <ul class="bg-lightBackground text-lightText dark:bg-darkBackground dark:text-darkText py-2 nested list-outside">
          {entries.map((entry) => (
            <SidebarEntry key={entry.href} entry={entry} />
          ))}
        </ul>
      )}
    </li>
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
