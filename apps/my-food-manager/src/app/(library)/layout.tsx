import { RecipeLibrary } from "@/components/recipes/RecipeLibrary";

/**
 * The list lives in the layout so it stays mounted (and scrolled) while a recipe detail is open over it.
 * The detail is a client overlay driven by the address; the pages below exist only so every address resolves.
 */
export default function LibraryLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <RecipeLibrary />
      {children}
    </>
  );
}
