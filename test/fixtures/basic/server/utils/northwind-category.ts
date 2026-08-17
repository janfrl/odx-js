interface NorthwindCategoryState {
  name: string
  version: number
}

const initialState: Readonly<NorthwindCategoryState> = {
  name: 'Beverages',
  version: 1,
}

const state: NorthwindCategoryState = { ...initialState }

export function getNorthwindCategory(): Readonly<NorthwindCategoryState> {
  return state
}

export function getNorthwindCategoryEtag(): string {
  return `W/"northwind-category-${state.version}"`
}

export function updateNorthwindCategory(name: string): void {
  state.name = name
  state.version += 1
}

export function resetNorthwindCategory(): void {
  Object.assign(state, initialState)
}
