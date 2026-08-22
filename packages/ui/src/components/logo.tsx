import { type ComponentProps } from "solid-js"

export const Mark = (props: { class?: string }) => {
  return (
    <svg
      data-component="logo-mark"
      classList={{ [props.class ?? ""]: !!props.class }}
      viewBox="0 0 16 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path data-slot="logo-logo-mark-shadow" d="M12 16H4V8H12V16Z" fill="var(--icon-weak-base)" />
      <path data-slot="logo-logo-mark-o" d="M12 4H4V16H12V4ZM16 20H0V0H16V20Z" fill="var(--icon-strong-base)" />
    </svg>
  )
}

export const Splash = (props: Pick<ComponentProps<"svg">, "ref" | "class">) => {
  return (
    <svg
      ref={props.ref}
      data-component="logo-splash"
      classList={{ [props.class ?? ""]: !!props.class }}
      viewBox="0 0 80 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M60 80H20V40H60V80Z" fill="var(--icon-base)" />
      <path d="M60 20H20V80H60V20ZM80 100H0V0H80V100Z" fill="var(--icon-strong-base)" />
    </svg>
  )
}

/**
 * Wordmark: "alphacode" in the same 4x7 pixel font as before - 6px cells, 9
 * glyphs at a 30px pitch (viewBox 264 = 8*30 + 24). o/p/e/c/d keep their
 * original letterforms; a, l and h are new and match the terminal font in
 * packages/tui/src/logo.ts.
 *
 * Three layers, as before: a shadow across the whole word, then the ink split
 * so "alpha" renders dimmer than "code".
 */
export const Logo = (props: { class?: string }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 264 42"
      fill="none"
      classList={{ [props.class ?? ""]: !!props.class }}
    >
      <g>
        <path d="M66 18H78V24H66ZM96 18H108V24H96ZM156 18H174V24H156ZM186 18H198V24H186ZM216 18H228V24H216ZM6 24H18V30H6ZM66 24H78V30H66ZM96 24H108V30H96ZM126 24H138V30H126ZM156 24H174V30H156ZM186 24H198V30H186ZM216 24H228V30H216ZM246 24H264V30H246ZM96 30H108V36H96Z" fill="var(--icon-weak-base)" />
        <path d="M30 0H36V6H30ZM90 0H96V6H90ZM0 6H24V12H0ZM30 6H36V12H30ZM60 6H84V12H60ZM90 6H108V12H90ZM120 6H144V12H120ZM0 12H6V18H0ZM18 12H24V18H18ZM30 12H36V18H30ZM60 12H66V18H60ZM78 12H84V18H78ZM90 12H96V18H90ZM108 12H114V18H108ZM120 12H126V18H120ZM138 12H144V18H138ZM0 18H24V24H0ZM30 18H36V24H30ZM60 18H66V24H60ZM78 18H84V24H78ZM90 18H96V24H90ZM108 18H114V24H108ZM120 18H144V24H120ZM0 24H6V30H0ZM18 24H24V30H18ZM30 24H36V30H30ZM60 24H66V30H60ZM78 24H84V30H78ZM90 24H96V30H90ZM108 24H114V30H108ZM120 24H126V30H120ZM138 24H144V30H138ZM0 30H24V36H0ZM30 30H36V36H30ZM60 30H84V36H60ZM90 30H96V36H90ZM108 30H114V36H108ZM120 30H144V36H120ZM60 36H66V42H60Z" fill="var(--icon-base)" />
        <path d="M228 0H234V6H228ZM150 6H174V12H150ZM180 6H204V12H180ZM210 6H234V12H210ZM240 6H264V12H240ZM150 12H156V18H150ZM180 12H186V18H180ZM198 12H204V18H198ZM210 12H216V18H210ZM228 12H234V18H228ZM240 12H246V18H240ZM258 12H264V18H258ZM150 18H156V24H150ZM180 18H186V24H180ZM198 18H204V24H198ZM210 18H216V24H210ZM228 18H234V24H228ZM240 18H264V24H240ZM150 24H156V30H150ZM180 24H186V30H180ZM198 24H204V30H198ZM210 24H216V30H210ZM228 24H234V30H228ZM240 24H246V30H240ZM150 30H174V36H150ZM180 30H204V36H180ZM210 30H234V36H210ZM240 30H264V36H240Z" fill="var(--icon-strong-base)" />
      </g>
    </svg>
  )
}
