/**
 * Dropdown menu surface + item classes.
 *
 * Best practice: no vertical padding on the panel. Padding lives on items so
 * hover/active fills edge-to-edge and clips cleanly under overflow-hidden
 * rounded corners (no gap under the last row).
 */
export const menuPanel =
  'overflow-hidden anim-scale-in rounded-2xl border border-[#edeff4] bg-white p-0 shadow-lg  '

export const menuItem =
  'flex min-h-11 w-full items-center gap-2.5 px-3.5 text-left text-sm font-semibold text-[#303545] transition-colors hover:bg-[#f6f7fb] focus:bg-[#f6f7fb] focus:outline-none   '

export const menuItemDanger =
  'flex min-h-11 w-full items-center gap-2.5 px-3.5 text-left text-sm font-semibold text-[#ff725b] transition-colors hover:bg-[#fff5f3] focus:bg-[#fff5f3] focus:outline-none '

export const menuHeader = 'border-b border-[#edeff4] px-3.5 py-3 '

export const menuListbox =
  'overflow-hidden anim-scale-in rounded-2xl border border-[#edeff4] bg-white p-0 shadow-lg  '

export const menuOption =
  'block w-full min-h-11 px-4 py-3 text-left transition-colors hover:bg-[#f6f7fb] focus:bg-[#f6f7fb] focus:outline-none '
