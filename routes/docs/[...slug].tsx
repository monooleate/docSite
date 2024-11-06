import { HttpError, page } from "fresh";
import { asset, Partial } from "fresh/runtime";
import { SidebarCategory } from "../../components/DocsSidebar.tsx";
import Footer from "../../components/Footer.tsx";
import Header from "../../components/Header.tsx";
import {
  CATEGORIES,
  getFirstPageUrl,
  LATEST_VERSION,
  TABLE_OF_CONTENTS,
  type TableOfContentsEntry,
} from "../../data/docs.ts";
import { frontMatter, renderMarkdown } from "../../utils/markdown.ts";
import toc from "../../docs/toc.ts";
import { TableOfContents } from "../../islands/TableOfContents.tsx";
import SearchButton from "../../islands/SearchButton.tsx";
import { define } from "../../utils/state.ts";

interface Data {
  page: Page;
}

interface NavEntry {
  title: string;
  category?: string;
  href: string;
}

export interface VersionLink {
  label: string;
  href: string;
  value: string;
}

interface Page extends TableOfContentsEntry {
  markdown: string;
  data: Record<string, unknown>;
  versionLinks: VersionLink[];
  version: string;
  prevNav?: NavEntry;
  nextNav?: NavEntry;
}

const pattern = new URLPattern({ pathname: "/:version/:page*" });

export const handler = define.handlers<Data>({
  async GET(ctx) {
    const slug = ctx.params.slug;

    // Check if the slug is the index page of a version tag
    if (TABLE_OF_CONTENTS[slug]) {
      const href = getFirstPageUrl(slug);
      return new Response("", {
        status: 307,
        headers: { location: href },
      });
    }

    const match = pattern.exec("https://localhost/" + slug);
    if (!match) {
      throw new HttpError(404);
    }

    let { version, page: path = "" } = match.pathname.groups;
    if (!version) {
      throw new HttpError(404);
    }

    // Latest version doesn't show up in the url
    if (!TABLE_OF_CONTENTS[version]) {
      path = version + (path ? "/" + path : "");
      version = LATEST_VERSION;
    }

    // Check if the page exists
    const currentToc = TABLE_OF_CONTENTS[version];
    const entry = currentToc[path];
    if (!entry) {
      throw new HttpError(404);
    }

    // Build up the link map for the version selector.
    const versionLinks: VersionLink[] = [];
    for (const version in TABLE_OF_CONTENTS) {
      const label = toc[version].label;
      const maybeEntry = TABLE_OF_CONTENTS[version][path];

      // Check if the same page is available for this version and
      // link to that. Pick the index page for that version if an
      // exact match doesn't exist.
      versionLinks.push({
        label,
        value: version,
        href: maybeEntry ? maybeEntry.href : getFirstPageUrl(version),
      });
    }

    // Add previous and next page entry if available

    const entryKeys = Object.keys(currentToc);
    const idx = entryKeys.findIndex((name) => name === entry.slug);

    let nextNav: NavEntry | undefined;
    let prevNav: NavEntry | undefined;
    const prevEntry = currentToc[entryKeys[idx - 1]];
    const nextEntry = currentToc[entryKeys[idx + 1]];

    if (prevEntry) {
      let category = prevEntry.category;
      category = category ? currentToc[category].title : "";
      prevNav = { title: prevEntry.title, category, href: prevEntry.href };
    }

    if (nextEntry) {
      let category = nextEntry.category;
      category = category ? currentToc[category].title : "";
      nextNav = { title: nextEntry.title, category, href: nextEntry.href };
    }

    // Parse markdown front matter
    const url = new URL(`../../${entry.file}`, import.meta.url);
    const fileContent = await Deno.readTextFile(url);
    const { body, attrs } = frontMatter<Record<string, unknown>>(fileContent);

    ctx.state.title = `${entry.title ?? "Not Found"} | Fresh docs`;
    ctx.state.description = attrs?.description
      ? String(attrs.description)
      : "Fresh Document";
    ctx.state.ogImage = new URL(asset("/og-image.webp"), ctx.url).href;

    return page({
      page: {
        ...entry,
        markdown: body,
        data: attrs ?? {},
        versionLinks,
        version,
        prevNav,
        nextNav,
      },
    });
  },
});

export default define.page<typeof handler>(function DocsPage(props) {
  /*   console.log(`Headings: ${JSON.stringify(props)}`); */
  const { page } = props.data;
  /* console.log(`frontMatter_attr: ${page.data}`); */
  const { url } = props;
  const publishDate: Date | undefined = page.data.published_at ? new Date(String(page.data.published_at)) : undefined  // ISO formatted date string
 
/*   console.log(`published_at: ${page.data.published_at}`);
  console.log(`publishDate: ${publishDate}`); */

  const { html, headings } = renderMarkdown(page.markdown);

  return (
    <div class="flex flex-col min-h-screen mx-auto md:max-w-[1500px]">
      <Header title="docs" active="/docs" />
      
      <div f-client-nav={true}>
        <Partial name="nav-side">
          <MobileSidebar page={page} url={url.toString()} />
          {/* icon to open menu */}
          <div class="bg-white/75 dark:bg-gray-800/75 flex sticky top-0 xl:hidden mx-2 md:mx-auto max-w-screen-2xl px-0 md:px-4 md:py-0 justify-between lg:hidden">
            <label
              for="docs_sidebar"
              class="px-4 py-3 lg:hidden flex items-center hover:bg-gray-100 dark:hover:bg-gray-800 rounded gap-2 cursor-pointer"
            >
            <svg
              class="h-6 w-6"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h16M4 18h7"
              >
              </path>
            </svg>
            Menu
            </label>
            
              <aside>
                {/* "On this page" section */}
                <TableOfContents headings={headings} />
              </aside>
            
          </div>
          
          <nav class="flex-shrink-0 hidden lg:block lg:px-4 bg-white">
            <div class="fixed top-24 w-[17rem] flex overflow-hidden">
              <div class="flex-1 h-[calc(100vh_-_6rem)] overflow-y-auto pb-8">
                <SearchButton class="mr-4 sm:mr-0" />
                <div class="font-semibold ml-2.5 bg-lightBackground text-lightText dark:bg-darkBackground dark:text-darkText">
                  {CATEGORIES[page.version].map((category) => (
                    /* Table of Content */
                    <SidebarCategory
                      key={category.href}
                      category={category}
                      url={url.toString()}
                    />
                  ))}
                </div>
              </div>
            </div>
          </nav>
        </Partial>
          
        <Partial name="docs-main">
          <div class="w-full min-w-0">
            <main class="lg:ml-[18rem] xl:mt-24 min-w-0 mt-4 mx-2 md:mx-auto">
              <div class="flex gap-6 md:gap-4 xl:gap-[6%] flex-col xl:flex-row-reverse md:mx-8 lg:mx-12 lg:justify-end">
                {/* "On this page" section */}
                <aside class="hidden lg:flex justify-end sticky top-16">
                  <TableOfContents headings={headings} />
                </aside>
                <div class="lg:order-1 mx-auto min-w-0 max-w-3xl w-full bg-lightBackground text-lightText dark:bg-darkBackground dark:text-darkText">
                  <h1 class="text-4xl text-gray-900 tracking-tight font-bold md:mt-0 px-4 md:px-0 mb-4 dark:bg-darkBackground dark:text-darkText">
                    {page.title}
                  </h1>
                  <div
                    class="markdown-body mb-8"
                    dangerouslySetInnerHTML={{ __html: html }}
                  />

                  {publishDate && (<div class="flex justify-end w-full">
                    <span class="mr-2">Created at:</span>
                    <time class="text-gray-500">
                      {publishDate.toLocaleDateString("en-us", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </time>
                  </div>)}
                  <hr class="mt-4" />
                  <div class="mb-8">
                    <ForwardBackButtons
                      slug={page.slug}
                      version={page.version}
                      prev={page.prevNav}
                      next={page.nextNav}
                    />
                  </div>
                  <hr />
                  <div class="px-4 md:px-0 flex justify-between my-6">
                      Placeholder
                    <div class="border-2 border-gray-800 shadow-[0_0_10px_5px_rgba(173,216,230,0.7)] rounded-md p-4">
                      Your content here
                    </div>
                    <div>

                    
                    <div class="mx-auto flex w-full max-w-lg items-center justify-center">
                      <div
                        class="relative z-10 flex w-full cursor-pointer items-center overflow-hidden rounded-xl  border-slate-800 p-[1.5px]"
                      >
                        <div
                          class="animate-rotate absolute inset-0 h-full w-full rounded-full bg-[conic-gradient(#0ea5e9_20deg,transparent_120deg)]"
                        >
                        </div>
                        <div class="relative z-20 flex w-full rounded-[0.60rem] bg-slate-900 p-2">
       
                        </div>
                      </div>
                    </div>
                      

                    </div>
                  </div>
                </div>
              </div>
            </main>
          </div>
        </Partial>
        <Footer />
      </div>
    </div>
  );
});

function MobileSidebar({ page, url }: { page: Page; url: string }) {
  return (
    <div class="lg:hidden">
      <input
        type="checkbox"
        class="hidden toggle"
        id="docs_sidebar"
      />
      <div class="fixed inset-0 z-50 hidden toggled">
        <label
          class="absolute inset-0 bg-gray-600 opacity-75"
          for="docs_sidebar"
        />
        <div class="relative flex-1 flex flex-col w-[18rem] h-full border-r-2 border-gray-100 bg-lightBackground text-lightText dark:bg-darkBackground dark:text-darkText">
          <nav class="pb-16 overflow-x-auto flex-1 h-screen overflow-y-auto pt-4 px-4">
            <SearchButton class="mr-4 sm:mr-0" />
            <div class="font-semibold ml-2.5">
              {CATEGORIES[page.version].map((category) => (
                /* Table of Content */
                <SidebarCategory
                  key={category.href}
                  category={category}
                  url={url.toString()}
                />
              ))}
            </div>
          </nav>
        </div>
      </div>
    </div>
  );
}

function ForwardBackButtons(props: {
  slug: string;
  version: string;
  prev?: NavEntry;
  next?: NavEntry;
}) {
  const { prev, next } = props;

  return (
    <div class="px-4 md:px-0 mt-8 flex flex-col sm:flex-row gap-4 justify-between">
      {prev
        ? (
          <a
            href={prev.href}
            class="px-4 py-2 text-left rounded-lg border border-gray-200 dark:border-gray-500 grid border-solid w-full hover:border-green-600 transition-colors"
          >
            <span class="text-sm text-gray-600 dark:text-gray-400">
              Previous page
            </span>
            <span class="text-indigo-600 dark:text-indigo-300 font-medium">
              {prev.title}
            </span>
          </a>
        )
        : <div class="w-full" />}
      {next
        ? (
          <a
            href={next.href}
            class="px-4 py-2 text-right rounded-lg border-[0.5px] border-gray-200 dark:border-gray-500 border-solid grid w-full hover:border-green-600 transition-colors"
          >
            <span class="text-sm text-gray-600 dark:text-gray-400">
              Next page
            </span>
            <span class="dark:text-green-400 text-green-800 font-medium">
              {next.title}
            </span>
          </a>
        )
        : <div class="w-full" />}
    </div>
  );
}
