/** Set cover styles. on-theme with Openlet / Quizlet product palette. */

import type { LucideIcon } from 'lucide-react'
import {
  Layers,
  BookOpen,
  BookMarked,
  GraduationCap,
  Brain,
  Lightbulb,
  Atom,
  Beaker,
  Globe,
  Music,
  Palette,
  Calculator,
  Languages,
  FlaskConical,
  Microscope,
} from 'lucide-react'

/** An icon the user can pick for the set card banner. */
export interface CoverIcon {
  name: string
  icon: LucideIcon
  label: string
}

export const COVER_ICONS: CoverIcon[] = [
  { name: 'layers', icon: Layers, label: 'General' },
  { name: 'book-open', icon: BookOpen, label: 'Reading' },
  { name: 'book-marked', icon: BookMarked, label: 'Textbook' },
  { name: 'graduation-cap', icon: GraduationCap, label: 'Education' },
  { name: 'brain', icon: Brain, label: 'Memory' },
  { name: 'lightbulb', icon: Lightbulb, label: 'Ideas' },
  { name: 'atom', icon: Atom, label: 'Physics' },
  { name: 'beaker', icon: Beaker, label: 'Lab' },
  { name: 'flask-conical', icon: FlaskConical, label: 'Chemistry' },
  { name: 'microscope', icon: Microscope, label: 'Biology' },
  { name: 'globe', icon: Globe, label: 'Geography' },
  { name: 'languages', icon: Languages, label: 'Languages' },
  { name: 'calculator', icon: Calculator, label: 'Math' },
  { name: 'palette', icon: Palette, label: 'Art' },
  { name: 'music', icon: Music, label: 'Music' },
]

export type CoverStyle = {
  id: string
  label: string
  /** CSS background for the title plate */
  plate: string
  /** Title text color on the plate */
  title: string
  /** Swatch shown in the picker (may match plate) */
  swatch: string
}

export const COVER_PRESETS: CoverStyle[] = [
  {
    id: 'default',
    label: 'Brand',
    plate: '#edefff',
    title: '#2a35b8',
    swatch: '#edefff',
  },
  {
    id: 'blue',
    label: 'Blue',
    plate: 'linear-gradient(135deg, #4255ff 0%, #6b7cff 100%)',
    title: '#ffffff',
    swatch: '#4255ff',
  },
  {
    id: 'sky',
    label: 'Sky',
    plate: 'linear-gradient(135deg, #e8f4ff 0%, #cfe6ff 100%)',
    title: '#1a4a7a',
    swatch: '#cfe6ff',
  },
  {
    id: 'mint',
    label: 'Mint',
    plate: 'linear-gradient(135deg, #e6f7f0 0%, #c8efdc 100%)',
    title: '#0d5c3d',
    swatch: '#c8efdc',
  },
  {
    id: 'amber',
    label: 'Amber',
    plate: 'linear-gradient(135deg, #fff7e8 0%, #ffe8b8 100%)',
    title: '#7a4a00',
    swatch: '#ffe8b8',
  },
  {
    id: 'rose',
    label: 'Rose',
    plate: 'linear-gradient(135deg, #fff0f5 0%, #ffd6e5 100%)',
    title: '#8a2458',
    swatch: '#ffd6e5',
  },
  {
    id: 'lavender',
    label: 'Lavender',
    plate: 'linear-gradient(135deg, #f3f0ff 0%, #ddd4ff 100%)',
    title: '#4c2a8a',
    swatch: '#ddd4ff',
  },
  {
    id: 'slate',
    label: 'Slate',
    plate: 'linear-gradient(135deg, #f0f1f5 0%, #e2e5ee 100%)',
    title: '#303545',
    swatch: '#e2e5ee',
  },
  {
    id: 'night',
    label: 'Night',
    plate: 'linear-gradient(135deg, #1a1a3e 0%, #2a2d5c 100%)',
    title: '#e8eaff',
    swatch: '#2a2d5c',
  },
]

const SOLID_RE = /^solid:(#[0-9a-fA-F]{6})$/

export function isSolidCover(cover: string | null | undefined): cover is `solid:#${string}` {
  return !!cover && SOLID_RE.test(cover)
}

export function solidHex(cover: string): string | null {
  const m = cover?.match(SOLID_RE)
  return m ? m[1].toLowerCase() : null
}

/** Readable ink on a solid hex (simple luminance). */
export function inkOnSolid(hex: string): string {
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0, 2), 16) / 255
  const g = parseInt(h.slice(2, 4), 16) / 255
  const b = parseInt(h.slice(4, 6), 16) / 255
  const l = 0.2126 * r + 0.7152 * g + 0.0722 * b
  return l > 0.62 ? '#303545' : '#ffffff'
}

/** Parse `cover|icon` format (backward-compatible with plain cover strings). */
export function splitCoverCover(combined: string | null | undefined): {
  cover: string
  icon: string
} {
  const raw = combined ?? 'default'
  const pipe = raw.indexOf('|')
  if (pipe === -1) return { cover: raw, icon: 'layers' }
  return { cover: raw.slice(0, pipe), icon: raw.slice(pipe + 1) || 'layers' }
}

export function joinCoverIcon(cover: string, icon: string): string {
  return `${cover}|${icon}`
}

export function resolveCover(cover: string | null | undefined): {
  plate: string
  title: string
  id: string
} {
  const { cover: value } = splitCoverCover(cover)
  const hex = solidHex(value)
  if (hex) {
    return { id: value, plate: hex, title: inkOnSolid(hex) }
  }
  const preset = COVER_PRESETS.find((p) => p.id === value) ?? COVER_PRESETS[0]
  return { id: preset.id, plate: preset.plate, title: preset.title }
}

export function encodeSolidCover(hex: string): string {
  const clean = hex.startsWith('#') ? hex : `#${hex}`
  return `solid:${clean.toLowerCase()}`
}
