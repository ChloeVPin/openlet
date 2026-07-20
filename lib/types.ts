export interface Card {
  id: string
  term: string
  definition: string
  position: number
}

export interface CardInput {
  term: string
  definition: string
}

export interface StudySet {
  id: string
  title: string
  description: string
  subject: string
  userId: string
}

export interface StudySetWithCards extends StudySet {
  cards: Card[]
}

export interface Folder {
  id: string
  name: string
  description: string
  userId: string
  visibility: 'private' | 'public'
}

export interface FolderWithSets extends Folder {
  sets: StudySet[]
}

export interface Class {
  id: string
  name: string
  description: string
  school: string
  userId: string
  visibility: 'private' | 'public'
}

export interface ClassWithSets extends Class {
  sets: StudySet[]
}

export interface StudySession {
  id: string
  setId: string
  userId: string
  mode: string
  score: number
  totalCards: number
  correctCards: number
  createdAt: string
}

export interface FSRSCardMetadata {
  stability: number
  difficulty: number
  elapsedDays: number
  scheduledDays: number
  reps: number
  lapses: number
  lastReview: string | null
}

export interface CardWithMetadata extends Card {
  metadata: FSRSCardMetadata
}

export interface Question {
  cardId: string
  term: string
  answer: string
  type: 'written' | 'multiple'
  options?: string[]
}

export interface ApiResponse<T> {
  data?: T
  error?: string
}

export interface SearchResult {
  id: string
  title: string
  description: string | null
  subject: string | null
}
