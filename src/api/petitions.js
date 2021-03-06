import handleEndpoint from './handle-endpoint'

export async function createPetitionEndpoint(data) {
  return handleEndpoint({ method: 'post', url: '/petitions', data })
}

export async function getPetitionsEndpoint(params) {
  return handleEndpoint({ method: 'get', url: '/petitions', params })
}

export async function editPetitionEndpoint(data) {
  return handleEndpoint({
    method: 'put',
    url: `/petitions/${data.id}`,
    data
  })
}
