export type SyncStatus = 'idle' | 'loading' | 'ready' | 'error'

export type AuthFormState = {
  username: string
  password: string
}

export type FilterState = {
  month: string
  year: string
  startDate: string
  endDate: string
  branchId: string
  productId: string
  clientId: string
  category: string
  product: string
  client: string
  branch: string
}

export type LiveSnapshot = Record<string, unknown>
