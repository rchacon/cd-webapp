const CD_SERVER_URL = import.meta.env.VITE_CD_SERVER_URL ?? 'http://localhost:8000/graphql'

export class CdServerError extends Error {}

interface GraphQLResponse<T> {
  data?: T
  errors?: Array<{ message: string }>
}

async function graphqlRequest<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  let response: Response
  try {
    response = await fetch(CD_SERVER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables }),
    })
  } catch {
    // fetch() rejects identically for network failures and CORS-blocked
    // requests -- a CORS failure never produces a Response to inspect.
    throw new CdServerError('Could not reach the lookup service. Please try again later.')
  }

  let payload: GraphQLResponse<T>
  try {
    payload = (await response.json()) as GraphQLResponse<T>
  } catch {
    throw new CdServerError(`Unexpected response from lookup service (status ${response.status}).`)
  }

  // Resolvers don't uniformly catch their own service-layer exceptions
  // (e.g. a failing upstream cd-api call, or GeocoderError) -- don't assume
  // either a clean non-2xx or a clean GraphQL `errors` shape, check both.
  if (payload.errors?.length) {
    throw new CdServerError(payload.errors[0]?.message ?? 'Lookup service returned an error.')
  }
  if (!response.ok || !payload.data) {
    throw new CdServerError(`Lookup service returned an error (status ${response.status}).`)
  }
  return payload.data
}

export interface Member {
  bioguideId: string
  firstName: string | null
  middleName: string | null
  lastName: string | null
  nickname: string | null
  suffix: string | null
  party: string | null
  phone: string | null
  website: string | null
  photoUrl: string | null
}
export interface Representative extends Member {
  role: string
  district: number | null
}
export type Senator = Member

export interface StateOption {
  abbr: string
  name: string
  seats: number
  votingSeats: boolean
}
export interface DistrictLookup {
  state: string
  district: number
}

const GET_STATES_QUERY = `
  query GetStates {
    getStates { abbr name seats votingSeats }
  }
`
const GET_DISTRICT_QUERY = `
  query GetDistrict($address: String!) {
    getDistrict(address: $address) { state district }
  }
`
const GET_REPRESENTATIVES_QUERY = `
  query GetRepresentatives($state: String!, $district: Int!) {
    getRepresentatives(state: $state, district: $district) {
      bioguideId firstName middleName lastName nickname suffix role district party phone website photoUrl
    }
  }
`
const GET_SENATORS_QUERY = `
  query GetSenators($state: String!) {
    getSenators(state: $state) {
      bioguideId firstName middleName lastName nickname suffix party phone website photoUrl
    }
  }
`

export async function getStates(): Promise<StateOption[]> {
  const data = await graphqlRequest<{ getStates: StateOption[] }>(GET_STATES_QUERY, {})
  return data.getStates
}

export async function getDistrict(address: string): Promise<DistrictLookup> {
  const data = await graphqlRequest<{ getDistrict: DistrictLookup }>(GET_DISTRICT_QUERY, { address })
  return data.getDistrict
}

export async function getRepresentatives(state: string, district: number): Promise<Representative[]> {
  const data = await graphqlRequest<{ getRepresentatives: Representative[] }>(
    GET_REPRESENTATIVES_QUERY,
    { state, district },
  )
  return data.getRepresentatives
}

export async function getSenators(state: string): Promise<Senator[]> {
  const data = await graphqlRequest<{ getSenators: Senator[] }>(GET_SENATORS_QUERY, { state })
  return data.getSenators
}
